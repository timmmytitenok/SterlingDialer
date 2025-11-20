import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia' as any,
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Checking auto-refill for user:', user.id);

    // Get user's balance and auto-refill settings
    const { data: callBalance } = await supabase
      .from('call_balance')
      .select('balance, auto_refill_enabled, auto_refill_amount')
      .eq('user_id', user.id)
      .single();

    if (!callBalance) {
      return NextResponse.json({ error: 'Call balance not found' }, { status: 404 });
    }

    console.log('💰 Current balance:', callBalance.balance);
    console.log('⚙️ Auto-refill settings:', {
      enabled: callBalance.auto_refill_enabled,
      amount: callBalance.auto_refill_amount
    });

    // Check if auto-refill is needed
    if (!callBalance.auto_refill_enabled || callBalance.balance >= 10) {
      console.log('⏭️ Auto-refill not needed');
      return NextResponse.json({ 
        success: true, 
        message: 'Auto-refill not needed',
        triggered: false
      });
    }

    // Get user's Stripe customer ID and payment method
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ 
        error: 'No Stripe customer found' 
      }, { status: 400 });
    }

    // Get the default payment method
    const customer = await stripe.customers.retrieve(profile.stripe_customer_id) as Stripe.Customer;
    
    if (!customer.invoice_settings?.default_payment_method) {
      return NextResponse.json({ 
        error: 'No default payment method found' 
      }, { status: 400 });
    }

    console.log('💳 Creating payment intent for auto-refill...');

    // Create a payment intent for the refill amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(callBalance.auto_refill_amount * 100), // Convert to cents
      currency: 'usd',
      customer: profile.stripe_customer_id,
      payment_method: customer.invoice_settings.default_payment_method as string,
      off_session: true,
      confirm: true,
      description: `Auto-refill: $${callBalance.auto_refill_amount} call balance`,
      metadata: {
        user_id: user.id,
        type: 'balance_refill',
        amount: callBalance.auto_refill_amount.toString(),
      },
    });

    if (paymentIntent.status === 'succeeded') {
      console.log('✅ Payment succeeded, updating balance...');

      // Update the balance
      const newBalance = callBalance.balance + callBalance.auto_refill_amount;
      
      await supabase
        .from('call_balance')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      // Record the transaction
      const { error: insertError } = await supabase
        .from('balance_transactions')
        .insert({
          user_id: user.id,
          amount: callBalance.auto_refill_amount,
          type: 'auto_refill',
          description: `Auto-refill: $${callBalance.auto_refill_amount}`,
          stripe_payment_intent_id: paymentIntent.id,
          balance_after: newBalance,
        });

      if (insertError) {
        console.error('❌ Failed to log auto-refill transaction:', insertError);
      } else {
        console.log('✅ Auto-refill transaction logged:', paymentIntent.id);
      }

      console.log('✅ Auto-refill completed successfully');

      return NextResponse.json({
        success: true,
        message: 'Auto-refill completed',
        triggered: true,
        newBalance,
        amount: callBalance.auto_refill_amount
      });
    } else {
      console.error('❌ Payment failed:', paymentIntent.status);
      return NextResponse.json({
        error: 'Payment failed',
        status: paymentIntent.status
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('❌ Auto-refill check error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to process auto-refill' 
    }, { status: 500 });
  }
}

