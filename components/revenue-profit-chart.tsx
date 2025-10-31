'use client';

import { useState } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface RevenueProfitChartProps {
  monthlyData: Array<{
    date: string;
    revenue: number;
    costs: number;
    profit: number;
  }>;
  totalRevenue: number;
  totalCosts: number;
  totalProfit: number;
}

export function RevenueProfitChart({ monthlyData, totalRevenue, totalCosts, totalProfit }: RevenueProfitChartProps) {
  const [view, setView] = useState<'both' | 'revenue' | 'cost'>('both');

  return (
    <div className="bg-[#1A2647] rounded-xl p-6 border border-gray-800">
      {/* Header with Summary Stats */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-white mb-4">AI Costs & Revenue</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-lg p-4 border border-orange-500/20 transition-all duration-200 hover:scale-[1.02] hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/10">
              <p className="text-gray-300 text-sm mb-1 font-medium">Total AI Costs</p>
              <p className="text-2xl font-bold text-orange-400">${totalCosts.toFixed(3)}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-lg p-4 border border-green-500/20 transition-all duration-200 hover:scale-[1.02] hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/10">
              <p className="text-gray-300 text-sm mb-1 font-medium">All-Time Revenue</p>
              <p className="text-2xl font-bold text-green-400">${Math.round(totalRevenue).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-1 bg-[#0B1437] p-1 rounded-lg border border-gray-700">
          <button
            onClick={() => setView('both')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              view === 'both'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            Both
          </button>
          <button
            onClick={() => setView('cost')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              view === 'cost'
                ? 'bg-orange-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            AI Cost
          </button>
          <button
            onClick={() => setView('revenue')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              view === 'revenue'
                ? 'bg-green-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            Revenue
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-4">
        <p className="text-sm text-gray-400 mb-4">Last 30 Days</p>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
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
                // Show whole numbers only (no decimals)
                const formatted = typeof value === 'number' 
                  ? Math.round(value).toLocaleString()
                  : value;
                return [`$${formatted}`, ''];
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            {(view === 'both' || view === 'revenue') && (
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10B981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Revenue"
              />
            )}
            {(view === 'both' || view === 'cost') && (
              <Area
                type="monotone"
                dataKey="costs"
                stroke="#F59E0B"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorCosts)"
                name="AI Costs"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 flex-wrap">
        {(view === 'both' || view === 'revenue') && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-gray-400">Revenue</span>
          </div>
        )}
        {(view === 'both' || view === 'cost') && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-sm text-gray-400">AI Costs</span>
          </div>
        )}
      </div>
    </div>
  );
}

