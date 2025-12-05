import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    // Fetch all users with Auto Schedule enabled and their settings
    const { data: autoScheduleUsers, error: usersError } = await supabase
      .from('ai_control_settings')
      .select('user_id, schedule_enabled, schedule_days, daily_spend_limit')
      .eq('schedule_enabled', true);

    if (usersError) {
      console.error('❌ Error fetching auto schedule users:', usersError);
      throw usersError;
    }

    console.log(`✅ Found ${autoScheduleUsers?.length || 0} users with Auto Schedule enabled`);
    console.log('📋 Auto Schedule users data:', JSON.stringify(autoScheduleUsers, null, 2));

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

    // Calculate profit for each user and each day
    // Profit calculation: $25 budget = $14.25 profit
    // So profit = budget * 0.57 (57% profit margin)
    const profitMargin = 14.25 / 25; // 0.57

    autoScheduleUsers?.forEach((user: { user_id: string; schedule_enabled: boolean; schedule_days: number[] | null; daily_spend_limit: number | null }) => {
      const dailyBudget = user.daily_spend_limit || 25;
      const profitPerDay = dailyBudget * profitMargin;
      const scheduleDays = user.schedule_days || [];

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
    const totalActiveUsers = autoScheduleUsers?.length || 0;
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

