/**
 * PRICING CONFIGURATION
 * 
 * Centralized pricing configuration for Sterling Dialer
 * PAY AS YOU GO MODEL - No monthly fees, just $0.65 per minute
 */

export const PRICING_CONFIG = {
  // Pay As You Go - Main tier for all users
  pay_as_you_go: {
    name: 'Pay As You Go',
    monthlyPrice: 0,
    costPerMinute: 0.65,
    freeMinutes: 0,
    maxDailyCalls: 600,
    aiCallerCount: 2,
    description: 'No monthly fee, pay only for minutes used',
  },

  // Legacy: Starter (keep for existing users)
  starter: {
    name: 'Starter',
    monthlyPrice: 0,
    costPerMinute: 0.65,
    freeMinutes: 0,
    maxDailyCalls: 600,
    aiCallerCount: 1,
    description: 'Pay as you go',
  },

  // Legacy: Pro (keep for existing users)
  pro: {
    name: 'Pro',
    monthlyPrice: 0,
    costPerMinute: 0.65,
    freeMinutes: 0,
    maxDailyCalls: 1200,
    aiCallerCount: 2,
    description: 'Pay as you go',
  },

  // Legacy: Elite (keep for existing users)
  elite: {
    name: 'Elite',
    monthlyPrice: 0,
    costPerMinute: 0.65,
    freeMinutes: 0,
    maxDailyCalls: 1800,
    aiCallerCount: 3,
    description: 'Pay as you go',
  },

  // Legacy: Free Trial (now just regular access)
  free_trial: {
    name: 'Pay As You Go',
    monthlyPrice: 0,
    costPerMinute: 0.65,
    freeMinutes: 0,
    maxDailyCalls: 600,
    aiCallerCount: 1,
    description: 'Pay as you go',
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

