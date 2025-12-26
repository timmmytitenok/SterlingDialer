'use client';

import { useState, useEffect, useRef } from 'react';

interface StatsData {
    totalCalls: number;
    connectionRate: string;
    connectedCalls: number;
    policiesSold: number;
    revenue: number;
    notInterested: number;
    callbacks: number;
    transfers: number;
    appointments: number;
}

interface DashboardStatsGridProps {
  todayStats: StatsData;
  yesterdayStats: StatsData;
  allTimeStats: StatsData;
  last7DaysStats: StatsData;
  last30DaysStats: StatsData;
}

type Period = 'today' | 'yesterday' | 'all' | '7days' | '30days';

// Counter animation component
function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number | string; prefix?: string; suffix?: string }) {
  // Parse the numeric value immediately
  const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : (value || 0);
  
  const [displayValue, setDisplayValue] = useState(numericValue);
  const previousValueRef = useRef(numericValue);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // On first render, just set the value directly (no animation)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setDisplayValue(numericValue);
      previousValueRef.current = numericValue;
      return;
    }
    
    const startValue = previousValueRef.current;
    const endValue = numericValue;
    
    if (startValue === endValue) return;

    const duration = 800; // Animation duration in ms
    const startTime = Date.now();
    
    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * easeOut;
      
      setDisplayValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        previousValueRef.current = endValue;
      }
    };
    
    animate();
  }, [numericValue]);

  // Format the display value
  const formattedValue = typeof value === 'string' && value.includes('.')
    ? displayValue.toFixed(1) // For percentages
    : Math.round(displayValue).toLocaleString(); // For whole numbers

  return (
    <span>
      {prefix}{formattedValue}{suffix}
    </span>
  );
}

