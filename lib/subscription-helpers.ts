import { createClient } from '@/lib/supabase/server';

export type SubscriptionTier = 'starter' | 'pro' | 'elite' | 'free_trial' | 'free_access' | 'none' | null;

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

  // First check for paid subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  // If paid subscription exists, return it
  if (subscription) {
    return {
      tier: subscription.subscription_tier as SubscriptionTier,
      maxDailyCalls: subscription.max_daily_calls || getTierDefaults(subscription.subscription_tier).maxDailyCalls,
      aiCallerCount: subscription.ai_caller_count || getTierDefaults(subscription.subscription_tier).aiCallerCount,
      hasActiveSubscription: true,
    };
  }

  // No paid subscription - check for free trial or free access in profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('user_id', userId)
    .single()
    .limit(1); // Force fresh query
  
  console.log('🔍 Subscription Helper - Profile tier:', profile?.subscription_tier);

  // If free trial exists, return free trial features
  if (profile?.subscription_tier === 'free_trial') {
    console.log('✅ Returning FREE TRIAL features');
    return {
      tier: 'free_trial',
      maxDailyCalls: getTierDefaults('free_trial').maxDailyCalls,
      aiCallerCount: getTierDefaults('free_trial').aiCallerCount,
      hasActiveSubscription: true, // Free trial counts as active subscription
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
    case 'free_trial':
      return {
        maxDailyCalls: 600,
        aiCallerCount: 1,
      };
    case 'free_access':
      return {
        maxDailyCalls: 600, // VIP gets 600 calls/day
        aiCallerCount: 1, // 1 AI caller
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
export function getTierDisplayName(tier: SubscriptionTier): string {
  switch (tier) {
    case 'free_trial':
      return 'Free Trial';
    case 'free_access':
      return 'VIP Access';
    case 'starter':
      return 'Starter Plan';
    case 'pro':
      return 'Pro Plan';
    case 'elite':
      return 'Elite Plan';
    default:
      return 'No Plan';
  }
}

/**
 * Get tier color for UI
 */
export function getTierColor(tier: SubscriptionTier): string {
  switch (tier) {
    case 'free_trial':
      return 'green';
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

