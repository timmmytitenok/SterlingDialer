import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileForm } from '@/components/profile-form';

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile with all fields
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone_number, company_name, ai_setup_status, setup_requested_at')
    .eq('user_id', user.id)
    .single();

  return <ProfileForm user={user} profile={profile} />;
}

