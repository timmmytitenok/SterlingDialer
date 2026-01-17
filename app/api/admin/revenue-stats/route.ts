import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover' as any,
});

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
    // PRO = $379/month, VIP = lifetime (no recurring charges)
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
    const stripeSubscriptionRevenue = totalSubMonths * 379; // $379 per month (revenue is same for both)
    // Commission structure: 50% first month ($189.50), 30% recurring ($113.70)
    // For revenue tracking, we use 30% recurring as the average since most months are recurring
    const commissionsPaid = referredMonths * 113.70; // 30% of $379 = $113.70 per recurring month
    
    console.log(`💰 Subscription breakdown:`);
    console.log(`   Total months: ${totalSubMonths}`);
    console.log(`   Direct (not referred): ${directMonths} months`);
    console.log(`   Referred: ${referredMonths} months`);
    console.log(`   Commissions paid: $${commissionsPaid}`);

    // ============================================
    // 2. CALL MINUTES REVENUE (REFILLS) - DIRECT FROM STRIPE
    // ============================================
    
    console.log('💰 Fetching balance refills DIRECTLY from Stripe...');
    
    // Calculate date range - get payments from the last year
    const oneYearAgo = Math.floor(Date.now() / 1000) - (365 * 24 * 60 * 60);
    
    // Fetch all successful PaymentIntents from Stripe
    let allStripeRefills: any[] = [];
    let hasMore = true;
    let startingAfter: string | undefined = undefined;
    
    while (hasMore) {
      const params: any = {
        limit: 100,
        created: { gte: oneYearAgo },
      };
      if (startingAfter) {
        params.starting_after = startingAfter;
      }
      
      const paymentIntents = await stripe.paymentIntents.list(params);
      
      // Filter for balance refills (they have type: 'balance_refill' in metadata)
      const refills = paymentIntents.data.filter(
        (pi) => pi.metadata?.type === 'balance_refill' && pi.status === 'succeeded'
      );
      
      allStripeRefills = [...allStripeRefills, ...refills];
      
      hasMore = paymentIntents.has_more;
      if (paymentIntents.data.length > 0) {
        startingAfter = paymentIntents.data[paymentIntents.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }
    
    console.log(`✅ Found ${allStripeRefills.length} balance refill payments DIRECTLY from Stripe!`);
    
    // Transform Stripe data to match our expected format
    const refillTransactions = allStripeRefills.map((pi) => ({
      amount: pi.amount / 100, // Convert cents to dollars
      created_at: new Date(pi.created * 1000).toISOString(),
      type: pi.metadata?.is_first_refill === 'true' ? 'first_refill' : 'credit',
      stripe_payment_intent_id: pi.id,
      user_id: pi.metadata?.user_id || null,
    }));
    
    // Log recent refills for debugging
    console.log('🔍 Recent Stripe refills:');
    refillTransactions.slice(0, 10).forEach((t: any, i: number) => {
      console.log(`   ${i + 1}. Amount: $${t.amount}, User: ${t.user_id?.substring(0, 8)}..., Date: ${t.created_at}`);
    });
    
    // Get all unique user IDs from refills to fetch their cost_per_minute
    const refillUserIds = [...new Set(refillTransactions?.map((t: any) => t.user_id).filter(Boolean) || [])];
    
    // Fetch cost_per_minute for all users with refills
    const { data: userProfiles } = await supabase
      .from('profiles')
      .select('user_id, cost_per_minute')
      .in('user_id', refillUserIds.length > 0 ? refillUserIds : ['none']);
    
    const userCostMap = new Map<string, number>();
    userProfiles?.forEach((p: any) => {
      userCostMap.set(p.user_id, p.cost_per_minute || 0.65);
    });
    
    // AI cost per minute (your expense)
    const AI_COST_PER_MINUTE = 0.15;
    const STRIPE_FEE_PERCENT = 0.03; // 3%
    
    // DEBUG: Log all transactions
    if (refillTransactions && refillTransactions.length > 0) {
      console.log('📋 STRIPE REFILL TRANSACTIONS DETAILS:');
      refillTransactions.forEach((t: any, i: number) => {
        const userRate = userCostMap.get(t.user_id) || 0.35;
        console.log(`   ${i + 1}. Amount: $${t.amount}, User Rate: $${userRate}/min, Type: ${t.type}, Date: ${t.created_at}`);
      });
    } else {
      console.log('⚠️ NO BALANCE REFILL PAYMENTS FOUND IN STRIPE!');
    }

    const minutesRevenue = refillTransactions?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;
    const totalRefills = refillTransactions?.length || 0; // Count actual transactions, not calculate from amount
    console.log(`💵 Minutes Revenue: $${minutesRevenue}, Total Refills: ${totalRefills}`);

    // ============================================
    // 3. TIME-BASED BREAKDOWN (ALWAYS USE EST)
    // ============================================
    
    // Get current time in EST for consistent day reset across all users
    const now = new Date();
    const estNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const today = new Date(estNow.getFullYear(), estNow.getMonth(), estNow.getDate());
    // Convert back to UTC for database queries
    const todayUTC = new Date(today.toLocaleString('en-US', { timeZone: 'UTC' }));
    const last7Days = new Date(todayUTC.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(todayUTC.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    console.log(`📅 Admin stats using EST timezone - Today starts at: ${today.toISOString()}`);

    // Today's revenue
    const todayRefills = refillTransactions?.filter((t: any) => {
      const tDate = new Date(t.created_at);
      return tDate >= today;
    }).reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;

    const todaySubs = activeSubscriptions.filter((s: any) => {
      const sDate = new Date(s.created_at);
      return sDate >= today;
    }).length * 379;

    // Last 7 days
    const last7DaysRefills = refillTransactions?.filter((t: any) => {
      const tDate = new Date(t.created_at);
      return tDate >= last7Days;
    }).reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;

    const last7DaysSubs = activeSubscriptions.filter((s: any) => {
      const sDate = new Date(s.created_at);
      return sDate >= last7Days;
    }).length * 379;

    // Last 30 days
    const last30DaysRefills = refillTransactions?.filter((t: any) => {
      const tDate = new Date(t.created_at);
      return tDate >= last30Days;
    }).reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;

    const last30DaysSubs = activeSubscriptions.filter((s: any) => {
      const sDate = new Date(s.created_at);
      return sDate >= last30Days;
    }).length * 379;

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

    // DEBUG: Log all custom revenue items to see what's being fetched
    if (customRevenueForCharts.length > 0) {
      console.log('📋 Custom revenue items for charts:');
      customRevenueForCharts.forEach((item: any, i: number) => {
        console.log(`   ${i + 1}. Date: ${item.date}, Category: "${item.category}", Amount: $${item.amount}`);
      });
    }

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
      }).length * 379;

      // Custom revenue - normalize date and get all matching entries for this day
      const dayCustomItems = customRevenueForCharts.filter((item: any) => {
        const itemDateStr = typeof item.date === 'string' ? item.date.split('T')[0] : new Date(item.date).toISOString().split('T')[0];
        return itemDateStr === dateStr;
      });

      // Balance Refill category → goes to minutesRevenue
      const dayCustomRefills = dayCustomItems
        .filter((item: any) => item.category === 'Balance Refill')
        .reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

      // Subscription category → goes to subscriptionRevenue  
      const dayCustomSubs = dayCustomItems
        .filter((item: any) => item.category === 'Subscription')
        .reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

      // All OTHER categories → also goes to minutesRevenue (so they appear in chart)
      const dayCustomOther = dayCustomItems
        .filter((item: any) => item.category !== 'Balance Refill' && item.category !== 'Subscription')
        .reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

      const totalMinutes = dayRefills + dayCustomRefills + dayCustomOther;
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
      }).length * 379;

      // Custom revenue - normalize date and get all matching entries for this day
      const dayCustomItems = customRevenueForCharts.filter((item: any) => {
        const itemDateStr = typeof item.date === 'string' ? item.date.split('T')[0] : new Date(item.date).toISOString().split('T')[0];
        return itemDateStr === dateStr;
      });

      // Balance Refill category → goes to minutesRevenue
      const dayCustomRefills = dayCustomItems
        .filter((item: any) => item.category === 'Balance Refill')
        .reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

      // Subscription category → goes to subscriptionRevenue  
      const dayCustomSubs = dayCustomItems
        .filter((item: any) => item.category === 'Subscription')
        .reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

      // All OTHER categories → also goes to minutesRevenue (so they appear in chart)
      const dayCustomOther = dayCustomItems
        .filter((item: any) => item.category !== 'Balance Refill' && item.category !== 'Subscription')
        .reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

      const totalMinutes = dayRefills + dayCustomRefills + dayCustomOther;
      const totalSubs = daySubs + dayCustomSubs;

      chartData7Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        minutesRevenue: totalMinutes,
        subscriptionRevenue: totalSubs,
        totalRevenue: totalMinutes + totalSubs,
      });
    }

    // ============================================
    // 7. CHART DATA (Last 12 Months) - Including Custom Revenue (Using EST)
    // ============================================
    
    const chartData12Months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(estNow.getFullYear(), estNow.getMonth() - i, 1);
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
      }).length * 379;

      // Custom revenue for this month - normalize dates and filter by month range
      const monthCustomItems = customRevenueForCharts.filter((item: any) => {
        const itemDateStr = typeof item.date === 'string' ? item.date.split('T')[0] : item.date;
        const itemDate = new Date(itemDateStr + 'T00:00:00'); // Ensure consistent parsing
        return itemDate >= monthStart && itemDate < monthEnd;
      });

      // Balance Refill category → goes to minutesRevenue
      const monthCustomRefills = monthCustomItems
        .filter((item: any) => item.category === 'Balance Refill')
        .reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

      // Subscription category → goes to subscriptionRevenue
      const monthCustomSubs = monthCustomItems
        .filter((item: any) => item.category === 'Subscription')
        .reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

      // All OTHER categories → also goes to minutesRevenue (so they appear in chart)
      const monthCustomOther = monthCustomItems
        .filter((item: any) => item.category !== 'Balance Refill' && item.category !== 'Subscription')
        .reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

      const totalMinutes = monthRefills + monthCustomRefills + monthCustomOther;
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

    // Active AI Users (users with AI dialer UNBLOCKED)
    // ai_maintenance_mode = false means UNBLOCKED/ACTIVE
    // Exclude admin accounts (Timmy and Sterling Demo) from stats
    const ADMIN_USER_IDS = [
      'd33602b3-4b0c-4ec7-938d-7b1d31722dc5', // Timmy
      '7619c63f-fcc3-4ff3-83ac-33595b5640a5', // Sterling Demo
    ];
    
    // Get users with AI dialer unblocked (ai_maintenance_mode = false)
    const { data: activeProfiles, error: activeError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('ai_maintenance_mode', false);
    
    if (activeError) throw activeError;
    
    // Filter out admin accounts from active users count
    const activeUsers = activeProfiles?.filter((p: any) => !ADMIN_USER_IDS.includes(p.user_id)).length || 0;
    
    // Still need retell configs for VIP check below
    const { data: retellConfigs, error: retellError } = await supabase
      .from('user_retell_config')
      .select('user_id, retell_agent_id, phone_number')
      .not('retell_agent_id', 'is', null)
      .not('phone_number', 'is', null);
    
    if (retellError) throw retellError;

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
    // EXCLUDE ADMIN ACCOUNTS (Timmy's test calls) from ALL today stats
    
    // Total calls today (excluding admin accounts)
    const { count: totalCallsToday, error: callsError } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())
      .not('user_id', 'in', `(${ADMIN_USER_IDS.join(',')})`);

    if (callsError) throw callsError;

    // Connected calls today (excluding admin accounts)
    const { count: connectedCallsToday, error: connectedError } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())
      .or('disposition.eq.answered,connected.eq.true')
      .not('user_id', 'in', `(${ADMIN_USER_IDS.join(',')})`);

    if (connectedError) throw connectedError;

    // Appointments booked today (excluding admin accounts)
    const { count: appointmentsToday, error: apptsError } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())
      .eq('outcome', 'appointment_booked')
      .not('user_id', 'in', `(${ADMIN_USER_IDS.join(',')})`);

    if (apptsError) throw apptsError;
    
    // Active Users Today = distinct users who made at least 1 call today
    // Fetch only user_id column to get distinct users (increase limit to handle high volume days)
    const { data: todayUserIds, error: usersError } = await supabase
      .from('calls')
      .select('user_id')
      .gte('created_at', today.toISOString())
      .not('user_id', 'in', `(${ADMIN_USER_IDS.join(',')})`)
      .limit(50000); // High limit to handle busy days

    if (usersError) throw usersError;

    // Filter out admin accounts from unique users today
    const uniqueUsersToday = new Set(
      todayUserIds?.map((c: any) => c.user_id)
        .filter((userId: string) => userId && !ADMIN_USER_IDS.includes(userId))
    );
    const activeUsersToday = uniqueUsersToday.size;

    // All-time calls (excluding demo/admin users)
    const { count: totalCallsAllTime, error: allCallsError } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .not('user_id', 'in', `(${ADMIN_USER_IDS.join(',')})`);

    if (allCallsError) throw allCallsError;

    // All-time appointments (excluding demo/admin users)
    const { count: totalAppointmentsAllTime, error: allApptsError } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .eq('outcome', 'appointment_booked')
      .not('user_id', 'in', `(${ADMIN_USER_IDS.join(',')})`);

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
    const customSubscriptionCount = Math.round(customSubscriptionRevenue / 379); // Each subscription is $379

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
    
    // Calculate minutes profit dynamically based on each user's cost per minute
    // Formula: Profit = Revenue - (Minutes × AI Cost) - Stripe Fee
    // Minutes = Revenue / User Rate
    // AI Cost = Minutes × $0.15/min
    // Stripe Fee = Revenue × 3%
    
    let minutesProfit = 0;
    let minutesExpense = 0;
    
    refillTransactions?.forEach((t: any) => {
      const refillAmount = t.amount || 0;
      const userRate = userCostMap.get(t.user_id) || 0.35; // Default $0.35/min if not found
      
      // Calculate minutes purchased at user's rate
      const minutesPurchased = refillAmount / userRate;
      
      // AI expense = minutes × $0.15/min
      const aiExpense = minutesPurchased * AI_COST_PER_MINUTE;
      
      // Stripe fee = 3% of revenue
      const stripeFee = refillAmount * STRIPE_FEE_PERCENT;
      
      // Profit = Revenue - AI Expense - Stripe Fee
      const profit = refillAmount - aiExpense - stripeFee;
      
      minutesExpense += aiExpense;
      minutesProfit += profit;
    });
    
    // Round to 2 decimal places
    minutesProfit = Math.round(minutesProfit * 100) / 100;
    minutesExpense = Math.round(minutesExpense * 100) / 100;
    
    // Subscription profit:
    // - Not referred: $379 revenue - $11.37 Stripe fee = $367.63 profit
    // - Referred: $379 revenue - $113.70 commission (30%) - $11.37 Stripe fee = $253.93 profit
    const directSubProfit = directMonths * 367.63; // $367.63 profit per direct month
    const referredSubProfit = referredMonths * 253.93; // $253.93 profit per referred month (after 30% commission)
    const subscriptionProfit = directSubProfit + referredSubProfit;
    
    // Stripe fees breakdown
    const subscriptionStripeFees = totalSubMonths * 11; // $11 Stripe fee per $379 subscription (3%)
    const refillStripeFees = minutesRevenue * STRIPE_FEE_PERCENT; // 3% of total refill revenue
    const totalStripeFees = subscriptionStripeFees + refillStripeFees;
    
    // Expenses: Stripe fees + commissions paid + custom expenses
    const subscriptionExpense = subscriptionStripeFees + commissionsPaid;
    
    // Combine Stripe revenue with custom revenue
    const totalSubscriptionRevenue = stripeSubscriptionRevenue + customSubscriptionRevenue;
    
    // Add manual Balance Refill entries from custom_revenue_expenses
    // (Auto-tracking was removed, so new entries are legitimate manual additions)
    const totalMinutesRevenue = minutesRevenue + customBalanceRefillRevenue;
    
    // Calculate profit for manual Balance Refill entries
    // Formula: profit_margin = 1 - (AI_cost / user_rate) = 1 - (0.15 / 0.35) = 57.14%
    // For manual entries without user_id, we use the default $0.35/min rate
    const DEFAULT_USER_RATE = 0.35;
    const CUSTOM_REFILL_PROFIT_MARGIN = 1 - (AI_COST_PER_MINUTE / DEFAULT_USER_RATE); // 62.5%
    const customBalanceRefillProfit = customBalanceRefillRevenue * CUSTOM_REFILL_PROFIT_MARGIN;
    const customBalanceRefillExpense = customBalanceRefillRevenue * (AI_COST_PER_MINUTE / DEFAULT_USER_RATE); // 37.5%
    
    console.log(`💵 Custom Balance Refill profit calculation:`);
    console.log(`   Revenue: $${customBalanceRefillRevenue}`);
    console.log(`   Profit margin: ${(CUSTOM_REFILL_PROFIT_MARGIN * 100).toFixed(1)}%`);
    console.log(`   Profit: $${customBalanceRefillProfit.toFixed(2)}`);
    console.log(`   Expense (AI cost): $${customBalanceRefillExpense.toFixed(2)}`);
    
    const totalRevenue = totalSubscriptionRevenue + totalMinutesRevenue + otherCustomRevenue; // All revenue sources
    
    // Minutes profit = Stripe minutes profit + custom balance refill profit (62.5% margin)
    const totalMinutesProfit = minutesProfit + customBalanceRefillProfit;
    
    // Minutes expense = AI costs only (37.5% of revenue)
    const totalMinutesExpense = minutesExpense + customBalanceRefillExpense;
    
    // For the cards: show ONLY minutes-related profit and expense (keeps 62.5% margin)
    const totalProfit = totalMinutesProfit;
    const totalExpenses = totalMinutesExpense;
    
    console.log(`💰 Profit breakdown (62.5% margin on balance refills):`);
    console.log(`   Stripe minutes profit: $${minutesProfit.toFixed(2)} (${totalRefills} Stripe refills)`);
    console.log(`   Custom balance refill profit: $${customBalanceRefillProfit.toFixed(2)} (${customBalanceRefillCount} manual refills)`);
    console.log(`   Total Minutes Profit: $${totalMinutesProfit.toFixed(2)}`);
    console.log(`   Total Minutes Expense (AI cost): $${totalMinutesExpense.toFixed(2)}`);

    // ============================================
    // 11. PLATFORM OVERVIEW STATS
    // ============================================
    
    console.log('📊 Fetching platform overview stats...');
    
    // Total Call Balance Reserve - sum of all user balances from call_balance table (excluding admin accounts)
    const { data: balanceData, error: balanceError } = await supabase
      .from('call_balance')
      .select('user_id, balance');
    
    if (balanceError) {
      console.error('⚠️ Error fetching call balances:', balanceError);
    }
    
    // Filter out admin accounts and sum balances
    const totalCallBalanceReserve = balanceData
      ?.filter((b: any) => !ADMIN_USER_IDS.includes(b.user_id))
      .reduce((sum: number, b: any) => sum + (b.balance || 0), 0) || 0;
    
    console.log(`💰 Total Call Balance Reserve: $${totalCallBalanceReserve.toFixed(2)}`);
    console.log(`   (from ${balanceData?.filter((b: any) => !ADMIN_USER_IDS.includes(b.user_id)).length || 0} user accounts)`);
    
    // Active Users in Last 7 Days - ONLY users who actually ran AI (made calls)
    const { data: calledUsers7Days, error: callsError7d } = await supabase
      .from('calls')
      .select('user_id')
      .gte('created_at', last7Days.toISOString());
    
    if (callsError7d) {
      console.error('⚠️ Error fetching users who made calls:', callsError7d);
    }
    
    // Get unique users who made calls (excluding admin accounts)
    const activeUsers7DaysSet = new Set<string>();
    calledUsers7Days?.forEach((c: any) => {
      if (c.user_id && !ADMIN_USER_IDS.includes(c.user_id)) {
        activeUsers7DaysSet.add(c.user_id);
      }
    });
    
    const activeUsersLast7Days = activeUsers7DaysSet.size;
    console.log(`👥 Active Users (Last 7 Days - ran AI): ${activeUsersLast7Days}`);

    // ============================================
    // 12. RETURN DATA
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
        // Expense breakdown
        aiCosts: minutesExpense, // $12.50 per refill for AI
        stripeFees: totalStripeFees, // 3% Stripe fees (subs + refills)
        subscriptionStripeFees,
        refillStripeFees,
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
        activeUsersLast7Days: activeUsersLast7Days, // Users who logged in or made calls in last 7 days
        proAccess: proUsers, // Pro subscribers only (excluding VIP)
        vipAccess: vipUsers, // VIP subscribers only
        conversionRate: totalUsers && totalUsers > 0 ? ((proUsers / totalUsers) * 100).toFixed(1) : '0.0',
        avgRevenuePerUser: activeUsers && activeUsers > 0 ? (totalRevenue / activeUsers).toFixed(0) : '0',
      },
      
      // Platform overview
      platform: {
        totalCallBalanceReserve: Math.round(totalCallBalanceReserve * 100) / 100, // Round to 2 decimals
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

