import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/dialer/status
 * Returns current dialer runtime status and today's metrics
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

    // Get AI control settings (runtime state)
    const { data: aiSettings } = await supabase
      .from('ai_control_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get dialer settings for budget
    const { data: settings } = await supabase
      .from('dialer_settings')
      .select('daily_budget_cents')
      .eq('user_id', user.id)
      .single();

    // Show 0 if no settings exist (user hasn't configured yet)
    const dailyBudgetCents = settings?.daily_budget_cents || 0;

    // Get today's metrics - use LOCAL time, not UTC!
    // This ensures "today" matches what the user sees on their clock
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const todayStart = startOfToday.toISOString();
    const todayEnd = endOfToday.toISOString();
    
    // Get today's calls using LOCAL day boundaries
    const { data: todaysCalls } = await supabase
      .from('calls')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', todayStart)
      .lte('created_at', todayEnd);

    const todayCalls = todaysCalls?.length || 0;
    // Use the 'duration' field (already in minutes) and 'cost' field from calls table
    const todayMinutes = todaysCalls?.reduce((sum, call) => sum + (call.duration || 0), 0) || 0;
    // Use actual cost saved in calls table (more accurate than recalculating)
    const todaySpendDollars = todaysCalls?.reduce((sum, call) => sum + (call.cost || 0), 0) || 0;
    const todaySpendCents = Math.round(todaySpendDollars * 100);

    // Calculate pickup percentage (calls answered / total calls)
    const answeredCalls = todaysCalls?.filter(call => call.disposition === 'answered').length || 0;
    const pickupPercentage = todayCalls > 0 ? Math.round((answeredCalls / todayCalls) * 100) : 0;

    // Get yesterday's calls for trend comparison - also use LOCAL time
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    const yesterdayStart = startOfYesterday.toISOString();
    const yesterdayEnd = endOfYesterday.toISOString();
    
    const { data: yesterdaysCalls } = await supabase
      .from('calls')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', yesterdayStart)
      .lte('created_at', yesterdayEnd);

    const yesterdayCalls = yesterdaysCalls?.length || 0;
    // Use 'duration' field (already in minutes)
    const yesterdayMinutes = yesterdaysCalls?.reduce((sum, call) => sum + (call.duration || 0), 0) || 0;
    const yesterdayAnswered = yesterdaysCalls?.filter(call => call.disposition === 'answered').length || 0;
    const yesterdayPickupPercentage = yesterdayCalls > 0 ? Math.round((yesterdayAnswered / yesterdayCalls) * 100) : 0;
    
    // Calculate trends
    const pickupTrend = pickupPercentage - yesterdayPickupPercentage;
    const callsTrend = todayCalls - yesterdayCalls;
    const minutesTrend = Math.round((todayMinutes - yesterdayMinutes) * 10) / 10;

    // Get today's appointments - using LOCAL time boundaries
    const { data: todaysAppointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', todayStart)
      .lte('created_at', todayEnd);

    const todayAppointments = todaysAppointments?.length || 0;

    // Get yesterday's appointments for trend - using LOCAL time boundaries
    const { data: yesterdaysAppointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', yesterdayStart)
      .lte('created_at', yesterdayEnd);

    const yesterdayAppointments = yesterdaysAppointments?.length || 0;
    const appointmentsTrend = todayAppointments - yesterdayAppointments;

    // Calculate Calls Per Appointment (lower is better)
    const callsPerAppointment = todayAppointments > 0 
      ? Math.round(todayCalls / todayAppointments) 
      : 0;
    
    const yesterdayCallsPerAppointment = yesterdayAppointments > 0
      ? Math.round(yesterdayCalls / yesterdayAppointments)
      : 0;
    
    // Trend: negative is good (fewer calls needed), positive is bad (more calls needed)
    const callsPerAppointmentTrend = callsPerAppointment - yesterdayCallsPerAppointment;

    // Count available leads (flexible status check)
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { count: uncalledLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .or('status.is.null,status.eq.pending,status.eq.new,status.eq.ready');

    const pendingLeads = uncalledLeads || totalLeads || 0;
    const todayLeadsAttempted = todayCalls; // Each call = one lead attempted

    // Get call balance
    const { data: callBalance } = await supabase
      .from('call_balance')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    const callBalanceCents = Math.round((callBalance?.balance || 0) * 100);
    const lowBalance = callBalanceCents < 500; // < $5

    // Determine status from ai_control_settings
    let status = aiSettings?.status || 'stopped';
    let reason = null;
    
    // Map 'stopped' to 'idle' for UI consistency
    if (status === 'stopped') {
      status = 'idle';
    }

    // Check calling hours (9am - 6pm in user's timezone, Mon-Sat only)
    const userTimezone = aiSettings?.user_timezone || 'America/New_York';
    const nowInUserTZ = new Date(new Date().toLocaleString('en-US', { timeZone: userTimezone }));
    const currentHour = nowInUserTZ.getHours();
    const currentDay = nowInUserTZ.getDay(); // 0 = Sunday
    const isSunday = currentDay === 0;
    const withinCallingHours = currentHour >= 9 && currentHour < 18;
    const callingHoursDisabled = aiSettings?.disable_calling_hours === true;
    
    // Format current time for display
    const currentTimeStr = nowInUserTZ.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });

    // If Sunday or outside calling hours and not disabled, show that status
    const outsideCallingHours = (!withinCallingHours || isSunday) && !callingHoursDisabled;
    
    if (outsideCallingHours && status === 'idle') {
      status = 'outside-hours';
      reason = isSunday 
        ? `No calls on Sundays. Resumes Monday 9:00 AM` 
        : `Calling hours: 9:00 AM - 6:00 PM ${userTimezone.replace('America/', '').replace('_', ' ')}`;
    }

    // Check if budget reached
    if (status === 'running' && todaySpendCents >= dailyBudgetCents) {
      status = 'paused-budget';
      reason = 'Daily budget limit reached';
    }

    // Check if balance is low
    if (status === 'running' && lowBalance) {
      status = 'paused-balance';
      reason = 'Call balance too low to continue';
    }

    // Check if no leads
    if (status === 'running' && !pendingLeads) {
      status = 'no-leads';
      reason = 'No pending leads to call';
    }

    // Detect budget mode by budget_limit_cents > 0
    const isBudgetMode = aiSettings?.budget_limit_cents && aiSettings.budget_limit_cents > 0;
    const budgetLimitCents = aiSettings?.budget_limit_cents || 0;
    
    return NextResponse.json({
      success: true,
      status,
      todaySpendCents,
      dailyBudgetCents,
      todayCalls,
      todayMinutes: Math.round(todayMinutes * 10) / 10,
      todayLeadsAttempted,
      todayAppointments,
      pickupPercentage,
      pickupTrend,
      callsTrend,
      minutesTrend,
      appointmentsTrend,
      callsPerAppointment,
      callsPerAppointmentTrend,
      pendingLeads: pendingLeads || 0,
      reason,
      lowBalance,
      callBalanceCents,
      // Execution mode data from ai_control_settings
      // isBudgetMode takes priority - if budget_limit_cents > 0, it's budget mode
      executionMode: isBudgetMode ? 'budget' : (aiSettings?.execution_mode || 'leads'),
      targetLeadCount: aiSettings?.target_lead_count || 0,
      callsMadeToday: aiSettings?.calls_made_today || 0,
      dailySpendLimit: aiSettings?.daily_spend_limit || 0,
      todaySpend: aiSettings?.today_spend || 0,
      // Budget mode specific
      budgetLimitCents: budgetLimitCents,
      isBudgetMode: isBudgetMode,
      // Calling hours info
      outsideCallingHours,
      currentTime: currentTimeStr,
      userTimezone,
      callingHoursDisabled,
    });
  } catch (error: any) {
    console.error('Error fetching dialer status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch status' },
      { status: 500 }
    );
  }
}

