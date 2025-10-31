'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface CallActivityChartProps {
  dailyData: Array<{
    date: string;
    totalCalls: number;
    answeredCalls: number;
    bookedCalls: number;
    notInterestedCalls: number;
    policiesSold: number;
  }>;
}

export function CallActivityChart({ dailyData }: CallActivityChartProps) {
  const [view, setView] = useState<'all' | 'dials' | 'answered' | 'notInterested' | 'booked' | 'sold'>('all');

  return (
    <div className="bg-[#1A2647] rounded-xl p-6 border border-gray-800">
      {/* Header with Tabs */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Call Activity</h3>
          <p className="text-sm text-gray-400">Last 30 days call breakdown</p>
        </div>

        {/* View Tabs */}
        <div className="flex gap-1 bg-[#0B1437] p-1 rounded-lg border border-gray-700">
          <button
            onClick={() => setView('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              view === 'all'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setView('dials')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              view === 'dials'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            Dials
          </button>
          <button
            onClick={() => setView('answered')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              view === 'answered'
                ? 'bg-cyan-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            Answered
          </button>
          <button
            onClick={() => setView('notInterested')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              view === 'notInterested'
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            Not Interested
          </button>
          <button
            onClick={() => setView('booked')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              view === 'booked'
                ? 'bg-green-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            Booked
          </button>
          <button
            onClick={() => setView('sold')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              view === 'sold'
                ? 'bg-yellow-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            Sold
          </button>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={dailyData}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorAnswered" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorBooked" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorNotInterested" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorSold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EAB308" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#EAB308" stopOpacity={0}/>
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
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1A2647',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff'
            }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          
          {(view === 'all' || view === 'dials') && (
            <Line
              type="monotone"
              dataKey="totalCalls"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ fill: '#3B82F6', r: 4 }}
              name="Total Dials"
              fill="url(#colorTotal)"
            />
          )}
          
          {(view === 'all' || view === 'answered') && (
            <Line
              type="monotone"
              dataKey="answeredCalls"
              stroke="#06B6D4"
              strokeWidth={3}
              dot={{ fill: '#06B6D4', r: 4 }}
              name="Answered Calls"
              fill="url(#colorAnswered)"
            />
          )}
          
          {(view === 'all' || view === 'notInterested') && (
            <Line
              type="monotone"
              dataKey="notInterestedCalls"
              stroke="#EF4444"
              strokeWidth={3}
              dot={{ fill: '#EF4444', r: 4 }}
              name="Not Interested"
              fill="url(#colorNotInterested)"
            />
          )}
          
          {(view === 'all' || view === 'booked') && (
            <Line
              type="monotone"
              dataKey="bookedCalls"
              stroke="#10B981"
              strokeWidth={3}
              dot={{ fill: '#10B981', r: 4 }}
              name="Booked Appointments"
              fill="url(#colorBooked)"
            />
          )}
          
          {(view === 'all' || view === 'sold') && (
            <Line
              type="monotone"
              dataKey="policiesSold"
              stroke="#EAB308"
              strokeWidth={3}
              dot={{ fill: '#EAB308', r: 4 }}
              name="Policies Sold"
              fill="url(#colorSold)"
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 flex-wrap">
        {(view === 'all' || view === 'dials') && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm text-gray-400">Total Dials</span>
          </div>
        )}
        {(view === 'all' || view === 'answered') && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-500" />
            <span className="text-sm text-gray-400">Answered Calls</span>
          </div>
        )}
        {(view === 'all' || view === 'notInterested') && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm text-gray-400">Not Interested</span>
          </div>
        )}
        {(view === 'all' || view === 'booked') && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-gray-400">Booked Appointments</span>
          </div>
        )}
        {(view === 'all' || view === 'sold') && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-sm text-gray-400">Policies Sold</span>
          </div>
        )}
      </div>
    </div>
  );
}

