'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, Clock, Calendar, Save, Zap, CheckCircle, AlertCircle, Target } from 'lucide-react';

interface DialerAutomationFormProps {
  userId: string;
  initialSettings: any;
}

export function DialerAutomationForm({ userId, initialSettings }: DialerAutomationFormProps) {
  const router = useRouter();
  
  // State
  const [dailyBudgetCents, setDailyBudgetCents] = useState(initialSettings?.daily_budget_cents || 5000);
  const [autoStartEnabled, setAutoStartEnabled] = useState(initialSettings?.auto_start_enabled || false);
  const [autoStartDays, setAutoStartDays] = useState<string[]>(initialSettings?.auto_start_days || ['mon', 'tue', 'wed', 'thu', 'fri']);
  const [autoStartTime, setAutoStartTime] = useState(initialSettings?.auto_start_time || '09:00');
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const dayOptions = [
    { value: 'mon', label: 'Mon' },
    { value: 'tue', label: 'Tue' },
    { value: 'wed', label: 'Wed' },
    { value: 'thu', label: 'Thu' },
    { value: 'fri', label: 'Fri' },
    { value: 'sat', label: 'Sat' },
    { value: 'sun', label: 'Sun' },
  ];

  const toggleDay = (day: string) => {
    if (autoStartDays.includes(day)) {
      setAutoStartDays(autoStartDays.filter(d => d !== day));
    } else {
      setAutoStartDays([...autoStartDays, day]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/dialer/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daily_budget_cents: dailyBudgetCents,
          auto_start_enabled: autoStartEnabled,
          auto_start_days: autoStartDays,
          auto_start_time: autoStartTime,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Settings saved successfully!');
        setTimeout(() => router.refresh(), 1000);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Failed to save settings');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const dailyBudgetDollars = dailyBudgetCents / 100;

  return (
    <>
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dialer Automation</h1>
        <p className="text-gray-400">Configure your AI dialer settings and automation rules</p>
      </div>

      <div className="space-y-6 max-w-4xl">
        {/* SECTION 1: Daily Spend Limit */}
        <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl p-8 border-2 border-green-500/20 shadow-xl relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-green-500/20 rounded-xl border border-green-500/30">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Daily Spend Limit</h2>
                <p className="text-sm text-gray-400">Maximum amount to spend per day on calls</p>
              </div>
            </div>

            {/* Preset Buttons with Stats */}
            <div className="grid grid-cols-5 gap-3 mb-4">
              {[
                { cents: 1000, dollars: 10 },
                { cents: 2500, dollars: 25 },
                { cents: 5000, dollars: 50 },
                { cents: 7500, dollars: 75 },
                { cents: 10000, dollars: 100 },
              ].map((preset) => {
                const minutes = Math.round((preset.cents / 100) / 0.30);
                const dials = Math.round(minutes * 6);
                const appointments = Math.round(dials / 150);
                return (
                  <button
                    key={preset.cents}
                    onClick={() => setDailyBudgetCents(preset.cents)}
                    className={`group p-3 rounded-xl font-bold transition-all ${
                      dailyBudgetCents === preset.cents
                        ? 'bg-green-600 text-white shadow-xl shadow-green-500/40 scale-105'
                        : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700 hover:text-gray-200 border border-gray-700 hover:scale-102'
                    }`}
                  >
                    <div className="text-2xl mb-1">${preset.dollars}</div>
                    <div className={`text-[10px] leading-tight ${
                      dailyBudgetCents === preset.cents ? 'text-green-200' : 'text-gray-500 group-hover:text-gray-400'
                    }`}>
                      <div>{minutes} min</div>
                      <div>≈{dials} dials</div>
                      <div>≈{appointments} appt{appointments !== 1 ? 's' : ''}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Input */}
            <div className="bg-[#0B1437]/60 rounded-xl p-4 border border-gray-700">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Custom Amount
              </label>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-white font-semibold">$</span>
                <input
                  type="number"
                  value={dailyBudgetDollars}
                  onChange={(e) => setDailyBudgetCents(Math.round(parseFloat(e.target.value || '0') * 100))}
                  min="5"
                  max="500"
                  step="5"
                  className="flex-1 px-4 py-2 bg-[#0B1437] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <span className="text-gray-400">per day</span>
              </div>
              
              {/* Stats for Custom Amount */}
              {dailyBudgetCents > 0 && (
                <div className="flex items-center gap-4 text-xs flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-blue-400" />
                    <span className="text-gray-400">
                      <span className="text-white font-semibold">{Math.round(dailyBudgetDollars / 0.30)}</span> minutes
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3 h-3 text-green-400" />
                    <span className="text-gray-400">
                      ≈<span className="text-white font-semibold">{Math.round((dailyBudgetDollars / 0.30) * 6)}</span> dials
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-purple-400" />
                    <span className="text-gray-400">
                      ≈<span className="text-white font-semibold">{Math.round(((dailyBudgetDollars / 0.30) * 6) / 150)}</span> appt{Math.round(((dailyBudgetDollars / 0.30) * 6) / 150) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-2">
                AI will pause when this limit is reached
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: Auto-Start Schedule */}
        <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl p-8 border-2 border-blue-500/20 shadow-xl relative overflow-hidden">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Auto-Start Schedule</h2>
                <p className="text-sm text-gray-400">Automatically start the AI dialer on a schedule</p>
              </div>
            </div>

            {/* Enable Toggle */}
            <div className="flex items-center justify-between p-4 bg-[#0B1437]/60 rounded-xl border border-gray-700 mb-4">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-white font-semibold">Enable Auto-Start</p>
                  <p className="text-xs text-gray-400">AI will start automatically at scheduled times</p>
                </div>
              </div>
              <button
                onClick={() => setAutoStartEnabled(!autoStartEnabled)}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  autoStartEnabled ? 'bg-blue-500' : 'bg-gray-600'
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  autoStartEnabled ? 'translate-x-8' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {autoStartEnabled && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                {/* Day Selector */}
                <div>
                  <label className="block text-sm font-medium text-white mb-3">Active Days</label>
                  <div className="grid grid-cols-7 gap-2">
                    {dayOptions.map((day) => (
                      <button
                        key={day.value}
                        onClick={() => toggleDay(day.value)}
                        className={`px-3 py-2 rounded-lg font-semibold transition-all ${
                          autoStartDays.includes(day.value)
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Input */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={autoStartTime}
                    onChange={(e) => setAutoStartTime(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0B1437] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-xs text-blue-300">
                    ℹ️ AI will automatically start at {autoStartTime} and dial until daily budget is met on selected days
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`flex items-center gap-3 p-4 rounded-xl border backdrop-blur-sm animate-in slide-in-from-top-2 duration-300 ${
            message.includes('Error') || message.includes('Failed')
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-green-500/10 border-green-500/30 text-green-400'
          }`}>
            {message.includes('Error') || message.includes('Failed') ? (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 flex-shrink-0 animate-in zoom-in duration-300" />
            )}
            <span className="text-sm font-medium">{message}</span>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="group relative w-full overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
          <div className="relative flex items-center justify-center gap-3 px-6 py-4">
            <Save className="w-5 h-5" />
            <span className="font-semibold text-lg">
              {saving ? 'Saving Settings...' : 'Save All Settings'}
            </span>
          </div>
        </button>

        {/* Info Footer */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <p className="text-sm text-blue-300 text-center">
            💡 These settings control when and how your AI dialer operates automatically
          </p>
        </div>
      </div>
    </>
  );
}

