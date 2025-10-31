'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface ToggleStatCardProps {
  title: string;
  icon: string;
  todayValue: number;
  last7DaysValue: number;
  last30DaysValue: number;
  color: string;
}

const colorClasses: Record<string, string> = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  purple: 'from-purple-500 to-purple-600',
  orange: 'from-orange-500 to-orange-600',
};

export function ToggleStatCard({
  title,
  icon,
  todayValue,
  last7DaysValue,
  last30DaysValue,
  color,
}: ToggleStatCardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | '7days' | '30days'>('today');

  const getValue = () => {
    switch (selectedPeriod) {
      case 'today':
        return todayValue;
      case '7days':
        return last7DaysValue;
      case '30days':
        return last30DaysValue;
    }
  };

  return (
    <div className="bg-[#1A2647] rounded-xl border border-gray-800 p-6">
      <div className="flex items-start justify-between mb-1">
        <div className="flex-1">
          <p className="text-gray-400 text-sm font-medium mb-4">{title}</p>
          <div className="mb-4">
            <h3 className="text-5xl font-bold text-white">{getValue()}</h3>
          </div>
          
          {/* Period Selector Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPeriod('today')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedPeriod === 'today'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-[#0B1437] text-gray-400 hover:bg-gray-800 hover:text-white border border-gray-700'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setSelectedPeriod('7days')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedPeriod === '7days'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-[#0B1437] text-gray-400 hover:bg-gray-800 hover:text-white border border-gray-700'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setSelectedPeriod('30days')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedPeriod === '30days'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-[#0B1437] text-gray-400 hover:bg-gray-800 hover:text-white border border-gray-700'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>
        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-3xl shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

