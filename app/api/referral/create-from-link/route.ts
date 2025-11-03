import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Creates a referral entry when someone signs up through a referral link
 * URL format: /login?ref=USER_ID
 */
export async function POST(req: Request) {
  try {
    const { referrerId, refereeId, refereeEmail } = await req.json();

    if (!referrerId || !refereeId) {
      return NextResponse.json({ 
        error: 'Missing referrer or referee ID' 
      }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify the referrer exists and is on free trial
    const { data: referrerProfile } = await supabase
      .from('profiles')
      .select('subscription_tier, user_id')
      .eq('user_id', referrerId)
      .single();

    if (!referrerProfile) {
      return NextResponse.json({ 
        error: 'Invalid referrer' 
      }, { status: 400 });
    }

    // Only allow free trial users to use the referral system
    if (referrerProfile.subscription_tier !== 'free_trial') {
      return NextResponse.json({ 
        error: 'Referrer is not on free trial' 
      }, { status: 400 });
    }

    // Check if referral already exists
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('referee_id', refereeId)
      .single();

    if (existingReferral) {
      return NextResponse.json({ 
        success: true,
        message: 'Referral already exists' 
      });
    }

    // Count how many completed referrals this user has
    const { data: completedReferrals } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', referrerId)
      .eq('status', 'completed');

    const completedCount = completedReferrals?.length || 0;

    // Max 4 referrals allowed
    if (completedCount >= 4) {
      return NextResponse.json({ 
        error: 'Referrer has reached maximum referrals (4)' 
      }, { status: 400 });
    }

    // Create the referral entry with status 'pending'
    const { data: referral, error: insertError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referee_id: refereeId,
        referee_email: refereeEmail,
        status: 'pending',
        referral_type: 'free_trial_extension', // To differentiate from paid referrals
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating referral:', insertError);
      return NextResponse.json({ 
        error: 'Failed to create referral' 
      }, { status: 500 });
    }

    console.log('✅ Free trial referral created:', referral.id);

    return NextResponse.json({
      success: true,
      referralId: referral.id,
      message: 'Referral tracked successfully'
    });
  } catch (error: any) {
    console.error('Error in create-from-link:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}

