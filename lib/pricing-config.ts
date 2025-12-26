/**
 * PRICING CONFIGURATION
 * 
 * Centralized pricing configuration for Sterling AI
 * Update prices here to reflect across the entire application
 */

export const PRICING_CONFIG = {
  // Standard Subscription Tiers
  starter: {
    name: 'Starter',
    monthlyPrice: 379,
    costPerMinute: 0.30,
    freeMinutes: 600,
    maxDailyCalls: 600,
    aiCallerCount: 1,
    description: 'Perfect for getting started',
  },
  pro: {
    name: 'Pro',
    monthlyPrice: 899,
    costPerMinute: 0.25,
    freeMinutes: 1200,
    maxDailyCalls: 1200,
    aiCallerCount: 2,
    description: 'For serious closers',
  },
  elite: {
    name: 'Elite',
    monthlyPrice: 1499,
    costPerMinute: 0.20,
    freeMinutes: 2000,
    maxDailyCalls: 1800,
    aiCallerCount: 3,
    description: 'Maximum volume & automation',
  },

  // Free Trial (7 days)
  free_trial: {
    name: 'Free Trial',
    monthlyPrice: 0,
    costPerMinute: 0.30,
    freeMinutes: 0,
    maxDailyCalls: 600,
    aiCallerCount: 1,
    trialDuration: 30, // days
    description: '7-day free trial',
  },

  // Free Access (for friends - customizable via SQL)
  free_access: {
    name: 'Free Access',
    monthlyPrice: 0,
    costPerMinute: 0.10, // Default, can be customized per user
    freeMinutes: 0,
    maxDailyCalls: 600, // Default, can be customized per user
    aiCallerCount: 1, // Default, can be customized per user (1-3)
    description: 'Custom access tier',
    excludeFromCostGraph: true, // Don't show in AI cost tracking
  },
} as const;

export type PricingTier = keyof typeof PRICING_CONFIG;

/**
 * Get pricing details for a specific tier
 */
export function getPricingForTier(tier: PricingTier | string | null | undefined) {
  if (!tier || !(tier in PRICING_CONFIG)) {
    return null;
  }
  return PRICING_CONFIG[tier as PricingTier];
}

/**
 * Calculate daily cost for a tier (monthly price / days in month)
 */
export function calculateDailyBaseCost(tier: PricingTier | string, daysInMonth: number = 30) {
  const pricing = getPricingForTier(tier);
  if (!pricing || pricing.monthlyPrice === 0) {
    return 0;
  }
  return pricing.monthlyPrice / daysInMonth;
}

/**
 * Calculate call cost based on duration and cost per minute
 */
export function calculateCallCost(durationSeconds: number, costPerMinute: number) {
  const minutes = durationSeconds / 60;
  return minutes * costPerMinute;
}

/**
 * Get display price (formatted)
 */
export function formatPrice(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get display price with cents (formatted)
 */
export function formatPriceWithCents(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Check if a tier is a paid subscription
 */
export function isPaidTier(tier: string | null | undefined): boolean {
  return tier === 'starter' || tier === 'pro' || tier === 'elite';
}

/**
 * Check if a tier is a free tier (trial or access)
 */
export function isFreeTier(tier: string | null | undefined): boolean {
  return tier === 'free_trial' || tier === 'free_access';
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: string | null | undefined): string {
  const pricing = getPricingForTier(tier);
  return pricing?.name || 'No Plan';
}

/**
 * Get auto-refill amounts based on tier (for call balance)
 */
export function getAutoRefillAmounts(tier: string | null | undefined) {
  switch (tier) {
    case 'starter':
      return { min: 50, max: 100, default: 50 };
    case 'pro':
      return { min: 100, max: 200, default: 100 };
    case 'elite':
      return { min: 200, max: 400, default: 200 };
    case 'free_trial':
      return { min: 25, max: 100, default: 50 };
    case 'free_access':
      return { min: 25, max: 100, default: 50 };
    default:
      return { min: 50, max: 100, default: 50 };
  }
}

