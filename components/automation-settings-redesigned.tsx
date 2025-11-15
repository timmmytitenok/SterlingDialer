'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Clock, Calendar, DollarSign, X, Check, AlertCircle, Zap } from 'lucide-react';

interface AutomationSettingsRedesignedProps {
  userId: string;
  initialSettings: any;
}

export function AutomationSettingsRedesigned({ userId, initialSettings }: AutomationSettingsRedesignedProps) {
  const [autoScheduleEnabled, setAutoScheduleEnabled] = useState(initialSettings?.schedule_enabled || false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  // Schedule settings
  const [startTime, setStartTime] = useState(initialSettings?.schedule_time || '09:00');
  const [selectedDays, setSelectedDays] = useState<number[]>(initialSettings?.schedule_days || [1, 2, 3, 4, 5]);
  const [dailyBudget, setDailyBudget] = useState(initialSettings?.daily_spend_limit || 25);
  const [isUnlimitedBudget, setIsUnlimitedBudget] = useState(false);
  
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

  const handleToggleAutoSchedule = () => {
    if (!autoScheduleEnabled) {
      // Turning ON - show modal to configure
      setShowScheduleModal(true);
    } else {
      // Turning OFF - disable immediately
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
          dailySpendLimit: isUnlimitedBudget ? 999999 : dailyBudget, // Very high number for unlimited
        }),
      });

      if (response.ok) {
        setAutoScheduleEnabled(enabled);
        setShowScheduleModal(false);
        setMessage({ type: 'success', text: enabled ? 'Auto-schedule activated!' : 'Auto-schedule disabled' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#1A2647] rounded-2xl border border-gray-800 p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Dialer Automation</h2>
        <p className="text-gray-400">Configure automatic AI scheduling</p>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl border-2 animate-in slide-in-from-top-2 duration-300 ${
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
      <div className="bg-[#0F172A]/50 border border-gray-700 rounded-xl p-6 hover:border-blue-500/30 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Auto-Start Schedule</h3>
              <p className="text-gray-400 text-sm">Automatically start the AI dialer on a schedule</p>
            </div>
          </div>
          
          {/* Toggle Switch */}
          <button
            onClick={handleToggleAutoSchedule}
            className={`relative w-16 h-8 rounded-full transition-all duration-300 ${
              autoScheduleEnabled 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                : 'bg-gray-700'
            }`}
          >
            <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all duration-300 shadow-lg ${
              autoScheduleEnabled ? 'left-9' : 'left-1'
            }`} />
          </button>
        </div>

        {/* Show current settings if enabled */}
        {autoScheduleEnabled && (
          <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-3 gap-4">
            <div className="bg-[#0B1437]/50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Start Time</p>
              <p className="text-white font-semibold">{startTime}</p>
            </div>
            <div className="bg-[#0B1437]/50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Days</p>
              <p className="text-white font-semibold text-sm">
                {selectedDays.map(d => dayNames[d]).join(', ')}
              </p>
            </div>
            <div className="bg-[#0B1437]/50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Daily Budget</p>
              <p className="text-white font-semibold">
                {isUnlimitedBudget ? 'Unlimited' : `$${dailyBudget}`}
              </p>
            </div>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="col-span-3 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg font-semibold transition-all text-sm"
            >
              Edit Schedule
            </button>
          </div>
        )}
      </div>

      {/* Schedule Configuration Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#1A2647] rounded-2xl border border-gray-800 max-w-2xl w-full shadow-2xl animate-in slide-in-from-bottom duration-500">
            {/* Header */}
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Configure Auto-Start Schedule</h2>
                <p className="text-gray-400 text-sm">Set when and how the AI should automatically launch</p>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
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
                <p className="text-gray-400 text-xs mt-2">AI will start dialing at this time on selected days</p>
              </div>

              {/* Days of Week */}
              <div>
                <label className="block text-white font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  Days of Week
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {dayNames.map((day, index) => (
                    <button
                      key={index}
                      onClick={() => toggleDay(index)}
                      className={`py-3 px-2 rounded-lg font-semibold text-sm transition-all ${
                        selectedDays.includes(index)
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-2 border-blue-500'
                          : 'bg-[#0F172A] text-gray-400 border-2 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                <p className="text-gray-400 text-xs mt-2">Select which days the AI should automatically start</p>
              </div>

              {/* Daily Budget Slider */}
              <div>
                <label className="block text-white font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  Daily Budget
                </label>
                
                <div className="space-y-4">
                  {/* Budget Display */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-4xl font-bold text-emerald-400">
                        {isUnlimitedBudget ? 'Unlimited' : `$${dailyBudget}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {isUnlimitedBudget 
                          ? 'AI runs until calling hours end'
                          : `AI stops when $${dailyBudget} is spent`
                        }
                      </p>
                    </div>
                  </div>

                  {/* Slider */}
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="101"
                      value={isUnlimitedBudget ? 101 : dailyBudget}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (value > 100) {
                          setIsUnlimitedBudget(true);
                          setDailyBudget(100);
                        } else {
                          setIsUnlimitedBudget(false);
                          setDailyBudget(value);
                        }
                      }}
                      className="w-full h-3 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #10B981 0%, #10B981 ${isUnlimitedBudget ? 100 : (dailyBudget / 100) * 100}%, #1F2937 ${isUnlimitedBudget ? 100 : (dailyBudget / 100) * 100}%, #1F2937 100%)`
                      }}
                    />
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>$0</span>
                      <span>$50</span>
                      <span>$100</span>
                      <span className="text-purple-400 font-semibold">∞ Unlimited</span>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-blue-300 text-sm font-semibold mb-2">💡 How Daily Budget Works</p>
                    <ul className="text-gray-300 text-xs space-y-1">
                      <li>• Spend will <strong className="text-white">NOT go over</strong> your budget</li>
                      <li>• If budget is not met and calling hours end, AI will stop</li>
                      <li>• Unlimited runs AI until calling hours are over</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowScheduleModal(false)}
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
                      Activate Schedule
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

