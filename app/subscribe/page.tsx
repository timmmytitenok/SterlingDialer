import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { SubscriptionTierSelector } from '@/components/subscription-tier-selector';

export default async function SubscribePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signup');
  }

  // Get user profile to check subscription status
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, has_active_subscription')
    .eq('user_id', user.id)
    .single();

  // If user already has Pro Access, redirect to dashboard
  if (profile?.subscription_tier === 'pro' || profile?.has_active_subscription) {
    console.log('✅ User has Pro Access - redirecting to dashboard');
    redirect('/dashboard');
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
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header with Back Button */}
        <div className="p-4 md:p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link 
              href="/"
              className="group flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 rounded-lg md:rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-white transition-colors" />
              <span className="text-sm md:text-base text-gray-300 group-hover:text-white font-medium">Back to Home</span>
            </Link>

            {/* Logo */}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-sm md:text-base font-bold text-white">SA</span>
              </div>
              <span className="text-lg md:text-xl font-bold text-white tracking-tight">Sterling AI</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-14 md:py-12">
          <div className="max-w-7xl w-full">
            {/* Welcome Section */}
            <div className="text-center mb-6 md:mb-12 space-y-3 md:space-y-4">
              {/* Badge */}
              <div 
                className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-full mb-3 md:mb-4 animate-in zoom-in duration-500"
              >
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-blue-400 animate-pulse" />
                <span className="text-xs md:text-base font-semibold text-blue-300">Welcome to Sterling AI</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-4 animate-in slide-in-from-bottom duration-700">
                Choose Your Plan
              </h1>
              
              {/* Subheading */}
              <p className="text-xs md:text-lg lg:text-xl text-gray-400 max-w-2xl mb-18 md:mb-35 mx-auto animate-in slide-in-from-bottom duration-700 delay-100">
                Select the perfect plan to start reviving your old leads!
              </p>

            </div>

            {/* Subscription Tier Selector */}
            <div className="animate-in fade-in slide-in-from-bottom duration-700 delay-300">
              <SubscriptionTierSelector currentTier="none" />
            </div>

            {/* Footer Help Text - Mobile Optimized */}
<div className="mt-6 md:mt-12 text-center space-y-3 md:space-y-4">
              <p className="text-xs md:text-sm text-gray-400">
                Questions? Contact us at{' '}
                <a href="mailto:SterlingDailer@gmail.com" className="text-blue-400 hover:text-blue-300 underline transition-colors">
                  SterlingDailer@gmail.com
                </a>
              </p>
              <p className="text-[10px] md:text-xs text-gray-500">
                🔒 Secure payment processing powered by Stripe • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

