'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, TrendingUp, Clock, DollarSign, Zap } from 'lucide-react';

interface AdminMetrics {
  users: {
    total: number;
  };
  adminProfit: {
    minutesProfit: number;
    minutesProfitToday: number;
    totalExpenses?: number;
    totalCallBalances?: number;
  };
  chartData: {
    last30Days: Array<{
      date: string;
      minutesProfit: number;
    }>;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [pulseAnimation, setPulseAnimation] = useState(false);

  useEffect(() => {
    fetchMetrics();
    // Refresh every 5 seconds for real-time updates
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      // Add timestamp to prevent caching
      const response = await fetch(`/api/admin/metrics?_t=${Date.now()}`);
      if (!response.ok) {
        router.push('/dashboard');
        return;
      }
      const data = await response.json();
      setMetrics(data);
      setLastUpdated(new Date().toLocaleTimeString());
      
      // Trigger pulse animation on data update
      setPulseAnimation(true);
      setTimeout(() => setPulseAnimation(false), 1000);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B1437] via-[#1a237e] to-[#0B1437] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
            <div className="absolute inset-0 w-20 h-20 border-4 border-purple-500/20 border-b-purple-500 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s' }} />
          </div>
          <p className="text-gray-300 text-lg font-medium animate-pulse">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate daily average from last 30 days
  const dailyAverage = metrics.chartData.last30Days.length > 0
    ? metrics.chartData.last30Days.reduce((sum, day) => sum + day.minutesProfit, 0) / metrics.chartData.last30Days.length
    : 0;

  // Get last 7 days for trend
  const last7Days = metrics.chartData.last30Days.slice(-7);
  const last7DaysTotal = last7Days.reduce((sum, day) => sum + day.minutesProfit, 0);

  // Calculate profit per user
  const profitPerUser = metrics.users.total > 0
    ? (metrics.adminProfit.minutesProfit / metrics.users.total).toFixed(2)
    : '0.00';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1437] via-[#1a237e] to-[#0B1437] text-white p-3 md:p-8 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Header - Compact & Sleek */}
        <div className="flex flex-col gap-8 md:gap-3 mb-6 pt-6 md:pt-0">
          {/* Top Row: Exit Button Only */}
          <div className="flex items-center justify-start">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-900/40 to-red-700/40 hover:from-red-800/50 hover:to-red-600/50 rounded-xl transition-all shadow-lg hover:shadow-red-500/30 text-sm font-medium border border-red-500/30"
            >
              <ArrowLeft className="w-4 h-4 text-red-400" />
              <span className="text-red-300">Exit Admin</span>
            </button>
          </div>
          
          {/* Title with Glow Effect */}
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent mb-2 drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]">
              💰 Minutes Profit Dashboard
            </h1>
            <p className="text-sm text-gray-400">Real-time profit tracking from call minutes</p>
          </div>
        </div>

        {/* Main Profit Cards - HERO SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
          {/* All Time Minutes Profit - MASSIVE CARD */}
          <div className={`relative bg-gradient-to-br from-emerald-900/40 via-teal-900/40 to-cyan-900/40 rounded-2xl p-6 md:p-8 border-2 border-emerald-400/50 shadow-2xl overflow-hidden group hover:scale-105 transition-all duration-300 ${pulseAnimation ? 'animate-pulse' : ''}`}>
            {/* Animated Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-3xl animate-pulse" />
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-400/30">
                    <DollarSign className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs text-emerald-300 uppercase font-bold tracking-wider">All Time Profit</div>
                    <div className="text-[10px] text-gray-400">From Call Minutes</div>
                  </div>
                </div>
                <div className="text-5xl animate-bounce">💎</div>
              </div>
              
              <div className="text-5xl md:text-6xl font-black text-emerald-400 mb-2 drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]">
                ${metrics.adminProfit.minutesProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <div className="px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-400/30">
                  <span className="text-emerald-300 font-bold">⏱️ Total Minutes Revenue</span>
                </div>
              </div>
            </div>

            {/* Shine Effect on Hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
          </div>

          {/* Today's Minutes Profit - MASSIVE CARD */}
          <div className={`relative bg-gradient-to-br from-purple-900/40 via-pink-900/40 to-rose-900/40 rounded-2xl p-6 md:p-8 border-2 border-purple-400/50 shadow-2xl overflow-hidden group hover:scale-105 transition-all duration-300 ${pulseAnimation ? 'animate-pulse' : ''}`}>
            {/* Animated Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl animate-pulse" />
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-400/30">
                    <Zap className="w-8 h-8 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-xs text-purple-300 uppercase font-bold tracking-wider">Today's Profit</div>
                    <div className="text-[10px] text-gray-400">From Call Minutes</div>
                  </div>
                </div>
                <div className="text-5xl animate-bounce">🚀</div>
              </div>
              
              <div className="text-5xl md:text-6xl font-black text-purple-400 mb-2 drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]">
                ${metrics.adminProfit.minutesProfitToday.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <div className="px-3 py-1 bg-purple-500/20 rounded-full border border-purple-400/30">
                  <span className="text-purple-300 font-bold">💸 Real-Time Earnings</span>
                </div>
              </div>
            </div>

            {/* Shine Effect on Hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
          </div>
        </div>

        {/* Stats Grid - Smaller Supporting Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* 30-Day Average */}
          <div className="relative bg-gradient-to-br from-blue-900/30 to-blue-600/30 rounded-xl p-5 border border-blue-400/30 shadow-lg hover:shadow-blue-500/30 transition-all hover:-translate-y-1 group">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-3xl">📊</div>
            </div>
            <div className="text-2xl font-bold text-blue-400 mb-1">
              ${dailyAverage.toFixed(2)}
            </div>
            <div className="text-xs text-gray-400 uppercase font-semibold">30-Day Average</div>
          </div>

          {/* Last 7 Days Total */}
          <div className="relative bg-gradient-to-br from-amber-900/30 to-amber-600/30 rounded-xl p-5 border border-amber-400/30 shadow-lg hover:shadow-amber-500/30 transition-all hover:-translate-y-1 group">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
              <div className="text-3xl">📅</div>
            </div>
            <div className="text-2xl font-bold text-amber-400 mb-1">
              ${last7DaysTotal.toFixed(2)}
            </div>
            <div className="text-xs text-gray-400 uppercase font-semibold">Last 7 Days Total</div>
          </div>

          {/* Profit Per User */}
          <div className="relative bg-gradient-to-br from-purple-900/30 to-purple-600/30 rounded-xl p-5 border border-purple-400/30 shadow-lg hover:shadow-purple-500/30 transition-all hover:-translate-y-1 group">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-3xl">👥</div>
            </div>
            <div className="text-2xl font-bold text-purple-400 mb-1">
              ${profitPerUser}
            </div>
            <div className="text-xs text-gray-400 uppercase font-semibold">Profit Per User</div>
          </div>
        </div>

        {/* Financial Overview - Expenses & Balances */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Total Expenses (Your Call Costs) */}
          <div className="relative bg-gradient-to-br from-red-900/40 via-orange-900/40 to-red-900/40 rounded-2xl p-6 border-2 border-red-400/50 shadow-2xl overflow-hidden group hover:scale-105 transition-all duration-300">
            {/* Animated Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 blur-3xl animate-pulse" />
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-500/20 rounded-xl border border-red-400/30">
                    <DollarSign className="w-8 h-8 text-red-400" />
                  </div>
                  <div>
                    <div className="text-xs text-red-300 uppercase font-bold tracking-wider">Total Expenses</div>
                    <div className="text-[10px] text-gray-400">Your Call Costs (All Time)</div>
                  </div>
                </div>
                <div className="text-5xl">📞</div>
              </div>
              
              <div className="text-5xl md:text-6xl font-black text-red-400 mb-2 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">
                ${metrics.adminProfit.totalExpenses?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <div className="px-3 py-1 bg-red-500/20 rounded-full border border-red-400/30">
                  <span className="text-red-300 font-bold">💸 Phone Bill Tracker</span>
                </div>
              </div>
            </div>

            {/* Shine Effect on Hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
          </div>

          {/* Call Balance Reserve (Money in User Balances) */}
          <div className="relative bg-gradient-to-br from-cyan-900/40 via-blue-900/40 to-cyan-900/40 rounded-2xl p-6 border-2 border-cyan-400/50 shadow-2xl overflow-hidden group hover:scale-105 transition-all duration-300">
            {/* Animated Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-3xl animate-pulse" />
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-cyan-500/20 rounded-xl border border-cyan-400/30">
                    <DollarSign className="w-8 h-8 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-xs text-cyan-300 uppercase font-bold tracking-wider">Call Balance Reserve</div>
                    <div className="text-[10px] text-gray-400">Money in User Accounts</div>
                  </div>
                </div>
                <div className="text-5xl">🏦</div>
              </div>
              
              <div className="text-5xl md:text-6xl font-black text-cyan-400 mb-2 drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]">
                ${metrics.adminProfit.totalCallBalances?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <div className="px-3 py-1 bg-cyan-500/20 rounded-full border border-cyan-400/30">
                  <span className="text-cyan-300 font-bold">💰 Reserved Funds</span>
                </div>
              </div>
            </div>

            {/* Shine Effect on Hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

