import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, autoTransferCalls, dailyCallLimit, doubleDialEnabled } = await request.json();

    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate daily call limit
    if (dailyCallLimit < 1 || dailyCallLimit > 600) {
      return NextResponse.json(
        { error: 'Daily call limit must be between 1 and 600' },
        { status: 400 }
      );
    }

    // Update AI settings
    const { error } = await supabase
      .from('ai_control_settings')
      .update({
        auto_transfer_calls: autoTransferCalls,
        daily_call_limit: dailyCallLimit,
        double_dial_enabled: doubleDialEnabled,
      })
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Settings updated successfully' });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}

