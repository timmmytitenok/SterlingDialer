import { createClient } from '@/lib/supabase/server';
import { SettingsLayoutClient } from './layout-client';

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let subscriptionTier = 'none';
  let isAffiliate = false;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, is_affiliate_partner')
      .eq('user_id', user.id)
      .single();

    subscriptionTier = profile?.subscription_tier || 'none';
    isAffiliate = profile?.is_affiliate_partner || false;
  }

  return (
    <SettingsLayoutClient
      initialSubscriptionTier={subscriptionTier}
      initialIsAffiliate={isAffiliate}
    >
      {children}
    </SettingsLayoutClient>
  );
}

