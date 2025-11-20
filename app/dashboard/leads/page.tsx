import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LeadManagerRedesigned } from '@/components/lead-manager-redesigned';

export default async function LeadsPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signup');
  }

  return <LeadManagerRedesigned userId={user.id} />;
}

