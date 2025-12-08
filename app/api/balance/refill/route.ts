import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover' as any,
});

export async function POST(req: Request) {
  try {
    const { amount, isFirstRefill } = await req.json();

    // Fixed refill amount: $25
    const refillAmount = 25;
    
    console.log('💰 Balance refill requested:', { amount, isFirstRefill, fixedAmount: refillAmount });

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, cost_per_minute')
      .eq('user_id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;
    const costPerMinute = profile?.cost_per_minute || 0.30;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id);
    }

    // Check if customer has a saved payment method
    const customer = await stripe.customers.retrieve(customerId);
    const defaultPaymentMethodId = customer.deleted ? null : customer.invoice_settings?.default_payment_method;

    console.log('🔍 Customer check:', {
      customerId,
      deleted: customer.deleted,
      hasDefaultPM: !!defaultPaymentMethodId,
      defaultPMId: defaultPaymentMethodId || 'NONE'
    });

    // If they have a saved card, charge it directly!
    if (defaultPaymentMethodId && typeof defaultPaymentMethodId === 'string') {
      console.log('💳 Found saved payment method, charging directly...', defaultPaymentMethodId);
      
      try {
        // Charge the saved card directly
        const paymentIntent = await stripe.paymentIntents.create({
          amount: refillAmount * 100, // $25 = 2500 cents
          currency: 'usd',
          customer: customerId,
          payment_method: defaultPaymentMethodId,
          off_session: true,
          confirm: true,
          description: 'Call Balance Refill - $25',
          metadata: {
            user_id: user.id,
            type: 'balance_refill',
            amount: '25',
            is_first_refill: isFirstRefill ? 'true' : 'false',
          },
        });

        console.log('✅ Payment successful:', paymentIntent.id);

        // Update balance immediately
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('call_balance')
          .eq('user_id', user.id)
          .single();

        const newBalance = (currentProfile?.call_balance || 0) + refillAmount;
        
        await supabase
          .from('profiles')
          .update({ 
            call_balance: newBalance,
            auto_refill_enabled: true, // Enable auto-refill on first payment
            auto_refill_amount: 25,
            onboarding_step_2_balance: true, // Mark step 2 complete
          })
          .eq('user_id', user.id);

        console.log(`✅ Balance updated: $${newBalance.toFixed(2)}`);
        console.log('✅ Onboarding Step 2 (Balance) marked complete - user added funds via direct charge');

        // Log transaction for revenue tracking
        console.log('💾 Logging transaction...');
        const { data: insertData, error: insertError } = await supabase
          .from('balance_transactions')
          .insert({
            user_id: user.id,
            amount: refillAmount,
            type: isFirstRefill ? 'first_refill' : 'credit',
            description: isFirstRefill ? `First refill: $${refillAmount}` : `Refill: $${refillAmount}`,
            stripe_payment_intent_id: paymentIntent.id,
            balance_after: newBalance,
          })
          .select();

        if (insertError) {
          console.error('❌ Transaction insert failed:', insertError);
        } else {
          console.log('✅ Transaction logged:', insertData);
        }

        // Check if all onboarding steps are now complete
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_step_1_form, onboarding_step_2_balance, onboarding_step_3_sheet, onboarding_step_4_schedule')
          .eq('user_id', user.id)
          .single();

        const allComplete = profile?.onboarding_step_1_form &&
                            profile?.onboarding_step_2_balance &&
                            profile?.onboarding_step_3_sheet &&
                            profile?.onboarding_step_4_schedule;

        if (allComplete) {
          console.log('🎉 All onboarding steps complete! Hiding Quick Setup forever.');
          
          await supabase
            .from('profiles')
            .update({
              onboarding_all_complete: true,
              onboarding_completed_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);
        }

        // Return success with redirect flag
        return NextResponse.json({ 
          success: true, 
          charged: true,
          amount: refillAmount,
          newBalance,
          paymentIntentId: paymentIntent.id
        });
      } catch (error: any) {
        console.error('❌ Direct charge failed:', error.message);
        // If direct charge fails, fall back to checkout
        console.log('⚠️ Falling back to checkout...');
      }
    }

    // NO SAVED CARD or direct charge failed - Show checkout
    console.log('💳 No saved payment method, creating checkout session...');
    
    const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_');
    const priceId = isTestMode
      ? process.env.STRIPE_PRICE_ID_BALANCE_REFILL_TEST
      : process.env.STRIPE_PRICE_ID_BALANCE_REFILL;
    
    console.log('💳 Stripe Mode:', isTestMode ? 'TEST' : 'LIVE');
    console.log('💳 Using Price ID:', priceId ? `${priceId.substring(0, 15)}...` : 'NOT SET');
    
    if (!priceId) {
      console.error('❌ Missing STRIPE_PRICE_ID_BALANCE_REFILL in environment!');
      return NextResponse.json({ 
        error: 'Balance refill not configured. Add STRIPE_PRICE_ID_BALANCE_REFILL to .env.local' 
      }, { status: 500 });
    }

    // Get the base URL safely
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const balancePageUrl = `${origin}/dashboard/settings/balance`;
    
    console.log('🔗 Redirect URLs:', {
      success: `${balancePageUrl}?balance_success=true&amount=25`,
      cancel: balancePageUrl
    });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      payment_intent_data: {
        setup_future_usage: 'off_session',
      },
      success_url: `${balancePageUrl}?balance_success=true&amount=25`,
      cancel_url: balancePageUrl, // Just go back to balance page, no error params
      metadata: {
        user_id: user.id,
        type: 'balance_refill',
        amount: '25',
        is_first_refill: isFirstRefill ? 'true' : 'false',
      },
    });
    
    console.log('✅ Checkout session created:', session.id);

    return NextResponse.json({ success: true, sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Balance refill error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

