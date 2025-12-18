import { NextResponse } from 'next/server';

/**
 * Vercel Cron Job Endpoint - Auto-Start AI
 * This endpoint is called by Vercel Cron daily to check if any users have scheduled AI starts
 * It uses the NEW direct Retell call system (not N8N!)
 */
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

    console.log('🕐 CRON JOB STARTING - Checking for scheduled AI starts...');
    console.log('📅 Current UTC time:', new Date().toISOString());

    // Use service role to bypass RLS
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get current day of week in different timezones
    const now = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Get all users with auto-scheduling enabled from dialer_settings
    // If testUserId is provided, only get that specific user
    let query = supabase
      .from('dialer_settings')
      .select('user_id, auto_start_enabled, auto_start_days, auto_start_time, daily_budget_cents');
    
    if (testUserId) {
      // Test mode: get specific user regardless of auto_start_enabled
      query = query.eq('user_id', testUserId);
    } else {
      // Normal mode: only get users with auto_start_enabled
      query = query.eq('auto_start_enabled', true);
    }
    
    const { data: scheduledUsers, error } = await query;

    if (error) {
      console.error('❌ Error fetching scheduled users:', error);
      throw error;
    }

    console.log(`🔍 Found ${scheduledUsers?.length || 0} users with auto-schedule enabled`);

    if (!scheduledUsers || scheduledUsers.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No users have scheduling enabled',
        usersChecked: 0
      });
    }

    const results = [];
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    for (const userSettings of scheduledUsers) {
      const { user_id, auto_start_days, daily_budget_cents } = userSettings;

      try {
        // Get user's timezone from ai_control_settings or profile
        const { data: aiSettings } = await supabase
          .from('ai_control_settings')
          .select('user_timezone, status')
          .eq('user_id', user_id)
          .maybeSingle();

        // Skip if already running
        if (aiSettings?.status === 'running') {
          console.log(`⏭️  User ${user_id} AI already running, skipping`);
          results.push({ user_id, success: false, reason: 'Already running' });
          continue;
        }

        const userTimezone = aiSettings?.user_timezone || 'America/New_York';
        
        // Get current day and hour in user's timezone
        const dayFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: userTimezone,
          weekday: 'long'
        });
        const hourFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: userTimezone,
          hour: 'numeric',
          hour12: false
        });
        
        const currentDayName = dayFormatter.format(now);
        const currentHour = parseInt(hourFormatter.format(now));

        // Check if it's 9 AM in user's timezone
        const is9AM = currentHour === 9;
        
        // Check if today is in their scheduled days
        const isScheduledDay = auto_start_days?.includes(currentDayName);

        console.log(`👤 User ${user_id}:`);
        console.log(`   Timezone: ${userTimezone}`);
        console.log(`   Today: ${currentDayName}`);
        console.log(`   Current hour: ${currentHour} (is 9 AM: ${is9AM})`);
        console.log(`   Scheduled days: ${JSON.stringify(auto_start_days)}`);
        console.log(`   Should start: ${isScheduledDay && is9AM}`);
        console.log(`   Budget: $${(daily_budget_cents || 0) / 100}`);

        // Skip if it's not 9 AM in user's timezone (unless test mode)
        if (!is9AM && !testMode) {
          console.log(`   ⏭️  Not 9 AM in user's timezone (${currentHour}:00), skipping`);
          results.push({ user_id, success: false, reason: `Not 9 AM (currently ${currentHour}:00 in ${userTimezone})` });
          continue;
        }

        if (!isScheduledDay && !testMode) {
          console.log(`   ⏭️  Not a scheduled day, skipping`);
          results.push({ user_id, success: false, reason: `Not scheduled for ${currentDayName}` });
          continue;
        }
        
        if (testMode && !is9AM) {
          console.log(`   🧪 TEST MODE: Ignoring 9 AM check (currently ${currentHour}:00)`);
        }
        
        if (testMode && !isScheduledDay) {
          console.log(`   🧪 TEST MODE: Ignoring day check (would skip ${currentDayName})`);
        }

        // Check if user has Retell config (required for calling)
        const { data: retellConfig } = await supabase
          .from('user_retell_config')
          .select('retell_agent_id, phone_number')
          .eq('user_id', user_id)
          .maybeSingle();

        if (!retellConfig?.retell_agent_id || !retellConfig?.phone_number) {
          console.log(`   ⚠️  No Retell config found, skipping`);
          results.push({ user_id, success: false, reason: 'No Retell config' });
          continue;
        }

        // Check if user has callable leads
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
        
        // Use the SAME query logic as next-call route for consistency!
        const { count: callableLeads } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user_id)
          .eq('is_qualified', true)
          .in('google_sheet_id', sheetIds)
          .in('status', ['new', 'callback_later', 'unclassified', 'no_answer', 'potential_appointment'])
          .neq('status', 'dead_lead')
          .or('total_calls_made.is.null,total_calls_made.lt.20');

        console.log(`   📊 Callable leads query result: ${callableLeads}`);

        if (!callableLeads || callableLeads === 0) {
          console.log(`   ⚠️  No callable leads found, skipping`);
          results.push({ user_id, success: false, reason: 'No callable leads' });
          continue;
        }

        console.log(`   ✅ Found ${callableLeads} callable leads`);
        
        // Store the callable lead count for later verification
        const expectedLeadCount = callableLeads;

        // ========================================================================
        // START THE AI - Update settings and trigger first call
        // ========================================================================
        console.log(`🚀 Starting AI for user ${user_id}`);

        // Calculate budget in dollars
        const budgetDollars = (daily_budget_cents || 1500) / 100; // Default $15

        // Get current today_spend for session-based budgeting
        const { data: currentAISettings } = await supabase
          .from('ai_control_settings')
          .select('today_spend')
          .eq('user_id', user_id)
          .maybeSingle();
        
        const currentTodaySpend = currentAISettings?.today_spend || 0;

        // Update AI control settings to running with budget mode
        // IMPORTANT: Set session_start_spend for session-based budget tracking!
        const { error: updateError } = await supabase
          .from('ai_control_settings')
          .upsert({
            user_id: user_id,
            status: 'running',
            queue_length: 0,
            calls_made_today: 0,
            execution_mode: 'leads', // Always 'leads' to pass DB constraint
            target_lead_count: 9999, // High number for budget mode
            budget_limit_cents: daily_budget_cents || 1500, // Use their budget
            session_start_spend: currentTodaySpend, // Track session start for budget mode
            auto_transfer_calls: true,
            last_call_status: 'scheduled_start',
          }, {
            onConflict: 'user_id'
          });

        if (updateError) {
          console.error(`❌ Error updating AI settings for user ${user_id}:`, updateError);
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
            target_value: budgetDollars,
            is_scheduled: true,
          });

        // Trigger the first call via next-call endpoint
        // Use RETRY LOGIC in case of transient failures!
        console.log(`📞 Triggering first call for user ${user_id}...`);
        
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
            
            // Check if it was successful OR if it stopped due to no leads (which means leads query worked)
            if (callResponse.ok && callResult.success) {
              callSuccess = true;
              console.log(`   ✅ Call triggered successfully on attempt ${attempt}`);
              break;
            } else if (callResult.done && callResult.reason === 'no_callable_leads') {
              // This means the query ran fine but no leads - this is a valid state, not a failure
              console.log(`   ⚠️  No callable leads returned (but query worked)`);
              lastError = 'No callable leads at time of call';
              break;
            } else {
              lastError = callResult.error || callResult.reason || 'Unknown error';
              console.log(`   ⚠️  Attempt ${attempt} failed: ${lastError}`);
              
              // Wait before retry (exponential backoff)
              if (attempt < maxRetries) {
                const waitMs = attempt * 2000; // 2s, 4s, 6s
                console.log(`   ⏳ Waiting ${waitMs}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitMs));
              }
            }
          } catch (fetchError: any) {
            lastError = fetchError.message || 'Network error';
            console.log(`   ❌ Attempt ${attempt} threw error: ${lastError}`);
            
            if (attempt < maxRetries) {
              const waitMs = attempt * 2000;
              console.log(`   ⏳ Waiting ${waitMs}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitMs));
            }
          }
        }
        
        if (callSuccess) {
          console.log(`✅ Successfully started AI for user ${user_id}:`, callResult);
          results.push({ 
            user_id, 
            success: true, 
            message: 'AI started successfully',
            budget: `$${budgetDollars}`,
            callableLeads: expectedLeadCount
          });
        } else {
          console.error(`❌ Failed to trigger call for user ${user_id} after ${maxRetries} attempts: ${lastError}`);
          
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

    // Summary
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log('');
    console.log('========================================');
    console.log('🏁 CRON JOB COMPLETE');
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
