import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover' as any,
});

/**
 * ADMIN TOOL: Manually complete pending referrals
 * This tests the referral completion logic
 */
export async function POST() {
  try {
    const adminMode = await isAdminMode();
    
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabase = createServiceRoleClient();

    // Find all pending referrals where referee has payment method
    const { data: pendingReferrals } = await supabase
      .from('referrals')
      .select('*')
      .eq('status', 'pending');

    if (!pendingReferrals || pendingReferrals.length === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'No pending referrals found',
        completed: 0
      });
    }

    console.log(`📋 Found ${pendingReferrals.length} pending referrals`);
    let completed = 0;

    for (const referral of pendingReferrals) {
      // Check if referee has payment method
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id, full_name')
        .eq('user_id', referral.referee_id)
        .single();

      if (profile?.stripe_customer_id) {
        console.log(`✅ Referee ${profile.full_name} has payment method - completing referral`);
        
        // Mark as completed
        const { error: updateError } = await supabase
          .from('referrals')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', referral.id);

        if (!updateError) {
          completed++;
          
          // Extend referrer's trial
          const { data: referrerProfile } = await supabase
            .from('profiles')
            .select('subscription_tier, free_trial_ends_at, free_trial_total_days, stripe_customer_id, full_name')
            .eq('user_id', referral.referrer_id)
            .single();

          if (referrerProfile?.subscription_tier === 'free_trial' && referrerProfile.free_trial_ends_at) {
            const { data: completedReferrals } = await supabase
              .from('referrals')
              .select('id')
              .eq('referrer_id', referral.referrer_id)
              .eq('status', 'completed');

            const totalCompleted = completedReferrals?.length || 0;

            if (totalCompleted <= 4) {
              const currentTrialEnd = new Date(referrerProfile.free_trial_ends_at);
              const newTrialEnd = new Date(currentTrialEnd);
              newTrialEnd.setDate(newTrialEnd.getDate() + 7);
              const newTotalDays = (referrerProfile.free_trial_total_days || 7) + 7;

              // Update database
              await supabase
                .from('profiles')
                .update({
                  free_trial_ends_at: newTrialEnd.toISOString(),
                  free_trial_total_days: newTotalDays
                })
                .eq('user_id', referral.referrer_id);

              // Update Stripe
              if (referrerProfile.stripe_customer_id) {
                try {
                  const subscriptions = await stripe.subscriptions.list({
                    customer: referrerProfile.stripe_customer_id,
                    status: 'trialing',
                    limit: 1,
                  });

                  if (subscriptions.data.length > 0) {
                    await stripe.subscriptions.update(subscriptions.data[0].id, {
                      trial_end: Math.floor(newTrialEnd.getTime() / 1000),
                    });
                  }
                } catch (stripeErr) {
                  console.error('Stripe update error:', stripeErr);
                }
              }

              console.log(`✅ Extended ${referrerProfile.full_name}'s trial to ${newTrialEnd.toISOString()}`);
            }
          }
        }
      } else {
        console.log(`⏰ Referee has no payment method yet - keeping as pending`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Completed ${completed} referrals`,
      completed,
      total: pendingReferrals.length
    });

  } catch (error: any) {
    console.error('Error completing referrals:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

