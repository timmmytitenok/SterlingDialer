import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia' as any,
});

export async function POST(req: Request) {
  try {
    const { amount, isFirstRefill } = await req.json();

    if (!amount || ![25, 50, 100, 200].includes(amount)) {
      return NextResponse.json({ error: 'Invalid amount. Must be 25, 50, 100, or 200' }, { status: 400 });
    }

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

    // Calculate estimated minutes
    const estimatedMinutes = Math.floor(amount / costPerMinute);

    // Create Stripe checkout session for balance refill
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: isFirstRefill ? `Add Card & First Refill` : `Call Balance Top-Up`,
              description: isFirstRefill 
                ? `Add $${amount} to your balance + save card for auto-refill (≈${estimatedMinutes} minutes at $${costPerMinute}/min)`
                : `Add $${amount} to your call balance (≈${estimatedMinutes} minutes at $${costPerMinute}/min)`,
            },
            unit_amount: amount * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      payment_intent_data: {
        setup_future_usage: 'off_session', // Save payment method for future use
      },
      success_url: `${req.headers.get('origin')}/dashboard/settings/call-balance?balance_success=true&amount=${amount}`,
      cancel_url: `${req.headers.get('origin')}/dashboard/settings/call-balance?balance_canceled=true`,
      metadata: {
        user_id: user.id,
        type: 'balance_refill',
        amount: amount.toString(),
        is_first_refill: isFirstRefill ? 'true' : 'false',
        auto_refill_amount: isFirstRefill ? amount.toString() : '',
      },
    });

    return NextResponse.json({ success: true, sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Balance refill error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

