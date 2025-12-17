import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get all appointments for this user
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Analyze each appointment
    const analyzedAppointments = (appointments || []).map(apt => {
      const scheduledAt = new Date(apt.scheduled_at);
      const now = new Date();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      return {
        id: apt.id,
        prospect_name: apt.prospect_name,
        prospect_phone: apt.prospect_phone,
        status: apt.status,
        scheduled_at_raw: apt.scheduled_at,
        scheduled_at_local: scheduledAt.toLocaleString(),
        scheduled_at_iso: scheduledAt.toISOString(),
        hour: scheduledAt.getHours(),
        day: scheduledAt.toLocaleDateString('en-US', { weekday: 'long' }),
        date: scheduledAt.toLocaleDateString(),
        is_active: apt.status === 'scheduled' || apt.status === 'rescheduled',
        is_future: scheduledAt >= todayStart,
        should_show: (apt.status === 'scheduled' || apt.status === 'rescheduled') && scheduledAt >= todayStart,
        notes: apt.notes,
        created_at: apt.created_at,
      };
    });

    const summary = {
      total: appointments?.length || 0,
      scheduled: appointments?.filter(a => a.status === 'scheduled').length || 0,
      rescheduled: appointments?.filter(a => a.status === 'rescheduled').length || 0,
      no_show: appointments?.filter(a => a.status === 'no_show').length || 0,
      completed: appointments?.filter(a => a.status === 'completed').length || 0,
      sold: appointments?.filter(a => a.status === 'sold' || a.is_sold).length || 0,
      should_show_in_calendar: analyzedAppointments.filter(a => a.should_show).length,
      server_time: new Date().toISOString(),
      server_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    return NextResponse.json({
      summary,
      appointments: analyzedAppointments,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

