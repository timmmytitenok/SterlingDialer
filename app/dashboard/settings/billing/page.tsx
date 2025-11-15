import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SimpleProSelector } from '@/components/simple-pro-selector';
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
    .select('subscription_tier, cost_per_minute, free_trial_started_at, free_trial_ends_at, referral_bonus_days')
    .eq('user_id', user.id)
    .single();
  
  console.log('🔍🔍🔍 DIRECT PROFILE CHECK:', directProfile);

  // Get subscription features
  const subscriptionFeatures = await getSubscriptionFeatures(user.id);
  
  console.log('🔍 Billing Page - Subscription Features:', {
    tier: subscriptionFeatures.tier,
    hasActiveSubscription: subscriptionFeatures.hasActiveSubscription,
  });

  // Check if user has an active subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();
  
  console.log('🔍 Billing Page - Subscription Data:', subscription);

  // For free trial users, use the actual trial dates from profile
  const accountCreatedAt = directProfile?.free_trial_started_at || user.created_at || new Date().toISOString();

  // Force VIP check to use the direct profile data instead
  const isVIP = directProfile?.subscription_tier === 'free_access';
  console.log('🎯 IS VIP (from direct profile):', isVIP);
  console.log('='.repeat(80));
  console.log('🚨🚨🚨 VIP CHECK RESULT:', isVIP ? 'YES - SHOW VIP CARD' : 'NO - SHOW CHOOSE PLAN');
  console.log('='.repeat(80));

  return (
    <>
      <SubscriptionSuccessHandler />
      
      {/* Show subscription status */}
      {subscriptionFeatures.hasActiveSubscription ? (
        <BillingManagementContent
          userId={user.id}
          userEmail={user.email!}
          hasSubscription={true}
          currentTier={subscription?.subscription_tier || subscriptionFeatures.tier || 'pro'}
          subscriptionData={subscription || { created_at: accountCreatedAt }}
          accountCreatedAt={accountCreatedAt}
          referralBonusDays={directProfile?.referral_bonus_days || 0}
          trialEndsAt={directProfile?.free_trial_ends_at}
        />
      ) : (
        <div className="mb-8">
          <SimpleProSelector 
            currentTier={subscriptionFeatures.tier} 
            hideFreeTrial={subscriptionFeatures.tier === 'free_trial'}
          />
        </div>
      )}
    </>
  );
}
