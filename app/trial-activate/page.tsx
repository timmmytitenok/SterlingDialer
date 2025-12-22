'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, CheckCircle2, Lock, Zap, CreditCard } from 'lucide-react';

export default function TrialActivatePage() {
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const router = useRouter();

  const handleActivateTrial = async () => {
    if (!termsAccepted) {
      alert('Please accept the Terms of Service to continue');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🚀 Activating trial...');
      
      // Call API to create Stripe setup session (saves card, no charge)
      const response = await fetch('/api/trial/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('📡 Response status:', response.status);
      
      const data = await response.json();
      console.log('📦 Response data:', data);

      if (data.url) {
        console.log('✅ Redirecting to Stripe...');
        // Redirect to Stripe checkout (setup mode)
        window.location.href = data.url;
      } else {
        console.error('❌ No URL in response:', data);
        alert(data.error || 'Failed to start trial. Check console for details.');
        setLoading(false);
      }
    } catch (error: any) {
      console.error('❌ Exception:', error);
      alert(`Error activating trial: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1437] relative overflow-hidden flex items-center justify-center p-3 sm:p-4">
      {/* Animated Background - Soft gradual glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[1000px] h-[1000px] bg-blue-500/8 rounded-full top-[-300px] left-[-300px] animate-pulse" style={{ filter: 'blur(180px)' }} />
        <div className="absolute w-[900px] h-[900px] bg-purple-500/8 rounded-full bottom-[-200px] right-[-300px] animate-pulse" style={{ filter: 'blur(180px)', animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-3 sm:mb-6">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 animate-pulse" />
            <span className="text-green-400 font-semibold text-xs sm:text-sm">Step 2 of 2</span>
          </div>
          <h1 className="text-4xl sm:text-4xl md:text-5xl font-bold text-white mb-2 sm:mb-4 px-2">
            Activate Your<br className="sm:hidden" /> Free Trial
          </h1>
          <p className="text-gray-300 text-sm sm:text-lg md:text-xl px-4">
            Add your payment method to start your 7-day trial
          </p>
        </div>

        {/* Pricing Card - Same as pricing page */}
        <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-blue-500/40 shadow-2xl mb-4 sm:mb-6">
          <div className="mb-3 sm:mb-4 flex justify-center">
            <span className="rounded-full bg-purple-600/20 px-3 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-purple-300 tracking-wide border border-purple-500/30">
              ⭐ ONE SIMPLE PLAN ⭐
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white text-center">
            SterlingAI Pro Access
          </h2>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-white/70 text-center">
            Let AI call your leads and fill your calendar.
          </p>

          <div className="mt-4 sm:mt-6 text-center">
            <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-1 sm:mb-2">
              $499<span className="text-lg sm:text-xl md:text-2xl font-normal text-white/60"> / month</span>
            </div>
            <div className="mt-2 sm:mt-3 text-sm sm:text-base md:text-lg text-emerald-400 font-semibold">
              + $0.40 per minute for calls
            </div>
          </div>

          <ul className="mt-5 sm:mt-6 md:mt-8 space-y-2 sm:space-y-3 text-xs sm:text-sm text-white/80">
            <li className="flex items-center gap-2 sm:gap-3">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
              <span>Unlimited AI agents & unlimited leads</span>
            </li>
            <li className="flex items-center gap-2 sm:gap-3">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
              <span>Live call transfers straight to your phone</span>
            </li>
            <li className="flex items-center gap-2 sm:gap-3">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
              <span>Automatic appointment booking into your calendar</span>
            </li>
            <li className="flex items-center gap-2 sm:gap-3">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
              <span>Recordings, transcripts & performance dashboard</span>
            </li>
          </ul>

          {/* Trial Details */}
          <div className="mt-5 sm:mt-6 md:mt-8 p-3 sm:p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg sm:rounded-xl">
            <div className="flex items-start gap-2 sm:gap-3">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-bold text-xs sm:text-sm mb-1">Free for 7 days, then $499/month</p>
                <p className="text-gray-300 text-[10px] sm:text-xs leading-relaxed">
                  Your card will be automatically charged $499 when your trial ends. Cancel anytime before Day 7 to avoid charges.
                </p>
              </div>
            </div>
          </div>

          {/* Terms of Service Checkbox */}
          <div className="mt-4 sm:mt-5 md:mt-6">
            <label className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 md:p-5 bg-blue-500/10 border-2 border-blue-500/30 hover:border-blue-500/50 rounded-lg sm:rounded-xl cursor-pointer transition-all group">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer flex-shrink-0"
              />
              <span className="text-[10.5px] sm:text-[10px] md:text-sm text-gray-300 leading-relaxed">
                By continuing, I confirm I have read and agree to Sterling AI's{' '}
                <a 
                  href="/terms-of-service" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline font-semibold"
                  onClick={(e) => e.stopPropagation()}
                >
                  Terms of Service
                </a>,{' '}
                <a 
                  href="/privacy-policy" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline font-semibold"
                  onClick={(e) => e.stopPropagation()}
                >
                  Privacy Policy
                </a>, and TCPA-compliant usage guidelines, and I consent to receive service-related SMS updates.
              </span>
            </label>
          </div>

          {/* Activate Button */}
          <button
            onClick={handleActivateTrial}
            disabled={loading || !termsAccepted}
            className="mt-4 sm:mt-5 md:mt-6 w-full px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 text-white font-bold text-base sm:text-lg rounded-xl transition-all duration-300 hover:scale-105 shadow-2xl hover:shadow-purple-500/80 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-sm sm:text-base">Loading...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base md:text-lg">Add Card & Start Trial</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </>
            )}
          </button>

          <p className="mt-3 sm:mt-4 text-[10px] sm:text-xs text-center text-white/50">
            No charge today • Billing starts automatically after 7 days
          </p>
        </div>

        {/* Security */}
        <div className="mt-4 sm:mt-6 flex items-center justify-center gap-3 sm:gap-6 text-[10px] sm:text-xs text-gray-500 flex-wrap px-4">
          <div className="flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>Secure checkout</span>
          </div>
          <span className="hidden sm:inline">•</span>
          <span>Powered by Stripe</span>
          <span className="hidden sm:inline">•</span>
          <span>Cancel anytime</span>
        </div>
      </div>
    </div>
  );
}

