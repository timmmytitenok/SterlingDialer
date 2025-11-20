import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AffiliateEarningsClient } from '@/components/affiliate-earnings-client';

export const dynamic = 'force-dynamic';

export default async function AffiliateEarningsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signup');
  }

  // Get user profile to check if they're an affiliate
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const isAffiliate = profile?.is_affiliate_partner || false;
  const affiliateCode = profile?.affiliate_code || profile?.referral_code || null;

  return (
    <AffiliateEarningsClient 
      isAffiliate={isAffiliate}
      affiliateCode={affiliateCode}
    />
  );
}

