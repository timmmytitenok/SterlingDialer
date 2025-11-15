'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AppointmentStatsProps {
  last7Days: any[];
  last30Days: any[];
}

export function AppointmentStats({ last7Days, last30Days }: AppointmentStatsProps) {
  const [period, setPeriod] = useState<'7days' | '30days'>('30days');
  const [isExpanded, setIsExpanded] = useState(false);

  const appointments = period === '7days' ? last7Days : last30Days;

  // Only count appointments that have happened (completed, no-show, or sold)
  // Exclude scheduled/pending appointments that haven't occurred yet
  const completedAppointments = appointments.filter(a => 
    a.status === 'completed' || 
    a.status === 'no_show' || 
    a.is_no_show || 
    a.is_sold
  );

  const completed = appointments.filter(a => a.status === 'completed' || a.is_sold).length;
  const noShows = appointments.filter(a => a.status === 'no_show' || a.is_no_show).length;
  const sold = appointments.filter(a => a.is_sold).length;
  
  // Use completedAppointments.length instead of all appointments for accurate stats
  const totalCompletedAppointments = completedAppointments.length;

  // Calculate show rate (percentage of COMPLETED appointments that showed up)
  const showedUp = completed; // completed includes sold
  const showRate = totalCompletedAppointments > 0 ? Math.round((showedUp / totalCompletedAppointments) * 100) : 0;

  // Calculate close rate (1 in every X COMPLETED appointments)
  const closeRate = sold > 0 ? Math.round(totalCompletedAppointments / sold) : 0;

  const getPeriodLabel = () => period === '7days' ? 'Last 7 Days' : 'Last 30 Days';

  return (
    <div className="bg-[#1A2647] rounded-xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Conversion Summary</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0B1437] border border-gray-700 rounded-lg text-gray-300 hover:text-white transition-colors"
        >
          <span className="text-sm">{getPeriodLabel()}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown */}
      {isExpanded && (
        <div className="absolute right-8 mt-2 bg-[#1A2647] border border-gray-700 rounded-lg shadow-xl z-10 overflow-hidden">
          <button
            onClick={() => {
              setPeriod('7days');
              setIsExpanded(false);
            }}
            className={`w-full px-6 py-3 text-left transition-colors ${
              period === '7days'
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => {
              setPeriod('30days');
              setIsExpanded(false);
            }}
            className={`w-full px-6 py-3 text-left transition-colors ${
              period === '30days'
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            Last 30 Days
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Sold */}
        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-xl p-6 border border-yellow-500/20 transition-all duration-200 hover:scale-[1.02] hover:border-yellow-500/40 hover:shadow-lg hover:shadow-yellow-500/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">💰</span>
          </div>
          <p className="text-gray-300 text-sm mb-1 font-medium">SOLD</p>
          <p className="text-4xl font-bold text-yellow-400">{sold}</p>
          <p className="text-xs text-yellow-400/60 mt-1">Policies sold</p>
        </div>

        {/* Close Rate */}
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl p-6 border border-purple-500/20 transition-all duration-200 hover:scale-[1.02] hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">🎯</span>
          </div>
          <p className="text-gray-300 text-sm mb-1 font-medium">CLOSE RATE</p>
          <p className="text-4xl font-bold text-purple-400">
            {closeRate > 0 ? `1:${closeRate}` : '—'}
          </p>
          <p className="text-xs text-purple-400/60 mt-1">
            {closeRate > 0 ? `1 in every ${closeRate} appointments` : 'No sales yet'}
          </p>
        </div>

        {/* Show Rate */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-6 border border-blue-500/20 transition-all duration-200 hover:scale-[1.02] hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">📊</span>
          </div>
          <p className="text-gray-300 text-sm mb-1 font-medium">SHOW RATE</p>
          <p className="text-4xl font-bold text-blue-400">{showRate}%</p>
          <p className="text-xs text-blue-400/60 mt-1">Appointments that showed up</p>
        </div>

        {/* No Shows */}
        <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-xl p-6 border border-red-500/20 transition-all duration-200 hover:scale-[1.02] hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">❌</span>
          </div>
          <p className="text-gray-300 text-sm mb-1 font-medium">NO SHOW</p>
          <p className="text-4xl font-bold text-red-400">{noShows}</p>
          <p className="text-xs text-red-400/60 mt-1">Did not attend</p>
        </div>
      </div>
    </div>
  );
}

