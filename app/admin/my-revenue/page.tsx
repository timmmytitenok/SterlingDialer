'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminStatCard } from '@/components/admin/admin-stat-card';
import { DollarSign, TrendingUp, Wallet, CreditCard, Calendar, Loader2, Users, Phone, CheckCircle, LogOut } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type ChartView = 'total' | 'minutes' | 'subscriptions';
type HeroView = 'revenue' | 'profit' | 'expense';
type TimeRange = '7days' | '30days' | '12months';

// Animated Counter Component - COUNTS UP/DOWN FRAME BY FRAME
const AnimatedCounter = ({ value, duration = 1000 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    const startValue = prevValue.current;
    const endValue = value;

    if (startValue === endValue) return;

    const startTime = Date.now();
    const diff = endValue - startValue;

    const tick = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startValue + diff * ease;

      setCount(current);
      prevValue.current = current;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setCount(endValue);
        prevValue.current = endValue;
      }
    };

    requestAnimationFrame(tick);
  }, [value, duration]);

  return <>${Math.round(count).toLocaleString()}</>;
};

interface RevenueData {
  allTime: {
    subscriptionRevenue: number;
    minutesRevenue: number;
    totalRevenue: number;
    totalProfit: number;
    totalExpenses: number;
    totalSubMonths: number;
    directSubMonths: number;
    referredSubMonths: number;
    totalRefills: number;
    commissionsPaid: number;
  };
  today: {
    minutesRevenue: number;
    subscriptionRevenue: number;
    totalRevenue: number;
  };
  last7Days: {
    minutesRevenue: number;
    subscriptionRevenue: number;
    totalRevenue: number;
  };
  last30Days: {
    minutesRevenue: number;
    subscriptionRevenue: number;
    totalRevenue: number;
  };
  charts: {
    last7Days: Array<{ date: string; minutesRevenue: number; subscriptionRevenue: number; totalRevenue: number }>;
    last30Days: Array<{ date: string; minutesRevenue: number; subscriptionRevenue: number; totalRevenue: number }>;
    last12Months: Array<{ date: string; minutesRevenue: number; subscriptionRevenue: number; totalRevenue: number }>;
  };
  users: {
    total: number;
    proAccess: number;
    conversionRate: string;
    avgRevenuePerUser: string;
  };
  calls: {
    today: {
      total: number;
      connected: number;
      connectionRate: string;
      appointments: number;
    };
    allTime: {
      total: number;
      appointments: number;
      callsPerAppointment: string;
    };
  };
}

