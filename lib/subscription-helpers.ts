import { createClient } from '@/lib/supabase/server';

export type SubscriptionTier = 'starter' | 'pro' | 'elite' | 'none' | null;

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

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  // No active subscription - return defaults
  if (!subscription) {
    return {
      tier: null,
      maxDailyCalls: 0,
      aiCallerCount: 0,
      hasActiveSubscription: false,
    };
  }

  // Return features based on subscription
  return {
    tier: subscription.subscription_tier as SubscriptionTier,
    maxDailyCalls: subscription.max_daily_calls || getTierDefaults(subscription.subscription_tier).maxDailyCalls,
    aiCallerCount: subscription.ai_caller_count || getTierDefaults(subscription.subscription_tier).aiCallerCount,
    hasActiveSubscription: true,
  };
}

/**
 * Get default features for a tier (used as fallback)
 */
export function getTierDefaults(tier: string | null) {
  switch (tier) {
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

