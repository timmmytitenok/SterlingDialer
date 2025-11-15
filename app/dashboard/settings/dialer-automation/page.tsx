import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AutomationSettingsSimple } from '@/components/automation-settings-simple';

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

  return (
    <div className="min-h-screen bg-[#0B1437]">
      <main className="container mx-auto px-4 lg:px-8 py-8">
        <AutomationSettingsSimple userId={user.id} initialSettings={settings} />
      </main>
    </div>
  );
}

