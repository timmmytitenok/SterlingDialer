'use client';

import { useState, useEffect } from 'react';
import { Wallet, Zap, CheckCircle, AlertCircle, Clock, Sparkles, DollarSign, RefreshCw, Receipt, ExternalLink, Power } from 'lucide-react';
import Link from 'next/link';

interface CallBalanceCardProps {
  userId: string;
  initialBalance?: number;
  initialAutoRefill?: boolean;
  initialRefillAmount?: number;
  currentTier?: 'none' | 'free_trial' | 'starter' | 'pro' | 'elite' | 'free_access';
}

export function CallBalanceCard({ 
  userId,
  initialBalance = 0,
  initialAutoRefill = false,
  initialRefillAmount = 50,
  currentTier = 'starter'
}: CallBalanceCardProps) {
  const [balance, setBalance] = useState(initialBalance);
  const [loading, setLoading] = useState(false);
  const [costPerMinute, setCostPerMinute] = useState(0.30);
  const [hasConfigured, setHasConfigured] = useState(initialAutoRefill);
  const [showConsent, setShowConsent] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [autoRefillOn, setAutoRefillOn] = useState(initialAutoRefill);

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

  // Handle adding first calling credits
  const handleAddFirstCredits = () => {
    setShowConsent(true);
  };

  // Handle consent and proceed to Stripe
  const handleContinueToStripe = async () => {
    if (!consentChecked) {
      alert('Please accept the terms to continue');
      return;
    }

    setLoading(true);
    try {
      // Create checkout session for first refill
      const refillResponse = await fetch('/api/balance/refill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: refillAmount,
          isFirstRefill: true
        }),
      });
      
      const refillData = await refillResponse.json();
      
      if (refillData.success && refillData.url) {
        // Redirect to Stripe Checkout
        window.location.href = refillData.url;
      } else {
        alert(`Failed to create checkout: ${refillData.error}`);
        setLoading(false);
      }
    } catch (error) {
      alert('Error processing request');
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

  const balanceStatus = balance < 10 ? 'low' : balance < 25 ? 'medium' : 'good';

  // BEFORE FIRST PAYMENT: Show simple "Add First Calling Credits" button
  if (!hasConfigured) {
    return (
      <div className="space-y-6">
        {/* Balance Display Card */}
        <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl p-8 border-2 border-gray-800 shadow-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-2xl border-2 border-green-500/40 mb-4">
              <Wallet className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Call Balance</h2>
            <p className="text-gray-400">Add credits to start making AI calls</p>
          </div>

          <div className="bg-[#0B1437]/60 rounded-xl p-6 border border-gray-700 mb-6">
            <p className="text-gray-400 text-sm text-center mb-2">Current Balance</p>
            <p className="text-5xl font-bold text-white text-center">${balance.toFixed(2)}</p>
            <p className="text-gray-500 text-sm text-center mt-2">≈ {minutesRemaining} minutes</p>
          </div>

          {/* Add First Credits Button */}
          <button
            onClick={handleAddFirstCredits}
            disabled={loading}
            className="group relative overflow-hidden w-full px-8 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 border-2 border-blue-500/50 text-white font-bold text-xl rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/60 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              <Sparkles className="w-6 h-6" />
              💳 Add First Calling Credits
            </span>
            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
          </button>
        </div>

        {/* Consent Modal */}
        {showConsent && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="min-h-screen flex items-start justify-center p-4 py-8">
              <div className="bg-[#1A2647] rounded-2xl border-2 border-blue-500/40 max-w-2xl w-full shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-gray-800">
                  <h2 className="text-2xl font-bold text-white mb-2">Before You Continue</h2>
                  <p className="text-gray-400">Please read and accept the terms below</p>
                </div>

                {/* Consent Content */}
                <div className="p-6 space-y-4">
                  <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-xl p-5">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-blue-400" />
                      Auto-Refill Terms
                    </h3>
                    <div className="space-y-3 text-sm text-gray-300">
                      <p>
                        ✓ You'll be charged <strong className="text-white">${refillAmount}</strong> now to add your first calling credits
                      </p>
                      <p>
                        ✓ When your balance drops below <strong className="text-white">$10</strong>, we'll automatically charge your card <strong className="text-white">${refillAmount}</strong>
                      </p>
                      <p>
                        ✓ This ensures your AI never stops calling due to low balance
                      </p>
                      <p>
                        ✓ You can disable auto-refill anytime from the Call Balance settings
                      </p>
                    </div>
                  </div>

                  {/* Checkbox */}
                  <label className="flex items-start gap-3 p-4 bg-[#0B1437] border-2 border-gray-700 hover:border-blue-500/40 rounded-xl cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={consentChecked}
                      onChange={(e) => setConsentChecked(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-300">
                      I understand and agree that Sterling AI will automatically charge ${refillAmount} when my balance drops below $10. I can cancel auto-refill anytime.
                    </span>
                  </label>
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-gray-800 flex gap-3">
                  <button
                    onClick={() => {
                      setShowConsent(false);
                      setConsentChecked(false);
                    }}
                    className="flex-1 px-6 py-3 border-2 border-gray-700 bg-gray-800/20 text-gray-400 hover:text-white hover:bg-gray-800/40 rounded-lg transition-all font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleContinueToStripe}
                    disabled={!consentChecked || loading}
                    className="group relative overflow-hidden flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-2 border-blue-500/60 text-white font-bold rounded-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/60 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Continue to Payment
                          <Sparkles className="w-5 h-5" />
                        </>
                      )}
                    </span>
                    {!loading && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
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

  // AFTER FIRST PAYMENT: Show balance, auto-refill status, and transactions
  return (
    <div className="space-y-6">
      {/* Balance Display */}
      <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl p-8 border-2 border-green-500/20 shadow-xl relative overflow-hidden">
        {/* Animated Background */}
        <div className="hidden md:block absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[300px] h-[300px] bg-green-500/10 rounded-full blur-3xl -top-20 -right-20 animate-pulse" />
          <div className="absolute w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl -bottom-20 -left-20 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Balance Display */}
        <div className="relative z-10 text-center mb-6">
          <p className="text-gray-400 text-sm mb-4">Current Balance</p>
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="text-7xl md:text-8xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
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
          <p className="text-gray-500 text-sm">≈ {minutesRemaining} minutes at ${costPerMinute}/min</p>
        </div>
      </div>

      {/* Auto-Refill Status Message */}
      <div className={`bg-gradient-to-br rounded-2xl p-6 border-2 shadow-lg ${
        autoRefillOn 
          ? 'from-green-500/10 to-emerald-500/10 border-green-500/40 shadow-green-500/20'
          : 'from-gray-800/50 to-gray-900/50 border-gray-700 shadow-gray-900/20'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl border-2 ${
              autoRefillOn 
                ? 'bg-green-500/20 border-green-500/40'
                : 'bg-gray-600/20 border-gray-600/40'
            }`}>
              <RefreshCw className={`w-6 h-6 ${autoRefillOn ? 'text-green-400' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className={`font-semibold text-lg ${autoRefillOn ? 'text-green-400' : 'text-gray-400'}`}>
                Auto-Refill {autoRefillOn ? 'Enabled' : 'Disabled'}
              </p>
              <p className="text-sm text-gray-400">
                {autoRefillOn 
                  ? `Recharge with $${refillAmount} when balance is lower than $10`
                  : 'Manually add credits when needed'}
              </p>
            </div>
          </div>
          
          {/* Toggle Button */}
          <button
            onClick={handleToggleAutoRefill}
            disabled={loading}
            className={`group relative overflow-hidden px-5 py-2.5 rounded-lg border-2 font-semibold transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${
              autoRefillOn
                ? 'bg-gray-700/50 border-gray-600 text-gray-400 hover:bg-gray-700 hover:shadow-lg'
                : 'bg-blue-600/80 border-blue-500 text-white hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-500/50'
            }`}
          >
            <span className="relative z-10 flex items-center gap-2">
              <Power className="w-4 h-4" />
              Turn {autoRefillOn ? 'Off' : 'On'}
            </span>
            {!autoRefillOn && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            )}
          </button>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl p-6 border-2 border-gray-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <Receipt className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Transaction History</h3>
              <p className="text-sm text-gray-400">View all your payment receipts</p>
            </div>
          </div>
        </div>

        <a
          href="https://billing.stripe.com/p/login/test_3cs9BGchfcc8fCMdQQ"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative overflow-hidden w-full px-6 py-4 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 hover:from-blue-600/30 hover:to-indigo-600/30 border-2 border-blue-500/40 hover:border-blue-500/60 text-blue-400 font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/40 flex items-center justify-center gap-3"
        >
          <span className="relative z-10 flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            View Invoices on Stripe
            <ExternalLink className="w-4 h-4" />
          </span>
          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
        </a>

        <p className="text-xs text-gray-500 text-center mt-3">
          View detailed receipts and invoices for all your transactions
        </p>
      </div>
    </div>
  );
}

