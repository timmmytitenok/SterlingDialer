import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LeadsSettingsManager } from '@/components/leads-settings-manager';

export const dynamic = 'force-dynamic';

export default async function LeadsSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signup');
  }

  return <LeadsSettingsManager userId={user.id} />;
}

