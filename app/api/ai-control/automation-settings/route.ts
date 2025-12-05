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

    const body = await request.json();
    const { 
      userId, 
      scheduleEnabled, 
      scheduleTime, 
      scheduleDays, 
      dailySpendLimit 
    } = body;

    console.log('📥 Automation settings request received:', {
      userId,
      scheduleEnabled,
      scheduleTime,
      scheduleDays,
      dailySpendLimit,
      fullBody: body
    });

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
    // First check if record exists
    const { data: existingSettings } = await supabase
      .from('dialer_settings')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const dialerUpdate: any = {
      auto_start_enabled: scheduleEnabled,
      auto_start_days: autoStartDays,
      daily_budget_cents: dailyBudgetCents,
    };
    
    // Only update time if provided
    if (scheduleTime) {
      dialerUpdate.auto_start_time = scheduleTime;
    }

    let dialerError;
    if (existingSettings) {
      // Update existing record
      console.log('📝 Updating existing dialer_settings, auto_start_enabled:', scheduleEnabled);
      const { error } = await supabase
        .from('dialer_settings')
        .update(dialerUpdate)
        .eq('user_id', user.id);
      dialerError = error;
    } else {
      // Insert new record
      console.log('📝 Creating new dialer_settings, auto_start_enabled:', scheduleEnabled);
      const { error } = await supabase
        .from('dialer_settings')
        .insert({ user_id: user.id, ...dialerUpdate });
      dialerError = error;
    }

    if (dialerError) {
      console.error('❌ Error updating dialer_settings:', dialerError);
      throw dialerError;
    }
    
    // Verify the update was successful
    const { data: verifyData, error: verifyError } = await supabase
      .from('dialer_settings')
      .select('auto_start_enabled')
      .eq('user_id', user.id)
      .single();
    
    console.log('🔍 Verification - auto_start_enabled in DB:', verifyData?.auto_start_enabled, 'Expected:', scheduleEnabled);
    
    if (verifyData?.auto_start_enabled !== scheduleEnabled) {
      console.error('❌ MISMATCH! Database has:', verifyData?.auto_start_enabled, 'but expected:', scheduleEnabled);
    } else {
      console.log('✅ dialer_settings updated and verified successfully!')
    }

    // ALSO update ai_control_settings for backwards compatibility
    const aiControlUpdate: any = {
      user_id: user.id,
      schedule_enabled: scheduleEnabled,
      schedule_days: scheduleDays,
      daily_spend_limit: dailySpendLimit,
    };
    
    // Only update time if provided
    if (scheduleTime) {
      aiControlUpdate.schedule_time = scheduleTime;
    }

    const { error } = await supabase
      .from('ai_control_settings')
      .upsert(aiControlUpdate, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error updating ai_control_settings:', error);
      // Don't fail the request, just log it
    }

    console.log('✅ Automation settings API completed successfully, scheduleEnabled:', scheduleEnabled);
    return NextResponse.json({ 
      success: true, 
      message: 'Automation settings updated successfully',
      scheduleEnabled: scheduleEnabled
    });
  } catch (error: any) {
    console.error('Error updating automation settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}

