import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * Creates a referral entry when someone signs up through a referral link
 * URL format: /login?ref=USER_ID
 */
export async function POST(req: Request) {
  console.log('📥 Referral API called');
  
  try {
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return NextResponse.json({ 
        error: 'Invalid request body',
        details: 'Could not parse JSON'
      }, { status: 400 });
    }

    const { referrerId, refereeId, refereeEmail } = body;

    console.log('🎁 Creating referral:', { referrerId, refereeId, refereeEmail });

    if (!referrerId || !refereeId) {
      console.error('❌ Missing parameters');
      return NextResponse.json({ 
        error: 'Missing referrer or referee ID' 
      }, { status: 400 });
    }

    // Use service role client to bypass RLS
    let supabase;
    try {
      supabase = createServiceRoleClient();
      console.log('✅ Using service role client');
    } catch (clientError: any) {
      console.error('❌ Failed to create service role client:', clientError);
      return NextResponse.json({ 
        error: 'Database configuration error',
        details: clientError.message
      }, { status: 500 });
    }

    // Verify the referrer exists and is on free trial
    console.log('🔍 Looking up referrer profile...');
    const { data: referrerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier, user_id')
      .eq('user_id', referrerId)
      .single();

    if (profileError) {
      console.error('❌ Error looking up referrer:', profileError);
      return NextResponse.json({ 
        error: 'Database error looking up referrer',
        details: profileError.message
      }, { status: 500 });
    }

    if (!referrerProfile) {
      console.error('❌ Referrer not found');
      return NextResponse.json({ 
        error: 'Invalid referrer' 
      }, { status: 400 });
    }

    console.log('✅ Referrer found:', referrerProfile.subscription_tier);

    // Only allow free trial users to use the referral system
    if (referrerProfile.subscription_tier !== 'free_trial') {
      console.error('❌ Referrer is not on free trial:', referrerProfile.subscription_tier);
      return NextResponse.json({ 
        error: 'Referrer is not on free trial' 
      }, { status: 400 });
    }

    // Check if referral already exists
    console.log('🔍 Checking for existing referral...');
    const { data: existingReferral, error: checkError } = await supabase
      .from('referrals')
      .select('id')
      .eq('referee_id', refereeId)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking existing referral:', checkError);
    }

    if (existingReferral) {
      console.log('⚠️ Referral already exists');
      return NextResponse.json({ 
        success: true,
        message: 'Referral already exists' 
      });
    }

    // Count how many completed referrals this user has
    console.log('🔢 Counting completed referrals...');
    const { data: completedReferrals, error: countError } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', referrerId)
      .eq('status', 'completed');

    if (countError) {
      console.error('❌ Error counting referrals:', countError);
    }

    const completedCount = completedReferrals?.length || 0;
    console.log(`📊 Referrer has ${completedCount} completed referrals (max: 4)`);

    // Max 4 referrals allowed
    if (completedCount >= 4) {
      console.error('❌ Max referrals reached');
      return NextResponse.json({ 
        error: 'Referrer has reached maximum referrals (4)' 
      }, { status: 400 });
    }

    // Create the referral entry with status 'pending'
    console.log('📝 Creating referral entry...');
    const { data: referral, error: insertError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referee_id: refereeId,
        referee_email: refereeEmail,
        status: 'pending',
        referral_type: 'free_trial_extension',
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

    console.log('🎉 SUCCESS! Free trial referral created:', referral.id);
    console.log('   - Referrer:', referrerId);
    console.log('   - Referee:', refereeId);
    console.log('   - Status: pending');

    return NextResponse.json({
      success: true,
      referralId: referral.id,
      message: 'Referral tracked successfully'
    });
  } catch (error: any) {
    console.error('❌ CRITICAL ERROR in create-from-link:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message,
      type: error.name
    }, { status: 500 });
  }
}

