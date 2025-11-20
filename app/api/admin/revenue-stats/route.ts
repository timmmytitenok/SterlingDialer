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
      .select('user_id, tier, status, created_at, current_period_end, stripe_subscription_id')
      .in('tier', ['pro', 'vip']); // Only count paid tiers

    if (subsError) {
      console.error('❌ Error fetching subscriptions:', subsError);
      throw subsError;
    }
    console.log(`✅ Found ${allSubscriptions?.length || 0} subscriptions`);

    // Calculate subscription revenue
    // PRO = $499/month, VIP = lifetime (no recurring charges)
    // Only count 'active' or 'trialing' subscriptions that have been billed
    const activeSubscriptions = allSubscriptions?.filter((s: any) => 
      s.status === 'active' && s.tier === 'pro' && s.stripe_subscription_id
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

    const subscriptionRevenue = totalSubMonths * 499; // $499 per month (revenue is same for both)
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
    // 4. CHART DATA (Last 30 Days)
    // ============================================
    
    const chartData30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dateEnd = new Date(dateStart.getTime() + 24 * 60 * 60 * 1000);

      const dayRefills = refillTransactions?.filter((t: any) => {
        const tDate = new Date(t.created_at);
        return tDate >= dateStart && tDate < dateEnd;
      }).reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;

      const daySubs = activeSubscriptions.filter((s: any) => {
        const sDate = new Date(s.created_at);
        return sDate >= dateStart && sDate < dateEnd;
      }).length * 499;

      chartData30Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        minutesRevenue: dayRefills,
        subscriptionRevenue: daySubs,
        totalRevenue: dayRefills + daySubs,
      });
    }

    // ============================================
    // 5. CHART DATA (Last 7 Days)
    // ============================================
    
    const chartData7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dateEnd = new Date(dateStart.getTime() + 24 * 60 * 60 * 1000);

      const dayRefills = refillTransactions?.filter((t: any) => {
        const tDate = new Date(t.created_at);
        return tDate >= dateStart && tDate < dateEnd;
      }).reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;

      const daySubs = activeSubscriptions.filter((s: any) => {
        const sDate = new Date(s.created_at);
        return sDate >= dateStart && sDate < dateEnd;
      }).length * 499;

      chartData7Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        minutesRevenue: dayRefills,
        subscriptionRevenue: daySubs,
        totalRevenue: dayRefills + daySubs,
      });
    }

    // ============================================
    // 6. CHART DATA (Last 12 Months)
    // ============================================
    
    const chartData12Months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1);

      const monthRefills = refillTransactions?.filter(t => {
        const tDate = new Date(t.created_at);
        return tDate >= monthStart && tDate < monthEnd;
      }).reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      const monthSubs = activeSubscriptions.filter(s => {
        const sDate = new Date(s.created_at);
        return sDate >= monthStart && sDate < monthEnd;
      }).length * 499;

      chartData12Months.push({
        date: date.toLocaleDateString('en-US', { month: 'short' }),
        minutesRevenue: monthRefills,
        subscriptionRevenue: monthSubs,
        totalRevenue: monthRefills + monthSubs,
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

    // Pro access users (active pro or vip subscriptions)
    const proUsers = allSubscriptions?.filter(s => 
      s.status === 'active' && (s.tier === 'pro' || s.tier === 'vip')
    ).length || 0;

    // ============================================
    // 8. CALL ACTIVITY STATS
    // ============================================
    
    // Today's calls
    const { data: todayCalls, error: callsError } = await supabase
      .from('calls')
      .select('*')
      .gte('created_at', today.toISOString());

    if (callsError) throw callsError;

    const totalCallsToday = todayCalls?.length || 0;
    const connectedCallsToday = todayCalls?.filter(c => 
      c.disposition === 'answered' || c.connected === true
    ).length || 0;
    const appointmentsToday = todayCalls?.filter(c => 
      c.outcome === 'appointment_booked'
    ).length || 0;

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
    // 9. PROFIT CALCULATIONS
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
    
    // Expenses: Stripe fees (3% ≈ $15/month) + commissions paid
    const stripeFees = totalSubMonths * 15; // $15 Stripe fee per $499 subscription
    const subscriptionExpense = stripeFees + commissionsPaid;
    
    const totalRevenue = subscriptionRevenue + minutesRevenue;
    const totalProfit = minutesProfit + subscriptionProfit;
    const totalExpenses = minutesExpense + subscriptionExpense;
    
    console.log(`💰 Profit breakdown:`);
    console.log(`   Minutes profit: $${minutesProfit.toFixed(2)} (${totalRefills} refills)`);
    console.log(`   Direct subs profit: $${directSubProfit.toFixed(2)} (${directMonths} months × $484)`);
    console.log(`   Referred subs profit: $${referredSubProfit.toFixed(2)} (${referredMonths} months × $384)`);
    console.log(`   Total subscription profit: $${subscriptionProfit.toFixed(2)}`);

    // ============================================
    // 10. RETURN DATA
    // ============================================
    
    console.log('✅ Returning revenue stats...');
    console.log(`   Total Revenue: $${totalRevenue}`);
    console.log(`   Total Profit: $${totalProfit}`);
    console.log(`   Total Expenses: $${totalExpenses}`);

    return NextResponse.json({
      // All-time totals
      allTime: {
        subscriptionRevenue,
        minutesRevenue,
        totalRevenue,
        totalProfit,
        totalExpenses,
        totalSubMonths,
        directSubMonths: directMonths,
        referredSubMonths: referredMonths,
        totalRefills,
        commissionsPaid,
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
        proAccess: proUsers,
        conversionRate: totalUsers && totalUsers > 0 ? ((proUsers / totalUsers) * 100).toFixed(1) : '0.0',
        avgRevenuePerUser: totalUsers && totalUsers > 0 ? (totalRevenue / totalUsers).toFixed(0) : '0',
      },
      
      // Call activity
      calls: {
        today: {
          total: totalCallsToday,
          connected: connectedCallsToday,
          connectionRate: totalCallsToday > 0 ? ((connectedCallsToday / totalCallsToday) * 100).toFixed(1) : '0.0',
          appointments: appointmentsToday,
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

