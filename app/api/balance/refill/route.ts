import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia' as any,
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

    // Determine which price ID to use based on Stripe API key (not NODE_ENV)
    const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_');
    const priceId = isTestMode
      ? process.env.STRIPE_PRICE_ID_BALANCE_REFILL_TEST // Test: price_1SSrtS060cz3QrqoF1VRvC1s
      : process.env.STRIPE_PRICE_ID_BALANCE_REFILL; // Live: price_1SSrrT060cz3Qrqo3KP5c7LG
    
    console.log('💳 Stripe Mode:', isTestMode ? 'TEST' : 'LIVE');
    console.log('💳 Using Price ID:', priceId ? `${priceId.substring(0, 15)}...` : 'NOT SET');
    
    if (!priceId) {
      console.error('❌ Missing STRIPE_PRICE_ID_BALANCE_REFILL in environment!');
      return NextResponse.json({ 
        error: 'Balance refill not configured. Add STRIPE_PRICE_ID_BALANCE_REFILL to .env.local' 
      }, { status: 500 });
    }

    // Calculate estimated minutes for display
    const estimatedMinutes = Math.floor(refillAmount / costPerMinute);

    // Create Stripe checkout session using your $25 product
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId, // Use your fixed $25 product price!
          quantity: 1,
        },
      ],
      mode: 'payment',
      payment_intent_data: {
        setup_future_usage: 'off_session', // Save card for auto-refill
      },
      success_url: `${req.headers.get('origin')}/dashboard/settings/call-balance?balance_success=true&amount=25`,
      cancel_url: `${req.headers.get('origin')}/dashboard/settings/call-balance?balance_canceled=true`,
      metadata: {
        user_id: user.id,
        type: 'balance_refill',
        amount: '25', // Always $25
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

