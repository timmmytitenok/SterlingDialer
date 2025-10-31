import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia' as any,
});

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'No session ID provided' }, { status: 400 });
    }

    console.log('🔍 Verifying Stripe session:', sessionId);

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    console.log('📦 Session retrieved:', {
      id: session.id,
      status: session.payment_status,
      mode: session.mode,
      customer: session.customer,
    });

    // Verify payment was successful
    if (session.payment_status !== 'paid') {
      console.warn('⚠️ Payment not completed:', session.payment_status);
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    // Get the Supabase user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('❌ No user found:', userError);
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id);

    // Get subscription details
    if (session.mode === 'subscription' && session.subscription) {
      const subscription = typeof session.subscription === 'string'
        ? await stripe.subscriptions.retrieve(session.subscription)
        : session.subscription;

      const customerId = typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id;

      const priceId = subscription.items.data[0]?.price.id;

      console.log('💳 Subscription details:', {
        subscriptionId: subscription.id,
        customerId,
        priceId,
        status: subscription.status,
      });

      // Determine tier
      let tier: 'starter' | 'pro' | 'elite' = 'starter';
      if (priceId === process.env.STRIPE_PRICE_ID_STARTER) {
        tier = 'starter';
      } else if (priceId === process.env.STRIPE_PRICE_ID_PRO) {
        tier = 'pro';
      } else if (priceId === process.env.STRIPE_PRICE_ID_ELITE) {
        tier = 'elite';
      }

      console.log('🎯 Tier:', tier);

      // 🚨 IMMEDIATELY create subscription record (don't wait for webhook!)
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          stripe_price_id: subscription.items.data[0]?.price.id,
          subscription_tier: tier,
          status: subscription.status,
          plan_name: `Sterling AI - ${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`,
          amount: subscription.items.data[0]?.price.unit_amount ? subscription.items.data[0].price.unit_amount / 100 : 0,
          currency: subscription.currency,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        }, {
          onConflict: 'stripe_subscription_id'
        });

      if (subError) {
        console.error('❌ Error creating subscription:', subError);
      } else {
        console.log('✅ Subscription record created immediately!');
      }

      // Also update profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_tier: tier,
          stripe_customer_id: customerId,
          subscription_status: subscription.status,
          has_active_subscription: true,
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('❌ Error updating profile:', updateError);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
      }

      console.log('✅ Profile updated immediately with subscription info!');
      console.log('🎉 User can now access dashboard INSTANTLY!');

      return NextResponse.json({
        success: true,
        tier,
        customerId,
        message: 'Payment verified and profile updated',
      });
    }

    return NextResponse.json({ error: 'Invalid session type' }, { status: 400 });
  } catch (error: any) {
    console.error('❌ Error verifying session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

