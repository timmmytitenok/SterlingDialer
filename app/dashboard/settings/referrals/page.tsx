import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ReferralDashboard } from '@/components/referral-dashboard';
import { FreeTrialReferralDashboard } from '@/components/free-trial-referral-dashboard';
import { Lock, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default async function ReferralsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile to check their tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('user_id', user.id)
    .single();

  // Check if user has an active subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  // If user is on free trial, show free trial referral program
  if (profile?.subscription_tier === 'free_trial') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Free Trial Referral Program</h1>
          <p className="text-gray-400">Extend your trial by inviting friends - earn up to 28 extra days!</p>
        </div>

        <FreeTrialReferralDashboard userId={user.id} />
      </div>
    );
  }

  // If no active subscription, show locked message
  if (!subscription) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Referral Program</h1>
          <p className="text-gray-400">Invite friends and earn $200 in calling credits per referral</p>
        </div>

        {/* Locked Message */}
        <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl p-12 border-2 border-gray-800 text-center relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute w-[300px] h-[300px] bg-gray-500/5 rounded-full blur-3xl -top-20 -right-20 animate-pulse" />
            <div className="absolute w-[300px] h-[300px] bg-gray-500/5 rounded-full blur-3xl -bottom-20 -left-20 animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="relative z-10">
            <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-6 border-2 border-gray-700">
              <Lock className="w-10 h-10 text-gray-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Subscription Required</h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              The referral program is only available to active subscribers. Subscribe to any plan to unlock referral rewards!
            </p>
            
            <Link
              href="/dashboard/settings/billing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-lg transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-purple-500/50"
            >
              <CreditCard className="w-5 h-5" />
              View Subscription Plans
            </Link>

            {/* Benefits Preview */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-[#0B1437]/50 rounded-lg p-4 border border-gray-800">
                <div className="text-3xl mb-2">🎉</div>
                <p className="text-gray-400 text-sm">Free to Join</p>
              </div>
              <div className="bg-[#0B1437]/50 rounded-lg p-4 border border-gray-800">
                <div className="text-3xl mb-2">💰</div>
                <p className="text-gray-400 text-sm">$200 Per Referral</p>
              </div>
              <div className="bg-[#0B1437]/50 rounded-lg p-4 border border-gray-800">
                <div className="text-3xl mb-2">🚀</div>
                <p className="text-gray-400 text-sm">Unlimited Earnings</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Referral Program</h1>
        <p className="text-gray-400">Invite friends and earn $200 in calling credits per referral</p>
      </div>

      <ReferralDashboard userId={user.id} />
    </div>
  );
}

