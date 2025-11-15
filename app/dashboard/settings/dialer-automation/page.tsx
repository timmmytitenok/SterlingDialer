import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DialerAutomationForm } from '@/components/dialer-automation-form';

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

  return <DialerAutomationForm userId={user.id} initialSettings={settings} />;
}

