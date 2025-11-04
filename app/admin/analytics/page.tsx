'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
  calls: {
    today: number;
    last7d: number;
    last30d: number;
    allTime: number;
  };
  appointments: {
    today: number;
    last7d: number;
    last30d: number;
    allTime: number;
  };
  connectedRate: number;
  policiesSold: number;
  totalUserRevenue: number;
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

type TimeFilter = 'today' | 'last7d' | 'last30d' | 'allTime';
type ChartView = 'last30days' | 'last12months';

export default function AdminAnalytics() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('allTime');
  const [chartView, setChartView] = useState<ChartView>('last30days');
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
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const timeFilterLabels: Record<TimeFilter, string> = {
    today: 'Today',
    last7d: 'Last 7 Days',
    last30d: 'Last 30 Days',
    allTime: 'All Time',
  };

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
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm text-center transition-all"
            >
              📊 Analytics
            </Link>
            <Link
              href="/admin/profit"
              className="px-4 py-2.5 bg-[#1A2647] text-gray-400 hover:bg-[#243052] rounded-lg font-medium text-sm text-center transition-all"
            >
              💰 Profit
            </Link>
          </div>
          
          {/* Last Updated - Full Width */}
          <div className="text-xs text-center text-gray-500 bg-[#1A2647] rounded-lg py-2 px-3">
            Last updated: <span className="text-green-400 font-medium">{lastUpdated}</span>
          </div>
        </div>

        {/* User Tier Breakdown - Mobile Optimized */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {/* Total */}
          <div className="bg-[#1A2647] rounded-lg p-2.5 border border-gray-800 text-center">
            <div className="text-base mb-0.5">👥</div>
            <div className="text-[10px] text-gray-400 mb-0.5 uppercase">Total</div>
            <div className="text-lg font-bold text-blue-400">{metrics.users.total}</div>
          </div>
          {/* Free Trial */}
          <div className="bg-[#1A2647] rounded-lg p-2.5 border border-gray-800 text-center">
            <div className="text-base mb-0.5">🆓</div>
            <div className="text-[10px] text-gray-400 mb-0.5 uppercase">Trial</div>
            <div className="text-lg font-bold text-green-400">{metrics.users.byTier.free_trial}</div>
          </div>
          {/* Starter */}
          <div className="bg-[#1A2647] rounded-lg p-2.5 border border-gray-800 text-center">
            <div className="text-base mb-0.5">🔵</div>
            <div className="text-[10px] text-gray-400 mb-0.5 uppercase">Start</div>
            <div className="text-lg font-bold text-blue-400">{metrics.users.byTier.starter}</div>
          </div>
          {/* Pro */}
          <div className="bg-[#1A2647] rounded-lg p-2.5 border border-gray-800 text-center">
            <div className="text-base mb-0.5">🟣</div>
            <div className="text-[10px] text-gray-400 mb-0.5 uppercase">Pro</div>
            <div className="text-lg font-bold text-purple-400">{metrics.users.byTier.pro}</div>
          </div>
          {/* Elite */}
          <div className="bg-[#1A2647] rounded-lg p-2.5 border border-gray-800 text-center">
            <div className="text-base mb-0.5">👑</div>
            <div className="text-[10px] text-gray-400 mb-0.5 uppercase">Elite</div>
            <div className="text-lg font-bold text-amber-400">{metrics.users.byTier.elite}</div>
          </div>
          {/* VIP */}
          <div className="bg-[#1A2647] rounded-lg p-2.5 border border-gray-800 text-center">
            <div className="text-base mb-0.5">⭐</div>
            <div className="text-[10px] text-gray-400 mb-0.5 uppercase">VIP</div>
            <div className="text-lg font-bold text-pink-400">{metrics.users.byTier.vip}</div>
          </div>
        </div>

        {/* Time Filter Buttons - Mobile Optimized */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {(['allTime', 'today', 'last7d', 'last30d'] as TimeFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                timeFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#1A2647] text-gray-400 hover:bg-[#243052]'
              }`}
            >
              {timeFilterLabels[filter]}
            </button>
          ))}
        </div>

        {/* Main Stats - Mobile Optimized */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {/* Total Calls */}
          <div className="bg-gradient-to-br from-blue-900/20 to-blue-600/20 rounded-lg p-3 border border-blue-500/30">
            <div className="text-lg mb-1">📊</div>
            <div className="text-[10px] text-gray-300 mb-1 uppercase">Calls</div>
            <div className="text-xl font-bold text-blue-400">
              {metrics.calls[timeFilter]}
            </div>
          </div>

          {/* Connected Rate */}
          <div className="bg-gradient-to-br from-green-900/20 to-green-600/20 rounded-lg p-3 border border-green-500/30">
            <div className="text-lg mb-1">✅</div>
            <div className="text-[10px] text-gray-300 mb-1 uppercase">Connect %</div>
            <div className="text-xl font-bold text-green-400">
              {metrics.connectedRate}%
            </div>
          </div>

          {/* Total Appointments */}
          <div className="bg-gradient-to-br from-purple-900/20 to-purple-600/20 rounded-lg p-3 border border-purple-500/30">
            <div className="text-lg mb-1">📅</div>
            <div className="text-[10px] text-gray-300 mb-1 uppercase">Appts</div>
            <div className="text-xl font-bold text-purple-400">
              {metrics.appointments[timeFilter]}
            </div>
          </div>

          {/* Total Sold */}
          <div className="bg-gradient-to-br from-amber-900/20 to-amber-600/20 rounded-lg p-3 border border-amber-500/30">
            <div className="text-lg mb-1">💰</div>
            <div className="text-[10px] text-gray-300 mb-1 uppercase">Sold</div>
            <div className="text-xl font-bold text-amber-400">
              {metrics.policiesSold}
            </div>
          </div>

          {/* Total Revenue - Full Width */}
          <div className="col-span-2 bg-gradient-to-br from-emerald-900/20 to-emerald-600/20 rounded-lg p-4 border-2 border-emerald-500/40">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-300 mb-1 uppercase">Total Revenue</div>
                <div className="text-3xl font-bold text-emerald-400">
                  ${metrics.totalUserRevenue.toLocaleString()}
                </div>
              </div>
              <div className="text-4xl">💵</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

