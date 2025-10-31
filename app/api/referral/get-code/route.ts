import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get referral code
    const { data: referralCode, error } = await supabase
      .from('referral_codes')
      .select('code')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching referral code:', error);
      return NextResponse.json({ 
        error: 'Error fetching referral code. Please try again.' 
      }, { status: 500 });
    }

    if (!referralCode) {
      // User hasn't created a code yet - this is normal
      return NextResponse.json({ 
        hasCode: false,
        code: null,
        link: null
      }, { status: 200 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const referralLink = `${baseUrl}/signup?ref=${referralCode.code}`;

    return NextResponse.json({ 
      hasCode: true,
      code: referralCode.code,
      link: referralLink
    });
  } catch (error: any) {
    console.error('Get referral code error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

