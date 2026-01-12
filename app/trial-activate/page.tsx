'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, CheckCircle2, Lock, Zap, CreditCard, DollarSign } from 'lucide-react';

export default function TrialActivatePage() {
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const router = useRouter();

  const handleActivate = async () => {
    if (!termsAccepted) {
      alert('Please accept the Terms of Service to continue');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🚀 Activating Pay As You Go account...');
      
      // Call API to create Stripe setup session (saves card for pay-per-minute)
      const response = await fetch('/api/trial/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('📡 Response status:', response.status);
      
      const data = await response.json();
      console.log('📦 Response data:', data);

      if (data.url) {
        console.log('✅ Redirecting to Stripe...');
        // Redirect to Stripe checkout (saves card)
        window.location.href = data.url;
      } else {
        console.error('❌ No URL in response:', data);
        alert(data.error || 'Failed to activate. Check console for details.');
        setLoading(false);
      }
    } catch (error: any) {
      console.error('❌ Exception:', error);
      alert(`Error activating: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1437] relative overflow-hidden flex items-center justify-center p-3 sm:p-4 pt-16 sm:pt-20">
      {/* Animated Background - Same as Landing Page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[1000px] h-[1000px] bg-blue-500/8 rounded-full top-[-300px] left-[-300px] animate-pulse" style={{ filter: 'blur(180px)' }} />
        <div className="absolute w-[900px] h-[900px] bg-purple-500/8 rounded-full top-[20%] right-[-300px] animate-pulse" style={{ filter: 'blur(180px)', animationDelay: '1s' }} />
        <div className="absolute w-[1000px] h-[1000px] bg-pink-500/8 rounded-full bottom-[-300px] left-[20%] animate-pulse" style={{ filter: 'blur(180px)', animationDelay: '2s' }} />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.08)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-3 sm:mb-6">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 animate-pulse" />
            <span className="text-green-400 font-semibold text-xs sm:text-sm">Step 2 of 2</span>
          </div>
          <h1 className="text-4xl sm:text-4xl md:text-5xl font-bold text-white px-2">
            Add Payment Method
          </h1>
        </div>

        {/* Pricing Card - Pay As You Go */}
        <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-blue-500/40 shadow-2xl mb-4 sm:mb-6">
          <div className="mb-6 sm:mb-8 flex justify-center">
            <span className="rounded-full bg-purple-600/20 px-3 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-purple-300 tracking-wide border border-purple-500/30">
              ⭐ PAY AS YOU GO ⭐
            </span>
          </div>

          <div className="text-center">
            <div className="text-6xl sm:text-7xl md:text-8xl font-bold text-white mb-1 sm:mb-2">
              $0.65<span className="text-lg sm:text-xl md:text-2xl font-normal text-white/60"> / minute</span>
            </div>
          <div className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-blue-400 font-medium">
            No subscription • No monthly fees • No contracts
            </div>
          </div>

          <div className="mt-8 sm:mt-10 mb-10 sm:mb-12 flex justify-center">
            <div className="grid grid-cols-2 gap-x-8 sm:gap-x-12 gap-y-3 sm:gap-y-4 text-sm sm:text-base text-white/90">
              <div className="flex items-center gap-2 sm:gap-3">
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 flex-shrink-0" />
                <span>Unlimited leads</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 flex-shrink-0" />
                <span>500+ calls/day</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 flex-shrink-0" />
                <span>Auto booking</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 flex-shrink-0" />
                <span>Full transcripts</span>
              </div>
            </div>
          </div>

          {/* Pay As You Go Details */}
          <div className="mt-5 sm:mt-6 md:mt-8 p-3 sm:p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg sm:rounded-xl">
            <div className="flex items-start gap-2 sm:gap-3">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-bold text-xs sm:text-sm mb-1">How Pay As You Go Works</p>
                <p className="text-gray-300 text-[10px] sm:text-xs leading-relaxed">
                  Add funds to your call balance when you're ready. You're only charged for the actual minutes used during AI calls. No monthly fees, no hidden charges!
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
                By continuing, you agree to Sterling Dialer's{' '}
                <a 
                  href="/terms" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline font-semibold"
                  onClick={(e) => e.stopPropagation()}
                >
                  Terms
                </a>,{' '}
                <a 
                  href="/privacy" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline font-semibold"
                  onClick={(e) => e.stopPropagation()}
                >
                  Privacy Policy
                </a>,{' '}
                <a 
                  href="https://www.fcc.gov/general/telemarketing-and-robocalls" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline font-semibold"
                  onClick={(e) => e.stopPropagation()}
                >
                  TCPA usage rules
                </a>, and consent to service-related SMS messages.
              </span>
            </label>
          </div>

          {/* Activate Button */}
          <button
            onClick={handleActivate}
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
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base md:text-lg">Add Card & Get Started</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </>
            )}
          </button>

          <p className="mt-3 sm:mt-4 text-[10px] sm:text-xs text-center text-white/50">
            No monthly fees • Only pay for minutes used
          </p>
        </div>

        {/* Security */}
        <div className="mt-4 sm:mt-6 pb-8 sm:pb-12 flex items-center justify-center gap-3 sm:gap-6 text-[10px] sm:text-xs text-gray-500 flex-wrap px-4">
          <div className="flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>Secure checkout</span>
          </div>
          <span>•</span>
          <span>Powered by Stripe</span>
        </div>
      </div>
    </div>
  );
}

