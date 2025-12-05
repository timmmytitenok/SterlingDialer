'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Clock, Calendar, DollarSign, Zap, Check, X, AlertCircle, Info, CheckCircle } from 'lucide-react';

interface AutomationSettingsRefactoredProps {
  userId: string;
  initialSettings: any;
}

export function AutomationSettingsRefactored({ userId, initialSettings }: AutomationSettingsRefactoredProps) {
  const router = useRouter();
  const [autoScheduleEnabled, setAutoScheduleEnabled] = useState(initialSettings?.schedule_enabled || false);
  const [selectedDays, setSelectedDays] = useState<number[]>(initialSettings?.schedule_days || [1, 2, 3, 4, 5]);
  const [dailyBudget, setDailyBudget] = useState(initialSettings?.daily_spend_limit || 25);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [budgetChanging, setBudgetChanging] = useState(false);
  const [budgetJitter, setBudgetJitter] = useState(false);

  const supabase = createClient();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const toggleDay = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      setSelectedDays(selectedDays.filter(d => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex].sort());
    }
  };

  const handleBudgetChange = (value: number) => {
    setDailyBudget(value);
    setBudgetChanging(true);
    setBudgetJitter(true);
    
    // Reset jitter after animation
    setTimeout(() => setBudgetJitter(false), 150);
    
    // Reset changing state after a delay
    setTimeout(() => setBudgetChanging(false), 300);
  };

  const handleTurnOn = () => {
    setAutoScheduleEnabled(true);
  };

  const handleDisable = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/ai-control/automation-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          scheduleEnabled: false,
          scheduleDays: selectedDays,
          dailySpendLimit: dailyBudget,
        }),
      });

      if (response.ok) {
        setAutoScheduleEnabled(false);
        setMessage({ 
          type: 'success', 
          text: 'Automation disabled! Redirecting to AI Dialer...' 
        });
        
        // Force a full page reload to clear all caches, then navigate
        setTimeout(() => {
          window.location.href = '/dashboard/ai-dialer';
        }, 1000);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to disable' });
        setSaving(false);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to disable automation' });
      setSaving(false);
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
          scheduleDays: selectedDays,
          dailySpendLimit: dailyBudget,
        }),
      });

      if (response.ok) {
        const selectedDayNames = selectedDays.map(d => dayNames[d]).join(', ');
        setMessage({ 
          type: 'success', 
          text: `Automation updated! Your AI will start at 9 AM PST / 12 PM EST on ${selectedDayNames}, and stop after $${dailyBudget} of calls.` 
        });
        
        // Redirect to AI Dialer after a brief delay to show success message
        setTimeout(() => {
          router.push('/dashboard/ai-dialer');
        }, 1500);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const getSelectedDaysText = () => {
    if (selectedDays.length === 0) return 'No days selected';
    if (selectedDays.length === 7) return 'Every day';
    return selectedDays.map(d => dayNames[d]).join(', ');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dialer Automation</h1>
        <p className="text-gray-400">Set when and how your AI calls leads — fully automatic</p>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-xl border-2 backdrop-blur-sm animate-in slide-in-from-top duration-300 ${
          message.type === 'success' 
            ? 'bg-green-500/10 text-green-300 border-green-500/40' 
            : 'bg-red-500/10 text-red-300 border-red-500/40'
        }`}>
          <div className="flex items-center gap-3">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="text-sm">{message.text}</p>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-[#1A2647] rounded-2xl border border-gray-800 overflow-hidden">
        <div className="p-6">
          {/* Header */}
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
            /* Enable Button */
            <button
              onClick={handleTurnOn}
              className="w-full px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-3 text-lg"
              style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' }}
            >
              <Zap className="w-6 h-6" />
              Enable Automation
            </button>
          ) : (
            /* Configuration - Smooth fade in animation */
            <div className="space-y-6 animate-fadeInSmooth">
              {/* SECTION 1: Schedule Settings */}
              <div className="p-6 bg-[#0F172A]/50 rounded-2xl border-2 border-blue-500/30">
                <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-blue-400" />
                  1. Set Your Schedule
                </h4>
                
                {/* Fixed Start Time Info */}
                <div className="mb-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-semibold mb-1">Start Time: 9 AM PST / 12 PM EST</p>
                      <p className="text-gray-400 text-sm">
                        Automated sessions start at a unified time to maintain consistent performance and call quality.
                        <br /><br />
                        Select which days you'd like the AI to run below.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Days to Run */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Days to Run
                  </label>
                  <p className="text-gray-400 text-sm mb-3">
                    Select which days the AI should run
                  </p>
                  <div className="grid grid-cols-7 gap-2">
                    {dayNames.map((day, index) => (
                      <button
                        key={index}
                        onClick={() => toggleDay(index)}
                        className={`py-3 px-2 rounded-xl font-bold text-sm transition-all duration-300 backdrop-blur-sm ${
                          selectedDays.includes(index)
                            ? 'bg-blue-500/30 text-white border-2 border-blue-400 scale-110 shadow-lg shadow-blue-500/50 animate-pulse-slow'
                            : 'bg-white/5 text-gray-400 border-2 border-gray-600/30 hover:bg-white/10 hover:border-blue-500/50 hover:text-white hover:scale-105'
                        }`}
                        style={selectedDays.includes(index) ? {
                          boxShadow: '0 0 25px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.3)'
                        } : undefined}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 2: Daily Budget */}
              <div className="p-6 bg-[#0F172A]/50 rounded-2xl border-2 border-green-500/30">
                <h4 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-green-400" />
                  2. Set Daily Budget
                  <button
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    className="relative ml-1"
                  >
                    <Info className="w-4 h-4 text-gray-400 hover:text-blue-400 transition-colors cursor-help" />
                    {showTooltip && (
                      <div className="absolute left-0 top-6 w-72 p-3 bg-gray-900 border border-blue-500/30 rounded-lg text-xs text-gray-300 z-50 shadow-xl">
                        The AI uses your call balance. Setting a daily budget prevents overspending and controls how many leads are dialed each day.
                      </div>
                    )}
                  </button>
                </h4>
                
                {/* Budget Display */}
                <div className="text-center mb-4 mt-6">
                  <div className={`inline-block transition-all duration-150 ${
                    budgetJitter ? 'animate-jitter' : ''
                  } ${
                    budgetChanging ? 'scale-125' : 'scale-100'
                  }`}>
                    <p className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 mb-2 animate-gradient" 
                       style={{
                         filter: 'drop-shadow(0 0 20px rgba(16, 185, 129, 0.5))',
                         WebkitTextStroke: budgetChanging ? '1px rgba(16, 185, 129, 0.3)' : '0px'
                       }}>
                      ${dailyBudget}
                    </p>
                  </div>
                  <p className="text-gray-400 mb-3 font-medium">
                    AI stops when this budget is reached
                  </p>
                  
                  {/* Budget Stats */}
                  <div className={`flex items-center justify-center gap-6 text-sm transition-all duration-200 ${
                    budgetChanging ? 'scale-110' : 'scale-100'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400 text-lg">≈</span>
                      <span className="text-white font-bold text-lg">{Math.round(dailyBudget * 20)}</span>
                      <span className="text-gray-400">dials</span>
                    </div>
                    <div className="w-1 h-1 bg-gray-600 rounded-full" />
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 text-lg">≈</span>
                      <span className="text-white font-bold text-lg">{Math.round(dailyBudget / 7.5)}</span>
                      <span className="text-gray-400">appointments</span>
                    </div>
                  </div>
                </div>
                
                <style jsx global>{`
                  @keyframes jitter {
                    0%, 100% { transform: translateX(0) rotate(0deg); }
                    25% { transform: translateX(-3px) rotate(-1deg); }
                    50% { transform: translateX(3px) rotate(1deg); }
                    75% { transform: translateX(-2px) rotate(-0.5deg); }
                  }
                  @keyframes gradient {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                  }
                  @keyframes fadeInSmooth {
                    0% { 
                      opacity: 0; 
                      transform: scale(0.97);
                      filter: blur(4px);
                    }
                    50% {
                      opacity: 0.8;
                      transform: scale(1.01);
                      filter: blur(0px);
                    }
                    100% { 
                      opacity: 1; 
                      transform: scale(1);
                      filter: blur(0px);
                    }
                  }
                  .animate-jitter {
                    animation: jitter 0.15s ease-in-out;
                  }
                  .animate-gradient {
                    background-size: 200% 200%;
                    animation: gradient 3s ease infinite;
                  }
                  .animate-pulse-slow {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                  }
                  .animate-fadeInSmooth {
                    animation: fadeInSmooth 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                  }
                `}</style>

                {/* Slider */}
                <div className="space-y-3 mb-4">
                  <div className="p-4 bg-[#0B1437]/50 rounded-xl border-2 border-green-500/30 shadow-lg shadow-green-500/10">
                    <input
                      type="range"
                      min="5"
                      max="50"
                      value={dailyBudget}
                      onChange={(e) => handleBudgetChange(parseInt(e.target.value))}
                      className="w-full h-3 rounded-full appearance-none cursor-pointer transition-all"
                      style={{
                        background: `linear-gradient(to right, #10B981 0%, #10B981 ${((dailyBudget - 5) / 45) * 100}%, #374151 ${((dailyBudget - 5) / 45) * 100}%, #374151 100%)`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-sm font-semibold px-2">
                    <span className="text-gray-500">$5</span>
                    <span className="text-gray-400">$25</span>
                    <span className="text-green-400">$50 Max</span>
                  </div>
                  <p className="text-blue-300 text-xs text-center italic mt-2 font-medium">
                    💡 Most users choose $20–$35/day for healthy calling volume
                  </p>
                </div>
              </div>

              {/* Daily Automation Summary Card */}
              <div className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-2 border-green-500/40 rounded-2xl">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Your Daily Automation Summary
                </h4>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-gray-400 min-w-[140px]">Starts at:</span>
                    <span className="text-white font-semibold">9 AM PST / 12 PM EST</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-400 min-w-[140px]">Runs on:</span>
                    <span className="text-white font-semibold">{getSelectedDaysText()}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-400 min-w-[140px]">Budget:</span>
                    <span className="text-green-400 font-semibold">${dailyBudget} <span className="text-gray-400 font-normal">per day</span></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  onClick={handleDisable}
                  disabled={saving}
                  className="flex-1 px-6 py-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-xl font-semibold transition-all hover:scale-105 disabled:scale-100"
                >
                  {saving ? 'Disabling...' : 'Disable Automation'}
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

              {selectedDays.length === 0 && (
                <p className="text-yellow-400 text-sm text-center">
                  ⚠️ Please select at least one day to run
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

