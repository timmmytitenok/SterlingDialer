'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { CreditCard, ExternalLink, Sparkles, CheckCircle, Zap } from 'lucide-react';

interface StripeBillingProps {
  userEmail: string;
  hasSubscription: boolean;
  currentTier?: 'none' | 'starter' | 'pro' | 'elite' | 'free_trial';
}

export function StripeBilling({ userEmail, hasSubscription, currentTier = 'none' }: StripeBillingProps) {
  const [loading, setLoading] = useState(false);

  const handleManageBilling = async () => {
    setLoading(true);
    try {
      console.log('🔧 Requesting billing portal...');
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
      });

      const data = await response.json();
      console.log('📋 Portal response:', data);

      if (data.url) {
        console.log('✅ Redirecting to portal:', data.url);
        window.location.href = data.url;
      } else {
        console.error('❌ No URL in response:', data);
        alert(data.error || 'Failed to open billing portal');
      }
    } catch (error) {
      console.error('❌ Error opening billing portal:', error);
      alert('Error opening billing portal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to create checkout session');
      }
    } catch (error) {
      alert('Error creating checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Main Billing Card - Modern & Glowy */}
      <div className="relative bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-lg md:rounded-xl p-4 md:p-6 border-2 border-blue-500/30 hover:border-blue-500/50 transition-all duration-300 overflow-hidden group">
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Animated Background Orbs - hidden on mobile */}
        <div className="hidden md:block absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="hidden md:block absolute -bottom-20 -left-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 flex items-center justify-center border border-blue-500/30 relative">
                <CreditCard className="w-6 h-6 md:w-7 md:h-7 text-blue-400" />
                {hasSubscription && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-[#1A2647]">
                    <CheckCircle className="w-2 h-2 md:w-3 md:h-3 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-base md:text-xl font-bold text-white mb-0.5 md:mb-1">Subscription & Billing</h3>
                <p className="text-gray-400 text-xs md:text-sm">Powered by Stripe</p>
              </div>
            </div>
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-blue-400 opacity-70" />
          </div>

          {/* Billing Email */}
          <div className="bg-[#0B1437]/50 rounded-lg p-3 md:p-4 mb-4 md:mb-6 border border-gray-800/50 backdrop-blur-sm">
            <p className="text-[10px] md:text-xs text-gray-500 mb-1">Billing Email</p>
            <p className="text-sm md:text-base text-white font-medium truncate">{userEmail}</p>
          </div>

          {/* Subscription Status & Actions */}
          {hasSubscription ? (
            <>
              {/* Active Status Badge */}
              <div className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg mb-4 md:mb-6">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 font-semibold text-xs md:text-sm">
                  {currentTier === 'free_trial' ? 'Active Free Trial' : 'Active Subscription'}
                </span>
                <Zap className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
              </div>

              {/* Manage Button */}
              <button
                onClick={handleManageBilling}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold rounded-lg md:rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group text-sm md:text-base"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%]" style={{ transitionProperty: 'transform', transitionDuration: '1s' }} />
                <ExternalLink className="w-4 h-4 md:w-5 md:h-5" />
                <span className="relative z-10">{loading ? 'Opening Portal...' : 'Manage Billing'}</span>
              </button>

              <p className="text-[10px] md:text-xs text-center text-gray-500 mt-2 md:mt-3">
                Update payment method • View invoices • Cancel anytime
              </p>
            </>
          ) : (
            <>
              {/* Inactive Status */}
              <div className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg mb-4 md:mb-6">
                <div className="w-2 h-2 bg-gray-500 rounded-full" />
                <span className="text-gray-400 font-medium text-xs md:text-sm">No Active Subscription</span>
              </div>

              {/* Subscribe Button */}
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold rounded-lg md:rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
              >
                <CreditCard className="w-4 h-4 md:w-5 md:h-5" />
                <span>{loading ? 'Loading...' : 'Subscribe Now'}</span>
              </button>

              <p className="text-[10px] md:text-xs text-center text-gray-500 mt-2 md:mt-3">
                Start automating your sales today
              </p>
            </>
          )}
        </div>
      </div>

      {/* Features Card - Modern Design */}
      <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-lg md:rounded-xl p-4 md:p-6 border border-gray-800">
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-5">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-600/20 flex items-center justify-center border border-green-500/30">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
          </div>
          <h3 className="text-base md:text-lg font-bold text-white">What's Included</h3>
        </div>

        <div className="grid grid-cols-1 gap-2 md:gap-3">
          {(() => {
            // Base features for all tiers
            const baseFeatures = ['AI-powered calling automation'];
            
            // Add appointment verifier for Pro and Elite
            // All tiers have the same core features now
            
            // Add remaining features based on tier
            if (currentTier === 'free_trial') {
              baseFeatures.push(
                '1 AI Caller',
                'Up to 600 leads per day',
                '$0.30 per minute calling',
                'Live call transfer',
                'Call recordings & analytics',
                'Appointment scheduling',
                'Calendar integration'
              );
            } else if (currentTier === 'starter') {
              baseFeatures.push(
                '1 AI Caller',
                'Up to 600 leads per day',
                'Live call transfer',
                'Call recordings & analytics',
                'Appointment scheduling',
                'Revenue tracking'
              );
            } else if (currentTier === 'pro') {
              baseFeatures.push(
                '2 AI Callers',
                'Up to 1,200 leads per day',
                'Live call transfer',
                'Call recordings & analytics',
                'Appointment scheduling',
                'Revenue tracking',
                'Priority support'
              );
            } else if (currentTier === 'elite') {
              baseFeatures.push(
                '3 AI Callers',
                'Up to 1,800 leads per day',
                'Live call transfer',
                'Call recordings & analytics',
                'Appointment scheduling',
                'Revenue tracking',
                'Priority support'
              );
            } else {
              // Default for 'none' tier
              baseFeatures.push(
                'Up to 1,800 leads per day',
                'Live call transfer',
                'Call recordings & analytics',
                'Appointment scheduling',
                'Revenue tracking'
              );
            }
            
            return baseFeatures;
          })().map((feature, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 md:gap-3 bg-[#0B1437]/50 rounded-lg p-2.5 md:p-3 border border-gray-800/50 hover:border-green-500/30 transition-colors duration-200"
            >
              <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
              </div>
              <span className="text-gray-300 text-xs md:text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

