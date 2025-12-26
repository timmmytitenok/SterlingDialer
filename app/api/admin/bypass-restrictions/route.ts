import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch current bypass setting
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('ai_control_settings')
      .select('disable_calling_hours')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching bypass setting:', error);
      return NextResponse.json({ bypassEnabled: false });
    }

    return NextResponse.json({ 
      bypassEnabled: data?.disable_calling_hours === true 
    });
  } catch (error) {
    console.error('Error in bypass-restrictions GET:', error);
    return NextResponse.json({ bypassEnabled: false });
  }
}

// POST - Update bypass setting
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, enabled } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    console.log(`🛡️ Admin toggling bypass restrictions for user ${userId}: ${enabled ? 'ON' : 'OFF'}`);

    const { error } = await supabase
      .from('ai_control_settings')
      .update({ 
        disable_calling_hours: enabled,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating bypass setting:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`✅ Bypass restrictions ${enabled ? 'ENABLED' : 'DISABLED'} for user ${userId}`);

    return NextResponse.json({ 
      success: true, 
      bypassEnabled: enabled,
      message: enabled 
        ? 'Calling restrictions bypassed - AI can call anytime including Sundays' 
        : 'Calling restrictions active - AI follows normal hours (9am-6pm)'
    });
  } catch (error: any) {
    console.error('Error in bypass-restrictions POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

