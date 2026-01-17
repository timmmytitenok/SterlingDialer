import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CallBalanceCard } from '@/components/call-balance-card';
import { BalanceSuccessHandler } from '@/components/balance-success-handler';
import { MobileBalanceRedirect } from '@/components/mobile-balance-redirect';
import { getSubscriptionFeatures } from '@/lib/subscription-helpers';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CallBalancePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signup');
  }

  // Get subscription features
  const subscriptionFeatures = await getSubscriptionFeatures(user.id);

  // Get call balance
  const { data: callBalance } = await supabase
    .from('call_balance')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return (
    <>
      {/* Handle successful balance refill redirect */}
      <BalanceSuccessHandler />
      
      {/* Redirect mobile users to billing page after payment */}
      <MobileBalanceRedirect />

      {/* Page Header */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">Balance</h1>
        <p className="text-sm md:text-base text-gray-400">Manage your calling credits and auto-refill settings</p>
      </div>

      {/* Call Balance Content */}
      <div>
        <CallBalanceCard
          userId={user.id}
          initialBalance={callBalance?.balance || 0}
          initialAutoRefill={callBalance?.auto_refill_enabled ?? false}
          initialRefillAmount={callBalance?.auto_refill_amount || 50}
          currentTier={subscriptionFeatures.tier || 'none'}
        />
      </div>
    </>
  );
}

