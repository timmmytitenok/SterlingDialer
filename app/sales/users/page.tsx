'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Search,
  DollarSign,
  Calendar,
} from 'lucide-react';

interface Referral {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  status: string;
  lead_source: string;
  subscription_amount: number;
  converted_at: string | null;
  created_at: string;
  commission_type?: string;
  user_signup_date?: string;
}

interface Commission {
  id: string;
  user_email: string;
  amount: number;
  status: string;
  month_year: string;
}

export default function SalesUsersPage() {
  const router = useRouter();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkAndLoad();
  }, [router]);

  const checkAndLoad = async () => {
    // Check for admin impersonation first
    try {
      const impersonateResponse = await fetch('/api/sales/check-impersonation');
      const impersonateData = await impersonateResponse.json();
      
      if (impersonateData.impersonating) {
        loadData(impersonateData.salesPersonId);
        return;
      }
    } catch (error) {
      console.log('No impersonation session');
    }

    // Normal flow
    const session = localStorage.getItem('sales_session');
    if (!session) {
      router.push('/sales/login');
      return;
    }

    const parsed = JSON.parse(session);
    loadData(parsed.id);
  };

  const loadData = async (salesId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sales/dashboard?id=${salesId}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('sales_session');
          router.push('/sales/login');
          return;
        }
        throw new Error('Failed to load');
      }

      const data = await response.json();
      setReferrals(data.referrals || []);
      setCommissions(data.commissions || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getEarningsForUser = (userEmail: string) => {
    return commissions
      .filter(c => c.user_email === userEmail)
      .reduce((sum, c) => sum + c.amount, 0);
  };

  const filteredReferrals = referrals.filter(ref =>
    ref.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ref.user_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const totalReferrals = referrals.length;
  const conversions = referrals.filter(r => r.status === 'converted').length;
  const trials = referrals.filter(r => r.status === 'trial').length;
  const totalEarnings = commissions.reduce((sum, c) => sum + c.amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-green-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl border border-blue-500/30">
            <Users className="w-6 h-6 text-blue-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">My Referred Users</h1>
        </div>
        <p className="text-gray-400">{totalReferrals} total users referred</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-5 bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-xl rounded-2xl border-2 border-blue-500/30 hover:border-blue-500/50 hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase">Total</span>
          </div>
          <div className="text-3xl font-black text-blue-400">{totalReferrals}</div>
        </div>
        <div className="p-5 bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-xl rounded-2xl border-2 border-yellow-500/30 hover:border-yellow-500/50 hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
              <Clock className="w-4 h-4 text-yellow-400" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase">In Trial</span>
          </div>
          <div className="text-3xl font-black text-yellow-400">{trials}</div>
        </div>
        <div className="p-5 bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-xl rounded-2xl border-2 border-green-500/30 hover:border-green-500/50 hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/30">
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase">Converted</span>
          </div>
          <div className="text-3xl font-black text-green-400">{conversions}</div>
        </div>
        <div className="p-5 bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-xl rounded-2xl border-2 border-emerald-500/30 hover:border-emerald-500/50 hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase">Earned</span>
          </div>
          <div className="text-3xl font-black text-emerald-400">${totalEarnings.toFixed(0)}</div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#1A2647]/40 backdrop-blur-xl rounded-2xl border-2 border-gray-700/30 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700/50 bg-[#0B1437]/50">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Referred Users ({filteredReferrals.length})
          </h3>
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0B1437] text-white rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none text-sm"
            />
          </div>
        </div>

        {filteredReferrals.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No users found</p>
            <p className="text-sm text-gray-500 mt-1">Share your referral link to start earning!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead>
                <tr className="bg-[#0B1437] border-b-2 border-gray-700/50">
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider" style={{ width: '8%' }}>#</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider" style={{ width: '30%' }}>User</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider" style={{ width: '14%' }}>Status</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider" style={{ width: '18%' }}>Signed Up</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider" style={{ width: '16%' }}>Commission</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider" style={{ width: '14%' }}>Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {filteredReferrals.map((ref, index) => {
                  const earnings = getEarningsForUser(ref.user_email);
                  const signupDate = ref.user_signup_date || ref.created_at;
                  
                  return (
                    <tr key={ref.id} className="hover:bg-[#1A2647]/60 transition-all">
                      <td className="px-4 py-4 text-center">
                        <span className="text-lg font-mono font-bold text-gray-500">
                          #{String(index + 1).padStart(3, '0')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white truncate">{ref.user_name || 'Unknown'}</div>
                        <div className="text-sm text-gray-400 truncate">{ref.user_email}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${
                          ref.status === 'converted'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : ref.status === 'trial'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : ref.status === 'churned'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                          {ref.status === 'converted' && <CheckCircle className="w-3 h-3" />}
                          {ref.status === 'trial' && <Clock className="w-3 h-3" />}
                          {ref.status === 'churned' && <XCircle className="w-3 h-3" />}
                          {ref.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-sm text-gray-300">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          {formatDate(signupDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          ref.commission_type === 'one_time'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                        }`}>
                          {ref.commission_type === 'one_time' ? '⚡ One-Time' : '🔄 Recurring'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-lg font-black ${earnings > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                          ${earnings.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
