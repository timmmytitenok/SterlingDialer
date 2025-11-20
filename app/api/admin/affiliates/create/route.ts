import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

export async function POST(req: Request) {
  try {
    const adminMode = await isAdminMode();
    
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId, code } = await req.json();

    if (!userId || !code) {
      return NextResponse.json({ error: 'User ID and code required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Verify user exists
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found with that ID' }, { status: 404 });
    }

    // Check if code already exists
    const { data: existingCode } = await supabase
      .from('profiles')
      .select('affiliate_code')
      .eq('affiliate_code', code)
      .maybeSingle();

    if (existingCode) {
      return NextResponse.json({ error: 'Affiliate code already in use' }, { status: 400 });
    }

    // Update user's profile to make them an affiliate
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        is_affiliate_partner: true,
        affiliate_code: code,
        referral_code: code, // Also set as their referral code
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // IMPORTANT: Also add the code to referral_codes table so validation can find it
    const { error: codeError } = await supabase
      .from('referral_codes')
      .upsert({
        user_id: userId,
        code: code.toUpperCase(),
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (codeError) {
      console.error('Error adding referral code:', codeError);
      // Continue anyway - the profile is already updated
    }

    return NextResponse.json({ 
      success: true,
      userId: userId,
      code,
    });

  } catch (error: any) {
    console.error('Error creating affiliate:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

