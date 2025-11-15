'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Clock, AlertCircle, X, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';

export function TrialCountdownBanner() {
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [trialStartDate, setTrialStartDate] = useState<Date | null>(null);
  const [trialEndDate, setTrialEndDate] = useState<Date | null>(null);
  const [totalTrialDays, setTotalTrialDays] = useState(30);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkTrialStatus = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Get user's subscription info
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, free_trial_started_at, free_trial_ends_at, free_trial_total_days, free_trial_days_remaining')
        .eq('user_id', user.id)
        .single();

      // Only show banner if user is on free trial
      if (profile?.subscription_tier === 'free_trial' && profile.free_trial_ends_at) {
        const trialEndDate = new Date(profile.free_trial_ends_at);
        const now = new Date();
        
        // Calculate days remaining dynamically (don't trust the stored value)
        const msRemaining = trialEndDate.getTime() - now.getTime();
        const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
        const calculatedDaysRemaining = Math.max(0, daysRemaining); // Never show negative
        
        setDaysRemaining(calculatedDaysRemaining);
        setTotalTrialDays(profile.free_trial_total_days || 30);
        
        // Store dates for reference
        if (profile.free_trial_started_at) {
          setTrialStartDate(new Date(profile.free_trial_started_at));
        }
        setTrialEndDate(trialEndDate);
      }

      setLoading(false);
    };

    checkTrialStatus();

    // Check again every hour in case days change
    const interval = setInterval(checkTrialStatus, 3600000);
    return () => clearInterval(interval);
  }, [supabase]);

  // Don't show if loading, dismissed, or not on trial
  if (loading || dismissed || daysRemaining === null) {
    return null;
  }

  // Determine color scheme and urgency based on days remaining
  const getColorScheme = () => {
    if (daysRemaining <= 3) {
      return {
        bg: 'bg-gradient-to-r from-red-600/20 via-orange-600/20 to-red-600/20',
        bgPattern: 'bg-gradient-to-r from-red-500/5 via-orange-500/10 to-red-500/5',
        border: 'border-red-500/60',
        icon: 'text-red-400',
        text: 'text-red-300',
        textBold: 'text-red-200',
        badge: 'bg-red-500/20 border-red-500/50 text-red-300',
        button: 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 shadow-red-500/50',
        glow: 'shadow-red-500/30',
        urgent: true,
      };
    } else if (daysRemaining <= 7) {
      return {
        bg: 'bg-gradient-to-r from-amber-600/20 via-yellow-600/20 to-amber-600/20',
        bgPattern: 'bg-gradient-to-r from-amber-500/5 via-yellow-500/10 to-amber-500/5',
        border: 'border-amber-500/50',
        icon: 'text-amber-400',
        text: 'text-amber-300',
        textBold: 'text-amber-200',
        badge: 'bg-amber-500/20 border-amber-500/50 text-amber-300',
        button: 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 shadow-amber-500/50',
        glow: 'shadow-amber-500/20',
        urgent: false,
      };
    } else {
      return {
        bg: 'bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-blue-600/20',
        bgPattern: 'bg-gradient-to-r from-blue-500/5 via-indigo-500/10 to-blue-500/5',
        border: 'border-blue-500/50',
        icon: 'text-blue-400',
        text: 'text-blue-300',
        textBold: 'text-blue-200',
        badge: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
        button: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/50',
        glow: 'shadow-blue-500/20',
        urgent: false,
      };
    }
  };

  const colors = getColorScheme();

  return (
    <div className={`relative ${colors.bg} border-2 ${colors.border} rounded-lg md:rounded-xl overflow-hidden mb-4 md:mb-6 animate-in slide-in-from-top duration-500 ${colors.glow} shadow-xl`}>
      {/* Animated background pattern */}
      <div className={`absolute inset-0 ${colors.bgPattern} animate-pulse opacity-50`} />
      
      {/* Close button - Only show if > 3 days (not urgent) */}
      {!colors.urgent && (
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 md:top-3 md:right-3 p-1.5 hover:bg-white/10 rounded-lg transition-all duration-200 z-20 group"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 group-hover:text-white transition-colors" />
        </button>
      )}

      <div className="relative z-10 p-3 md:p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-5 pr-8 md:pr-0">
          {/* Left: Icon + Trial Badge */}
          <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
            {/* Icon */}
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${colors.bg} border-2 ${colors.border} flex items-center justify-center ${colors.urgent ? 'animate-pulse' : ''}`}>
              {colors.urgent ? (
                <AlertCircle className={`w-5 h-5 md:w-6 md:h-6 ${colors.icon}`} />
              ) : (
                <Clock className={`w-5 h-5 md:w-6 md:h-6 ${colors.icon}`} />
              )}
            </div>

            {/* Trial Badge */}
            <div className={`hidden md:flex px-3 py-1 ${colors.badge} border rounded-full`}>
              <span className="text-xs font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                FREE TRIAL
              </span>
            </div>
          </div>

          {/* Center: Countdown + Message */}
          <div className="flex-1 min-w-0">
            {/* Days Remaining - Big and Bold */}
            <div className="flex items-baseline gap-2 mb-1">
              <span className={`text-2xl md:text-3xl font-bold ${colors.textBold}`}>
                {daysRemaining}
              </span>
              <span className={`text-base md:text-lg font-semibold ${colors.text}`}>
                {daysRemaining === 1 ? 'day left' : 'days left'}
              </span>
              {colors.urgent && (
                <span className="text-lg md:text-xl animate-pulse">⚠️</span>
              )}
            </div>
            
            {/* Message */}
            <p className="text-xs md:text-sm text-gray-400">
              {colors.urgent ? (
                <>🔥 <strong className="text-white">Trial ending soon!</strong> Billing starts automatically in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}</>
              ) : (
                'Your card will be charged automatically when the trial ends'
              )}
            </p>
          </div>

          {/* Right: Subscribe Button (only show if <= 3 days) */}
          {colors.urgent && (
            <Link
              href="/dashboard/settings/billing"
              className={`w-full md:w-auto flex-shrink-0 px-4 md:px-6 py-2.5 md:py-3 ${colors.button} text-white font-bold rounded-lg md:rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg text-sm md:text-base whitespace-nowrap flex items-center justify-center gap-2`}
            >
              <Zap className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Subscribe Now</span>
              <span className="sm:hidden">Subscribe</span>
            </Link>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-3 md:mt-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-500">Trial Progress</span>
            <span className={`font-semibold ${colors.urgent ? colors.text : 'text-gray-400'}`}>
              {Math.round(((totalTrialDays - daysRemaining) / totalTrialDays) * 100)}% used
            </span>
          </div>
          <div className="h-2 bg-gray-800/60 rounded-full overflow-hidden backdrop-blur-sm">
            <div
              className={`h-full ${colors.button} transition-all duration-500 relative overflow-hidden`}
              style={{ width: `${((totalTrialDays - daysRemaining) / totalTrialDays) * 100}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 mt-1.5">
            <span>Day {totalTrialDays - daysRemaining} of {totalTrialDays}</span>
            <span>{daysRemaining} days left</span>
          </div>
        </div>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}

