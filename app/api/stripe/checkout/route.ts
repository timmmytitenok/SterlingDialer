import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia' as any,
});

export async function POST(req: Request) {
  try {
    const { tier } = await req.json();
    console.log('🎯 Checkout requested for tier:', tier);
    
    if (!tier || !['starter', 'pro', 'elite'].includes(tier)) {
      console.error('❌ Invalid tier:', tier);
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    console.log('🔐 Creating Supabase client...');
    const supabase = await createClient();

    console.log('👤 Getting user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Error getting user:', userError);
      return NextResponse.json({ error: 'Auth error: ' + userError.message }, { status: 401 });
    }
    
    if (!user) {
      console.error('❌ No user found');
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }
    
    console.log('✅ User found:', user.id, user.email);

    // Get or create Stripe customer and check for referral
    console.log('📋 Looking up profile for user:', user.id);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, referred_by')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.warn('⚠️ Profile lookup error:', profileError);
      // Profile might not exist yet, that's okay - we'll create the customer
    }

    let customerId = profile?.stripe_customer_id;
    const hasReferral = profile?.referred_by ? true : false;
    
    console.log('💳 Customer ID:', customerId || 'None (will create)');
    console.log('🎁 Has referral:', hasReferral);
    
    if (hasReferral) {
      console.log('🎁 User was referred with code:', profile?.referred_by);
      console.log('💰 20% discount will be applied to first month');
    }

    if (!customerId) {
      console.log('🆕 Creating new Stripe customer...');
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      console.log('✅ Stripe customer created:', customerId);

      // Save to Supabase - use upsert in case profile doesn't exist
      const { error: saveError } = await supabase
        .from('profiles')
        .upsert({ 
          user_id: user.id,
          stripe_customer_id: customerId 
        }, {
          onConflict: 'user_id'
        });
      
      if (saveError) {
        console.error('⚠️ Failed to save customer ID:', saveError);
        // Continue anyway - customer is created in Stripe
      } else {
        console.log('✅ Customer ID saved to profile');
      }
    } else {
      console.log('✅ Using existing Stripe customer:', customerId);
    }

    // Get price ID based on tier
    let priceId: string;
    switch (tier) {
      case 'starter':
        priceId = process.env.STRIPE_PRICE_ID_STARTER!;
        break;
      case 'pro':
        priceId = process.env.STRIPE_PRICE_ID_PRO!;
        break;
      case 'elite':
        priceId = process.env.STRIPE_PRICE_ID_ELITE!;
        break;
      default:
        return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    console.log('💰 Using Price ID:', priceId, 'for tier:', tier);

    if (!priceId) {
      console.error(`❌ Missing price ID for tier: ${tier}`);
      return NextResponse.json(
        { error: `Price ID not configured for ${tier} tier. Please add STRIPE_PRICE_ID_${tier.toUpperCase()} to your environment variables.` },
        { status: 500 }
      );
    }

    // Check if user already has an active PAID subscription (not free trial or free access)
    console.log('🔍 Checking for existing subscription...');
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, subscription_tier, stripe_price_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    // Check if this is a real Stripe subscription (not free_trial or free_access)
    const isRealStripeSubscription = existingSubscription?.stripe_subscription_id && 
      !existingSubscription.stripe_subscription_id.startsWith('free_trial_') &&
      !existingSubscription.stripe_subscription_id.startsWith('free_access_');

    // If user has existing PAID subscription, upgrade/downgrade it (with proration)
    if (existingSubscription && isRealStripeSubscription) {
      console.log('🔄 Existing PAID subscription found:', existingSubscription.stripe_subscription_id);
      console.log('📊 Current tier:', existingSubscription.subscription_tier, '→ New tier:', tier);
      
      try {
        // Get the subscription from Stripe
        const subscription = await stripe.subscriptions.retrieve(existingSubscription.stripe_subscription_id);
        const subscriptionItemId = subscription.items.data[0].id;

        console.log('⚡ Updating subscription with proration...');
        
        // Update the subscription (Stripe handles proration automatically)
        const updatedSubscription = await stripe.subscriptions.update(
          existingSubscription.stripe_subscription_id,
          {
            items: [
              {
                id: subscriptionItemId,
                price: priceId,
              },
            ],
            proration_behavior: 'always_invoice', // Create invoice for proration
            metadata: {
              user_id: user.id,
              tier: tier,
            },
          }
        );

        console.log('✅ Subscription updated successfully!');
        console.log('💳 Proration will be charged/credited on next invoice');

        // Webhook will handle updating the database
        return NextResponse.json({ 
          success: true,
          message: 'Subscription updated! Proration will be applied.',
          upgraded: true,
          subscription_id: updatedSubscription.id
        });
      } catch (error: any) {
        console.error('❌ Error updating subscription:', error);
        return NextResponse.json({ 
          error: 'Failed to update subscription: ' + error.message 
        }, { status: 500 });
      }
    }

    // Handle upgrade from free trial or free access
    if (existingSubscription && !isRealStripeSubscription) {
      console.log('🎁 Upgrading from free tier:', existingSubscription.subscription_tier, '→', tier);
      
      // Mark that user is upgrading from trial (to skip onboarding and set maintenance appropriately)
      await supabase
        .from('profiles')
        .update({
          upgraded_from_trial: true,
          previous_tier: existingSubscription.subscription_tier,
        })
        .eq('user_id', user.id);
      
      // Cancel the free tier subscription in database (will create new one via webhook)
      await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('user_id', user.id)
        .eq('stripe_subscription_id', existingSubscription.stripe_subscription_id);
      
      console.log('✅ Free tier canceled, proceeding to create new paid subscription');
    }

    // No existing subscription - create new checkout session
    console.log('🆕 No existing subscription, creating new checkout session...');
    
    const sessionConfig: any = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/subscribe/success`,
      cancel_url: `${req.headers.get('origin')}/subscribe?canceled=true`,
      metadata: {
        user_id: user.id,
        tier: tier,
      },
    };

    // Apply 30% discount if user was referred
    if (hasReferral) {
      try {
        // Try to apply the referral coupon - it might not exist in live mode
        sessionConfig.discounts = [
          {
            coupon: 'REFERRAL30', // 30% off first month coupon
          },
        ];
        console.log('✅ 30% referral discount will be applied to checkout');
      } catch (error: any) {
        console.warn('⚠️ Could not apply referral discount:', error.message);
        console.warn('⚠️ Make sure REFERRAL30 coupon exists in your Stripe account (live mode)');
        // Continue without discount if coupon doesn't exist
      }
    }

    try {
      const session = await stripe.checkout.sessions.create(sessionConfig);

      console.log('✅ Checkout session created:', session.id);
      console.log('🔗 Checkout URL:', session.url);
      
      return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (stripeError: any) {
      // If coupon error, retry without the discount
      if (stripeError.message?.includes('coupon') || stripeError.code === 'resource_missing') {
        console.warn('⚠️ Coupon not found, retrying without discount...');
        delete sessionConfig.discounts;
        
        const session = await stripe.checkout.sessions.create(sessionConfig);
        console.log('✅ Checkout session created (without discount):', session.id);
        console.log('🔗 Checkout URL:', session.url);
        
        return NextResponse.json({ 
          sessionId: session.id, 
          url: session.url,
          warning: 'Referral discount could not be applied. Please contact support.'
        });
      }
      
      // If it's a different error, throw it
      throw stripeError;
    }
  } catch (error: any) {
    console.error('❌ Checkout error:', error);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json({ 
      error: error.message || 'Unknown error',
      details: error.toString()
    }, { status: 500 });
  }
}

