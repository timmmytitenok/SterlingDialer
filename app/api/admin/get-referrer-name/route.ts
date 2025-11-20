import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

export async function GET(req: Request) {
  try {
    const adminMode = await isAdminMode();
    
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Code required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Find the referral code owner
    const { data: referralCode } = await supabase
      .from('referral_codes')
      .select('user_id')
      .eq('code', code.toUpperCase())
      .single();

    if (!referralCode) {
      return NextResponse.json({ name: 'Unknown (Code not found)' });
    }

    // Get the owner's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', referralCode.user_id)
      .single();

    return NextResponse.json({ 
      name: profile?.full_name || 'Unknown User',
      userId: referralCode.user_id
    });

  } catch (error: any) {
    console.error('Error fetching referrer name:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

