import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AIControlCenterV2 } from '@/components/ai-control-center-v2';
import { getSubscriptionFeatures } from '@/lib/subscription-helpers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AIControlPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get AI control settings
  const { data: aiSettings } = await supabase
    .from('ai_control_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // If no settings exist, create default
  if (!aiSettings) {
    await supabase
      .from('ai_control_settings')
      .insert([{ user_id: user.id }]);
  }

  const settings = aiSettings || {
    status: 'stopped',
    daily_call_limit: 600,
    auto_transfer_calls: true,
  };

  // Get subscription features and tier
  const subscriptionFeatures = await getSubscriptionFeatures(user.id);

  // Get AI setup status and onboarding status from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('ai_setup_status, setup_requested_at, onboarding_completed')
    .eq('user_id', user.id)
    .single();

  const aiSetupStatus = profile?.ai_setup_status || 'ready';
  const setupRequestedAt = profile?.setup_requested_at;
  const onboardingCompleted = profile?.onboarding_completed || false;

  return (
    <AIControlCenterV2 
      userId={user.id} 
      initialSettings={settings} 
      hasSubscription={subscriptionFeatures.hasActiveSubscription}
      subscriptionFeatures={subscriptionFeatures}
      aiSetupStatus={aiSetupStatus}
      setupRequestedAt={setupRequestedAt}
      onboardingCompleted={onboardingCompleted}
    />
  );
}
