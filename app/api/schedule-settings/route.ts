import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
}

interface ScheduleSettings {
  booking_schedule: { [key: number]: DaySchedule };
  booking_days: number[];
  booking_start_time: string;
  booking_end_time: string;
  min_booking_days: number;
  auto_dialer_enabled: boolean;
  dialer_days: number[];
  dialer_start_time: string;
  dialer_daily_budget: number;
  blocked_dates: string[];
  booking_extra_dates: string[]; // Extra booking dates (normally off but allowed)
  dialer_skip_dates: string[]; // Specific dates to skip AI dialer (normally active)
  dialer_extra_dates: string[]; // Specific dates to activate AI dialer (normally off)
}

const DEFAULT_SCHEDULE: { [key: number]: DaySchedule } = {
  0: { enabled: false, start: '09:00', end: '17:00' },
  1: { enabled: true, start: '09:00', end: '17:00' },
  2: { enabled: true, start: '09:00', end: '17:00' },
  3: { enabled: true, start: '09:00', end: '17:00' },
  4: { enabled: true, start: '09:00', end: '17:00' },
  5: { enabled: true, start: '09:00', end: '17:00' },
  6: { enabled: false, start: '09:00', end: '17:00' },
};

const DEFAULT_SETTINGS: ScheduleSettings = {
  booking_schedule: DEFAULT_SCHEDULE,
  booking_days: [1, 2, 3, 4, 5], // Mon-Fri
  booking_start_time: '09:00',
  booking_end_time: '17:00',
  min_booking_days: 1,
  auto_dialer_enabled: false,
  dialer_days: [1, 2, 3, 4, 5],
  dialer_start_time: '09:00',
  dialer_daily_budget: 25,
  blocked_dates: [],
  booking_extra_dates: [],
  dialer_skip_dates: [],
  dialer_extra_dates: [],
};

/**
 * GET - Fetch schedule settings for the current user
 */
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch settings from user_retell_config - use * to avoid column not found errors
    const { data: config, error } = await supabase
      .from('user_retell_config')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching schedule settings:', error);
      // Don't fail - just use defaults
    }

    // Merge with defaults
    const settings: ScheduleSettings = {
      booking_schedule: config?.booking_schedule ?? DEFAULT_SETTINGS.booking_schedule,
      booking_days: config?.booking_days ?? DEFAULT_SETTINGS.booking_days,
      booking_start_time: config?.booking_start_time ?? DEFAULT_SETTINGS.booking_start_time,
      booking_end_time: config?.booking_end_time ?? DEFAULT_SETTINGS.booking_end_time,
      min_booking_days: config?.min_booking_days ?? DEFAULT_SETTINGS.min_booking_days,
      auto_dialer_enabled: config?.auto_dialer_enabled ?? DEFAULT_SETTINGS.auto_dialer_enabled,
      dialer_days: config?.dialer_days ?? DEFAULT_SETTINGS.dialer_days,
      dialer_start_time: config?.dialer_start_time ?? DEFAULT_SETTINGS.dialer_start_time,
      dialer_daily_budget: config?.dialer_daily_budget ?? DEFAULT_SETTINGS.dialer_daily_budget,
      blocked_dates: config?.blocked_dates ?? DEFAULT_SETTINGS.blocked_dates,
      booking_extra_dates: config?.booking_extra_dates ?? DEFAULT_SETTINGS.booking_extra_dates,
      dialer_skip_dates: config?.dialer_skip_dates ?? DEFAULT_SETTINGS.dialer_skip_dates,
      dialer_extra_dates: config?.dialer_extra_dates ?? DEFAULT_SETTINGS.dialer_extra_dates,
    };

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error('Error in GET schedule-settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST - Update schedule settings
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ POST /api/schedule-settings - Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();
    console.log('📥 POST /api/schedule-settings - Received updates:', JSON.stringify(updates));

    // Build update object with only provided fields
    const updateData: Record<string, any> = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    if (updates.booking_schedule !== undefined) updateData.booking_schedule = updates.booking_schedule;
    if (updates.booking_days !== undefined) updateData.booking_days = updates.booking_days;
    if (updates.booking_start_time !== undefined) updateData.booking_start_time = updates.booking_start_time;
    if (updates.booking_end_time !== undefined) updateData.booking_end_time = updates.booking_end_time;
    if (updates.min_booking_days !== undefined) updateData.min_booking_days = updates.min_booking_days;
    if (updates.auto_dialer_enabled !== undefined) updateData.auto_dialer_enabled = updates.auto_dialer_enabled;
    if (updates.dialer_days !== undefined) updateData.dialer_days = updates.dialer_days;
    if (updates.dialer_start_time !== undefined) updateData.dialer_start_time = updates.dialer_start_time;
    if (updates.dialer_daily_budget !== undefined) updateData.dialer_daily_budget = updates.dialer_daily_budget;
    if (updates.blocked_dates !== undefined) updateData.blocked_dates = updates.blocked_dates;
    if (updates.booking_extra_dates !== undefined) updateData.booking_extra_dates = updates.booking_extra_dates;
    if (updates.dialer_skip_dates !== undefined) updateData.dialer_skip_dates = updates.dialer_skip_dates;
    if (updates.dialer_extra_dates !== undefined) updateData.dialer_extra_dates = updates.dialer_extra_dates;

    console.log('📝 Updating with data:', JSON.stringify(updateData));

    // Update using service role to bypass RLS
    const serviceClient = createServiceRoleClient();
    
    // First check if a row exists for this user
    const { data: existing } = await serviceClient
      .from('user_retell_config')
      .select('user_id')
      .eq('user_id', user.id)
      .single();
    
    let updateError;
    let updateResult;
    
    if (existing) {
      // Row exists - just UPDATE (don't upsert)
      const result = await serviceClient
        .from('user_retell_config')
        .update(updateData)
        .eq('user_id', user.id)
        .select();
      updateError = result.error;
      updateResult = result.data;
    } else {
      // No row exists - need to INSERT with required fields
      // Get default retell_api_key from the user or use empty string
      const insertData = {
        ...updateData,
        retell_api_key: '', // Default empty - user will configure later
      };
      const result = await serviceClient
        .from('user_retell_config')
        .insert(insertData)
        .select();
      updateError = result.error;
      updateResult = result.data;
    }

    if (updateError) {
      console.error('❌ Error updating schedule settings:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update settings', 
        details: updateError.message,
        code: updateError.code,
        hint: updateError.hint 
      }, { status: 500 });
    }

    console.log('✅ Settings updated successfully:', updateResult);

    return NextResponse.json({
      success: true,
      message: 'Settings updated',
    });
  } catch (error: any) {
    console.error('Error in POST schedule-settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

