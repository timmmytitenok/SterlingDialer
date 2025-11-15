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

    // Get dialer session (runtime state)
    const { data: session } = await supabase
      .from('dialer_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get dialer settings for budget
    const { data: settings } = await supabase
      .from('dialer_settings')
      .select('daily_budget_cents')
      .eq('user_id', user.id)
      .single();

    // Show 0 if no settings exist (user hasn't configured yet)
    const dailyBudgetCents = settings?.daily_budget_cents || 0;

    // Get today's metrics
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's calls
    const { data: todaysCalls } = await supabase
      .from('calls')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', `${today}T00:00:00Z`)
      .lte('created_at', `${today}T23:59:59Z`);

    const todayCalls = todaysCalls?.length || 0;
    const todayMinutes = todaysCalls?.reduce((sum, call) => sum + (call.duration_seconds || 0), 0) / 60 || 0;
    const todaySpendCents = Math.round(todayMinutes * 30); // $0.30/min

    // Calculate pickup percentage (calls answered / total calls)
    const answeredCalls = todaysCalls?.filter(call => call.disposition === 'answered').length || 0;
    const pickupPercentage = todayCalls > 0 ? Math.round((answeredCalls / todayCalls) * 100) : 0;

    // Get yesterday's calls for trend comparison
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];
    
    const { data: yesterdaysCalls } = await supabase
      .from('calls')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', `${yesterdayDate}T00:00:00Z`)
      .lte('created_at', `${yesterdayDate}T23:59:59Z`);

    const yesterdayCalls = yesterdaysCalls?.length || 0;
    const yesterdayMinutes = yesterdaysCalls?.reduce((sum, call) => sum + (call.duration_seconds || 0), 0) / 60 || 0;
    const yesterdayAnswered = yesterdaysCalls?.filter(call => call.disposition === 'answered').length || 0;
    const yesterdayPickupPercentage = yesterdayCalls > 0 ? Math.round((yesterdayAnswered / yesterdayCalls) * 100) : 0;
    
    // Calculate trends
    const pickupTrend = pickupPercentage - yesterdayPickupPercentage;
    const callsTrend = todayCalls - yesterdayCalls;
    const minutesTrend = Math.round((todayMinutes - yesterdayMinutes) * 10) / 10;

    // Get today's appointments
    const { data: todaysAppointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', `${today}T00:00:00Z`)
      .lte('created_at', `${today}T23:59:59Z`);

    const todayAppointments = todaysAppointments?.length || 0;

    // Get yesterday's appointments for trend
    const { data: yesterdaysAppointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', `${yesterdayDate}T00:00:00Z`)
      .lte('created_at', `${yesterdayDate}T23:59:59Z`);

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

    // Determine status
    let status = session?.status || 'idle';
    let reason = null;

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
    });
  } catch (error: any) {
    console.error('Error fetching dialer status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch status' },
      { status: 500 }
    );
  }
}

