import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';
import { getAICostPerMinute } from '@/lib/ai-cost-calculator';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Admin user IDs to exclude from stats
const ADMIN_USER_IDS = ['d33602b3-4b0c-4ec7-938d-7b1d31722dc5', '7619c63f-fcc3-4ff3-83ac-33595b5640a5'];

// Helper to get the date string for a specific day of the upcoming week
function getDateForDayOfWeek(dayOfWeek: number): string {
  const today = new Date();
  const currentDay = today.getDay();
  const daysUntil = (dayOfWeek - currentDay + 7) % 7;
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + daysUntil);
  // Return YYYY-MM-DD format
  return targetDate.toISOString().split('T')[0];
}

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
    console.log('📊 Fetching Auto Schedule statistics from NEW schedule system...');

    // Fetch YOUR expense per minute (what you pay Retell)
    const aiCostPerMinute = await getAICostPerMinute(); // $0.15 default
    
    console.log(`💰 Your AI expense: $${aiCostPerMinute}/min`);

    // Fetch all users with Auto Dialer enabled from user_retell_config (NEW SYSTEM)
    const { data: autoDialerUsers, error: usersError } = await supabase
      .from('user_retell_config')
      .select('user_id, auto_dialer_enabled, dialer_days, dialer_daily_budget, dialer_skip_dates, dialer_extra_dates')
      .eq('auto_dialer_enabled', true);

    if (usersError) {
      console.error('❌ Error fetching auto dialer users:', usersError);
      throw usersError;
    }

    // Filter out admin users
    const filteredUsers = (autoDialerUsers || []).filter(
      (user: any) => !ADMIN_USER_IDS.includes(user.user_id)
    );

    console.log(`✅ Found ${filteredUsers.length} users with Auto Dialer enabled (excluding admins)`);

    // Fetch each user's individual cost_per_minute from profiles
    const userIds = filteredUsers.map((u: any) => u.user_id);
    
    let userRates: { [key: string]: number } = {};
    
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, cost_per_minute')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('❌ Error fetching user profiles:', profilesError);
      }

      // Create a map of user_id -> cost_per_minute
      (profiles || []).forEach((p: { user_id: string; cost_per_minute: number | null }) => {
        userRates[p.user_id] = p.cost_per_minute || 0.35; // Default to $0.35 if not set
      });
    }

    console.log('📋 User-specific rates:', userRates);

    // Get the date strings for each day of the upcoming week
    const upcomingDates: { [key: number]: string } = {};
    for (let i = 0; i < 7; i++) {
      upcomingDates[i] = getDateForDayOfWeek(i);
    }
    console.log('📅 Upcoming week dates:', upcomingDates);

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

    // Track users who are actually active on at least one day this week
    const usersActiveThisWeek = new Set<string>();

    filteredUsers.forEach((user: { 
      user_id: string; 
      auto_dialer_enabled: boolean; 
      dialer_days: number[] | null; 
      dialer_daily_budget: number | null;
      dialer_skip_dates: string[] | null;
      dialer_extra_dates: string[] | null;
    }) => {
      const dailyBudget = user.dialer_daily_budget || 25;
      const dialerDays = user.dialer_days || [1, 2, 3, 4, 5]; // Default Mon-Fri
      const skipDates = user.dialer_skip_dates || [];
      const extraDates = user.dialer_extra_dates || [];
      
      // Get THIS user's specific rate (default $0.35)
      const userRate = userRates[user.user_id] || 0.35;
      
      // Calculate profit margin for THIS user
      // dailyBudget is what they'll spend
      // minutes = dailyBudget / userRate
      // yourExpense = minutes * aiCostPerMinute
      // profit = dailyBudget - yourExpense
      const minutesPerDay = dailyBudget / userRate;
      const yourExpensePerDay = minutesPerDay * aiCostPerMinute;
      const profitPerDay = dailyBudget - yourExpensePerDay;
      
      console.log(`   User ${user.user_id.substring(0, 8)}...: $${dailyBudget}/day budget, $${userRate}/min rate, ${minutesPerDay.toFixed(1)} min, $${profitPerDay.toFixed(2)} profit/day`);
      console.log(`      Weekly schedule: ${dialerDays.join(', ')}, Skip dates: ${skipDates.length}, Extra dates: ${extraDates.length}`);

      // For each day of the week, check if this user will be active
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const dateForThisDay = upcomingDates[dayIndex];
        const isWeeklyActive = dialerDays.includes(dayIndex);
        const isSkipped = skipDates.includes(dateForThisDay);
        const isExtra = extraDates.includes(dateForThisDay);
        
        // User is active on this day if:
        // (Weekly schedule includes this day AND not skipped) OR (it's an extra date)
        const isActiveOnThisDay = (isWeeklyActive && !isSkipped) || isExtra;
        
        if (isActiveOnThisDay) {
          dayStats[dayIndex].userCount += 1;
          dayStats[dayIndex].totalDailyBudget += dailyBudget;
          dayStats[dayIndex].totalProfit += profitPerDay;
          usersActiveThisWeek.add(user.user_id); // Track this user as active
          
          if (isExtra && !isWeeklyActive) {
            console.log(`      Day ${dayIndex} (${dateForThisDay}): EXTRA (not in weekly schedule but manually added)`);
          } else if (isWeeklyActive && !isSkipped) {
            console.log(`      Day ${dayIndex} (${dateForThisDay}): ACTIVE (weekly schedule)`);
          }
        } else if (isWeeklyActive && isSkipped) {
          console.log(`      Day ${dayIndex} (${dateForThisDay}): SKIPPED (in weekly schedule but blocked this week)`);
        }
      }
    });

    // Calculate totals - only count users who are actually active on at least one day
    const totalActiveUsers = usersActiveThisWeek.size;
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

