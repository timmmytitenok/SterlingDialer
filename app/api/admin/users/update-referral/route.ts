import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

export async function POST(req: Request) {
  try {
    const adminMode = await isAdminMode();
    
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId, referredBy } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    console.log('🔄 Updating referral for user:', userId);
    console.log('   New referral code:', referredBy || 'REMOVING');

    // Get current referral status
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('referred_by')
      .eq('user_id', userId)
      .single();

    const oldReferralCode = currentProfile?.referred_by;
    console.log('   Old referral code:', oldReferralCode || 'NONE');

    // STEP 1: If user currently has a referral, mark it as cancelled (when changing or removing)
    if (oldReferralCode && oldReferralCode !== referredBy) {
      console.log('🔍 Finding existing referral to cancel...');
      
      // Find all referrals for this user (could be multiple if they changed referrers before)
      const { data: existingReferrals } = await supabase
        .from('referrals')
        .select('*')
        .eq('referee_id', userId)
        .neq('conversion_status', 'cancelled'); // Don't re-cancel already cancelled ones

      if (existingReferrals && existingReferrals.length > 0) {
        console.log(`❌ Marking ${existingReferrals.length} existing referral(s) as cancelled`);
        
        for (const referral of existingReferrals) {
          await supabase
            .from('referrals')
            .update({
              conversion_status: 'cancelled',
              status: 'completed', // Keep as completed but mark conversion as cancelled
            })
            .eq('id', referral.id);
          
          console.log(`   ❌ Cancelled referral ${referral.id} for referrer ${referral.referrer_id}`);
        }
        
        console.log('✅ All old referrals cancelled - will show in old referrers\' dashboards');
      }
    }

    // STEP 2: If new referral code provided, create new referral
    if (referredBy) {
      // Verify the new code exists and get the referrer
      const { data: newReferralCode } = await supabase
        .from('referral_codes')
        .select('user_id, code')
        .eq('code', referredBy.toUpperCase())
        .single();

      if (!newReferralCode) {
        return NextResponse.json({ 
          error: 'Invalid referral code - code does not exist' 
        }, { status: 400 });
      }

      console.log('🎯 New referrer:', newReferralCode.user_id);

      // Check if referral already exists for this new referrer
      const { data: existingNewReferral } = await supabase
        .from('referrals')
        .select('id')
        .eq('referee_id', userId)
        .eq('referrer_id', newReferralCode.user_id)
        .maybeSingle();

      if (!existingNewReferral) {
        // Create new referral entry
        console.log('✨ Creating new referral entry...');
        
        // Check if user has activated trial (has stripe customer)
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('stripe_customer_id, subscription_tier')
          .eq('user_id', userId)
          .single();

        const hasActivatedTrial = !!userProfile?.stripe_customer_id;
        const isProUser = userProfile?.subscription_tier === 'pro';
        
        // Determine conversion status based on current state
        let conversionStatus = 'trial';
        if (isProUser) {
          conversionStatus = 'converted'; // They're already paying!
        }
        
        console.log('   User status:', { 
          hasCard: hasActivatedTrial, 
          tier: userProfile?.subscription_tier,
          conversionStatus 
        });
        
        const { error: insertError } = await supabase
          .from('referrals')
          .insert({
            referrer_id: newReferralCode.user_id,
            referee_id: userId,
            referral_code: newReferralCode.code,
            status: 'completed', // Referral relationship is established
            conversion_status: conversionStatus, // trial or converted
            completed_at: new Date().toISOString(),
            ...(isProUser && { 
              converted_at: new Date().toISOString(),
              first_payment_date: new Date().toISOString() 
            }),
          });
        
        if (insertError) {
          console.error('❌ Error creating referral:', insertError);
          throw insertError;
        }
        
        console.log('✅ New referral created - will show in new referrer\'s dashboard');
        
        // If user is already Pro, trigger commission
        if (isProUser) {
          console.log('💰 User is already Pro - triggering commission...');
          
          const { error: commissionError } = await supabase.rpc('mark_referral_converted', {
            p_user_id: userId
          });
          
          if (commissionError) {
            console.error('⚠️ Error creating commission:', commissionError);
          } else {
            console.log('✅ Commission created for new referrer!');
          }
        }
      } else {
        console.log('ℹ️ Referral already exists for new referrer - reactivating it');
        
        // Reactivate the existing referral
        await supabase
          .from('referrals')
          .update({
            conversion_status: 'trial',
            status: 'completed',
          })
          .eq('id', existingNewReferral.id);
      }
    }

    // STEP 3: Update the user's profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        referred_by: referredBy ? referredBy.toUpperCase() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    console.log('✅ Referral change complete!');

    return NextResponse.json({ 
      success: true,
      message: referredBy ? 'Referral code updated - old referral marked as cancelled, new referral created' : 'Referral removed and marked as cancelled'
    });

  } catch (error: any) {
    console.error('Error updating referral:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