export default function AdminRevenuePage() {
  const router = useRouter();
  const supabase = createClient();
  const [chartView, setChartView] = useState<ChartView>('total');
  const [heroView, setHeroView] = useState<HeroView>('revenue');
  const [timeRange, setTimeRange] = useState<TimeRange>('30days');
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);

  useEffect(() => {
    setMounted(true);
    loadRevenueData();
  }, []);

  const loadRevenueData = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching revenue data from API...');
      const response = await fetch('/api/admin/revenue-stats', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.error || `Failed to fetch revenue data (${response.status})`);
      }
      
      const data = await response.json();
      console.log('✅ Revenue data loaded successfully:', data);
      setRevenueData(data);
    } catch (error: any) {
      console.error('❌ Error loading revenue data:', error.message || error);
      alert(`Failed to load revenue data: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/signup');
  };
  
  // Use real data from API
  const allTimeMinutesRevenue = revenueData?.allTime.minutesRevenue || 0;
  const allTimeSubscriptionRevenue = revenueData?.allTime.subscriptionRevenue || 0;
  const allTimeTotal = revenueData?.allTime.totalRevenue || 0;

  // PROFIT CALCULATIONS (from real data)
  const totalMonthlySubscriptions = revenueData?.allTime.totalSubMonths || 0;
  const directMonths = revenueData?.allTime.directSubMonths || 0;
  const referredMonths = revenueData?.allTime.referredSubMonths || 0;
  const allTimeCommissionsPaid = revenueData?.allTime.commissionsPaid || 0;
  
  // Subscription profit: $484 per direct month, $384 per referred month
  const allTimeSubscriptionProfit = (directMonths * 484) + (referredMonths * 384);
  
  // CALL MINUTES
  const minuteRefills = revenueData?.allTime.totalRefills || 0;
  const allTimeMinutesProfit = minuteRefills * 14.25; // $14.25 profit per refill
  const allTimeMinutesExpense = minuteRefills * 10.75; // $10.75 expense per refill
  
  // TOTALS
  const allTimeProfit = revenueData?.allTime.totalProfit || 0;
  const allTimeExpenses = revenueData?.allTime.totalExpenses || 0;

  const todayMinutesRevenue = revenueData?.today.minutesRevenue || 0;
  const todaySubscriptionRevenue = revenueData?.today.subscriptionRevenue || 0;
  const todayTotal = revenueData?.today.totalRevenue || 0;

  const last7DaysMinutesRevenue = revenueData?.last7Days.minutesRevenue || 0;
  const last7DaysSubscriptionRevenue = revenueData?.last7Days.subscriptionRevenue || 0;
  const last7DaysTotal = revenueData?.last7Days.totalRevenue || 0;

  const last30DaysMinutesRevenue = revenueData?.last30Days.minutesRevenue || 0;
  const last30DaysSubscriptionRevenue = revenueData?.last30Days.subscriptionRevenue || 0;
  const last30DaysTotal = revenueData?.last30Days.totalRevenue || 0;

  // Real chart data from API
  const last7DaysData = revenueData?.charts.last7Days || [];
  const last30DaysData = revenueData?.charts.last30Days || [];
  const last12MonthsData = revenueData?.charts.last12Months || [];

  // Get current chart data based on time range
  const getChartData = () => {
    if (timeRange === '7days') return last7DaysData;
    if (timeRange === '30days') return last30DaysData;
    return last12MonthsData;
  };

  const chartData = getChartData();
  const maxRevenue = Math.max(...(last30DaysData.map(d => d.minutesRevenue + d.subscriptionRevenue) || [0]));

  const getHeroValue = () => {
    if (heroView === 'revenue') return allTimeTotal;
    if (heroView === 'profit') return allTimeProfit;
    return allTimeExpenses;
  };

  const getHeroColor = () => {
    if (heroView === 'revenue') return {
      gradient: 'from-emerald-900/40 via-green-900/40 to-teal-900/40',
      border: 'border-emerald-400/50',
      glow: 'from-emerald-500/20 to-teal-500/20',
      text: 'text-emerald-400',
      shadow: 'drop-shadow-[0_0_30px_rgba(16,185,129,0.9)]',
      label: 'Revenue',
      subtitle: 'What users pay',
    };
    if (heroView === 'profit') return {
      gradient: 'from-blue-900/40 via-cyan-900/40 to-blue-900/40',
      border: 'border-blue-400/50',
      glow: 'from-blue-500/20 to-cyan-500/20',
      text: 'text-blue-400',
      shadow: 'drop-shadow-[0_0_30px_rgba(59,130,246,0.9)]',
      label: 'Profit',
      subtitle: 'What you keep',
    };
    return {
      gradient: 'from-red-900/40 via-orange-900/40 to-red-900/40',
      border: 'border-red-400/50',
      glow: 'from-red-500/20 to-orange-500/20',
      text: 'text-red-400',
      shadow: 'drop-shadow-[0_0_30px_rgba(239,68,68,0.9)]',
      label: 'Expenses',
      subtitle: 'Cost of business',
    };
  };

  const heroColor = getHeroColor();

  return (
    <div className="min-h-screen p-3 md:p-8 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto">
        <AdminPageHeader
          title="💰 My Revenue"
          description="Track revenue, profits, and expenses across all sources"
        />

        {/* MASSIVE HERO CARD WITH ANIMATED SWITCHING */}
        <div 
          className="relative backdrop-blur-xl rounded-2xl md:rounded-3xl p-6 md:p-12 border-2 shadow-2xl overflow-hidden mb-6 md:mb-8 transition-all duration-700 ease-in-out"
          style={{
            backgroundImage: heroView === 'revenue' 
              ? 'linear-gradient(to bottom right, rgba(6, 78, 59, 0.4), rgba(5, 46, 22, 0.4), rgba(19, 78, 74, 0.4))'
              : heroView === 'profit'
              ? 'linear-gradient(to bottom right, rgba(30, 58, 138, 0.4), rgba(22, 78, 99, 0.4), rgba(30, 58, 138, 0.4))'
              : 'linear-gradient(to bottom right, rgba(127, 29, 29, 0.4), rgba(124, 45, 18, 0.4), rgba(127, 29, 29, 0.4))',
            borderColor: heroView === 'revenue'
              ? 'rgba(52, 211, 153, 0.5)'
              : heroView === 'profit'
              ? 'rgba(96, 165, 250, 0.5)'
              : 'rgba(248, 113, 113, 0.5)',
          }}
        >
          {/* Animated Glow Background */}
          <div 
            className="absolute inset-0 blur-3xl animate-pulse transition-all duration-700"
            style={{
              backgroundImage: heroView === 'revenue'
                ? 'linear-gradient(to right, rgba(16, 185, 129, 0.2), rgba(20, 184, 166, 0.2))'
                : heroView === 'profit'
                ? 'linear-gradient(to right, rgba(59, 130, 246, 0.2), rgba(34, 211, 238, 0.2))'
                : 'linear-gradient(to right, rgba(239, 68, 68, 0.2), rgba(249, 115, 22, 0.2))',
            }}
          />
          
            <div className="relative z-10">
            {/* Toggle Buttons */}
            <div className="flex justify-center gap-2 md:gap-3 mb-6 md:mb-8">
              <button
                onClick={() => setHeroView('revenue')}
                className={`px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl text-sm md:text-base font-bold transform transition-all duration-300 hover:scale-105 ${
                  heroView === 'revenue'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50 scale-110'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700 hover:text-white scale-100'
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setHeroView('profit')}
                className={`px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl text-sm md:text-base font-bold transform transition-all duration-300 hover:scale-105 ${
                  heroView === 'profit'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50 scale-110'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700 hover:text-white scale-100'
                }`}
              >
                Profit
              </button>
              <button
                onClick={() => setHeroView('expense')}
                className={`px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl text-sm md:text-base font-bold transform transition-all duration-300 hover:scale-105 ${
                  heroView === 'expense'
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/50 scale-110'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700 hover:text-white scale-100'
                }`}
              >
                Expense
              </button>
                </div>

            {/* Main Display */}
            <div className="text-center">
              <div 
                className="text-sm font-bold uppercase tracking-wider mb-3 transition-colors duration-700"
                style={{
                  color: heroView === 'revenue' ? '#34d399' : heroView === 'profit' ? '#60a5fa' : '#f87171'
                }}
              >
                {heroColor.label}
                </div>
              <div 
                className="text-5xl md:text-8xl font-black mb-3 md:mb-4 transition-all duration-700"
                style={{
                  color: heroView === 'revenue' ? '#34d399' : heroView === 'profit' ? '#60a5fa' : '#f87171',
                  filter: heroView === 'revenue' 
                    ? 'drop-shadow(0 0 30px rgba(16, 185, 129, 0.9))'
                    : heroView === 'profit'
                    ? 'drop-shadow(0 0 30px rgba(59, 130, 246, 0.9))'
                    : 'drop-shadow(0 0 30px rgba(239, 68, 68, 0.9))',
                }}
              >
                {loading ? (
                  <Loader2 className="w-16 h-16 md:w-20 md:h-20 animate-spin mx-auto" />
                ) : mounted ? (
                  <AnimatedCounter value={getHeroValue()} duration={1200} />
                ) : (
                  '$0'
                )}
              </div>
              <div className={`text-gray-400 text-lg transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                {heroColor.subtitle}
                {heroView === 'profit' && (
                  <span 
                    className="ml-3 font-semibold transition-colors duration-700"
                    style={{ color: '#60a5fa' }}
                  >
                    {((allTimeProfit / allTimeTotal) * 100).toFixed(1)}% margin
                  </span>
                )}
                {heroView === 'expense' && (
                  <span 
                    className="ml-3 font-semibold transition-colors duration-700"
                    style={{ color: '#f87171' }}
                  >
                    {((allTimeExpenses / allTimeTotal) * 100).toFixed(1)}% of revenue
                  </span>
                )}
              </div>
            </div>
            </div>
          </div>

        {/* REVENUE BREAKDOWN CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Subscription Revenue Card */}
          <div className="relative group">
            <div className="bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30 shadow-xl hover:shadow-2xl hover:border-blue-400/50 transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-5 h-5 text-blue-400" />
                <div className="text-xs font-bold text-gray-400 uppercase">Subscription Revenue</div>
              </div>
              <div className="text-3xl font-black text-blue-400 mb-2">
                {loading ? (
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                ) : (
                  `$${allTimeSubscriptionRevenue.toLocaleString()}`
                )}
              </div>
              <div className="text-xs text-gray-400">$484.03 profit per user/month</div>
            </div>
            
            {/* Tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 ease-out pointer-events-none z-50">
              <div className="bg-gray-900 border-2 border-blue-500/50 rounded-xl p-4 shadow-2xl shadow-blue-500/20 min-w-[250px] animate-in slide-in-from-top-2">
                <div className="text-xs font-bold text-blue-400 mb-3 uppercase">Breakdown</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Sub-Months Billed:</span>
                    <span className="text-white font-bold">{totalMonthlySubscriptions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price per month:</span>
                    <span className="text-white font-semibold">$499.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Stripe fee (3%):</span>
                    <span className="text-red-400">-$14.97</span>
                  </div>
                  <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between">
                    <span className="text-gray-400">Net per month:</span>
                    <span className="text-green-400 font-bold">$484.03</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call Minutes Revenue Card */}
          <div className="relative group">
            <div className="bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/30 shadow-xl hover:shadow-2xl hover:border-emerald-400/50 transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <div className="text-xs font-bold text-gray-400 uppercase">Call Minutes Revenue</div>
              </div>
              <div className="text-3xl font-black text-emerald-400 mb-2">
                {loading ? (
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                ) : (
                  `$${allTimeMinutesRevenue.toLocaleString()}`
                )}
              </div>
              <div className="text-xs text-gray-400">$14.25 profit per $25 refill</div>
            </div>
            
            {/* Tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 ease-out pointer-events-none z-50">
              <div className="bg-gray-900 border-2 border-emerald-500/50 rounded-xl p-4 shadow-2xl shadow-emerald-500/20 min-w-[250px] animate-in slide-in-from-top-2">
                <div className="text-xs font-bold text-emerald-400 mb-3 uppercase">Breakdown</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Refills:</span>
                    <span className="text-white font-bold">{minuteRefills}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price per refill:</span>
                    <span className="text-white font-semibold">$25.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Stripe fee (3%):</span>
                    <span className="text-red-400">-$0.75</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">AI cost:</span>
                    <span className="text-red-400">-$10.00</span>
                  </div>
                  <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between">
                    <span className="text-gray-400">Net per refill:</span>
                    <span className="text-green-400 font-bold">$14.25</span>
                  </div>
              </div>
            </div>
          </div>
        </div>

          {/* Expenses Card */}
          <div className="relative group">
            <div className="bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-xl rounded-2xl p-6 border border-red-500/30 shadow-xl hover:shadow-2xl hover:border-red-400/50 transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-red-400 transform rotate-180" />
                <div className="text-xs font-bold text-gray-400 uppercase">Total Expenses</div>
          </div>
              <div className="text-3xl font-black text-red-400 mb-2">
                {loading ? (
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                ) : (
                  `$${allTimeExpenses.toLocaleString()}`
                )}
          </div>
              <div className="text-xs text-gray-400">Stripe + AI + Referrals</div>
        </div>

            {/* Tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 ease-out pointer-events-none z-50">
              <div className="bg-gray-900 border-2 border-red-500/50 rounded-xl p-4 shadow-2xl shadow-red-500/20 min-w-[250px] animate-in slide-in-from-top-2">
                <div className="text-xs font-bold text-red-400 mb-3 uppercase">Expense Breakdown</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Stripe Fees (3%):</span>
                    <span className="text-white font-bold">
                      ${((allTimeSubscriptionRevenue + allTimeMinutesRevenue) * 0.03).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
          </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">AI Costs:</span>
                    <span className="text-white font-bold">${allTimeMinutesExpense.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between">
                    <span className="text-gray-400">Total:</span>
                    <span className="text-red-400 font-bold">${allTimeExpenses.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
                </div>

          {/* Net Profit Card */}
          <div className="relative group">
            <div className="bg-gradient-to-br from-[#1A2647]/80 to-[#0F1629]/80 backdrop-blur-xl rounded-2xl p-6 border-2 border-purple-500/50 shadow-xl hover:shadow-2xl hover:border-purple-400/70 transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <div className="text-xs font-bold text-gray-400 uppercase">Net Profit</div>
                </div>
              <div className="text-3xl font-black text-purple-400 mb-2">
                {loading ? (
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                ) : (
                  `$${allTimeProfit.toLocaleString()}`
                )}
              </div>
              <div className="text-xs text-emerald-400 font-semibold">
                {!loading && allTimeTotal > 0 && `${((allTimeProfit / allTimeTotal) * 100).toFixed(1)}% margin`}
              </div>
            </div>

            {/* Tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 ease-out pointer-events-none z-50">
              <div className="bg-gray-900 border-2 border-purple-500/50 rounded-xl p-4 shadow-2xl shadow-purple-500/20 min-w-[250px] animate-in slide-in-from-top-2">
                <div className="text-xs font-bold text-purple-400 mb-3 uppercase">Profit Calculation</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Revenue:</span>
                    <span className="text-white font-bold">${allTimeTotal.toLocaleString()}</span>
                </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Expenses:</span>
                    <span className="text-red-400">-${allTimeExpenses.toLocaleString()}</span>
                </div>
                  <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between">
                    <span className="text-gray-400">Net Profit:</span>
                    <span className="text-purple-400 font-bold">${allTimeProfit.toLocaleString()}</span>
              </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Profit Margin: {((allTimeProfit / allTimeTotal) * 100).toFixed(1)}%
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* REVENUE CHART - Hidden on Mobile */}
        <div className="hidden md:block bg-[#1A2647] rounded-2xl p-6 border border-gray-800 mb-8">
          {/* Header */}
          <div className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Revenue Trend</h3>
              
              {/* Time Range Toggle */}
              <div className="flex gap-2 bg-[#0B1437] p-1 rounded-lg border border-gray-700">
                <button
                  onClick={() => setTimeRange('7days')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    timeRange === '7days'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => setTimeRange('30days')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    timeRange === '30days'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  Last 30 Days
                </button>
                <button
                  onClick={() => setTimeRange('12months')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    timeRange === '12months'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  Last 12 Months
                </button>
              </div>
            </div>

            {/* Data Type Toggle */}
            <div className="flex gap-1 bg-[#0B1437] p-1 rounded-lg border border-gray-700">
              <button
                onClick={() => setChartView('total')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  chartView === 'total'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                Both
              </button>
              <button
                onClick={() => setChartView('subscriptions')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  chartView === 'subscriptions'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                Subscriptions
              </button>
              <button
                onClick={() => setChartView('minutes')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  chartView === 'minutes'
                    ? 'bg-orange-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                Minutes
              </button>
            </div>
          </div>
          
          {/* Chart */}
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-4">
              {timeRange === '7days' && 'Last 7 Days'}
              {timeRange === '30days' && 'Last 30 Days'}
              {timeRange === '12months' && 'Last 12 Months'}
            </p>
            {loading ? (
              <div className="h-[350px] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              </div>
            ) : mounted ? (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSubscriptions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6B7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#6B7280"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1A2647',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value: any) => {
                      const formatted = typeof value === 'number' 
                        ? Math.round(value).toLocaleString()
                        : value;
                      return [`$${formatted}`, ''];
                    }}
                  />
                  {chartView === 'total' && (
                    <Area
                      type="monotone"
                      dataKey="totalRevenue"
                      stroke="#A855F7"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorTotal)"
                      name="Total Revenue"
                    />
                  )}
                  {chartView === 'minutes' && (
                    <Area
                      type="monotone"
                      dataKey="minutesRevenue"
                      stroke="#F59E0B"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorMinutes)"
                      name="Minutes"
                    />
                  )}
                  {chartView === 'subscriptions' && (
                    <Area
                      type="monotone"
                      dataKey="subscriptionRevenue"
                      stroke="#10B981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorSubscriptions)"
                      name="Subscriptions"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            ) : null}
              </div>

              </div>

        {/* USER & CONVERSION METRICS - ROW 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <AdminStatCard
            title="Total Users"
            value={loading ? '...' : String(revenueData?.users.total || 0)}
            subtitle="All-time signups"
            icon={Users}
            className="border-blue-500/30"
          />
          <AdminStatCard
            title="Pro Access Users"
            value={loading ? '...' : String(revenueData?.users.proAccess || 0)}
            subtitle="Users who subscribed"
            icon={CreditCard}
            className="border-green-500/30"
          />
          <AdminStatCard
            title="Conversion Rate"
            value={loading ? '...' : `${revenueData?.users.conversionRate || '0.0'}%`}
            subtitle="Trial → Pro Access"
            icon={TrendingUp}
            className="border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-purple-600/10"
          />
          <AdminStatCard
            title="Avg Revenue Per User"
            value={loading ? '...' : `$${revenueData?.users.avgRevenuePerUser || '0'}`}
            subtitle="Lifetime value"
            icon={DollarSign}
            className="border-emerald-500/30"
          />
        </div>

        {/* REVENUE PROJECTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AdminStatCard
            title="Average Daily Revenue"
            value={`$${(last30DaysTotal / 30).toFixed(0)}`}
            subtitle="Based on last 30 days"
            icon={Calendar}
            trend={{ value: '+8.5%', isPositive: true }}
          />
          <AdminStatCard
            title="Average Monthly Revenue"
            value={`$${last30DaysTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            subtitle="Based on last 30 days"
            icon={TrendingUp}
            className="border-blue-500/30"
          />
          <AdminStatCard
            title="Predicted Yearly Revenue"
            value={`$${(last30DaysTotal * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            subtitle="At current rate"
            icon={TrendingUp}
            className="border-yellow-500/40 bg-gradient-to-br from-yellow-900/20 to-amber-600/10"
            trend={{ value: `$${((last30DaysTotal * 12) / 12).toFixed(0)}/mo`, isPositive: true }}
          />
        </div>

        {/* DIVIDER */}
        <div className="my-8 md:my-12 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
          <div className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-wider">Activity</div>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
        </div>

        {/* TODAY'S ACTIVITY */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <AdminStatCard
            title="Active Users Today"
            value={loading ? '...' : String(revenueData?.users.proAccess || 0)}
            subtitle="Pro access users"
            icon={Users}
            className="border-blue-500/30"
          />
          <AdminStatCard
            title="Total Calls Today"
            value={loading ? '...' : String(revenueData?.calls.today.total || 0)}
            subtitle="All calls made today"
            icon={Phone}
            className="border-green-500/30"
          />
          <AdminStatCard
            title="Connected Calls Today"
            value={loading ? '...' : `${revenueData?.calls.today.connectionRate || '0.0'}%`}
            subtitle="Pickup/connection rate"
            icon={CheckCircle}
            className="border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-purple-600/10"
          />
          <AdminStatCard
            title="Appointments Today"
            value={loading ? '...' : String(revenueData?.calls.today.appointments || 0)}
            subtitle="Booked today"
            icon={Calendar}
            className="border-emerald-500/30"
          />
        </div>

        {/* ALL-TIME PERFORMANCE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AdminStatCard
            title="Total Calls Ever"
            value={loading ? '...' : (revenueData?.calls.allTime.total || 0).toLocaleString()}
            subtitle="All-time calls made"
            icon={Phone}
            className="border-blue-500/30 bg-gradient-to-br from-blue-900/20 to-blue-600/10"
          />
          <AdminStatCard
            title="All-Time Appointments"
            value={loading ? '...' : (revenueData?.calls.allTime.appointments || 0).toLocaleString()}
            subtitle="Total appointments booked"
            icon={Calendar}
            className="border-green-500/30 bg-gradient-to-br from-green-900/20 to-green-600/10"
          />
          <AdminStatCard
            title="Calls Per Appointment"
            value={loading ? '...' : String(revenueData?.calls.allTime.callsPerAppointment || '0.0')}
            subtitle="Average calls to book 1 apt"
            icon={TrendingUp}
            className="border-purple-500/30"
          />
        </div>

        {/* Sign Out Button - At Bottom (Mobile Only) */}
        <div className="mt-12 md:hidden flex justify-center pb-8">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-8 py-4 bg-red-600/10 hover:bg-red-600/20 border-2 border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 rounded-xl font-bold transition-all hover:scale-105"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

