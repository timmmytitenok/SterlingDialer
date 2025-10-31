import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { start_hour, end_hour } = await request.json();

    // Validation
    if (typeof start_hour !== 'number' || typeof end_hour !== 'number') {
      return NextResponse.json({ error: 'start_hour and end_hour must be numbers' }, { status: 400 });
    }

    if (start_hour < 0 || start_hour >= 24 || end_hour <= 0 || end_hour > 24) {
      return NextResponse.json({ error: 'Hours must be between 0-24' }, { status: 400 });
    }

    if (end_hour <= start_hour) {
      return NextResponse.json({ error: 'End hour must be after start hour' }, { status: 400 });
    }

    // Upsert calendar settings
    const { data, error } = await supabase
      .from('calendar_settings')
      .upsert({
        user_id: user.id,
        start_hour,
        end_hour,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating calendar settings:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      settings: {
        start_hour: data.start_hour,
        end_hour: data.end_hour,
      }
    });
  } catch (error: any) {
    console.error('Calendar settings UPDATE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

