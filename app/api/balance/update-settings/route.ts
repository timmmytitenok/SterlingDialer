import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { auto_refill_enabled, auto_refill_amount } = await req.json();

    if (auto_refill_amount && ![50, 100, 200, 400].includes(auto_refill_amount)) {
      return NextResponse.json({ error: 'Invalid refill amount. Must be 50, 100, 200, or 400' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update settings
    const { data, error } = await supabase
      .from('call_balance')
      .update({
        auto_refill_enabled,
        auto_refill_amount,
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating settings:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

