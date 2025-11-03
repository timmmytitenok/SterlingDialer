'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, DollarSign, TrendingUp, Zap } from 'lucide-react';

function SubscribeSuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fadeOut, setFadeOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mark as mounted to fix hydration
    setMounted(true);

    // 🚨 CRITICAL: Immediately verify payment and mark user as subscribed
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      console.log('🔍 Verifying payment session:', sessionId);
      fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log('✅ Payment verified and profile updated immediately!');
        } else {
          console.error('⚠️ Payment verification failed:', data.error);
        }
      })
      .catch(err => console.error('❌ Error verifying payment:', err));
    }

    // Check if user has already completed onboarding
    const checkOnboardingStatus = async () => {
      try {
        const response = await fetch('/api/user/onboarding-status');
        const data = await response.json();
        
        // Start fade out after 4 seconds
        const fadeTimer = setTimeout(() => {
          setFadeOut(true);
        }, 4000);

        // Redirect based on onboarding status after 5 seconds
        const redirectTimer = setTimeout(() => {
          if (data.onboardingCompleted) {
            console.log('✅ User already completed onboarding - going to dashboard');
            router.push('/dashboard');
          } else {
            console.log('🆕 New user - going to onboarding');
            router.push('/onboarding');
          }
        }, 5000);

        return () => {
          clearTimeout(fadeTimer);
          clearTimeout(redirectTimer);
        };
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // Default to onboarding if check fails
        setTimeout(() => router.push('/onboarding'), 5000);
      }
    };

    checkOnboardingStatus();
  }, [router, searchParams]);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#0B1437] via-purple-900 to-[#0B1437] relative overflow-hidden flex items-center justify-center transition-opacity duration-1000 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      {/* All animations (client-side only to prevent hydration issues) */}
      {mounted && (
        <>
          {/* Confetti Animation - MORE CONFETTI! */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(120)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10%',
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            >
              <div
                className={`w-2 h-2 md:w-3 md:h-3 ${
                  i % 8 === 0 ? 'bg-yellow-400' :
                  i % 8 === 1 ? 'bg-green-400' :
                  i % 8 === 2 ? 'bg-blue-400' :
                  i % 8 === 3 ? 'bg-pink-400' :
                  i % 8 === 4 ? 'bg-purple-400' :
                  i % 8 === 5 ? 'bg-red-400' :
                  i % 8 === 6 ? 'bg-orange-400' :
                  'bg-cyan-400'
                } rounded-full`}
                style={{
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
        </div>

        {/* Flying Money Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-money-fly"
              style={{
                left: `${Math.random() * 100}%`,
                top: '100%',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${4 + Math.random() * 2}s`,
              }}
            >
              <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-green-400 animate-spin-slow" />
            </div>
          ))}
        </div>

        {/* Sparkles Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-sparkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            >
              <Sparkles className="w-4 h-4 md:w-6 md:h-6 text-yellow-300" />
            </div>
          ))}
        </div>
        </>
      )}

      {/* Main Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* Success Icon */}
        <div className="mb-6 md:mb-8 animate-bounce-in">
          <div className="w-24 h-24 md:w-32 md:h-32 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/50 animate-pulse-glow">
            <svg className="w-12 h-12 md:w-16 md:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 md:mb-6 animate-slide-up">
          Welcome to Sterling AI! 🎉
        </h1>

        <p className="text-xl md:text-3xl text-green-400 font-bold mb-4 md:mb-6 animate-slide-up-delay-1">
          Payment Successful!
        </p>

        {/* Animated Icons */}
        <div className="flex items-center justify-center gap-4 md:gap-8 animate-slide-up-delay-2">
          <div className="p-3 md:p-4 bg-purple-500/20 rounded-full border-2 border-purple-400 animate-bounce-slow">
            <Zap className="w-6 h-6 md:w-8 md:h-8 text-purple-400" />
          </div>
          <div className="p-3 md:p-4 bg-green-500/20 rounded-full border-2 border-green-400 animate-bounce-slow" style={{ animationDelay: '0.2s' }}>
            <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-green-400" />
          </div>
          <div className="p-3 md:p-4 bg-yellow-500/20 rounded-full border-2 border-yellow-400 animate-bounce-slow" style={{ animationDelay: '0.4s' }}>
            <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes money-fly {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-120vh) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes bounce-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fade-in-scale {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.5);
          }
          50% {
            box-shadow: 0 0 40px rgba(34, 197, 94, 0.8);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-confetti {
          animation: confetti linear infinite;
        }

        .animate-money-fly {
          animation: money-fly linear infinite;
        }

        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out 0.3s both;
        }

        .animate-slide-up-delay-1 {
          animation: slide-up 0.8s ease-out 0.6s both;
        }

        .animate-slide-up-delay-2 {
          animation: slide-up 0.8s ease-out 0.9s both;
        }

        .animate-fade-in-scale {
          animation: fade-in-scale 0.8s ease-out;
        }

        .animate-fade-in-delay {
          animation: slide-up 0.6s ease-out 0.3s both;
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default function SubscribeSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-[#0B1437] via-purple-900 to-[#0B1437] flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <SubscribeSuccessPageContent />
    </Suspense>
  );
}

