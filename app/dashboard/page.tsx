import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SimpleStatCard } from '@/components/simple-stat-card';
import { RevenueProfitChart } from '@/components/revenue-profit-chart';
import { CallActivityChart } from '@/components/call-activity-chart';
import { DashboardStatsGrid } from '@/components/dashboard-stats-grid';
import { TrialCountdownBanner } from '@/components/trial-countdown-banner';
import { DashboardRefresher } from '@/components/dashboard-refresher';
import { FirstVisitConfetti } from '@/components/first-visit-confetti';
import { DashboardGreeting } from '@/components/dashboard-greeting';
import { getStartOfTodayInUserTimezone, getDaysAgoInUserTimezone, getTodayDateString, getDateStringDaysAgo } from '@/lib/timezone-helpers';
import { LayoutDashboard } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

export default async function DashboardPage() {
  // Force fresh data on every load
  const timestamp = new Date().toISOString();
  console.log(`🔄 Dashboard loading at: ${timestamp}`);
  
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signup');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User';

  // Get user's timezone for accurate day reset (fixes 7pm reset bug!)
  const { data: aiSettings } = await supabase
    .from('ai_control_settings')
    .select('user_timezone')
    .eq('user_id', user.id)
    .single();

  const userTimezone = aiSettings?.user_timezone || 'America/New_York'; // Default to EST if not set
  console.log(`🌍 User timezone: ${userTimezone} (Day resets at midnight in this timezone, not UTC!)`);

  // Get current date ranges IN USER'S TIMEZONE (not UTC!)
  // This fixes the bug where day was resetting at 7pm instead of midnight
  const startOfTodayISO = getStartOfTodayInUserTimezone(userTimezone);
  const startOf7DaysISO = getDaysAgoInUserTimezone(userTimezone, 7);
  const startOf30DaysISO = getDaysAgoInUserTimezone(userTimezone, 30);
  const todayDateString = getTodayDateString(userTimezone);

  console.log(`📅 Today starts at: ${startOfTodayISO} (midnight in ${userTimezone})`);
  console.log(`📅 Today's date: ${todayDateString}`);

  // Fetch all calls data with fresh query
  const { data: allCalls, error: allCallsError } = await supabase
    .from('calls')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  console.log(`📊 Dashboard: Found ${allCalls?.length || 0} total calls for user`);
  if (allCallsError) console.error('❌ Error fetching calls:', allCallsError);
  
  // Debug: Calculate total costs from calls table directly
  const totalCostFromCalls = allCalls?.reduce((sum, call) => sum + (call.cost || 0), 0) || 0;
  console.log(`💰 Total cost from calls table: $${totalCostFromCalls.toFixed(2)}`);

  const { data: todayCalls } = await supabase
    .from('calls')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', startOfTodayISO);

  const { data: last7DaysCalls } = await supabase
    .from('calls')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', startOf7DaysISO);

  const { data: last30DaysCalls } = await supabase
    .from('calls')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', startOf30DaysISO);

  // Fetch ALL admin-adjusted stats from revenue_tracking table
  const { data: allAdminStats } = await supabase
    .from('revenue_tracking')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  console.log(`📊 ALL Admin stats:`, allAdminStats);
  console.log(`📅 Looking for date: ${todayDateString}`);
  
  // Find today's admin stats
  const adminStatsToday = allAdminStats?.find(stat => stat.date === todayDateString);
  console.log(`📊 Admin-adjusted stats for today (${todayDateString}):`, adminStatsToday);

  // Calculate admin adjustments for different time periods
  const last7DaysDate = getDateStringDaysAgo(userTimezone, 7);
  const last30DaysDate = getDateStringDaysAgo(userTimezone, 30);
  
  // Admin adjustments for last 7 days
  const admin7DaysCalls = allAdminStats?.filter(stat => stat.date >= last7DaysDate).reduce((sum, stat) => sum + (stat.total_calls || 0), 0) || 0;
  
  // Admin adjustments for last 30 days
  const admin30DaysCalls = allAdminStats?.filter(stat => stat.date >= last30DaysDate).reduce((sum, stat) => sum + (stat.total_calls || 0), 0) || 0;
  
  // Calculate metrics (combine real calls + admin adjustments)
  const totalCallsToday = todayCalls?.length || 0;
  const totalCalls7Days = (last7DaysCalls?.length || 0) + admin7DaysCalls;
  const totalCalls30Days = (last30DaysCalls?.length || 0) + admin30DaysCalls;
  
  // Add admin-adjusted numbers to today's totals
  const adminDialsToday = adminStatsToday?.total_calls || 0;
  const finalTotalCallsToday = totalCallsToday + adminDialsToday;

  console.log(`📞 Today's calls: ${totalCallsToday} real + ${adminDialsToday} admin = ${finalTotalCallsToday} total`);
  console.log(`📞 7 days calls: ${last7DaysCalls?.length || 0} real + ${admin7DaysCalls} admin = ${totalCalls7Days} total`);
  console.log(`📞 30 days calls: ${last30DaysCalls?.length || 0} real + ${admin30DaysCalls} admin = ${totalCalls30Days} total`);

  // Fetch ACTUAL appointments from appointments table (Cal.ai bookings)
  // This only counts real Cal.ai appointments, not N8N call outcomes
  const { data: allAppointmentsData } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const appointmentsTodayReal = allAppointmentsData?.filter(apt => {
    return apt.created_at >= startOfTodayISO;
  }).length || 0;
  
  // Add admin-adjusted appointments
  const appointmentsToday = appointmentsTodayReal + (adminStatsToday?.appointments_booked || 0);

  const appointments7Days = allAppointmentsData?.filter(apt => {
    return apt.created_at >= startOf7DaysISO;
  }).length || 0;

  const appointments30Days = allAppointmentsData?.filter(apt => {
    return apt.created_at >= startOf30DaysISO;
  }).length || 0;

  // Calculate TOTAL admin adjustments across ALL dates
  const totalAdminCalls = allAdminStats?.reduce((sum, stat) => sum + (stat.total_calls || 0), 0) || 0;
  const totalAdminCallbacks = allAdminStats?.reduce((sum, stat) => sum + (stat.callbacks || 0), 0) || 0;
  const totalAdminNotInterested = allAdminStats?.reduce((sum, stat) => sum + (stat.not_interested || 0), 0) || 0;
  const totalAdminTransfers = allAdminStats?.reduce((sum, stat) => sum + (stat.live_transfers || 0), 0) || 0;
  const totalAdminAppointments = allAdminStats?.reduce((sum, stat) => sum + (stat.appointments_booked || 0), 0) || 0;
  const totalAdminPolicies = allAdminStats?.reduce((sum, stat) => sum + (stat.policies_sold || 0), 0) || 0;
  const totalAdminRevenue = allAdminStats?.reduce((sum, stat) => sum + (parseFloat(stat.revenue?.toString() || '0')), 0) || 0;
  
  console.log(`📊 Total admin adjustments across all time:`, {
    calls: totalAdminCalls,
    callbacks: totalAdminCallbacks,
    notInterested: totalAdminNotInterested,
    transfers: totalAdminTransfers,
    appointments: totalAdminAppointments,
    policies: totalAdminPolicies,
    revenue: totalAdminRevenue,
  });
  
  // Total calls = ALL calls (answered + not answered) + admin adjustments
  const totalCalls = (allCalls?.length || 0) + totalAdminCalls;
  
  // Connected calls = ONLY answered calls (disposition = 'answered' OR connected = true)
  const connectedCalls = allCalls?.filter(c => c.disposition === 'answered' || c.connected === true).length || 0;
  
  // Not answered calls = calls that were dialed but not picked up
  const notAnsweredCalls = allCalls?.filter(c => c.disposition !== 'answered' && !c.connected).length || 0;
  
  // Connection rate = answered / total
  const connectionRate = totalCalls > 0 ? ((connectedCalls / totalCalls) * 100).toFixed(1) : '0.0';

  // Outcomes - Track all 4 types (ONLY for answered calls) + admin adjustments
  const notInterested = (allCalls?.filter(c => c.outcome === 'not_interested').length || 0) + totalAdminNotInterested;
  const totalAppointments = (allAppointmentsData?.length || 0) + totalAdminAppointments; // Count from appointments table + admin
  const callbacks = (allCalls?.filter(c => c.outcome === 'callback_later').length || 0) + totalAdminCallbacks;
  const transfers = (allCalls?.filter(c => c.outcome === 'live_transfer').length || 0) + totalAdminTransfers;
  
  console.log(`📈 Dashboard stats:`, {
    totalCalls,
    connectedCalls,
    notAnsweredCalls,
    connectionRate: `${connectionRate}%`,
    appointments: totalAppointments,
    notInterested,
    callbacks,
    transfers
  });

  // Get policies sold (from appointments)
  const { data: soldPolicies } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_sold', true);

  const policiesSold = (soldPolicies?.length || 0) + totalAdminPolicies;

  // Calculate stats for different time periods
  const policiesSold7Days = soldPolicies?.filter(p => {
    return p.sold_at >= startOf7DaysISO;
  }).length || 0;

  const policiesSold30Days = soldPolicies?.filter(p => {
    return p.sold_at >= startOf30DaysISO;
  }).length || 0;

  // Calculate connected calls for different periods
  const connectedCalls7Days = last7DaysCalls?.filter(c => c.disposition === 'answered' || c.connected === true).length || 0;
  const connectedCalls30Days = last30DaysCalls?.filter(c => c.disposition === 'answered' || c.connected === true).length || 0;

  const connectionRate7Days = totalCalls7Days > 0 ? ((connectedCalls7Days / totalCalls7Days) * 100).toFixed(1) : '0.0';
  const connectionRate30Days = totalCalls30Days > 0 ? ((connectedCalls30Days / totalCalls30Days) * 100).toFixed(1) : '0.0';

  // Calculate outcomes for different periods
  const notInterested7Days = last7DaysCalls?.filter(c => c.outcome === 'not_interested').length || 0;
  const notInterested30Days = last30DaysCalls?.filter(c => c.outcome === 'not_interested').length || 0;

  const callbacks7Days = last7DaysCalls?.filter(c => c.outcome === 'callback_later').length || 0;
  const callbacks30Days = last30DaysCalls?.filter(c => c.outcome === 'callback_later').length || 0;

  const transfers7Days = last7DaysCalls?.filter(c => c.outcome === 'live_transfer').length || 0;
  const transfers30Days = last30DaysCalls?.filter(c => c.outcome === 'live_transfer').length || 0;

  // ENSURE TODAY'S REVENUE RECORD EXISTS with base cost (using user's timezone!)
  const today = todayDateString; // Use the date string in user's timezone, not UTC
  
  // Get user's subscription to calculate daily base cost
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('subscription_tier')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  // Calculate daily base cost
  let dailyBaseCost = 0;
  if (subscription) {
    // Get current date in user's timezone for month calculation
    const nowInUserTZ = new Date(new Date().toLocaleString('en-US', { timeZone: userTimezone }));
    const daysInMonth = new Date(nowInUserTZ.getFullYear(), nowInUserTZ.getMonth() + 1, 0).getDate();
    let monthlyPrice = 0;
    
    // Updated pricing (November 2024)
    switch (subscription.subscription_tier) {
      case 'starter': monthlyPrice = 499; break;
      case 'pro': monthlyPrice = 899; break;
      case 'elite': monthlyPrice = 1499; break;
    }
    
    dailyBaseCost = monthlyPrice / daysInMonth;
    console.log('');
    console.log('='.repeat(60));
    console.log(`💰 DAILY BASE COST (${subscription.subscription_tier.toUpperCase()})`);
    console.log(`   Monthly Price: $${monthlyPrice}`);
    console.log(`   Days in ${nowInUserTZ.toLocaleString('en-US', { month: 'long', timeZone: userTimezone })}: ${daysInMonth}`);
    console.log(`   Daily Cost: $${monthlyPrice} ÷ ${daysInMonth} = $${dailyBaseCost.toFixed(2)}/day`);
    console.log('='.repeat(60));
    console.log('');
  } else {
    console.log('⚠️  No active subscription found - daily base cost will be $0');
  }

  // Check if today's record exists, if not create it
  const { data: todayRevenue } = await supabase
    .from('revenue_tracking')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .single();

  if (!todayRevenue && dailyBaseCost > 0) {
    console.log(`📊 Creating today's revenue record with base cost: $${dailyBaseCost.toFixed(2)}`);
    await supabase
      .from('revenue_tracking')
      .insert({
        user_id: user.id,
        date: today,
        revenue: 0,
        ai_retainer_cost: dailyBaseCost,
        ai_daily_cost: 0,
      });
  } else if (todayRevenue && todayRevenue.ai_retainer_cost !== dailyBaseCost) {
    // Update base cost if tier changed
    console.log(`📊 Updating today's base cost to: $${dailyBaseCost.toFixed(2)}`);
    await supabase
      .from('revenue_tracking')
      .update({ ai_retainer_cost: dailyBaseCost })
      .eq('user_id', user.id)
      .eq('date', today);
  }

  // BACKFILL: Fix past records that have ai_retainer_cost = 0 (created by webhook before fix)
  if (dailyBaseCost > 0 && subscription) {
    const { data: recordsToFix } = await supabase
      .from('revenue_tracking')
      .select('date')
      .eq('user_id', user.id)
      .or('ai_retainer_cost.is.null,ai_retainer_cost.eq.0')
      .neq('date', today); // Don't touch today's - already handled above
    
    if (recordsToFix && recordsToFix.length > 0) {
      console.log(`📊 Backfilling ${recordsToFix.length} past records with missing ai_retainer_cost`);
      
      // For each record, calculate the correct daily cost based on subscription
      // For simplicity, we'll use the current tier's price divided by days in that month
      for (const record of recordsToFix) {
        const recordDate = new Date(record.date + 'T12:00:00'); // Add time to avoid timezone issues
        const daysInRecordMonth = new Date(recordDate.getFullYear(), recordDate.getMonth() + 1, 0).getDate();
        
        let monthlyPrice = 0;
        switch (subscription.subscription_tier) {
          case 'starter': monthlyPrice = 499; break;
          case 'pro': monthlyPrice = 899; break;
          case 'elite': monthlyPrice = 1499; break;
        }
        
        const dailyCostForRecord = monthlyPrice / daysInRecordMonth;
        
        await supabase
          .from('revenue_tracking')
          .update({ ai_retainer_cost: dailyCostForRecord })
          .eq('user_id', user.id)
          .eq('date', record.date);
        
        console.log(`   ✅ Fixed ${record.date}: $${dailyCostForRecord.toFixed(2)}/day`);
      }
    }
  }

  // Revenue data - fetch after ensuring today's record exists and backfill is done
  const { data: revenueData, error: revenueError } = await supabase
    .from('revenue_tracking')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: true });

  console.log(`📊 Revenue data fetched: ${revenueData?.length || 0} records`);
  if (revenueError) console.error('❌ Revenue fetch error:', revenueError);
  
  // Debug: Log all revenue records
  console.log('💰 ALL REVENUE RECORDS:');
  revenueData?.forEach(r => {
    const calculatedTotal = (r.ai_retainer_cost || 0) + (r.ai_daily_cost || 0);
    console.log(`   📅 ${r.date}: revenue=$${r.revenue || 0}, ai_retainer=$${r.ai_retainer_cost || 0}, ai_daily=$${r.ai_daily_cost || 0}, TOTAL=$${calculatedTotal.toFixed(2)}`);
  });

  // Prepare chart data (using user's timezone for accurate date boundaries!)
  const monthlyRevenueData = [];
  for (let i = 29; i >= 0; i--) {
    const dateStr = getDateStringDaysAgo(userTimezone, i);
    
    const dayRevenue = revenueData?.find(r => r.date === dateStr);
    
    // Create a date object from the string to format it
    const [year, month, day] = dateStr.split('-');
    const displayDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // Note: revenueData already includes admin adjustments from revenue_tracking table
    // No need to add them again!
    // Calculate total AI cost manually (ai_retainer_cost + ai_daily_cost)
    const dayCosts = (dayRevenue?.ai_retainer_cost || 0) + (dayRevenue?.ai_daily_cost || 0);
    monthlyRevenueData.push({
      date: displayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: dayRevenue?.revenue || 0,  // Already includes admin adjustments
      costs: dayCosts,
      profit: (dayRevenue?.revenue || 0) - dayCosts,  // Calculate profit from revenue - costs
    });
  }

  // Calculate costs for LAST 30 DAYS only (to match the chart period)
  // Note: total_ai_cost may be null if it's not a generated column, so calculate manually
  const costs30DaysFromRevenue = revenueData?.filter(r => {
    return r.date >= startOf30DaysISO.split('T')[0]; // Compare date strings
  }).reduce((sum, r) => {
    // Calculate total AI cost: base retainer + per-call costs
    const totalAICost = (r.ai_retainer_cost || 0) + (r.ai_daily_cost || 0);
    return sum + totalAICost;
  }, 0) || 0;
  
  // FALLBACK: Also calculate costs from calls table directly
  const costs30DaysFromCalls = last30DaysCalls?.reduce((sum, call) => sum + (call.cost || 0), 0) || 0;
  
  console.log(`💰 Costs from revenue_tracking: $${costs30DaysFromRevenue.toFixed(2)}`);
  console.log(`💰 Costs from calls table: $${costs30DaysFromCalls.toFixed(2)}`);
  
  // Use the higher of the two (in case one source is incomplete)
  const costs30Days = Math.max(costs30DaysFromRevenue, costs30DaysFromCalls);

  const totalRevenue = revenueData?.reduce((sum, r) => sum + (r.revenue || 0), 0) || 0;  // Already includes admin adjustments
  const totalCosts = costs30Days; // Only last 30 days, not all-time
  const totalProfit = totalRevenue - totalCosts;

  // Calculate revenue for different periods
  const revenue7Days = revenueData?.filter(r => {
    return r.date >= startOf7DaysISO.split('T')[0]; // Compare date strings
  }).reduce((sum, r) => sum + (r.revenue || 0), 0) || 0;

  const revenue30Days = revenueData?.filter(r => {
    return r.date >= startOf30DaysISO.split('T')[0]; // Compare date strings
  }).reduce((sum, r) => sum + (r.revenue || 0), 0) || 0;

  // Calculate TODAY's specific stats (with admin adjustments)
  const connectedCallsToday = todayCalls?.filter(c => c.disposition === 'answered' || c.connected === true).length || 0;
  const connectionRateToday = finalTotalCallsToday > 0 ? ((connectedCallsToday / finalTotalCallsToday) * 100).toFixed(1) : '0.0';
  
  // Add admin-adjusted outcome stats
  const notInterestedToday = (todayCalls?.filter(c => c.outcome === 'not_interested').length || 0) + (adminStatsToday?.not_interested || 0);
  const callbacksToday = (todayCalls?.filter(c => c.outcome === 'callback_later').length || 0) + (adminStatsToday?.callbacks || 0);
  const transfersToday = (todayCalls?.filter(c => c.outcome === 'live_transfer').length || 0) + (adminStatsToday?.live_transfers || 0);
  const policiesSoldToday = (soldPolicies?.filter(p => {
    return p.sold_at >= startOfTodayISO;
  }).length || 0) + (adminStatsToday?.policies_sold || 0);
  // Note: revenueData is from revenue_tracking table which already includes admin adjustments
  // No need to add adminStatsToday?.revenue again!
  const revenueToday = revenueData?.filter(r => {
    return r.date === today; // Compare date strings
  }).reduce((sum, r) => sum + (r.revenue || 0), 0) || 0;

  // Prepare call activity chart data (using user's timezone for accurate date boundaries!)
  const callActivityData = [];
  for (let i = 29; i >= 0; i--) {
    const dateStr = getDateStringDaysAgo(userTimezone, i);
    
    // Get start and end of this day in user's timezone
    const dayStartISO = getDaysAgoInUserTimezone(userTimezone, i);
    const dayEndISO = i > 0 ? getDaysAgoInUserTimezone(userTimezone, i - 1) : new Date().toISOString();
    
    const dayCalls = allCalls?.filter(call => 
      call.created_at >= dayStartISO && call.created_at < dayEndISO
    ) || [];
    
    const answeredCalls = dayCalls.filter(call => call.disposition === 'answered' || call.connected === true).length;
    const bookedCalls = dayCalls.filter(call => call.outcome === 'appointment_booked').length;
    const notInterestedCalls = dayCalls.filter(call => call.outcome === 'not_interested').length;
    
    // Get policies sold for this day
    const daySoldPolicies = soldPolicies?.filter(policy => {
      return policy.sold_at >= dayStartISO && policy.sold_at < dayEndISO;
    }).length || 0;
    
    // GET ADMIN ADJUSTMENTS FOR THIS SPECIFIC DATE
    const adminStatsForDay = allAdminStats?.find(stat => stat.date === dateStr);
    const adminCallsForDay = adminStatsForDay?.total_calls || 0;
    const adminNotInterestedForDay = adminStatsForDay?.not_interested || 0;
    const adminPoliciesForDay = adminStatsForDay?.policies_sold || 0;
    const adminAppointmentsForDay = adminStatsForDay?.appointments_booked || 0;
    
    // Create a date object from the string to format it
    const [year, month, day] = dateStr.split('-');
    const displayDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    callActivityData.push({
      date: displayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      totalCalls: dayCalls.length + adminCallsForDay,  // Real + Admin
      answeredCalls: answeredCalls,
      bookedCalls: bookedCalls + adminAppointmentsForDay,  // Real + Admin
      notInterestedCalls: notInterestedCalls + adminNotInterestedForDay,  // Real + Admin
      policiesSold: daySoldPolicies + adminPoliciesForDay,  // Real + Admin
    });
  }

  return (
    <div className="min-h-screen bg-[#0B1437] relative overflow-hidden">
      {/* First Visit Confetti - shoots once on first dashboard visit */}
      <FirstVisitConfetti userId={user.id} />
      
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl -top-40 -left-40 animate-pulse" />
        <div className="absolute w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl -bottom-40 -right-40 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Auto-refresh every 5 seconds to show real-time updates */}
      <DashboardRefresher />
      
      <main className="container mx-auto px-4 lg:px-8 py-8 relative z-10">
        {/* Free Trial Countdown Banner */}
        <TrialCountdownBanner />

        {/* Welcome */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/30">
              <LayoutDashboard className="w-9 h-9 text-white" />
            </div>
            <div>
              {/* Mobile: Just "Dashboard" */}
              <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent md:hidden">
                Dashboard
              </h1>
              {/* Desktop: Welcome + name (dynamic based on last visit) */}
              <DashboardGreeting displayName={displayName} />
              <p className="text-gray-400 mt-1">Here's how your AI is performing</p>
            </div>
          </div>
        </div>

        {/* Top Stats - All Time (Desktop Only) */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <SimpleStatCard
            title="TOTAL DIALS"
            icon="📊"
            value={totalCalls}
            subtitle="All time calls"
            color="blue"
          />
          <SimpleStatCard
            title="BOOKED APPOINTMENTS"
            icon="✅"
            value={totalAppointments}
            subtitle="All time bookings"
            color="green"
          />
        </div>

        {/* Revenue & Profit Chart (Desktop Only) */}
        <div className="hidden md:block mb-8">
          <RevenueProfitChart
            monthlyData={monthlyRevenueData}
            totalRevenue={totalRevenue}
            totalCosts={totalCosts}
            totalProfit={totalProfit}
          />
        </div>

        {/* Stats Grid with Period Filter (Always Visible) */}
        <DashboardStatsGrid
          todayStats={{
            totalCalls: finalTotalCallsToday,
            connectionRate: connectionRateToday,
            connectedCalls: connectedCallsToday,
            policiesSold: policiesSoldToday,
            revenue: revenueToday,
            notInterested: notInterestedToday,
            callbacks: callbacksToday,
            transfers: transfersToday,
            appointments: appointmentsToday,
          }}
          allTimeStats={{
            totalCalls,
            connectionRate,
            connectedCalls,
            policiesSold,
            revenue: totalRevenue,
            notInterested,
            callbacks,
            transfers,
            appointments: totalAppointments,
          }}
          last7DaysStats={{
            totalCalls: totalCalls7Days,
            connectionRate: connectionRate7Days,
            connectedCalls: connectedCalls7Days,
            policiesSold: policiesSold7Days,
            revenue: revenue7Days,
            notInterested: notInterested7Days,
            callbacks: callbacks7Days,
            transfers: transfers7Days,
            appointments: appointments7Days,
          }}
          last30DaysStats={{
            totalCalls: totalCalls30Days,
            connectionRate: connectionRate30Days,
            connectedCalls: connectedCalls30Days,
            policiesSold: policiesSold30Days,
            revenue: revenue30Days,
            notInterested: notInterested30Days,
            callbacks: callbacks30Days,
            transfers: transfers30Days,
            appointments: appointments30Days,
          }}
        />

        {/* Call Activity Chart (Desktop Only) */}
        <div className="hidden md:block mt-8">
          <CallActivityChart dailyData={callActivityData} />
        </div>

        {/* Mobile Desktop Hint (Mobile Only) */}
        <div className="md:hidden mt-8 p-6 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl border border-blue-500/20">
          <div className="flex items-start gap-3">
            <div className="text-3xl">💻</div>
            <div>
              <h3 className="text-white font-semibold mb-1">Want More Insights?</h3>
              <p className="text-gray-400 text-sm">
                Log in on desktop for detailed charts, analytics, and a complete view of your AI's performance.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
