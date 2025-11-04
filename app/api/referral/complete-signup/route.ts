import { NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

/**
 * Called when a referred user completes their sign-up:
 * - Email verified
 * - Payment method added
 * 
 * This will:
 * - Mark the referral as 'completed'
 * - Add 7 days to the referrer's free trial (if they're still on free trial)
 * - Cap at 4 referrals (28 days max)
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Use service role for database operations to bypass RLS
    const supabaseAdmin = createServiceRoleClient();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🎁 Checking referral completion for user:', user.id);

    // Check if this user was referred
    const { data: referral } = await supabaseAdmin
      .from('referrals')
      .select('*')
      .eq('referee_id', user.id)
      .single();

    if (!referral) {
      console.log('No referral found for this user');
      return NextResponse.json({ 
        success: true, 
        message: 'No referral found' 
      });
    }

    // Check if already completed
    if (referral.status === 'completed') {
      console.log('Referral already completed');
      return NextResponse.json({ 
        success: true, 
        message: 'Referral already completed' 
      });
    }

    // Verify email is confirmed
    if (!user.email_confirmed_at) {
      console.log('Email not yet verified');
      return NextResponse.json({ 
        success: false, 
        message: 'Email not verified' 
      });
    }

    // Check if user has payment method on file
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      console.log('No payment method on file');
      return NextResponse.json({ 
        success: false, 
        message: 'No payment method' 
      });
    }

    // Valid referral! Mark as completed
    const { error: updateError } = await supabaseAdmin
      .from('referrals')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', referral.id);

    if (updateError) {
      console.error('❌ Error updating referral:', updateError);
      return NextResponse.json({ error: 'Failed to update referral' }, { status: 500 });
    }

    console.log('✅ Referral marked as completed');

    // Now add 7 days to the referrer's trial (if they're still on free trial)
    const { data: referrerProfile } = await supabaseAdmin
      .from('profiles')
      .select('subscription_tier, free_trial_ends_at, free_trial_total_days')
      .eq('user_id', referral.referrer_id)
      .single();

    console.log('👤 Referrer profile:', referrerProfile);

    if (referrerProfile?.subscription_tier === 'free_trial' && referrerProfile.free_trial_ends_at) {
      // Check how many completed referrals they have (max 4)
      const { data: completedReferrals } = await supabaseAdmin
        .from('referrals')
        .select('id')
        .eq('referrer_id', referral.referrer_id)
        .eq('status', 'completed');

      const totalCompleted = completedReferrals?.length || 0;
      console.log(`📊 Total completed referrals: ${totalCompleted} (max: 4)`);

      if (totalCompleted <= 4) {
        // Add 7 days to their trial
        const currentTrialEnd = new Date(referrerProfile.free_trial_ends_at);
        const newTrialEnd = new Date(currentTrialEnd);
        newTrialEnd.setDate(newTrialEnd.getDate() + 7);

        // Update total days
        const newTotalDays = (referrerProfile.free_trial_total_days || 30) + 7;

        console.log('📅 Extending trial:');
        console.log('  - Current end:', currentTrialEnd.toISOString());
        console.log('  - New end:', newTrialEnd.toISOString());
        console.log('  - Current total days:', referrerProfile.free_trial_total_days);
        console.log('  - New total days:', newTotalDays);

        const { error: extendError } = await supabaseAdmin
          .from('profiles')
          .update({
            free_trial_ends_at: newTrialEnd.toISOString(),
            free_trial_total_days: newTotalDays,
            free_trial_days_remaining: Math.ceil((newTrialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          })
          .eq('user_id', referral.referrer_id);

        if (extendError) {
          console.error('❌ Error extending trial:', extendError);
        } else {
          console.log(`🎉 SUCCESS! Added 7 days to referrer's trial!`);
          console.log(`   New end date: ${newTrialEnd.toISOString()}`);
          console.log(`   New total days: ${newTotalDays}`);
        }
      } else {
        console.log('⚠️ Referrer has already reached max 4 referrals');
      }
    } else {
      console.log('⚠️ Referrer is not on free trial or trial has ended');
    }

    return NextResponse.json({
      success: true,
      message: 'Referral completed and reward granted',
      daysAdded: 7
    });
  } catch (error: any) {
    console.error('Error in complete-signup:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

