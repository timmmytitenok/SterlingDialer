import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AutomationSettingsRefactored } from '@/components/automation-settings-refactored';
import { SubscriptionEnded } from '@/components/subscription-ended';

export const dynamic = 'force-dynamic';

export default async function DialerAutomationPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signup');
  }

  // 🔒 CHECK SUBSCRIPTION STATUS FIRST
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('has_active_subscription, subscription_tier, free_trial_ends_at, is_vip')
    .eq('user_id', user.id)
    .single();

  const isVIP = userProfile?.is_vip === true;
  
  // 🚨 ONLY BLOCK IF WE'RE SURE SUBSCRIPTION ENDED
  // Don't block new users waiting for webhook to process!
  const subscriptionExplicitlyEnded = userProfile?.subscription_tier === 'none' && 
                                       userProfile?.has_active_subscription === false;
  
  const wasFreeTrial = userProfile?.subscription_tier === 'none' && userProfile?.free_trial_ends_at;

  // 🔒 ONLY BLOCK if subscription explicitly ended (not new users!)
  if (subscriptionExplicitlyEnded && !isVIP) {
    console.log('🔒 Subscription ended - blocking Auto Schedule access');
    return <SubscriptionEnded 
      wasFreeTrial={wasFreeTrial} 
      endDate={userProfile?.free_trial_ends_at} 
    />;
  }
  
  if (isVIP) {
    console.log('👑 VIP user detected - granting full access to Auto Schedule');
  }

  // Mark Step 4 complete just by visiting this page
  await supabase
    .from('profiles')
    .update({ onboarding_step_4_schedule: true })
    .eq('user_id', user.id);

  console.log('✅ Onboarding Step 4 (Dialer) marked complete - user visited the page');

  // Check if all onboarding steps are now complete
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_step_1_form, onboarding_step_2_balance, onboarding_step_3_sheet, onboarding_step_4_schedule')
    .eq('user_id', user.id)
    .single();

  const allComplete = profile?.onboarding_step_1_form &&
                      profile?.onboarding_step_2_balance &&
                      profile?.onboarding_step_3_sheet &&
                      profile?.onboarding_step_4_schedule;

  if (allComplete) {
    console.log('🎉 All onboarding steps complete! Hiding Quick Setup forever.');
    
    await supabase
      .from('profiles')
      .update({
        onboarding_all_complete: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);
  }

  // Get dialer settings
  const { data: settings } = await supabase
    .from('dialer_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Convert database format to component format
  const convertedSettings = settings ? {
    schedule_enabled: settings.auto_start_enabled,
    schedule_time: settings.auto_start_time,
    schedule_days: settings.auto_start_days?.map((day: string) => {
      const dayMap: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
      return dayMap[day.toLowerCase()];
    }).filter((d: number) => d !== undefined) || [1, 2, 3, 4, 5],
    daily_spend_limit: Math.round((settings.daily_budget_cents || 2500) / 100),
  } : null;

  return <AutomationSettingsRefactored userId={user.id} initialSettings={convertedSettings} />;
}

