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
  const [showScheduleConfig, setShowScheduleConfig] = useState(false);
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

  const handleToggleChange = () => {
    if (!autoScheduleEnabled) {
      // Turning ON - show config modal
      setShowScheduleConfig(true);
      setAutoScheduleEnabled(true);
    } else {
      // Turning OFF - disable immediately
      setAutoScheduleEnabled(false);
      saveSettings(false);
    }
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
          dailySpendLimit: isUnlimited ? 999999 : dailyBudget,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setShowScheduleConfig(false);
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

      {/* Auto-Start Schedule Toggle */}
      <div className="bg-[#1A2647] rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Auto-Start Schedule</h3>
              <p className="text-gray-400 text-sm">Automatically start the AI dialer on a schedule</p>
            </div>
          </div>
          
          {/* Toggle Switch */}
          <button
            onClick={handleToggleChange}
            className={`relative w-16 h-8 rounded-full transition-all duration-300 ${
              autoScheduleEnabled ? 'bg-blue-600' : 'bg-gray-700'
            }`}
          >
            <div className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-all duration-300 ${
              autoScheduleEnabled ? 'translate-x-8' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* Show current schedule if enabled */}
        {autoScheduleEnabled && !showScheduleConfig && (
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-blue-300 text-sm font-semibold mb-2">✅ Auto-Schedule Active</p>
            <div className="space-y-1 text-gray-300 text-sm">
              <p>• Starts at: <strong className="text-white">{startTime}</strong></p>
              <p>• Days: <strong className="text-white">{selectedDays.map(d => dayNames[d]).join(', ')}</strong></p>
              <p>• Daily Budget: <strong className="text-white">{isUnlimited ? 'Unlimited' : `$${dailyBudget}`}</strong></p>
            </div>
            <button
              onClick={() => setShowScheduleConfig(true)}
              className="mt-3 text-blue-400 hover:text-blue-300 text-sm font-semibold"
            >
              Edit Schedule →
            </button>
          </div>
        )}
      </div>

      {/* Schedule Configuration Modal */}
      {showScheduleConfig && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#1A2647] rounded-2xl border border-gray-800 max-w-2xl w-full shadow-2xl animate-in slide-in-from-bottom duration-500">
            {/* Header */}
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Configure Auto-Start Schedule</h2>
                <p className="text-gray-400 text-sm">Set when AI should automatically start dialing</p>
              </div>
              <button
                onClick={() => {
                  setShowScheduleConfig(false);
                  if (selectedDays.length === 0) {
                    setAutoScheduleEnabled(false);
                  }
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-6 h-6 text-gray-400 hover:text-white" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Start Time */}
              <div>
                <label className="block text-white font-semibold mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0F172A] border-2 border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-white focus:outline-none transition-all"
                />
              </div>

              {/* Days Selection */}
              <div>
                <label className="block text-white font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  Days to Run
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {dayNames.map((day, index) => (
                    <button
                      key={index}
                      onClick={() => toggleDay(index)}
                      className={`py-3 px-2 rounded-lg font-semibold text-sm transition-all ${
                        selectedDays.includes(index)
                          ? 'bg-blue-600 text-white border-2 border-blue-500'
                          : 'bg-gray-700 text-gray-400 border-2 border-gray-600 hover:bg-gray-600'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Daily Budget Slider */}
              <div>
                <label className="block text-white font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  Daily Budget
                </label>
                
                <div className="space-y-4">
                  {/* Budget Display */}
                  <div className="text-center">
                    <p className="text-5xl font-bold text-white mb-2">
                      {isUnlimited ? '∞' : `$${dailyBudget}`}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {isUnlimited ? 'Unlimited - Run until calling hours end' : 'AI will stop when budget is reached'}
                    </p>
                  </div>

                  {/* Slider */}
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="10"
                      max="101"
                      value={isUnlimited ? 101 : dailyBudget}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (val > 100) {
                          setIsUnlimited(true);
                        } else {
                          setIsUnlimited(false);
                          setDailyBudget(val);
                        }
                      }}
                      className="w-full h-3 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${isUnlimited ? 100 : ((dailyBudget - 10) / 90) * 100}%, #1F2937 ${isUnlimited ? 100 : ((dailyBudget - 10) / 90) * 100}%, #1F2937 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>$10</span>
                      <span>$100</span>
                      <span>Unlimited</span>
                    </div>
                  </div>

                  {/* Budget Info */}
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-blue-300 text-sm mb-2">
                      💡 <strong>How Daily Budget Works:</strong>
                    </p>
                    <ul className="text-gray-300 text-xs space-y-1">
                      <li>• AI will NOT spend over your set budget</li>
                      <li>• If budget is reached, AI stops for the day</li>
                      <li>• If budget NOT met and calling hours end, AI stops</li>
                      <li>• "Unlimited" runs until calling hours are over</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowScheduleConfig(false);
                    if (selectedDays.length === 0) {
                      setAutoScheduleEnabled(false);
                    }
                  }}
                  className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveSettings(true)}
                  disabled={saving || selectedDays.length === 0}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 text-white rounded-xl font-semibold transition-all hover:scale-105 disabled:scale-100 flex items-center justify-center gap-2"
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
          </div>
        </div>
      )}
    </div>
  );
}

