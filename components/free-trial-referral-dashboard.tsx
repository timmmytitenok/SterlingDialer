'use client';

import { useState, useEffect } from 'react';
import { Gift, Copy, Check, Users, Clock, Sparkles, Lock, Unlock, Trophy } from 'lucide-react';

interface ReferralTier {
  level: number;
  referralsNeeded: number;
  daysReward: number;
  unlocked: boolean;
  icon: string;
}

interface FreeTrialReferralStats {
  totalValidReferrals: number;
  totalDaysEarned: number;
  referralLink: string;
  referrals: any[];
}

export function FreeTrialReferralDashboard({ userId }: { userId: string }) {
  const [referralLink, setReferralLink] = useState('');
  const [stats, setStats] = useState<FreeTrialReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // 4 Tiers: 1 referral = +7 days, 2 = +14, 3 = +21, 4 = +28
  const tiers: ReferralTier[] = [
    { level: 1, referralsNeeded: 1, daysReward: 7, unlocked: false, icon: '🎁' },
    { level: 2, referralsNeeded: 2, daysReward: 14, unlocked: false, icon: '🎉' },
    { level: 3, referralsNeeded: 3, daysReward: 21, unlocked: false, icon: '🚀' },
    { level: 4, referralsNeeded: 4, daysReward: 28, unlocked: false, icon: '👑' },
  ];

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      // Get free trial referral stats
      const response = await fetch('/api/referral/free-trial-stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data);
        setReferralLink(data.referralLink);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const validReferrals = stats?.totalValidReferrals || 0;

  // Calculate unlocked tiers
  const unlockedTiers = tiers.map(tier => ({
    ...tier,
    unlocked: validReferrals >= tier.referralsNeeded
  }));

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-2xl p-6 md:p-8 border-2 border-green-500/50 relative overflow-hidden shadow-2xl">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[300px] h-[300px] bg-green-500/10 rounded-full blur-3xl -top-20 -right-20 animate-pulse" />
          <div className="absolute w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl -bottom-20 -left-20 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500/30 to-emerald-600/30 flex items-center justify-center border-2 border-green-500/50 shadow-lg">
              <Gift className="w-7 h-7 text-green-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                Extend Your Free Trial
                <Sparkles className="w-5 h-5 text-yellow-400" />
              </h2>
              <p className="text-green-300 text-sm md:text-base">Invite friends and unlock up to 28 extra days!</p>
            </div>
          </div>

          {/* Progress Summary */}
          <div className="bg-[#0B1437]/50 rounded-xl p-4 md:p-6 border border-green-500/30 mb-6">
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              <div className="text-center">
                <p className="text-4xl md:text-5xl font-bold text-green-400 mb-1">{validReferrals}</p>
                <p className="text-green-300 text-sm font-medium">Valid Referrals</p>
              </div>
              <div className="text-center">
                <p className="text-4xl md:text-5xl font-bold text-emerald-400 mb-1">+{stats?.totalDaysEarned || 0}</p>
                <p className="text-emerald-300 text-sm font-medium">Extra Days Earned</p>
              </div>
            </div>
          </div>

          {/* How it Works */}
          <div className="bg-[#0B1437]/30 rounded-xl p-4 md:p-6 border border-green-500/20 mb-6">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-lg">
              <span className="text-xl">🎯</span>
              How It Works
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0 border border-green-500/30">
                  <span className="text-green-400 font-bold text-sm">1</span>
                </div>
                <p className="text-gray-300 text-sm">Share your unique referral link with friends</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0 border border-green-500/30">
                  <span className="text-green-400 font-bold text-sm">2</span>
                </div>
                <p className="text-gray-300 text-sm">They sign up, verify email, and add payment method</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0 border border-green-500/30">
                  <span className="text-green-400 font-bold text-sm">3</span>
                </div>
                <p className="text-gray-300 text-sm">You automatically get +7 days added to your trial!</p>
              </div>
            </div>
          </div>

          {/* Referral Link */}
          <div className="bg-[#0B1437]/50 rounded-xl p-5 border border-green-500/30">
            <label className="text-sm text-green-300 mb-3 block font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Your Unique Referral Link
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 px-4 py-3 bg-[#1A2647] border-2 border-green-500/30 rounded-lg text-white text-sm font-mono"
              />
              <button
                onClick={() => copyToClipboard(referralLink)}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/50 flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5 animate-bounce" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copy Link
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-green-400/80 mt-3 flex items-center gap-2">
              <span className="text-base">✨</span>
              Share this link! Each valid sign-up adds 7 days to your trial
            </p>
          </div>
        </div>
      </div>

      {/* Unlock Tiers - Beautiful Progressive Design */}
      <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl p-6 md:p-8 border border-gray-800 relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Unlock Rewards
          </h3>
          <p className="text-gray-400 mb-6">Refer friends to unlock bigger rewards</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {unlockedTiers.map((tier) => (
              <div
                key={tier.level}
                className={`relative rounded-xl p-6 border-2 transition-all duration-500 ${
                  tier.unlocked
                    ? 'bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/50 shadow-xl shadow-green-500/20 scale-105'
                    : 'bg-gradient-to-br from-gray-800/20 to-gray-900/20 border-gray-700/50 opacity-60'
                }`}
              >
                {/* Unlocked Badge */}
                {tier.unlocked && (
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center border-2 border-[#1A2647] animate-bounce shadow-lg">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                )}

                {/* Lock Icon for Locked Tiers */}
                {!tier.unlocked && (
                  <div className="absolute top-4 right-4">
                    <Lock className="w-5 h-5 text-gray-600" />
                  </div>
                )}

                {/* Tier Icon */}
                <div className="text-center mb-4">
                  <div className={`text-5xl mb-2 transition-all duration-300 ${
                    tier.unlocked ? 'scale-110 animate-pulse' : 'grayscale opacity-50'
                  }`}>
                    {tier.icon}
                  </div>
                  <h4 className={`text-lg font-bold mb-1 ${
                    tier.unlocked ? 'text-green-400' : 'text-gray-500'
                  }`}>
                    Tier {tier.level}
                  </h4>
                </div>

                {/* Reward Info */}
                <div className="text-center space-y-2">
                  <div className={`text-3xl font-bold ${
                    tier.unlocked ? 'text-white' : 'text-gray-600'
                  }`}>
                    +{tier.daysReward}
                  </div>
                  <p className={`text-sm font-medium ${
                    tier.unlocked ? 'text-green-300' : 'text-gray-500'
                  }`}>
                    Days
                  </p>
                  <div className="pt-2 border-t border-gray-700/50">
                    <p className={`text-xs ${
                      tier.unlocked ? 'text-green-400' : 'text-gray-600'
                    }`}>
                      {tier.referralsNeeded} {tier.referralsNeeded === 1 ? 'Referral' : 'Referrals'}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mt-4 text-center">
                  {tier.unlocked ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-bold">
                      <Unlock className="w-3 h-3" />
                      Unlocked!
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-700/20 text-gray-500 border border-gray-700/30 rounded-full text-xs font-bold">
                      <Lock className="w-3 h-3" />
                      Locked
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Max Reward Info */}
          <div className="mt-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
            <p className="text-yellow-300 font-bold flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5" />
              Max Reward: 28 Extra Days with 4 Referrals!
            </p>
          </div>
        </div>
      </div>

      {/* Referral List */}
      {stats?.referrals && stats.referrals.length > 0 && (
        <div className="bg-[#1A2647] rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-400" />
            Your Referrals
          </h3>
          <div className="space-y-3">
            {stats.referrals.map((ref: any) => (
              <div
                key={ref.id}
                className="flex items-center justify-between bg-[#0B1437]/50 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center">
                    <span className="text-green-400 font-bold text-sm">
                      {ref.referee_email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{ref.referee_email || 'User'}</p>
                    <p className="text-xs text-gray-400">
                      Signed up {new Date(ref.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                    ref.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  }`}>
                    {ref.status === 'completed' ? '✅ +7 Days' : '⏳ Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Referrals Yet */}
      {stats?.referrals && stats.referrals.length === 0 && (
        <div className="bg-[#1A2647] rounded-xl p-12 border border-gray-800 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No referrals yet</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Start sharing your referral link to extend your free trial by up to 28 days!
          </p>
          <button
            onClick={() => copyToClipboard(referralLink)}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-lg transition-all duration-200 hover:scale-105 inline-flex items-center gap-2"
          >
            <Copy className="w-5 h-5" />
            Copy Your Link
          </button>
        </div>
      )}
    </div>
  );
}

