import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get calendar settings
    const { data: settings, error } = await supabase
      .from('calendar_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching calendar settings:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return default settings if none exist
    if (!settings) {
      return NextResponse.json({
        start_hour: 9,
        end_hour: 20,
      });
    }

    return NextResponse.json({
      start_hour: settings.start_hour,
      end_hour: settings.end_hour,
    });
  } catch (error: any) {
    console.error('Calendar settings GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

