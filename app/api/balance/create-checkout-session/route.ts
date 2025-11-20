import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer found. Please complete trial activation first.' },
        { status: 400 }
      );
    }

    // Get the origin from the request headers
    const origin = req.headers.get('origin') || req.headers.get('referer') || 'http://localhost:3000';
    
    // Desktop goes to /balance, Mobile goes to /billing (combined page)
    const successUrl = `${origin}/dashboard/settings/balance?balance_success=true&return_url=/dashboard/settings/billing`;
    const cancelUrl = `${origin}/dashboard/settings/billing`;

    console.log('💳 Creating checkout session for call balance refill');
    console.log('   Customer ID:', profile.stripe_customer_id);
    console.log('   Price ID:', process.env.STRIPE_CALL_BALANCE_PRICE_ID);
    console.log('   Success URL:', successUrl);

    // Create Stripe Checkout session for call balance refill
    const session = await stripe.checkout.sessions.create({
      customer: profile.stripe_customer_id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_CALL_BALANCE_PRICE_ID!, // $25 call balance refill
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Use saved payment methods
      payment_intent_data: {
        setup_future_usage: 'off_session', // Allows using the saved card for future payments
      },
      // Allow Stripe to auto-update customer info
      customer_update: {
        address: 'auto',
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: user.id,
        type: 'balance_refill',
        amount: '25',
      },
    });

    console.log('✅ Checkout session created:', session.id);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('❌ Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

