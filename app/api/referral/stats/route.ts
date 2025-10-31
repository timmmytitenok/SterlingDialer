import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all referrals made by this user
    const { data: referrals, error } = await supabase
      .from('referrals')
      .select(`
        id,
        referee_id,
        referral_code,
        status,
        credit_amount,
        created_at,
        completed_at,
        credited_at
      `)
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching referrals:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get referee profile information
    const referralsWithProfiles = await Promise.all(
      (referrals || []).map(async (ref) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, created_at')
          .eq('user_id', ref.referee_id)
          .single();

        return {
          ...ref,
          referee: {
            name: profile?.full_name || 'User',
            signupDate: profile?.created_at || ref.created_at
          }
        };
      })
    );

    // Calculate stats
    // Total referrals = only completed ones (who actually subscribed)
    const completedReferrals = referralsWithProfiles.filter(
      r => r.status === 'completed' || r.status === 'credited'
    ).length;
    const totalReferrals = completedReferrals; // Only count completed
    const pendingReferrals = referralsWithProfiles.filter(
      r => r.status === 'pending'
    ).length;
    const totalCreditsEarned = referralsWithProfiles
      .filter(r => r.status === 'credited')
      .reduce((sum, r) => sum + parseFloat(r.credit_amount.toString()), 0);

    return NextResponse.json({
      totalReferrals,
      completedReferrals,
      pendingReferrals,
      totalCreditsEarned,
      referrals: referralsWithProfiles
    });
  } catch (error: any) {
    console.error('Get referral stats error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

