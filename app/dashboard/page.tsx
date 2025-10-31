import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SimpleStatCard } from '@/components/simple-stat-card';
import { RevenueProfitChart } from '@/components/revenue-profit-chart';
import { CallActivityChart } from '@/components/call-activity-chart';
import { DashboardStatsGrid } from '@/components/dashboard-stats-grid';

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
    redirect('/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User';

  // Get current date ranges
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOf7Days = new Date(now);
  startOf7Days.setDate(now.getDate() - 7);
  const startOf30Days = new Date(now);
  startOf30Days.setDate(now.getDate() - 30);

  // Fetch all calls data with fresh query
  const { data: allCalls, error: allCallsError } = await supabase
    .from('calls')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  console.log(`📊 Dashboard: Found ${allCalls?.length || 0} total calls for user`);
  if (allCallsError) console.error('❌ Error fetching calls:', allCallsError);

  const { data: todayCalls } = await supabase
    .from('calls')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', startOfToday.toISOString());

  const { data: last7DaysCalls } = await supabase
    .from('calls')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', startOf7Days.toISOString());

  const { data: last30DaysCalls } = await supabase
    .from('calls')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', startOf30Days.toISOString());

  // Calculate metrics
  const totalCallsToday = todayCalls?.length || 0;
  const totalCalls7Days = last7DaysCalls?.length || 0;
  const totalCalls30Days = last30DaysCalls?.length || 0;

  // Fetch ACTUAL appointments from appointments table (Cal.ai bookings)
  // This only counts real Cal.ai appointments, not N8N call outcomes
  const { data: allAppointmentsData } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const appointmentsToday = allAppointmentsData?.filter(apt => {
    const aptDate = new Date(apt.created_at);
    return aptDate >= startOfToday;
  }).length || 0;

  const appointments7Days = allAppointmentsData?.filter(apt => {
    const aptDate = new Date(apt.created_at);
    return aptDate >= startOf7Days;
  }).length || 0;

  const appointments30Days = allAppointmentsData?.filter(apt => {
    const aptDate = new Date(apt.created_at);
    return aptDate >= startOf30Days;
  }).length || 0;

  // Total calls = ALL calls (answered + not answered)
  const totalCalls = allCalls?.length || 0;
  
  // Connected calls = ONLY answered calls (disposition = 'answered' OR connected = true)
  const connectedCalls = allCalls?.filter(c => c.disposition === 'answered' || c.connected === true).length || 0;
  
  // Not answered calls = calls that were dialed but not picked up
  const notAnsweredCalls = allCalls?.filter(c => c.disposition !== 'answered' && !c.connected).length || 0;
  
  // Connection rate = answered / total
  const connectionRate = totalCalls > 0 ? ((connectedCalls / totalCalls) * 100).toFixed(1) : '0.0';

  // Outcomes - Track all 4 types (ONLY for answered calls)
  const notInterested = allCalls?.filter(c => c.outcome === 'not_interested').length || 0;
  const totalAppointments = allAppointmentsData?.length || 0; // Count from appointments table, not calls
  const callbacks = allCalls?.filter(c => c.outcome === 'callback_later').length || 0;
  const transfers = allCalls?.filter(c => c.outcome === 'live_transfer').length || 0;
  
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

  const policiesSold = soldPolicies?.length || 0;

  // Calculate stats for different time periods
  const policiesSold7Days = soldPolicies?.filter(p => {
    const soldDate = new Date(p.sold_at);
    return soldDate >= startOf7Days;
  }).length || 0;

  const policiesSold30Days = soldPolicies?.filter(p => {
    const soldDate = new Date(p.sold_at);
    return soldDate >= startOf30Days;
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

  // ENSURE TODAY'S REVENUE RECORD EXISTS with base cost
  const today = new Date().toISOString().split('T')[0];
  
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
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    let monthlyPrice = 0;
    
    switch (subscription.subscription_tier) {
      case 'starter': monthlyPrice = 999; break;
      case 'pro': monthlyPrice = 1399; break;
      case 'elite': monthlyPrice = 1999; break;
    }
    
    dailyBaseCost = monthlyPrice / daysInMonth;
    console.log('');
    console.log('='.repeat(60));
    console.log(`💰 DAILY BASE COST (${subscription.subscription_tier.toUpperCase()})`);
    console.log(`   Monthly Price: $${monthlyPrice}`);
    console.log(`   Days in ${new Date().toLocaleString('en-US', { month: 'long' })}: ${daysInMonth}`);
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

  // Revenue data - fetch after ensuring today's record exists
  const { data: revenueData } = await supabase
    .from('revenue_tracking')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: true });

  console.log(`📊 Revenue data fetched: ${revenueData?.length || 0} records`);

  // Prepare chart data
  const monthlyRevenueData = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayRevenue = revenueData?.find(r => r.date === dateStr);
    
    monthlyRevenueData.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: dayRevenue?.revenue || 0,
      costs: dayRevenue?.total_ai_cost || 0,
      profit: dayRevenue?.profit || 0,
    });
  }

  const totalRevenue = revenueData?.reduce((sum, r) => sum + (r.revenue || 0), 0) || 0;
  const totalCosts = revenueData?.reduce((sum, r) => sum + (r.total_ai_cost || 0), 0) || 0;
  const totalProfit = totalRevenue - totalCosts;

  // Calculate revenue for different periods
  const revenue7Days = revenueData?.filter(r => {
    const revDate = new Date(r.date);
    return revDate >= startOf7Days;
  }).reduce((sum, r) => sum + (r.revenue || 0), 0) || 0;

  const revenue30Days = revenueData?.filter(r => {
    const revDate = new Date(r.date);
    return revDate >= startOf30Days;
  }).reduce((sum, r) => sum + (r.revenue || 0), 0) || 0;

  // Calculate TODAY's specific stats
  const connectedCallsToday = todayCalls?.filter(c => c.disposition === 'answered' || c.connected === true).length || 0;
  const connectionRateToday = totalCallsToday > 0 ? ((connectedCallsToday / totalCallsToday) * 100).toFixed(1) : '0.0';
  const notInterestedToday = todayCalls?.filter(c => c.outcome === 'not_interested').length || 0;
  const callbacksToday = todayCalls?.filter(c => c.outcome === 'callback_later').length || 0;
  const transfersToday = todayCalls?.filter(c => c.outcome === 'live_transfer').length || 0;
  const policiesSoldToday = soldPolicies?.filter(p => {
    const soldDate = new Date(p.sold_at);
    return soldDate >= startOfToday;
  }).length || 0;
  const revenueToday = revenueData?.filter(r => {
    const revDate = new Date(r.date);
    return revDate >= startOfToday;
  }).reduce((sum, r) => sum + (r.revenue || 0), 0) || 0;

  // Prepare call activity chart data
  const callActivityData = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayCalls = allCalls?.filter(call => 
      call.created_at.startsWith(dateStr)
    ) || [];
    
    const answeredCalls = dayCalls.filter(call => call.disposition === 'answered' || call.connected === true).length;
    const bookedCalls = dayCalls.filter(call => call.outcome === 'appointment_booked').length;
    const notInterestedCalls = dayCalls.filter(call => call.outcome === 'not_interested').length;
    
    // Get policies sold for this day
    const daySoldPolicies = soldPolicies?.filter(policy => {
      const soldDate = new Date(policy.sold_at);
      return soldDate.toISOString().split('T')[0] === dateStr;
    }).length || 0;
    
    callActivityData.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      totalCalls: dayCalls.length,
      answeredCalls: answeredCalls,
      bookedCalls: bookedCalls,
      notInterestedCalls: notInterestedCalls,
      policiesSold: daySoldPolicies,
    });
  }

  return (
    <div className="min-h-screen bg-[#0B1437]">
      <main className="container mx-auto px-4 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          {/* Mobile: Just "Welcome back" */}
          <h2 className="text-3xl font-bold text-white mb-2 md:hidden">
            Welcome back 👋
          </h2>
          {/* Desktop: Full name + emoji */}
          <h2 className="hidden md:block text-3xl font-bold text-white mb-2">
            Welcome back, {displayName}! 👋
          </h2>
          <p className="text-gray-400">Here's how your AI is performing</p>
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
            totalCalls: totalCallsToday,
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
