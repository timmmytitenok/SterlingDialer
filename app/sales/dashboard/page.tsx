'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  Copy,
  Check,
  Loader2,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Repeat,
  ChevronDown,
  UserCheck,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SalesPerson {
  id: string;
  full_name: string;
  email: string;
  referral_code: string;
  commission_type: string;
  commission_rate: number;
  total_earnings: number;
  total_paid: number;
  pending_payout: number;
  total_users_referred: number;
  total_conversions: number;
  dashboard_stat?: string;
}

interface Commission {
  id: string;
  amount: number;
  status: string;
  month_year: string;
  user_email: string;
  created_at: string;
}

interface Referral {
  id: string;
  status: string;
  subscription_amount: number;
  created_at: string;
}

export default function SalesDashboardPage() {
  const router = useRouter();
  const [salesPerson, setSalesPerson] = useState<SalesPerson | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Secondary stat selector (like main dashboard)
  const [secondaryStat, setSecondaryStat] = useState<'pending' | 'conversions' | 'rate' | 'recurring' | 'active'>('pending');
  const [showStatDropdown, setShowStatDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  
  // Chart time period
  const [chartPeriod, setChartPeriod] = useState<'7days' | '30days' | '12months'>('30days');

  // Load saved stat preference from database (set in loadDashboard)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Don't close if clicking inside the dropdown button or menu
      if (dropdownRef.current?.contains(target) || dropdownMenuRef.current?.contains(target)) {
        return;
      }
      setShowStatDropdown(false);
    };

    if (showStatDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStatDropdown]);

  // Save stat preference when changed - save to database
  const handleStatChange = async (stat: typeof secondaryStat) => {
    setSecondaryStat(stat);
    setShowStatDropdown(false);
    
    // Save to database
    const session = localStorage.getItem('sales_session');
    if (session) {
      const parsed = JSON.parse(session);
      try {
        await fetch('/api/sales/update-preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            salesId: parsed.id, 
            dashboard_stat: stat 
          }),
        });
      } catch (error) {
        console.error('Failed to save preference:', error);
      }
    }
  };

  const [isAdminViewing, setIsAdminViewing] = useState(false);

  useEffect(() => {
    // Check for admin impersonation first
    checkImpersonation();
  }, [router]);

  const checkImpersonation = async () => {
    try {
      // Try to get impersonation session
      const response = await fetch('/api/sales/check-impersonation');
      const data = await response.json();
      
      if (data.impersonating) {
        // Admin is viewing this dashboard
        setIsAdminViewing(true);
        loadDashboard(data.salesPersonId);
        return;
      }
    } catch (error) {
      console.log('No impersonation session');
    }

    // Normal sales login flow
    const session = localStorage.getItem('sales_session');
    if (!session) {
      router.push('/sales/login');
      return;
    }

    const parsed = JSON.parse(session);
    loadDashboard(parsed.id);
  };

  const loadDashboard = async (salesId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sales/dashboard?id=${salesId}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('sales_session');
          router.push('/sales/login');
          return;
        }
        throw new Error('Failed to load dashboard');
      }

      const data = await response.json();
      setSalesPerson(data.salesPerson);
      setCommissions(data.commissions || []);
      setReferrals(data.referrals || []);
      
      // Load saved stat preference from database
      if (data.salesPerson?.dashboard_stat && ['pending', 'conversions', 'rate', 'recurring', 'active'].includes(data.salesPerson.dashboard_stat)) {
        setSecondaryStat(data.salesPerson.dashboard_stat);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (!salesPerson) return;
    const link = `${window.location.origin}/signup?ref=${salesPerson.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Calculate stats based on time period
  const getChartData = () => {
    const now = new Date();
    const data: { label: string; amount: number }[] = [];
    
    if (chartPeriod === '7days') {
      // Last 7 days - daily data
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayTotal = commissions
          .filter(c => c.created_at.startsWith(dateStr))
          .reduce((sum, c) => sum + c.amount, 0);
        
        data.push({
          label: date.toLocaleDateString('en-US', { weekday: 'short' }),
          amount: dayTotal,
        });
      }
    } else if (chartPeriod === '30days') {
      // Last 30 days - daily data (grouped by ~5 days for readability)
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayTotal = commissions
          .filter(c => c.created_at.startsWith(dateStr))
          .reduce((sum, c) => sum + c.amount, 0);
        
        // Show every 5th day label for readability
        const showLabel = i % 5 === 0 || i === 29;
        data.push({
          label: showLabel ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
          amount: dayTotal,
        });
      }
    } else {
      // Last 12 months - monthly data
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        const monthTotal = commissions
          .filter(c => (c.month_year || c.created_at.substring(0, 7)) === monthStr)
          .reduce((sum, c) => sum + c.amount, 0);
        
        data.push({
          label: date.toLocaleDateString('en-US', { month: 'short' }),
          amount: monthTotal,
        });
      }
    }
    
    return data;
  };
  
  // Get total for selected period
  const getPeriodTotal = () => {
    const now = new Date();
    let startDate: Date;
    
    if (chartPeriod === '7days') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (chartPeriod === '30days') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
    } else {
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    
    return commissions
      .filter(c => new Date(c.created_at) >= startDate)
      .reduce((sum, c) => sum + c.amount, 0);
  };

  // Get current month and last month data
  const getCurrentMonthRevenue = () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return commissions
      .filter(c => (c.month_year || c.created_at.substring(0, 7)) === currentMonth)
      .reduce((sum, c) => sum + c.amount, 0);
  };

  const getLastMonthRevenue = () => {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    const lastMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return commissions
      .filter(c => (c.month_year || c.created_at.substring(0, 7)) === lastMonth)
      .reduce((sum, c) => sum + c.amount, 0);
  };

  // Monthly recurring revenue (from active converted users)
  const getMonthlyRecurring = () => {
    const activeCustomers = referrals.filter(r => r.status === 'converted').length;
    // Assuming $379 subscription * 35% commission
    return activeCustomers * 379 * (salesPerson?.commission_rate || 0.35);
  };

  // Active customers (converted and still active)
  const getActiveCustomers = () => {
    return referrals.filter(r => r.status === 'converted').length;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-green-400 animate-spin" />
      </div>
    );
  }

  if (!salesPerson) {
    return null;
  }

  const conversionRate = salesPerson.total_users_referred > 0 
    ? ((salesPerson.total_conversions / salesPerson.total_users_referred) * 100).toFixed(1)
    : '0.0';

  const currentMonthRev = getCurrentMonthRevenue();
  const lastMonthRev = getLastMonthRevenue();
  const monthOverMonthChange = lastMonthRev > 0 
    ? (((currentMonthRev - lastMonthRev) / lastMonthRev) * 100).toFixed(0)
    : currentMonthRev > 0 ? '100' : '0';
  const isPositiveChange = parseFloat(monthOverMonthChange) >= 0;

  // Secondary stat options
  const statOptions = {
    pending: { label: 'Pending Payout', value: `$${salesPerson.pending_payout.toLocaleString()}`, icon: Clock, color: 'yellow' },
    conversions: { label: 'Total Conversions', value: salesPerson.total_conversions.toString(), icon: CheckCircle, color: 'green' },
    rate: { label: 'Conversion Rate', value: `${conversionRate}%`, icon: Percent, color: 'purple' },
    recurring: { label: 'Monthly Recurring', value: `$${getMonthlyRecurring().toLocaleString()}`, icon: Repeat, color: 'blue' },
    active: { label: 'Active Customers', value: getActiveCustomers().toString(), icon: UserCheck, color: 'emerald' },
  };

  const currentStat = statOptions[secondaryStat];

  const colorClasses: Record<string, { border: string; bg: string; text: string; iconBg: string }> = {
    yellow: { border: 'border-yellow-500/30', bg: 'from-yellow-500/5 to-amber-500/5', text: 'text-yellow-400', iconBg: 'bg-yellow-500/20' },
    green: { border: 'border-green-500/30', bg: 'from-green-500/5 to-emerald-500/5', text: 'text-green-400', iconBg: 'bg-green-500/20' },
    purple: { border: 'border-purple-500/30', bg: 'from-purple-500/5 to-pink-500/5', text: 'text-purple-400', iconBg: 'bg-purple-500/20' },
    blue: { border: 'border-blue-500/30', bg: 'from-blue-500/5 to-indigo-500/5', text: 'text-blue-400', iconBg: 'bg-blue-500/20' },
    emerald: { border: 'border-emerald-500/30', bg: 'from-emerald-500/5 to-teal-500/5', text: 'text-emerald-400', iconBg: 'bg-emerald-500/20' },
  };

  const exitAdminView = async () => {
    await fetch('/api/admin/sales-team/impersonate', { method: 'DELETE' });
    window.close();
  };

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8">
      {/* Admin Viewing Banner */}
      {isAdminViewing && (
        <div className="mb-6 p-4 bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border-2 border-cyan-500/40 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-cyan-300">👁️ Admin Viewing Mode</div>
              <div className="text-xs text-gray-400">You are viewing {salesPerson.full_name}'s dashboard</div>
            </div>
          </div>
          <button
            onClick={exitAdminView}
            className="px-4 py-2 bg-gray-700/50 hover:bg-gray-700/70 text-gray-300 rounded-xl text-sm font-semibold transition-all"
          >
            Exit View
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
            <DollarSign className="w-6 h-6 text-green-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Welcome back, {salesPerson.full_name.split(' ')[0]}! 👋
          </h1>
        </div>
        <p className="text-gray-400">Track your earnings and performance</p>
      </div>

      {/* Top 2 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Total Commission Earned - Main Card */}
        <div className="group relative bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30 hover:border-green-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2.5 bg-green-500/20 rounded-xl">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Total Commission Earned</span>
            </div>
            <div className="text-4xl md:text-5xl font-black text-green-400">
              ${salesPerson.total_earnings.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Customizable Secondary Stat Card */}
        <div className={`group relative bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-sm rounded-2xl p-6 border ${colorClasses[currentStat.color].border} hover:border-opacity-70 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-${currentStat.color}-500/10`}>
          <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[currentStat.color].bg} rounded-2xl opacity-50 group-hover:opacity-100 transition-opacity`} />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`p-2.5 ${colorClasses[currentStat.color].iconBg} rounded-xl`}>
                  <currentStat.icon className={`w-5 h-5 ${colorClasses[currentStat.color].text}`} />
                </div>
                <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">{currentStat.label}</span>
              </div>
              {/* Dropdown Toggle */}
              <div ref={dropdownRef}>
                <button
                  onClick={() => setShowStatDropdown(!showStatDropdown)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showStatDropdown ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
            <div className={`text-4xl md:text-5xl font-black ${colorClasses[currentStat.color].text}`}>
              {currentStat.value}
            </div>
          </div>
        </div>
      </div>
      
      {/* Dropdown Menu - Rendered at root level with fixed positioning */}
      {showStatDropdown && (
        <>
          <div 
            className="fixed inset-0 z-[99998]" 
            onClick={() => setShowStatDropdown(false)}
          />
          <div 
            ref={dropdownMenuRef}
            className="fixed z-[99999] w-56 bg-[#0D1526] border border-gray-600 rounded-xl shadow-2xl overflow-hidden"
            style={{
              top: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().bottom + 8 : 0,
              left: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().right - 224 : 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {Object.entries(statOptions).map(([key, option]) => (
              <button
                key={key}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleStatChange(key as typeof secondaryStat);
                }}
                className={`w-full px-4 py-3 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2 ${
                  secondaryStat === key ? 'bg-green-500/20 text-white' : 'text-gray-400'
                }`}
              >
                <option.icon className="w-4 h-4" />
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Earnings Chart */}
      <div className="group bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Earnings Over Time</h3>
              <p className="text-sm text-gray-400">
                Total: <span className="text-green-400 font-bold">${getPeriodTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </p>
            </div>
          </div>
          
          {/* Time Period Toggle */}
          <div className="flex items-center gap-2 bg-[#0B1437] rounded-xl p-1 border border-gray-700/50">
            <button
              onClick={() => setChartPeriod('7days')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                chartPeriod === '7days' 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setChartPeriod('30days')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                chartPeriod === '30days' 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setChartPeriod('12months')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                chartPeriod === '12months' 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              12 Months
            </button>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={getChartData()}>
            <defs>
              <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="label" stroke="#6B7280" fontSize={12} />
            <YAxis stroke="#6B7280" fontSize={12} tickFormatter={(v) => `$${v}`} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1A2647',
                border: '1px solid #374151',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}
              formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Earned']}
              labelFormatter={(label) => label || 'Day'}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#10B981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorEarnings)"
            />
          </AreaChart>
        </ResponsiveContainer>
        
        {commissions.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0F1629]/80 rounded-2xl">
            <div className="text-center">
              <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-lg">No earnings data yet</p>
              <p className="text-gray-600 text-sm mt-1">Start referring users to see your earnings!</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Stats Grid - Row 1: Total Earned, Pending, Active Users, Monthly Recurring */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Total Money Earned */}
        <div className="group relative bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-sm rounded-2xl p-5 border border-green-500/30 hover:border-green-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <DollarSign className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase">Total Earned</span>
            </div>
            <div className="text-2xl font-black text-green-400">${salesPerson.total_earnings.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">All-time earnings</p>
          </div>
        </div>

        {/* Pending Commission */}
        <div className="group relative bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-sm rounded-2xl p-5 border border-yellow-500/30 hover:border-yellow-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-yellow-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-amber-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Clock className="w-4 h-4 text-yellow-400" />
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase">Pending</span>
            </div>
            <div className="text-2xl font-black text-yellow-400">${salesPerson.pending_payout.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting payout</p>
          </div>
        </div>

        {/* Active Users */}
        <div className="group relative bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-sm rounded-2xl p-5 border border-emerald-500/30 hover:border-emerald-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <UserCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase">Active Users</span>
            </div>
            <div className="text-2xl font-black text-emerald-400">{getActiveCustomers()}</div>
            <p className="text-xs text-gray-500 mt-1">Paying subscribers</p>
          </div>
        </div>

        {/* Monthly Recurring Revenue */}
        <div className="group relative bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-sm rounded-2xl p-5 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Repeat className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase">Monthly Recurring</span>
            </div>
            <div className="text-2xl font-black text-purple-400">${getMonthlyRecurring().toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Expected monthly</p>
          </div>
        </div>
      </div>

      {/* Row 2: Users Referred, Converted Users, Conversion Rate */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Total Users Referred */}
        <div className="group relative bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-sm rounded-2xl p-5 border border-blue-500/30 hover:border-blue-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase">Users Referred</span>
            </div>
            <div className="text-2xl font-black text-blue-400">{salesPerson.total_users_referred}</div>
            <p className="text-xs text-gray-500 mt-1">Total sign-ups</p>
          </div>
        </div>

        {/* Converted Users */}
        <div className="group relative bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-sm rounded-2xl p-5 border border-green-500/30 hover:border-green-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase">Converted</span>
            </div>
            <div className="text-2xl font-black text-green-400">{salesPerson.total_conversions}</div>
            <p className="text-xs text-gray-500 mt-1">Paying users</p>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="group relative bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-sm rounded-2xl p-5 border border-orange-500/30 hover:border-orange-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Percent className="w-4 h-4 text-orange-400" />
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase">Conversion Rate</span>
            </div>
            <div className="text-2xl font-black text-orange-400">{conversionRate}%</div>
            <p className="text-xs text-gray-500 mt-1">Success rate</p>
          </div>
        </div>
      </div>

      {/* Referral Link Card */}
      <div className="group bg-gradient-to-br from-green-900/30 to-emerald-900/20 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30 hover:border-green-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Copy className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-lg font-bold">Your Referral Link</h3>
            </div>
            <code className="block p-3 bg-[#0B1437] text-green-400 rounded-xl font-mono text-sm break-all border border-green-500/20 max-w-xl">
              {typeof window !== 'undefined' ? `${window.location.origin}/signup?ref=${salesPerson.referral_code}` : ''}
            </code>
          </div>
          <button
            onClick={copyReferralLink}
            className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-500 hover:via-green-500 hover:to-teal-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-green-500/25 hover:scale-[1.02] whitespace-nowrap"
          >
            {copiedLink ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copiedLink ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>
    </div>
  );
}
