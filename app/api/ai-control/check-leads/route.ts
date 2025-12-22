import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/ai-control/check-leads
 * Checks if there are any callable leads before launching the AI
 * Returns { hasCallableLeads: boolean, callableLeadsCount: number, message?: string }
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get active Google Sheets for this user
    const { data: activeSheets } = await supabase
      .from('user_google_sheets')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true);

    const activeSheetIds = activeSheets?.map(s => s.id) || [];

    // If no active sheets, no leads to call
    if (activeSheetIds.length === 0) {
      return NextResponse.json({
        hasCallableLeads: false,
        callableLeadsCount: 0,
        message: 'No active Google Sheets found. Please upload and activate a lead sheet first!',
      });
    }

    // Count callable leads
    // Callable = qualified, from active sheets, status is new/callback_later/unclassified/no_answer/potential_appointment, not maxed out
    const { count: callableLeadsCount, error } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_qualified', true)
      .in('google_sheet_id', activeSheetIds)
      .in('status', ['new', 'callback_later', 'unclassified', 'no_answer', 'potential_appointment', 'needs_review'])
      .or('total_calls_made.is.null,total_calls_made.lt.20'); // Not dead leads (20+ attempts)

    if (error) {
      console.error('Error checking callable leads:', error);
      return NextResponse.json({ error: 'Failed to check leads' }, { status: 500 });
    }

    const hasCallableLeads = (callableLeadsCount || 0) > 0;
    
    // Check if all leads have been dialed today
    const todayStr = new Date().toISOString().split('T')[0];
    const { count: leadsNotDialedToday } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_qualified', true)
      .in('google_sheet_id', activeSheetIds)
      .in('status', ['new', 'callback_later', 'unclassified', 'no_answer', 'potential_appointment', 'needs_review'])
      .or('total_calls_made.is.null,total_calls_made.lt.20')
      .or(`last_attempt_date.is.null,last_attempt_date.neq.${todayStr}`);
    
    // All leads dialed today = we have callable leads BUT none are available (all called today)
    const allLeadsDialedToday = hasCallableLeads && (leadsNotDialedToday || 0) === 0;

    if (!hasCallableLeads) {
      // Get total leads to provide more context
      const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('google_sheet_id', activeSheetIds);

      // Get breakdown of lead statuses
      const { data: leadsByStatus } = await supabase
        .from('leads')
        .select('status')
        .eq('user_id', userId)
        .in('google_sheet_id', activeSheetIds);

      const statusCounts: { [key: string]: number } = {};
      leadsByStatus?.forEach(lead => {
        const status = lead.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      console.log('📊 Lead status breakdown:', statusCounts);

      let message = 'You have 0 leads worth calling. ';
      
      if (totalLeads === 0) {
        message += 'Please upload a lead sheet to get started!';
      } else {
        message += `All ${totalLeads} leads have been exhausted (booked, not interested, or maxed out). Upload new leads to continue!`;
      }

      return NextResponse.json({
        hasCallableLeads: false,
        callableLeadsCount: 0,
        totalLeads: totalLeads || 0,
        statusBreakdown: statusCounts,
        message,
      });
    }

    // If all leads were dialed today, return that info
    if (allLeadsDialedToday) {
      return NextResponse.json({
        hasCallableLeads: false, // Can't call any right now
        callableLeadsCount: 0,
        totalCallableLeads: callableLeadsCount || 0,
        allLeadsDialedToday: true,
        message: `All ${callableLeadsCount} leads have been dialed today. Come back tomorrow!`,
      });
    }
    
    return NextResponse.json({
      hasCallableLeads: true,
      callableLeadsCount: leadsNotDialedToday || 0, // Only count leads NOT dialed today
      totalCallableLeads: callableLeadsCount || 0,
      allLeadsDialedToday: false,
      message: `Found ${leadsNotDialedToday} leads ready to call!`,
    });

  } catch (error: any) {
    console.error('Error in check-leads:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check leads' },
      { status: 500 }
    );
  }
}

