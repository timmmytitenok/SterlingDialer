import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Debug endpoint to check lead statuses
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

    // Get all leads with their status
    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, name, phone, status, is_qualified, call_attempts_today, last_called')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    // Get callable leads count
    const { data: callableLeads } = await supabase
      .from('leads')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_qualified', true)
      .in('status', ['new', 'callback_later', 'unclassified'])
      .lt('call_attempts_today', 2);

    return NextResponse.json({
      success: true,
      total_leads: leads?.length || 0,
      callable_leads: callableLeads?.length || 0,
      leads: leads?.map(lead => ({
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        status: lead.status,
        is_qualified: lead.is_qualified,
        call_attempts_today: lead.call_attempts_today,
        last_called: lead.last_called,
        is_callable: lead.is_qualified && 
                     ['new', 'callback_later', 'unclassified'].includes(lead.status) && 
                     (lead.call_attempts_today || 0) < 2,
      })),
    });
  } catch (error: any) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch debug info' },
      { status: 500 }
    );
  }
}
