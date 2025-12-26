'use client';

import { useState } from 'react';
import { CheckCircle2, Zap, ArrowRight, Loader2, Sparkles, Clock } from 'lucide-react';

interface SubscriptionTierSelectorProps {
  currentTier?: 'starter' | 'pro' | 'elite' | 'none' | null;
  hideFreeTrial?: boolean;
}

export function SubscriptionTierSelector({ currentTier, hideFreeTrial = false }: SubscriptionTierSelectorProps) {
  const [loading, setLoading] = useState(false);
  const [trialLoading, setTrialLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'pro' }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.sessionId) {
        window.location.href = `/api/stripe/verify-session?session_id=${data.sessionId}`;
      } else {
        alert(data.error || 'Failed to create checkout');
        setLoading(false);
      }
    } catch (error) {
      alert('Error creating checkout');
      setLoading(false);
    }
  };

  const handleStartFreeTrial = async () => {
    setTrialLoading(true);
    try {
      // Use trial/activate endpoint which REQUIRES card on file
      const response = await fetch('/api/trial/activate', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe checkout to add payment method
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to start trial');
        setTrialLoading(false);
      }
    } catch (error) {
      alert('Error starting trial');
      setTrialLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Free Trial Card */}
      {!hideFreeTrial && (
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-8 border-2 border-green-500/30">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">🎁 Start Your Free Trial</h3>
            <p className="text-green-300 text-lg">Try all features FREE for 7 days - Card required (no charge for 7 days)</p>
          </div>

          <button
            onClick={handleStartFreeTrial}
            disabled={trialLoading}
            className="w-full px-8 py-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-xl rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-green-500/50 disabled:opacity-50"
          >
            {trialLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                Starting Trial...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Clock className="w-6 h-6" />
                Start 7-Day Free Trial
                <ArrowRight className="w-6 h-6" />
              </span>
            )}
          </button>
        </div>
      )}

      {/* Single Pro Plan */}
      <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl p-8 border-2 border-blue-500/40 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>

        <div className="relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-3">
              SterlingAI Pro Access
            </h2>
            <div className="flex items-baseline justify-center gap-2 mb-3">
              <span className="text-6xl font-bold text-blue-400">$379</span>
              <span className="text-2xl text-gray-400">/month</span>
            </div>
            <p className="text-gray-300 text-lg">
              Full access + pay-as-you-go minutes ($0.35/min)
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {[
              'Unlimited AI calling agents',
              'All premium features unlocked',
              'Priority support & setup',
              'Advanced analytics & reporting',
              'Google Sheets integration',
              'Cal.ai appointment booking',
              'Live transfer capability',
              'Custom AI configuration',
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                <span className="text-white font-medium">{feature}</span>
              </div>
            ))}
          </div>

          <div className="mb-8 p-6 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <h4 className="text-white font-bold mb-2">💰 Pay-As-You-Go Minutes</h4>
            <p className="text-gray-300 text-sm mb-3">
              Only pay for minutes you use - billed separately
            </p>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Per-minute rate:</span>
              <span className="text-2xl font-bold text-blue-400">$0.35/min</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Auto-refill $25 when balance drops below $1
            </p>
          </div>

          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full px-8 py-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold text-2xl rounded-xl transition-all duration-300 hover:scale-105 shadow-2xl hover:shadow-blue-500/50 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <Loader2 className="w-7 h-7 animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-3">
                <Sparkles className="w-7 h-7" />
                Subscribe Now - $379/month
                <ArrowRight className="w-7 h-7" />
              </span>
            )}
          </button>

          <p className="text-center text-gray-400 text-sm mt-4">
            Cancel anytime • Billed monthly • Secure payment via Stripe
          </p>
        </div>
      </div>
    </div>
  );
}
