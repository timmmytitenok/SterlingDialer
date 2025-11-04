'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AdminMetrics {
  users: {
    total: number;
    byTier: {
      free_trial: number;
      starter: number;
      pro: number;
      elite: number;
      vip: number;
    };
  };
  allTimeRevenue: number;
  adminProfit: {
    subscriptionProfitToday: number;
    starterProfit: number;
    proProfit: number;
    eliteProfit: number;
    minutesProfit: number;
    allTimeSubscriptionRevenue: number;
  };
  chartData: {
    last30Days: Array<{
      date: string;
      calls: number;
      appointments: number;
      subscriptionRevenue: number;
      minutesProfit: number;
    }>;
    last12Months: Array<{
      month: string;
      calls: number;
      appointments: number;
      subscriptionRevenue: number;
      minutesProfit: number;
    }>;
  };
}

type ChartView = 'last30days' | 'last12months';
type RevenueView = 'both' | 'subscriptions' | 'minutes';

export default function AdminProfit() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState<ChartView>('last30days');
  const [revenueView, setRevenueView] = useState<RevenueView>('both');
  const [lastUpdated, setLastUpdated] = useState<string>('');

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
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="min-h-screen bg-[#0B1437] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading profit data...</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const chartData = chartView === 'last30days'
    ? metrics.chartData.last30Days.map(d => ({
        label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        subscription: d.subscriptionRevenue,
        minutes: d.minutesProfit,
        total: d.subscriptionRevenue + d.minutesProfit,
      }))
    : metrics.chartData.last12Months.map(d => ({
        label: new Date(d.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        subscription: d.subscriptionRevenue,
        minutes: d.minutesProfit,
        total: d.subscriptionRevenue + d.minutesProfit,
      }));

  return (
    <div className="min-h-screen bg-[#0B1437] text-white p-3 md:p-8 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Mobile Header - Compact */}
        <div className="flex flex-col gap-3 mb-4">
          {/* Top Row: Exit + Refresh */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Exit Admin</span>
            </button>
            
            <button
              onClick={fetchMetrics}
              className="flex items-center gap-2 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg text-green-400 text-sm transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
          
          {/* Navigation Tabs */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/admin/analytics"
              className="px-4 py-2.5 bg-[#1A2647] text-gray-400 hover:bg-[#243052] rounded-lg font-medium text-sm text-center transition-all"
            >
              📊 Analytics
            </Link>
            <Link
              href="/admin/profit"
              className="px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm text-center transition-all"
            >
              💰 Profit
            </Link>
          </div>
          
          {/* Last Updated - Full Width */}
          <div className="text-xs text-center text-gray-500 bg-[#1A2647] rounded-lg py-2 px-3">
            Last updated: <span className="text-green-400 font-medium">{lastUpdated}</span>
          </div>
        </div>

        {/* Revenue Cards - Mobile Optimized */}
        <div className="grid grid-cols-1 gap-3 mb-4">
          {/* All Time Revenue */}
          <div className="bg-gradient-to-br from-purple-900/20 to-purple-600/20 rounded-lg p-4 border-2 border-purple-500/30">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs text-gray-400 uppercase mb-1">All Time Revenue</div>
                <div className="text-3xl font-bold text-purple-400">
                  ${metrics.allTimeRevenue.toLocaleString()}
                </div>
              </div>
              <div className="text-3xl">💎</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-[#0B1437]/50 rounded p-2 border border-purple-500/20">
                <div className="text-[10px] text-gray-400 uppercase">Subscriptions</div>
                <div className="text-base font-bold text-purple-300">
                  ${metrics.adminProfit.allTimeSubscriptionRevenue.toLocaleString()}
                </div>
              </div>
              <div className="bg-[#0B1437]/50 rounded p-2 border border-emerald-500/20">
                <div className="text-[10px] text-gray-400 uppercase">Minutes</div>
                <div className="text-base font-bold text-emerald-300">
                  ${metrics.adminProfit.minutesProfit.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Today's Revenue */}
          <div className="bg-gradient-to-br from-green-900/20 to-green-600/20 rounded-lg p-4 border-2 border-green-500/30">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-xs text-gray-400 uppercase mb-1">Today's Revenue</div>
                <div className="text-3xl font-bold text-green-400">
                  ${metrics.adminProfit.subscriptionProfitToday.toFixed(2)}
                </div>
              </div>
              <div className="text-3xl">💸</div>
            </div>
            <div className="text-xs text-gray-500">
              From {metrics.users.byTier.starter + metrics.users.byTier.pro + metrics.users.byTier.elite} subscriptions
            </div>
          </div>
        </div>

        {/* Subscription Profit Breakdown - Mobile Optimized */}
        <div className="bg-[#1A2647] rounded-lg p-4 border border-gray-800 mb-4">
          <h2 className="text-base font-bold text-white mb-3">📊 Subscription Revenue</h2>
          <div className="grid grid-cols-1 gap-3">
            {/* Starter */}
            <div className="bg-gradient-to-br from-blue-900/20 to-blue-600/20 rounded-lg p-3 border border-blue-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-base">🔵</div>
                    <div className="text-[10px] text-gray-400 uppercase">Starter</div>
                  </div>
                  <div className="text-2xl font-bold text-blue-400 mb-1">
                    ${(metrics.users.byTier.starter * 499).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {metrics.users.byTier.starter} users × $499/mo
                  </div>
                </div>
                <div className="text-xs text-blue-400 bg-blue-500/10 rounded px-2 py-1">
                  ${metrics.adminProfit.starterProfit.toFixed(2)}/day
                </div>
              </div>
            </div>

            {/* Pro */}
            <div className="bg-gradient-to-br from-purple-900/20 to-purple-600/20 rounded-lg p-3 border border-purple-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-base">🟣</div>
                    <div className="text-[10px] text-gray-400 uppercase">Pro</div>
                  </div>
                  <div className="text-2xl font-bold text-purple-400 mb-1">
                    ${(metrics.users.byTier.pro * 899).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {metrics.users.byTier.pro} users × $899/mo
                  </div>
                </div>
                <div className="text-xs text-purple-400 bg-purple-500/10 rounded px-2 py-1">
                  ${metrics.adminProfit.proProfit.toFixed(2)}/day
                </div>
              </div>
            </div>

            {/* Elite */}
            <div className="bg-gradient-to-br from-amber-900/20 to-amber-600/20 rounded-lg p-3 border border-amber-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-base">👑</div>
                    <div className="text-[10px] text-gray-400 uppercase">Elite</div>
                  </div>
                  <div className="text-2xl font-bold text-amber-400 mb-1">
                    ${(metrics.users.byTier.elite * 1499).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {metrics.users.byTier.elite} users × $1,499/mo
                  </div>
                </div>
                <div className="text-xs text-amber-400 bg-amber-500/10 rounded px-2 py-1">
                  ${metrics.adminProfit.eliteProfit.toFixed(2)}/day
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Minutes Profit Card - Mobile Optimized */}
        <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-600/20 rounded-lg p-4 border-2 border-emerald-500/30 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-gray-400 uppercase mb-1">Call Minutes Profit</div>
              <div className="text-3xl font-bold text-emerald-400">
                ${metrics.adminProfit.minutesProfit.toFixed(2)}
              </div>
            </div>
            <div className="text-3xl">⏱️</div>
          </div>
          <div className="p-3 bg-[#0B1437]/50 rounded-lg border border-emerald-500/20">
            <div className="text-[10px] text-gray-400 mb-2 uppercase">Profit per Tier:</div>
            <div className="space-y-1">
              <div className="text-xs text-emerald-400">🔵 Starter: <strong>$0.18/min</strong></div>
              <div className="text-xs text-emerald-400">🟣 Pro: <strong>$0.13/min</strong></div>
              <div className="text-xs text-emerald-400">👑 Elite: <strong>$0.08/min</strong></div>
            </div>
          </div>
        </div>

        {/* Daily Revenue Graph - HIDDEN ON MOBILE */}
        <div className="hidden md:block bg-[#1A2647] rounded-xl p-6 border border-gray-800">
          <div className="flex flex-col gap-4 mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-white">📈 Revenue Trend</h2>
            
            {/* Time Period Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setChartView('last30days')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  chartView === 'last30days'
                    ? 'bg-green-600 text-white'
                    : 'bg-[#0B1437] text-gray-400 hover:bg-[#243052]'
                }`}
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setChartView('last12months')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  chartView === 'last12months'
                    ? 'bg-green-600 text-white'
                    : 'bg-[#0B1437] text-gray-400 hover:bg-[#243052]'
                }`}
              >
                Last 12 Months
              </button>
            </div>

            {/* Revenue Type Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setRevenueView('both')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  revenueView === 'both'
                    ? 'bg-purple-600 text-white'
                    : 'bg-[#0B1437] text-gray-400 hover:bg-[#243052]'
                }`}
              >
                📊 Both
              </button>
              <button
                onClick={() => setRevenueView('subscriptions')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  revenueView === 'subscriptions'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#0B1437] text-gray-400 hover:bg-[#243052]'
                }`}
              >
                💳 Subscriptions
              </button>
              <button
                onClick={() => setRevenueView('minutes')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  revenueView === 'minutes'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#0B1437] text-gray-400 hover:bg-[#243052]'
                }`}
              >
                ⏱️ Minutes
              </button>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="subscriptionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="minutesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                dataKey="label" 
                stroke="#64748b"
                tick={{ fill: '#94a3b8' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                stroke="#64748b"
                tick={{ fill: '#94a3b8' }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }}
                formatter={(value: any) => `$${value.toFixed(2)}`}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              {(revenueView === 'both' || revenueView === 'subscriptions') && (
                <Area 
                  type="monotone" 
                  dataKey="subscription" 
                  stroke="#3b82f6" 
                  fill="url(#subscriptionGradient)"
                  strokeWidth={2}
                  name="Subscription Revenue"
                />
              )}
              {(revenueView === 'both' || revenueView === 'minutes') && (
                <Area 
                  type="monotone" 
                  dataKey="minutes" 
                  stroke="#10b981" 
                  fill="url(#minutesGradient)"
                  strokeWidth={2}
                  name="Minutes Profit"
                />
              )}
              {revenueView === 'both' && (
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#f59e0b" 
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  name="Total Profit"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
