import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  console.log('🔵 Referral validation API called');
  try {
    const body = await req.json();
    console.log('📦 Request body:', body);
    const { code, newUserId } = body;
    
    console.log(`📥 Received validation request: code=${code}, userId=${newUserId}`);
    
    if (!code || !newUserId) {
      console.error('❌ Missing parameters:', { code, newUserId });
      return NextResponse.json({ 
        error: 'Missing parameters',
        details: 'Both code and newUserId are required' 
      }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    console.log('✅ Service role client created');

    console.log(`🎯 Validating referral code: ${code} for new user: ${newUserId}`);

    // Find referral code and get referrer
    const { data: referralCode, error: codeError } = await supabase
      .from('referral_codes')
      .select('user_id')
      .eq('code', code.toUpperCase())
      .single();

    if (codeError) {
      console.error('❌ Database error looking up referral code:', codeError);
      console.error('Error details:', JSON.stringify(codeError, null, 2));
      
      // Check if table exists
      if (codeError.message?.includes('relation') && codeError.message?.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Database not set up',
          details: 'Please run schema-v14-referrals.sql in your Supabase SQL Editor'
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        error: 'Database error',
        details: codeError.message 
      }, { status: 500 });
    }

    if (!referralCode) {
      console.log('❌ Referral code not found in database:', code);
      return NextResponse.json({ 
        error: 'Invalid referral code',
        details: 'This code does not exist. Please check the code and try again.'
      }, { status: 404 });
    }

    console.log('✅ Found referral code for referrer:', referralCode.user_id);

    // Check if user is trying to refer themselves
    if (referralCode.user_id === newUserId) {
      console.log('❌ User cannot refer themselves');
      return NextResponse.json({ 
        error: 'Cannot use your own referral code',
        details: 'You cannot refer yourself'
      }, { status: 400 });
    }

    // Check if referee already has a referrer
    const { data: existingReferral, error: checkError } = await supabase
      .from('referrals')
      .select('id')
      .eq('referee_id', newUserId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found (which is good)
      console.error('❌ Error checking existing referral:', checkError);
    }

    if (existingReferral) {
      console.log('❌ User already referred');
      return NextResponse.json({ 
        error: 'User already referred',
        details: 'This user has already been referred by someone else'
      }, { status: 400 });
    }

    console.log('📝 Creating referral record...');

    // Create referral record
    const { data: insertedReferral, error: insertError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referralCode.user_id,
        referee_id: newUserId,
        referral_code: code.toUpperCase(),
        status: 'completed', // Referral relationship is established
        conversion_status: 'trial' // They're in free trial, not yet paid
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error creating referral:', insertError);
      console.error('Insert error details:', JSON.stringify(insertError, null, 2));
      return NextResponse.json({ 
        error: 'Failed to create referral',
        details: insertError.message 
      }, { status: 500 });
    }

    console.log('✅ Referral record created:', insertedReferral.id);

    // Update profile with referral code - CRITICAL for 30% discount!
    console.log('📝 Updating profile with referral code...');
    
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ referred_by: code.toUpperCase() })
      .eq('user_id', newUserId)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error('❌ Error updating profile:', updateError);
      // Don't fail - continue anyway
      console.warn('⚠️ Continuing despite profile update error');
    } else if (updatedProfile) {
      console.log('✅ Profile updated with referral code');
      console.log('✅ User WILL receive 30% discount on first subscription!');
    } else {
      console.warn('⚠️ Profile not found, but continuing');
    }

    console.log(`✅ Referral validated and tracked for user ${newUserId}`);
    console.log(`   Referrer: ${referralCode.user_id}`);
    console.log(`   Referee: ${newUserId}`);
    console.log(`   Code: ${code.toUpperCase()}`);
    console.log(`   Status: pending`);

    return NextResponse.json({ 
      success: true,
      referralId: insertedReferral.id,
      message: 'Referral successfully validated and tracked'
    });
  } catch (error: any) {
    console.error('❌❌❌ CRITICAL ERROR in validate API:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Validation failed', 
      message: error.message,
      details: error.stack 
    }, { status: 500 });
  }
}

