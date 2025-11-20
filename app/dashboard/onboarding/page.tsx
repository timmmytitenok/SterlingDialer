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

      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Mobile-Only Message */}
          <div className="md:hidden flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-blue-500/20">
              <Monitor className="w-12 h-12 text-blue-400" />
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-4">
              Desktop Required
            </h1>
            
            <p className="text-lg text-gray-300 mb-2 leading-relaxed">
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
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-4">
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400 font-semibold text-sm">Quick Setup</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Let's Get You Started
              </h1>
              
              <p className="text-gray-300 text-lg mb-6">
                Complete these 4 steps to activate your AI calling agent
              </p>

              {/* Progress Bar */}
              <div className="max-w-md mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Progress</span>
                  <span className="text-sm font-bold text-purple-400">{completedSteps} of {steps.length} complete</span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-4">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.number}
                    className={`bg-gradient-to-br from-[#1A2647] to-[#0F1629] rounded-2xl p-6 border-2 transition-all duration-300 ${
                      step.completed
                        ? 'border-green-500/50 shadow-lg shadow-green-500/20'
                        : 'border-gray-700/50 hover:border-purple-500/50 hover:shadow-lg'
                    }`}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Step Number/Icon */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                        step.completed
                          ? 'bg-green-500/20'
                          : 'bg-purple-500/20'
                      }`}>
                        {step.completed ? (
                          <CheckCircle className="w-7 h-7 text-green-400" />
                        ) : (
                          <Icon className="w-7 h-7 text-purple-400" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-bold text-white mb-1">
                              Step {step.number}: {step.title}
                            </h3>
                            <p className="text-gray-400 text-sm">{step.description}</p>
                          </div>
                          
                          {step.completed && (
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30">
                              ✓ Complete
                            </span>
                          )}
                        </div>

                        {!step.completed && (
                          <button
                            onClick={step.action}
                            className="mt-3 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-lg transition-all hover:scale-105 shadow-lg"
                          >
                            {step.buttonText}
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

