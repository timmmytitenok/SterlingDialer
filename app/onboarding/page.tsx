'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Clock, Monitor, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';

export default function OnboardingPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/signup');
        return;
      }

      // Check if they already have Pro Access - skip onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, has_active_subscription')
        .eq('user_id', user.id)
        .single();

      if (profile?.subscription_tier === 'pro' || profile?.has_active_subscription) {
        console.log('✅ User already has Pro Access - redirecting to dashboard');
        router.push('/dashboard');
        return;
      }

      setLoading(false);
    };

    checkUser();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1437] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1437] relative overflow-hidden">
      {/* Animated Background - Soft gradual glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[1000px] h-[1000px] bg-blue-500/8 rounded-full top-[-300px] left-[-300px] animate-pulse" style={{ filter: 'blur(180px)' }}></div>
        <div className="absolute w-[900px] h-[900px] bg-purple-500/8 rounded-full bottom-[-200px] right-[-300px] animate-pulse" style={{ filter: 'blur(180px)', animationDelay: '700ms' }}></div>
        <div className="absolute w-[800px] h-[800px] bg-pink-500/8 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ filter: 'blur(180px)', animationDelay: '1000ms' }}></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)] pointer-events-none"></div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8 md:py-12">
        <div className="max-w-3xl w-full">
          {/* Header */}
          <div className="text-center mb-6 md:mb-10 space-y-3 md:space-y-4">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg animate-bounce-in">
              <span className="text-2xl md:text-3xl font-bold text-white">SA</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-white animate-slide-up">
              Welcome to Sterling AI! 🚀
            </h1>
            
            <p className="text-base md:text-xl text-gray-300 animate-slide-up-delay">
              Let's get your AI agent set up and ready to revive those old leads
            </p>
          </div>

          {/* Main Info Card */}
          <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-xl md:rounded-2xl p-6 md:p-8 border border-gray-800 shadow-2xl mb-6 md:mb-8 animate-fade-in">
            {/* Time Estimate */}
            <div className="flex items-center justify-center gap-3 mb-6 md:mb-8 p-4 md:p-5 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <Clock className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />
              <div className="text-left">
                <p className="text-lg md:text-xl font-bold text-white">Setup Time: 5-10 Minutes</p>
                <p className="text-xs md:text-sm text-gray-400">Our team will configure everything for you</p>
              </div>
            </div>

            {/* What Happens Next */}
            <h3 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
              What Happens Next
            </h3>

            <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
              <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 bg-gray-800/30 rounded-lg">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 text-sm md:text-base font-bold text-blue-400">1</div>
                <div>
                  <p className="text-sm md:text-base text-white font-semibold">Complete Quick Onboarding Form</p>
                  <p className="text-xs md:text-sm text-gray-400">Just basic info to get started (takes 1 minute)</p>
                </div>
              </div>

              <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 bg-gray-800/30 rounded-lg">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 text-sm md:text-base font-bold text-purple-400">2</div>
                <div>
                  <p className="text-sm md:text-base text-white font-semibold">Sterling AI Team Sets Up Your Agent</p>
                  <p className="text-xs md:text-sm text-gray-400">We'll configure your AI caller, Cal.ai integration, and workflows</p>
                </div>
              </div>

              <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 bg-gray-800/30 rounded-lg">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 text-sm md:text-base font-bold text-green-400">3</div>
                <div>
                  <p className="text-sm md:text-base text-white font-semibold">You're Ready to Launch!</p>
                  <p className="text-xs md:text-sm text-gray-400">Start reviving leads and booking appointments automatically</p>
                </div>
              </div>
            </div>

            {/* Desktop Recommendation */}
            <div className="bg-yellow-500/10 border-2 border-yellow-500/40 rounded-xl p-4 md:p-5 mb-6 md:mb-8">
              <div className="flex items-start gap-3 md:gap-4">
                <AlertCircle className="w-6 h-6 md:w-8 md:h-8 text-yellow-400 flex-shrink-0" />
                <div>
                  <p className="text-sm md:text-lg font-bold text-yellow-300 mb-2">⚠️ HIGHLY RECOMMENDED</p>
                  <p className="text-xs md:text-sm text-yellow-200/90 mb-3 md:mb-4">
                    Complete the onboarding process on a <strong>desktop or laptop</strong> for the best experience. 
                    You'll need to provide detailed information and it's much easier on a larger screen.
                  </p>
                  <div className="flex items-center gap-4 md:gap-6 text-xs md:text-sm">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                      <span className="text-green-400 font-semibold">Desktop ✓</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
                      <span className="text-yellow-400">Mobile (Not Ideal)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 md:gap-4">
              <Link
                href="/onboarding/form"
                className="w-full px-6 md:px-8 py-4 md:py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-blue-500/50 flex items-center justify-center gap-2 text-base md:text-lg"
              >
                <CheckCircle className="w-5 h-5 md:w-6 md:h-6" />
                Continue to Onboarding
              </Link>

              <Link
                href="/dashboard"
                className="w-full px-6 md:px-8 py-3.5 md:py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 border border-gray-700 hover:border-gray-600 text-center text-sm md:text-base"
              >
                I'll Complete Onboarding Later
              </Link>
            </div>

            {/* Help Text */}
            <p className="text-center text-xs md:text-sm text-gray-500 mt-4 md:mt-6">
              Don't worry, you can access onboarding from your dashboard anytime
            </p>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out 0.2s both;
        }

        .animate-slide-up-delay {
          animation: slide-up 0.6s ease-out 0.4s both;
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out 0.6s both;
        }
      `}</style>
    </div>
  );
}

