import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

export async function GET() {
  try {
    const adminMode = await isAdminMode();
    
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabase = createServiceRoleClient();
    const currentMonth = new Date().toISOString().substring(0, 7); // '2025-11'

    // Get all affiliate partners (users with is_affiliate_partner = true)
    const { data: affiliateProfiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, affiliate_code')
      .eq('is_affiliate_partner', true);

    if (!affiliateProfiles || affiliateProfiles.length === 0) {
      return NextResponse.json({
        success: true,
        affiliates: [],
        summary: {
          totalAffiliates: 0,
          totalActiveReferrals: 0,
          pendingThisMonth: 0,
          totalPaidAllTime: 0,
        },
        currentMonth,
      });
    }

    const uniqueReferrerIds = affiliateProfiles.map((p: any) => p.user_id);

    // Get detailed data for each affiliate
    const affiliates = await Promise.all(
      uniqueReferrerIds.map(async (referrerId) => {
        // Get referrer profile and email
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', referrerId)
          .single();

        if (profileError) {
          console.error('Error fetching profile for', referrerId, ':', profileError);
        }

        const { data: authUser } = await supabase.auth.admin.getUserById(referrerId);

        // Get all referrals by this person
        const { data: allReferrals } = await supabase
          .from('referrals')
          .select(`
            id,
            referee_id,
            referral_code,
            status,
            created_at
          `)
          .eq('referrer_id', referrerId);

        // Count active referrals (users with active subscriptions)
        let activeCount = 0;
        if (allReferrals) {
          for (const ref of allReferrals) {
            const { data: sub } = await supabase
              .from('subscriptions')
              .select('status')
              .eq('user_id', ref.referee_id)
              .eq('status', 'active')
              .maybeSingle();
            
            if (sub) activeCount++;
          }
        }

        // Get commission payouts
        const { data: payouts } = await supabase
          .from('commission_payouts')
          .select('*')
          .eq('referrer_id', referrerId)
          .order('created_at', { ascending: false });

        // Get ALL pending (not just this month)
        const pendingTotal = (payouts || [])
          .filter(p => p.status === 'pending')
          .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

        const totalPaid = (payouts || [])
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

        const totalEarned = (payouts || [])
          .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

        return {
          id: referrerId,
          name: profile?.full_name || authUser?.user.email?.split('@')[0] || 'Unknown User',
          email: authUser?.user.email || 'No email',
          totalReferrals: allReferrals?.length || 0,
          activeReferrals: activeCount,
          pending: pendingTotal, // Changed from pendingThisMonth
          totalPaid,
          totalEarned,
          lastPayoutAt: payouts?.find(p => p.status === 'paid')?.paid_at || null,
        };
      })
    );

    // Calculate summary
    const summary = {
      totalAffiliates: affiliates.length,
      totalActiveReferrals: affiliates.reduce((sum, a) => sum + a.activeReferrals, 0),
      pendingThisMonth: affiliates.reduce((sum, a) => sum + a.pending, 0), // Use pending instead
      totalPaidAllTime: affiliates.reduce((sum, a) => sum + a.totalPaid, 0),
    };

    return NextResponse.json({
      success: true,
      affiliates,
      summary,
      currentMonth,
    });

  } catch (error: any) {
    console.error('❌ Error fetching affiliate stats:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

