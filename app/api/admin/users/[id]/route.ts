import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

/**
 * GET /api/admin/users/[id]
 * Get comprehensive details for a single user
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both Promise and direct params (Next.js 15 compatibility)
    const resolvedParams = params instanceof Promise ? await params : params;
    const userId = resolvedParams.id;
    
    console.log('🔍 Fetching user details for ID:', userId);
    
    const adminMode = await isAdminMode();
    
    if (!adminMode) {
      console.error('❌ Admin mode not enabled');
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabase = createServiceRoleClient();

    // Fetch auth user
    console.log('👤 Fetching auth user...');
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);

    if (authError) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json({ error: 'User not found: ' + authError.message }, { status: 404 });
    }

    if (!authUser) {
      console.error('❌ No auth user found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('✅ Auth user found:', authUser.user.email);

    // Calculate 30 days ago date
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    // Fetch all user data in parallel - use maybeSingle() to handle missing data gracefully
    const [
      profile,
      subscription,
      callBalance,
      retellConfig,
      dialerSettings,
      referralData,
      callStats,
      callsLast30Days,
      revenueData,
      leadsCount,
      appointmentsTotal,
      appointmentsLast30Days,
      lastDialerSession,
      adminStats,
      lastCall,
      aiControlSettings
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('subscriptions').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('call_balance').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('user_retell_config').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('dialer_settings').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('referrals').select('*').eq('referrer_id', userId),
      supabase.from('calls').select('*', { count: 'exact', head: true }).eq('user_id', userId), // Count only - no row limit!
      supabase.from('calls').select('call_id', { count: 'exact' }).eq('user_id', userId).gte('created_at', thirtyDaysAgoISO),
      supabase.from('balance_transactions').select('amount, type, created_at, stripe_payment_intent_id').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('leads').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('appointments').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('appointments').select('id', { count: 'exact' }).eq('user_id', userId).gte('created_at', thirtyDaysAgoISO),
      supabase.from('dialer_sessions').select('started_at').eq('user_id', userId).not('started_at', 'is', null).order('started_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('revenue_tracking').select('*').eq('user_id', userId),
      supabase.from('calls').select('created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('ai_control_settings').select('status').eq('user_id', userId).maybeSingle()
    ]);

    // Calculate revenue - safely handle missing data
    console.log('💰 Balance transactions data:', {
      count: (revenueData.data || []).length,
      transactions: revenueData.data,
    });
    
    // Calculate YOUR profit (not the full transaction amounts)
    let subscriptionProfit = 0;
    let refillProfit = 0;
    let refillCount = 0;
    let totalRefillSpent = 0; // Track total refill spending
    let subscriptionSpent = 0; // Track subscription spending
    
    // Get user's cost per minute (default $0.35, your expense is $0.15)
    const userCostPerMinute = profile.data?.cost_per_minute || 0.65;
    const AI_COST_PER_MINUTE = 0.15; // Your actual cost
    const STRIPE_FEE_PERCENT = 0.03; // 3% Stripe fee
    
    // Count refills - calculate profit based on user's specific rate
    // Formula: Profit = Revenue - (Minutes × AI Cost) - Stripe Fee
    (revenueData.data || []).forEach((t: any) => {
      if (t.stripe_payment_intent_id && t.amount > 0) {
        refillCount++;
        const refillAmount = t.amount;
        totalRefillSpent += refillAmount; // Track total spent
        
        // Calculate minutes purchased at user's rate
        const minutesPurchased = refillAmount / userCostPerMinute;
        
        // AI expense = minutes × $0.15/min
        const aiExpense = minutesPurchased * AI_COST_PER_MINUTE;
        
        // Stripe fee = 3% of revenue
        const stripeFee = refillAmount * STRIPE_FEE_PERCENT;
        
        // Profit = Revenue - AI Expense - Stripe Fee
        const thisRefillProfit = refillAmount - aiExpense - stripeFee;
        refillProfit += thisRefillProfit;
        
        console.log(`  ✅ Refill found - Amount: $${refillAmount}, Minutes: ${minutesPurchased.toFixed(2)}, User rate: $${userCostPerMinute}/min, AI cost: $${aiExpense.toFixed(2)}, Stripe: $${stripeFee.toFixed(2)}, Profit: $${thisRefillProfit.toFixed(2)}`);
      }
    });
    
    // Round to 2 decimal places
    refillProfit = Math.round(refillProfit * 100) / 100;
    totalRefillSpent = Math.round(totalRefillSpent * 100) / 100;
    
    // Check if they have an ACTIVE subscription (not trialing - they haven't paid yet!)
    // IMPORTANT: VIP users don't generate subscription profit (lifetime free access)
    if (subscription.data && subscription.data.status === 'active' && subscription.data.tier !== 'vip') {
      // Only count profit if they're actively paying (not VIP)
      subscriptionSpent = 379; // $379/month subscription cost
      // Check if user was referred
      const wasReferred = !!profile.data?.referred_by;
      if (wasReferred) {
        subscriptionProfit = 253.93; // $379 - $11.37 Stripe fee - $113.70 commission (30%) = $253.93
        console.log(`  💰 ACTIVE subscription (REFERRED) - Profit: $253.93`);
      } else {
        subscriptionProfit = 367.63; // $379 - $11.37 Stripe fee = $367.63 profit
        console.log(`  💰 ACTIVE subscription (NOT REFERRED) - Profit: $367.63`);
      }
    } else if (subscription.data && subscription.data.tier === 'vip') {
      console.log(`  👑 VIP USER - No subscription spending (lifetime free access)`);
    } else if (subscription.data && subscription.data.status === 'trialing') {
      console.log(`  ⏳ User is on FREE TRIAL - No subscription spending yet`);
    }
    
    const totalRevenue = subscriptionProfit + refillProfit;
    const totalSpent = subscriptionSpent + totalRefillSpent; // Total money user has spent
    
    console.log('💵 Revenue breakdown:', {
      subscriptionProfit,
      refillCount,
      refillProfit,
      totalRevenue,
    });

    // Debug: Log calls data (now using count query)
    console.log('🔍 calls query result:', {
      count: callStats.count || 0,
      error: callStats.error,
    });
    
    // Fetch durations separately with high limit for minute calculations
    const { data: callDurations } = await supabase
      .from('calls')
      .select('duration')
      .eq('user_id', userId)
      .limit(500000);
    
    // Calculate admin adjustments from revenue_tracking table
    const totalAdminCalls = (adminStats.data || []).reduce((sum: number, stat: any) => sum + (stat.total_calls || 0), 0);
    const totalAdminAppointments = (adminStats.data || []).reduce((sum: number, stat: any) => sum + (stat.appointments_booked || 0), 0);
    const totalAdminRevenue = (adminStats.data || []).reduce((sum: number, stat: any) => sum + (parseFloat(stat.revenue?.toString() || '0')), 0);
    
    console.log(`📊 Admin adjustments for user ${userId} (for their dashboard):`, {
      calls: totalAdminCalls,
      appointments: totalAdminAppointments,
      userPolicySalesRevenue: totalAdminRevenue, // This is THEIR revenue, not yours
    });
    
    // Calculate call stats - using count query for accurate totals (no 1000 row limit!)
    const realCalls = callStats.count || 0;
    const totalCalls = realCalls + totalAdminCalls;
    const totalMinutes = (callDurations || []).reduce((sum: number, call: any) => sum + (call.duration || 0), 0);
    
    console.log(`📞 Call stats for user ${userId}:`, {
      realCalls: realCalls,
      adminCalls: totalAdminCalls,
      totalCalls: totalCalls,
      totalMinutes: totalMinutes,
    });
    
    // Get 30-day stats
    const callsLast30 = callsLast30Days.count || 0;
    const appointmentsLast30 = appointmentsLast30Days.count || 0;
    
    // Get total counts + admin adjustments
    const totalLeadsCount = leadsCount.count || 0;
    const totalAppointmentsCount = (appointmentsTotal.count || 0) + totalAdminAppointments;
    
    // Get last AI activity - use the most recent of dialer session OR last call
    const dialerSessionTime = lastDialerSession.data?.started_at ? new Date(lastDialerSession.data.started_at).getTime() : 0;
    const lastCallTime = lastCall.data?.created_at ? new Date(lastCall.data.created_at).getTime() : 0;
    
    let lastAIActivity = null;
    if (dialerSessionTime > lastCallTime && lastDialerSession.data?.started_at) {
      lastAIActivity = lastDialerSession.data.started_at;
    } else if (lastCall.data?.created_at) {
      lastAIActivity = lastCall.data.created_at;
    }

    // Setup status - safely handle missing profile
    let setupStatus = 'account_created';
    if (profile.data?.ai_setup_status === 'completed') {
      setupStatus = 'active';
    } else if (profile.data?.onboarding_completed) {
      setupStatus = 'onboarding_complete';
    }

    // Account type - safely handle missing subscription
    let accountType = 'Free Trial';
    let daysLeft = 0;
    let nextBillingDate = null;
    let subscriptionStatus = null;

    if (subscription.data) {
      subscriptionStatus = subscription.data.status;
      const tier = subscription.data.tier;
      
      console.log('🎫 Subscription details:', { tier, status: subscription.data.status, trial_end: subscription.data.trial_end });
      
      // Check tier first, then status
      if (tier === 'vip') {
        accountType = 'VIP Access (Lifetime)';
        console.log('👑 VIP tier detected');
      } else if (tier === 'pro') {
        accountType = 'Pro Access';
        if (subscription.data.status === 'trialing' && subscription.data.trial_end) {
          const trialEnd = new Date(subscription.data.trial_end);
          const now = new Date();
          daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          console.log(`⚡ PRO tier (trialing) - ${daysLeft} days left`);
        } else if (subscription.data.status === 'active') {
          nextBillingDate = subscription.data.current_period_end;
          console.log('⚡ PRO tier (active)');
        }
      } else if (tier === 'trial') {
        accountType = 'Free Trial';
        if (subscription.data.trial_end) {
          const trialEnd = new Date(subscription.data.trial_end);
          const now = new Date();
          daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          console.log(`🆓 FREE tier - ${daysLeft} days left`);
        }
      }
    }

    // Referral stats - safely handle missing data
    const totalReferrals = (referralData.data || []).length;
    const completedReferrals = (referralData.data || []).filter((r: any) => r.status === 'completed').length;
    
    // Calculate profit from this user (YOUR profit, not theirs!)
    // Profit = Subscription Profit + Refill Profit
    // Refill profit ($14.25) already has call costs factored in!
    // DO NOT include referral bonuses, call costs, or totalAdminRevenue
    const profit = subscriptionProfit + refillProfit;
    
    console.log('💵 PROFIT CALCULATION (Sterling AI profit from this user):', {
      subscriptionProfit: subscriptionProfit,
      refillCount: refillCount,
      refillProfit: refillProfit,
      netProfit: profit,
    });
    
    console.log('📊 USER\'S REVENUE (not included in profit):', {
      userPolicySalesRevenue: totalAdminRevenue,
    });

    const user = {
      // Basic Info
      id: authUser.user.id,
      full_name: profile.data?.full_name || 'Unnamed User',
      email: authUser.user.email || 'No email',
      phone: profile.data?.phone_number || authUser.user.phone || null,
      created_at: authUser.user.created_at,
      last_sign_in_at: authUser.user.last_sign_in_at,
      
      // Setup & Status
      setup_status: setupStatus,
      ai_setup_status: profile.data?.ai_setup_status || 'not_started',
      
      // Account Type & Billing
      account_type: accountType,
      subscription_status: subscriptionStatus,
      days_left: daysLeft,
      next_billing_date: nextBillingDate,
      stripe_customer_id: profile.data?.stripe_customer_id,
      
      // Revenue & Profit (Sterling AI's profit from this user)
      subscription_profit: subscriptionProfit, // $367.63 if not referred, $253.93 if referred (30% commission)
      refill_count: refillCount, // Number of refills
      refill_profit: refillProfit, // $14.25 per refill (costs already factored in)
      profit: profit, // subscription_profit + refill_profit
      
      // Total Spent by User (subscriptions + call balance refills)
      total_spent: totalSpent,
      subscription_spent: subscriptionSpent, // $379 if active subscription
      refill_spent: totalRefillSpent, // Total refill amount
      
      // User's Revenue (their policy sales - for display only, not included in Sterling AI profit)
      user_policy_revenue: totalAdminRevenue,
      
      // Call Balance - safely handle missing data
      call_balance: callBalance.data?.balance ?? 0,
      auto_refill_enabled: callBalance.data?.auto_refill_enabled ?? false,
      auto_refill_amount: callBalance.data?.auto_refill_amount ?? 50,
      
      // AI Configuration - safely handle missing data
      retell_agent_id: retellConfig.data?.retell_agent_id ?? null,
      retell_phone_number: retellConfig.data?.phone_number ?? null,
      phone_number_fe: retellConfig.data?.phone_number_fe ?? retellConfig.data?.phone_number ?? null,
      phone_number_mp: retellConfig.data?.phone_number_mp ?? null,
      retell_agent_name: retellConfig.data?.agent_name ?? null,
      agent_name: retellConfig.data?.agent_name ?? null,
      agent_pronoun: retellConfig.data?.agent_pronoun ?? 'She',
      cal_api_key: retellConfig.data?.cal_ai_api_key ?? null,
      cal_event_id: retellConfig.data?.cal_event_id ?? null,
      timezone: retellConfig.data?.timezone ?? 'America/New_York',
      confirmation_email: retellConfig.data?.confirmation_email ?? null,
      script_type: retellConfig.data?.script_type ?? 'final_expense',
      ai_is_active: retellConfig.data?.is_active ?? false,
      ai_is_running: aiControlSettings.data?.status === 'running',
      ai_maintenance_mode: profile.data?.ai_maintenance_mode ?? false,
      
      // Per-user Retell AI Agents (2 agents per user)
      retell_agent_1_id: retellConfig.data?.retell_agent_1_id ?? null,
      retell_agent_1_phone: retellConfig.data?.retell_agent_1_phone ?? null,
      retell_agent_1_name: retellConfig.data?.retell_agent_1_name ?? null,
      retell_agent_1_type: retellConfig.data?.retell_agent_1_type ?? 'final_expense',
      retell_agent_2_id: retellConfig.data?.retell_agent_2_id ?? null,
      retell_agent_2_phone: retellConfig.data?.retell_agent_2_phone ?? null,
      retell_agent_2_name: retellConfig.data?.retell_agent_2_name ?? null,
      retell_agent_2_type: retellConfig.data?.retell_agent_2_type ?? 'mortgage_protection',
      
      // Subscription Status - safely handle missing data
      // Default to true if user has active trial/subscription status, false otherwise
      has_active_subscription: profile.data?.has_active_subscription ?? 
        (profile.data?.subscription_status === 'trialing' || profile.data?.subscription_status === 'active' ? true : false),
      subscription_tier: profile.data?.subscription_tier ?? 'none',
      cost_per_minute: userCostPerMinute, // User's custom rate per minute
      
      // Dialer Settings - safely handle missing data
      dialer_automation_enabled: dialerSettings.data?.auto_start_enabled ?? false,
      daily_budget: dialerSettings.data?.daily_budget_cents ? dialerSettings.data.daily_budget_cents / 100 : 0,
      auto_start_time: dialerSettings.data?.auto_start_time ?? '09:00',
      auto_stop_time: dialerSettings.data?.auto_stop_time ?? '20:00',
      auto_start_days: dialerSettings.data?.auto_start_days ?? [],
      
      // Call Stats
      total_calls: totalCalls,
      total_minutes: totalMinutes.toFixed(2),
      calls_last_30_days: callsLast30,
      
      // Lead Stats
      total_leads: totalLeadsCount,
      
      // Appointment Stats
      total_appointments: totalAppointmentsCount,
      appointments_last_30_days: appointmentsLast30,
      
      // AI Activity
      last_ai_activity: lastAIActivity,
      
      // Referrals - safely handle missing data
      total_referrals: totalReferrals,
      completed_referrals: completedReferrals,
      referral_code: profile.data?.referral_code ?? null,
      
      // Other - safely handle missing data
      referred_by: profile.data?.referred_by ?? null,
      
      // Onboarding Steps - safely handle missing data
      onboarding_step_1_form: profile.data?.onboarding_step_1_form ?? false,
      onboarding_step_2_balance: profile.data?.onboarding_step_2_balance ?? false,
      onboarding_step_3_sheet: profile.data?.onboarding_step_3_sheet ?? false,
      onboarding_step_4_schedule: profile.data?.onboarding_step_4_schedule ?? false,
      onboarding_all_complete: profile.data?.onboarding_all_complete ?? false,
      
      // Dead User Status
      is_dead: profile.data?.is_dead ?? false,
    };

    console.log('✅ Successfully compiled user data');
    
    return NextResponse.json({
      success: true,
      user,
    });

  } catch (error: any) {
    console.error('❌ Fatal error in /api/admin/users/[id]:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

