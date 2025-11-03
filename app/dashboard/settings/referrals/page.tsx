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

  // ONLY allow free trial users to access referral program
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

  // For all other tiers (Starter, Pro, Elite, Free Access, etc.) - show disabled message
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Referral Program</h1>
        <p className="text-gray-400">Currently available only for free trial users</p>
      </div>

      {/* Disabled Message */}
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
          <h2 className="text-2xl font-bold text-white mb-3">Referral Program Temporarily Disabled</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            The referral program is currently only available for users on free trial. We're working on exciting new referral rewards for paid subscribers!
          </p>
          
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-blue-500/50"
          >
            Back to Dashboard
          </Link>

          {/* Coming Soon Features */}
          <div className="mt-8 max-w-md mx-auto">
            <p className="text-gray-500 text-sm mb-4">🚀 Coming Soon for Paid Subscribers:</p>
            <div className="space-y-2">
              <div className="bg-[#0B1437]/50 rounded-lg p-3 border border-gray-800">
                <p className="text-gray-400 text-sm">💰 Earn calling credits for referrals</p>
              </div>
              <div className="bg-[#0B1437]/50 rounded-lg p-3 border border-gray-800">
                <p className="text-gray-400 text-sm">🎁 Monthly subscription discounts</p>
              </div>
              <div className="bg-[#0B1437]/50 rounded-lg p-3 border border-gray-800">
                <p className="text-gray-400 text-sm">🏆 Exclusive rewards program</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

