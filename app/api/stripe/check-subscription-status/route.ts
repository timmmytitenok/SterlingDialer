import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

export async function GET() {
  try {
    const supabase = await createClient();

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

    console.log('🔍 CHECK SUBSCRIPTION API - User ID:', user.id);
    console.log('🔍 CHECK SUBSCRIPTION API - Stripe Customer ID:', profile?.stripe_customer_id);

    if (!profile?.stripe_customer_id) {
      console.log('❌ No Stripe customer ID found!');
      return NextResponse.json({ 
        cancelAtPeriodEnd: false,
        subscriptionStatus: null 
      });
    }

    // Get active subscriptions from Stripe directly
    console.log('📞 Calling Stripe API to list subscriptions...');
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'all',
      limit: 10, // Get more to see all subscriptions
    });

    console.log('📋 Stripe returned', subscriptions.data.length, 'subscriptions');
    
    if (subscriptions.data.length === 0) {
      console.log('❌ No subscriptions found in Stripe!');
      return NextResponse.json({ 
        cancelAtPeriodEnd: false,
        subscriptionStatus: null 
      });
    }

    // Log ALL subscriptions WITH ALL CANCEL FIELDS
    subscriptions.data.forEach((sub, index) => {
      console.log(`📦 Subscription ${index + 1}:`, {
        id: sub.id,
        status: sub.status,
        cancel_at_period_end: sub.cancel_at_period_end,
        cancel_at: sub.cancel_at,
        canceled_at: sub.canceled_at,
        trial_end: sub.trial_end,
        created: new Date(sub.created * 1000).toISOString(),
      });
    });

    // Instead of using list, let's DIRECTLY RETRIEVE the subscription for latest data
    const latestSub = await stripe.subscriptions.retrieve(subscriptions.data[0].id);
    
    console.log('🔥 RETRIEVED SUBSCRIPTION DIRECTLY (LATEST DATA):', {
      id: latestSub.id,
      status: latestSub.status,
      cancel_at_period_end: latestSub.cancel_at_period_end,
      cancel_at: latestSub.cancel_at,
      canceled_at: latestSub.canceled_at,
      trial_end: latestSub.trial_end
    });

    // Check BOTH cancel_at_period_end AND cancel_at fields
    const isCanceled = latestSub.cancel_at_period_end === true || latestSub.cancel_at !== null;

    console.log('✅ FINAL CANCELLATION STATUS:', isCanceled);

    return NextResponse.json({
      cancelAtPeriodEnd: isCanceled,
      subscriptionStatus: latestSub.status,
      trialEnd: latestSub.trial_end ? new Date(latestSub.trial_end * 1000).toISOString() : null,
    });
  } catch (error: any) {
    console.error('❌ Error checking subscription status:', error);
    return NextResponse.json({ 
      cancelAtPeriodEnd: false,
      subscriptionStatus: null 
    });
  }
}

