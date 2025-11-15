import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/dialer/settings
 * Returns dialer automation settings for the authenticated user
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create dialer settings
    let { data: settings, error } = await supabase
      .from('dialer_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // If no settings exist, create default
    if (error && error.code === 'PGRST116') {
      const defaultSettings = {
        user_id: user.id,
        daily_budget_cents: 5000, // $50
        currency: 'usd',
        auto_start_enabled: false,
        auto_start_days: ['mon', 'tue', 'wed', 'thu', 'fri'],
        auto_start_time: '09:00',
        auto_stop_time: '20:00',
        lead_priority_mode: 'fresh-first',
        advanced_lead_cap_enabled: false,
        advanced_daily_lead_cap: 600,
        default_override_leads: 20,
      };

      const { data: newSettings, error: insertError } = await supabase
        .from('dialer_settings')
        .insert([defaultSettings])
        .select()
        .single();

      if (insertError) throw insertError;
      settings = newSettings;
    } else if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('Error fetching dialer settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/dialer/settings
 * Updates dialer automation settings
 */
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate daily budget
    if (body.daily_budget_cents !== undefined) {
      if (body.daily_budget_cents < 500 || body.daily_budget_cents > 50000) {
        return NextResponse.json(
          { error: 'Daily budget must be between $5 and $500' },
          { status: 400 }
        );
      }
    }

    // Validate lead priority mode
    if (body.lead_priority_mode !== undefined) {
      const validModes = ['fresh-first', 'callbacks-first', 'aged-first', 'random'];
      if (!validModes.includes(body.lead_priority_mode)) {
        return NextResponse.json(
          { error: 'Invalid lead priority mode' },
          { status: 400 }
        );
      }
    }

    // Check if settings exist
    const { data: existing } = await supabase
      .from('dialer_settings')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let updatedSettings;

    if (existing) {
      // Update existing settings
      const { data, error } = await supabase
        .from('dialer_settings')
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      updatedSettings = data;
    } else {
      // Create new settings
      const { data, error } = await supabase
        .from('dialer_settings')
        .insert([{
          user_id: user.id,
          ...body,
        }])
        .select()
        .single();

      if (error) throw error;
      updatedSettings = data;
    }

    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (error: any) {
    console.error('Error updating dialer settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}

