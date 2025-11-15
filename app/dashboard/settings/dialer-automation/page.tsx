import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AutomationSettingsRefactored } from '@/components/automation-settings-refactored';

export const dynamic = 'force-dynamic';

export default async function DialerAutomationPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
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

