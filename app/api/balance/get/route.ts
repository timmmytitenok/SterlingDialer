import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get balance
    const { data: balance, error } = await supabase
      .from('call_balance')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching balance:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If no balance record exists, create one
    if (!balance) {
      const { data: newBalance, error: createError } = await supabase
        .from('call_balance')
        .insert({
          user_id: user.id,
          balance: 0,
          auto_refill_enabled: true,
          auto_refill_threshold: 10.00,
          auto_refill_amount: 50.00,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating balance:', createError);
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }

      // Get cost_per_minute and subscription_tier from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('cost_per_minute, subscription_tier')
        .eq('user_id', user.id)
        .single();

      return NextResponse.json({
        ...newBalance,
        cost_per_minute: profile?.cost_per_minute || 0.30,
        subscription_tier: profile?.subscription_tier || 'none',
      });
    }

    // Get cost_per_minute and subscription_tier from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('cost_per_minute, subscription_tier')
      .eq('user_id', user.id)
      .single();

    console.log('🔍 Fetched cost_per_minute from profiles:', profile?.cost_per_minute);

    return NextResponse.json({
      ...balance,
      cost_per_minute: profile?.cost_per_minute || 0.30,
      subscription_tier: profile?.subscription_tier || 'none',
    });
  } catch (error: any) {
    console.error('Balance get error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

