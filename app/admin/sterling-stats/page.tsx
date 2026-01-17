'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Users, Phone, CheckCircle, Calendar, Loader2, TrendingUp, LogOut, Wallet, UserCheck } from 'lucide-react';
import { AdminStatCard } from '@/components/admin/admin-stat-card';

interface RevenueData {
  users: {
    activeUsersToday: number;
    activeUsersLast7Days: number;
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
  platform: {
    totalCallBalanceReserve: number;
  };
}

// Animated Number Component
const AnimatedNumber = ({ value, duration = 1000, prefix = '', suffix = '', decimals = 0 }: { 
  value: number; 
  duration?: number; 
  prefix?: string; 
  suffix?: string;
  decimals?: number;
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    const start = previousValue.current;
    const end = value;
    const startTime = performance.now();

    const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      
      const currentValue = start + (end - start) * easedProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = end;
      }
    };

    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
    animationFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [value, duration]);

  const formattedValue = decimals > 0 
    ? displayValue.toFixed(decimals) 
    : Math.round(displayValue).toLocaleString();

  return <>{prefix}{formattedValue}{suffix}</>;
};

export default function SterlingStatsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadRevenueData();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/signup');
  };

  const loadRevenueData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/revenue-stats', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch revenue data');
      }

      const data = await response.json();
      setRevenueData(data);
      // Trigger animations after a short delay
      setTimeout(() => setDataLoaded(true), 100);
    } catch (error: any) {
      console.error('Error loading revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  // CSS for animations
  const fadeInUp = (delay: number) => ({
    opacity: dataLoaded ? 1 : 0,
    transform: dataLoaded ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
    filter: dataLoaded ? 'blur(0px)' : 'blur(8px)',
    transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
  });

  return (
    <div className="min-h-screen p-3 md:p-8 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 pt-6 md:pt-0" style={fadeInUp(0)}>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            Sterling Stats
          </h1>
          <p className="text-sm md:text-base text-gray-400">
            Platform activity and performance metrics
          </p>
        </div>

        {/* ACTIVITY DIVIDER */}
        <div className="mb-8 flex items-center gap-3" style={fadeInUp(100)}>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
          <div className="text-xs md:text-sm font-bold text-purple-400 uppercase tracking-wider">Activity</div>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
        </div>

        {/* TODAY'S ACTIVITY */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div style={fadeInUp(150)}>
            <AdminStatCard
              title="Active Users Today"
              value={loading ? '...' : dataLoaded ? <AnimatedNumber value={revenueData?.users.activeUsersToday || 0} duration={1200} /> : '0'}
              subtitle="Users who made calls today"
              icon={Users}
              className="border-blue-500/30"
            />
          </div>
          <div style={fadeInUp(200)}>
            <AdminStatCard
              title="Total Calls Today"
              value={loading ? '...' : dataLoaded ? <AnimatedNumber value={revenueData?.calls.today.total || 0} duration={1200} /> : '0'}
              subtitle="All calls made today"
              icon={Phone}
              className="border-green-500/30"
            />
          </div>
          <div style={fadeInUp(250)}>
            <AdminStatCard
              title="Connected Calls Today"
              value={loading ? '...' : `${revenueData?.calls.today.connectionRate || '0.0'}%`}
              subtitle="Pickup/connection rate"
              icon={CheckCircle}
              className="border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-purple-600/10"
            />
          </div>
          <div style={fadeInUp(300)}>
            <AdminStatCard
              title="Appointments Today"
              value={loading ? '...' : dataLoaded ? <AnimatedNumber value={revenueData?.calls.today.appointments || 0} duration={1200} /> : '0'}
              subtitle="Booked today"
              icon={Calendar}
              className="border-emerald-500/30"
            />
          </div>
        </div>

        {/* ALL-TIME PERFORMANCE DIVIDER */}
        <div className="my-8 flex items-center gap-3" style={fadeInUp(350)}>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
          <div className="text-xs md:text-sm font-bold text-blue-400 uppercase tracking-wider">All-Time Performance</div>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
        </div>

        {/* ALL-TIME PERFORMANCE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div style={fadeInUp(400)}>
            <AdminStatCard
              title="Total Calls Ever"
              value={loading ? '...' : dataLoaded ? <AnimatedNumber value={revenueData?.calls.allTime.total || 0} duration={1500} /> : '0'}
              subtitle="All-time calls made"
              icon={Phone}
              className="border-blue-500/30 bg-gradient-to-br from-blue-900/20 to-blue-600/10"
            />
          </div>
          <div style={fadeInUp(450)}>
            <AdminStatCard
              title="All-Time Appointments"
              value={loading ? '...' : dataLoaded ? <AnimatedNumber value={revenueData?.calls.allTime.appointments || 0} duration={1500} /> : '0'}
              subtitle="Total appointments booked"
              icon={Calendar}
              className="border-green-500/30 bg-gradient-to-br from-green-900/20 to-green-600/10"
            />
          </div>
          <div style={fadeInUp(500)}>
            <AdminStatCard
              title="Calls Per Appointment"
              value={loading ? '...' : String(revenueData?.calls.allTime.callsPerAppointment || '0.0')}
              subtitle="Average calls to book 1 apt"
              icon={TrendingUp}
              className="border-purple-500/30"
            />
          </div>
        </div>

        {/* PLATFORM OVERVIEW DIVIDER */}
        <div className="my-8 flex items-center gap-3" style={fadeInUp(550)}>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
          <div className="text-xs md:text-sm font-bold text-emerald-400 uppercase tracking-wider">Platform Overview</div>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
        </div>

        {/* PLATFORM OVERVIEW STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div style={fadeInUp(600)}>
            <AdminStatCard
              title="Active Users (7 Days)"
              value={loading ? '...' : dataLoaded ? <AnimatedNumber value={revenueData?.users?.activeUsersLast7Days || 0} duration={1200} /> : '0'}
              subtitle="Users who ran AI in last 7 days"
              icon={UserCheck}
              className="border-emerald-500/30 bg-gradient-to-br from-emerald-900/20 to-emerald-600/10"
            />
          </div>
          <div style={fadeInUp(650)}>
            <AdminStatCard
              title="Total Call Balance Reserve"
              value={loading ? '...' : dataLoaded ? <AnimatedNumber value={revenueData?.platform?.totalCallBalanceReserve || 0} duration={1500} prefix="$" decimals={2} /> : '$0.00'}
              subtitle="Total balance across all user accounts"
              icon={Wallet}
              className="border-cyan-500/30 bg-gradient-to-br from-cyan-900/20 to-cyan-600/10"
            />
          </div>
        </div>

        {/* Mobile Sign Out Button */}
        <div className="md:hidden mt-12 mb-8" style={fadeInUp(700)}>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-semibold">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

