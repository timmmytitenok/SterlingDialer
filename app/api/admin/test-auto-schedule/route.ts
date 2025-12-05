import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const adminMode = await isAdminMode();
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabase = createServiceRoleClient();
    
    // Test query 1: Check ai_control_settings
    const { data: aiSettings, error: aiError } = await supabase
      .from('ai_control_settings')
      .select('user_id, schedule_enabled, schedule_days, daily_spend_limit')
      .eq('schedule_enabled', true);

    // Test query 2: Check dialer_settings
    const { data: dialerSettings, error: dialerError } = await supabase
      .from('dialer_settings')
      .select('user_id, auto_start_enabled, auto_start_days, daily_budget_cents')
      .eq('auto_start_enabled', true);

    return NextResponse.json({
      aiSettings: {
        data: aiSettings,
        error: aiError?.message,
        count: aiSettings?.length || 0
      },
      dialerSettings: {
        data: dialerSettings,
        error: dialerError?.message,
        count: dialerSettings?.length || 0
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

