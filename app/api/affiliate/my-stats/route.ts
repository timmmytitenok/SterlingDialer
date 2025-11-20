import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is an affiliate
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_affiliate_partner, affiliate_code')
      .eq('user_id', user.id)
      .single();

    if (!profile?.is_affiliate_partner) {
      return NextResponse.json({ error: 'Not an affiliate partner' }, { status: 403 });
    }

    // Get all referrals made by this user
    const { data: referrals } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id);

    const totalReferrals = referrals?.length || 0;
    const inTrial = referrals?.filter(r => r.conversion_status === 'trial').length || 0;
    const converted = referrals?.filter(r => r.conversion_status === 'converted').length || 0;
    const cancelled = referrals?.filter(r => r.conversion_status === 'cancelled').length || 0;

    // Get commission payouts
    const { data: payouts } = await supabase
      .from('commission_payouts')
      .select('*')
      .eq('referrer_id', user.id)
      .order('month', { ascending: false });

    const currentMonth = new Date().toISOString().substring(0, 7);
    
    const pendingThisMonth = (payouts || [])
      .filter(p => p.month === currentMonth && p.status === 'pending')
      .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

    const totalPaid = (payouts || [])
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

    const totalEarned = (payouts || [])
      .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

    const paymentHistory = (payouts || [])
      .filter(p => p.status === 'paid')
      .map(p => ({
        month: p.month,
        amount: parseFloat(p.amount.toString()),
        paidAt: p.paid_at,
        method: p.paid_via || 'Manual',
      }));

    // Get detailed referral information
    const referralDetails = await Promise.all(
      (referrals || []).map(async (referral) => {
        // Get referee's profile
        const { data: refereeProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', referral.referee_id)
          .single();

        // Get referee's email
        const { data: authUser } = await supabase.auth.admin.getUserById(referral.referee_id);

        return {
          name: refereeProfile?.full_name || 'Unknown User',
          email: authUser?.user?.email || 'No email',
          status: referral.conversion_status || 'trial',
          signupDate: referral.created_at,
          convertedDate: referral.converted_at,
        };
      })
    );

    return NextResponse.json({
      success: true,
      stats: {
        totalReferrals,
        inTrial,
        converted,
        cancelled,
        pendingThisMonth,
        totalEarned,
        totalPaid,
        paymentHistory,
        referralDetails,
      },
    });

  } catch (error: any) {
    console.error('Error fetching affiliate stats:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

