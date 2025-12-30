import { NextResponse } from 'next/server';

/**
 * Vercel Cron Job Endpoint - Auto-Start AI Dialer
 * 
 * This endpoint is called by Vercel Cron every hour to check which users should have their AI started.
 * It uses the NEW user_retell_config table with:
 * - auto_dialer_enabled (boolean)
 * - dialer_days (array of day numbers: 0=Sun, 1=Mon, etc.)
 * - dialer_skip_dates (specific dates to skip, e.g., ["2025-01-15"])
 * - dialer_extra_dates (extra dates to add, e.g., ["2025-01-18"])
 * - dialer_daily_budget (number in dollars)
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

export async function GET(request: Request) {
  try {
    // Check for test mode (allows manual triggering from admin)
    const url = new URL(request.url);
    const testMode = url.searchParams.get('test') === 'true';
    const testUserId = url.searchParams.get('userId'); // Optional: test specific user
    
    // Verify this is a legitimate cron request from Vercel OR test mode with secret
    const authHeader = request.headers.get('authorization');
    const isValidCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const isValidTest = testMode && authHeader === `Bearer ${process.env.CRON_SECRET}`;
    
    if (!isValidCron && !isValidTest) {
      console.error('❌ Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (testMode) {
      console.log('🧪 TEST MODE ENABLED - Manual trigger');
      if (testUserId) {
        console.log(`🎯 Testing specific user: ${testUserId}`);
      }
    }

    console.log('🕐 AUTO-DIALER CRON JOB STARTING...');
    console.log('📅 Current UTC time:', new Date().toISOString());

    // Use service role to bypass RLS
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all users with auto_dialer_enabled from user_retell_config (NEW TABLE)
    let query = supabase
      .from('user_retell_config')
      .select('user_id, dialer_days, dialer_skip_dates, dialer_extra_dates, dialer_daily_budget, retell_agent_1_id, retell_agent_1_phone, retell_agent_2_id, retell_agent_2_phone');
    
    if (testUserId) {
      // Test mode: get specific user regardless of auto_dialer_enabled
      query = query.eq('user_id', testUserId);
    } else {
      // Normal mode: only get users with auto_dialer_enabled
      query = query.eq('auto_dialer_enabled', true);
    }
    
    const { data: scheduledUsers, error } = await query;

    if (error) {
      console.error('❌ Error fetching scheduled users:', error);
      throw error;
    }

    console.log(`🔍 Found ${scheduledUsers?.length || 0} users with auto-dialer enabled`);

    if (!scheduledUsers || scheduledUsers.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No users have auto-dialer enabled',
        usersChecked: 0
      });
    }

    const results: any[] = [];
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    for (const config of scheduledUsers) {
      const { 
        user_id, 
        dialer_days = [1, 2, 3, 4, 5], // Default Mon-Fri
        dialer_skip_dates = [], 
        dialer_extra_dates = [],
        dialer_daily_budget = 25,
        retell_agent_1_id,
        retell_agent_1_phone,
        retell_agent_2_id,
        retell_agent_2_phone
      } = config;

      try {
        console.log(`\n👤 Processing user ${user_id}...`);

        // Get user's timezone and status from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('timezone, ai_maintenance_mode, has_active_subscription, is_vip')
          .eq('user_id', user_id)
          .single();

        // Get user's balance from call_balance table (separate table!)
        const { data: callBalance } = await supabase
          .from('call_balance')
          .select('balance')
          .eq('user_id', user_id)
          .single();

        const userTimezone = profile?.timezone || 'America/New_York';
        
        // Get current time in user's timezone
        const now = new Date();
        const userTime = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
        const userHour = userTime.getHours();
        const userDayOfWeek = userTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Format today's date as YYYY-MM-DD in user's timezone
        const userYear = userTime.getFullYear();
        const userMonth = String(userTime.getMonth() + 1).padStart(2, '0');
        const userDay = String(userTime.getDate()).padStart(2, '0');
        const todayStr = `${userYear}-${userMonth}-${userDay}`;

        console.log(`   Timezone: ${userTimezone}`);
        console.log(`   User local time: ${userTime.toLocaleString()}`);
        console.log(`   User hour: ${userHour}`);
        console.log(`   Day of week: ${userDayOfWeek} (0=Sun, 1=Mon...)`);
        console.log(`   Today's date: ${todayStr}`);
        console.log(`   Dialer days: ${JSON.stringify(dialer_days)}`);
        console.log(`   Skip dates: ${JSON.stringify(dialer_skip_dates)}`);
        console.log(`   Extra dates: ${JSON.stringify(dialer_extra_dates)}`);

        // ===== CHECK IF IT'S 9 AM IN USER'S TIMEZONE (with 1-hour window) =====
        // Use a window (9:00-9:59) to handle cron timing variations
        // Vercel crons can run slightly late, so we give a full hour window
        const isTargetHour = userHour === 9;
        
        // ALSO check if we already launched for this user today
        // This prevents double-launching if cron runs multiple times in the 9 AM hour
        const { data: existingSession } = await supabase
          .from('dialer_sessions')
          .select('id')
          .eq('user_id', user_id)
          .eq('is_scheduled', true)
          .gte('started_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
          .limit(1)
          .maybeSingle();
        
        const alreadyLaunchedToday = !!existingSession;
        
        if (alreadyLaunchedToday && !testMode) {
          console.log(`   ⏭️  Already launched scheduled session today, skipping`);
          results.push({ user_id, success: false, reason: 'Already launched today' });
          continue;
        }
        
        if (!isTargetHour && !testMode) {
          console.log(`   ⏭️  Not 9 AM in user's timezone (currently ${userHour}:00), skipping`);
          results.push({ user_id, success: false, reason: `Not 9 AM (currently ${userHour}:00)` });
          continue;
        }

        if (testMode && !isTargetHour) {
          console.log(`   🧪 TEST MODE: Ignoring 9 AM check (currently ${userHour}:00)`);
        }
        
        if (testMode && alreadyLaunchedToday) {
          console.log(`   🧪 TEST MODE: Ignoring already-launched check`);
        }

        // ===== CHECK IF TODAY IS AN ACTIVE DIALING DAY =====
        const isWeeklyActive = dialer_days.includes(userDayOfWeek);
        const isSkipped = dialer_skip_dates.includes(todayStr);
        const isExtra = dialer_extra_dates.includes(todayStr);

        // Logic: Active if (weekly active AND not skipped) OR (extra day)
        const shouldDialToday = (isWeeklyActive && !isSkipped) || isExtra;

        console.log(`   Weekly active: ${isWeeklyActive}`);
        console.log(`   Is skipped: ${isSkipped}`);
        console.log(`   Is extra: ${isExtra}`);
        console.log(`   Should dial today: ${shouldDialToday}`);

        if (!shouldDialToday && !testMode) {
          console.log(`   ⏭️  Not an active dialing day, skipping`);
          results.push({ user_id, success: false, reason: 'Not an active dialing day' });
          continue;
        }

        if (testMode && !shouldDialToday) {
          console.log(`   🧪 TEST MODE: Ignoring day check`);
        }

        // ===== CHECK USER STATUS =====
        if (profile?.ai_maintenance_mode) {
          console.log(`   ⚠️  AI in maintenance mode, skipping`);
          results.push({ user_id, success: false, reason: 'AI in maintenance mode' });
          continue;
        }

        const balanceDollars = callBalance?.balance || 0;
        if (balanceDollars < 1 && !profile?.is_vip) {
          console.log(`   ⚠️  Insufficient balance ($${balanceDollars}), skipping`);
          results.push({ user_id, success: false, reason: 'Insufficient balance' });
          continue;
        }
        
        console.log(`   💰 Balance: $${balanceDollars}`);

        // ===== CHECK IF RETELL CONFIG EXISTS =====
        const hasAgent = (retell_agent_1_id && retell_agent_1_phone) || (retell_agent_2_id && retell_agent_2_phone);
        if (!hasAgent) {
          console.log(`   ⚠️  No Retell agent configured, skipping`);
          results.push({ user_id, success: false, reason: 'No Retell agent configured' });
          continue;
        }

        // ===== CHECK IF ALREADY RUNNING =====
        const { data: aiSettings } = await supabase
          .from('ai_control_settings')
          .select('status, today_spend')
          .eq('user_id', user_id)
          .maybeSingle();

        if (aiSettings?.status === 'running') {
          console.log(`   ⏭️  AI already running, skipping`);
          results.push({ user_id, success: false, reason: 'Already running' });
          continue;
        }

        // ===== CHECK IF USER HAS CALLABLE LEADS =====
        const { data: userSheets } = await supabase
          .from('user_google_sheets')
          .select('id')
          .eq('user_id', user_id)
          .eq('is_active', true);

        if (!userSheets || userSheets.length === 0) {
          console.log(`   ⚠️  No active Google Sheets, skipping`);
          results.push({ user_id, success: false, reason: 'No active lead sheets' });
          continue;
        }

        const sheetIds = userSheets.map(s => s.id);
        
        const { count: callableLeads } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user_id)
          .eq('is_qualified', true)
          .in('google_sheet_id', sheetIds)
          .in('status', ['new', 'callback_later', 'unclassified', 'no_answer', 'potential_appointment'])
          .neq('status', 'dead_lead')
          .or('total_calls_made.is.null,total_calls_made.lt.20');

        console.log(`   📊 Callable leads: ${callableLeads}`);

        if (!callableLeads || callableLeads === 0) {
          console.log(`   ⚠️  No callable leads, skipping`);
          results.push({ user_id, success: false, reason: 'No callable leads' });
          continue;
        }

        // ===== 🚀 START THE AI DIALER! =====
        console.log(`\n🚀 STARTING AI DIALER for user ${user_id}`);
        console.log(`   Budget: $${dialer_daily_budget}/day`);
        console.log(`   Leads available: ${callableLeads}`);

        const budgetCents = Math.round(dialer_daily_budget * 100);

        // Get current today_spend for session-based budgeting
        const currentTodaySpend = aiSettings?.today_spend || 0;

        // Update AI control settings to running with budget mode
        const { error: updateError } = await supabase
          .from('ai_control_settings')
          .upsert({
            user_id: user_id,
            status: 'running',
            queue_length: 0,
            calls_made_today: 0,
            execution_mode: 'leads', // Always 'leads' to pass DB constraint
            target_lead_count: 9999, // High number for budget mode
            budget_limit_cents: budgetCents,
            session_start_spend: currentTodaySpend,
            auto_transfer_calls: true,
            last_call_status: 'scheduled_start',
          }, {
            onConflict: 'user_id'
          });

        if (updateError) {
          console.error(`   ❌ Error updating AI settings:`, updateError);
          results.push({ user_id, success: false, error: updateError.message });
          continue;
        }

        // Create a dialer session for tracking
        await supabase
          .from('dialer_sessions')
          .insert({
            user_id: user_id,
            started_at: new Date().toISOString(),
            status: 'running',
            execution_mode: 'budget',
            target_value: dialer_daily_budget,
            is_scheduled: true,
          });

        // ===== TRIGGER THE FIRST CALL WITH RETRIES =====
        console.log(`   📞 Triggering first call...`);
        
        let callSuccess = false;
        let callResult: any = null;
        let lastError = '';
        const maxRetries = 3;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          console.log(`   📞 Attempt ${attempt}/${maxRetries}...`);
          
          try {
            const callResponse = await fetch(`${baseUrl}/api/ai-control/next-call`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user_id }),
            });

            callResult = await callResponse.json();
            
            if (callResponse.ok && callResult.success) {
              callSuccess = true;
              console.log(`   ✅ Call triggered successfully!`);
              break;
            } else if (callResult.done && callResult.reason === 'no_callable_leads') {
              console.log(`   ⚠️  No callable leads at call time`);
              lastError = 'No callable leads at time of call';
              break;
            } else {
              lastError = callResult.error || callResult.reason || 'Unknown error';
              console.log(`   ⚠️  Attempt ${attempt} failed: ${lastError}`);
              
              if (attempt < maxRetries) {
                const waitMs = attempt * 2000;
                console.log(`   ⏳ Waiting ${waitMs}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitMs));
              }
            }
          } catch (fetchError: any) {
            lastError = fetchError.message || 'Network error';
            console.log(`   ❌ Attempt ${attempt} threw error: ${lastError}`);
            
            if (attempt < maxRetries) {
              const waitMs = attempt * 2000;
              await new Promise(resolve => setTimeout(resolve, waitMs));
            }
          }
        }
        
        if (callSuccess) {
          console.log(`✅ Successfully started AI for user ${user_id}`);
          results.push({ 
            user_id, 
            success: true, 
            message: 'AI started successfully',
            budget: `$${dialer_daily_budget}`,
            callableLeads
          });
        } else {
          console.error(`❌ Failed to trigger call after ${maxRetries} attempts: ${lastError}`);
          
          // Revert status if call failed
          await supabase
            .from('ai_control_settings')
            .update({ status: 'stopped', last_call_status: 'scheduled_start_failed' })
            .eq('user_id', user_id);
          
          results.push({ user_id, success: false, error: lastError || 'Failed to start call after retries' });
        }

      } catch (userError: any) {
        console.error(`❌ Error processing user ${user_id}:`, userError);
        results.push({ user_id, success: false, error: userError.message });
      }
    }

    // ========================================================================
    // WATCHDOG: Detect and recover "stuck" AI sessions
    // If AI status is "running" but no calls have been made in 10+ minutes,
    // trigger a new call to unstick the session
    // ========================================================================
    console.log('\n🔍 WATCHDOG: Checking for stuck AI sessions...');
    
    const { data: stuckSessions } = await supabase
      .from('ai_control_settings')
      .select('user_id, last_call_status, calls_made_today')
      .eq('status', 'running');
    
    if (stuckSessions && stuckSessions.length > 0) {
      console.log(`🔍 Found ${stuckSessions.length} users with AI in "running" status`);
      
      for (const session of stuckSessions) {
        // Check if user has auto_dialer_enabled
        const { data: config } = await supabase
          .from('user_retell_config')
          .select('auto_dialer_enabled')
          .eq('user_id', session.user_id)
          .maybeSingle();
        
        if (!config?.auto_dialer_enabled) {
          // User doesn't have auto-dialer, skip (they might be manually running)
          continue;
        }
        
        // Check last call for this user
        const { data: lastCall } = await supabase
          .from('calls')
          .select('created_at')
          .eq('user_id', session.user_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (lastCall) {
          const lastCallTime = new Date(lastCall.created_at).getTime();
          const now = Date.now();
          const minutesSinceLastCall = (now - lastCallTime) / 1000 / 60;
          
          if (minutesSinceLastCall > 10) {
            console.log(`⚠️ STUCK SESSION DETECTED for user ${session.user_id}!`);
            console.log(`   Last call was ${minutesSinceLastCall.toFixed(1)} minutes ago`);
            console.log(`   Last status: ${session.last_call_status}`);
            console.log(`   Attempting to restart dialing...`);
            
            try {
              const restartResponse = await fetch(`${baseUrl}/api/ai-control/next-call`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: session.user_id }),
              });
              
              const restartResult = await restartResponse.json();
              
              if (restartResult.success) {
                console.log(`✅ Successfully restarted dialing for user ${session.user_id}`);
                results.push({ 
                  user_id: session.user_id, 
                  success: true, 
                  message: 'Recovered stuck session',
                  recovered: true
                });
              } else if (restartResult.done) {
                console.log(`🛑 Session recovery stopped: ${restartResult.reason}`);
                // AI might have been stopped for a valid reason
              } else {
                console.log(`⚠️ Recovery attempt returned: ${JSON.stringify(restartResult)}`);
              }
            } catch (restartError: any) {
              console.error(`❌ Failed to restart stuck session: ${restartError.message}`);
            }
          }
        } else {
          // No calls at all - this might be stuck at the beginning
          console.log(`⚠️ User ${session.user_id} has running AI but no calls in history`);
          console.log(`   Attempting to start first call...`);
          
          try {
            const startResponse = await fetch(`${baseUrl}/api/ai-control/next-call`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: session.user_id }),
            });
            
            const startResult = await startResponse.json();
            console.log(`   Result: ${startResult.success ? 'SUCCESS' : startResult.reason || 'FAILED'}`);
          } catch (startError: any) {
            console.error(`❌ Failed to start first call: ${startError.message}`);
          }
        }
      }
    } else {
      console.log('✅ No stuck sessions found');
    }

    // Summary
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log('\n========================================');
    console.log('🏁 AUTO-DIALER CRON JOB COMPLETE');
    console.log(`   Total users checked: ${scheduledUsers.length}`);
    console.log(`   Successfully started: ${successCount}`);
    console.log(`   Failed/Skipped: ${failCount}`);
    console.log('========================================');

    return NextResponse.json({
      success: true,
      message: `Processed ${scheduledUsers.length} users`,
      usersChecked: scheduledUsers.length,
      usersStarted: successCount,
      usersFailed: failCount,
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ Cron job error:', error);
    return NextResponse.json(
      { error: error.message || 'Cron job failed' },
      { status: 500 }
    );
  }
}

