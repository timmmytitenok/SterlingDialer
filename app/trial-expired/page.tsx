'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SubscriptionTierSelector } from '@/components/subscription-tier-selector';
import { Clock, AlertCircle, Sparkles } from 'lucide-react';

export default function TrialExpiredPage() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUserEmail(user.email || '');

      // Check if user actually has an expired trial
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, free_trial_ends_at')
        .eq('user_id', user.id)
        .single();

      // If they have an active subscription, redirect to dashboard
      if (profile?.subscription_tier && ['starter', 'pro', 'elite'].includes(profile.subscription_tier)) {
        router.push('/dashboard');
        return;
      }

      // If trial hasn't expired yet, redirect to dashboard
      if (profile?.free_trial_ends_at) {
        const trialEndsAt = new Date(profile.free_trial_ends_at);
        if (trialEndsAt > new Date()) {
          router.push('/dashboard');
          return;
        }
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
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -top-20 -left-20 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse" style={{ animationDelay: '700ms' }}></div>
        <div className="absolute w-96 h-96 bg-pink-500/10 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: '1000ms' }}></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)] pointer-events-none"></div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8 md:py-20">
        <div className="max-w-7xl w-full">
          {/* Header */}
          <div className="text-center mb-12 md:mb-18 space-y-4 md:space-y-6">
            {/* Trial Expired Message */}
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-amber-500/10 border-2 border-amber-500/40 rounded-xl mb-10">
              <Clock className="w-6 h-6 md:w-8 md:h-8 text-amber-400" />
              <div className="text-left">
                <p className="text-lg md:text-xl font-bold text-amber-300">Your Free Trial Has Ended</p>
                <p className="text-sm md:text-base text-amber-200">Thank you for trying Sterling AI!</p>
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white">
              Continue Reviving Your Leads
            </h1>
            
            <p className="text-sm md:text-xl text-gray-300 max-w-2xl mx-auto">
              Choose a plan below to keep your AI working for you 24/7
            </p>
          </div>

          {/* Subscription Tier Selector (No Free Trial Option) */}
          <div className="animate-in fade-in slide-in-from-bottom duration-700 mt-24">
            <SubscriptionTierSelector currentTier="none" hideFreeTrial={true} />
          </div>

          {/* Help Section */}
          <div className="mt-8 md:mt-12 text-center space-y-4">
            <div className="inline-flex items-start gap-3 px-6 py-4 bg-gray-800/50 border border-gray-700 rounded-xl max-w-2xl">
              <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm md:text-base text-gray-300 font-semibold mb-1">Questions About Pricing?</p>
                <p className="text-xs md:text-sm text-gray-400">
                  Contact us at{' '}
                  <a href="mailto:SterlingDailer@gmail.com" className="text-blue-400 hover:text-blue-300 underline">
                    SterlingDailer@gmail.com
                  </a>
                </p>
              </div>
            </div>

            <p className="text-xs md:text-sm text-gray-500">
              🔒 Secure payment processing powered by Stripe • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

