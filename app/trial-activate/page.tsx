'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, CheckCircle2, Lock, Zap, CreditCard } from 'lucide-react';

export default function TrialActivatePage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleActivateTrial = async () => {
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
    <div className="min-h-screen bg-[#0B1437] relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl top-20 -left-40 animate-pulse" />
        <div className="absolute w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl bottom-20 -right-40 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-green-400 animate-pulse" />
            <span className="text-green-400 font-semibold">Step 2 of 2</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Activate Your Free Trial
          </h1>
          <p className="text-gray-300 text-xl">
            Add your payment method to start your 30-day trial
          </p>
        </div>

        {/* Pricing Card - Same as pricing page */}
        <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl p-8 border-2 border-blue-500/40 shadow-2xl mb-6">
          <div className="mb-4 flex justify-center">
            <span className="rounded-full bg-purple-600/20 px-4 py-1.5 text-xs font-semibold text-purple-300 tracking-wide border border-purple-500/30">
              ⭐ ONE SIMPLE PLAN ⭐
            </span>
          </div>

          <h2 className="text-3xl font-bold text-white text-center">
            SterlingAI Pro Access
          </h2>
          <p className="mt-2 text-sm text-white/70 text-center">
            Let AI call your leads and fill your calendar.
          </p>

          <div className="mt-6 text-center">
            <div className="text-6xl font-bold text-white mb-2">
              $499<span className="text-2xl font-normal text-white/60"> / month</span>
            </div>
            <div className="mt-3 text-lg text-emerald-400 font-semibold">
              + $0.30 per minute for calls
            </div>
          </div>

          <ul className="mt-8 space-y-3 text-sm text-white/80">
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span>Unlimited AI agents & unlimited leads</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span>Live call transfers straight to your phone</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span>Automatic appointment booking into your calendar</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span>Recordings, transcripts & performance dashboard</span>
            </li>
          </ul>

          {/* Trial Details */}
          <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-bold text-sm mb-1">Your subscription is free for 30 days.</p>
                <p className="text-gray-300 text-xs">
                  You'll only pay for minutes you use. You can cancel anytime before your trial ends.
                </p>
              </div>
            </div>
          </div>

          {/* Activate Button */}
          <button
            onClick={handleActivateTrial}
            disabled={loading}
            className="mt-6 w-full px-8 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 text-white font-bold text-lg rounded-xl transition-all duration-300 hover:scale-105 shadow-2xl hover:shadow-purple-500/80 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Add Card & Start Trial
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <p className="mt-4 text-xs text-center text-white/50">
            No charge today • Billing starts automatically after 30 days
          </p>
        </div>

        {/* Security */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>Secure checkout</span>
          </div>
          <span>•</span>
          <span>Powered by Stripe</span>
          <span>•</span>
          <span>Cancel anytime</span>
        </div>
      </div>
    </div>
  );
}

