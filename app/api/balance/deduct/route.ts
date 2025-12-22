import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover' as any,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { callId, durationMinutes, userId: providedUserId } = body;

    if (!callId || !durationMinutes) {
      return NextResponse.json(
        { error: 'Missing callId or durationMinutes' },
        { status: 400 }
      );
    }

    // If userId is provided, use service role client (internal call from N8N)
    // Otherwise use regular client with auth check (manual test)
    let userId: string;
    let supabase;

    if (providedUserId) {
      // Internal call - use service role to bypass RLS
      supabase = createServiceRoleClient();
      userId = providedUserId;
      console.log(`💰 [Internal] Deducting balance for user ${userId}`);
    } else {
      // External/test call - check authentication
      supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = user.id;
      console.log(`💰 [Authenticated] Deducting balance for user ${userId}`);
    }

    console.log(`💰 Processing call ${callId}: ${durationMinutes} minutes`);

    // Get user's cost per minute from profile
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('cost_per_minute')
      .eq('user_id', userId)
      .single();
    
    const costPerMinute = userProfile?.cost_per_minute || 0.40; // Default to $0.40 if not set
    console.log(`💰 User's cost per minute: $${costPerMinute}`);

    // Calculate cost using user's specific rate
    const cost = durationMinutes * costPerMinute;

    // Get current balance
    const { data: balanceData, error: balanceError } = await supabase
      .from('call_balance')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (balanceError) {
      console.error('❌ Error fetching balance:', balanceError);
      return NextResponse.json(
        { error: 'Failed to fetch balance' },
        { status: 500 }
      );
    }

    const currentBalance = balanceData.balance;
    const newBalance = currentBalance - cost;

    console.log(`📊 Current balance: $${currentBalance}, Cost: $${cost}, New balance: $${newBalance}`);

    // Update balance
    const { error: updateError } = await supabase
      .from('call_balance')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('❌ Error updating balance:', updateError);
      return NextResponse.json(
        { error: 'Failed to update balance' },
        { status: 500 }
      );
    }

    // Record transaction
    const { error: transactionError } = await supabase
      .from('balance_transactions')
      .insert({
        user_id: userId,
        amount: -cost,
        type: 'deduction',
        description: `Call charge: ${durationMinutes} minutes`,
        balance_after: newBalance,
      });

    if (transactionError) {
      console.error('❌ Error recording transaction:', transactionError);
    }

    // Check if auto-refill should be triggered
    if (balanceData.auto_refill_enabled && newBalance < 1) {
      console.log('🔄 Balance below $1, triggering auto-refill...');
      
      // Get user profile for Stripe customer ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id, full_name')
        .eq('user_id', userId)
        .single();

      if (!profile?.stripe_customer_id) {
        console.error('❌ No Stripe customer ID found');
        return NextResponse.json({
          success: true,
          balance: newBalance,
          autoRefillError: 'No payment method on file',
        });
      }

      try {
        // Fixed auto-refill amount: $25
        const refillAmount = 25;
        
        console.log(`💳 Creating auto-refill charge for $${refillAmount}...`);

        // First, get the customer's payment methods
        const customer = await stripe.customers.retrieve(profile.stripe_customer_id);
        
        if (!customer || customer.deleted) {
          throw new Error('Customer not found');
        }

        // Get default payment method or invoice settings default
        let paymentMethodId = null;
        
        if ('invoice_settings' in customer && customer.invoice_settings?.default_payment_method) {
          paymentMethodId = typeof customer.invoice_settings.default_payment_method === 'string' 
            ? customer.invoice_settings.default_payment_method 
            : customer.invoice_settings.default_payment_method.id;
        }

        // If no default payment method, get the first available one
        if (!paymentMethodId) {
          console.log('🔍 No default payment method, fetching available payment methods...');
          const paymentMethods = await stripe.paymentMethods.list({
            customer: profile.stripe_customer_id,
            type: 'card',
          });

          if (paymentMethods.data.length === 0) {
            throw new Error('No payment method found. Please add a payment method in billing settings.');
          }

          paymentMethodId = paymentMethods.data[0].id;
          console.log(`✅ Found payment method: ${paymentMethodId}`);
        }

        // Create a payment intent for $25 auto-refill
        const paymentIntent = await stripe.paymentIntents.create({
          amount: 2500, // $25.00 in cents
          currency: 'usd',
          customer: profile.stripe_customer_id,
          payment_method: paymentMethodId,
          description: 'Auto-refill: Call Balance $25',
          metadata: {
            type: 'auto_refill',
            user_id: userId,
            amount: '25', // Always $25
          },
          off_session: true, // Charge without user present
          confirm: true, // Automatically confirm
        });

        console.log('✅ Auto-refill payment created:', paymentIntent.id);

        // Update balance with refill
        const refillBalance = newBalance + refillAmount;
        
        const { error: refillUpdateError } = await supabase
          .from('call_balance')
          .update({ 
            balance: refillBalance,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (refillUpdateError) {
          console.error('❌ Error updating refill balance:', refillUpdateError);
        }

        // Record refill transaction
        await supabase
          .from('balance_transactions')
          .insert({
            user_id: userId,
            amount: refillAmount,
            type: 'auto_refill',
            description: `Auto-refill: $${refillAmount}`,
            stripe_payment_intent_id: paymentIntent.id,
            balance_after: refillBalance,
          });

        console.log(`✅ Auto-refill complete. New balance: $${refillBalance}`);

        return NextResponse.json({
          success: true,
          balance: refillBalance,
          callCost: cost,
          autoRefilled: true,
          refillAmount: refillAmount,
        });
      } catch (autoRefillError: any) {
        console.error('❌ Auto-refill failed:', autoRefillError.message);
        
        return NextResponse.json({
          success: true,
          balance: newBalance,
          callCost: cost,
          autoRefillError: autoRefillError.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      balance: newBalance,
      callCost: cost,
      autoRefilled: false,
    });
  } catch (error: any) {
    console.error('❌ Balance deduction error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

