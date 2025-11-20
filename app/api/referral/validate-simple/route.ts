import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  console.log('=== REFERRAL VALIDATION START ===');
  
  try {
    // Parse request
    const body = await req.json();
    const { code, newUserId } = body;
    
    console.log('Code:', code);
    console.log('User ID:', newUserId);
    
    if (!code || !newUserId) {
      return NextResponse.json({ 
        error: 'Missing code or newUserId' 
      }, { status: 400 });
    }

    // Create supabase client
    const supabase = createServiceRoleClient();
    console.log('Supabase client created');

    // Find referral code
    const { data: referralCodeData, error: codeError } = await supabase
      .from('referral_codes')
      .select('user_id')
      .eq('code', code.toUpperCase())
      .maybeSingle();

    console.log('Referral code lookup:', { referralCodeData, codeError });

    if (codeError) {
      return NextResponse.json({ 
        error: 'Database error looking up code',
        details: codeError.message 
      }, { status: 500 });
    }

    if (!referralCodeData) {
      return NextResponse.json({ 
        error: 'Invalid referral code' 
      }, { status: 404 });
    }

    // Check self-referral
    if (referralCodeData.user_id === newUserId) {
      return NextResponse.json({ 
        error: 'Cannot use your own referral code' 
      }, { status: 400 });
    }

    // Create referral record
    const { data: referral, error: insertError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referralCodeData.user_id,
        referee_id: newUserId,
        referral_code: code.toUpperCase(),
        status: 'completed', // Referral relationship is established
        conversion_status: 'trial' // They're in free trial, not yet paid
      })
      .select()
      .single();

    console.log('Referral insert:', { referral, insertError });

    if (insertError) {
      return NextResponse.json({ 
        error: 'Failed to create referral',
        details: insertError.message 
      }, { status: 500 });
    }

    // Update profile
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({ referred_by: code.toUpperCase() })
      .eq('user_id', newUserId)
      .select()
      .maybeSingle();

    console.log('Profile update:', { profile, updateError });

    if (updateError) {
      console.error('Profile update error but continuing:', updateError);
    }

    console.log('=== REFERRAL VALIDATION SUCCESS ===');
    
    return NextResponse.json({ 
      success: true,
      message: 'Referral validated successfully',
      profileUpdated: !!profile
    });

  } catch (error: any) {
    console.error('=== REFERRAL VALIDATION ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    
    return NextResponse.json({ 
      error: 'Server error',
      message: error.message
    }, { status: 500 });
  }
}

