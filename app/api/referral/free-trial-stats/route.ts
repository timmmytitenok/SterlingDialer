import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the actual domain from request headers
    const headersList = headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    
    // Generate referral link with actual domain
    const referralLink = `${protocol}://${host}/login?ref=${user.id}`;

    // Get all referrals made by this user
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });

    if (referralsError) {
      console.error('Error fetching referrals:', referralsError);
      return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 });
    }

    // Count completed referrals (valid sign-ups with email verified + payment method)
    const completedReferrals = referrals?.filter(r => r.status === 'completed') || [];
    const totalValidReferrals = completedReferrals.length;

    // Calculate total days earned (7 days per referral, max 4 referrals = 28 days)
    const totalDaysEarned = Math.min(totalValidReferrals * 7, 28);

    return NextResponse.json({
      success: true,
      referralLink,
      totalValidReferrals,
      totalDaysEarned,
      referrals: referrals || [],
    });
  } catch (error: any) {
    console.error('Error in free-trial-stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

