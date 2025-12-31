import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getEstDateString } from '@/lib/timezone-helpers';

/**
 * GET /api/ai-control/check-leads
 * Checks if there are any callable leads before launching the AI
 * Returns detailed info including leads already dialed today
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Get user timezone for "today" calculation
    const { data: aiSettings } = await supabase
      .from('ai_control_settings')
      .select('user_timezone')
      .eq('user_id', userId)
      .single();
    
    // ALWAYS use EST for day reset (midnight Eastern Time for ALL users)
    const todayStr = getEstDateString();

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
        reason: 'no_sheets',
        message: 'No active Google Sheets found. Please upload and activate a lead sheet first!',
      });
    }

    // Count ALL potential leads (qualified + right status + not dead)
    const { count: potentialLeadsCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_qualified', true)
      .in('google_sheet_id', activeSheetIds)
      .in('status', ['new', 'callback_later', 'unclassified', 'no_answer', 'potential_appointment', 'needs_review'])
      .or('total_calls_made.is.null,total_calls_made.lt.20');

    // Count leads that can be called TODAY (not already attempted today)
    // needs_review leads can be retried even if attempted today
    const { count: callableLeadsCount, error } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_qualified', true)
      .in('google_sheet_id', activeSheetIds)
      .in('status', ['new', 'callback_later', 'unclassified', 'no_answer', 'potential_appointment', 'needs_review'])
      .or('total_calls_made.is.null,total_calls_made.lt.20')
      .or(`call_attempts_today.is.null,call_attempts_today.eq.0,last_attempt_date.neq.${todayStr},status.eq.needs_review`);

    if (error) {
      console.error('Error checking callable leads:', error);
      return NextResponse.json({ error: 'Failed to check leads' }, { status: 500 });
    }

    const hasCallableLeads = (callableLeadsCount || 0) > 0;
    const potentialLeads = potentialLeadsCount || 0;
    const leadsDialedToday = potentialLeads - (callableLeadsCount || 0);

    // CASE 1: Has callable leads - proceed normally
    if (hasCallableLeads) {
      return NextResponse.json({
        hasCallableLeads: true,
        callableLeadsCount: callableLeadsCount || 0,
        potentialLeadsCount: potentialLeads,
        leadsDialedToday,
        message: `Found ${callableLeadsCount} leads ready to call!`,
      });
    }

    // CASE 2: No callable leads - figure out why
    
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

    // CASE 2a: Has potential leads but all were dialed today
    if (potentialLeads > 0 && leadsDialedToday > 0) {
      return NextResponse.json({
        hasCallableLeads: false,
        callableLeadsCount: 0,
        potentialLeadsCount: potentialLeads,
        leadsDialedToday,
        reason: 'all_dialed_today',
        message: `You've already dialed all ${potentialLeads} available leads today! Come back tomorrow or upload more leads.`,
        totalLeads: totalLeads || 0,
        statusBreakdown: statusCounts,
      });
    }

    // CASE 2b: No leads at all
    if (totalLeads === 0) {
      return NextResponse.json({
        hasCallableLeads: false,
        callableLeadsCount: 0,
        potentialLeadsCount: 0,
        leadsDialedToday: 0,
        reason: 'no_leads',
        message: 'You have no leads uploaded. Please upload a lead sheet to get started!',
        totalLeads: 0,
        statusBreakdown: statusCounts,
      });
    }

    // CASE 2c: Has leads but all are exhausted (booked, not interested, dead)
    return NextResponse.json({
      hasCallableLeads: false,
      callableLeadsCount: 0,
      potentialLeadsCount: 0,
      leadsDialedToday: 0,
      reason: 'all_exhausted',
      message: `All ${totalLeads} leads have been exhausted (booked, not interested, or maxed out). Upload new leads to continue!`,
      totalLeads: totalLeads || 0,
      statusBreakdown: statusCounts,
    });

  } catch (error: any) {
    console.error('Error in check-leads:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check leads' },
      { status: 500 }
    );
  }
}

