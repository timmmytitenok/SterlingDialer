'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { 
  Gift, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Check, 
  Loader2,
  AlertCircle,
  Calendar,
  CreditCard,
  Plus,
  X,
  Trash2,
  LogOut,
} from 'lucide-react';

interface Affiliate {
  id: string;
  name: string;
  email: string;
  totalReferrals: number;
  activeReferrals: number;
  pending: number; // Changed from pendingThisMonth
  totalPaid: number;
  totalEarned: number;
  lastPayoutAt: string | null;
}

interface Summary {
  totalAffiliates: number;
  totalActiveReferrals: number;
  pendingThisMonth: number;
  totalPaidAllTime: number;
}

export default function AdminAffiliatePage() {
  const router = useRouter();
  const supabase = createClient();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [currentMonth, setCurrentMonth] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAffiliateUserId, setNewAffiliateUserId] = useState('');
  const [newAffiliateCode, setNewAffiliateCode] = useState('');

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/signup');
  };

  // Redirect mobile users to My Revenue
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      window.location.href = '/admin/my-revenue';
    }
  }, []);

  useEffect(() => {
    loadAffiliates();
  }, []);

  const loadAffiliates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/affiliates/stats');
      const data = await response.json();
      
      if (data.success) {
        setAffiliates(data.affiliates || []);
        setSummary(data.summary);
        setCurrentMonth(data.currentMonth);
      }
    } catch (err) {
      console.error('Error loading affiliates:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (affiliateId: string, affiliateName: string, amount: number) => {
    const paymentMethod = prompt('Payment method (paypal/venmo/bank_transfer):');
    if (!paymentMethod) return;

    const reference = prompt('Payment reference/transaction ID (optional):') || '';

    setProcessing(affiliateId);
    try {
      const response = await fetch('/api/admin/affiliates/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referrerId: affiliateId,
          paymentMethod,
          reference,
        }),
      });

      if (!response.ok) throw new Error('Failed to mark as paid');

      const notification = document.createElement('div');
      notification.className = 'fixed top-8 right-8 bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50 flex items-center gap-3';
      notification.innerHTML = `
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span class="font-semibold">Marked as paid!</span>
      `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);

      loadAffiliates();
    } catch (err) {
      alert('Error marking as paid');
    } finally {
      setProcessing(null);
    }
  };

  const deleteAffiliate = async (affiliateId: string, affiliateName: string) => {
    const confirmed = confirm(
      `Are you sure you want to remove ${affiliateName} as an affiliate partner?\n\nThis will:\n- Remove their affiliate status\n- Delete their referral code\n- Allow you to recreate them for testing\n\nNote: Existing referrals will remain in the database.`
    );
    
    if (!confirmed) return;

    setProcessing(affiliateId);
    try {
      const response = await fetch('/api/admin/affiliates/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: affiliateId,
        }),
      });

      if (!response.ok) throw new Error('Failed to delete affiliate');

      const notification = document.createElement('div');
      notification.className = 'fixed top-8 right-8 bg-red-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50 flex items-center gap-3';
      notification.innerHTML = `
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span class="font-semibold">Affiliate partner removed!</span>
      `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);

      loadAffiliates();
    } catch (err) {
      alert('Error deleting affiliate');
    } finally {
      setProcessing(null);
    }
  };

  const generateCommissions = async () => {
    if (!confirm(`Generate commission records for ${currentMonth}? This will create payout entries for all active referrals.`)) {
      return;
    }

    setProcessing('generating');
    try {
      const response = await fetch('/api/admin/affiliates/generate-commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: currentMonth }),
      });

      if (!response.ok) throw new Error('Failed to generate');

      const notification = document.createElement('div');
      notification.className = 'fixed top-8 right-8 bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50 flex items-center gap-3';
      notification.innerHTML = `
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span class="font-semibold">Commissions generated!</span>
      `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);

      loadAffiliates();
    } catch (err) {
      alert('Error generating commissions');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto">
        <AdminPageHeader
          title="🎁 Affiliate Program"
          description="Track creator commissions and manage payouts"
          actions={
            <button
              onClick={() => setShowCreateModal(true)}
              className="group relative overflow-hidden flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 border-2 border-blue-500/40 hover:border-blue-400/60 text-blue-400 hover:text-blue-300 rounded-lg font-bold transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 backdrop-blur-sm"
            >
              {/* Animated glow background */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-cyan-400/10 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <Plus className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform" />
              <span className="relative z-10">Create Affiliate</span>
              
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>
          }
        />

        {/* Summary Cards - Money Only! */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 backdrop-blur-xl rounded-2xl p-8 border-2 border-yellow-500/50 shadow-2xl hover:scale-105 hover:shadow-yellow-500/30 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="w-8 h-8 text-yellow-400 group-hover:scale-110 transition-transform" />
                <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Pending This Month</div>
              </div>
              <div className="text-6xl font-black text-yellow-400 mb-2 group-hover:text-yellow-300 transition-colors">${summary.pendingThisMonth.toFixed(2)}</div>
              <div className="text-sm text-gray-400">Waiting to be paid out</div>
            </div>

            <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur-xl rounded-2xl p-8 border-2 border-green-500/50 shadow-2xl hover:scale-105 hover:shadow-green-500/30 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center gap-3 mb-4">
                <Check className="w-8 h-8 text-green-400 group-hover:scale-110 transition-transform" />
                <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Paid</div>
              </div>
              <div className="text-6xl font-black text-green-400 mb-2 group-hover:text-green-300 transition-colors">${summary.totalPaidAllTime.toFixed(2)}</div>
              <div className="text-sm text-gray-400">All-time payouts</div>
            </div>
          </div>
        )}

        {/* Affiliates Table */}
        <div className="bg-[#1A2647]/40 backdrop-blur-xl rounded-2xl border-2 border-gray-700/30 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0B1437] border-b-2 border-gray-700/50">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Affiliate
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Pending
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Total Paid
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Last Payout
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {affiliates.map((affiliate) => (
                  <tr key={affiliate.id} className="hover:bg-[#0B1437]/70 transition-all duration-200">
                    {/* Name & Email */}
                    <td className="px-6 py-4">
                      <div className="text-white font-semibold">{affiliate.name}</div>
                      <div className="text-sm text-gray-400">{affiliate.email}</div>
                    </td>
                    
                    {/* Pending */}
                    <td className="px-6 py-4 text-right">
                      <div className="text-lg font-bold text-yellow-400">${affiliate.pending.toFixed(2)}</div>
                    </td>
                    
                    {/* Total Paid */}
                    <td className="px-6 py-4 text-right">
                      <div className="text-lg font-bold text-green-400">${affiliate.totalPaid.toFixed(2)}</div>
                    </td>
                    
                    {/* Last Payout */}
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm text-gray-400">
                        {affiliate.lastPayoutAt 
                          ? new Date(affiliate.lastPayoutAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'Never'}
                      </div>
                    </td>
                    
                    {/* Actions - Smart button based on pending amount */}
                    <td className="px-6 py-4 text-center">
                      {affiliate.pending > 0 ? (
                        <button
                          onClick={() => markAsPaid(affiliate.id, affiliate.name, affiliate.pending)}
                          disabled={processing === affiliate.id}
                          className="px-6 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg font-semibold transition-all disabled:opacity-50"
                        >
                          {processing === affiliate.id ? (
                            <Loader2 className="w-4 h-4 animate-spin inline" />
                          ) : (
                            'Mark as Paid'
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => deleteAffiliate(affiliate.id, affiliate.name)}
                          disabled={processing === affiliate.id}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-all disabled:opacity-50"
                          title="Remove affiliate partner"
                        >
                          {processing === affiliate.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {affiliates.length === 0 && (
            <div className="text-center py-16">
              <Gift className="w-20 h-20 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-xl font-semibold">No affiliates yet</p>
              <p className="text-gray-500 text-sm mt-2">Affiliates will appear when users make referrals</p>
            </div>
          )}
            </div>


        {/* Create Affiliate Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-[#1A2647] to-[#0F1629] rounded-2xl border-2 border-blue-500/40 max-w-md w-full overflow-hidden shadow-2xl">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Create Affiliate Partner</h2>
                  <p className="text-blue-100 text-sm mt-1">Generate an affiliate link for a user</p>
        </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewAffiliateUserId('');
                    setNewAffiliateCode('');
                  }}
                  className="text-white hover:bg-white/10 p-2 rounded-lg transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
      </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-white font-semibold block mb-2">Supabase User ID</label>
                  <input
                    type="text"
                    value={newAffiliateUserId}
                    onChange={(e) => setNewAffiliateUserId(e.target.value)}
                    placeholder="3c8d1265-0997-4305-a830-..."
                    className="w-full px-4 py-3 bg-[#0B1437] text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none font-mono text-sm transition-all"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Get this from User Management page
                  </p>
                </div>

                <div>
                  <label className="text-white font-semibold block mb-2">Affiliate Code (Unique)</label>
                  <input
                    type="text"
                    value={newAffiliateCode}
                    onChange={(e) => setNewAffiliateCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    placeholder="JOHN2025"
                    className="w-full px-4 py-3 bg-[#0B1437] text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none font-mono transition-all"
                    maxLength={20}
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Link will be: {window.location.origin}/signup?ref={newAffiliateCode || 'CODE'}
                  </p>
                </div>

                <button
                  onClick={async () => {
                    if (!newAffiliateUserId || !newAffiliateCode) {
                      alert('Please fill in both fields');
                      return;
                    }

                    setProcessing('creating');
                    try {
                      const response = await fetch('/api/admin/affiliates/create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          userId: newAffiliateUserId,
                          code: newAffiliateCode,
                        }),
                      });

                      if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error || 'Failed to create');
                      }

                      const notification = document.createElement('div');
                      notification.className = 'fixed top-8 right-8 bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50 flex items-center gap-3';
                      notification.innerHTML = `
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span class="font-semibold">Affiliate created!</span>
                      `;
                      document.body.appendChild(notification);
                      setTimeout(() => notification.remove(), 3000);

                      setShowCreateModal(false);
                      setNewAffiliateUserId('');
                      setNewAffiliateCode('');
                      loadAffiliates();
                    } catch (err: any) {
                      alert(`Error: ${err.message}`);
                    } finally {
                      setProcessing(null);
                    }
                  }}
                  disabled={processing === 'creating' || !newAffiliateUserId || !newAffiliateCode}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {processing === 'creating' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Create Affiliate Partner
                    </>
                  )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
