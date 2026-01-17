import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AIDialerControl } from '@/components/ai-dialer-control';
import { SubscriptionEnded } from '@/components/subscription-ended';
import { Clock, Wrench } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SterlingDialerPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signup');
  }

  // Check AI setup status and subscription status
  const { data: profile } = await supabase
    .from('profiles')
    .select('ai_maintenance_mode, has_active_subscription, subscription_tier, free_trial_ends_at, is_vip')
    .eq('user_id', user.id)
    .single();

  const isBlocked = profile?.ai_maintenance_mode === true;
  const isVIP = profile?.is_vip === true;
  
  // 🚨 ONLY BLOCK IF WE'RE SURE SUBSCRIPTION ENDED
  // Don't block new users waiting for webhook to process!
  const subscriptionExplicitlyEnded = profile?.subscription_tier === 'none' && 
                                       profile?.has_active_subscription === false;
  
  const wasFreeTrial = profile?.subscription_tier === 'none' && profile?.free_trial_ends_at;

  console.log('🎯 Sterling Dialer Access Check:', { 
    userId: user.id, 
    ai_maintenance_mode: profile?.ai_maintenance_mode,
    subscription_tier: profile?.subscription_tier,
    has_active_subscription: profile?.has_active_subscription,
    is_vip: isVIP,
    subscriptionExplicitlyEnded,
    isBlocked 
  });

  // 🔒 ONLY BLOCK if subscription explicitly ended (not new users!)
  // New users: Allow access (webhook will process)
  // Existing users with ended subscription: Block
  if (subscriptionExplicitlyEnded && !isVIP) {
    console.log('🔒 Subscription ended - blocking Sterling Dialer access');
    return <SubscriptionEnded 
      wasFreeTrial={wasFreeTrial} 
      endDate={profile?.free_trial_ends_at} 
    />;
  }
  
  if (isVIP) {
    console.log('👑 VIP user detected - granting full access');
  }

  // If admin blocked access, show maintenance message
  if (isBlocked) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto text-center pt-7 md:pt-7">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-500/20 rounded-full mb-6 border-2 border-blue-500/50 shadow-lg shadow-blue-500/20">
            <Wrench className="w-12 h-12 text-blue-400 animate-pulse" />
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            AI Agent in Maintenance
          </h1>

          {/* Message */}
          <p className="text-xl text-gray-300 mb-8">
            We're either setting up your AI agent or upgrading so hold on tight!
          </p>

          <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-2 border-blue-500/30 rounded-2xl p-8 mb-8 shadow-xl shadow-blue-500/10">
            <div className="flex flex-col items-center text-center">
              <Clock className="w-16 h-16 text-blue-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-3">Temporary Downtime</h3>
              <p className="text-lg text-gray-300 mb-4">
                Your Sterling Dialer is currently unavailable due to maintenance or upgrades
              </p>
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-500/20 border border-blue-500/40 rounded-full">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-blue-300 font-bold text-lg">Work in Progress</span>
              </div>
              <p className="text-sm text-gray-400 mt-6">
                We'll notify you once everything is back online and ready to go!
              </p>
            </div>
          </div>

          <p className="text-gray-400 text-center text-sm">
            💡 Check back soon or contact support if you need immediate assistance
          </p>
        </div>
      </div>
    );
  }

  // AI is ready - show the normal dialer control
  return <AIDialerControl userId={user.id} />;
}
