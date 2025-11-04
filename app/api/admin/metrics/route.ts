import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Disable caching for real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Check if user is in admin mode
    const cookieStore = await cookies();
    const adminMode = cookieStore.get('admin_mode')?.value === 'true';
    
    console.log('🔒 Admin Metrics API - Admin Mode:', adminMode);
    
    if (!adminMode) {
      console.log('❌ Admin Metrics API - Unauthorized: No admin_mode cookie');
      return NextResponse.json({ error: 'Unauthorized - Admin mode required' }, { status: 401 });
    }

    console.log('✅ Admin Metrics API - Authorized, fetching metrics...');
    const supabase = createServiceRoleClient();

    // 1. USER STATS
    console.log('📊 Fetching user profiles...');
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, subscription_tier, created_at, ai_setup_status, free_trial_ends_at, cost_per_minute');
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
    }
    console.log('✅ Profiles fetched:', allProfiles?.length || 0);

    const totalUsers = allProfiles?.length || 0;
    const freeTrialUsers = allProfiles?.filter(p => p.subscription_tier === 'free_trial').length || 0;
    const starterUsers = allProfiles?.filter(p => p.subscription_tier === 'starter').length || 0;
    const proUsers = allProfiles?.filter(p => p.subscription_tier === 'pro').length || 0;
    const eliteUsers = allProfiles?.filter(p => p.subscription_tier === 'elite').length || 0;
    const vipUsers = allProfiles?.filter(p => p.subscription_tier === 'free_access').length || 0;
    
    console.log('👥 User Breakdown:', { totalUsers, freeTrialUsers, starterUsers, proUsers, eliteUsers, vipUsers });

    // 2. CALL STATS with time filters
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch all calls
    console.log('📞 Fetching all calls...');
    const { data: allCalls, error: callsError } = await supabase
      .from('calls')
      .select('*');
    
    if (callsError) {
      console.error('❌ Error fetching calls:', callsError);
    }
    console.log('✅ Calls fetched:', allCalls?.length || 0);

    // Filter by time periods
    const callsToday = allCalls?.filter(c => new Date(c.created_at) >= today).length || 0;
    const calls7d = allCalls?.filter(c => new Date(c.created_at) >= sevenDaysAgo).length || 0;
    const calls30d = allCalls?.filter(c => new Date(c.created_at) >= thirtyDaysAgo).length || 0;
    const callsAllTime = allCalls?.length || 0;

    // Appointments (outcome = 'booked' or similar)
    const appointmentsToday = allCalls?.filter(c => 
      new Date(c.created_at) >= today && c.outcome === 'booked'
    ).length || 0;
    const appointments7d = allCalls?.filter(c => 
      new Date(c.created_at) >= sevenDaysAgo && c.outcome === 'booked'
    ).length || 0;
    const appointments30d = allCalls?.filter(c => 
      new Date(c.created_at) >= thirtyDaysAgo && c.outcome === 'booked'
    ).length || 0;
    const appointmentsAllTime = allCalls?.filter(c => c.outcome === 'booked').length || 0;

    // Connected rate (answered calls)
    const answeredCalls = allCalls?.filter(c => c.outcome === 'answered').length || 0;
    const connectedRate = callsAllTime > 0 ? ((answeredCalls / callsAllTime) * 100).toFixed(1) : '0.0';

    // Total policies sold (you'll need to add this field to calls table)
    const policiesSold = allCalls?.filter(c => c.policy_sold === true).length || 0;

    // 3. REVENUE STATS
    const { data: revenueData } = await supabase
      .from('revenue_tracking')
      .select('*');
    
    const totalUserRevenue = revenueData?.reduce((sum, r) => sum + (r.ai_costs || 0), 0) || 0;

    // Calculate MRR (from active subscriptions)
    const { data: activeSubscriptions } = await supabase
      .from('subscriptions')
      .select('subscription_tier')
      .eq('status', 'active');

    const tierPrices: Record<string, number> = {
      starter: 499,
      pro: 899,
      elite: 1499,
    };

    const mrr = activeSubscriptions?.reduce((sum, sub) => {
      return sum + (tierPrices[sub.subscription_tier] || 0);
    }, 0) || 0;

    // 4. SYSTEM HEALTH
    const pendingSetups = allProfiles?.filter(p => p.ai_setup_status === 'pending_setup').length || 0;
    
    // Get call balances
    const { data: callBalances } = await supabase
      .from('call_balance')
      .select('user_id, balance');
    
    const lowBalanceUsers = callBalances?.filter(cb => (cb.balance || 0) < 10).length || 0;
    
    // Expiring trials (next 3 days)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const expiringTrials = allProfiles?.filter(p => {
      if (p.subscription_tier !== 'free_trial' || !p.free_trial_ends_at) return false;
      const expiresAt = new Date(p.free_trial_ends_at);
      return expiresAt <= threeDaysFromNow && expiresAt > new Date();
    }).length || 0;

    // 5. RECENT ACTIVITY (Last 20 calls)
    const { data: recentCallsWithProfiles } = await supabase
      .from('calls')
      .select(`
        *,
        profiles!inner(full_name, subscription_tier)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    // Calculate YOUR daily profit from subscriptions
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const starterDailyProfit = (starterUsers * 499) / daysInMonth;
    const proDailyProfit = (proUsers * 899) / daysInMonth;
    const eliteDailyProfit = (eliteUsers * 1499) / daysInMonth;
    const totalSubscriptionProfit = starterDailyProfit + proDailyProfit + eliteDailyProfit;

    // Calculate ALL TIME minutes profit - Get from admin_profit_tracking table for accuracy
    console.log('💰 Fetching minutes profit from admin_profit_tracking...');
    const { data: allProfitData } = await supabase
      .from('admin_profit_tracking')
      .select('date, minutes_profit, total_minutes_sold, total_minutes_cost');
    
    const totalMinutesProfit = allProfitData?.reduce((sum, d) => sum + (d.minutes_profit || 0), 0) || 0;
    const totalMinutesSold = allProfitData?.reduce((sum, d) => sum + (d.total_minutes_sold || 0), 0) || 0;
    const totalMinutesCost = allProfitData?.reduce((sum, d) => sum + (d.total_minutes_cost || 0), 0) || 0;
    
    // Get today's minutes profit
    const todayStr = today.toISOString().split('T')[0];
    const todayProfitData = allProfitData?.find(p => p.date === todayStr);
    const minutesProfitToday = todayProfitData?.minutes_profit || 0;
    
    // Calculate total expenses (your call costs = $0.12/min)
    const totalExpenses = totalMinutesCost;
    
    // Calculate total call balances (money sitting in user accounts)
    const totalCallBalances = callBalances?.reduce((sum, cb) => sum + (cb.balance || 0), 0) || 0;
    
    console.log(`✅ Minutes Profit (from tracking table): $${totalMinutesProfit.toFixed(2)}`);
    console.log(`   Today's Minutes Profit: $${minutesProfitToday.toFixed(2)}`);
    console.log(`   Total charged to users: $${totalMinutesSold.toFixed(2)}`);
    console.log(`   Total cost to you: $${totalMinutesCost.toFixed(2)}`);
    console.log(`📞 Total Expenses (Your Call Costs): $${totalExpenses.toFixed(2)}`);
    console.log(`🏦 Total Call Balances (Reserved Funds): $${totalCallBalances.toFixed(2)}`);

    // Calculate ALL TIME REVENUE (subscriptions + minutes profit)
    const monthlyRevenue = (starterUsers * 499) + (proUsers * 899) + (eliteUsers * 1499);
    const allTimeSubscriptionRevenue = monthlyRevenue; // Total monthly revenue
    const allTimeRevenue = allTimeSubscriptionRevenue + totalMinutesProfit;
    
    console.log('💵 Revenue Summary:', {
      monthlySubscriptions: monthlyRevenue,
      minutesProfit: totalMinutesProfit.toFixed(2),
      allTimeRevenue: allTimeRevenue.toFixed(2),
      dailySubscriptionProfit: totalSubscriptionProfit.toFixed(2)
    });

    // Get historical data for last 30 days and last 12 months
    const last30Days = [];
    const last12Months = [];

    // Generate last 30 days data
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayCalls = allCalls?.filter(c => c.created_at.startsWith(dateStr)).length || 0;
      const dayAppointments = allCalls?.filter(c => 
        c.created_at.startsWith(dateStr) && c.outcome === 'booked'
      ).length || 0;
      
      // Get profit data for this day
      const dayProfit = allProfitData?.find(p => p.date === dateStr);
      
      last30Days.push({
        date: dateStr,
        calls: dayCalls,
        appointments: dayAppointments,
        subscriptionRevenue: totalSubscriptionProfit,
        minutesProfit: dayProfit?.minutes_profit || 0,
      });
    }

    // Generate last 12 months data
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toISOString().slice(0, 7); // YYYY-MM
      
      const monthCalls = allCalls?.filter(c => c.created_at.startsWith(monthStr)).length || 0;
      const monthAppointments = allCalls?.filter(c => 
        c.created_at.startsWith(monthStr) && c.outcome === 'booked'
      ).length || 0;
      
      // Sum up all profit data for this month
      const monthProfitData = allProfitData?.filter(p => p.date?.startsWith(monthStr)) || [];
      const monthMinutesProfit = monthProfitData.reduce((sum, p) => sum + (p.minutes_profit || 0), 0);
      
      last12Months.push({
        month: monthStr,
        calls: monthCalls,
        appointments: monthAppointments,
        subscriptionRevenue: totalSubscriptionProfit * new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(),
        minutesProfit: monthMinutesProfit,
      });
    }

    console.log('✅ Admin Metrics API - Returning full response');

    return NextResponse.json({
      users: {
        total: totalUsers,
        byTier: {
          free_trial: freeTrialUsers,
          starter: starterUsers,
          pro: proUsers,
          elite: eliteUsers,
          vip: vipUsers,
        },
      },
      calls: {
        today: callsToday,
        last7d: calls7d,
        last30d: calls30d,
        allTime: callsAllTime,
      },
      appointments: {
        today: appointmentsToday,
        last7d: appointments7d,
        last30d: appointments30d,
        allTime: appointmentsAllTime,
      },
      connectedRate: parseFloat(connectedRate),
      policiesSold: policiesSold,
      totalUserRevenue: Math.round(totalUserRevenue * 100) / 100,
      allTimeRevenue: Math.round(allTimeRevenue * 100) / 100,
      adminProfit: {
        subscriptionProfitToday: Math.round(totalSubscriptionProfit * 100) / 100,
        starterProfit: Math.round(starterDailyProfit * 100) / 100,
        proProfit: Math.round(proDailyProfit * 100) / 100,
        eliteProfit: Math.round(eliteDailyProfit * 100) / 100,
        minutesProfit: Math.round(totalMinutesProfit * 100) / 100,
        minutesProfitToday: Math.round(minutesProfitToday * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        totalCallBalances: Math.round(totalCallBalances * 100) / 100,
        allTimeSubscriptionRevenue: Math.round(allTimeSubscriptionRevenue * 100) / 100,
      },
      chartData: {
        last30Days,
        last12Months,
      },
      health: {
        pendingSetups,
        lowBalanceUsers,
        expiringTrials,
      },
      recentActivity: recentCallsWithProfiles?.map(call => ({
        id: call.id,
        userName: call.profiles?.full_name || 'Unknown',
        userTier: call.profiles?.subscription_tier || 'none',
        outcome: call.outcome,
        createdAt: call.created_at,
      })) || [],
    });

  } catch (error: any) {
    console.error('Error fetching admin metrics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

