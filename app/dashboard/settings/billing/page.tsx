import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SimpleProSelector } from '@/components/simple-pro-selector';
import { SubscriptionSuccessHandler } from '@/components/subscription-success-handler';
import { BalanceSuccessHandler } from '@/components/balance-success-handler';
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
    redirect('/signup');
  }

  // Get user's subscription info from subscriptions table (NEW - not profiles!)
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  
  console.log('🔍 Billing Page - Subscription Data:', subscription);

  // Fetch call balance data for mobile combined view
  const { data: callBalanceData } = await supabase
    .from('call_balance')
    .select('balance')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: profileData } = await supabase
    .from('profiles')
    .select('auto_refill_enabled, auto_refill_amount')
    .eq('user_id', user.id)
    .single();

  const currentBalance = callBalanceData?.balance || 0;
  const autoRefillEnabled = profileData?.auto_refill_enabled || false;
  const autoRefillAmount = profileData?.auto_refill_amount || 25;

  // Get subscription features
  const subscriptionFeatures = await getSubscriptionFeatures(user.id);
  
  console.log('🔍 Billing Page - Subscription Features:', {
    tier: subscriptionFeatures.tier,
    hasActiveSubscription: subscriptionFeatures.hasActiveSubscription,
  });

  // Determine account type and trial status from subscription table
  const accountCreatedAt = subscription?.created_at || user.created_at || new Date().toISOString();
  const trialEndsAt = subscription?.trial_end || null;
  
  const hasProAccess = subscription?.tier === 'pro' && (subscription?.status === 'active' || subscription?.status === 'trialing');
  const hasFreeAccess = subscription?.tier === 'trial' && (subscription?.status === 'active' || subscription?.status === 'trialing');
  const hasVIPAccess = subscription?.tier === 'vip';
  
  console.log('🎯 Subscription Status:', { 
    tier: subscription?.tier, 
    status: subscription?.status,
    hasProAccess, 
    hasFreeAccess,
    hasVIPAccess,
    trialEndsAt,
  });

  return (
    <>
      <SubscriptionSuccessHandler />
      <BalanceSuccessHandler />
      
      {/* Show subscription status */}
      {(subscriptionFeatures.hasActiveSubscription || hasProAccess || hasFreeAccess || hasVIPAccess) ? (
        <BillingManagementContent
          userId={user.id}
          userEmail={user.email!}
          hasSubscription={true}
          currentTier={subscription?.tier || subscriptionFeatures.tier || 'trial'}
          subscriptionData={subscription || { created_at: accountCreatedAt }}
          accountCreatedAt={accountCreatedAt}
          referralBonusDays={0}
          trialEndsAt={trialEndsAt}
          initialBalance={currentBalance}
          initialAutoRefill={autoRefillEnabled}
          initialRefillAmount={autoRefillAmount}
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
