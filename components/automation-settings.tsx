'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Clock, Calendar, DollarSign, Zap } from 'lucide-react';

interface AutomationSettingsProps {
  userId: string;
  initialSettings: any;
}

export function AutomationSettings({ userId, initialSettings }: AutomationSettingsProps) {
  const [scheduleEnabled, setScheduleEnabled] = useState(initialSettings?.schedule_enabled || false);
  const [scheduleTime, setScheduleTime] = useState(initialSettings?.schedule_time || '10:00');
  const [scheduleDays, setScheduleDays] = useState<number[]>(initialSettings?.schedule_days || [1, 2, 3, 4, 5]);
  const [dailySpendLimit, setDailySpendLimit] = useState(initialSettings?.daily_spend_limit || 10);
  const [todaySpend, setTodaySpend] = useState(initialSettings?.today_spend || 0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const supabase = createClient();

  // Poll for today's spend
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('ai_control_settings')
        .select('today_spend')
        .eq('user_id', userId)
        .single();

      if (data) {
        setTodaySpend(data.today_spend || 0);
      }
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [userId, supabase]);

  const toggleDay = (dayIndex: number) => {
    if (scheduleDays.includes(dayIndex)) {
      setScheduleDays(scheduleDays.filter(d => d !== dayIndex));
    } else {
      setScheduleDays([...scheduleDays, dayIndex].sort());
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/ai-control/automation-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          scheduleEnabled,
          scheduleTime,
          scheduleDays,
          dailySpendLimit,
        }),
      });

      if (response.ok) {
        setMessage('✅ Settings saved successfully!');
      } else {
        const error = await response.json();
        setMessage(`❌ Error: ${error.error}`);
      }
    } catch (error) {
      setMessage('❌ Failed to save settings');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const spendPercentage = Math.min((todaySpend / dailySpendLimit) * 100, 100);

  return (
    <div className="bg-[#1A2647]/40 backdrop-blur-xl rounded-2xl border border-gray-700/30 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">⚙️ Automation Settings</h3>
          <p className="text-gray-400 text-sm">Schedule AI and set spending limits</p>
        </div>
      </div>

      {/* Auto-Scheduling Section */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between p-4 bg-[#0B1437]/60 rounded-lg border border-gray-700/30">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-400" />
            <div>
              <h4 className="text-white font-semibold">Auto-Start Scheduling</h4>
              <p className="text-gray-400 text-sm">AI automatically starts at scheduled times</p>
            </div>
          </div>
          <button
            onClick={() => setScheduleEnabled(!scheduleEnabled)}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              scheduleEnabled ? 'bg-blue-500' : 'bg-gray-600'
            }`}
          >
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
              scheduleEnabled ? 'translate-x-8' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {scheduleEnabled && (
          <div className="space-y-4 p-4 bg-[#0B1437]/40 rounded-lg border border-blue-500/20 animate-in fade-in slide-in-from-top-2">
            {/* Time Picker */}
            <div>
              <label className="text-white font-semibold flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-400" />
                Start Time
              </label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full bg-[#0B1437] text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Day Selector */}
            <div>
              <label className="text-white font-semibold block mb-2">Active Days</label>
              <div className="flex gap-2">
                {dayNames.map((day, index) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(index)}
                    className={`flex-1 px-3 py-2 rounded-lg font-semibold transition-all ${
                      scheduleDays.includes(index)
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Daily Spend Limit Section */}
      <div className="pt-6 border-t border-gray-700/30">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-green-400" />
          <h4 className="text-white font-semibold">💰 Daily Spend Limit</h4>
        </div>
        <p className="text-gray-400 text-sm mb-4">AI stops when daily spend reaches this amount</p>
        
        {/* Quick Select Buttons */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {[10, 25, 50, 100, 200].map(amount => (
            <button
              key={amount}
              onClick={() => setDailySpendLimit(amount)}
              className={`px-3 py-2 rounded-lg font-semibold transition-all text-sm ${
                dailySpendLimit === amount
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              ${amount}
            </button>
          ))}
        </div>

        {/* Custom Amount Input */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-white font-semibold text-sm">Custom:</span>
          <input
            type="number"
            value={dailySpendLimit}
            onChange={(e) => setDailySpendLimit(parseFloat(e.target.value) || 10)}
            min="1"
            max="1000"
            step="5"
            className="flex-1 bg-[#0B1437] text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
          />
          <span className="text-gray-400 text-sm">per day</span>
        </div>

        {/* Today's Spend Progress */}
        <div className="p-4 bg-[#0B1437] rounded-lg border border-gray-700/30">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Today's Spend</span>
            <span className="text-white font-semibold">
              ${todaySpend.toFixed(2)} / ${dailySpendLimit.toFixed(2)}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                spendPercentage >= 100 ? 'bg-red-500' : spendPercentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${spendPercentage}%` }}
            />
          </div>
          {spendPercentage >= 100 && (
            <p className="text-red-400 text-xs mt-2 font-semibold">
              ⚠️ Daily limit reached! AI will stop.
            </p>
          )}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={saveSettings}
        disabled={saving}
        className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-xl"
      >
        {saving ? '💾 Saving...' : '💾 Save Automation Settings'}
      </button>

      {message && (
        <div className={`mt-3 p-3 rounded-lg text-sm font-semibold ${
          message.includes('✅') ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}

