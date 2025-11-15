import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AIDialerControl } from '@/components/ai-dialer-control';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AIDialerPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Note: The AIDialerControl component fetches its own status via API
  // This keeps the page simple and allows real-time updates
  return <AIDialerControl userId={user.id} />;
}
