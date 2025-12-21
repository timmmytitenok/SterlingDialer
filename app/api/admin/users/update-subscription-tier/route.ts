import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

/**
 * ADMIN GRANT BILLING BEHAVIOR:
 * 
 * When admin grants FREE tier (free_trial):
 * - User gets 7 days of free access
 * - NO Stripe subscription created
 * - NO automatic charge on day 30
 * - Access expires unless manually renewed
 * 
 * When admin grants PRO tier:
 * - User gets 7 days of free trial
 * - Creates Stripe subscription with trial_end
 * - WILL auto-charge $4.99 on day 30
 * - Then renews monthly at $4.99
 * - Requires card on file (stripe_customer_id)
 * 
 * When admin grants VIP tier:
 * - User gets LIFETIME access
 * - NO trial, NO Stripe subscription
 * - NO charges EVER
 */
export async function POST(req: Request) {
  try {
    console.log('🎫 Update subscription tier request received');
    
    const adminMode = await isAdminMode();
    console.log('🔐 Admin mode:', adminMode);
    
    if (!adminMode) {
      console.error('❌ Admin access denied');
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId, tier, trialDays } = await req.json();
    console.log('📝 Request data:', { userId, tier, trialDays });

    if (!userId || !tier) {
      console.error('❌ Missing required fields');
      return NextResponse.json({ error: 'User ID and tier required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    console.log('✅ Supabase client created');
    const now = new Date();

    // Get user's profile to get stripe_customer_id
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    const stripeCustomerId = userProfile?.stripe_customer_id;
    console.log('💳 Stripe customer ID:', stripeCustomerId);

    if (!stripeCustomerId) {
      console.error('❌ User has no Stripe customer ID');
      return NextResponse.json({ error: 'User must have a Stripe customer ID. They need to add a payment method first.' }, { status: 400 });
    }

    // Check if subscription exists
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    let subscriptionData: any = {
      user_id: userId,
      stripe_customer_id: stripeCustomerId,
      updated_at: now.toISOString(),
    };

    // ========================================================================
    // Check for existing Stripe subscriptions to cancel when changing tiers
    // ========================================================================
    console.log('🔍 Checking for existing Stripe subscriptions...');
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, stripe_price_id, subscription_tier as current_tier')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (existingSub) {
      console.log(`📋 Current subscription: Tier=${existingSub.current_tier}, Stripe ID=${existingSub.stripe_subscription_id}`);
    } else {
      console.log('ℹ️ No existing subscription found - this is a new subscription');
    }

    if (tier === 'free_trial') {
      const days = trialDays || 7; // Default to 7 days for admin grants
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + days);
      
      // Cancel any existing paid Stripe subscriptions when downgrading to FREE
      if (existingSub?.stripe_subscription_id) {
        const isRealStripeSubscription = existingSub.stripe_subscription_id && 
          !existingSub.stripe_subscription_id.startsWith('free_trial_') &&
          !existingSub.stripe_subscription_id.startsWith('free_access_');
        
        if (isRealStripeSubscription) {
          console.log(`🗑️ Canceling existing Stripe subscription: ${existingSub.stripe_subscription_id}`);
          try {
            await stripe.subscriptions.cancel(existingSub.stripe_subscription_id);
            console.log('✅ Stripe subscription canceled - user moved to FREE tier');
          } catch (stripeError: any) {
            console.error('❌ Failed to cancel Stripe subscription:', stripeError.message);
            console.error('⚠️ Admin must manually cancel in Stripe dashboard!');
          }
        }
      }
      
      subscriptionData.status = 'trialing';
      subscriptionData.tier = 'trial';
      subscriptionData.trial_end = trialEnd.toISOString();
      subscriptionData.current_period_end = trialEnd.toISOString();
      subscriptionData.stripe_subscription_id = null; // Clear Stripe ID for free tier
      console.log(`🆓 FREE tier granted with ${days}-day trial ending ${trialEnd.toISOString()}`);
      console.log('⚠️  NO AUTO-CHARGE: FREE tier is manual access only');
    } else if (tier === 'pro') {
      const days = trialDays || 7; // Default to 7 days for admin grants
      const trialEndTimestamp = Math.floor(Date.now() / 1000) + (days * 24 * 60 * 60); // Unix timestamp
      const trialEndDate = new Date(trialEndTimestamp * 1000);
      
      // Cancel any existing Stripe subscriptions before creating new PRO subscription
      if (existingSub?.stripe_subscription_id) {
        const isRealStripeSubscription = existingSub.stripe_subscription_id && 
          !existingSub.stripe_subscription_id.startsWith('free_trial_') &&
          !existingSub.stripe_subscription_id.startsWith('free_access_');
        
        if (isRealStripeSubscription) {
          console.log(`🗑️ Canceling existing Stripe subscription: ${existingSub.stripe_subscription_id}`);
          try {
            await stripe.subscriptions.cancel(existingSub.stripe_subscription_id);
            console.log('✅ Old Stripe subscription canceled - will create new PRO subscription');
          } catch (stripeError: any) {
            console.error('❌ Failed to cancel old Stripe subscription:', stripeError.message);
            console.error('⚠️ Admin must manually cancel in Stripe dashboard before creating new one!');
            return NextResponse.json({ 
              error: `Failed to cancel existing subscription: ${stripeError.message}. Please cancel manually in Stripe first.` 
            }, { status: 500 });
          }
        }
      }
      
      console.log(`⚡ Creating Stripe subscription for PRO tier with ${days}-day trial...`);
      
      try {
        // Check for Stripe price ID
        if (!process.env.STRIPE_PRO_PRICE_ID) {
          console.error('❌ STRIPE_PRO_PRICE_ID not set in environment');
          return NextResponse.json({ 
            error: 'Stripe price ID not configured. Cannot create subscription.' 
          }, { status: 500 });
        }
        
        // Create Stripe subscription with trial
        const stripeSubscription = await stripe.subscriptions.create({
          customer: stripeCustomerId,
          items: [
            {
              price: process.env.STRIPE_PRO_PRICE_ID, // $4.99/month
            },
          ],
          trial_end: trialEndTimestamp,
          payment_behavior: 'default_incomplete',
          payment_settings: {
            payment_method_types: ['card'],
            save_default_payment_method: 'on_subscription',
          },
          expand: ['latest_invoice.payment_intent'],
        });
        
        console.log('✅ Stripe subscription created:', stripeSubscription.id);
        console.log(`💳 Will auto-charge $4.99 on ${trialEndDate.toISOString()}`);
        
        subscriptionData.status = 'trialing';
        subscriptionData.tier = 'pro';
        subscriptionData.stripe_subscription_id = stripeSubscription.id;
        subscriptionData.trial_end = trialEndDate.toISOString();
        subscriptionData.current_period_end = trialEndDate.toISOString();
      } catch (stripeError: any) {
        console.error('❌ Stripe subscription creation failed:', stripeError.message);
        return NextResponse.json({ 
          error: `Failed to create Stripe subscription: ${stripeError.message}` 
        }, { status: 500 });
      }
    } else if (tier === 'vip') {
      const periodEnd = new Date();
      periodEnd.setFullYear(periodEnd.getFullYear() + 100); // 100 years = lifetime
      
      // ========================================================================
      // CRITICAL: Cancel any existing Stripe subscriptions
      // ========================================================================
      // VIP users should NEVER be charged - cancel their Stripe subscription immediately
      console.log('🚨 VIP GRANTED - Canceling any existing Stripe subscriptions...');
      
      if (existingSub?.stripe_subscription_id) {
        // Check if it's a real Stripe subscription (not a manual free trial)
        const isRealStripeSubscription = existingSub.stripe_subscription_id && 
          !existingSub.stripe_subscription_id.startsWith('free_trial_') &&
          !existingSub.stripe_subscription_id.startsWith('free_access_');
        
        if (isRealStripeSubscription) {
          console.log(`🗑️ Canceling existing Stripe subscription: ${existingSub.stripe_subscription_id}`);
          console.log(`💳 Price ID: ${existingSub.stripe_price_id}`);
          
          try {
            // Cancel immediately (not at period end) - VIP is immediate lifetime access
            await stripe.subscriptions.cancel(existingSub.stripe_subscription_id, {
              prorate: false, // No prorating - they're getting VIP (better than refund!)
            });
            console.log('✅ Stripe subscription CANCELED - User will NOT be charged');
            console.log('👑 User now has VIP access instead (much better than a refund!)');
          } catch (stripeError: any) {
            console.error('❌ Failed to cancel Stripe subscription:', stripeError.message);
            console.error('⚠️ Admin must manually cancel in Stripe dashboard!');
            // Continue anyway - VIP will be granted in database
            // Admin can manually cancel in Stripe if needed
          }
        } else {
          console.log(`ℹ️ Subscription is manual/free trial (${existingSub.stripe_subscription_id}) - no Stripe cancellation needed`);
        }
      } else {
        console.log('ℹ️ No existing Stripe subscription found - user may be new or manually added');
      }
      
      subscriptionData.status = 'active';
      subscriptionData.tier = 'vip';
      subscriptionData.current_period_end = periodEnd.toISOString();
      subscriptionData.trial_end = null;
      subscriptionData.stripe_subscription_id = null; // Clear Stripe subscription ID for VIP
      console.log(`👑 VIP tier granted - LIFETIME ACCESS until ${periodEnd.toISOString()}`);
      console.log(`✅ User will NEVER be charged - VIP is lifetime free access`);
    } else {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    console.log('💾 Subscription data:', subscriptionData);
    
    if (existing) {
      // Update existing subscription - RESET the created_at to NOW so trial days calculate correctly
      console.log('🔄 Updating existing subscription...');
      subscriptionData.created_at = now.toISOString(); // RESET to now for accurate trial calculation
      
      const { error } = await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Update error:', error);
        throw error;
      }
      console.log('✅ Subscription updated successfully - Trial reset to 7 days from NOW');
    } else {
      // Create new subscription
      console.log('➕ Creating new subscription...');
      subscriptionData.created_at = now.toISOString();
      
      const { error } = await supabase
        .from('subscriptions')
        .insert(subscriptionData);

      if (error) {
        console.error('❌ Insert error:', error);
        throw error;
      }
      console.log('✅ Subscription created successfully');
    }

    // Update profile if VIP
    console.log('👤 Updating profile VIP status...');
    if (tier === 'vip') {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_vip: true,
          updated_at: now.toISOString(),
        })
        .eq('user_id', userId);
      
      if (error) {
        console.error('❌ Profile update error:', error);
        throw error;
      }
      console.log('✅ VIP flag set to true');
    } else {
      // Remove VIP flag if changing to other tier
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_vip: false,
          updated_at: now.toISOString(),
        })
        .eq('user_id', userId);
      
      if (error) {
        console.error('❌ Profile update error:', error);
        throw error;
      }
      console.log('✅ VIP flag set to false');
    }

    console.log('🎉 Subscription tier updated successfully!');
    console.log(`📊 Final tier: ${tier}, Status: ${subscriptionData.status}`);
    return NextResponse.json({ 
      success: true,
      tier: tier,
      status: subscriptionData.status,
      message: `Successfully updated to ${tier.toUpperCase()} tier`
    });

  } catch (error: any) {
    console.error('❌❌❌ Error updating subscription tier:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

