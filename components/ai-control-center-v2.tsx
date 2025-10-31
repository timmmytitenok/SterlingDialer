'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Activity, Zap, Phone, Clock, TrendingUp, Rocket } from 'lucide-react';
import { LaunchAIModalV2 } from './launch-ai-modal-v2';
import { createClient } from '@/lib/supabase/client';
import type { SubscriptionFeatures } from '@/lib/subscription-helpers';

interface AIControlCenterV2Props {
  userId: string;
  initialSettings: any;
  hasSubscription: boolean;
  subscriptionFeatures?: SubscriptionFeatures;
  aiSetupStatus?: string;
  setupRequestedAt?: string | null;
  onboardingCompleted?: boolean;
}

export function AIControlCenterV2({ userId, initialSettings, hasSubscription, subscriptionFeatures, aiSetupStatus = 'ready', setupRequestedAt, onboardingCompleted = false }: AIControlCenterV2Props) {
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [showLowBalanceWarning, setShowLowBalanceWarning] = useState(false);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [aiStatus, setAiStatus] = useState(initialSettings.status);
  const [recentCall, setRecentCall] = useState<any>(null);
  const supabase = createClient();

  // Poll for AI status and recent call updates
  useEffect(() => {
    const interval = setInterval(async () => {
      // Get AI status
      const { data: settingsData } = await supabase
        .from('ai_control_settings')
        .select('status')
        .eq('user_id', userId)
        .single();

      if (settingsData) {
        setAiStatus(settingsData.status);
      }

      // Get most recent call
      const { data: callsData } = await supabase
        .from('calls')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (callsData && callsData.length > 0) {
        setRecentCall(callsData[0]);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [userId, supabase]);

  const isRunning = aiStatus === 'running';

  // FIRST CHECK: If onboarding is not completed, show onboarding required message
  if (!onboardingCompleted) {
    return (
      <div className="min-h-screen bg-[#0B1437] relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-3xl -top-40 -left-40 animate-pulse" />
          <div className="absolute w-[600px] h-[600px] bg-yellow-500/5 rounded-full blur-3xl -bottom-40 -right-40 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

        <main className="container mx-auto px-4 lg:px-8 py-4 md:py-8 relative z-10">
          {/* Header */}
          <div className="mb-4 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">AI Control Center</h1>
            <p className="text-sm md:text-base text-gray-400">Complete onboarding to deploy your AI agent</p>
          </div>

          {/* Onboarding Required */}
          <div className="max-w-3xl mx-auto">
            <div className="relative bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-xl md:rounded-2xl border-2 border-orange-500/40 p-6 md:p-12 lg:p-20 min-h-[500px] md:min-h-[600px] flex flex-col justify-center">
              {/* Animated Icon */}
              <div className="text-center mb-6 md:mb-8">
                <div className="inline-block mb-4 md:mb-6 relative">
                  {/* Warning icon with pulse */}
                  <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-2xl md:rounded-3xl flex items-center justify-center border-2 md:border-4 bg-orange-900/30 border-orange-500/50 animate-pulse">
                    <span className="text-5xl md:text-7xl">⚠️</span>
                  </div>
                  {/* Orbiting dots */}
                  <div className="absolute top-1/2 left-1/2 w-32 h-32 md:w-40 md:h-40 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="absolute top-0 left-1/2 w-2 h-2 md:w-3 md:h-3 bg-orange-400 rounded-full shadow-lg shadow-orange-500/50 animate-spin" style={{ animationDuration: '3s', transformOrigin: '0 64px' }} />
                  </div>
                </div>

                {/* Status Text */}
                <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 md:mb-4">
                  🚨 Onboarding Required
                </h2>
                <p className="text-base md:text-xl text-orange-300 mb-2 font-semibold">
                  Complete onboarding to activate your AI agent
                </p>
                <p className="text-sm md:text-1xl text-gray-400 mb-6 md:mb-8 max-w-lg mx-auto">
                  Our Sterling AI team needs your information to configure your AI calling agent
                </p>
              </div>

              {/* What You Need */}
              <div className="bg-[#0B1437]/50 rounded-lg md:rounded-xl p-4 md:p-6 border border-orange-500/30 mb-6 md:mb-8 max-w-lg mx-auto backdrop-blur-sm">
                <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 text-center">What We Need From You:</h3>
                <div className="grid grid-cols-1 gap-3 md:gap-4">
                  <div className="flex items-start gap-3 md:gap-4 bg-[#1A2647]/50 rounded-lg p-3 md:p-4 border border-gray-800">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-400 text-base md:text-lg">1</span>
                    </div>
                    <div>
                      <p className="text-sm md:text-base text-white font-semibold">Your Contact Information</p>
                      <p className="text-xs md:text-sm text-gray-400">So we can reach you for setup questions</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 md:gap-4 bg-[#1A2647]/50 rounded-lg p-3 md:p-4 border border-gray-800">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-400 text-base md:text-lg">2</span>
                    </div>
                    <div>
                      <p className="text-sm md:text-base text-white font-semibold">Cal.ai Booking Intergration</p>
                      <p className="text-xs md:text-sm text-gray-400">Where your AI will schedule appointments</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 md:gap-4 bg-[#1A2647]/50 rounded-lg p-3 md:p-4 border border-gray-800">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-400 text-base md:text-lg">3</span>
                    </div>
                    <div>
                      <p className="text-sm md:text-base text-white font-semibold">Your Leads Database</p>
                      <p className="text-xs md:text-sm text-gray-400">So your AI can call them</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="text-center">
                <a
                  href="/onboarding"
                  className="inline-flex items-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-white font-bold rounded-lg md:rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/50 text-sm md:text-base"
                >
                  <Rocket className="w-5 h-5 md:w-6 md:h-6" />
                  Complete Onboarding Now
                </a>
                <p className="text-xs md:text-sm text-gray-500 mt-3 md:mt-4">
                  ⏱️ Takes 5-10 minutes • Required to activate AI
                </p>
              </div>

              {/* Urgency Message */}
              <div className="mt-6 md:mt-8 text-center">
                <div className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg md:rounded-xl">
                  <span className="text-yellow-400 text-base md:text-lg">⚡</span>
                  <p className="text-xs md:text-sm text-yellow-300 font-semibold">
                    The sooner you complete onboarding, the sooner we can deploy your AI!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        <style jsx global>{`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
        `}</style>
      </div>
    );
  }

  // SECOND CHECK: If AI is in setup/maintenance mode, show setup message
  if (aiSetupStatus === 'pending_setup' || aiSetupStatus === 'maintenance') {
    const isPending = aiSetupStatus === 'pending_setup';
    const setupDate = setupRequestedAt ? new Date(setupRequestedAt) : null;
    const hoursWaiting = setupDate ? Math.floor((Date.now() - setupDate.getTime()) / (1000 * 60 * 60)) : 0;

    return (
      <div className="min-h-screen bg-[#0B1437] relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl -top-40 -left-40 animate-pulse" />
          <div className="absolute w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl -bottom-40 -right-40 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

        <main className="container mx-auto px-4 lg:px-8 py-8 relative z-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">AI Control Center</h1>
            <p className="text-gray-400">Your AI agent is being configured</p>
          </div>

          {/* Setup In Progress */}
          <div className="max-w-3xl mx-auto">
            <div className="relative bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl border-2 border-blue-500/40 p-20 min-h-[600px] flex flex-col justify-center">
              {/* Animated Icon */}
              <div className="text-center mb-8">
                <div className="inline-block mb-6 relative">
                  {/* Spinning gear icon */}
                  <div className="relative w-32 h-32 rounded-3xl flex items-center justify-center border-4 bg-blue-900/30 border-blue-500/50">
                    <Activity className="w-16 h-16 text-blue-400 animate-pulse" />
                  </div>
                  {/* Orbiting dots */}
                  <div className="absolute top-1/2 left-1/2 w-40 h-40 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="absolute top-0 left-1/2 w-3 h-3 bg-blue-400 rounded-full shadow-lg shadow-blue-500/50 animate-spin" style={{ animationDuration: '3s', transformOrigin: '0 80px' }} />
                  </div>
                  <div className="absolute top-1/2 left-1/2 w-48 h-48 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="absolute top-0 left-1/2 w-2 h-2 bg-purple-400 rounded-full shadow-lg shadow-purple-500/50 animate-spin" style={{ animationDuration: '4s', animationDelay: '0.5s', transformOrigin: '0 96px' }} />
                  </div>
                </div>

                {/* Status Text */}
                <h2 className="text-4xl font-bold text-white mb-4">
                  {isPending ? '🚧 AI Setup In Progress' : '🔧 Maintenance Mode'}
                </h2>
                <p className="text-xl text-gray-400 mb-2">
                  {isPending 
                    ? 'Our team is configuring your AI calling agent' 
                    : 'Upgrading your AI system with new workflows'}
                </p>
                <p className="text-gray-500 mb-8">
                  {isPending 
                    ? 'This typically takes 12-24 hours' 
                    : 'Setting up additional AI agents for your account'}
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-[#0B1437]/50 rounded-xl p-8 border border-blue-500/30 mb-8 max-w-lg mx-auto backdrop-blur-sm">
                <h3 className="text-xl font-bold text-white mb-6 text-center">What We're Setting Up:</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 bg-[#1A2647]/50 rounded-lg p-4 border border-gray-800">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-400 text-lg">1</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold mb-1">Deploying Calling Infrastructure</p>
                      <p className="text-gray-400 text-sm">Setting up your personalized calling system and conversation logic</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 bg-[#1A2647]/50 rounded-lg p-4 border border-gray-800">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-400 text-lg">2</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold mb-1">Configuring AI Agents</p>
                      <p className="text-gray-400 text-sm">Training your {subscriptionFeatures?.aiCallerCount || 1} AI caller{(subscriptionFeatures?.aiCallerCount || 1) > 1 ? 's' : ''} for optimal performance</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 bg-[#1A2647]/50 rounded-lg p-4 border border-gray-800">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-400 text-lg">3</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold mb-1">Testing & Validation</p>
                      <p className="text-gray-400 text-sm">Ensuring everything works perfectly before launch</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              {setupDate && (
                <div className="text-center mb-8">
                  <p className="text-gray-400 text-sm mb-2">
                    {isPending ? 'Setup Requested' : 'Maintenance Started'}
                  </p>
                  <p className="text-white font-semibold text-lg">{setupDate.toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  })}</p>
                  <p className="text-gray-500 text-xs mt-1">({hoursWaiting} hour{hoursWaiting !== 1 ? 's' : ''} ago)</p>
                </div>
              )}

              {/* Email Notification Notice */}
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/30 max-w-lg mx-auto">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">📧</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold mb-2">We'll Email You When Ready</p>
                    <p className="text-gray-400 text-sm">
                      You'll receive an email notification as soon as your AI agent is configured and ready to launch. 
                      {isPending ? ' Expected within 12-24 hours.' : ' Should be ready soon.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Support Info */}
              <div className="text-center mt-8">
                <p className="text-gray-500 text-sm">
                  Questions? Contact our support team for updates
                </p>
              </div>
            </div>
          </div>
        </main>

        <style jsx global>{`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
        `}</style>
      </div>
    );
  }

  // Show subscription required screen if no active subscription
  if (!hasSubscription) {
    return (
      <div className="min-h-screen bg-[#0B1437] relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl -top-40 -left-40 animate-pulse" />
          <div className="absolute w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl -bottom-40 -right-40 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

        <main className="container mx-auto px-4 lg:px-8 py-8 relative z-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">AI Control Center</h1>
            <p className="text-gray-400">Deploy and monitor your AI calling agent</p>
          </div>

          {/* Subscription Required */}
          <div className="max-w-3xl mx-auto">
            <div className="relative bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-2xl border-2 border-orange-500/40 p-20 min-h-[600px] flex flex-col justify-center">
              {/* Animated Icon */}
              <div className="text-center mb-8">
                <div className="inline-block mb-6 relative">
                  {/* Icon Container with slash */}
                  <div className="relative w-32 h-32 rounded-3xl flex items-center justify-center border-4 bg-gray-800/30 border-gray-700">
                    <Activity className="w-16 h-16 text-gray-500" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-40 h-1 bg-orange-500 rotate-45 rounded-full shadow-lg shadow-orange-500/50"></div>
                    </div>
                  </div>
                </div>

                {/* Status Text */}
                <h2 className="text-4xl font-bold text-white mb-4">Subscription Required</h2>
                <p className="text-xl text-gray-400 mb-2">
                  Choose from our <span className="text-white font-bold">Starter, Pro, or Elite Plans</span>
                </p>
                <p className="text-gray-500 mb-8">to unlock AI calling automation</p>
              </div>

              {/* Features List */}
              <div className="bg-[#0B1437]/50 rounded-xl p-8 border border-gray-800 mb-8 max-w-lg mx-auto backdrop-blur-sm">
                <h3 className="text-xl font-bold text-white mb-6 text-center">Starter Pack Includes:</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-4 bg-[#1A2647]/50 rounded-lg p-4 border border-gray-800">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-400 text-lg">✓</span>
                    </div>
                    <span className="text-gray-300">AI-powered calling automation</span>
                  </div>
                  <div className="flex items-center gap-4 bg-[#1A2647]/50 rounded-lg p-4 border border-gray-800">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-400 text-lg">✓</span>
                    </div>
                    <span className="text-gray-300">Up to 600 leads per day</span>
                  </div>
                  <div className="flex items-center gap-4 bg-[#1A2647]/50 rounded-lg p-4 border border-gray-800">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-400 text-lg">✓</span>
                    </div>
                    <span className="text-gray-300">Live call transfer</span>
                  </div>
                  <div className="flex items-center gap-4 bg-[#1A2647]/50 rounded-lg p-4 border border-gray-800">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-400 text-lg">✓</span>
                    </div>
                    <span className="text-gray-300">Call recordings & analytics</span>
                  </div>
                  <div className="flex items-center gap-4 bg-[#1A2647]/50 rounded-lg p-4 border border-gray-800">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-400 text-lg">✓</span>
                    </div>
                    <span className="text-gray-300">Revenue tracking</span>
                  </div>
                </div>
              </div>

              {/* Subscribe Button */}
              <div className="text-center">
                <a
                  href="/dashboard/settings/billing"
                  className="group relative inline-block px-12 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold text-xl rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <Rocket className="w-6 h-6" />
                    View Plans & Subscribe
                    <Zap className="w-5 h-5" />
                  </span>
                  {/* Shine Effect */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer" />
                </a>
                <p className="text-gray-500 text-sm mt-4">Choose the plan that fits your needs</p>
              </div>
            </div>
          </div>
        </main>

        <style jsx global>{`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
        `}</style>
      </div>
    );
  }

  const handleLaunched = () => {
    setShowLaunchModal(false);
    setAiStatus('running');
  };

  // Check balance before launching AI
  const handleLaunchClick = async () => {
    try {
      // Fetch current balance
      const response = await fetch('/api/balance/get');
      const data = await response.json();
      
      if (response.ok && typeof data.balance === 'number') {
        setCurrentBalance(data.balance);
        
        // Check if balance is below $10
        if (data.balance < 10) {
          setShowLowBalanceWarning(true);
          return;
        }
        
        // Balance is sufficient, proceed with launch
        setShowLaunchModal(true);
      } else {
        // If we can't fetch balance, show warning to be safe
        setShowLowBalanceWarning(true);
      }
    } catch (error) {
      console.error('Error checking balance:', error);
      // Show warning if there's an error
      setShowLowBalanceWarning(true);
    }
  };

  // Format outcome for display
  const formatOutcome = (outcome: string | null) => {
    if (!outcome) return 'No Answer';
    
    const outcomeMap: Record<string, string> = {
      'appointment_booked': 'BOOKED ✅',
      'not_interested': 'NOT INTERESTED',
      'callback_later': 'CALLBACK',
      'live_transfer': 'TRANSFERRED',
    };
    
    return outcomeMap[outcome] || outcome;
  };

  // Get outcome color
  const getOutcomeColor = (outcome: string | null) => {
    if (!outcome) return 'text-gray-400';
    
    const colorMap: Record<string, string> = {
      'appointment_booked': 'text-green-400',
      'not_interested': 'text-red-400',
      'callback_later': 'text-orange-400',
      'live_transfer': 'text-purple-400',
    };
    
    return colorMap[outcome] || 'text-gray-400';
  };

  return (
    <div className="min-h-screen bg-[#0B1437] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl -top-40 -left-40 animate-pulse" />
        <div className="absolute w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl -bottom-40 -right-40 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <main className="container mx-auto px-4 lg:px-8 py-4 md:py-8 relative z-10">
        {/* Header */}
        <div className="mb-4 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">AI Control Center</h1>
          <p className="text-sm md:text-base text-gray-400">Deploy and monitor your AI calling agent</p>
        </div>

        {/* Main Control Panel */}
        <div className="max-w-5xl mx-auto">
          {/* Status Display */}
          <div className={`relative bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-xl md:rounded-2xl border-2 transition-all duration-500 ${
            isRunning 
              ? 'border-green-500/40 shadow-2xl shadow-green-500/20 p-6 md:p-12' 
              : 'border-gray-800 p-8 md:p-20 min-h-[400px] md:min-h-[600px] flex flex-col justify-center'
          }`}>
            {/* Status Indicator */}
            <div className="text-center mb-6 md:mb-8">
              {/* Animated Icon */}
              <div className="inline-block mb-4 md:mb-6 relative">
                {/* Glow Effect */}
                {isRunning && (
                  <div className="absolute inset-0 bg-green-500/30 rounded-2xl md:rounded-3xl blur-2xl md:blur-3xl animate-pulse" />
                )}
                
                {/* Icon Container */}
                <div className={`relative w-20 h-20 md:w-32 md:h-32 rounded-2xl md:rounded-3xl flex items-center justify-center border-2 md:border-4 transition-all duration-500 ${
                  isRunning
                    ? 'bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-green-500 shadow-lg shadow-green-500/30'
                    : 'bg-gray-800/30 border-gray-700'
                }`}>
                  {isRunning ? (
                    <Activity className="w-10 h-10 md:w-16 md:h-16 text-green-400 animate-pulse" style={{ animationDuration: '1.5s' }} />
                  ) : (
                    <Zap className="w-10 h-10 md:w-16 md:h-16 text-gray-500" />
                  )}
                </div>

                {/* Orbiting Dots (when running) - hide on mobile */}
                {isRunning && (
                  <>
                    <div className="hidden md:block absolute top-1/2 left-1/2 w-40 h-40 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <div className="absolute top-0 left-1/2 w-3 h-3 bg-green-400 rounded-full shadow-lg shadow-green-500/50 animate-spin" style={{ animationDuration: '3s', transformOrigin: '0 80px' }} />
                    </div>
                    <div className="hidden md:block absolute top-1/2 left-1/2 w-48 h-48 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <div className="absolute top-0 left-1/2 w-2 h-2 bg-blue-400 rounded-full shadow-lg shadow-blue-500/50 animate-spin" style={{ animationDuration: '4s', animationDelay: '0.5s', transformOrigin: '0 96px' }} />
                    </div>
                  </>
                )}
              </div>

              {/* Status Text */}
              <h2 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">
                <span className={`transition-colors duration-500 ${
                  isRunning ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {isRunning ? '🟢 ACTIVE' : '⚪ STANDBY'}
                </span>
              </h2>
              <p className={`text-sm md:text-lg transition-colors duration-500 ${
                isRunning ? 'text-green-400/70' : 'text-gray-500'
              }`}>
                {isRunning ? 'AI Agent is dialing leads' : 'AI Agent ready to deploy'}
              </p>
            </div>

            {/* Recent Call Display (when running) */}
            {isRunning && (
              <div className="mt-6 md:mt-8 bg-[#0B1437]/50 rounded-lg md:rounded-xl p-4 md:p-6 border border-green-500/20 backdrop-blur-sm animate-in fade-in slide-in-from-bottom duration-500">
                <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                  <Phone className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                  <h3 className="text-base md:text-lg font-semibold text-white">Recent Call</h3>
                  <div className="flex-1" />
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                </div>
                
                <div className="grid grid-cols-3 gap-2 md:gap-4">
                  <div className="bg-[#1A2647]/50 rounded-lg p-2 md:p-4 border border-gray-800">
                    <p className="text-[10px] md:text-xs text-gray-400 mb-1">Contact</p>
                    <p className="text-xs md:text-base text-white font-semibold truncate">
                      {recentCall?.contact_name || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-[#1A2647]/50 rounded-lg p-2 md:p-4 border border-gray-800">
                    <p className="text-[10px] md:text-xs text-gray-400 mb-1">Status</p>
                    <p className={`text-xs md:text-base font-bold ${recentCall ? getOutcomeColor(recentCall.outcome) : 'text-gray-400'}`}>
                      {recentCall ? formatOutcome(recentCall.outcome) : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-[#1A2647]/50 rounded-lg p-2 md:p-4 border border-gray-800">
                    <p className="text-[10px] md:text-xs text-gray-400 mb-1">Time</p>
                    <p className="text-xs md:text-base text-white font-semibold">
                      {recentCall ? new Date(recentCall.created_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Launch Button (only when stopped) */}
            {!isRunning && (
              <div className="mt-6 md:mt-8 text-center">
                <button
                  onClick={handleLaunchClick}
                  className="group relative px-8 md:px-12 py-3.5 md:py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold text-lg md:text-xl rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50"
                >
                  <span className="relative z-10 flex items-center gap-2 md:gap-3">
                    <Rocket className="w-5 h-5 md:w-6 md:h-6" />
                    {/* Mobile: Just "Launch" */}
                    <span className="md:hidden">Launch</span>
                    {/* Desktop: Full text */}
                    <span className="hidden md:inline">Launch AI Agent</span>
                    <Zap className="w-4 h-4 md:w-5 md:h-5" />
                  </span>
                  {/* Shine Effect */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer" />
                </button>
                <p className="text-gray-500 text-xs md:text-sm mt-2 md:mt-3">
                  Configure and deploy your AI calling agent
                </p>
              </div>
            )}

            {/* Running Status Message (no stop button!) */}
            {isRunning && (
              <div className="mt-6 md:mt-8 bg-gradient-to-r from-green-950/30 to-emerald-950/30 rounded-lg md:rounded-xl p-4 md:p-6 border border-green-500/30 backdrop-blur-sm">
                <div className="flex items-center justify-center gap-2 md:gap-3 mb-2 md:mb-3">
                  <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-400 animate-pulse" />
                  <p className="text-green-400 font-bold text-base md:text-lg">Automation in Progress</p>
                </div>
                <p className="text-center text-gray-300 text-xs md:text-sm">
                  The AI agent is actively dialing leads. The automation will continue until the execution target is reached.
                </p>
                <div className="mt-3 md:mt-4 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
                  <p className="text-green-400/60 text-xs">Live and running</p>
                </div>
              </div>
            )}
          </div>

          {/* Info Cards - Only show when AI is running */}
          {isRunning && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 mt-4 md:mt-6 animate-in fade-in slide-in-from-bottom duration-500">
              {/* 1. Status Card */}
              <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-lg md:rounded-xl p-4 md:p-6 border border-green-500/20 transition-all duration-200 hover:scale-[1.02] hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/10">
                <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-green-500/20 flex items-center justify-center border border-green-500/30">
                    <Zap className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                  </div>
                  <h3 className="text-sm md:text-base font-semibold text-white">Status</h3>
                </div>
                <p className="text-xl md:text-2xl font-bold text-green-400">RUNNING</p>
                <p className="text-xs text-green-400/60 mt-1">Agent active</p>
              </div>

              {/* 2. Execution Target Card - Dynamic based on mode */}
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-lg md:rounded-xl p-4 md:p-6 border border-blue-500/20 transition-all duration-200 hover:scale-[1.02] hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10">
                <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                    {initialSettings.execution_mode === 'time' ? (
                      <Clock className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                    ) : (
                      <Activity className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                    )}
                  </div>
                  <h3 className="text-sm md:text-base font-semibold text-white">
                    {initialSettings.execution_mode === 'time' ? 'Target Time' : 'Agent Limit'}
                  </h3>
                </div>
                <p className="text-xl md:text-3xl font-bold text-blue-400">
                  {initialSettings.execution_mode === 'time' && initialSettings.target_time_military
                    ? (() => {
                        // Convert military time to readable format (e.g., 1802 → 6:02 PM)
                        const military = initialSettings.target_time_military;
                        const hours = Math.floor(military / 100);
                        const minutes = military % 100;
                        const period = hours >= 12 ? 'PM' : 'AM';
                        const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
                        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
                      })()
                    : (initialSettings.target_lead_count || initialSettings.daily_call_limit || 400)
                  }
                </p>
                <p className="text-xs text-blue-400/60 mt-1">
                  {initialSettings.execution_mode === 'time' ? 'Stop time' : 'Calls per execution'}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Launch Modal */}
      {showLaunchModal && (
        <LaunchAIModalV2
          userId={userId}
          initialLimit={subscriptionFeatures?.maxDailyCalls || initialSettings.daily_call_limit || 600}
          initialTransfer={initialSettings.auto_transfer_calls || true}
          initialMode={initialSettings.execution_mode || 'time'}
          initialLeadCount={initialSettings.target_lead_count || subscriptionFeatures?.maxDailyCalls || initialSettings.daily_call_limit || 600}
          initialTargetTime={initialSettings.target_time_military || null}
          maxCallsAllowed={subscriptionFeatures?.maxDailyCalls || 600}
          subscriptionTier={subscriptionFeatures?.tier === 'none' ? null : (subscriptionFeatures?.tier as 'starter' | 'pro' | 'elite' | null)}
          onClose={() => setShowLaunchModal(false)}
          onLaunched={handleLaunched}
        />
      )}

      {/* Low Balance Warning Modal */}
      {showLowBalanceWarning && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-[#1A2647] to-[#0B1437] rounded-xl md:rounded-2xl border-2 border-red-500/40 max-w-lg w-full shadow-2xl shadow-red-500/20 animate-in fade-in zoom-in duration-300 max-h-[95vh] overflow-y-auto">
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-gray-800/50 text-center">
              <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 mb-2 md:mb-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-red-500/20 flex items-center justify-center border-2 border-red-500/50 animate-pulse">
                  <Activity className="w-5 h-5 md:w-6 md:h-6 text-red-400" />
                </div>
                <h2 className="text-lg md:text-2xl font-bold text-white">⚠️ Low Balance Warning</h2>
              </div>
              <p className="text-gray-400 text-xs md:text-sm">Insufficient funds to launch AI</p>
            </div>

            {/* Warning Content */}
            <div className="p-4 md:p-6 space-y-3 md:space-y-4">
              <div className="bg-red-950/30 border-2 border-red-500/30 rounded-lg md:rounded-xl p-4 md:p-5">
                <p className="text-red-300 font-semibold mb-2 md:mb-3 text-base md:text-lg text-center">
                  {currentBalance <= 0 
                    ? '💳 Your Call Balance is $0' 
                    : `💳 Balance Too Low: $${currentBalance.toFixed(2)}`}
                </p>
                <p className="text-gray-300 text-xs md:text-sm leading-relaxed mb-3 md:mb-4 text-center">
                  You need at least <strong className="text-white">$10.00</strong> in your call balance to launch the AI calling agent.
                </p>
                <div className="bg-[#0B1437]/50 rounded-lg p-3 md:p-4 border border-red-500/20">
                  <p className="text-white font-bold mb-1 text-xs md:text-base text-center">Current Balance:</p>
                  <p className="text-2xl md:text-3xl font-bold text-red-400 text-center">
                    ${currentBalance.toFixed(3)}
                  </p>
                  <p className="text-[10px] md:text-xs text-gray-400 mt-2 text-center">
                    Minimum required: $10.00
                  </p>
                </div>
              </div>

              <div className="bg-blue-950/20 border border-blue-500/20 rounded-lg p-3 md:p-4">
                <p className="text-blue-300 text-xs md:text-sm text-center">
                  💡 <strong>Quick Tip:</strong> Add funds to your call balance to get started. You can set up auto-refill to avoid interruptions.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 md:p-6 border-t border-gray-800/50 flex flex-col md:flex-row gap-2 md:gap-3">
              <button
                onClick={() => setShowLowBalanceWarning(false)}
                className="px-4 md:px-6 py-2.5 md:py-3 border border-gray-700 bg-transparent text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200 font-medium text-sm md:text-base"
              >
                Cancel
              </button>
              <a
                href="/dashboard/settings/call-balance"
                className="flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/40 flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <span>Add Funds Now</span>
                <Rocket className="w-4 h-4 md:w-5 md:h-5" />
              </a>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}

