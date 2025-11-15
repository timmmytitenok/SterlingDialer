'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Phone, PhoneOff, User, DollarSign, Target, Zap } from 'lucide-react';

interface LiveCallStatusProps {
  userId: string;
  aiStatus: string;
  onStop: () => void;
}

export function LiveCallStatus({ userId, aiStatus, onStop }: LiveCallStatusProps) {
  const [currentLead, setCurrentLead] = useState<any>(null);
  const [callsMade, setCallsMade] = useState(0);
  const [todaySpend, setTodaySpend] = useState(0);
  const [spendLimit, setSpendLimit] = useState(10);
  const [targetLeads, setTargetLeads] = useState(100);
  const [lastCallStatus, setLastCallStatus] = useState('');
  const [stopping, setStopping] = useState(false);

  const supabase = createClient();

  const isRunning = aiStatus === 'running';

  // Poll for real-time updates
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(async () => {
      // Get AI settings
      const { data: settings } = await supabase
        .from('ai_control_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (settings) {
        setCallsMade(settings.calls_made_today || 0);
        setTodaySpend(settings.today_spend || 0);
        setSpendLimit(settings.daily_spend_limit || 10);
        setTargetLeads(settings.target_lead_count || 100);
        setLastCallStatus(settings.last_call_status || '');

        // Get current lead being called
        if (settings.current_lead_id) {
          const { data: lead } = await supabase
            .from('leads')
            .select('*')
            .eq('id', settings.current_lead_id)
            .single();

          if (lead) {
            setCurrentLead(lead);
          }
        } else {
          setCurrentLead(null);
        }
      }
    }, 1000); // Update every second for real-time feel

    return () => clearInterval(interval);
  }, [isRunning, userId, supabase]);

  const handleStop = async () => {
    setStopping(true);
    await onStop();
    setStopping(false);
  };

  if (!isRunning) {
    return null; // Don't show when AI is not running
  }

  const progress = Math.min((callsMade / targetLeads) * 100, 100);
  const spendProgress = Math.min((todaySpend / spendLimit) * 100, 100);

  return (
    <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-xl rounded-2xl border-2 border-blue-500/40 p-6 animate-pulse-border">
      {/* Header with Stop Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center animate-pulse">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">🤖 AI is Running</h3>
            <p className="text-green-300 text-sm font-semibold">Making calls in real-time</p>
          </div>
        </div>

        {/* STOP BUTTON */}
        <button
          onClick={handleStop}
          disabled={stopping}
          className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:opacity-50 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
        >
          <PhoneOff className="w-5 h-5" />
          {stopping ? 'Stopping...' : 'STOP AI'}
        </button>
      </div>

      {/* Current Call Info */}
      {currentLead ? (
        <div className="p-4 bg-[#0B1437]/60 rounded-lg border border-blue-500/30 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-5 h-5 text-blue-400" />
            <span className="text-gray-400 text-sm">Currently Calling:</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-lg">{currentLead.name}</p>
              <p className="text-gray-400 text-sm">{currentLead.phone}</p>
            </div>
            <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <span className="text-yellow-300 text-sm font-semibold">
                {lastCallStatus || 'Calling...'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-[#0B1437]/40 rounded-lg border border-gray-700/30 mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-400 animate-pulse" />
            <span className="text-gray-300 text-sm">Preparing next call...</span>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Calls Made Progress */}
        <div className="p-4 bg-[#0B1437]/60 rounded-lg border border-gray-700/30">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-400" />
            <span className="text-gray-400 text-xs">Calls Progress</span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-white font-bold text-2xl">{callsMade}</span>
            <span className="text-gray-400 text-sm">/ {targetLeads}</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Daily Spend Progress */}
        <div className="p-4 bg-[#0B1437]/60 rounded-lg border border-gray-700/30">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-gray-400 text-xs">Daily Spend</span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-white font-bold text-2xl">${todaySpend.toFixed(2)}</span>
            <span className="text-gray-400 text-sm">/ ${spendLimit.toFixed(2)}</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                spendProgress >= 100 ? 'bg-red-500' : spendProgress >= 75 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${spendProgress}%` }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-border {
          0%, 100% {
            border-color: rgba(59, 130, 246, 0.4);
          }
          50% {
            border-color: rgba(147, 51, 234, 0.6);
          }
        }
        .animate-pulse-border {
          animation: pulse-border 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

