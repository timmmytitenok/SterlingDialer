'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { WelcomeModal } from '@/components/welcome-modal';
import { CheckCircle, Circle, ArrowRight, FileText, Wallet, Sheet, Settings, Loader2, Zap, Monitor } from 'lucide-react';

export default function OnboardingStepsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const [showWelcome, setShowWelcome] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();

    // Reload profile when user returns to this page/tab (to check if steps are now complete)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Page visible again, checking onboarding status...');
        loadUser();
      }
    };

    const handleFocus = () => {
      console.log('🔄 Window focused, checking onboarding status...');
      loadUser();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/signup');
      return;
    }

    setUser(user);

    // Get profile with onboarding status
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    setProfile(profile);

    // Check if all steps are complete
    if (profile?.onboarding_all_complete) {
      router.push('/dashboard');
      return;
    }

    // Show welcome modal if coming from trial activation
    if (searchParams.get('trial_activated') === 'true') {
      setShowWelcome(true);
    }

    setLoading(false);
  };

  const markStepComplete = async (step: number) => {
    await fetch('/api/onboarding/mark-step-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step }),
    });

    // Reload profile
    loadUser();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1437] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  const steps = [
    {
      number: 1,
      title: 'Configure Your AI Agent',
      description: 'Add your business details and setup Cal.AI',
      icon: FileText,
      completed: profile?.onboarding_step_1_form,
      action: () => router.push('/onboarding/form'),
      buttonText: 'Complete Form',
    },
    {
      number: 2,
      title: 'Fund Your Call Balance',
      description: 'Add funds and enable auto-refill to keep calls running without interruption.',
      icon: Wallet,
      completed: profile?.onboarding_step_2_balance,
      action: () => router.push('/dashboard/settings/balance'),
      buttonText: 'Set Up Balance',
    },
    {
      number: 3,
      title: 'Connect Your Lead Sheet',
      description: 'Upload or link your Google Sheet to sync your lead list.',
      icon: Sheet,
      completed: profile?.onboarding_step_3_sheet,
      action: () => router.push('/dashboard/leads'),
      buttonText: 'Upload Sheet',
    },
    {
      number: 4,
      title: 'Enable Auto-Schedule (Optional)',
      description: 'Choose calling hours and daily budget for automated dialing.',
      icon: Settings,
      completed: profile?.onboarding_step_4_schedule,
      action: () => router.push('/dashboard/settings/dialer-automation'),
      buttonText: 'Configure Dialer',
    },
  ];

  const completedSteps = steps.filter(s => s.completed).length;
  const progress = (completedSteps / steps.length) * 100;

  return (
    <>
      {/* Welcome Modal */}
      {showWelcome && (
        <WelcomeModal
          userName={profile?.full_name || user?.email?.split('@')[0] || 'there'}
          onContinue={() => setShowWelcome(false)}
        />
      )}

      {/* Animated Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-8 relative z-10">
        <div className="max-w-3xl mx-auto">
          {/* Mobile-Only Message */}
          <div className="md:hidden flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-blue-500/20">
              <Monitor className="w-12 h-12 text-blue-400" />
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-4">
              Desktop Required
            </h1>
            
            <p className="text-1lg text-gray-300 mb-2 leading-relaxed">
              Head over to <span className="text-blue-400 font-semibold">desktop</span> to complete setup
            </p>
            <p className="text-lg text-gray-300 leading-relaxed">
              so you can start using <span className="text-purple-400 font-semibold">AI</span>!
            </p>
            
            <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-sm text-blue-300">
                💡 The setup process requires a larger screen for the best experience
              </p>
            </div>
          </div>

          {/* Desktop-Only Content */}
          <div className="hidden md:block">
            {/* Header */}
            <div className="text-center mb-10">
              {/* Animated Pill Badge */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-full mb-6 shadow-lg shadow-purple-500/20 animate-pulse" style={{ animationDuration: '3s' }}>
                <Zap className="w-5 h-5 text-purple-400" />
                <span className="text-purple-300 font-bold text-sm tracking-wide">QUICK SETUP</span>
                <span className="text-purple-400">⚡</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-5">
                <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                  Let's Get You Started
                </span>
              </h1>
              
              <p className="text-gray-300 text-xl max-w-lg mx-auto">
                Complete these <span className="text-purple-400 font-semibold">4 quick steps</span> to activate your AI agent
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-5">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.number}
                    className={`relative bg-gradient-to-br from-[#1A2647]/90 to-[#0F1629]/90 backdrop-blur-sm rounded-2xl p-6 border-2 transition-all duration-500 group ${
                      step.completed
                        ? 'border-green-500/50 shadow-xl shadow-green-500/20'
                        : 'border-gray-700/50 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-1'
                    }`}
                    style={{ 
                      animation: `fadeInUp 0.6s ease-out forwards`,
                      animationDelay: `${idx * 0.1}s`
                    }}
                  >
                    {/* Glow effect on hover */}
                    {!step.completed && (
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-blue-500/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    )}
                    
                    <div className="flex items-start gap-5 relative z-10">
                      {/* Step Number/Icon */}
                      <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                        step.completed
                          ? 'bg-gradient-to-br from-green-500/30 to-emerald-600/20 shadow-lg shadow-green-500/30'
                          : 'bg-gradient-to-br from-purple-500/30 to-blue-600/20 group-hover:shadow-lg group-hover:shadow-purple-500/30'
                      }`}>
                        {step.completed ? (
                          <CheckCircle className="w-8 h-8 text-green-400" />
                        ) : (
                          <Icon className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform duration-300" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-purple-100 transition-colors">
                              Step {step.number}: {step.title}
                            </h3>
                            <p className="text-gray-400 text-sm">{step.description}</p>
                          </div>
                          
                          {step.completed && (
                            <span className="px-4 py-1.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/40 shadow-lg shadow-green-500/20">
                              ✓ Complete
                            </span>
                          )}
                        </div>

                        {!step.completed && (
                          <button
                            onClick={step.action}
                            className="mt-4 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 group/btn"
                          >
                            {step.buttonText}
                            <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Completion message when all done */}
            {completedSteps === steps.length && (
              <div className="mt-8 text-center p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl shadow-xl shadow-green-500/20">
                <div className="text-4xl mb-3">🎉</div>
                <h3 className="text-2xl font-bold text-green-400 mb-2">All Steps Complete!</h3>
                <p className="text-gray-300">You're all set to start using Sterling AI</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Animation Keyframes */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}

