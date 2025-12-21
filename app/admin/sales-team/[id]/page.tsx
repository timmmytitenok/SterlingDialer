'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  DollarSign,
  Loader2,
  CheckCircle,
  Clock,
  UserPlus,
  Search,
  X,
  Eye,
  ExternalLink,
} from 'lucide-react';

interface SalesPerson {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  referral_code: string;
  commission_type: 'recurring' | 'one_time';
  commission_rate: number;
  status: 'active' | 'inactive' | 'suspended';
  total_earnings: number;
  total_paid: number;
  pending_payout: number;
  total_users_referred: number;
  total_conversions: number;
  created_at: string;
}

interface Referral {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  status: string;
  lead_source: string;
  subscription_amount: number;
  commission_type: 'recurring' | 'one_time';
  created_at: string;
  user_signup_date: string;
}

interface Commission {
  id: string;
  amount: number;
  commission_type: string;
  status: string;
  month_year: string;
  user_email: string;
  created_at: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  has_active_subscription?: boolean;
}

export default function SalesPersonDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [salesPerson, setSalesPerson] = useState<SalesPerson | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Assign user modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [assigning, setAssigning] = useState(false);
  
  // Referral edit popup
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [showReferralMenu, setShowReferralMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  
  // Commission confirmation modal
  const [commissionToMark, setCommissionToMark] = useState<Commission | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/sales-team/${id}`);
      if (!response.ok) throw new Error('Failed to load');

      const data = await response.json();
      setSalesPerson(data.salesPerson);
      setReferrals(data.referrals || []);
      setCommissions(data.commissions || []);
      setAllUsers(data.allUsers || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateReferralCommissionType = async (referralId: string, type: 'recurring' | 'one_time') => {
    try {
      const response = await fetch('/api/admin/sales-team/referral/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralId, commission_type: type }),
      });

      if (!response.ok) throw new Error('Failed to update');
      
      // Update local state
      setReferrals(prev => prev.map(r => 
        r.id === referralId ? { ...r, commission_type: type } : r
      ));
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const confirmMarkPaid = async () => {
    if (!commissionToMark) return;
    
    setMarkingPaid(true);
    try {
      const response = await fetch(`/api/admin/sales-team/commissions/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionId: commissionToMark.id }),
      });

      if (!response.ok) throw new Error('Failed to mark as paid');
      
      setCommissionToMark(null);
      loadData();
      
      // Success toast
      const toast = document.createElement('div');
      toast.className = 'fixed top-8 right-8 bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50';
      toast.innerHTML = `✅ Commission of $${commissionToMark.amount.toFixed(2)} marked as paid`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setMarkingPaid(false);
    }
  };

  // Calculate commission totals
  const totalPaidAmount = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0);
  const totalPendingAmount = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);
  const pendingCount = commissions.filter(c => c.status === 'pending').length;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    };
  };

  const viewSalesDashboard = async () => {
    if (!salesPerson) return;
    
    try {
      // Set admin impersonation cookie
      const response = await fetch('/api/admin/sales-team/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          salesPersonId: salesPerson.id,
          salesPersonEmail: salesPerson.email,
          salesPersonName: salesPerson.full_name,
        }),
      });

      if (!response.ok) throw new Error('Failed to start impersonation');
      
      // Open sales dashboard in new tab
      window.open('/sales/dashboard', '_blank');
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const assignUser = async (user: User) => {
    setAssigning(true);
    try {
      const response = await fetch('/api/admin/sales-team/assign-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salesPersonId: id,
          userId: user.id,
          userEmail: user.email,
          userName: user.full_name,
        }),
      });

      if (!response.ok) throw new Error('Failed to assign user');
      
      setShowAssignModal(false);
      setSearchQuery('');
      loadData();
      
      // Show success toast
      const toast = document.createElement('div');
      toast.className = 'fixed top-8 right-8 bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50';
      toast.innerHTML = `✅ ${user.full_name || user.email} assigned to ${salesPerson?.full_name}`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setAssigning(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleReferralDoubleClick = (referral: Referral, event: React.MouseEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPosition({ 
      x: Math.min(rect.left + rect.width / 2, window.innerWidth - 200), 
      y: rect.top + window.scrollY - 10
    });
    setSelectedReferral(referral);
    setShowReferralMenu(true);
  };

  const unassignUser = async (referralId: string) => {
    try {
      const response = await fetch('/api/admin/sales-team/referral/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralId }),
      });

      if (!response.ok) throw new Error('Failed to unassign');
      
      setShowReferralMenu(false);
      setSelectedReferral(null);
      loadData();
      
      // Show success toast
      const toast = document.createElement('div');
      toast.className = 'fixed top-8 right-8 bg-orange-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50';
      toast.innerHTML = `✅ User unassigned successfully`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showReferralMenu) {
        const menu = document.getElementById('referral-edit-menu');
        if (menu && !menu.contains(e.target as Node)) {
          setShowReferralMenu(false);
          setSelectedReferral(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showReferralMenu]);

  // Filter users by search (API already excludes assigned users)
  const availableUsers = searchQuery.trim() === '' 
    ? allUsers 
    : allUsers.filter(u => 
        (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
      );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-16 h-16 text-green-500 animate-spin" />
      </div>
    );
  }

  if (!salesPerson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Sales Person Not Found</h2>
          <button
            onClick={() => router.push('/admin/sales-team')}
            className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold"
          >
            Back to Sales Team
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          {/* Back Button */}
          <button
            onClick={() => router.push('/admin/sales-team')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 group transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Sales Team</span>
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar/Icon */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                <span className="text-2xl font-black text-white">
                  {salesPerson.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'SP'}
                </span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-1">{salesPerson.full_name}</h1>
                <p className="text-gray-400">{salesPerson.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* View Dashboard Button */}
              <button
                onClick={() => viewSalesDashboard()}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 hover:from-cyan-600/30 hover:to-blue-600/30 text-cyan-400 border-2 border-cyan-500/30 hover:border-cyan-500/50 rounded-xl font-bold transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20"
              >
                <Eye className="w-4 h-4" />
                View Dashboard
                <ExternalLink className="w-3 h-3" />
              </button>
              {/* Status Badge */}
              <div className="px-5 py-2.5 bg-green-500/10 border-2 border-green-500/30 rounded-xl">
                <span className="text-green-300 font-bold">Sales Member</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Users Referred */}
          <div className="p-6 bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-xl rounded-2xl border-2 border-blue-500/30 hover:border-blue-500/50 hover:scale-[1.03] hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 cursor-default">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/30">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-xs font-bold text-gray-400 uppercase">Users Referred</div>
            </div>
            <div className="text-4xl font-black text-blue-400 mb-1">{salesPerson.total_users_referred}</div>
            <div className="text-xs text-gray-400">total referrals</div>
          </div>

          {/* Conversions */}
          <div className="p-6 bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-xl rounded-2xl border-2 border-green-500/30 hover:border-green-500/50 hover:scale-[1.03] hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300 cursor-default">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/30">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div className="text-xs font-bold text-gray-400 uppercase">Conversions</div>
            </div>
            <div className="text-4xl font-black text-green-400 mb-1">{salesPerson.total_conversions}</div>
            <div className="text-xs text-gray-400">paying users</div>
          </div>

          {/* Total Earned */}
          <div className="p-6 bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-xl rounded-2xl border-2 border-emerald-500/30 hover:border-emerald-500/50 hover:scale-[1.03] hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 cursor-default">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="text-xs font-bold text-gray-400 uppercase">Total Earned</div>
            </div>
            <div className="text-4xl font-black text-emerald-400 mb-1">${salesPerson.total_earnings.toLocaleString()}</div>
            <div className="text-xs text-gray-400">lifetime earnings</div>
          </div>

          {/* Pending Payout */}
          <div className="p-6 bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-xl rounded-2xl border-2 border-yellow-500/30 hover:border-yellow-500/50 hover:scale-[1.03] hover:shadow-xl hover:shadow-yellow-500/20 transition-all duration-300 cursor-default">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="text-xs font-bold text-gray-400 uppercase">Pending Payout</div>
            </div>
            <div className="text-4xl font-black text-yellow-400 mb-1">${salesPerson.pending_payout.toLocaleString()}</div>
            <div className="text-xs text-gray-400">awaiting payment</div>
          </div>
        </div>

        {/* Referred Users */}
        <div className="bg-[#1A2647]/40 backdrop-blur-xl rounded-2xl border-2 border-gray-700/30 overflow-hidden shadow-2xl mb-6">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-700/50 bg-[#0B1437]/50">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Referred Users ({referrals.length})
              </h3>
              {referrals.length > 0 && (
                <p className="text-xs text-gray-500 mt-1 ml-7">Double-click a user to edit commission type or unassign</p>
              )}
            </div>
            <button
              onClick={() => setShowAssignModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded-xl hover:bg-green-600/30 transition-all font-semibold"
            >
              <UserPlus className="w-4 h-4" />
              Assign User
            </button>
          </div>

          {referrals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No referred users yet</p>
              <p className="text-sm text-gray-500 mt-1">Click "Assign User" to add users to this sales person</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="bg-[#0B1437] border-b-2 border-gray-700/50">
                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider" style={{ width: '8%' }}>#</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider" style={{ width: '30%' }}>User</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider" style={{ width: '17%' }}>Status</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider" style={{ width: '20%' }}>Signed Up</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider" style={{ width: '25%' }}>Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {referrals.map((ref, index) => (
                    <tr 
                      key={ref.id} 
                      className="hover:bg-[#1A2647]/60 transition-all cursor-pointer group"
                      onDoubleClick={(e) => handleReferralDoubleClick(ref, e)}
                      title="Double-click to edit"
                    >
                      <td className="px-4 py-4 text-center">
                        <span className="text-lg font-mono font-bold text-gray-500 group-hover:text-cyan-400 transition-colors">
                          #{String(index + 1).padStart(3, '0')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white group-hover:text-cyan-300 transition-colors">{ref.user_name || 'Unknown'}</div>
                        <div className="text-sm text-gray-400 truncate">{ref.user_email}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                          ref.status === 'converted'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : ref.status === 'trial'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : ref.status === 'churned'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                          {ref.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-400">
                        {formatDate(ref.user_signup_date || ref.created_at)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                          ref.commission_type === 'one_time'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                            : 'bg-green-500/20 text-green-400 border border-green-500/40'
                        }`}>
                          {ref.commission_type === 'one_time' ? '⚡ One-Time' : '🔄 Recurring'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Commissions */}
        <div className="bg-[#1A2647]/40 backdrop-blur-xl rounded-2xl border-2 border-gray-700/30 overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-700/50 bg-[#0B1437]/50">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                Commissions ({commissions.length})
              </h3>
            </div>
            <div className="flex items-center gap-3">
              {/* Total Paid Badge */}
              <div className="px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-xl">
                <div className="text-[10px] text-gray-400 uppercase font-bold">Total Paid</div>
                <div className="text-lg font-black text-green-400">${totalPaidAmount.toFixed(2)}</div>
              </div>
              {/* Pending Badge */}
              <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <div className="text-[10px] text-gray-400 uppercase font-bold">Pending ({pendingCount})</div>
                <div className="text-lg font-black text-yellow-400">${totalPendingAmount.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {commissions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No commissions yet</p>
              <p className="text-sm text-gray-500 mt-1">Commissions will appear when referred users make payments</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="bg-[#0B1437] border-b-2 border-gray-700/50">
                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider" style={{ width: '6%' }}>#</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider" style={{ width: '24%' }}>User</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider" style={{ width: '14%' }}>Amount</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider" style={{ width: '18%' }}>Date & Time</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider" style={{ width: '12%' }}>Type</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider" style={{ width: '10%' }}>Status</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider" style={{ width: '16%' }}>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {commissions.map((comm, index) => {
                    const dt = formatDateTime(comm.created_at);
                    return (
                      <tr key={comm.id} className="hover:bg-[#1A2647]/60 transition-all">
                        <td className="px-4 py-4 text-center">
                          <span className="text-lg font-mono font-bold text-gray-500">
                            #{String(index + 1).padStart(3, '0')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white truncate">{comm.user_email}</div>
                          <div className="text-xs text-gray-500">{comm.month_year || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xl font-black text-green-400">${comm.amount.toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="text-sm text-white">{dt.date}</div>
                          <div className="text-xs text-gray-500">{dt.time}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                            comm.commission_type === 'one_time'
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                              : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                          }`}>
                            {comm.commission_type === 'one_time' ? '⚡ One-Time' : '🔄 Recurring'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                            comm.status === 'paid'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : comm.status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {comm.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {comm.status === 'pending' ? (
                            <button
                              onClick={() => setCommissionToMark(comm)}
                              className="px-4 py-2 bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 text-green-400 border border-green-500/30 rounded-xl text-xs font-bold transition-all hover:scale-105"
                            >
                              Mark Paid
                            </button>
                          ) : (
                            <span className="text-xs text-gray-500">—</span>
                          )}
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

      {/* Assign User Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#1A2647] to-[#0F1629] rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-green-500/30 shadow-2xl shadow-green-500/10">
            <div className="p-6 border-b border-gray-700/50 flex items-center justify-between bg-gradient-to-r from-green-500/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <UserPlus className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Assign User to {salesPerson.full_name}</h3>
              </div>
              <button
                onClick={() => { setShowAssignModal(false); setSearchQuery(''); }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-700/50">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-[#0B1437] text-white rounded-xl border border-gray-700 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
                />
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[50vh]">
              {availableUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {searchQuery 
                    ? 'No users found matching your search' 
                    : 'No users found in your app'}
                </div>
              ) : (
                <div className="divide-y divide-gray-700/30">
                  {availableUsers.slice(0, 50).map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 hover:bg-green-500/5 transition-all duration-200 group"
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-white group-hover:text-green-300 transition-colors">
                          {user.full_name || 'No Name'}
                        </div>
                        <div className="text-sm text-gray-400">{user.email}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Joined {formatDate(user.created_at)}
                        </div>
                      </div>
                      <button
                        onClick={() => assignUser(user)}
                        disabled={assigning}
                        className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-green-500/30"
                      >
                        {assigning ? 'Assigning...' : 'Assign'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Referral Edit Popup Menu */}
      {showReferralMenu && selectedReferral && (
        <div
          id="referral-edit-menu"
          className="fixed z-[9999]"
          style={{
            left: `${menuPosition.x}px`,
            top: `${menuPosition.y}px`,
            transform: 'translate(-50%, -100%)',
            animation: 'popupSlideIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          }}
        >
          <style jsx>{`
            @keyframes popupSlideIn {
              0% {
                opacity: 0;
                transform: translate(-50%, -90%) scale(0.9);
              }
              100% {
                opacity: 1;
                transform: translate(-50%, -100%) scale(1);
              }
            }
          `}</style>
          <div className="bg-gradient-to-br from-[#1A2647] to-[#0F1629] rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 overflow-hidden min-w-[280px] backdrop-blur-xl">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-700/50 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
              <div className="font-bold text-white text-sm">{selectedReferral.user_name || 'Unknown User'}</div>
              <div className="text-xs text-gray-400">{selectedReferral.user_email}</div>
            </div>
            
            {/* Commission Type Section */}
            <div className="p-3 border-b border-gray-700/30">
              <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Commission Type</div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    updateReferralCommissionType(selectedReferral.id, 'recurring');
                    setSelectedReferral({ ...selectedReferral, commission_type: 'recurring' });
                  }}
                  className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                    selectedReferral.commission_type !== 'one_time'
                      ? 'bg-green-500/20 text-green-400 border-2 border-green-500/50 shadow-lg shadow-green-500/20'
                      : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-green-500/30 hover:text-green-400'
                  }`}
                >
                  🔄 Recurring
                </button>
                <button
                  onClick={() => {
                    updateReferralCommissionType(selectedReferral.id, 'one_time');
                    setSelectedReferral({ ...selectedReferral, commission_type: 'one_time' });
                  }}
                  className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                    selectedReferral.commission_type === 'one_time'
                      ? 'bg-purple-500/20 text-purple-400 border-2 border-purple-500/50 shadow-lg shadow-purple-500/20'
                      : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-purple-500/30 hover:text-purple-400'
                  }`}
                >
                  ⚡ One-Time
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="p-3">
              <button
                onClick={() => unassignUser(selectedReferral.id)}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-red-600/20 to-orange-600/20 hover:from-red-600/30 hover:to-orange-600/30 text-red-400 rounded-xl font-bold text-sm transition-all duration-200 border border-red-500/30 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/20 flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Unassign User
              </button>
            </div>

            {/* Close hint */}
            <div className="px-4 py-2 bg-gray-900/50 border-t border-gray-700/30">
              <div className="text-[10px] text-gray-500 text-center">Click outside to close</div>
            </div>
          </div>
          
          {/* Arrow pointer */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 bg-[#1A2647] border-b border-r border-cyan-500/30 rotate-45"></div>
        </div>
      )}

      {/* Mark as Paid Confirmation Modal */}
      {commissionToMark && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div 
            className="bg-gradient-to-br from-[#1A2647] to-[#0F1629] rounded-2xl w-full max-w-md overflow-hidden border border-green-500/30 shadow-2xl shadow-green-500/10"
            style={{ animation: 'popupSlideIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
          >
            <style jsx>{`
              @keyframes popupSlideIn {
                0% { opacity: 0; transform: scale(0.9); }
                100% { opacity: 1; transform: scale(1); }
              }
            `}</style>
            
            {/* Header */}
            <div className="p-6 border-b border-gray-700/50 bg-gradient-to-r from-green-500/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Confirm Payment</h3>
                  <p className="text-sm text-gray-400">Mark this commission as paid</p>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <div className="bg-[#0B1437]/50 rounded-xl p-4 border border-gray-700/30 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-sm">Amount</span>
                  <span className="text-2xl font-black text-green-400">${commissionToMark.amount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">User</span>
                  <span className="text-white font-medium">{commissionToMark.user_email}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Period</span>
                  <span className="text-gray-300">{commissionToMark.month_year || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Type</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    commissionToMark.commission_type === 'one_time'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    {commissionToMark.commission_type === 'one_time' ? '⚡ One-Time' : '🔄 Recurring'}
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-gray-400 text-center mb-6">
                Are you sure you want to mark this commission as paid? This action will update the sales person's payout records.
              </p>
              
              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setCommissionToMark(null)}
                  disabled={markingPaid}
                  className="flex-1 px-4 py-3 bg-gray-700/50 hover:bg-gray-700/70 text-gray-300 rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmMarkPaid}
                  disabled={markingPaid}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {markingPaid ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Confirm Payment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
