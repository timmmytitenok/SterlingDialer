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
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl mb-6 shadow-2xl shadow-purple-500/30">
            <TrendingUp className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Become an Affiliate Partner
          </h1>
          <p className="text-xl text-gray-300">
            Earn <span className="text-purple-400 font-bold">20% commission</span> on every customer you refer — <span className="text-green-400 font-bold">every month</span>!
          </p>
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 rounded-2xl p-10 border border-gray-700/50 mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">How It Works</h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-white font-semibold mb-2">Get Approved</h3>
              <p className="text-gray-400 text-sm">Contact support to become an affiliate partner</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-white font-semibold mb-2">Share Your Link</h3>
              <p className="text-gray-400 text-sm">Get your unique referral code and share it</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-white font-semibold mb-2">They Subscribe</h3>
              <p className="text-gray-400 text-sm">Your referral signs up and subscribes</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                💰
              </div>
              <h3 className="text-white font-semibold mb-2">Get Paid</h3>
              <p className="text-gray-400 text-sm">Earn $99.80 every month they stay subscribed</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-2xl p-10 border-2 border-purple-500/40 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Earn?</h2>
          <p className="text-gray-300 mb-8 text-lg">
            Join our affiliate program and start earning recurring commissions today!
          </p>
          
          <a
            href="mailto:SterlingDialer@gmail.com?subject=Affiliate Program Application"
            className="inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 text-white font-bold text-lg rounded-xl transition-all duration-300 hover:scale-105 shadow-2xl hover:shadow-purple-500/50"
          >
            <Gift className="w-6 h-6" />
            Apply to Become an Affiliate
            <TrendingUp className="w-6 h-6" />
          </a>

          <p className="text-gray-400 text-sm mt-6">
            We'll review your application and get back to you within 48 hours
          </p>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="bg-[#1A2647]/50 rounded-xl p-6 border border-gray-700/30">
            <h3 className="text-white font-bold mb-3">💵 How much can I earn?</h3>
            <p className="text-gray-400 text-sm">
              You earn $99.80 per customer per month. Refer 10 customers = <span className="text-green-400 font-bold">$998/month</span> recurring income!
            </p>
          </div>

          <div className="bg-[#1A2647]/50 rounded-xl p-6 border border-gray-700/30">
            <h3 className="text-white font-bold mb-3">📅 When do I get paid?</h3>
            <p className="text-gray-400 text-sm">
              Commissions are paid monthly via PayPal, Venmo, or bank transfer after your referrals make their payment.
            </p>
          </div>

          <div className="bg-[#1A2647]/50 rounded-xl p-6 border border-gray-700/30">
            <h3 className="text-white font-bold mb-3">🎯 Who can become an affiliate?</h3>
            <p className="text-gray-400 text-sm">
              Anyone! Influencers, agencies, consultants, or anyone with an audience in the insurance industry.
            </p>
          </div>

          <div className="bg-[#1A2647]/50 rounded-xl p-6 border border-gray-700/30">
            <h3 className="text-white font-bold mb-3">❓ How do I track my earnings?</h3>
            <p className="text-gray-400 text-sm">
              Once approved, you'll see this dashboard with real-time stats, pending payments, and referral history.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // Point directly to signup page
  const referralLink = `${window.location.origin}/signup?ref=${affiliateCode}`;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Affiliate Earnings</h1>
        <p className="text-gray-400">Track your commissions and referral performance</p>
      </div>

      {/* Referral Link Card */}
      <div className="mb-8 bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-2xl p-8 border-2 border-blue-500/50 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Gift className="w-8 h-8 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">Your Referral Link</h2>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 px-6 py-4 bg-[#0B1437] text-white rounded-lg border-2 border-blue-500/30 font-mono text-lg"
          />
          <button
            onClick={copyLink}
            className="px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copy
              </>
            )}
          </button>
        </div>
        <p className="text-sm text-blue-300 mt-4">
          Share this link to earn $99.80/month for every user who subscribes!
        </p>
      </div>

      {/* Earnings Summary - Money Only! */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* 1. Pending Payment - MOST IMPORTANT */}
        <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 rounded-2xl p-8 border-2 border-yellow-500/50 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-8 h-8 text-yellow-400" />
            <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Pending Payment</div>
          </div>
          <div className="text-6xl font-black text-yellow-400 mb-2">
            ${stats.pendingThisMonth.toFixed(2)}
          </div>
          <div className="text-sm text-gray-400">This month - waiting to be paid</div>
        </div>

        {/* 2. Total Paid - SECOND MOST IMPORTANT */}
        <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 rounded-2xl p-8 border-2 border-green-500/50 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Check className="w-8 h-8 text-green-400" />
            <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Paid</div>
          </div>
          <div className="text-6xl font-black text-green-400 mb-2">
            ${stats.totalPaid.toFixed(2)}
          </div>
          <div className="text-sm text-gray-400">Lifetime earnings received</div>
        </div>
      </div>

      {/* Referral Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-amber-900/20 to-yellow-900/20 rounded-xl p-6 border border-amber-500/30">
          <div className="text-sm font-bold text-gray-400 uppercase mb-2">Pending Payment</div>
          <div className="text-4xl font-black text-amber-400">{stats.inTrial}</div>
          <div className="text-xs text-gray-400 mt-2">Still in free trial</div>
        </div>

        <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl p-6 border border-green-500/30">
          <div className="text-sm font-bold text-gray-400 uppercase mb-2">Paying Users</div>
          <div className="text-4xl font-black text-green-400">{stats.converted}</div>
          <div className="text-xs text-gray-400 mt-2">Earning you money</div>
        </div>

        <div className="bg-gradient-to-br from-red-900/20 to-pink-900/20 rounded-xl p-6 border border-red-500/30">
          <div className="text-sm font-bold text-gray-400 uppercase mb-2">Cancelled</div>
          <div className="text-4xl font-black text-red-400">{stats.cancelled}</div>
          <div className="text-xs text-gray-400 mt-2">Left SterlingAI</div>
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
          <p>• They sign up and get a 30-day free trial</p>
          <p>• <strong className="text-yellow-400">When they make their first payment</strong> to become Pro Access, you start earning!</p>
          <p>• You earn <strong className="text-green-400">$99.80/month (20% of $499)</strong> for <strong>EVERY month</strong> they stay subscribed</p>
          <p>• Commissions automatically recur monthly while they remain active</p>
          <p>• Payments are processed manually at the end of each month</p>
        </div>
      </div>
    </div>
  );
}

