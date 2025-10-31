import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get profile info
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, referred_by, full_name')
      .eq('user_id', user.id)
      .single();

    // Get referral info
    const { data: referral } = await supabase
      .from('referrals')
      .select('*')
      .eq('referee_id', user.id)
      .single();

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      profile: profile,
      referral: referral,
      hasReferral: profile?.referred_by ? true : false,
      shouldGetDiscount: profile?.referred_by ? 'YES - 30% discount should apply!' : 'NO - No referral code found'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

