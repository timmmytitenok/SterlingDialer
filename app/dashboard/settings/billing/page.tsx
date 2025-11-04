import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SubscriptionTierSelector } from '@/components/subscription-tier-selector';
import { SubscriptionSuccessHandler } from '@/components/subscription-success-handler';
import { BillingManagementContent } from '@/components/billing-management-content';
import { getSubscriptionFeatures } from '@/lib/subscription-helpers';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function BillingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // DEBUG: Check profile directly from database
  const { data: directProfile } = await supabase
    .from('profiles')
    .select('subscription_tier, cost_per_minute')
    .eq('user_id', user.id)
    .single();
  
  console.log('🔍🔍🔍 DIRECT PROFILE CHECK:', directProfile);

  // Get subscription features
  const subscriptionFeatures = await getSubscriptionFeatures(user.id);
  
  // DEBUG: Log what we're getting
  console.log('🔍 Billing Page - Subscription Features:', {
    tier: subscriptionFeatures.tier,
    hasActiveSubscription: subscriptionFeatures.hasActiveSubscription,
    maxDailyCalls: subscriptionFeatures.maxDailyCalls,
    aiCallerCount: subscriptionFeatures.aiCallerCount
  });
  
  console.log('🚨 IS IT FREE ACCESS?', subscriptionFeatures.tier === 'free_access');
  console.log('🚨 TIER VALUE:', subscriptionFeatures.tier);
  console.log('🚨 TIER TYPE:', typeof subscriptionFeatures.tier);
  console.log('🚨 STRICT EQUALITY:', subscriptionFeatures.tier === 'free_access');
  console.log('🚨 LOOSE EQUALITY:', subscriptionFeatures.tier == 'free_access');

  // Check if user has an active subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();
  
  console.log('🔍 Billing Page - Subscription Data:', subscription);

  // Force VIP check to use the direct profile data instead
  const isVIP = directProfile?.subscription_tier === 'free_access';
  console.log('🎯 IS VIP (from direct profile):', isVIP);
  console.log('='.repeat(80));
  console.log('🚨🚨🚨 VIP CHECK RESULT:', isVIP ? 'YES - SHOW VIP CARD' : 'NO - SHOW CHOOSE PLAN');
  console.log('='.repeat(80));

  return (
    <div className="min-h-screen md:min-h-0">
      {/* Handle successful checkout redirect */}
      <SubscriptionSuccessHandler />
      
      {/* If VIP access, always show billing management (skip plan selector) */}
      {isVIP ? (
        <div className="animate-in fade-in slide-in-from-bottom duration-500">
          <div className="mb-4 md:mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">Billing & Subscription</h1>
            <p className="text-sm md:text-base text-gray-400">Manage your subscription and payment methods</p>
          </div>
          <BillingManagementContent
            userEmail={user.email!}
            hasSubscription={false}
            currentTier={'free_access'}
          />
        </div>
      ) : (!subscriptionFeatures.hasActiveSubscription && !isVIP) ? (
        <div className="bg-[#1A2647] rounded-lg md:rounded-xl p-4 md:p-8 border border-gray-800">
          <div className="mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-1 md:mb-2">Choose Your Plan</h2>
            <p className="text-sm md:text-base text-gray-400">Select a subscription to get started with Sterling AI</p>
          </div>
          <SubscriptionTierSelector currentTier={subscriptionFeatures.tier as any} />
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom duration-500">
          <div className="mb-4 md:mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">Billing & Subscription</h1>
            <p className="text-sm md:text-base text-gray-400">Manage your subscription and payment methods</p>
          </div>
          <BillingManagementContent
            userEmail={user.email!}
            hasSubscription={!!subscription}
            currentTier={subscriptionFeatures.tier as 'none' | 'free_trial' | 'starter' | 'pro' | 'elite' | 'free_access'}
          />
        </div>
      )}
    </div>
  );
}
