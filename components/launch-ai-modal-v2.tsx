'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { X, Zap, Clock, Target, AlertTriangle, Rocket } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LaunchAIModalV2Props {
  userId: string;
  initialLimit: number;
  initialTransfer: boolean;
  initialMode?: string;
  initialLeadCount?: number;
  initialTargetTime?: number | null;
  maxCallsAllowed?: number;
  subscriptionTier?: 'starter' | 'pro' | 'elite' | null;
  onClose: () => void;
  onLaunched: () => void;
}

type ExecutionMode = 'leads' | 'time';
type ModalStep = 'config' | 'warning' | 'countdown' | 'launching';

export function LaunchAIModalV2({ 
  userId, 
  initialLimit, 
  initialTransfer, 
  initialMode = 'time',
  initialLeadCount,
  initialTargetTime,
  maxCallsAllowed = 600,
  subscriptionTier = null,
  onClose, 
  onLaunched 
}: LaunchAIModalV2Props) {
  const router = useRouter();
  
  // Helper: Convert military time to HH:MM format
  const convertMilitaryToTime = (military: number | null): string => {
    if (!military) return '18:00';
    const hours = Math.floor(military / 100);
    const minutes = military % 100;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  
  // Determine step size for slider based on tier
  const sliderStep = 
    subscriptionTier === 'elite' ? 30 : 
    subscriptionTier === 'pro' ? 20 : 
    10;

  // Helper: Round to nearest snap value
  const roundToStep = (value: number, step: number) => {
    return Math.round(value / step) * step;
  };

  // Form state - Initialize with last used values, default to 'time' if no previous settings
  const [executionMode, setExecutionMode] = useState<ExecutionMode>(initialMode as ExecutionMode);
  const [leadCount, setLeadCount] = useState(roundToStep(initialLeadCount || initialLimit, sliderStep));
  const [targetTime, setTargetTime] = useState(convertMilitaryToTime(initialTargetTime ?? null));
  // Live transfer is always enabled - no longer a toggle option
  const liveTransfer = true;
  
  // Modal flow state
  const [step, setStep] = useState<ModalStep>('config');
  const [countdown, setCountdown] = useState(3);
  const [launching, setLaunching] = useState(false);

  // Determine calls per minute based on tier
  const callsPerMinute = 
    subscriptionTier === 'elite' ? 3 : 
    subscriptionTier === 'pro' ? 2 : 
    1;
  const minutesPerCall = 1 / callsPerMinute;

  // Calculate estimated runtime based on tier
  const estimatedMinutes = leadCount * minutesPerCall;
  const estimatedHours = Math.floor(estimatedMinutes / 60);
  const estimatedRemainingMinutes = Math.floor(estimatedMinutes % 60);
  const estimatedTimeDisplay = estimatedHours > 0 
    ? `~${estimatedHours}h ${estimatedRemainingMinutes}m`
    : `~${Math.ceil(estimatedMinutes)} min`;

  // Countdown animation
  const startCountdown = () => {
    setStep('countdown');
    let count = 3;
    setCountdown(count);

    const interval = setInterval(() => {
      count--;
      setCountdown(count);
      
      if (count === 0) {
        clearInterval(interval);
        setTimeout(() => {
          setStep('launching');
          handleAPILaunch();
        }, 500);
      }
    }, 1000);
  };

  const handleAPILaunch = async () => {
    setLaunching(true);

    // Show launching animation for 3 seconds
    setTimeout(() => {
      onLaunched();
      router.refresh();
    }, 3000);

    // Start AI in background
    try {
      const payload: any = {
        userId,
        liveTransfer,
        executionMode,
      };

      if (executionMode === 'leads') {
        payload.dailyCallLimit = leadCount;
        payload.targetLeadCount = leadCount;
      } else {
        // Convert time to military format as number (e.g., "18:02" → 1802)
        const [hours, minutes] = targetTime.split(':');
        const militaryTime = parseInt(hours) * 100 + parseInt(minutes);
        payload.targetTime = militaryTime;
      }

      await fetch('/api/ai-control/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Error launching AI:', error);
    }
  };

  // Configuration Step
  if (step === 'config') {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4 animate-in fade-in duration-300">
        <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-xl md:rounded-2xl border border-blue-500/20 max-w-2xl w-full shadow-2xl shadow-blue-500/10 animate-in fade-in zoom-in-95 duration-300 max-h-[95vh] overflow-y-auto">
          {/* Header */}
          <div className="p-4 md:p-6 border-b border-gray-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Rocket className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg md:text-2xl font-bold text-white">Deploy AI Agent</h2>
                <p className="text-gray-400 text-xs md:text-sm">Configure execution parameters</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-white transition-all duration-200 hover:rotate-90"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            {/* Execution Mode Selection */}
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-300 mb-3 md:mb-4 flex items-center gap-2">
                <Zap className="w-3 h-3 md:w-4 md:h-4 text-yellow-400" />
                Execution Mode
              </label>
              <div className="grid grid-cols-2 gap-2 md:gap-4">
                {/* Time Limit Mode */}
                <button
                  onClick={() => setExecutionMode('time')}
                  className={`p-4 md:p-6 rounded-lg md:rounded-xl border-2 transition-all duration-300 ${
                    executionMode === 'time'
                      ? 'bg-gradient-to-br from-purple-600/20 to-purple-500/10 border-purple-500 shadow-lg shadow-purple-500/20 scale-[1.02]'
                      : 'bg-[#0B1437] border-gray-700 hover:border-purple-500/30 hover:scale-[1.01]'
                  }`}
                >
                  <Clock className={`w-6 h-6 md:w-8 md:h-8 mb-2 md:mb-3 mx-auto ${executionMode === 'time' ? 'text-purple-400' : 'text-gray-500'}`} />
                  <p className={`text-sm md:text-base font-semibold mb-1 ${executionMode === 'time' ? 'text-white' : 'text-gray-400'}`}>
                    Time Limit
                  </p>
                  <p className="text-[10px] md:text-xs text-gray-500">
                    Run until specific time
                  </p>
                </button>

                {/* Lead Count Mode */}
                <button
                  onClick={() => setExecutionMode('leads')}
                  className={`p-4 md:p-6 rounded-lg md:rounded-xl border-2 transition-all duration-300 ${
                    executionMode === 'leads'
                      ? 'bg-gradient-to-br from-blue-600/20 to-blue-500/10 border-blue-500 shadow-lg shadow-blue-500/20 scale-[1.02]'
                      : 'bg-[#0B1437] border-gray-700 hover:border-blue-500/30 hover:scale-[1.01]'
                  }`}
                >
                  <Target className={`w-6 h-6 md:w-8 md:h-8 mb-2 md:mb-3 mx-auto ${executionMode === 'leads' ? 'text-blue-400' : 'text-gray-500'}`} />
                  <p className={`text-sm md:text-base font-semibold mb-1 ${executionMode === 'leads' ? 'text-white' : 'text-gray-400'}`}>
                    Lead Count
                  </p>
                  <p className="text-[10px] md:text-xs text-gray-500">
                    Run until X leads dialed
                  </p>
                </button>
              </div>
            </div>

            {/* Lead Count Input */}
            {executionMode === 'leads' && (
              <div className="space-y-3 md:space-y-4 animate-in fade-in slide-in-from-top duration-300">
                <label className="block text-xs md:text-sm font-medium text-gray-300 text-center">
                  Number of Leads to Dial
                </label>
                <div className="relative px-2">
                  <input
                    type="range"
                    min={sliderStep}
                    max={maxCallsAllowed}
                    step={sliderStep}
                    value={leadCount}
                    onChange={(e) => setLeadCount(parseInt(e.target.value))}
                    className="w-full h-2 md:h-3 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(leadCount / maxCallsAllowed) * 100}%, #1F2937 ${(leadCount / maxCallsAllowed) * 100}%, #1F2937 100%)`
                    }}
                  />
                </div>
                
                {/* Lead Count - Centered with Estimated Runtime on Right */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6">
                  <div className="bg-gradient-to-br from-blue-600/20 to-blue-500/10 border-2 border-blue-500 rounded-lg md:rounded-xl px-8 md:px-12 py-4 md:py-6 text-center shadow-lg shadow-blue-500/20 w-full md:w-auto">
                    <span className="text-4xl md:text-6xl font-bold text-blue-400">{leadCount}</span>
                    <p className="text-blue-400/60 text-xs md:text-sm mt-1 md:mt-2">leads to dial</p>
                  </div>
                  
                  {/* Estimated Runtime - Small & Dimmed */}
                  <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg px-3 md:px-4 py-2 md:py-3 text-center w-full md:w-auto">
                    <p className="text-[10px] md:text-xs text-gray-500 mb-1">Est. Runtime</p>
                    <p className="text-sm md:text-base font-semibold text-gray-400">{estimatedTimeDisplay}</p>
                    <p className="text-[10px] md:text-xs text-gray-600 mt-1">
                      {subscriptionTier === 'elite' ? '~3 leads/min' : 
                       subscriptionTier === 'pro' ? '~2 leads/min' : 
                       '~1 lead/min'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Time Limit Input */}
            {executionMode === 'time' && (
              <div className="space-y-3 md:space-y-4 animate-in fade-in slide-in-from-top duration-300">
                <label className="block text-xs md:text-sm font-medium text-gray-300 text-center">
                  Run Until (Time)
                </label>
                <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6">
                  {/* Time Picker - Centered */}
                  <div className="bg-gradient-to-br from-purple-600/20 to-purple-500/10 border-2 border-purple-500 rounded-lg md:rounded-xl px-8 md:px-12 py-4 md:py-6 text-center shadow-lg shadow-purple-500/20 w-full md:w-auto">
                    <input
                      type="time"
                      value={targetTime}
                      onChange={(e) => setTargetTime(e.target.value)}
                      className="text-4xl md:text-6xl font-bold text-purple-400 bg-transparent border-none outline-none text-center [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                    <p className="text-purple-400/60 text-xs md:text-sm mt-1 md:mt-2">target stop time</p>
                  </div>
                  
                  {/* Estimated Lead Count - Small & Dimmed */}
                  <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg px-3 md:px-4 py-2 md:py-3 text-center w-full md:w-auto">
                    <p className="text-[10px] md:text-xs text-gray-500 mb-1">Est. Leads</p>
                    <p className="text-sm md:text-base font-semibold text-gray-400">
                      ~{(() => {
                        const now = new Date();
                        const [hours, minutes] = targetTime.split(':').map(Number);
                        const target = new Date();
                        target.setHours(hours, minutes, 0, 0);
                        
                        // If target is earlier than now, assume it's tomorrow
                        if (target <= now) {
                          target.setDate(target.getDate() + 1);
                        }
                        
                        const diffMinutes = Math.floor((target.getTime() - now.getTime()) / (1000 * 60));
                        const estimatedLeads = Math.floor(diffMinutes * callsPerMinute);
                        return estimatedLeads > 0 ? estimatedLeads : 0;
                      })()} leads
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {subscriptionTier === 'elite' ? '~3 leads/min' : 
                       subscriptionTier === 'pro' ? '~2 leads/min' : 
                       '~1 lead/min'}
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-gray-800 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-700 bg-transparent text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200 font-medium h-12"
            >
              Cancel
            </button>
            <button
              onClick={() => setStep('warning')}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/40 h-12"
            >
              <span className="flex items-center justify-center gap-2">
                <Rocket className="w-5 h-5" />
                Continue
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Warning Step
  if (step === 'warning') {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-2 md:p-4 animate-in fade-in duration-300">
        <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-xl md:rounded-2xl border-2 border-orange-500/40 max-w-lg w-full shadow-2xl shadow-orange-500/30 animate-in fade-in zoom-in duration-300 max-h-[95vh] overflow-y-auto">
          {/* Header */}
          <div className="p-4 md:p-6 border-b border-gray-800/50 text-center">
            <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 mb-2 md:mb-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-orange-500/20 flex items-center justify-center border-2 border-orange-500/50 animate-pulse">
                <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-orange-400" />
              </div>
              <h2 className="text-lg md:text-2xl font-bold text-white text-center">⚠️ Important Notice</h2>
            </div>
            <p className="text-gray-400 text-xs md:text-sm">Please read before proceeding</p>
          </div>

          {/* Warning Content */}
          <div className="p-4 md:p-6 space-y-3 md:space-y-4">
            <div className="bg-orange-950/30 border-2 border-orange-500/30 rounded-lg md:rounded-xl p-4 md:p-5">
              <p className="text-orange-300 font-semibold mb-2 md:mb-3 text-base md:text-lg text-center">
                🚨 Automation Cannot Be Stopped
              </p>
              <p className="text-gray-300 text-xs md:text-sm leading-relaxed mb-3 md:mb-4 text-center">
                Once launched, the AI agent will run continuously until the execution target is reached. 
                The system cannot be manually stopped during operation.
              </p>
              <div className="bg-[#0B1437]/50 rounded-lg p-3 md:p-4 border border-orange-500/20">
                <p className="text-white font-bold mb-1 text-xs md:text-base text-center">Execution Target:</p>
                <p className="text-xl md:text-2xl font-bold text-orange-400 text-center">
                  {executionMode === 'leads' 
                    ? `${leadCount} leads will be dialed`
                    : `AI will run until ${targetTime}`
                  }
                </p>
                {executionMode === 'time' && (
                  <p className="text-xs md:text-sm text-gray-400 mt-2 text-center">
                    ~{(() => {
                      const now = new Date();
                      const [hours, minutes] = targetTime.split(':').map(Number);
                      const target = new Date();
                      target.setHours(hours, minutes, 0, 0);
                      if (target <= now) target.setDate(target.getDate() + 1);
                      const diffMinutes = Math.floor((target.getTime() - now.getTime()) / (1000 * 60));
                      const estimatedLeads = Math.floor(diffMinutes * callsPerMinute);
                      return estimatedLeads > 0 ? estimatedLeads : 0;
                    })()} estimated leads ({subscriptionTier === 'elite' ? '~3 leads/min' : 
                                            subscriptionTier === 'pro' ? '~2 leads/min' : 
                                            '~1 lead/min'})
                  </p>
                )}
                <p className="text-[10px] md:text-xs text-gray-400 mt-2 text-center">
                  The automation will not stop until this target is met
                </p>
              </div>
            </div>

            <div className="bg-blue-950/20 border border-blue-500/20 rounded-lg p-3 md:p-4">
              <p className="text-blue-300 text-xs md:text-sm text-center">
                ℹ️ <strong>Quick Reminder:</strong> Momentum creates money — and it starts with the first dial...
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 md:p-6 border-t border-gray-800/50 flex flex-col md:flex-row gap-2 md:gap-3">
            <button
              onClick={() => setStep('config')}
              className="px-4 md:px-6 py-2.5 md:py-3 border border-gray-700 bg-transparent text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200 font-medium text-sm md:text-base"
            >
              ← Back
            </button>
            <button
              onClick={startCountdown}
              className="flex-1 px-4 py-2.5 md:py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-500/40 text-sm md:text-base"
            >
              I Understand - Proceed
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Countdown Step
  if (step === 'countdown') {
    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-lg z-50 flex items-center justify-center animate-in fade-in duration-500">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="text-[200px] font-black text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-purple-600 animate-pulse leading-none">
              {countdown}
            </div>
            <div className="absolute inset-0 text-[200px] font-black text-blue-500/20 blur-2xl leading-none">
              {countdown}
            </div>
          </div>
          <p className="text-2xl text-gray-400 font-semibold animate-pulse">
            Launching AI Agent...
          </p>
        </div>
      </div>
    );
  }

  // Launching Animation
  if (step === 'launching') {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center overflow-hidden animate-in fade-in duration-700">
        {/* Smoke/Particle Effects */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute bottom-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl animate-rise"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        {/* Rocket Animation */}
        <div className="relative z-10 text-center animate-in zoom-in duration-1000">
          <div className="relative mb-8">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-blue-500 via-purple-500 to-transparent rounded-full blur-3xl opacity-50 animate-pulse" />
            
            {/* Rocket */}
            <div className="relative">
              <Rocket className="w-32 h-32 text-blue-400 animate-bounce" style={{ animationDuration: '0.8s' }} />
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-gradient-to-b from-orange-500/50 to-transparent blur-xl animate-pulse" />
            </div>
          </div>
          
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-4 animate-pulse">
            DEPLOYING AI AGENT
          </h2>
          
          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
            <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
          </div>

          <p className="text-gray-400 mt-6 text-sm">
            Initializing neural networks...
          </p>
        </div>

        <style jsx>{`
          @keyframes rise {
            0% {
              transform: translateY(100vh) scale(0.5);
              opacity: 0;
            }
            50% {
              opacity: 0.3;
            }
            100% {
              transform: translateY(-100vh) scale(1.5);
              opacity: 0;
            }
          }
          .animate-rise {
            animation: rise 5s ease-out infinite;
          }
        `}</style>
      </div>
    );
  }

  return null;
}

