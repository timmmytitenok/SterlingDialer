'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { X, Zap, DollarSign, Target, Rocket, Info } from 'lucide-react';
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

type ExecutionMode = 'leads' | 'budget';
type ModalStep = 'config' | 'countdown' | 'launching';

export function LaunchAIModalV2({ 
  userId, 
  initialLimit, 
  initialTransfer, 
  initialMode = 'budget',
  initialLeadCount,
  initialTargetTime,
  maxCallsAllowed = 800,
  subscriptionTier = null,
  onClose, 
  onLaunched 
}: LaunchAIModalV2Props) {
  const router = useRouter();
  
  // Form state - Initialize with last used values, default to 'budget' if no previous settings
  const [executionMode, setExecutionMode] = useState<ExecutionMode>(initialMode as ExecutionMode);
  const [leadCount, setLeadCount] = useState(initialLeadCount || initialLimit || 50);
  const [budget, setBudget] = useState(15); // Default $15 budget
  // Live transfer is always enabled - no longer a toggle option
  const liveTransfer = true;
  
  // Modal flow state
  const [step, setStep] = useState<ModalStep>('config');
  const [countdown, setCountdown] = useState(3);
  const [launching, setLaunching] = useState(false);
  
  // Animation states for budget slider
  const [budgetChanging, setBudgetChanging] = useState(false);
  const [budgetJitter, setBudgetJitter] = useState(false);
  const [showBudgetTooltip, setShowBudgetTooltip] = useState(false);
  const [showLeadTooltip, setShowLeadTooltip] = useState(false);

  // Handle budget change with animations
  const handleBudgetChange = (value: number) => {
    setBudget(value);
    setBudgetChanging(true);
    setBudgetJitter(true);
    
    // Reset jitter after animation
    setTimeout(() => setBudgetJitter(false), 150);
    
    // Reset changing state after a delay
    setTimeout(() => setBudgetChanging(false), 300);
  };
  
  // Handle lead count change with animations
  const handleLeadCountChange = (value: number) => {
    setLeadCount(value);
    setBudgetChanging(true);
    setBudgetJitter(true);
    
    // Reset jitter after animation
    setTimeout(() => setBudgetJitter(false), 150);
    
    // Reset changing state after a delay
    setTimeout(() => setBudgetChanging(false), 300);
  };

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

    // Start AI and WAIT for response
    try {
      const payload: any = {
        userId,
        liveTransfer,
        executionMode,
      };

      if (executionMode === 'leads') {
        payload.dailyCallLimit = leadCount;
        payload.targetLeadCount = leadCount;
      } else if (executionMode === 'budget') {
        // Budget mode: calculate max leads based on budget
        // Assuming $0.05 per call, $25 budget = 500 calls
        const estimatedLeads = Math.floor(budget / 0.05);
        payload.dailyCallLimit = estimatedLeads;
        payload.targetLeadCount = estimatedLeads;
        payload.budget = budget;
      }

      console.log('🚀 Starting AI with payload:', payload);

      const response = await fetch('/api/ai-control/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('🚀 Response status:', response.status, response.statusText);

      // Try to parse response - handle both JSON and non-JSON responses
      let result: any;
      try {
        const text = await response.text();
        console.log('🚀 Response text (first 500 chars):', text.substring(0, 500));
        result = JSON.parse(text);
      } catch (parseError) {
        console.error('❌ Failed to parse response:', parseError);
        setLaunching(false);
        alert(`❌ Server returned an invalid response.\n\nThis usually means:\n1. Retell API key is incorrect\n2. Retell config is missing\n3. No callable leads available\n\nCheck /dashboard/ai-dialer/debug for details.`);
        return;
      }
      
      console.log('🚀 Start response:', result);

      if (!response.ok) {
        // ERROR! Show it to user
        setLaunching(false);
        alert(`❌ Failed to start AI:\n\n${result.error || 'Unknown error'}\n\n${JSON.stringify(result.details || '', null, 2)}`);
        return;
      }

      // Success! Show launching animation for 2 seconds then close
      setTimeout(() => {
        onLaunched();
        router.refresh();
      }, 2000);

    } catch (error: any) {
      console.error('❌ Error launching AI:', error);
      setLaunching(false);
      alert(`❌ Failed to start AI:\n\n${error.message || 'Network error'}`);
    }
  };

  // Configuration Step
  if (step === 'config') {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-2 md:p-4 animate-in fade-in duration-300">
        <div className="relative max-w-2xl w-full animate-in fade-in zoom-in-95 duration-400">
          {/* Outer Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-[28px] opacity-50 blur-xl animate-pulse" style={{ animationDuration: '3s' }} />
          <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-[26px] opacity-70" />
          
          {/* Inner Card */}
          <div className="relative bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-[24px] overflow-hidden max-h-[95vh] overflow-y-auto">
            {/* Animated Background Glows */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute w-80 h-80 bg-cyan-500/15 rounded-full blur-[100px] -top-32 -right-32 animate-pulse" style={{ animationDuration: '3s' }} />
              <div className="absolute w-64 h-64 bg-purple-500/15 rounded-full blur-[80px] -bottom-20 -left-20 animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
            </div>

            {/* Top Glow Line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

            <div className="relative">
              {/* Header */}
              <div className="p-4 md:p-6 border-b border-cyan-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-cyan-500/40 rounded-xl blur-lg animate-pulse" />
                    <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                      <Rocket className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">Deploy AI Agent</h2>
                    <p className="text-gray-400 text-xs md:text-sm">Configure execution parameters</p>
                  </div>
                </div>
                <button 
                  onClick={onClose} 
                  className="p-2 hover:bg-cyan-500/10 rounded-xl transition-all duration-200 border border-transparent hover:border-cyan-500/30"
                >
                  <X className="w-5 h-5 md:w-6 md:h-6 text-gray-400 hover:text-cyan-300" />
                </button>
              </div>

          {/* Content */}
          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            {/* Execution Mode Selection */}
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-300 mb-3 md:mb-4 flex items-center gap-2">
                <Zap className="w-3 h-3 md:w-4 md:h-4 text-cyan-400" />
                Execution Mode
              </label>
              <div className="grid grid-cols-2 gap-2 md:gap-4">
                {/* Budget Mode */}
                <button
                  onClick={() => setExecutionMode('budget')}
                  className={`p-4 md:p-6 rounded-xl border-2 transition-all duration-300 backdrop-blur-sm ${
                    executionMode === 'budget'
                      ? 'bg-cyan-500/30 border-cyan-400 scale-110 shadow-lg shadow-cyan-500/50'
                      : 'bg-white/5 border-gray-600/30 hover:bg-white/10 hover:border-cyan-500/50 hover:scale-105'
                  }`}
                  style={executionMode === 'budget' ? {
                    boxShadow: '0 0 25px rgba(6, 182, 212, 0.6), 0 0 40px rgba(6, 182, 212, 0.3)'
                  } : undefined}
                >
                  <DollarSign className={`w-6 h-6 md:w-8 md:h-8 mb-2 md:mb-3 mx-auto ${executionMode === 'budget' ? 'text-cyan-300' : 'text-gray-500'}`} />
                  <p className={`text-sm md:text-base font-bold mb-1 ${executionMode === 'budget' ? 'text-white' : 'text-gray-400'}`}>
                    Budget
                  </p>
                  <p className="text-[10px] md:text-xs text-gray-500">
                    Run until budget is met
                  </p>
                </button>

                {/* Lead Count Mode */}
                <button
                  onClick={() => setExecutionMode('leads')}
                  className={`p-4 md:p-6 rounded-xl border-2 transition-all duration-300 backdrop-blur-sm ${
                    executionMode === 'leads'
                      ? 'bg-purple-500/30 border-purple-400 scale-110 shadow-lg shadow-purple-500/50'
                      : 'bg-white/5 border-gray-600/30 hover:bg-white/10 hover:border-purple-500/50 hover:scale-105'
                  }`}
                  style={executionMode === 'leads' ? {
                    boxShadow: '0 0 25px rgba(168, 85, 247, 0.6), 0 0 40px rgba(168, 85, 247, 0.3)'
                  } : undefined}
                >
                  <Target className={`w-6 h-6 md:w-8 md:h-8 mb-2 md:mb-3 mx-auto ${executionMode === 'leads' ? 'text-purple-300' : 'text-gray-500'}`} />
                  <p className={`text-sm md:text-base font-bold mb-1 ${executionMode === 'leads' ? 'text-white' : 'text-gray-400'}`}>
                    Lead Count
                  </p>
                  <p className="text-[10px] md:text-xs text-gray-500">
                    Dial X amount of leads
                  </p>
                </button>
              </div>
            </div>

            {/* Budget Mode Input */}
            {executionMode === 'budget' && (
              <div className="space-y-4 md:space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-center gap-2">
                  <label className="block text-xs md:text-sm font-medium text-gray-300 text-center">
                    Set Your Budget
                  </label>
                  <button
                    onMouseEnter={() => setShowBudgetTooltip(true)}
                    onMouseLeave={() => setShowBudgetTooltip(false)}
                    className="relative"
                  >
                    <Info className="w-4 h-4 text-gray-400 hover:text-cyan-400 transition-colors cursor-help" />
                    {showBudgetTooltip && (
                      <div className="absolute left-0 top-6 w-64 p-3 bg-gray-900 border border-cyan-500/30 rounded-lg text-xs text-gray-300 z-50 shadow-xl">
                        AI will run until budget is met OR calling hours end (whichever comes first)
                      </div>
                    )}
                  </button>
                </div>
                
                {/* Budget Display */}
                <div className="text-center">
                  <div className={`inline-block transition-all duration-150 ${
                    budgetJitter ? 'animate-jitter' : ''
                  } ${
                    budgetChanging ? 'scale-125' : 'scale-100'
                  }`}>
                    <p className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 mb-2 animate-gradient" 
                       style={{
                         filter: 'drop-shadow(0 0 20px rgba(6, 182, 212, 0.5))',
                         WebkitTextStroke: budgetChanging ? '1px rgba(6, 182, 212, 0.3)' : '0px'
                       }}>
                      ${budget}
                    </p>
                  </div>
                  <p className="text-gray-400 mb-2 font-medium text-sm">
                    AI stops when budget is met or calling hours end
                  </p>
                  
                  {/* Estimated Stats */}
                  <div className={`flex items-center justify-center gap-4 text-sm transition-all duration-200 ${
                    budgetChanging ? 'scale-110' : 'scale-100'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400 text-lg">≈</span>
                      <span className="text-white font-bold text-lg">{Math.floor(budget / 0.05)}</span>
                      <span className="text-gray-400">calls</span>
                    </div>
                  </div>
                </div>

                {/* Slider */}
                <div className="space-y-3">
                  <div className="p-4 bg-[#0B1437]/50 rounded-xl border-2 border-cyan-500/30 shadow-lg shadow-cyan-500/10">
                    <input
                      type="range"
                      min="1"
                      max="60"
                      value={budget}
                      onChange={(e) => handleBudgetChange(parseInt(e.target.value))}
                      className="w-full h-3 rounded-full appearance-none cursor-pointer transition-all"
                      style={{
                        background: `linear-gradient(to right, #06B6D4 0%, #06B6D4 ${((budget - 1) / 59) * 100}%, #374151 ${((budget - 1) / 59) * 100}%, #374151 100%)`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-sm font-semibold px-2">
                    <span className="text-gray-500">$1</span>
                    <span className="text-gray-400">$30</span>
                    <span className="text-cyan-400">$60</span>
                  </div>
                </div>
              </div>
            )}

            {/* Lead Count Mode Input */}
            {executionMode === 'leads' && (
              <div className="space-y-4 md:space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-center gap-2">
                  <label className="block text-xs md:text-sm font-medium text-gray-300 text-center">
                    Number of Leads to Dial
                  </label>
                  <button
                    onMouseEnter={() => setShowLeadTooltip(true)}
                    onMouseLeave={() => setShowLeadTooltip(false)}
                    className="relative"
                  >
                    <Info className="w-4 h-4 text-gray-400 hover:text-purple-400 transition-colors cursor-help" />
                    {showLeadTooltip && (
                      <div className="absolute left-0 top-6 w-64 p-3 bg-gray-900 border border-purple-500/30 rounded-lg text-xs text-gray-300 z-50 shadow-xl">
                        AI will dial X leads OR until calling hours end (whichever comes first)
                      </div>
                    )}
                  </button>
                </div>
                
                {/* Lead Count Display */}
                <div className="text-center">
                  <div className={`inline-block transition-all duration-150 ${
                    budgetJitter ? 'animate-jitter' : ''
                  } ${
                    budgetChanging ? 'scale-125' : 'scale-100'
                  }`}>
                    <p className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-500 mb-2 animate-gradient" 
                       style={{
                         filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.5))',
                         WebkitTextStroke: budgetChanging ? '1px rgba(168, 85, 247, 0.3)' : '0px'
                       }}>
                      {leadCount}
                    </p>
                  </div>
                  <p className="text-gray-400 mb-2 font-medium text-sm">
                    AI stops after {leadCount} leads or calling hours end
                  </p>
                  
                  {/* Estimated Stats */}
                  <div className={`flex items-center justify-center gap-4 text-sm transition-all duration-200 ${
                    budgetChanging ? 'scale-110' : 'scale-100'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-400 text-lg">≈</span>
                      <span className="text-white font-bold text-lg">${(leadCount * 0.05).toFixed(2)}</span>
                      <span className="text-gray-400">cost</span>
                    </div>
                  </div>
                </div>

                {/* Slider */}
                <div className="space-y-3">
                  <div className="p-4 bg-[#0B1437]/50 rounded-xl border-2 border-purple-500/30 shadow-lg shadow-purple-500/10">
                    <input
                      type="range"
                      min="1"
                      max={maxCallsAllowed}
                      step="1"
                      value={leadCount}
                      onChange={(e) => handleLeadCountChange(parseInt(e.target.value))}
                      className="w-full h-3 rounded-full appearance-none cursor-pointer transition-all"
                      style={{
                        background: `linear-gradient(to right, #A855F7 0%, #A855F7 ${(leadCount / maxCallsAllowed) * 100}%, #374151 ${(leadCount / maxCallsAllowed) * 100}%, #374151 100%)`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-sm font-semibold px-2">
                    <span className="text-gray-500">1</span>
                    <span className="text-gray-400">{Math.floor(maxCallsAllowed / 2)}</span>
                    <span className="text-purple-400">{maxCallsAllowed}</span>
                  </div>
                </div>
              </div>
            )}

          </div>

              {/* Action Buttons */}
              <div className="p-6 border-t border-gray-800/50 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3.5 border border-gray-600/50 bg-gray-800/40 text-gray-400 hover:text-white hover:bg-gray-800/60 hover:border-gray-500/50 rounded-xl transition-all duration-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={startCountdown}
                  className="group relative overflow-hidden flex-1 px-6 py-3.5 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-xl shadow-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/50"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Rocket className="w-5 h-5" />
                    Launch AI
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Animations */}
        <style jsx>{`
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
          .animate-jitter {
            animation: jitter 0.15s ease-in-out;
          }
          .animate-gradient {
            background-size: 200% 200%;
            animation: gradient 3s ease infinite;
          }
        `}</style>
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

