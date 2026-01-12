import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SimpleStatCard } from '@/components/simple-stat-card';
import { CustomizableStatCard } from '@/components/customizable-stat-card';
import { RevenueProfitChart } from '@/components/revenue-profit-chart';
import { CallActivityChart } from '@/components/call-activity-chart';
import { DashboardStatsGrid } from '@/components/dashboard-stats-grid';
import { TrialCountdownBanner } from '@/components/trial-countdown-banner';
import { DashboardRefresher } from '@/components/dashboard-refresher';
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

  // ALWAYS use EST (America/New_York) for day reset - consistent across ALL users
  // This ensures the dashboard, AI dialer, and admin panel all reset at the same time (midnight EST)
  const EST_TIMEZONE = 'America/New_York';
  console.log(`🌍 Using EST timezone for day reset (midnight Eastern Time for ALL users)`);

  // Get current date ranges IN EST TIMEZONE (consistent for all users!)
  const startOfTodayISO = getStartOfTodayInUserTimezone(EST_TIMEZONE);
  const startOfYesterdayISO = getDaysAgoInUserTimezone(EST_TIMEZONE, 1);
  const startOf7DaysISO = getDaysAgoInUserTimezone(EST_TIMEZONE, 7);
  const startOf30DaysISO = getDaysAgoInUserTimezone(EST_TIMEZONE, 30);
  const todayDateString = getTodayDateString(EST_TIMEZONE);
  const yesterdayDateString = getDateStringDaysAgo(EST_TIMEZONE, 1);

  console.log(`📅 Today starts at: ${startOfTodayISO} (midnight EST)`);
  console.log(`📅 Today's date (EST): ${todayDateString}`);

  // ============================================================================
  // SCALABLE QUERIES - Using count queries to handle 200k+ calls efficiently
  // ============================================================================

  // Fetch all call counts using efficient count queries (no row limit issues!)
  const [
    // All-time counts
    { count: totalCallsCount },
    { count: connectedCallsCount },
    { count: notInterestedAllCount },
    { count: callbacksAllCount },
    { count: transfersAllCount },
    // Today counts
    { count: todayCallsCount },
    { count: todayConnectedCount },
    { count: todayNotInterestedCount },
    { count: todayCallbacksCount },
    { count: todayTransfersCount },
    // Yesterday counts
    { count: yesterdayCallsCount },
    { count: yesterdayConnectedCount },
    { count: yesterdayNotInterestedCount },
    { count: yesterdayCallbacksCount },
    { count: yesterdayTransfersCount },
    // 7 days counts
    { count: last7DaysCallsCount },
    { count: last7DaysConnectedCount },
    { count: last7DaysNotInterestedCount },
    { count: last7DaysCallbacksCount },
    { count: last7DaysTransfersCount },
    // 30 days counts
    { count: last30DaysCallsCount },
    { count: last30DaysConnectedCount },
    { count: last30DaysNotInterestedCount },
    { count: last30DaysCallbacksCount },
    { count: last30DaysTransfersCount },
  ] = await Promise.all([
    // All-time counts
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('user_id', user.id).or('disposition.eq.answered,connected.eq.true'),
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('outcome', 'not_interested'),
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('outcome', 'callback_later'),
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('outcome', 'live_transfer'),
    // Today counts
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startOfTodayISO),
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startOfTodayISO).or('disposition.eq.answered,connected.eq.true'),
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startOfTodayISO).eq('outcome', 'not_interested'),
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startOfTodayISO).eq('outcome', 'callback_later'),
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startOfTodayISO).eq('outcome', 'live_transfer'),
    // Yesterday counts
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startOfYesterdayISO).lt('created_at', startOfTodayISO),
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startOfYesterdayISO).lt('created_at', startOfTodayISO).or('disposition.eq.answered,connected.eq.true'),
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startOfYesterdayISO).lt('created_at', startOfTodayISO).eq('outcome', 'not_interested'),
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startOfYesterdayISO).lt('created_at', startOfTodayISO).eq('outcome', 'callback_later'),
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startOfYesterdayISO).lt('created_at', startOfTodayISO).eq('outcome', 'live_transfer'),
    // 7 days counts
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startOf7DaysISO),
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startOf7DaysISO).or('disposition.eq.answered,connected.eq.true'),
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startOf7DaysISO).eq('outcome', 'not_interested'),
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startOf7DaysISO).eq('outcome', 'callback_later'),
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startOf7DaysISO).eq('outcome', 'live_transfer'),
    // 30 days counts
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startOf30DaysISO),
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startOf30DaysISO).or('disposition.eq.answered,connected.eq.true'),
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startOf30DaysISO).eq('outcome', 'not_interested'),
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startOf30DaysISO).eq('outcome', 'callback_later'),
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startOf30DaysISO).eq('outcome', 'live_transfer'),
  ]);

  console.log(`📊 Dashboard: Total calls count: ${totalCallsCount || 0} (using efficient count queries)`);

  // Fetch only cost data for total cost calculation (minimal columns, high limit)
  const { data: callCosts } = await supabase
    .from('calls')
    .select('cost')
    .eq('user_id', user.id)
    .limit(500000);
  
  const totalCostFromCalls = callCosts?.reduce((sum, call) => sum + (call.cost || 0), 0) || 0;
  console.log(`💰 Total cost from calls table: $${totalCostFromCalls.toFixed(2)}`);

  // Fetch last 30 days of call data for chart (only needed columns)
  // NOTE: Supabase has a default 1000 row limit. We need to fetch in batches or increase limit.
  console.log(`📊 CHART DEBUG: Fetching calls for user ${user.id} since ${startOf30DaysISO}`);
  
  // Fetch all calls by making multiple requests if needed (pagination)
  let chartCallsData: any[] = [];
  let hasMore = true;
  let offset = 0;
  const batchSize = 1000;
  
  while (hasMore) {
    const { data: batch, error: batchError } = await supabase
    .from('calls')
    .select('created_at, disposition, connected, outcome')
    .eq('user_id', user.id)
    .gte('created_at', startOf30DaysISO)
      .order('created_at', { ascending: true })
      .range(offset, offset + batchSize - 1);
    
    if (batchError) {
      console.error('📊 CHART BATCH ERROR:', batchError);
      break;
    }
    
    if (batch && batch.length > 0) {
      chartCallsData = [...chartCallsData, ...batch];
      offset += batchSize;
      hasMore = batch.length === batchSize; // If we got a full batch, there might be more
    } else {
      hasMore = false;
    }
  }
  
  const chartError = null; // Handled in loop
  
  console.log(`📊 CHART DEBUG: Fetched ${chartCallsData?.length || 0} calls for chart`);
  if (chartError) console.error('📊 CHART ERROR:', chartError);
  if (chartCallsData && chartCallsData.length > 0) {
    console.log(`📊 CHART DEBUG: Oldest call: ${chartCallsData[0]?.created_at}`);
    console.log(`📊 CHART DEBUG: Newest call: ${chartCallsData[chartCallsData.length - 1]?.created_at}`);
    // Show last 10 calls to debug
    console.log(`📊 LAST 10 CALLS IN DB:`, chartCallsData.slice(-10).map(c => c.created_at));
  }
  
  // Also fetch ALL recent calls (regardless of date filter) to compare
  const { data: recentCallsDebug } = await supabase
    .from('calls')
    .select('created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);
  console.log(`📊 ACTUAL RECENT CALLS (no date filter):`, recentCallsDebug?.map(c => c.created_at));

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

  // Find yesterday's admin stats
  const adminStatsYesterday = allAdminStats?.find(stat => stat.date === yesterdayDateString);

  // Calculate admin adjustments for different time periods
  const last7DaysDate = getDateStringDaysAgo(EST_TIMEZONE, 7);
  const last30DaysDate = getDateStringDaysAgo(EST_TIMEZONE, 30);
  
  // Admin adjustments for last 7 days
  const admin7DaysCalls = allAdminStats?.filter(stat => stat.date >= last7DaysDate).reduce((sum, stat) => sum + (stat.total_calls || 0), 0) || 0;
  
  // Admin adjustments for last 30 days
  const admin30DaysCalls = allAdminStats?.filter(stat => stat.date >= last30DaysDate).reduce((sum, stat) => sum + (stat.total_calls || 0), 0) || 0;
  
  // Calculate metrics (combine real calls + admin adjustments)
  const totalCallsToday = todayCallsCount || 0;
  const totalCalls7Days = (last7DaysCallsCount || 0) + admin7DaysCalls;
  const totalCalls30Days = (last30DaysCallsCount || 0) + admin30DaysCalls;
  
  // Add admin-adjusted numbers to today's totals
  const adminDialsToday = adminStatsToday?.total_calls || 0;
  const finalTotalCallsToday = totalCallsToday + adminDialsToday;

  console.log(`📞 Today's calls: ${totalCallsToday} real + ${adminDialsToday} admin = ${finalTotalCallsToday} total`);
  console.log(`📞 7 days calls: ${last7DaysCallsCount || 0} real + ${admin7DaysCalls} admin = ${totalCalls7Days} total`);
  console.log(`📞 30 days calls: ${last30DaysCallsCount || 0} real + ${admin30DaysCalls} admin = ${totalCalls30Days} total`);

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
  const totalCalls = (totalCallsCount || 0) + totalAdminCalls;
  
  // Connected calls = ONLY answered calls (disposition = 'answered' OR connected = true)
  const connectedCalls = connectedCallsCount || 0;
  
  // Not answered calls = calls that were dialed but not picked up
  const notAnsweredCalls = (totalCallsCount || 0) - (connectedCallsCount || 0);
  
  // Connection rate = answered / total
  const connectionRate = totalCalls > 0 ? ((connectedCalls / totalCalls) * 100).toFixed(1) : '0.0';

  // Outcomes - Track all 4 types (ONLY for answered calls) + admin adjustments
  const notInterested = (notInterestedAllCount || 0) + totalAdminNotInterested;
  const totalAppointments = (allAppointmentsData?.length || 0) + totalAdminAppointments; // Count from appointments table + admin
  const callbacks = (callbacksAllCount || 0) + totalAdminCallbacks;
  const transfers = (transfersAllCount || 0) + totalAdminTransfers;
  
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

  // Calculate connected calls for different periods (using count queries)
  const connectedCalls7Days = last7DaysConnectedCount || 0;
  const connectedCalls30Days = last30DaysConnectedCount || 0;

  const connectionRate7Days = totalCalls7Days > 0 ? ((connectedCalls7Days / totalCalls7Days) * 100).toFixed(1) : '0.0';
  const connectionRate30Days = totalCalls30Days > 0 ? ((connectedCalls30Days / totalCalls30Days) * 100).toFixed(1) : '0.0';

  // Calculate outcomes for different periods (using count queries)
  const notInterested7Days = last7DaysNotInterestedCount || 0;
  const notInterested30Days = last30DaysNotInterestedCount || 0;

  const callbacks7Days = last7DaysCallbacksCount || 0;
  const callbacks30Days = last30DaysCallbacksCount || 0;

  const transfers7Days = last7DaysTransfersCount || 0;
  const transfers30Days = last30DaysTransfersCount || 0;

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
    // Get current date in EST for month calculation
    const nowInEST = new Date(new Date().toLocaleString('en-US', { timeZone: EST_TIMEZONE }));
    const daysInMonth = new Date(nowInEST.getFullYear(), nowInEST.getMonth() + 1, 0).getDate();
    let monthlyPrice = 0;
    
    // Updated pricing (November 2024)
    switch (subscription.subscription_tier) {
      case 'starter': monthlyPrice = 379; break;
      case 'pro': monthlyPrice = 899; break;
      case 'elite': monthlyPrice = 1499; break;
    }
    
    dailyBaseCost = monthlyPrice / daysInMonth;
    console.log('');
    console.log('='.repeat(60));
    console.log(`💰 DAILY BASE COST (${subscription.subscription_tier.toUpperCase()})`);
    console.log(`   Monthly Price: $${monthlyPrice}`);
    console.log(`   Days in ${nowInEST.toLocaleString('en-US', { month: 'long', timeZone: EST_TIMEZONE })}: ${daysInMonth}`);
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
    .maybeSingle(); // Use maybeSingle to avoid errors when no row exists

  // Get today's spend from ai_control_settings (source of truth for live costs)
  // IMPORTANT: Also fetch spend_last_reset_date to check if today_spend is actually from today!
  const { data: aiControlSettings } = await supabase
    .from('ai_control_settings')
    .select('today_spend, spend_last_reset_date')
    .eq('user_id', user.id)
    .maybeSingle(); // Use maybeSingle to avoid errors
  
  // CRITICAL FIX: Only use today_spend if it's actually from today!
  // If spend_last_reset_date doesn't match today, the spend is stale from a previous day
  const isSpendFromToday = aiControlSettings?.spend_last_reset_date === today;
  const todaySpendFromAI = isSpendFromToday ? (aiControlSettings?.today_spend || 0) : 0;
  
  if (aiControlSettings?.today_spend && aiControlSettings.today_spend > 0 && !isSpendFromToday) {
    console.log(`⚠️ STALE SPEND DETECTED: today_spend=$${aiControlSettings.today_spend} but spend_last_reset_date=${aiControlSettings.spend_last_reset_date} (today is ${today})`);
    console.log(`   Using $0 for today's AI cost instead of stale value`);
  }
  
  console.log(`💰 CHART SYNC DEBUG:`);
  console.log(`   Today's date: ${today}`);
  console.log(`   Today's spend from AI settings: $${todaySpendFromAI}`);
  console.log(`   Today's revenue_tracking record exists: ${!!todayRevenue}`);
  if (todayRevenue) {
    console.log(`   Current ai_daily_cost in revenue_tracking: $${todayRevenue.ai_daily_cost || 0}`);
  }

  // Sync today's AI costs to revenue_tracking for the chart
  // Only attempt if we have spend data to sync
  if (todaySpendFromAI > 0) {
    console.log(`💰 CHART SYNC:`);
    console.log(`   Today: ${today}`);
    console.log(`   AI daily cost (from settings): $${todaySpendFromAI}`);
    
    try {
      // Use upsert to handle both insert and update
      const { error: upsertError } = await supabase
        .from('revenue_tracking')
        .upsert({
          user_id: user.id,
          date: today,
          revenue: todayRevenue?.revenue || 0,
          ai_retainer_cost: dailyBaseCost,
          ai_daily_cost: Math.max(todayRevenue?.ai_daily_cost || 0, todaySpendFromAI),
        }, {
          onConflict: 'user_id,date'
        });
      
      if (upsertError) {
        // If column doesn't exist, just log a warning (don't break the page)
        console.warn(`⚠️ Chart sync skipped (run SQL migration):`, upsertError.message);
      } else {
        console.log(`✅ Chart synced!`);
      }
    } catch (syncError: any) {
      console.warn(`⚠️ Chart sync error:`, syncError.message);
    }
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
          case 'starter': monthlyPrice = 379; break;
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

  // Prepare chart data (using EST for consistent date boundaries!)
  const monthlyRevenueData = [];
  for (let i = 29; i >= 0; i--) {
    const dateStr = getDateStringDaysAgo(EST_TIMEZONE, i);
    
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
  // Note: chartCallsData doesn't include cost, so we need to fetch it separately for 30-day costs
  const { data: last30DaysCosts } = await supabase
    .from('calls')
    .select('cost')
    .eq('user_id', user.id)
    .gte('created_at', startOf30DaysISO)
    .limit(500000);
  const costs30DaysFromCalls = last30DaysCosts?.reduce((sum, call) => sum + (call.cost || 0), 0) || 0;
  
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

  // Calculate TODAY's specific stats (with admin adjustments) - using count queries
  const connectedCallsToday = todayConnectedCount || 0;
  const connectionRateToday = finalTotalCallsToday > 0 ? ((connectedCallsToday / finalTotalCallsToday) * 100).toFixed(1) : '0.0';
  
  // Add admin-adjusted outcome stats (using count queries)
  const notInterestedToday = (todayNotInterestedCount || 0) + (adminStatsToday?.not_interested || 0);
  const callbacksToday = (todayCallbacksCount || 0) + (adminStatsToday?.callbacks || 0);
  const transfersToday = (todayTransfersCount || 0) + (adminStatsToday?.live_transfers || 0);
  const policiesSoldToday = (soldPolicies?.filter(p => {
    return p.sold_at >= startOfTodayISO;
  }).length || 0) + (adminStatsToday?.policies_sold || 0);
  // Note: revenueData is from revenue_tracking table which already includes admin adjustments
  // No need to add adminStatsToday?.revenue again!
  const revenueToday = revenueData?.filter(r => {
    return r.date === today; // Compare date strings
  }).reduce((sum, r) => sum + (r.revenue || 0), 0) || 0;

  // Calculate YESTERDAY's specific stats (with admin adjustments) - using count queries
  const totalCallsYesterdayReal = yesterdayCallsCount || 0;
  const adminDialsYesterday = adminStatsYesterday?.total_calls || 0;
  const finalTotalCallsYesterday = totalCallsYesterdayReal + adminDialsYesterday;
  
  const connectedCallsYesterday = yesterdayConnectedCount || 0;
  const connectionRateYesterday = finalTotalCallsYesterday > 0 ? ((connectedCallsYesterday / finalTotalCallsYesterday) * 100).toFixed(1) : '0.0';
  
  const notInterestedYesterday = (yesterdayNotInterestedCount || 0) + (adminStatsYesterday?.not_interested || 0);
  const callbacksYesterday = (yesterdayCallbacksCount || 0) + (adminStatsYesterday?.callbacks || 0);
  const transfersYesterday = (yesterdayTransfersCount || 0) + (adminStatsYesterday?.live_transfers || 0);
  const policiesSoldYesterday = (soldPolicies?.filter(p => {
    return p.sold_at >= startOfYesterdayISO && p.sold_at < startOfTodayISO;
  }).length || 0) + (adminStatsYesterday?.policies_sold || 0);
  const revenueYesterday = revenueData?.filter(r => {
    return r.date === yesterdayDateString;
  }).reduce((sum, r) => sum + (r.revenue || 0), 0) || 0;
  const appointmentsYesterday = (allAppointmentsData?.filter(apt => {
    return apt.created_at >= startOfYesterdayISO && apt.created_at < startOfTodayISO;
  }).length || 0) + (adminStatsYesterday?.appointments_booked || 0);

  // Prepare call activity chart data (using EST for consistent date boundaries!)
  const callActivityData = [];
  console.log(`📊 CHART BUILD: Building chart data for ${chartCallsData?.length || 0} calls`);
  for (let i = 29; i >= 0; i--) {
    const dateStr = getDateStringDaysAgo(EST_TIMEZONE, i);
    
    // Get start and end of this day in EST
    const dayStartISO = getDaysAgoInUserTimezone(EST_TIMEZONE, i);
    const dayEndISO = i > 0 ? getDaysAgoInUserTimezone(EST_TIMEZONE, i - 1) : new Date().toISOString();
    
    // Debug: log date boundaries for recent days
    if (i <= 7) {
      console.log(`📊 DAY ${i}: ${dateStr} | Start: ${dayStartISO} | End: ${dayEndISO}`);
    }
    
    // Convert to timestamps for accurate comparison (fixes string comparison bug!)
    const dayStartTime = new Date(dayStartISO).getTime();
    const dayEndTime = new Date(dayEndISO).getTime();
    
    // Use chartCallsData (limited columns, high limit) for chart calculations
    // IMPORTANT: Use Date comparison, NOT string comparison for accurate filtering
    const dayCalls = chartCallsData?.filter(call => {
      const callTime = new Date(call.created_at).getTime();
      return callTime >= dayStartTime && callTime < dayEndTime;
    }) || [];
    
    // Debug: log call counts for recent days
    if (i <= 7 && dayCalls.length > 0) {
      console.log(`📊 DAY ${i} (${dateStr}): Found ${dayCalls.length} calls`);
    }
    
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
  
  // Debug: summarize chart data
  const chartTotalCalls = callActivityData.reduce((sum, d) => sum + d.totalCalls, 0);
  const chartTotalAnswered = callActivityData.reduce((sum, d) => sum + d.answeredCalls, 0);
  console.log(`📊 CHART SUMMARY: Total calls in chart: ${chartTotalCalls}, Answered: ${chartTotalAnswered}`);
  console.log(`📊 CHART DATA (last 7 days):`, callActivityData.slice(-7).map(d => `${d.date}: ${d.totalCalls} calls`).join(', '));

  return (
    <div className="min-h-screen bg-[#0B1437] relative overflow-hidden">
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
          <CustomizableStatCard
            userId={user.id}
            defaultKey="appointments"
            options={[
              { key: 'appointments', title: 'BOOKED APPOINTMENTS', icon: '✅', color: 'green', value: totalAppointments, subtitle: 'All time bookings' },
              { key: 'revenue', title: 'REVENUE GENERATED', icon: '💵', color: 'green', value: totalRevenue, subtitle: 'All time revenue', prefix: '$' },
              { key: 'policies', title: 'POLICIES SOLD', icon: '💰', color: 'yellow', value: policiesSold, subtitle: 'All time sales' },
              { key: 'callbacks', title: 'CALLBACKS', icon: '📞', color: 'orange', value: callbacks, subtitle: 'All time callbacks' },
              { key: 'transfers', title: 'LIVE TRANSFERS', icon: '🔄', color: 'purple', value: transfers, subtitle: 'All time transfers' },
              { key: 'connected', title: 'CONNECTED CALLS', icon: '📱', color: 'blue', value: connectedCalls, subtitle: 'All time connections' },
              { key: 'notInterested', title: 'NOT INTERESTED', icon: '❌', color: 'red', value: notInterested, subtitle: 'All time declines' },
            ]}
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
          yesterdayStats={{
            totalCalls: finalTotalCallsYesterday,
            connectionRate: connectionRateYesterday,
            connectedCalls: connectedCallsYesterday,
            policiesSold: policiesSoldYesterday,
            revenue: revenueYesterday,
            notInterested: notInterestedYesterday,
            callbacks: callbacksYesterday,
            transfers: transfersYesterday,
            appointments: appointmentsYesterday,
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
