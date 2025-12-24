import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const adminSupabase = createServiceRoleClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all appointments with no_show status
    const { data: noShowAppointments } = await supabase
      .from('appointments')
      .select('id, prospect_name, prospect_phone, lead_id, status, is_no_show')
      .eq('user_id', user.id)
      .eq('is_no_show', true)
      .limit(5);

    // Get all appointments
    const { data: allAppointments } = await supabase
      .from('appointments')
      .select('id, prospect_name, prospect_phone, lead_id, status, is_no_show')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get all leads
    const { data: allLeads } = await adminSupabase
      .from('leads')
      .select('id, name, phone, status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Get leads with no_show status
    const { data: noShowLeads } = await adminSupabase
      .from('leads')
      .select('id, name, phone, status')
      .eq('user_id', user.id)
      .eq('status', 'no_show');

    return NextResponse.json({
      message: 'Debug info for no-show feature',
      userId: user.id,
      serviceRoleConfigured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      noShowAppointments: noShowAppointments || [],
      noShowLeads: noShowLeads || [],
      recentAppointments: allAppointments || [],
      recentLeads: allLeads?.map(l => ({
        id: l.id,
        name: l.name,
        phone: l.phone?.slice(-4), // Only show last 4 digits for privacy
        status: l.status
      })) || []
    });
  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

