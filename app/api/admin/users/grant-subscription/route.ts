import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

export async function POST(req: Request) {
  try {
    const adminMode = await isAdminMode();
    
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId, type } = await req.json();

    if (!userId || !type) {
      return NextResponse.json({ error: 'User ID and type required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Check if subscription exists
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const now = new Date();
    let subscriptionData: any = {
      user_id: userId,
      updated_at: now.toISOString(),
    };

    if (type === 'Free Trial') {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 7);
      
      subscriptionData.status = 'trialing';
      subscriptionData.tier = 'trial';
      subscriptionData.trial_end = trialEnd.toISOString();
      subscriptionData.current_period_end = trialEnd.toISOString();
    } else if (type === 'Pro Access') {
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      
      subscriptionData.status = 'active';
      subscriptionData.tier = 'pro';
      subscriptionData.current_period_end = periodEnd.toISOString();
    } else if (type === 'FREE VIP ACCESS') {
      const periodEnd = new Date();
      periodEnd.setFullYear(periodEnd.getFullYear() + 100); // 100 years = lifetime
      
      subscriptionData.status = 'active';
      subscriptionData.tier = 'vip';
      subscriptionData.current_period_end = periodEnd.toISOString();
    } else {
      return NextResponse.json({ error: 'Invalid subscription type' }, { status: 400 });
    }

    if (existing) {
      // Update existing subscription
      const { error } = await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      // Create new subscription
      subscriptionData.created_at = now.toISOString();
      
      const { error } = await supabase
        .from('subscriptions')
        .insert(subscriptionData);

      if (error) throw error;
    }

    // Update profile if VIP
    if (type === 'FREE VIP ACCESS') {
      await supabase
        .from('profiles')
        .update({ 
          is_vip: true,
          updated_at: now.toISOString(),
        })
        .eq('user_id', userId);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error granting subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

