'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Users, Phone, CheckCircle, Calendar, Loader2, TrendingUp, LogOut } from 'lucide-react';
import { AdminStatCard } from '@/components/admin/admin-stat-card';

interface RevenueData {
  users: {
    activeUsersToday: number;
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

export default function SterlingStatsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
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
    } catch (error: any) {
      console.error('Error loading revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-3 md:p-8 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 pt-6 md:pt-0">
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
        <div className="mb-8 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
          <div className="text-xs md:text-sm font-bold text-purple-400 uppercase tracking-wider">Activity</div>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
        </div>

        {/* TODAY'S ACTIVITY */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <AdminStatCard
            title="Active Users Today"
            value={loading ? '...' : String(revenueData?.users.activeUsersToday || 0)}
            subtitle="Users who made calls today"
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

        {/* ALL-TIME PERFORMANCE DIVIDER */}
        <div className="my-8 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
          <div className="text-xs md:text-sm font-bold text-blue-400 uppercase tracking-wider">All-Time Performance</div>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
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

        {/* Mobile Sign Out Button */}
        <div className="md:hidden mt-12 mb-8">
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

