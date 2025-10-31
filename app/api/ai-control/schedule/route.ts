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

    const { userId, scheduleEnabled, scheduleDays, scheduleTime } = await request.json();

    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update schedule settings
    const { error } = await supabase
      .from('ai_control_settings')
      .update({
        schedule_enabled: scheduleEnabled,
        schedule_days: scheduleDays,
        schedule_time: scheduleTime,
      })
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Schedule updated successfully' });
  } catch (error: any) {
    console.error('Error updating schedule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update schedule' },
      { status: 500 }
    );
  }
}

