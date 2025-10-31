import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has an active subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    return NextResponse.json({
      hasSubscription: !!subscription,
      subscription: subscription || null
    });
  } catch (error: any) {
    console.error('Error checking subscription:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

