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

    const { 
      userId, 
      scheduleEnabled, 
      scheduleTime, 
      scheduleDays, 
      dailySpendLimit 
    } = await request.json();

    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate daily spend limit
    if (dailySpendLimit < 1 || dailySpendLimit > 1000) {
      return NextResponse.json(
        { error: 'Daily spend limit must be between $1 and $1000' },
        { status: 400 }
      );
    }

    // Convert day indices to day names for database
    const dayNamesMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const autoStartDays = scheduleDays.map((index: number) => dayNamesMap[index]);
    const dailyBudgetCents = Math.round(dailySpendLimit * 100);

    // Update dialer_settings (main table)
    const { error: dialerError } = await supabase
      .from('dialer_settings')
      .upsert({
        user_id: user.id,
        auto_start_enabled: scheduleEnabled,
        auto_start_time: scheduleTime,
        auto_start_days: autoStartDays,
        daily_budget_cents: dailyBudgetCents,
      }, {
        onConflict: 'user_id'
      });

    if (dialerError) throw dialerError;

    // ALSO update ai_control_settings for backwards compatibility
    const { error } = await supabase
      .from('ai_control_settings')
      .update({
        schedule_enabled: scheduleEnabled,
        schedule_time: scheduleTime,
        schedule_days: scheduleDays,
        daily_spend_limit: dailySpendLimit,
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating ai_control_settings:', error);
      // Don't fail the request, just log it
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Automation settings updated successfully' 
    });
  } catch (error: any) {
    console.error('Error updating automation settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}

