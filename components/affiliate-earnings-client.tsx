'use client';

import { useState, useEffect } from 'react';
import {
  Gift,
  DollarSign,
  Users,
  TrendingUp,
  Copy,
  Check,
  Loader2,
  Calendar,
  Clock,
} from 'lucide-react';

interface AffiliateStats {
  totalReferrals: number;
  inTrial: number;
  converted: number;
  cancelled: number;
  pendingThisMonth: number;
  totalEarned: number;
  totalPaid: number;
  paymentHistory: Array<{
    month: string;
    amount: number;
    paidAt: string;
    method: string;
  }>;
  referralDetails?: Array<{
    name: string;
    email: string;
    status: 'trial' | 'converted' | 'cancelled';
    signupDate: string;
    convertedDate?: string;
  }>;
}

export function AffiliateEarningsClient({ 
  isAffiliate, 
  affiliateCode 
}: { 
  isAffiliate: boolean; 
  affiliateCode: string | null;
}) {
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isAffiliate) {
      loadStats();
    } else {
      setLoading(false);
    }
  }, [isAffiliate]);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/affiliate/my-stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    // Point directly to signup page
    const link = `${window.location.origin}/signup?ref=${affiliateCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!isAffiliate) {
    return (
      <div className="min-h-screen">
        {/* Animated Background Glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[600px] h-[600px] bg-purple-500/15 rounded-full blur-[150px] -top-60 left-1/4 animate-pulse" />
          <div className="absolute w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[150px] top-1/2 right-0 animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] bottom-0 left-1/3 animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto p-4 md:p-8">
          {/* Header */}
          <div className="text-center mb-12">
            {/* Glowing Icon */}
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur-xl opacity-60 animate-pulse" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/50">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
            </div>
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full mb-6">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              <span className="text-purple-400 font-semibold text-sm">AFFILIATE PROGRAM</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Become an{' '}
              <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
                Affiliate Partner
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300">
              Earn <span className="text-purple-400 font-bold">10% commission</span> on every customer you refer — <span className="text-green-400 font-bold">every month</span>!
            </p>
          </div>

          {/* How It Works */}
          <div className="relative mb-12">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-2xl blur-xl" />
            <div className="relative bg-gradient-to-br from-[#1A2647]/90 to-[#0F1629]/90 backdrop-blur-sm rounded-2xl p-8 md:p-10 border border-purple-500/20 shadow-2xl">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">How It Works</h2>
              
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center group">
                  <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-blue-500 rounded-full blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                    <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg shadow-blue-500/40">
                      1
                    </div>
                  </div>
                  <h3 className="text-white font-semibold mb-2">Get Approved</h3>
                  <p className="text-gray-400 text-sm">Contact support to become an affiliate partner</p>
                </div>

                <div className="text-center group">
                  <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-purple-500 rounded-full blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                    <div className="relative w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg shadow-purple-500/40">
                      2
                    </div>
                  </div>
                  <h3 className="text-white font-semibold mb-2">Share Your Link</h3>
                  <p className="text-gray-400 text-sm">Get your unique referral code and share it</p>
                </div>

                <div className="text-center group">
                  <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-green-500 rounded-full blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                    <div className="relative w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg shadow-green-500/40">
                      3
                    </div>
                  </div>
                  <h3 className="text-white font-semibold mb-2">They Subscribe</h3>
                  <p className="text-gray-400 text-sm">Your referral signs up and subscribes</p>
                </div>

                <div className="text-center group">
                  <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-yellow-500 rounded-full blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                    <div className="relative w-14 h-14 bg-gradient-to-br from-yellow-500 to-amber-600 text-white rounded-full flex items-center justify-center text-2xl shadow-lg shadow-yellow-500/40">
                      💰
                    </div>
                  </div>
                  <h3 className="text-white font-semibold mb-2">Get Paid</h3>
                  <p className="text-gray-400 text-sm">Earn $49.90 every month they stay subscribed</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="relative mb-12">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-2xl blur-xl" />
            <div className="relative bg-gradient-to-br from-purple-900/40 to-indigo-900/40 backdrop-blur-sm rounded-2xl p-8 md:p-10 border-2 border-purple-500/40 text-center shadow-2xl shadow-purple-500/20">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Ready to Earn?</h2>
              <p className="text-gray-300 mb-8 text-lg">
                Join our affiliate program and start earning recurring commissions today!
              </p>
              
              <a
                href="mailto:SterlingDialer@gmail.com?subject=Affiliate Program Application"
                className="group relative inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 text-white font-bold text-lg rounded-xl transition-all duration-300 hover:scale-105 shadow-2xl hover:shadow-purple-500/50 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                <Gift className="w-6 h-6 relative z-10" />
                <span className="relative z-10">Apply to Become an Affiliate</span>
                <TrendingUp className="w-6 h-6 relative z-10" />
              </a>

              <p className="text-gray-400 text-sm mt-6">
                We'll review your application and get back to you within 48 hours
              </p>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-[#1A2647]/70 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-green-500/30 transition-colors">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                  <span className="text-2xl">💵</span> How much can I earn?
                </h3>
                <p className="text-gray-400 text-sm">
                  Earn <span className="text-green-400 font-bold">50% ($189.50)</span> on first month, then <span className="text-green-400 font-bold">30% ($113.70)</span> recurring! Refer 10 customers = <span className="text-green-400 font-bold">$1,137/month</span> recurring income!
                </p>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-[#1A2647]/70 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-blue-500/30 transition-colors">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                  <span className="text-2xl">📅</span> When do I get paid?
                </h3>
                <p className="text-gray-400 text-sm">
                  Commissions are paid monthly via PayPal, Venmo, or bank transfer after your referrals make their payment.
                </p>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-[#1A2647]/70 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-purple-500/30 transition-colors">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                  <span className="text-2xl">🎯</span> Who can become an affiliate?
                </h3>
                <p className="text-gray-400 text-sm">
                  Anyone! Influencers, agencies, consultants, or anyone with an audience in the insurance industry.
                </p>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-[#1A2647]/70 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-amber-500/30 transition-colors">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                  <span className="text-2xl">❓</span> How do I track my earnings?
                </h3>
                <p className="text-gray-400 text-sm">
                  Once approved, you'll see this dashboard with real-time stats, pending payments, and referral history.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // Point directly to signup page
  const referralLink = `${window.location.origin}/signup?ref=${affiliateCode}`;

  return (
    <div className="min-h-screen">
      {/* Animated Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[600px] h-[600px] bg-green-500/10 rounded-full blur-[150px] -top-60 right-0 animate-pulse" />
        <div className="absolute w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[150px] bottom-0 left-1/4 animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full mb-4">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 font-semibold text-xs">AFFILIATE PARTNER</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Affiliate{' '}
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Earnings
            </span>
          </h1>
          <p className="text-gray-400">Track your commissions and referral performance</p>
        </div>

        {/* Referral Link Card */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-xl" />
          <div className="relative bg-gradient-to-br from-blue-900/50 to-purple-900/50 backdrop-blur-sm rounded-2xl p-6 md:p-8 border-2 border-blue-500/40 shadow-2xl shadow-blue-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 rounded-lg blur-md opacity-50" />
                <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Gift className="w-5 h-5 text-white" />
                </div>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white">Your Referral Link</h2>
            </div>
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 px-4 md:px-6 py-3 md:py-4 bg-[#0B1437]/80 text-white rounded-xl border-2 border-blue-500/30 font-mono text-sm md:text-base"
              />
              <button
                onClick={copyLink}
                className="group relative px-6 py-3 md:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                {copied ? (
                  <>
                    <Check className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-sm text-blue-300 mt-4">
              ✨ Share this link to earn $49.90/month for every user who subscribes!
            </p>
          </div>
        </div>

      {/* Earnings Summary - Money Only! */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* 1. Pending Payment - MOST IMPORTANT */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/30 to-orange-500/30 rounded-2xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity" />
          <div className="relative bg-gradient-to-br from-yellow-900/50 to-orange-900/50 backdrop-blur-sm rounded-2xl p-6 md:p-8 border-2 border-yellow-500/40 shadow-2xl shadow-yellow-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-500 rounded-lg blur-md opacity-50" />
                <div className="relative w-10 h-10 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Pending Payment</div>
            </div>
            <div className="text-4xl md:text-6xl font-black text-yellow-400 mb-2">
              ${stats.pendingThisMonth.toFixed(2)}
            </div>
            <div className="text-sm text-gray-400">This month - waiting to be paid</div>
          </div>
        </div>

        {/* 2. Total Paid - SECOND MOST IMPORTANT */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-2xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity" />
          <div className="relative bg-gradient-to-br from-green-900/50 to-emerald-900/50 backdrop-blur-sm rounded-2xl p-6 md:p-8 border-2 border-green-500/40 shadow-2xl shadow-green-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500 rounded-lg blur-md opacity-50" />
                <div className="relative w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Paid</div>
            </div>
            <div className="text-4xl md:text-6xl font-black text-green-400 mb-2">
              ${stats.totalPaid.toFixed(2)}
            </div>
            <div className="text-sm text-gray-400">Lifetime earnings received</div>
          </div>
        </div>
      </div>

      {/* Referral Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-amber-900/20 to-yellow-900/20 rounded-xl p-6 border border-amber-500/30">
          <div className="text-sm font-bold text-gray-400 uppercase mb-2">Pending Payment</div>
          <div className="text-4xl font-black text-amber-400">{stats.inTrial}</div>
          <div className="text-xs text-gray-400 mt-2">Pending activation</div>
        </div>

        <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl p-6 border border-green-500/30">
          <div className="text-sm font-bold text-gray-400 uppercase mb-2">Paying Users</div>
          <div className="text-4xl font-black text-green-400">{stats.converted}</div>
          <div className="text-xs text-gray-400 mt-2">Earning you money</div>
        </div>

        <div className="bg-gradient-to-br from-red-900/20 to-pink-900/20 rounded-xl p-6 border border-red-500/30">
          <div className="text-sm font-bold text-gray-400 uppercase mb-2">Cancelled</div>
          <div className="text-4xl font-black text-red-400">{stats.cancelled}</div>
          <div className="text-xs text-gray-400 mt-2">Left Sterling</div>
        </div>
      </div>

      {/* Referral Log - Who You Referred */}
      <div className="bg-[#1A2647] rounded-xl p-8 border border-gray-700/50 mb-8">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Users className="w-6 h-6 text-purple-400" />
          Your Referrals
        </h3>
        
        {stats.referralDetails && stats.referralDetails.length > 0 ? (
          <div className="space-y-3">
            {stats.referralDetails.map((referral, idx) => {
              const statusConfig = {
                trial: { 
                  label: '⏰ Pending', 
                  color: 'text-amber-400', 
                  bg: 'bg-amber-500/10',
                  border: 'border-amber-500/30'
                },
                converted: { 
                  label: '✅ Active Member', 
                  color: 'text-green-400', 
                  bg: 'bg-green-500/10',
                  border: 'border-green-500/30'
                },
                cancelled: { 
                  label: '❌ Cancelled', 
                  color: 'text-red-400', 
                  bg: 'bg-red-500/10',
                  border: 'border-red-500/30'
                },
              };
              
              const config = statusConfig[referral.status];
              
              return (
                <div key={idx} className="flex items-center justify-between p-4 bg-[#0B1437]/70 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-all">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-semibold">{referral.name}</div>
                      <div className="text-xs text-gray-400">{referral.email}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Signed up {new Date(referral.signupDate).toLocaleDateString()}
                        {referral.convertedDate && (
                          <> • Subscribed {new Date(referral.convertedDate).toLocaleDateString()}</>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-lg ${config.bg} ${config.border} border`}>
                    <span className={`text-sm font-bold ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No referrals yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Share your referral link to start earning commissions!
            </p>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="bg-[#1A2647] rounded-xl p-8 border border-gray-700/50">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Calendar className="w-6 h-6 text-green-400" />
          Payment History
        </h3>
        
        {stats.paymentHistory.length > 0 ? (
          <div className="space-y-3">
            {stats.paymentHistory.map((payment, idx) => {
              const monthDate = new Date(payment.month + '-01');
              return (
                <div key={idx} className="flex items-center justify-between p-4 bg-[#0B1437]/70 rounded-lg border border-gray-700/50">
                  <div className="flex items-center gap-4">
                    <Calendar className="w-5 h-5 text-green-400" />
                    <div>
                      <div className="text-white font-semibold">
                        {monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </div>
                      <div className="text-xs text-gray-400">
                        Paid via {payment.method} on {new Date(payment.paidAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-400">
                    ${payment.amount.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No payments yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Earnings will appear here once users convert to paid subscriptions
            </p>
          </div>
        )}
      </div>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <h4 className="text-white font-bold mb-3">How It Works</h4>
          <div className="space-y-2 text-sm text-gray-300">
            <p>• Share your referral link with potential customers</p>
            <p>• They sign up and start using Pay As You Go ($0.65/min)</p>
            <p>• <strong className="text-yellow-400">When they start making calls</strong>, you start earning!</p>
            <p>• You earn <strong className="text-green-400">$37.90/month (10% of $379)</strong> for <strong>EVERY month</strong> they stay subscribed</p>
            <p>• Commissions automatically recur monthly while they remain active</p>
            <p>• Payments are processed manually at the end of each month</p>
          </div>
        </div>
      </div>
    </div>
  );
}

