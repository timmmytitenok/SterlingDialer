import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';
import { getAICostPerMinute } from '@/lib/ai-cost-calculator';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Admin user IDs to exclude from stats
const ADMIN_USER_IDS = ['d33602b3-4b0c-4ec7-938d-7b1d31722dc5', '7619c63f-fcc3-4ff3-83ac-33595b5640a5'];

export async function GET() {
  try {
    console.log('📊 Auto Schedule Stats API - Starting...');
    
    const adminMode = await isAdminMode();
    if (!adminMode) {
      console.error('❌ Admin access denied');
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabase = createServiceRoleClient();
    console.log('✅ Admin access granted');
    console.log('📊 Fetching Auto Schedule statistics...');

    // Fetch YOUR expense per minute (what you pay Retell)
    const aiCostPerMinute = await getAICostPerMinute(); // $0.15 default
    
    console.log(`💰 Your AI expense: $${aiCostPerMinute}/min`);

    // Fetch all users with Auto Schedule enabled and their settings
    const { data: autoScheduleUsers, error: usersError } = await supabase
      .from('ai_control_settings')
      .select('user_id, schedule_enabled, schedule_days, daily_spend_limit')
      .eq('schedule_enabled', true);

    if (usersError) {
      console.error('❌ Error fetching auto schedule users:', usersError);
      throw usersError;
    }

    // Filter out admin users
    const filteredUsers = (autoScheduleUsers || []).filter(
      (user: any) => !ADMIN_USER_IDS.includes(user.user_id)
    );

    console.log(`✅ Found ${filteredUsers.length} users with Auto Schedule enabled (excluding admins)`);

    // Fetch each user's individual cost_per_minute from profiles
    const userIds = filteredUsers.map(u => u.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, cost_per_minute')
      .in('user_id', userIds);

    if (profilesError) {
      console.error('❌ Error fetching user profiles:', profilesError);
    }

    // Create a map of user_id -> cost_per_minute
    const userRates: { [key: string]: number } = {};
    (profiles || []).forEach((p: { user_id: string; cost_per_minute: number | null }) => {
      userRates[p.user_id] = p.cost_per_minute || 0.40; // Default to $0.40 if not set
    });

    console.log('📋 User-specific rates:', userRates);

    // Initialize day statistics
    // Days: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
    const dayStats: { [key: number]: { userCount: number; totalDailyBudget: number; totalProfit: number } } = {
      0: { userCount: 0, totalDailyBudget: 0, totalProfit: 0 }, // Sunday
      1: { userCount: 0, totalDailyBudget: 0, totalProfit: 0 }, // Monday
      2: { userCount: 0, totalDailyBudget: 0, totalProfit: 0 }, // Tuesday
      3: { userCount: 0, totalDailyBudget: 0, totalProfit: 0 }, // Wednesday
      4: { userCount: 0, totalDailyBudget: 0, totalProfit: 0 }, // Thursday
      5: { userCount: 0, totalDailyBudget: 0, totalProfit: 0 }, // Friday
      6: { userCount: 0, totalDailyBudget: 0, totalProfit: 0 }, // Saturday
    };

    filteredUsers.forEach((user: { user_id: string; schedule_enabled: boolean; schedule_days: number[] | null; daily_spend_limit: number | null }) => {
      const dailyBudget = user.daily_spend_limit || 25;
      const scheduleDays = user.schedule_days || [];
      
      // Get THIS user's specific rate (default $0.40)
      const userRate = userRates[user.user_id] || 0.40;
      
      // Calculate profit margin for THIS user
      // dailyBudget is what they'll spend
      // minutes = dailyBudget / userRate
      // yourExpense = minutes * aiCostPerMinute
      // profit = dailyBudget - yourExpense
      const minutesPerDay = dailyBudget / userRate;
      const yourExpensePerDay = minutesPerDay * aiCostPerMinute;
      const profitPerDay = dailyBudget - yourExpensePerDay;
      
      console.log(`   User ${user.user_id.substring(0, 8)}...: $${dailyBudget}/day budget, $${userRate}/min rate, ${minutesPerDay.toFixed(1)} min, $${profitPerDay.toFixed(2)} profit/day`);

      // For each day this user has scheduled, add to that day's stats
      scheduleDays.forEach((dayIndex: number) => {
        if (dayStats[dayIndex]) {
          dayStats[dayIndex].userCount += 1;
          dayStats[dayIndex].totalDailyBudget += dailyBudget;
          dayStats[dayIndex].totalProfit += profitPerDay;
        }
      });
    });

    // Calculate totals across all days
    const totalActiveUsers = filteredUsers.length;
    const totalWeeklyProfit = Object.values(dayStats).reduce((sum, day) => sum + day.totalProfit, 0);

    console.log('📊 Auto Schedule Stats calculated:');
    console.log(`   Total users with automation: ${totalActiveUsers}`);
    console.log(`   Total weekly profit: $${totalWeeklyProfit.toFixed(2)}`);
    console.log('   Per day breakdown:', dayStats);

    return NextResponse.json({
      totalActiveUsers,
      totalWeeklyProfit,
      dayStats, // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    });
  } catch (error: any) {
    console.error('❌ Error fetching Auto Schedule stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Auto Schedule statistics' },
      { status: 500 }
    );
  }
}

