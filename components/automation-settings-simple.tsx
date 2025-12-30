'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Clock, Calendar, DollarSign, Zap, Check, X, AlertCircle } from 'lucide-react';

interface AutomationSettingsSimpleProps {
  userId: string;
  initialSettings: any;
}

export function AutomationSettingsSimple({ userId, initialSettings }: AutomationSettingsSimpleProps) {
  const [autoScheduleEnabled, setAutoScheduleEnabled] = useState(initialSettings?.schedule_enabled || false);
  const [startTime, setStartTime] = useState(initialSettings?.schedule_time || '09:00');
  const [selectedDays, setSelectedDays] = useState<number[]>(initialSettings?.schedule_days || [1, 2, 3, 4, 5]);
  const [dailyBudget, setDailyBudget] = useState(initialSettings?.daily_spend_limit || 25);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = createClient();

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const toggleDay = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      setSelectedDays(selectedDays.filter(d => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex].sort());
    }
  };

  const handleTurnOn = () => {
    setAutoScheduleEnabled(true);
  };

  const handleTurnOff = () => {
    setAutoScheduleEnabled(false);
    saveSettings(false);
  };

  const saveSettings = async (enabled: boolean = autoScheduleEnabled) => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/ai-control/automation-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          scheduleEnabled: enabled,
          scheduleTime: startTime,
          scheduleDays: selectedDays,
          dailySpendLimit: dailyBudget,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dialer Automation</h1>
        <p className="text-gray-400">Automate when and how your AI dials leads</p>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`p-4 rounded-xl border-2 backdrop-blur-sm animate-in slide-in-from-top duration-300 ${
          message.type === 'success' 
            ? 'bg-green-500/10 text-green-300 border-green-500/40' 
            : 'bg-red-500/10 text-red-300 border-red-500/40'
        }`}>
          <div className="flex items-center gap-3">
            {message.type === 'success' ? (
              <Check className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p>{message.text}</p>
          </div>
        </div>
      )}

      {/* Auto-Start Schedule Card */}
      <div className="bg-[#1A2647] rounded-2xl border border-gray-800 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg" style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.2)' }}>
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Auto-Start Schedule</h3>
              <p className="text-gray-400">Automatically start the AI dialer on a schedule</p>
            </div>
          </div>

          {!autoScheduleEnabled ? (
            /* Turn On Button */
            <button
              onClick={handleTurnOn}
              className="w-full px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-3 text-lg"
              style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' }}
            >
              <Zap className="w-6 h-6" />
              Turn On Auto-Schedule
            </button>
          ) : (
            /* Configuration Fields */
            <div className="space-y-6 animate-in slide-in-from-top duration-500">
              {/* FIELD 1: Schedule Settings */}
              <div className="p-6 bg-[#0F172A]/50 rounded-2xl border-2 border-blue-500/30">
                <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-blue-400" />
                  1. Set Your Schedule
                </h4>
                
                {/* Start Time */}
                <div className="mb-6">
                  <label className="block text-white font-semibold mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-400" />
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0B1437] border-2 border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-white focus:outline-none transition-all"
                  />
                </div>

                {/* Days Selection */}
                <div>
                  <label className="block text-white font-semibold mb-3">
                    Days to Run
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {dayNames.map((day, index) => (
                      <button
                        key={index}
                        onClick={() => toggleDay(index)}
                        className={`py-3 px-2 rounded-lg font-semibold text-sm transition-all ${
                          selectedDays.includes(index)
                            ? 'bg-blue-600 text-white border-2 border-blue-500 scale-105'
                            : 'bg-gray-700 text-gray-400 border-2 border-gray-600 hover:bg-gray-600 hover:border-gray-500'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* FIELD 2: Daily Budget */}
              <div className="p-6 bg-[#0F172A]/50 rounded-2xl border-2 border-green-500/30">
                <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-green-400" />
                  2. Set Daily Budget
                </h4>
                
                {/* Budget Display */}
                <div className="text-center mb-4">
                  <p className="text-5xl font-bold text-green-400 mb-2" style={{
                    filter: 'drop-shadow(0 0 15px rgba(16, 185, 129, 0.3))'
                  }}>
                    ${dailyBudget}
                  </p>
                  <p className="text-gray-400 text-sm">
                    AI stops when budget is reached
                  </p>
                </div>

                {/* Slider */}
                <div className="space-y-3">
                  <div className="p-4 bg-[#0F172A]/50 rounded-xl border border-gray-700">
                    <input
                      type="range"
                      min="10"
                      max="50"
                      value={dailyBudget}
                      onChange={(e) => setDailyBudget(parseInt(e.target.value))}
                      className="w-full h-3 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #10B981 0%, #10B981 ${((dailyBudget - 10) / 90) * 100}%, #374151 ${((dailyBudget - 10) / 90) * 100}%, #374151 100%)`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 px-2">
                    <span>$10</span>
                    <span>$50</span>
                    <span>$100 Max</span>
                  </div>
                </div>

                {/* Info */}
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-300 text-sm mb-2">💡 <strong>How it works:</strong></p>
                  <ul className="text-gray-300 text-xs space-y-1">
                    <li>• AI will NOT spend over your budget</li>
                    <li>• If budget reached, AI stops for the day</li>
                    <li>• If budget NOT met and calling hours end, AI stops</li>
                  </ul>
                  <p className="text-gray-500 text-xs mt-2 italic">Calling hours: 9:00 AM - 8:00 PM (every day)</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleTurnOff}
                  className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all hover:scale-105"
                >
                  Turn Off
                </button>
                <button
                  onClick={() => saveSettings(true)}
                  disabled={saving || selectedDays.length === 0}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 text-white rounded-xl font-bold transition-all hover:scale-105 disabled:scale-100 flex items-center justify-center gap-2"
                  style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' }}
                >
                  {saving ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Save Schedule
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

