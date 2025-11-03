'use client';

import { useState, useEffect } from 'react';
import { Wallet, Zap, TrendingUp, RefreshCw, Settings, DollarSign, Clock, Sparkles } from 'lucide-react';

interface CallBalanceCardProps {
  userId: string;
  initialBalance?: number;
  initialAutoRefill?: boolean;
  initialRefillAmount?: number;
  currentTier?: 'none' | 'starter' | 'pro' | 'elite';
}

export function CallBalanceCard({ 
  userId,
  initialBalance = 0,
  initialAutoRefill = false,
  initialRefillAmount = 50,
  currentTier = 'starter'
}: CallBalanceCardProps) {
  const [balance, setBalance] = useState(initialBalance);
  const [autoRefill, setAutoRefill] = useState(initialAutoRefill);
  const [refillAmount, setRefillAmount] = useState<number>(initialRefillAmount);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasSelectedAmount, setHasSelectedAmount] = useState(initialAutoRefill); // Track if user selected an amount

  // Determine refill options based on tier
  const refillOptions = 
    currentTier === 'elite' 
      ? { small: 200, large: 400 } 
      : currentTier === 'pro'
      ? { small: 100, large: 200 }
      : { small: 50, large: 100 }; // Starter or default

  // Check if save button should be disabled
  const isSaveDisabled = loading || (autoRefill && !hasSelectedAmount);

  // Calculate estimated minutes remaining
  const minutesRemaining = Math.floor(balance / 0.10);

  // Poll balance every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/balance/get');
        const data = await response.json();
        if (data.balance !== undefined) {
          setBalance(data.balance);
        }
      } catch (error) {
        console.error('Failed to refresh balance:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleManualRefill = async (amount: number) => {
    setLoading(true);
    try {
      const response = await fetch('/api/balance/refill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else if (data.error) {
        alert(`Failed to initiate refill: ${data.error}`);
        setLoading(false);
      }
    } catch (error) {
      alert('Error initiating refill');
      setLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/balance/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auto_refill_enabled: autoRefill,
          auto_refill_amount: refillAmount,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Auto-refill settings updated!');
        setShowSettings(false);
      } else {
        alert(`Failed to update settings: ${data.error}`);
      }
    } catch (error) {
      alert('Error updating settings');
    } finally {
      setLoading(false);
    }
  };

  const balanceStatus = balance < 10 ? 'low' : balance < 25 ? 'medium' : 'good';

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Main Balance Card with Glowing Effects */}
      <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-xl md:rounded-2xl p-4 md:p-8 border border-green-500/20 relative overflow-hidden shadow-2xl hover:shadow-green-500/20 transition-all duration-300 group">
        {/* Animated Background Orbs - hidden on mobile */}
        <div className="hidden md:block absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[300px] h-[300px] bg-green-500/10 rounded-full blur-3xl -top-20 -right-20 animate-pulse" />
          <div className="absolute w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl -bottom-20 -left-20 animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute w-[200px] h-[200px] bg-teal-500/10 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 flex items-center justify-center border-2 border-green-500/50 md:hover:scale-110 transition-transform duration-300 shadow-lg shadow-green-500/20 relative">
              <Wallet className="w-6 h-6 md:w-7 md:h-7 text-green-400 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full animate-ping" />
            </div>
            <div>
              <h3 className="text-lg md:text-2xl font-bold text-white flex items-center gap-1 md:gap-2">
                Call Balance
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 animate-pulse" />
              </h3>
              <p className="text-xs md:text-sm text-gray-400">Prepaid minutes for AI calls</p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 md:p-3 hover:bg-gray-800/50 rounded-lg transition-all duration-300 md:hover:scale-110 group/settings"
          >
            <Settings className={`w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover/settings:text-white transition-all ${showSettings ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {/* Balance Display with Massive Glow */}
        <div className="relative z-10 bg-[#0B1437]/50 rounded-xl md:rounded-2xl p-4 md:p-8 border-2 border-green-500/40 mb-4 md:mb-6 hover:border-green-500/60 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/30 animate-pulse-glow-balance">
          <div className="text-center">
            <p className="text-xs md:text-sm text-gray-400 mb-2 md:mb-3 flex items-center justify-center gap-1 md:gap-2">
              <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
              Current Balance
            </p>
            <div className="flex items-baseline justify-center gap-2 md:gap-3 mb-3 md:mb-4">
              <span className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent md:hover:scale-105 transition-transform duration-300">
                ${balance.toFixed(2)}
              </span>
              <div className={`px-2 md:px-4 py-1 md:py-2 rounded-full text-xs md:text-sm font-bold animate-bounce-slow ${
                balanceStatus === 'low' ? 'bg-red-500/20 text-red-400 border-2 border-red-500/40' :
                balanceStatus === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40' :
                'bg-green-500/20 text-green-400 border-2 border-green-500/40'
              }`}>
                {balanceStatus === 'low' ? '⚠️ LOW' :
                 balanceStatus === 'medium' ? '⚡ OK' :
                 '✓ GOOD'}
              </div>
            </div>

            {/* Minutes Display */}
            <div className="flex items-center justify-center gap-1 md:gap-2 text-gray-300 mb-2 md:mb-3 md:hover:scale-105 transition-transform">
              <Clock className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
              <span className="text-sm md:text-lg">
                ≈ <strong className="text-white text-lg md:text-2xl">{minutesRemaining.toLocaleString()}</strong> <span className="text-gray-400">minutes</span>
              </span>
            </div>

            {/* Cost Info */}
            <div className="flex items-center justify-center gap-2 md:gap-4 text-[10px] md:text-xs text-gray-500 mt-2 md:mt-3">
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                $0.10/min
              </span>
              <span className="w-1 h-1 bg-gray-600 rounded-full" />
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Auto-refill {autoRefill ? <span className="text-green-400 font-semibold">ON</span> : <span className="text-gray-400">OFF</span>}
              </span>
            </div>
          </div>
        </div>
        
        <style>{`
          @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
          @keyframes pulse-glow-balance {
            0%, 100% { box-shadow: 0 0 30px rgba(34, 197, 94, 0.2); }
            50% { box-shadow: 0 0 60px rgba(34, 197, 94, 0.4); }
          }
          .animate-bounce-slow {
            animation: bounce-slow 2s ease-in-out infinite;
          }
          .animate-pulse-glow-balance {
            animation: pulse-glow-balance 3s ease-in-out infinite;
          }
        `}</style>
      </div>

      {/* Low Balance Warning with Animation */}
      {balance < 10 && (
        <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-3 md:p-5 mb-4 md:mb-6 animate-pulse-red hover:border-red-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/20">
          <div className="flex items-start gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0 border border-red-500/40 animate-bounce-slow">
              <Zap className="w-4 h-4 md:w-5 md:h-5 text-red-400" />
            </div>
            <div>
              <h4 className="text-red-400 font-bold mb-1 text-base md:text-lg flex items-center gap-1 md:gap-2">
                Low Balance Alert
                <span className="text-lg md:text-2xl animate-pulse">⚠️</span>
              </h4>
              <p className="text-xs md:text-sm text-gray-300">
                Your balance is running low. {autoRefill ? 'Auto-refill is enabled and will trigger soon.' : 'Please add funds to continue making calls.'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes pulse-red {
          0%, 100% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.2); }
          50% { box-shadow: 0 0 40px rgba(239, 68, 68, 0.4); }
        }
        .animate-pulse-red {
          animation: pulse-red 2s ease-in-out infinite;
        }
      `}</style>

      {/* Settings Panel with Animation */}
      {showSettings && (
        <div className="bg-[#1A2647] rounded-xl p-4 md:p-6 border-2 border-gray-700/50 mb-4 md:mb-6 space-y-3 md:space-y-4 animate-slide-down hover:border-purple-500/30 transition-all duration-300 shadow-lg">
          <h4 className="text-white font-bold text-base md:text-lg flex items-center gap-2">
            <Settings className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
            Auto-Refill Settings
          </h4>
          
          {/* Enable/Disable Auto-Refill */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium text-sm md:text-base">Auto-Refill</p>
              <p className="text-xs md:text-sm text-gray-400">Automatically refill when balance &lt; $10</p>
            </div>
            <button
              onClick={() => {
                const newValue = !autoRefill;
                setAutoRefill(newValue);
                
                if (newValue) {
                  // When enabling, auto-select the higher tier (large amount)
                  setRefillAmount(refillOptions.large);
                  setHasSelectedAmount(true);
                } else {
                  // Reset selection when disabling
                  setHasSelectedAmount(false);
                }
              }}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                autoRefill ? 'bg-green-500' : 'bg-gray-700'
              }`}
            >
              <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                autoRefill ? 'translate-x-7' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Refill Amount Selection */}
          {autoRefill && (
            <div>
              <p className="text-white font-medium mb-2 md:mb-3 text-sm md:text-base">Refill Amount</p>
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                <button
                  onClick={() => {
                    setRefillAmount(refillOptions.small);
                    setHasSelectedAmount(true);
                  }}
                  className={`group p-3 md:p-5 rounded-lg md:rounded-xl border-2 transition-all duration-300 md:hover:scale-105 hover:shadow-lg relative overflow-hidden ${
                    refillAmount === refillOptions.small
                      ? 'border-green-500 bg-green-500/10 text-white shadow-green-500/20'
                      : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-green-500/50'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-green-500/0 group-hover:from-green-500/5 group-hover:to-green-500/10 transition-all duration-300" />
                  <div className="relative">
                    <div className="text-2xl md:text-3xl font-bold mb-1">${refillOptions.small}</div>
                    <div className="text-[10px] md:text-xs text-gray-400">≈ {refillOptions.small * 10} minutes</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setRefillAmount(refillOptions.large);
                    setHasSelectedAmount(true);
                  }}
                  className={`group p-3 md:p-5 rounded-lg md:rounded-xl border-2 transition-all duration-300 md:hover:scale-105 hover:shadow-lg relative overflow-hidden ${
                    refillAmount === refillOptions.large
                      ? 'border-green-500 bg-green-500/10 text-white shadow-green-500/20'
                      : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-green-500/50'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-green-500/0 group-hover:from-green-500/5 group-hover:to-green-500/10 transition-all duration-300" />
                  <div className="relative">
                    <div className="text-2xl md:text-3xl font-bold mb-1">${refillOptions.large}</div>
                    <div className="text-[10px] md:text-xs text-gray-400">≈ {refillOptions.large * 10} minutes</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleUpdateSettings}
            disabled={isSaveDisabled}
            className={`group w-full px-4 md:px-6 py-2.5 md:py-3 font-bold rounded-lg transition-all duration-300 relative overflow-hidden text-sm md:text-base ${
              isSaveDisabled
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white md:hover:scale-105 hover:shadow-xl hover:shadow-blue-500/50'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </span>
          </button>
          
          <style>{`
            @keyframes slide-down {
              from {
                opacity: 0;
                transform: translateY(-10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .animate-slide-down {
              animation: slide-down 0.3s ease-out;
            }
          `}</style>
        </div>
      )}

      {/* Manual Refill Buttons with Epic Animations */}
      <div className="space-y-3 md:space-y-4">
        <p className="text-xs md:text-sm text-gray-400 font-semibold flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Add Funds Manually:
        </p>
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <button
            onClick={() => handleManualRefill(refillOptions.small)}
            disabled={loading}
            className="group flex flex-col items-center gap-2 md:gap-3 p-4 md:p-6 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 hover:from-blue-600/30 hover:to-indigo-600/30 border-2 border-blue-500/30 hover:border-blue-500/60 rounded-xl md:rounded-2xl transition-all duration-300 md:hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:hover:scale-100 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:to-indigo-500/10 transition-all duration-300" />
            <div className="relative">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-blue-500/20 flex items-center justify-center mb-1 md:mb-2 md:group-hover:scale-110 transition-transform border border-blue-500/40 group-hover:border-blue-400 group-hover:shadow-lg group-hover:shadow-blue-500/50">
                <DollarSign className="w-5 h-5 md:w-7 md:h-7 text-blue-400 group-hover:text-blue-300" />
              </div>
              <span className="text-white font-bold text-xl md:text-2xl block mb-1">Add ${refillOptions.small}</span>
              <span className="text-[10px] md:text-xs text-gray-400 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" />
                {refillOptions.small * 10} minutes
              </span>
            </div>
          </button>
          
          <button
            onClick={() => handleManualRefill(refillOptions.large)}
            disabled={loading}
            className="group flex flex-col items-center gap-2 md:gap-3 p-4 md:p-6 bg-gradient-to-br from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 border-2 border-green-500/30 hover:border-green-500/60 rounded-xl md:rounded-2xl transition-all duration-300 md:hover:scale-105 hover:shadow-xl hover:shadow-green-500/20 disabled:opacity-50 disabled:hover:scale-100 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-green-500/0 group-hover:from-green-500/10 group-hover:to-emerald-500/10 transition-all duration-300" />
            <div className="relative">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-green-500/20 flex items-center justify-center mb-1 md:mb-2 md:group-hover:scale-110 transition-transform border border-green-500/40 group-hover:border-green-400">
                <DollarSign className="w-5 h-5 md:w-7 md:h-7 text-green-400 group-hover:text-green-300" />
              </div>
              <span className="text-white font-bold text-xl md:text-2xl block mb-1">Add ${refillOptions.large}</span>
              <span className="text-[10px] md:text-xs text-gray-400 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" />
                {refillOptions.large * 10} minutes
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Info with Glow */}
      <div className="p-3 md:p-4 bg-blue-500/10 border-2 border-blue-500/30 rounded-xl hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
        <p className="text-xs md:text-sm text-blue-300 text-center flex items-center justify-center gap-1 md:gap-2 flex-wrap">
          <span className="flex items-center gap-1">
            💳 Secure payments via Stripe
          </span>
          <span className="hidden md:inline w-1 h-1 bg-blue-400 rounded-full" />
          <span className="hidden md:inline">Funds never expire</span>
          <span className="hidden md:inline w-1 h-1 bg-blue-400 rounded-full" />
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Instant activation
          </span>
        </p>
      </div>
      
    </div>
  );
}

