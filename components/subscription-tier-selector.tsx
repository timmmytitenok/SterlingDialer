'use client';

import { useState } from 'react';
import { CheckCircle2, Zap, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { UpgradeConfirmationModal } from './upgrade-confirmation-modal';
import { FinalConfirmationModal } from './final-confirmation-modal';

interface SubscriptionTierSelectorProps {
  currentTier?: 'starter' | 'pro' | 'elite' | 'none' | null;
  hideFreeTrial?: boolean; // Hide free trial option (for trial-expired page)
}

export function SubscriptionTierSelector({ currentTier, hideFreeTrial = false }: SubscriptionTierSelectorProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [pendingTier, setPendingTier] = useState<'starter' | 'pro' | 'elite' | null>(null);
  const [showFinalConfirmation, setShowFinalConfirmation] = useState(false);
  const [trialLoading, setTrialLoading] = useState(false);

  const handleSubscribeClick = (tier: 'starter' | 'pro' | 'elite') => {
    // If user already has a subscription, show first confirmation modal
    if (currentTier && ['starter', 'pro', 'elite'].includes(currentTier)) {
      setPendingTier(tier);
      setShowFinalConfirmation(false);
    } else {
      // New subscription, proceed directly
      handleSubscribe(tier);
    }
  };

  const handleFirstConfirmation = () => {
    // First modal confirmed, show second final confirmation modal
    setShowFinalConfirmation(true);
  };

  const handleFinalConfirmation = () => {
    // All confirmations done, proceed with the actual upgrade
    if (pendingTier) {
      handleSubscribe(pendingTier);
    }
  };

  const handleCancelAll = () => {
    // Cancel everything and reset
    setPendingTier(null);
    setShowFinalConfirmation(false);
  };

  const handleStartFreeTrial = async () => {
    setTrialLoading(true);
    try {
      console.log('🎁 Starting free trial...');
      
      const response = await fetch('/api/trial/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 Response data:', data);

      if (data.success) {
        console.log('✅ Free trial started! Redirecting to onboarding...');
        // Redirect to onboarding page
        window.location.href = '/onboarding';
      } else {
        console.error('❌ No success in response:', data);
        alert(`Failed to start trial: ${data.error || 'Unknown error'}`);
        setTrialLoading(false);
      }
    } catch (error) {
      console.error('❌ Free trial error:', error);
      alert(`Error starting free trial: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTrialLoading(false);
    }
  };

  const handleSubscribe = async (tier: 'starter' | 'pro' | 'elite') => {
    setShowFinalConfirmation(false);
    setPendingTier(null);
    setLoading(tier);
    try {
      console.log('🚀 Starting checkout for tier:', tier);
      
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.error || errorData.details || `Server error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 Response data:', data);

      // Handle upgrade (existing subscription updated)
      if (data.upgraded) {
        console.log('✅ Subscription upgraded! Refreshing page...');
        alert('✅ Your plan has been upgraded! Proration will be applied to your next invoice.');
        // Refresh the page to show updated tier
        window.location.reload();
        return;
      }

      // Handle new subscription (redirect to checkout)
      if (data.url) {
        console.log('✅ Redirecting to checkout:', data.url);
        window.location.href = data.url;
      } else {
        console.error('❌ No checkout URL in response:', data);
        console.error('❌ Full response:', JSON.stringify(data, null, 2));
        const errorMessage = data.error || data.details || 'Unknown error - check console for details';
        alert(`Failed to process subscription: ${errorMessage}`);
        setLoading(null);
      }
    } catch (error) {
      console.error('❌ Checkout error:', error);
      alert(`Error processing subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLoading(null);
    }
  };

  const isCurrentTier = (tier: string) => currentTier === tier;

  // Helper to determine if moving to target tier is an upgrade or downgrade
  const getTierLevel = (tier: string | undefined | null) => {
    if (tier === 'elite') return 3;
    if (tier === 'pro') return 2;
    if (tier === 'starter') return 1;
    return 0; // no tier or 'none'
  };

  const getButtonText = (targetTier: 'starter' | 'pro' | 'elite') => {
    const currentLevel = getTierLevel(currentTier);
    const targetLevel = getTierLevel(targetTier);

    // New subscription
    if (currentLevel === 0) {
      return 'Activate';
    }

    // Same tier
    if (currentLevel === targetLevel) {
      return 'Current Plan';
    }

    // Determine upgrade or downgrade
    if (targetLevel > currentLevel) {
      return `Upgrade to ${targetTier.charAt(0).toUpperCase() + targetTier.slice(1)}`;
    } else {
      return `Downgrade to ${targetTier.charAt(0).toUpperCase() + targetTier.slice(1)}`;
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-full mb-3 md:mb-4">
          <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-blue-400" />
          <span className="text-sm md:text-base text-blue-400 font-semibold">Choose Your Plan</span>
        </div>
        <h2 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">
          {currentTier && currentTier !== 'none' ? 'Upgrade or Change Your Plan' : 'Choose Package '}
        </h2>
        <p className="text-sm md:text-base text-gray-400">
          {currentTier && currentTier !== 'none' ? 'Switch plans anytime' : 'Start reviving old leads and booking appointments automatically'}
        </p>
      </div>

      {/* Free Trial Banner (only show if no current tier AND not hidden) */}
      {(!currentTier || currentTier === 'none' || currentTier === null) && !hideFreeTrial && (
        <div className="mb-6 md:mb-8">
          <div className="relative bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-xl md:rounded-2xl p-4 md:p-6 border-2 border-green-500/50 hover:border-green-500/70 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-green-500/40">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-sm rounded-full shadow-lg whitespace-nowrap">
              🎁 30-DAY FREE TRIAL
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4">
              {/* Left side - info */}
              <div className="space-y-3">
                <h3 className="text-xl md:text-2xl font-bold text-white">Try Sterling AI Risk-Free!</h3>
                <p className="text-sm md:text-base text-gray-300">
                  Get full access to all features for 30 days. No credit card required.
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs md:text-sm text-gray-300">1 AI Caller • 600 dials per day</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs md:text-sm text-gray-300">$0.30/minute calling costs</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs md:text-sm text-gray-300">All core features included</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs md:text-sm text-gray-300">Cancel anytime, no commitment</span>
                  </div>
                </div>
              </div>

              {/* Right side - CTA */}
              <div className="flex flex-col justify-center items-center">
                <div className="text-center mb-4">
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2">FREE</div>
                  <p className="text-sm md:text-base text-gray-400">for 30 days</p>
                </div>
                <button
                  onClick={handleStartFreeTrial}
                  disabled={trialLoading}
                  className="w-full md:w-auto px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {trialLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Starting Trial...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Start Free Trial
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500 mt-3 text-center">No credit card • Instant setup</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-8">
        
        {/* Starter Plan */}
        <div className={`relative bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-xl md:rounded-2xl p-4 md:p-6 border-2 transition-all duration-500 md:hover:scale-105 hover:border-blue-500/60 hover:shadow-2xl hover:shadow-blue-500/40 cursor-pointer group ${
          isCurrentTier('starter') ? 'border-blue-500/50 ring-2 ring-blue-500/30' : 'border-blue-500/30'
        }`}>
          <div className="text-center mb-4 md:mb-6">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">Starter</h3>
            <p className="text-gray-400 text-xs md:text-sm mb-3 md:mb-4">Perfect for getting started</p>
            
            <div className="flex items-baseline justify-center gap-1 mb-4 md:mb-6">
              <span className="text-4xl md:text-5xl font-bold text-white">$999</span>
              <span className="text-lg md:text-xl text-gray-400">/mo</span>
            </div>
          </div>

          <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-300 text-xs md:text-sm">1 AI Caller</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-300 text-xs md:text-sm">600 leads per day</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-300 text-xs md:text-sm">Live call transfer</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-300 text-xs md:text-sm">Calendar integration</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-300 text-xs md:text-sm">Call analytics</span>
            </div>
          </div>

          <button
            onClick={() => handleSubscribeClick('starter')}
            disabled={loading !== null || isCurrentTier('starter')}
            className={`w-full flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 font-bold rounded-lg md:rounded-xl transition-all duration-300 text-sm md:text-base ${
              isCurrentTier('starter')
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white md:hover:scale-105 hover:shadow-xl hover:shadow-blue-500/50'
            }`}
          >
            {loading === 'starter' ? (
              <>
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                Processing...
              </>
            ) : isCurrentTier('starter') ? (
              'Current Plan'
            ) : (
              <>
                <Zap className="w-4 h-4 md:w-5 md:h-5" />
                {getButtonText('starter')}
                <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
              </>
            )}
          </button>
        </div>

        {/* Pro Plan - MOST POPULAR */}
        <div className={`relative bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-xl md:rounded-2xl p-4 md:p-6 border-2 transform lg:scale-105 transition-all duration-500 md:hover:scale-110 hover:border-purple-500/70 hover:shadow-3xl hover:shadow-purple-500/50 cursor-pointer group ${
          isCurrentTier('pro') ? 'border-purple-500/50 ring-2 ring-purple-500/30' : 'border-purple-500/40'
        }`}>
          <div className="text-center mb-4 md:mb-6">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">Pro</h3>
            <p className="text-gray-400 text-xs md:text-sm mb-3 md:mb-4">For serious closers</p>
            
            <div className="flex items-baseline justify-center gap-1 mb-4 md:mb-6">
              <span className="text-4xl md:text-5xl font-bold text-white">$1,399</span>
              <span className="text-lg md:text-xl text-gray-400">/mo</span>
            </div>
          </div>

          <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-300 text-xs md:text-sm">2 AI Callers</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-300 text-xs md:text-sm">1,200 leads per day</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-300 text-xs md:text-sm">Live call transfer</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-300 text-xs md:text-sm">Priority support</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-300 text-xs md:text-sm">All Starter features</span>
            </div>
          </div>

          <button
            onClick={() => handleSubscribeClick('pro')}
            disabled={loading !== null || isCurrentTier('pro')}
            className={`w-full flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 font-bold rounded-lg md:rounded-xl transition-all duration-300 text-sm md:text-base ${
              isCurrentTier('pro')
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white md:hover:scale-105 hover:shadow-xl hover:shadow-purple-500/50'
            }`}
          >
            {loading === 'pro' ? (
              <>
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                Processing...
              </>
            ) : isCurrentTier('pro') ? (
              'Current Plan'
            ) : (
              <>
                <Zap className="w-4 h-4 md:w-5 md:h-5" />
                {getButtonText('pro')}
                <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
              </>
            )}
          </button>
        </div>

        {/* Elite Plan */}
        <div className={`relative bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-xl md:rounded-2xl p-4 md:p-6 border-2 transition-all duration-500 md:hover:scale-105 hover:border-amber-500/60 hover:shadow-2xl hover:shadow-amber-500/40 cursor-pointer group ${
          isCurrentTier('elite') ? 'border-amber-500/50 ring-2 ring-amber-500/30' : 'border-amber-500/30'
        }`}>
          <div className="text-center mb-4 md:mb-6">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">Elite</h3>
            <p className="text-gray-400 text-xs md:text-sm mb-3 md:mb-4">Maximum volume & automation</p>
            
            <div className="flex items-baseline justify-center gap-1 mb-4 md:mb-6">
              <span className="text-4xl md:text-5xl font-bold text-white">$1,999</span>
              <span className="text-lg md:text-xl text-gray-400">/mo</span>
            </div>
          </div>

          <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <span className="text-white font-semibold text-xs md:text-sm">3 AI Callers</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <span className="text-white font-semibold text-xs md:text-sm">1,800 leads per day</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-300 text-xs md:text-sm">Live call transfer</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-300 text-xs md:text-sm">Priority support</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-300 text-xs md:text-sm">All Pro features</span>
            </div>
          </div>

          <button
            onClick={() => handleSubscribeClick('elite')}
            disabled={loading !== null || isCurrentTier('elite')}
            className={`w-full flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 font-bold rounded-lg md:rounded-xl transition-all duration-300 text-sm md:text-base ${
              isCurrentTier('elite')
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white md:hover:scale-105 hover:shadow-xl hover:shadow-amber-500/50'
            }`}
          >
            {loading === 'elite' ? (
              <>
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                Processing...
              </>
            ) : isCurrentTier('elite') ? (
              'Current Plan'
            ) : (
              <>
                <Zap className="w-4 h-4 md:w-5 md:h-5" />
                {getButtonText('elite')}
                <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
              </>
            )}
          </button>
        </div>

      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 text-center">
        <p className="text-blue-300 text-sm">
          💳 <strong>Secure checkout powered by Stripe</strong> • Cancel anytime • No long-term contracts
        </p>
      </div>

      {/* First Confirmation Modal */}
      {pendingTier && currentTier && ['starter', 'pro', 'elite'].includes(currentTier) && !showFinalConfirmation && (
        <UpgradeConfirmationModal
          currentTier={currentTier as 'starter' | 'pro' | 'elite'}
          newTier={pendingTier}
          onConfirm={handleFirstConfirmation}
          onCancel={handleCancelAll}
        />
      )}

      {/* Final Confirmation Modal (with checkbox agreement) */}
      {pendingTier && currentTier && ['starter', 'pro', 'elite'].includes(currentTier) && showFinalConfirmation && (
        <FinalConfirmationModal
          currentTier={currentTier as 'starter' | 'pro' | 'elite'}
          newTier={pendingTier}
          onConfirm={handleFinalConfirmation}
          onCancel={() => setShowFinalConfirmation(false)}
        />
      )}
    </div>
  );
}

