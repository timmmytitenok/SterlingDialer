'use client';

import { useRouter, useParams } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminStatCard } from '@/components/admin/admin-stat-card';
import { StatusPill } from '@/components/admin/status-pill';
import { mockReferralPartners, mockReferredUsers } from '@/lib/referral-demo-data';
import { ArrowLeft, Users, DollarSign, Calendar, TrendingUp, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function ReferralPartnerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const partnerId = params?.id as string;
  const [copiedCode, setCopiedCode] = useState(false);

  const partner = mockReferralPartners.find((p) => p.id === partnerId);
  const referredUsers = mockReferredUsers.filter((u) => u.referredBy === partnerId);

  if (!partner) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Partner Not Found</h1>
          <button onClick={() => router.push('/admin/referrals')} className="text-blue-400 hover:underline">
            Back to Referrals
          </button>
        </div>
      </div>
    );
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const createdDate = new Date(partner.createdAt);

  return (
    <div className="min-h-screen p-3 md:p-8 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.push('/admin/referrals')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-600 rounded-lg transition-all mb-6 text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Referrals
        </button>

        {/* Partner Header */}
        <div className="bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-xl mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-2xl font-bold">
                {partner.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{partner.name}</h1>
                <p className="text-gray-400">{partner.email}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400 mb-1">Partner since</div>
              <div className="text-white font-semibold">
                {createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Referral Link */}
          <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm text-gray-400 mb-1">Referral Code</div>
                <code className="text-2xl font-bold text-purple-400 font-mono">{partner.referralCode}</code>
              </div>
              <button
                onClick={() => copyToClipboard(partner.referralCode)}
                className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg font-semibold transition-all flex items-center gap-2"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={partner.referralLink}
                readOnly
                className="flex-1 px-3 py-2 bg-[#0B1437] border border-gray-700 rounded text-gray-400 text-sm font-mono"
              />
              <button
                onClick={() => copyToClipboard(partner.referralLink)}
                className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg transition-all"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <AdminStatCard
            title="Total Referrals"
            value={partner.totalReferrals}
            subtitle="All-time sign-ups"
            icon={Users}
          />
          <AdminStatCard
            title="Active Referrals"
            value={partner.activeReferrals}
            subtitle="Currently subscribed"
            icon={Users}
            className="border-green-500/30"
          />
          <AdminStatCard
            title="Total Months Billed"
            value={partner.totalMonthsBilled}
            subtitle="Subscription-months"
            icon={Calendar}
            className="border-purple-500/30"
          />
          <AdminStatCard
            title="Commission Earned"
            value={`$${partner.totalCommissionEarned.toLocaleString()}`}
            subtitle={`$${partner.pendingPayout.toLocaleString()} pending`}
            icon={DollarSign}
            className="border-green-500/30 bg-gradient-to-br from-green-900/20 to-green-600/10"
          />
        </div>

        {/* Referred Users Table */}
        <div className="bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-gray-700/50">
            <h2 className="text-xl font-bold text-white">Referred Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0B1437] border-b-2 border-gray-700/50">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">User</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Signed Up</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase">Months Subscribed</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase">Monthly Value</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase">Commission/Month</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase">Total Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {referredUsers.map((user) => {
                  const signUpDate = new Date(user.signedUpAt);

                  return (
                    <tr key={user.id} className="hover:bg-[#0B1437]/70 transition-all">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{user.name}</div>
                        <div className="text-xs text-gray-400">{user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">
                          {signUpDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusPill status={user.status} size="sm" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-lg font-bold text-purple-400">{user.subscriptionMonths}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-white font-semibold">${user.monthlyValue}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-green-400 font-semibold">${user.commissionPerMonth}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-lg font-bold text-green-400">${user.totalCommissionGenerated.toLocaleString()}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {referredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg font-semibold">No referrals yet</p>
              <p className="text-gray-500 text-sm mt-2">Users referred by this partner will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

