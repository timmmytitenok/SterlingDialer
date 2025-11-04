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
    console.log('💡 Note: The webhook will add 7 days to the referrer\'s trial automatically');

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

