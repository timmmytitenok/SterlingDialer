import { createClient } from '@/lib/supabase/server';

export type SubscriptionTier = 'trial' | 'pro' | 'vip' | 'starter' | 'elite' | 'free_trial' | 'free_access' | 'none' | null;

export interface SubscriptionFeatures {
  tier: SubscriptionTier;
  maxDailyCalls: number;
  aiCallerCount: number;
  hasActiveSubscription: boolean;
}

/**
 * Get subscription tier and feature flags for a user
 */
export async function getSubscriptionFeatures(userId: string): Promise<SubscriptionFeatures> {
  const supabase = await createClient();

  // First check for subscription (active OR trialing)
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .maybeSingle();

  console.log('🔍 Subscription Helper - Subscription:', subscription);

  // If subscription exists (active or trialing), return it
  if (subscription) {
    const tier = subscription.tier || 'trial'; // Use 'tier' column, not 'subscription_tier'
    console.log(`✅ Returning ${tier.toUpperCase()} features (from subscriptions table)`);
    return {
      tier: tier as SubscriptionTier,
      maxDailyCalls: getTierDefaults(tier).maxDailyCalls,
      aiCallerCount: getTierDefaults(tier).aiCallerCount,
      hasActiveSubscription: true,
    };
  }

  // No paid subscription - check for free trial, Pro, or free access in profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, has_active_subscription')
    .eq('user_id', userId)
    .single();
  
  console.log('🔍 Subscription Helper - Profile tier:', profile?.subscription_tier);
  console.log('🔍 Subscription Helper - Has active sub:', profile?.has_active_subscription);

  // If free trial exists, return free trial features (CHECK THIS FIRST!)
  if (profile?.subscription_tier === 'free_trial') {
    console.log('✅ Returning FREE TRIAL features');
    return {
      tier: 'free_trial',
      maxDailyCalls: getTierDefaults('free_trial').maxDailyCalls,
      aiCallerCount: getTierDefaults('free_trial').aiCallerCount,
      hasActiveSubscription: true, // Free trial counts as active subscription
    };
  }

  // If Pro Access manually granted, return Pro features
  if (profile?.subscription_tier === 'pro' || profile?.has_active_subscription === true) {
    console.log('✅ Returning PRO ACCESS features (from profile)');
    return {
      tier: 'pro',
      maxDailyCalls: getTierDefaults('pro').maxDailyCalls,
      aiCallerCount: getTierDefaults('pro').aiCallerCount,
      hasActiveSubscription: true,
    };
  }

  // If VIP free access exists, return VIP features
  if (profile?.subscription_tier === 'free_access') {
    console.log('✅ Returning VIP FREE ACCESS features');
    return {
      tier: 'free_access',
      maxDailyCalls: getTierDefaults('free_access').maxDailyCalls,
      aiCallerCount: getTierDefaults('free_access').aiCallerCount,
      hasActiveSubscription: true, // VIP access counts as active subscription
    };
  }

  // No subscription or free trial - return defaults
  return {
    tier: null,
    maxDailyCalls: 0,
    aiCallerCount: 0,
    hasActiveSubscription: false,
  };
}

/**
 * Get default features for a tier (used as fallback)
 */
export function getTierDefaults(tier: string | null) {
  switch (tier) {
    case 'trial': // NEW tier name
    case 'free_trial':
      return {
        maxDailyCalls: 600,
        aiCallerCount: 1,
      };
    case 'vip': // NEW tier name
    case 'free_access':
      return {
        maxDailyCalls: 999999, // VIP gets unlimited
        aiCallerCount: 10, // VIP gets 10 AI callers
      };
    case 'starter':
      return {
        maxDailyCalls: 600,
        aiCallerCount: 1,
      };
    case 'pro':
      return {
        maxDailyCalls: 1200,
        aiCallerCount: 2,
      };
    case 'elite':
      return {
        maxDailyCalls: 1800,
        aiCallerCount: 3,
      };
    default:
      return {
        maxDailyCalls: 0,
        aiCallerCount: 0,
      };
  }
}

/**
 * Check if user has access to a specific feature
 */
export function hasFeatureAccess(features: SubscriptionFeatures, featureName: string): boolean {
  if (!features.hasActiveSubscription) return false;

  // No feature-specific checks needed anymore
  return false;
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: SubscriptionTier | string): string {
  switch (tier) {
    case 'trial':
    case 'free_trial':
      return 'Free Trial';
    case 'vip':
    case 'free_access':
      return 'VIP Access (Lifetime)';
    case 'starter':
      return 'Starter Plan';
    case 'pro':
      return 'Pro Access';
    case 'elite':
      return 'Elite Plan';
    default:
      return 'No Plan';
  }
}

/**
 * Get tier color for UI
 */
export function getTierColor(tier: SubscriptionTier | string): string {
  switch (tier) {
    case 'trial':
    case 'free_trial':
      return 'green';
    case 'vip':
    case 'free_access':
      return 'amber'; // Gold/VIP color
    case 'starter':
      return 'blue';
    case 'pro':
      return 'purple';
    case 'elite':
      return 'amber';
    default:
      return 'gray';
  }
}