export function DashboardStatsGrid({ todayStats, yesterdayStats, allTimeStats, last7DaysStats, last30DaysStats }: DashboardStatsGridProps) {
  const [period, setPeriod] = useState<Period>('all');

  const getStats = () => {
    switch (period) {
      case 'today': return todayStats;
      case 'yesterday': return yesterdayStats;
      case 'all': return allTimeStats;
      case '7days': return last7DaysStats;
      case '30days': return last30DaysStats;
    }
  };
  
  const currentStats = getStats();

  return (
    <div>
      {/* Period Filter Buttons */}
      <div className="flex gap-1 md:gap-2 mb-4 overflow-x-auto">
        <button
          onClick={() => setPeriod('all')}
          className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
            period === 'all'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'bg-[#1A2647] text-gray-400 hover:text-white hover:bg-[#1A2647]/80 border border-gray-800'
          }`}
        >
          All Time
        </button>
        <button
          onClick={() => setPeriod('today')}
          className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
            period === 'today'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'bg-[#1A2647] text-gray-400 hover:text-white hover:bg-[#1A2647]/80 border border-gray-800'
          }`}
        >
          Today
        </button>
        {/* Yesterday - Desktop only */}
        <button
          onClick={() => setPeriod('yesterday')}
          className={`hidden md:block px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
            period === 'yesterday'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'bg-[#1A2647] text-gray-400 hover:text-white hover:bg-[#1A2647]/80 border border-gray-800'
          }`}
        >
          Yesterday
        </button>
        <button
          onClick={() => setPeriod('7days')}
          className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
            period === '7days'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'bg-[#1A2647] text-gray-400 hover:text-white hover:bg-[#1A2647]/80 border border-gray-800'
          }`}
        >
          Last 7 Days
        </button>
        {/* Last 30 Days - Desktop only */}
        <button
          onClick={() => setPeriod('30days')}
          className={`hidden md:block px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
            period === '30days'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'bg-[#1A2647] text-gray-400 hover:text-white hover:bg-[#1A2647]/80 border border-gray-800'
          }`}
        >
          Last 30 Days
        </button>
      </div>

      {/* Stats Grid - 8 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Row 1 */}
        {/* Total Calls */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-6 border border-blue-500/20 transition-all duration-200 hover:scale-[1.02] hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">📊</span>
          </div>
          <p className="text-gray-300 text-sm mb-1 font-medium">TOTAL CALLS</p>
          <p className="text-4xl font-bold text-blue-400">
            <AnimatedNumber value={currentStats.totalCalls} />
          </p>
          <p className="text-xs text-blue-400/60 mt-1">All dials made</p>
        </div>

        {/* Connected Rate */}
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl p-6 border border-green-500/20 transition-all duration-200 hover:scale-[1.02] hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">✅</span>
          </div>
          <p className="text-gray-300 text-sm mb-1 font-medium">CONNECTED RATE</p>
          <p className="text-4xl font-bold text-green-400">
            <AnimatedNumber value={currentStats.connectionRate} suffix="%" />
          </p>
          <p className="text-xs text-green-400/60 mt-1">
            <AnimatedNumber value={currentStats.connectedCalls} /> answered
          </p>
        </div>

        {/* Policy Sold */}
        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-xl p-6 border border-yellow-500/20 transition-all duration-200 hover:scale-[1.02] hover:border-yellow-500/40 hover:shadow-lg hover:shadow-yellow-500/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">💰</span>
          </div>
          <p className="text-gray-300 text-sm mb-1 font-medium">POLICY SOLD</p>
          <p className="text-4xl font-bold text-yellow-400">
            <AnimatedNumber value={currentStats.policiesSold} />
          </p>
          <p className="text-xs text-yellow-400/60 mt-1">Closed deals</p>
        </div>

        {/* Revenue */}
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/5 rounded-xl p-6 border border-green-500/20 transition-all duration-200 hover:scale-[1.02] hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">💵</span>
          </div>
          <p className="text-gray-300 text-sm mb-1 font-medium">REVENUE</p>
          <p className="text-4xl font-bold text-green-400">
            <AnimatedNumber value={currentStats.revenue} prefix="$" />
          </p>
          <p className="text-xs text-green-400/60 mt-1">Total earned</p>
        </div>

        {/* Row 2 */}
        {/* Not Interested */}
        <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-xl p-6 border border-red-500/20 transition-all duration-200 hover:scale-[1.02] hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">❌</span>
          </div>
          <p className="text-gray-300 text-sm mb-1 font-medium">NOT INTERESTED</p>
          <p className="text-4xl font-bold text-red-400">
            <AnimatedNumber value={currentStats.notInterested} />
          </p>
          <p className="text-xs text-red-400/60 mt-1">Declined offers</p>
        </div>

        {/* Callback */}
        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-xl p-6 border border-orange-500/20 transition-all duration-200 hover:scale-[1.02] hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">📞</span>
          </div>
          <p className="text-gray-300 text-sm mb-1 font-medium">CALLBACK</p>
          <p className="text-4xl font-bold text-orange-400">
            <AnimatedNumber value={currentStats.callbacks} />
          </p>
          <p className="text-xs text-orange-400/60 mt-1">Follow up later</p>
        </div>

        {/* Live Transfers */}
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl p-6 border border-purple-500/20 transition-all duration-200 hover:scale-[1.02] hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">🔄</span>
          </div>
          <p className="text-gray-300 text-sm mb-1 font-medium">LIVE TRANSFERS</p>
          <p className="text-4xl font-bold text-purple-400">
            <AnimatedNumber value={currentStats.transfers} />
          </p>
          <p className="text-xs text-purple-400/60 mt-1">Transferred to agent</p>
        </div>

        {/* Booked Appointments */}
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-600/5 rounded-xl p-6 border border-blue-500/20 transition-all duration-200 hover:scale-[1.02] hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">📅</span>
          </div>
          <p className="text-gray-300 text-sm mb-1 font-medium">BOOKED APPOINTMENTS</p>
          <p className="text-4xl font-bold text-blue-400">
            <AnimatedNumber value={currentStats.appointments} />
          </p>
          <p className="text-xs text-blue-400/60 mt-1">Successfully scheduled</p>
        </div>
      </div>
    </div>
  );
}

