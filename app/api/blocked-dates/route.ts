import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET - Fetch all blocked dates for the current user
 */
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch blocked dates from user_retell_config
    const { data: config, error } = await supabase
      .from('user_retell_config')
      .select('blocked_dates')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching blocked dates:', error);
      return NextResponse.json({ error: 'Failed to fetch blocked dates' }, { status: 500 });
    }

    // Parse blocked_dates - it's stored as JSONB array of date strings
    const blockedDates = config?.blocked_dates || [];

    return NextResponse.json({
      success: true,
      blockedDates,
    });
  } catch (error: any) {
    console.error('Error in GET blocked-dates:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST - Add or remove blocked dates
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, date, dates } = await request.json();

    // Fetch current blocked dates
    const { data: config } = await supabase
      .from('user_retell_config')
      .select('blocked_dates')
      .eq('user_id', user.id)
      .single();

    let currentBlockedDates: string[] = config?.blocked_dates || [];

    if (action === 'add') {
      // Add a single date or multiple dates
      const datesToAdd = dates || [date];
      for (const d of datesToAdd) {
        if (!currentBlockedDates.includes(d)) {
          currentBlockedDates.push(d);
        }
      }
    } else if (action === 'remove') {
      // Remove a single date or multiple dates
      const datesToRemove = dates || [date];
      currentBlockedDates = currentBlockedDates.filter(d => !datesToRemove.includes(d));
    } else if (action === 'set') {
      // Replace all blocked dates
      currentBlockedDates = dates || [];
    }

    // Sort dates chronologically
    currentBlockedDates.sort();

    // Update using service role to bypass RLS
    const serviceClient = createServiceRoleClient();
    
    const { error: updateError } = await serviceClient
      .from('user_retell_config')
      .upsert({
        user_id: user.id,
        blocked_dates: currentBlockedDates,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (updateError) {
      console.error('Error updating blocked dates:', updateError);
      return NextResponse.json({ error: 'Failed to update blocked dates' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      blockedDates: currentBlockedDates,
      message: action === 'add' ? 'Date(s) blocked' : action === 'remove' ? 'Date(s) unblocked' : 'Dates updated',
    });
  } catch (error: any) {
    console.error('Error in POST blocked-dates:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

