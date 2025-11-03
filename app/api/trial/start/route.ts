import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Start a 30-day free trial for a user
 * POST /api/trial/start
 */
export async function POST(req: Request) {
  try {
    console.log('🎁 Starting free trial...');
    
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ User not authenticated:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User:', user.id, user.email);

    // Check if user already has a subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (existingSubscription) {
      console.log('⚠️ User already has an active subscription:', existingSubscription.subscription_tier);
      return NextResponse.json(
        { error: 'You already have an active subscription' },
        { status: 400 }
      );
    }

    // Use service role client to call the start_free_trial function
    const serviceSupabase = createServiceRoleClient();
    
    const { error: trialError } = await serviceSupabase.rpc('start_free_trial', {
      user_id_param: user.id,
      trial_duration_days: 30,
    });

    if (trialError) {
      console.error('❌ Error starting trial:', trialError);
      return NextResponse.json(
        { error: 'Failed to start trial: ' + trialError.message },
        { status: 500 }
      );
    }

    console.log('✅ Free trial started successfully for user:', user.id);

    return NextResponse.json({
      success: true,
      message: 'Free trial started! Welcome to Sterling AI.',
      trial_days: 30,
    });
  } catch (error: any) {
    console.error('❌ Error in /api/trial/start:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

