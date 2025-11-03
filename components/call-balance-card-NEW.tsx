'use client';

import { useState, useEffect } from 'react';
import { Wallet, Zap, CheckCircle, AlertCircle, Clock, Sparkles, DollarSign, RefreshCw } from 'lucide-react';

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
  const [refillAmount, setRefillAmount] = useState<number>(initialRefillAmount || 50);
  const [loading, setLoading] = useState(false);
  const [costPerMinute, setCostPerMinute] = useState(0.30);
  const [hasConfigured, setHasConfigured] = useState(initialAutoRefill);

  // Auto-refill is now ALWAYS enabled (required for AI operation)
  const autoRefillEnabled = true;

  // New refill options: $25, $50, $100, $200
  const refillOptions = [25, 50, 100, 200];

  // Calculate estimated minutes remaining
  const minutesRemaining = Math.floor(balance / costPerMinute);

  // Fetch cost per minute and balance on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/balance/get');
        const data = await response.json();
        if (data.balance !== undefined) {
          setBalance(data.balance);
        }
        if (data.cost_per_minute !== undefined) {
          setCostPerMinute(data.cost_per_minute);
        }
        if (data.auto_refill_enabled !== undefined && data.auto_refill_amount) {
          setRefillAmount(data.auto_refill_amount);
          setHasConfigured(data.auto_refill_enabled);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };

    fetchUserData();
  }, []);

  // Poll balance every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/balance/get');
        const data = await response.json();
        if (data.balance !== undefined) {
          setBalance(data.balance);
        }
        if (data.cost_per_minute !== undefined) {
          setCostPerMinute(data.cost_per_minute);
        }
      } catch (error) {
        console.error('Failed to refresh balance:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleSaveAutoRefill = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/balance/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auto_refill_enabled: true, // Always true now
          auto_refill_amount: refillAmount,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Auto-refill amount updated!');
        setHasConfigured(true);
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
      {/* Main Balance Card */}
      <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-xl md:rounded-2xl p-4 md:p-8 border border-green-500/20 relative overflow-hidden shadow-2xl">
        {/* Animated Background */}
        <div className="hidden md:block absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[300px] h-[300px] bg-green-500/10 rounded-full blur-3xl -top-20 -right-20 animate-pulse" />
          <div className="absolute w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl -bottom-20 -left-20 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Header */}
        <div className="relative z-10 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 flex items-center justify-center border-2 border-green-500/50 shadow-lg">
                <Wallet className="w-6 h-6 md:w-7 md:h-7 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                  Call Balance
                  <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                </h3>
                <p className="text-sm text-gray-400">Prepaid minutes for AI calls</p>
              </div>
            </div>
            {/* Always Enabled Badge */}
            <div className="px-3 md:px-4 py-1.5 md:py-2 bg-green-500/20 border border-green-500/50 rounded-lg">
              <span className="text-green-400 font-bold text-xs md:text-sm flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                AUTO-REFILL ON
              </span>
            </div>
          </div>
        </div>

        {/* Balance Display */}
        <div className="relative z-10 bg-[#0B1437]/50 rounded-xl p-6 md:p-8 border-2 border-green-500/40 mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-3 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-green-400" />
              Current Balance
            </p>
            <div className="flex items-baseline justify-center gap-3 mb-4">
              <span className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                ${balance.toFixed(2)}
              </span>
              <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                balanceStatus === 'low' ? 'bg-red-500/20 text-red-400 border-2 border-red-500/40 animate-pulse' :
                balanceStatus === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40' :
                'bg-green-500/20 text-green-400 border-2 border-green-500/40'
              }`}>
                {balanceStatus === 'low' ? '⚠️ LOW' :
                 balanceStatus === 'medium' ? '⚡ OK' :
                 '✓ GOOD'}
              </div>
            </div>

            {/* Minutes Display */}
            <div className="flex items-center justify-center gap-2 text-gray-300 mb-3">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-lg">
                ≈ <strong className="text-white text-2xl">{minutesRemaining.toLocaleString()}</strong> <span className="text-gray-400">minutes</span>
              </span>
            </div>

            {/* Cost Info */}
            <div className="text-sm text-gray-500">
              <DollarSign className="w-4 h-4 inline" />
              <strong className="text-gray-300">${costPerMinute.toFixed(2)}/min</strong>
            </div>
          </div>
        </div>

        {/* Auto-Refill Required Notice */}
        {!hasConfigured && (
          <div className="mb-6 p-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-xl animate-pulse">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-amber-300 font-bold mb-1">⚠️ Auto-Refill Required</h4>
                <p className="text-sm text-amber-200/90">
                  Please set up auto-refill below. This ensures your AI never stops due to low balance.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Low Balance Warning */}
        {balance < 10 && (
          <div className="mb-6 p-4 bg-red-500/10 border-2 border-red-500/40 rounded-xl">
            <div className="flex items-start gap-3">
              <Zap className="w-6 h-6 text-red-400 flex-shrink-0 animate-pulse" />
              <div>
                <h4 className="text-red-400 font-bold mb-1 text-base">Low Balance Alert!</h4>
                <p className="text-sm text-gray-300">
                  Auto-refill will trigger when balance drops below $10. Your card will be charged ${refillAmount}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Auto-Refill Configuration (Always On) */}
        <div className="relative z-10 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-4 md:p-6 border-2 border-blue-500/30">
          <div className="mb-6">
            <h4 className="text-white font-bold text-lg flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-green-400" />
              Auto-Refill Settings
            </h4>
            <p className="text-sm text-gray-400">Required for AI operation • Triggers when balance drops below $10</p>
          </div>

          {/* Refill Amount Selection: $25, $50, $100, $200 */}
          <div className="mb-6">
            <p className="text-white font-medium mb-3 text-sm md:text-base">Select Auto-Refill Amount:</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              {refillOptions.map((amount) => {
                const minutes = Math.floor(amount / costPerMinute);
                const isSelected = refillAmount === amount;
                
                return (
                  <button
                    key={amount}
                    onClick={() => setRefillAmount(amount)}
                    className={`group p-4 md:p-5 rounded-xl border-2 transition-all duration-300 hover:scale-105 relative overflow-hidden ${
                      isSelected
                        ? 'border-green-500 bg-green-500/10 shadow-green-500/20'
                        : 'border-gray-700 bg-gray-800/50 hover:border-green-500/50'
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 group-hover:from-green-500/5 group-hover:to-green-500/10 transition-all duration-300" />
                    <div className="relative text-center">
                      <div className={`text-2xl md:text-3xl font-bold mb-1 ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                        ${amount}
                      </div>
                      <div className={`text-xs ${isSelected ? 'text-green-300' : 'text-gray-500'}`}>
                        ≈ {minutes} min
                      </div>
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveAutoRefill}
            disabled={loading}
            className={`w-full px-6 py-3 md:py-4 font-bold rounded-xl transition-all duration-300 text-sm md:text-base ${
              loading
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white hover:scale-105 shadow-lg hover:shadow-green-500/50'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                {hasConfigured ? 'Update Auto-Refill Amount' : 'Save Auto-Refill Settings'}
              </span>
            )}
          </button>

          {/* Info */}
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-xs text-blue-300 text-center">
              💳 Auto-refill triggers at $10 • Charged to your payment method
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="relative z-10 mt-6 p-4 md:p-5 bg-gray-800/30 rounded-xl border border-gray-700/50">
          <h4 className="text-white font-bold mb-3 text-base md:text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            How Auto-Refill Works
          </h4>
          <div className="space-y-2 text-xs md:text-sm text-gray-300">
            <div className="flex items-start gap-2">
              <span className="text-green-400 font-bold">1.</span>
              <span>AI makes calls and uses credits from your balance</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400 font-bold">2.</span>
              <span>When balance drops below <strong className="text-white">$10</strong>, auto-refill triggers</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400 font-bold">3.</span>
              <span>Your card is charged <strong className="text-white">${refillAmount}</strong> automatically</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400 font-bold">4.</span>
              <span>Balance topped up instantly — AI keeps running 24/7</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="p-3 md:p-4 bg-blue-500/10 border-2 border-blue-500/30 rounded-xl">
        <p className="text-xs md:text-sm text-blue-300 text-center flex items-center justify-center gap-2 flex-wrap">
          <span>💳 Secure payments via Stripe</span>
          <span className="hidden md:inline w-1 h-1 bg-blue-400 rounded-full" />
          <span className="hidden md:inline">Funds never expire</span>
          <span className="hidden md:inline w-1 h-1 bg-blue-400 rounded-full" />
          <span className="flex items-center gap-1">
            <Zap className="w-4 h-4" />
            Instant activation
          </span>
        </p>
      </div>
    </div>
  );
}

