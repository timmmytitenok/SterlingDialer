import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    console.log('🔍 Admin Revenue Stats API - Starting...');
    
    const adminMode = await isAdminMode();
    if (!adminMode) {
      console.error('❌ Admin access denied');
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabase = createServiceRoleClient();
    console.log('✅ Admin access granted');

    // ============================================
    // 1. SUBSCRIPTION REVENUE & DATA
    // ============================================
    
    // Get all subscription payments from Stripe (via subscriptions table)
    console.log('📊 Fetching subscriptions...');
    const { data: allSubscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('user_id, subscription_tier, status, created_at, current_period_end, stripe_subscription_id')
      .in('subscription_tier', ['pro', 'vip']); // Only count paid tiers

    if (subsError) {
      console.error('❌ Error fetching subscriptions:', subsError);
      throw subsError;
    }
    console.log(`✅ Found ${allSubscriptions?.length || 0} subscriptions`);

    // Calculate subscription revenue
    // PRO = $499/month, VIP = lifetime (no recurring charges)
    // Only count 'active' or 'trialing' subscriptions that have been billed
    const activeSubscriptions = allSubscriptions?.filter((s: any) => 
      s.status === 'active' && s.subscription_tier === 'pro' && s.stripe_subscription_id
    ) || [];

    // Count total subscription months billed (estimate based on created_at)
    // Track referred vs non-referred for profit calculation
    let totalSubMonths = 0;
    let referredMonths = 0;
    let directMonths = 0;

    // Check referral status for each subscription
    for (const sub of activeSubscriptions) {
      const createdDate = new Date(sub.created_at);
      const now = new Date();
      const monthsDiff = Math.max(1, Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
      
      totalSubMonths += monthsDiff;

      // Check if this user was referred
      const { data: referral } = await supabase
        .from('referrals')
        .select('id')
        .eq('referee_id', sub.user_id)
        .eq('status', 'completed')
        .maybeSingle();

      if (referral) {
        referredMonths += monthsDiff;
      } else {
        directMonths += monthsDiff;
      }
    }

    // Revenue from Stripe subscriptions
    const stripeSubscriptionRevenue = totalSubMonths * 499; // $499 per month (revenue is same for both)
    const commissionsPaid = referredMonths * 100; // $100 commission per referred month
    
    console.log(`💰 Subscription breakdown:`);
    console.log(`   Total months: ${totalSubMonths}`);
    console.log(`   Direct (not referred): ${directMonths} months`);
    console.log(`   Referred: ${referredMonths} months`);
    console.log(`   Commissions paid: $${commissionsPaid}`);

    // ============================================
    // 2. CALL MINUTES REVENUE (REFILLS)
    // ============================================
    
    console.log('💰 Fetching refill transactions (Stripe payments only)...');
    const { data: refillTransactions, error: refillError } = await supabase
      .from('balance_transactions')
      .select('amount, created_at, type, stripe_payment_intent_id')
      .not('stripe_payment_intent_id', 'is', null) // Must have Stripe payment ID (real customer payments)
      .gte('amount', 0); // Only positive amounts (credits, not deductions)

    if (refillError) {
      console.error('❌ Error fetching refill transactions:', refillError);
      throw refillError;
    }
    console.log(`✅ Found ${refillTransactions?.length || 0} real Stripe refill transactions`);
    console.log(`   (Admin adjustments excluded from revenue)`);
    
    // DEBUG: Log all transactions
    if (refillTransactions && refillTransactions.length > 0) {
      console.log('📋 REFILL TRANSACTIONS DETAILS:');
      refillTransactions.forEach((t: any, i: number) => {
        console.log(`   ${i + 1}. Amount: $${t.amount}, Type: ${t.type}, Date: ${t.created_at}, PI: ${t.stripe_payment_intent_id?.substring(0, 20)}...`);
      });
    } else {
      console.log('⚠️ NO REFILL TRANSACTIONS FOUND IN DATABASE!');
    }

    const minutesRevenue = refillTransactions?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;
    const totalRefills = refillTransactions?.length || 0; // Count actual transactions, not calculate from amount
    console.log(`💵 Minutes Revenue: $${minutesRevenue}, Total Refills: ${totalRefills}`);

    // ============================================
    // 3. TIME-BASED BREAKDOWN
    // ============================================
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Today's revenue
    const todayRefills = refillTransactions?.filter((t: any) => {
      const tDate = new Date(t.created_at);
      return tDate >= today;
    }).reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;

    const todaySubs = activeSubscriptions.filter((s: any) => {
      const sDate = new Date(s.created_at);
      return sDate >= today;
    }).length * 499;

    // Last 7 days
    const last7DaysRefills = refillTransactions?.filter((t: any) => {
      const tDate = new Date(t.created_at);
      return tDate >= last7Days;
    }).reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;

    const last7DaysSubs = activeSubscriptions.filter((s: any) => {
      const sDate = new Date(s.created_at);
      return sDate >= last7Days;
    }).length * 499;

    // Last 30 days
    const last30DaysRefills = refillTransactions?.filter((t: any) => {
      const tDate = new Date(t.created_at);
      return tDate >= last30Days;
    }).reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;

    const last30DaysSubs = activeSubscriptions.filter((s: any) => {
      const sDate = new Date(s.created_at);
      return sDate >= last30Days;
    }).length * 499;

    // ============================================
    // 4. FETCH CUSTOM REVENUE ITEMS EARLY (needed for charts)
    // ============================================
    
    console.log('💰 Fetching custom revenue/expenses for charts...');
    const { data: customItemsForCharts, error: customChartError } = await supabase
      .from('custom_revenue_expenses')
      .select('type, category, amount, date');

    if (customChartError) {
      console.error('⚠️ Error fetching custom items for charts:', customChartError);
    }

    const customRevenueForCharts = customItemsForCharts?.filter((item: any) => item.type === 'revenue') || [];
    console.log(`📊 Found ${customRevenueForCharts.length} custom revenue items for charts`);

    // ============================================
    // 5. CHART DATA (Last 30 Days) - Including Custom Revenue
    // ============================================
    
    const chartData30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dateEnd = new Date(dateStart.getTime() + 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format

      // Stripe refills
      const dayRefills = refillTransactions?.filter((t: any) => {
        const tDate = new Date(t.created_at);
        return tDate >= dateStart && tDate < dateEnd;
      }).reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;

      // Stripe subscriptions
      const daySubs = activeSubscriptions.filter((s: any) => {
        const sDate = new Date(s.created_at);
        return sDate >= dateStart && sDate < dateEnd;
      }).length * 499;

      // Custom revenue (Balance Refill category) - manual entries
      const dayCustomRefills = customRevenueForCharts.filter((item: any) => {
        return item.date === dateStr && item.category === 'Balance Refill';
      }).reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

      // Custom revenue (Subscription category)
      const dayCustomSubs = customRevenueForCharts.filter((item: any) => {
        return item.date === dateStr && item.category === 'Subscription';
      }).reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

      const totalMinutes = dayRefills + dayCustomRefills;
      const totalSubs = daySubs + dayCustomSubs;

      chartData30Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        minutesRevenue: totalMinutes,
        subscriptionRevenue: totalSubs,
        totalRevenue: totalMinutes + totalSubs,
      });
    }

    // ============================================
    // 6. CHART DATA (Last 7 Days) - Including Custom Revenue
    // ============================================
    
    const chartData7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dateEnd = new Date(dateStart.getTime() + 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];

      // Stripe refills
      const dayRefills = refillTransactions?.filter((t: any) => {
        const tDate = new Date(t.created_at);
        return tDate >= dateStart && tDate < dateEnd;
      }).reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;

      // Stripe subscriptions
      const daySubs = activeSubscriptions.filter((s: any) => {
        const sDate = new Date(s.created_at);
        return sDate >= dateStart && sDate < dateEnd;
      }).length * 499;

      // Custom revenue (Balance Refill category) - manual entries
      const dayCustomRefills = customRevenueForCharts.filter((item: any) => {
        return item.date === dateStr && item.category === 'Balance Refill';
      }).reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

      // Custom revenue (Subscription category)
      const dayCustomSubs = customRevenueForCharts.filter((item: any) => {
        return item.date === dateStr && item.category === 'Subscription';
      }).reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

      const totalMinutes = dayRefills + dayCustomRefills;
      const totalSubs = daySubs + dayCustomSubs;

      chartData7Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        minutesRevenue: totalMinutes,
        subscriptionRevenue: totalSubs,
        totalRevenue: totalMinutes + totalSubs,
      });
    }

    // ============================================
    // 7. CHART DATA (Last 12 Months) - Including Custom Revenue
    // ============================================
    
    const chartData12Months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1);

      // Stripe refills
      const monthRefills = refillTransactions?.filter((t: any) => {
        const tDate = new Date(t.created_at);
        return tDate >= monthStart && tDate < monthEnd;
      }).reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;

      // Stripe subscriptions
      const monthSubs = activeSubscriptions.filter((s: any) => {
        const sDate = new Date(s.created_at);
        return sDate >= monthStart && sDate < monthEnd;
      }).length * 499;

      // Custom revenue for this month (Balance Refill category) - manual entries
      const monthCustomRefills = customRevenueForCharts.filter((item: any) => {
        const itemDate = new Date(item.date);
        return itemDate >= monthStart && itemDate < monthEnd && item.category === 'Balance Refill';
      }).reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

      // Custom revenue for this month (Subscription category)
      const monthCustomSubs = customRevenueForCharts.filter((item: any) => {
        const itemDate = new Date(item.date);
        return itemDate >= monthStart && itemDate < monthEnd && item.category === 'Subscription';
      }).reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

      const totalMinutes = monthRefills + monthCustomRefills;
      const totalSubs = monthSubs + monthCustomSubs;

      chartData12Months.push({
        date: date.toLocaleDateString('en-US', { month: 'short' }),
        minutesRevenue: totalMinutes,
        subscriptionRevenue: totalSubs,
        totalRevenue: totalMinutes + totalSubs,
      });
    }

    // ============================================
    // 7. USER STATS
    // ============================================
    
    // Total users
    const { count: totalUsers, error: userCountError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (userCountError) throw userCountError;

    // Active AI Users (users with AI configured)
    const { data: retellConfigs, error: retellError } = await supabase
      .from('user_retell_config')
      .select('user_id, retell_agent_id, phone_number')
      .not('retell_agent_id', 'is', null)
      .not('phone_number', 'is', null);
    
    if (retellError) throw retellError;
    const activeUsers = retellConfigs?.length || 0;

    // Pro access users (active pro subscriptions ONLY - exclude VIP)
    const proUsers = allSubscriptions?.filter((s: any) => 
      s.status === 'active' && s.subscription_tier === 'pro'
    ).length || 0;

    // VIP users - check BOTH subscriptions table AND profiles table (is_vip = true)
    // BUT only count if they have AI configured!
    
    // Also check profiles table for is_vip = true
    const { data: vipProfiles, error: vipProfilesError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('is_vip', true);
    
    if (vipProfilesError) {
      console.error('❌ Error fetching VIP profiles:', vipProfilesError);
    }
    
    // Get unique VIP user IDs (combine both sources, avoid duplicates)
    const vipUserIds = new Set<string>();
    
    // Add VIP users from subscriptions
    allSubscriptions?.filter((s: any) => s.status === 'active' && s.subscription_tier === 'vip')
      .forEach((s: any) => vipUserIds.add(s.user_id));
    
    // Add VIP users from profiles
    vipProfiles?.forEach((p: any) => vipUserIds.add(p.user_id));
    
    // Get set of user IDs who have AI configured
    const configuredUserIds = new Set(retellConfigs?.map((r: any) => r.user_id) || []);
    
    // Only count VIP users who ALSO have AI configured
    const vipUsers = Array.from(vipUserIds).filter(userId => configuredUserIds.has(userId)).length;

    // ============================================
    // 8. CALL ACTIVITY STATS
    // ============================================
    
    // Today's calls - use COUNT queries to avoid 1000 row limit!
    // Total calls today
    const { count: totalCallsToday, error: callsError } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    if (callsError) throw callsError;

    // Connected calls today (answered or connected)
    const { count: connectedCallsToday, error: connectedError } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())
      .or('disposition.eq.answered,connected.eq.true');

    if (connectedError) throw connectedError;

    // Appointments booked today
    const { count: appointmentsToday, error: apptsError } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())
      .eq('outcome', 'appointment_booked');

    if (apptsError) throw apptsError;
    
    // Active Users Today = distinct users who made at least 1 call today
    // Fetch only user_id column to get distinct users (increase limit to handle high volume days)
    const { data: todayUserIds, error: usersError } = await supabase
      .from('calls')
      .select('user_id')
      .gte('created_at', today.toISOString())
      .limit(50000); // High limit to handle busy days

    if (usersError) throw usersError;

    const uniqueUsersToday = new Set(todayUserIds?.map((c: any) => c.user_id).filter(Boolean));
    const activeUsersToday = uniqueUsersToday.size;

    // All-time calls
    const { count: totalCallsAllTime, error: allCallsError } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true });

    if (allCallsError) throw allCallsError;

    // All-time appointments
    const { count: totalAppointmentsAllTime, error: allApptsError } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .eq('outcome', 'appointment_booked');

    if (allApptsError) throw allApptsError;

    // ============================================
    // 9. CUSTOM REVENUE & EXPENSES (Production, Consulting, etc.)
    // ============================================
    
    console.log('💰 Fetching custom revenue and expenses...');
    const { data: customItems, error: customItemsError } = await supabase
      .from('custom_revenue_expenses')
      .select('type, category, amount, date, description');

    if (customItemsError) {
      console.error('❌ Error fetching custom revenue/expenses:', customItemsError);
      // Don't throw - just continue without custom items
    }

    // Separate revenue and expenses
    const customRevenueItems = customItems?.filter((item: any) => item.type === 'revenue') || [];
    const customExpenseItems = customItems?.filter((item: any) => item.type === 'expense') || [];

    // Separate custom revenue by type
    const customSubscriptionItems = customRevenueItems.filter((item: any) => item.category === 'Subscription');
    const customBalanceRefillItems = customRevenueItems.filter((item: any) => item.category === 'Balance Refill');
    const otherCustomRevenueItems = customRevenueItems.filter((item: any) => 
      item.category !== 'Subscription' && item.category !== 'Balance Refill'
    );

    const customSubscriptionRevenue = customSubscriptionItems.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
    const customBalanceRefillRevenue = customBalanceRefillItems.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
    const otherCustomRevenue = otherCustomRevenueItems.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
    
    // Count manual uploads (each entry represents quantity, so we need to count how many $25 chunks)
    const customBalanceRefillCount = Math.round(customBalanceRefillRevenue / 25); // Each refill is $25
    const customSubscriptionCount = Math.round(customSubscriptionRevenue / 499); // Each subscription is $499

    const totalCustomRevenue = customSubscriptionRevenue + customBalanceRefillRevenue + otherCustomRevenue;
    const totalCustomExpenses = customExpenseItems.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
    
    console.log(`💵 Custom Subscriptions: ${customSubscriptionCount} (${customSubscriptionRevenue})`);
    console.log(`💵 Custom Balance Refills: ${customBalanceRefillCount} (${customBalanceRefillRevenue})`);
    console.log(`💵 Other Custom Revenue: $${otherCustomRevenue}`);
    console.log(`💵 Total Custom Revenue: $${totalCustomRevenue}`);
    console.log(`💵 Total Custom Expenses: $${totalCustomExpenses}`);

    // Group custom expenses by category for breakdown
    const customExpensesByCategory: { [key: string]: number } = {};
    customExpenseItems.forEach((exp: any) => {
      if (!customExpensesByCategory[exp.category]) {
        customExpensesByCategory[exp.category] = 0;
      }
      customExpensesByCategory[exp.category] += exp.amount || 0;
    });

    // Group custom revenue by category for breakdown
    const customRevenueByCategory: { [key: string]: number } = {};
    customRevenueItems.forEach((rev: any) => {
      if (!customRevenueByCategory[rev.category]) {
        customRevenueByCategory[rev.category] = 0;
      }
      customRevenueByCategory[rev.category] += rev.amount || 0;
    });

    // ============================================
    // 10. PROFIT CALCULATIONS
    // ============================================
    
    // Call minutes profit: $14.25 per $25 refill (already accounts for AI cost + Stripe fee)
    const minutesProfit = totalRefills * 14.25;
    const minutesExpense = totalRefills * 10.75; // $10.75 expense per refill (AI + Stripe)
    
    // Subscription profit:
    // - Not referred: $499 revenue - $15 Stripe fee = $484 profit
    // - Referred: $499 revenue - $100 commission - $15 Stripe fee = $384 profit
    const directSubProfit = directMonths * 484; // $484 profit per direct month
    const referredSubProfit = referredMonths * 384; // $384 profit per referred month
    const subscriptionProfit = directSubProfit + referredSubProfit;
    
    // Expenses: Stripe fees (3% ≈ $15/month) + commissions paid + custom expenses
    const stripeFees = totalSubMonths * 15; // $15 Stripe fee per $499 subscription
    const subscriptionExpense = stripeFees + commissionsPaid;
    
    // Combine Stripe revenue with custom revenue
    const totalSubscriptionRevenue = stripeSubscriptionRevenue + customSubscriptionRevenue;
    
    // Add manual Balance Refill entries from custom_revenue_expenses
    // (Auto-tracking was removed, so new entries are legitimate manual additions)
    const totalMinutesRevenue = minutesRevenue + customBalanceRefillRevenue;
    
    const totalRevenue = totalSubscriptionRevenue + totalMinutesRevenue + otherCustomRevenue; // All revenue sources
    const totalProfit = minutesProfit + subscriptionProfit + totalCustomRevenue - totalCustomExpenses; // Add custom revenue, subtract custom expenses
    const totalExpenses = minutesExpense + subscriptionExpense + totalCustomExpenses; // Add custom expenses to total
    
    console.log(`💰 Profit breakdown:`);
    console.log(`   Minutes profit: $${minutesProfit.toFixed(2)} (${totalRefills} refills)`);
    console.log(`   Direct subs profit: $${directSubProfit.toFixed(2)} (${directMonths} months × $484)`);
    console.log(`   Referred subs profit: $${referredSubProfit.toFixed(2)} (${referredMonths} months × $384)`);
    console.log(`   Total subscription profit: $${subscriptionProfit.toFixed(2)}`);
    console.log(`   Custom revenue: $${totalCustomRevenue.toFixed(2)}`);
    console.log(`   Custom expenses: $${totalCustomExpenses.toFixed(2)}`);

    // ============================================
    // 11. RETURN DATA
    // ============================================
    
    console.log('✅ Returning revenue stats...');
    console.log(`   Total Revenue: $${totalRevenue}`);
    console.log(`   Total Profit: $${totalProfit}`);
    console.log(`   Total Expenses: $${totalExpenses}`);

    return NextResponse.json({
      // All-time totals
      allTime: {
        subscriptionRevenue: totalSubscriptionRevenue, // Includes custom subscriptions
        minutesRevenue: totalMinutesRevenue, // Includes custom balance refills
        customRevenue: otherCustomRevenue, // Only "other" custom revenue (not subscriptions or refills)
        customSubscriptionRevenue, // Separate for breakdown
        customBalanceRefillRevenue, // Separate for breakdown
        customSubscriptionCount, // Count of manual subscriptions
        customBalanceRefillCount, // Count of manual refills
        totalRevenue,
        totalProfit,
        totalExpenses,
        totalSubMonths,
        directSubMonths: directMonths,
        referredSubMonths: referredMonths,
        totalRefills,
        commissionsPaid,
        customExpenses: totalCustomExpenses,
        customExpensesByCategory,
        customRevenueByCategory,
      },
      
      // Time-based breakdowns
      today: {
        minutesRevenue: todayRefills,
        subscriptionRevenue: todaySubs,
        totalRevenue: todayRefills + todaySubs,
      },
      last7Days: {
        minutesRevenue: last7DaysRefills,
        subscriptionRevenue: last7DaysSubs,
        totalRevenue: last7DaysRefills + last7DaysSubs,
      },
      last30Days: {
        minutesRevenue: last30DaysRefills,
        subscriptionRevenue: last30DaysSubs,
        totalRevenue: last30DaysRefills + last30DaysSubs,
      },
      
      // Chart data
      charts: {
        last7Days: chartData7Days,
        last30Days: chartData30Days,
        last12Months: chartData12Months,
      },
      
      // User stats
      users: {
        total: totalUsers || 0,
        activeUsers: activeUsers, // Users with AI configured
        activeUsersToday: activeUsersToday, // Users who made at least 1 call today
        proAccess: proUsers, // Pro subscribers only (excluding VIP)
        vipAccess: vipUsers, // VIP subscribers only
        conversionRate: totalUsers && totalUsers > 0 ? ((proUsers / totalUsers) * 100).toFixed(1) : '0.0',
        avgRevenuePerUser: activeUsers && activeUsers > 0 ? (totalRevenue / activeUsers).toFixed(0) : '0',
      },
      
      // Call activity
      calls: {
        today: {
          total: totalCallsToday || 0,
          connected: connectedCallsToday || 0,
          connectionRate: totalCallsToday && totalCallsToday > 0 ? (((connectedCallsToday || 0) / totalCallsToday) * 100).toFixed(1) : '0.0',
          appointments: appointmentsToday || 0,
        },
        allTime: {
          total: totalCallsAllTime || 0,
          appointments: totalAppointmentsAllTime || 0,
          callsPerAppointment: totalAppointmentsAllTime && totalAppointmentsAllTime > 0 
            ? ((totalCallsAllTime || 0) / totalAppointmentsAllTime).toFixed(1) 
            : '0.0',
        },
      },
    });

  } catch (error: any) {
    console.error('❌ Error fetching revenue stats:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

