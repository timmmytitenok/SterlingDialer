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

  // Get subscription features
  const subscriptionFeatures = await getSubscriptionFeatures(user.id);

  // Check if user has an active subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  return (
    <div className="min-h-screen md:min-h-0">
      {/* Handle successful checkout redirect */}
      <SubscriptionSuccessHandler />
      
      {/* If no subscription, show plan selector */}
      {!subscriptionFeatures.hasActiveSubscription && (
        <div className="bg-[#1A2647] rounded-lg md:rounded-xl p-4 md:p-8 border border-gray-800">
          <div className="mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-1 md:mb-2">Choose Your Plan</h2>
            <p className="text-sm md:text-base text-gray-400">Select a subscription to get started with Sterling AI</p>
          </div>
          <SubscriptionTierSelector currentTier={subscriptionFeatures.tier as any} />
        </div>
      )}

      {/* Billing Management */}
      {subscriptionFeatures.hasActiveSubscription && (
        <div className="animate-in fade-in slide-in-from-bottom duration-500">
          <div className="mb-4 md:mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">Billing & Subscription</h1>
            <p className="text-sm md:text-base text-gray-400">Manage your subscription and payment methods</p>
          </div>
          <BillingManagementContent
            userEmail={user.email!}
            hasSubscription={!!subscription}
            currentTier={subscriptionFeatures.tier as 'none' | 'free_trial' | 'starter' | 'pro' | 'elite'}
          />
        </div>
      )}
    </div>
  );
}
