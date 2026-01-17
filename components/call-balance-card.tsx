'use client';

import { useState, useEffect, useRef } from 'react';
import { Wallet, Zap, CheckCircle, AlertCircle, Clock, Sparkles, DollarSign, RefreshCw, Receipt, ExternalLink, Power } from 'lucide-react';
import Link from 'next/link';

interface CallBalanceCardProps {
  userId: string;
  initialBalance?: number;
  initialAutoRefill?: boolean;
  initialRefillAmount?: number;
  currentTier?: 'none' | 'free_trial' | 'starter' | 'pro' | 'elite' | 'free_access' | 'vip' | 'trial';
}

export function CallBalanceCard({ 
  userId,
  initialBalance = 0,
  initialAutoRefill = false,
  initialRefillAmount = 50,
  currentTier = 'starter'
}: CallBalanceCardProps) {
  const [balance, setBalance] = useState(initialBalance);
  const [displayBalance, setDisplayBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [costPerMinute, setCostPerMinute] = useState(0.65);
  const [hasConfigured, setHasConfigured] = useState(initialAutoRefill);
  const [autoRefillOn, setAutoRefillOn] = useState(initialAutoRefill);
  const [showConsent, setShowConsent] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const animationRef = useRef<number | null>(null);
  const previousBalanceRef = useRef(0);

  // Animate balance counting up with easeOut effect
  useEffect(() => {
    if (!dataLoaded) return;
    
    const startValue = previousBalanceRef.current;
    const endValue = balance;
    const duration = 1500; // 1.5 seconds
    let startTime: number | null = null;

    // EaseOutExpo - starts fast, slows down dramatically at the end
    const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);

      const currentValue = startValue + (endValue - startValue) * easedProgress;
      setDisplayBalance(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayBalance(endValue);
        previousBalanceRef.current = endValue;
      }
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [balance, dataLoaded]);

  // Fixed refill amount: $25
  const refillAmount = 25;

  // Calculate estimated minutes
  const minutesRemaining = Math.floor(balance / costPerMinute);
  const minutesPerRefill = Math.floor(refillAmount / costPerMinute);

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
        if (data.auto_refill_enabled !== undefined) {
          setHasConfigured(data.auto_refill_enabled);
          setAutoRefillOn(data.auto_refill_enabled);
        }
        setDataLoaded(true);

        // Check if returning from balance refill
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('balance_success') === 'true') {
          console.log('✅ Returned from successful balance refill');
          
          // Check if this completes a referral sign-up
          try {
            const referralResponse = await fetch('/api/referral/complete-signup', {
              method: 'POST',
            });
            const referralData = await referralResponse.json();
            if (referralData.success && referralData.daysAdded) {
              console.log(`🎉 Referral completed! ${referralData.daysAdded} days added to referrer's trial`);
              alert(`🎉 Thank you! Your referrer just received ${referralData.daysAdded} bonus days!`);
            }
          } catch (error) {
            console.log('No referral to complete');
          }
          
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        setDataLoaded(true); // Still show content even if fetch fails
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

  // Handle adding calling credits - Show consent modal first
  const handleAddCredits = () => {
    setShowConsent(true);
  };

  // After consent is accepted, redirect to Stripe Checkout
  const handleContinueToStripe = async () => {
    if (!consentChecked) {
      alert('Please accept the terms to continue');
      return;
    }

    setLoading(true);
    try {
      console.log('💳 Creating Stripe checkout session for $25 refill...');
      
      // Create a Stripe Checkout session for call balance refill
      const response = await fetch('/api/balance/create-checkout-session', {
        method: 'POST',
      });

      console.log('📡 Response status:', response.status);
      
      const data = await response.json();
      console.log('📦 Response data:', data);

      if (data.url) {
        console.log('✅ Redirecting to Stripe Checkout:', data.url);
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        console.error('❌ Error from API:', data.error);
        alert(`Error: ${data.error || 'Failed to open payment checkout'}`);
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Error opening checkout:', error);
      alert('Failed to open payment checkout. Please try again.');
      setLoading(false);
    }
  };

  // Toggle auto-refill on/off
  const handleToggleAutoRefill = async () => {
    setLoading(true);
    try {
      const newState = !autoRefillOn;
      const response = await fetch('/api/balance/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auto_refill_enabled: newState,
          auto_refill_amount: refillAmount,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setAutoRefillOn(newState);
        alert(`✅ Auto-refill ${newState ? 'enabled' : 'disabled'}!`);
      } else {
        alert(`Failed to update: ${data.error}`);
      }
    } catch (error) {
      alert('Error updating settings');
    } finally {
      setLoading(false);
    }
  };

  const balanceStatus = balance < 1 ? 'low' : balance < 10 ? 'medium' : 'good';

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Balance Display */}
      <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-xl md:rounded-2xl p-5 md:p-8 border-2 border-green-500/20 shadow-xl relative overflow-hidden">
        {/* Animated Background */}
        <div className="hidden md:block absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[300px] h-[300px] bg-green-500/10 rounded-full blur-3xl -top-20 -right-20 animate-pulse" />
          <div className="absolute w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl -bottom-20 -left-20 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Balance Display */}
        <div className="relative z-10 text-center">
          <p className="text-gray-400 text-xs md:text-sm mb-3 md:mb-4">Current Balance</p>
          
          {/* Mobile: Stack vertically, Desktop: Side by side */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 mb-3 md:mb-4">
            <span className="text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
              ${displayBalance.toFixed(2)}
            </span>
            <div className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold ${
              balanceStatus === 'low' ? 'bg-red-500/20 text-red-400 border-2 border-red-500/40 animate-pulse' :
              balanceStatus === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40' :
              'bg-green-500/20 text-green-400 border-2 border-green-500/40'
            }`}>
              {balanceStatus === 'low' ? '⚠️ LOW' :
               balanceStatus === 'medium' ? '⚡ OK' :
               '✓ GOOD'}
            </div>
          </div>
          {dataLoaded ? (
            <p className="text-gray-500 text-xs md:text-sm">≈ {minutesRemaining} minutes at ${costPerMinute}/min</p>
          ) : (
            <div className="h-4 bg-gray-700/50 rounded w-40 animate-pulse"></div>
          )}
        </div>
      </div>

      {/* CONDITIONAL: Show "Add Credits" button OR "Auto-Refill Status" card */}
      {balance < 1 ? (
        // WHEN BALANCE IS $0: Show BIG "Add Call Credits" button (glowy & see-through)
        <button
          onClick={handleAddCredits}
          className="group relative overflow-hidden w-full px-6 md:px-8 py-6 md:py-8 bg-gradient-to-br from-green-500/10 via-emerald-500/15 to-green-500/10 hover:from-green-500/20 hover:via-emerald-500/25 hover:to-green-500/20 border-2 border-green-500/40 hover:border-green-400/60 text-white font-bold text-xl md:text-3xl rounded-xl md:rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg shadow-green-500/20 hover:shadow-2xl hover:shadow-green-500/40 backdrop-blur-sm"
        >
          {/* Animated glow background */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/0 via-emerald-400/10 to-green-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <span className="relative z-10 flex items-center justify-center gap-2 md:gap-3">
            <DollarSign className="w-7 h-7 md:w-10 md:h-10 text-green-400" />
            <span className="bg-gradient-to-r from-green-400 via-emerald-300 to-green-400 bg-clip-text text-transparent">
              Add Call Credits
            </span>
          </span>
          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
        </button>
      ) : (
        // WHEN BALANCE > $0: Show normal "Auto-Refill Status" card
        <div className={`bg-gradient-to-br rounded-xl md:rounded-2xl p-5 md:p-6 border-2 shadow-lg ${
          autoRefillOn 
            ? 'from-green-500/10 to-emerald-500/10 border-green-500/40 shadow-green-500/20'
            : 'from-gray-800/50 to-gray-900/50 border-gray-700 shadow-gray-900/20'
        }`}>
          {/* Mobile: Stack vertically, Desktop: Horizontal */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className={`p-2.5 md:p-3 rounded-lg md:rounded-xl border-2 ${
                autoRefillOn 
                  ? 'bg-green-500/20 border-green-500/40'
                  : 'bg-gray-600/20 border-gray-600/40'
              }`}>
                <RefreshCw className={`w-5 h-5 md:w-6 md:h-6 ${autoRefillOn ? 'text-green-400' : 'text-gray-400'}`} />
              </div>
              <div className="flex-1">
                <p className={`font-semibold text-base md:text-lg ${autoRefillOn ? 'text-green-400' : 'text-gray-400'}`}>
                  Auto-Refill {autoRefillOn ? 'Enabled' : 'Disabled'}
                </p>
                <p className="text-xs md:text-sm text-gray-400 mt-0.5">
                  {autoRefillOn 
                    ? `Recharge with $${refillAmount} when balance is lower than $1`
                    : 'Manually add credits when needed'}
                </p>
              </div>
            </div>
            
            {/* Toggle Button */}
            <button
              onClick={handleToggleAutoRefill}
              disabled={loading}
              className={`group relative overflow-hidden w-full md:w-auto px-4 md:px-5 py-3 md:py-2.5 rounded-lg border-2 font-semibold text-sm md:text-base transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${
                autoRefillOn
                  ? 'bg-red-600/20 border-red-500/60 text-red-400 hover:bg-red-600/30 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/30'
                  : 'bg-blue-600/80 border-blue-500 text-white hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-500/50'
              }`}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Power className="w-4 h-4" />
                Turn {autoRefillOn ? 'Off' : 'On'}
              </span>
              {!autoRefillOn && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Transactions Section */}
      <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-xl md:rounded-2xl p-5 md:p-6 border-2 border-gray-800 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30 shrink-0">
            <Receipt className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base md:text-xl font-bold text-white">Transaction History</h3>
            <p className="text-xs md:text-sm text-gray-400 truncate">View all your payment receipts</p>
          </div>
        </div>

        <button
          onClick={async () => {
            try {
              const response = await fetch('/api/stripe/create-portal-session', { method: 'POST' });
              const data = await response.json();
              if (data.url) window.location.href = data.url;
              else alert(data.error || 'Failed to open payment portal');
            } catch (error) {
              alert('Failed to open payment portal');
            }
          }}
          className="group relative overflow-hidden w-full px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 hover:from-blue-600/30 hover:to-indigo-600/30 border-2 border-blue-500/40 hover:border-blue-500/60 text-blue-400 font-semibold text-sm md:text-base rounded-lg md:rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/40 flex items-center justify-center gap-2"
        >
          <span className="relative z-10 flex items-center gap-2">
            <Receipt className="w-4 h-4 md:w-5 md:h-5" />
            <span className="whitespace-nowrap">View Invoices on Stripe</span>
            <ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </span>
          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
        </button>

        <p className="text-xs text-gray-500 text-center mt-3">
          View detailed receipts and invoices for all your transactions
        </p>
      </div>

      {/* Consent Modal */}
      {showConsent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-4 animate-in fade-in duration-300">
          <div className="relative max-w-2xl w-full shadow-[0_0_80px_rgba(59,130,246,0.3)] animate-in fade-in zoom-in-95 duration-400">
            {/* Outer Glow Ring */}
            <div className="absolute -inset-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 rounded-3xl opacity-60 blur-sm animate-pulse" style={{ animationDuration: '2s' }} />
            
            {/* Inner Card */}
            <div className="relative bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Animated Background Glows */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-80 h-80 bg-blue-500/20 rounded-full blur-[100px] -top-32 -right-32 animate-pulse" style={{ animationDuration: '3s' }} />
                <div className="absolute w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] -bottom-20 -left-20 animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
                <div className="absolute w-40 h-40 bg-purple-500/15 rounded-full blur-[60px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
              </div>

              {/* Top Glow Line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent" />

              <div className="relative">
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-blue-500/20">
                  <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent mb-1 md:mb-2">Before You Continue</h2>
                  <p className="text-sm md:text-base text-gray-400">Please read and accept the terms below</p>
                </div>

                {/* Consent Content */}
                <div className="p-4 md:p-6 space-y-3 md:space-y-4">
                  <div className="relative bg-gradient-to-br from-blue-500/15 to-indigo-500/10 border border-blue-500/40 rounded-2xl p-4 md:p-5 shadow-inner">
                    {/* Inner glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl pointer-events-none" />
                    <h3 className="relative text-white font-semibold mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                        <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                      </div>
                      Auto-Refill Terms
                    </h3>
                    <div className="relative space-y-2 md:space-y-3 text-xs md:text-sm text-gray-300">
                      <p className="flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">✓</span>
                        <span>When your balance drops below <strong className="text-blue-300">$1</strong>, we'll automatically charge your card <strong className="text-blue-300">$25</strong></span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">✓</span>
                        <span>This ensures your AI never stops calling due to low balance</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">✓</span>
                        <span>You can disable auto-refill anytime from the Call Balance settings</span>
                      </p>
                      <div className="mt-3 pt-3 border-t border-yellow-500/30">
                        <p className="text-yellow-400 font-semibold flex items-center gap-2">
                          <span className="text-lg">⚠️</span>
                          If auto-refill is disabled, this may prevent you from using the AI!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Checkbox */}
                  <label className={`flex items-start gap-3 p-3 md:p-4 bg-gradient-to-br from-[#0B1437] to-[#0F1629] border-2 rounded-2xl cursor-pointer transition-all duration-300 ${consentChecked ? 'border-green-500/50 shadow-lg shadow-green-500/20' : 'border-gray-700/50 hover:border-blue-500/40'}`}>
                    <input
                      type="checkbox"
                      checked={consentChecked}
                      onChange={(e) => setConsentChecked(e.target.checked)}
                      className="mt-0.5 md:mt-1 w-4 h-4 md:w-5 md:h-5 rounded border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer shrink-0"
                    />
                    <span className="text-xs md:text-sm text-gray-300">
                      I understand and agree that Sterling Dialer will automatically charge $25 when my balance drops below $1. I can cancel auto-refill anytime.
                    </span>
                    {consentChecked && (
                      <span className="ml-auto text-green-400 text-lg">✓</span>
                    )}
                  </label>
                </div>

                {/* Actions */}
                <div className="p-4 md:p-6 border-t border-gray-800/50 flex flex-col md:flex-row gap-3">
                  <button
                    onClick={() => {
                      setShowConsent(false);
                      setConsentChecked(false);
                    }}
                    className="w-full md:flex-1 px-4 md:px-6 py-3.5 border border-gray-600/50 bg-gray-800/40 text-gray-400 hover:text-white hover:bg-gray-800/60 hover:border-gray-500/50 rounded-xl transition-all duration-300 font-medium text-sm md:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleContinueToStripe}
                    disabled={!consentChecked || loading}
                    className="group relative overflow-hidden w-full md:flex-1 px-4 md:px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm md:text-base rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Continue to Payment
                          <ExternalLink className="w-4 h-4 md:w-5 md:h-5" />
                        </>
                      )}
                    </span>
                    {!loading && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

