import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Vercel Cron Job Endpoint - Auto-Start AI
 * This endpoint is called by Vercel Cron every hour to check if any users have scheduled AI starts
 * It uses each user's timezone to determine if it's time to start
 */
export async function GET(request: Request) {
  try {
    // Verify this is a legitimate cron request from Vercel
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('❌ Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get all users with scheduling enabled
    const { data: scheduledUsers, error } = await supabase
      .from('ai_control_settings')
      .select('user_id, schedule_enabled, schedule_time, schedule_days, user_timezone, status, daily_call_limit')
      .eq('schedule_enabled', true);

    if (error) throw error;

    console.log(`🔍 Found ${scheduledUsers?.length || 0} users with scheduling enabled`);

    if (!scheduledUsers || scheduledUsers.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No users have scheduling enabled',
        usersChecked: 0
      });
    }

    const results = [];

    for (const userSettings of scheduledUsers) {
      const { user_id, schedule_days, user_timezone, status, daily_call_limit } = userSettings;

      // Skip if already running
      if (status === 'running') {
        console.log(`⏭️  User ${user_id} AI already running, skipping`);
        continue;
      }

      // Get current day of week in user's timezone
      const now = new Date();
      const userTimezone = user_timezone || 'America/New_York';
      
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: userTimezone,
        weekday: 'short'
      });

      const currentWeekday = formatter.format(now);

      // Map weekday to number (0 = Sunday, 1 = Monday, etc.)
      const weekdayMap: { [key: string]: number } = {
        'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
      };
      const currentDay = weekdayMap[currentWeekday || 'Mon'] || 1;

      // Check if today is a scheduled day (cron runs at 9 AM PST / 12 PM EST for everyone)
      const isScheduledDay = schedule_days?.includes(currentDay);

      console.log(`👤 User ${user_id} - Timezone: ${userTimezone}, Today: day ${currentDay} (${currentWeekday}), Scheduled days: ${schedule_days}, Should start: ${isScheduledDay}`);

      if (isScheduledDay) {
        console.log(`🚀 Starting AI for user ${user_id}`);

        // Update status to running
        const { error: updateError } = await supabase
          .from('ai_control_settings')
          .update({
            status: 'running',
            queue_length: 0,
            execution_mode: 'leads',
            target_lead_count: daily_call_limit || 100,
            auto_transfer_calls: true,
          })
          .eq('user_id', user_id);

        if (updateError) {
          console.error(`❌ Error starting AI for user ${user_id}:`, updateError);
          results.push({ user_id, success: false, error: updateError.message });
        } else {
          // Get user's N8N webhook to trigger the actual AI
          const { data: webhookConfig } = await supabase
            .from('user_n8n_webhooks')
            .select('ai_agent_webhook_url, ai_agent_webhook_enabled')
            .eq('user_id', user_id)
            .maybeSingle();

          if (webhookConfig?.ai_agent_webhook_url && webhookConfig.ai_agent_webhook_enabled) {
            try {
              // Trigger N8N webhook
              const webhookResponse = await fetch(webhookConfig.ai_agent_webhook_url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: user_id,
                  action: 'start',
                  liveTransferEnabled: true,
                  dailyCallLimit: daily_call_limit || 100,
                  executionMode: 'leads',
                  targetLeadCount: daily_call_limit || 100,
                  stopCondition: 'lead_count',
                  scheduledStart: true,
                  timestamp: new Date().toISOString(),
                }),
              });

              console.log(`📡 N8N webhook triggered for user ${user_id}, status: ${webhookResponse.status}`);
              results.push({ user_id, success: true, message: 'AI started successfully' });
            } catch (webhookError) {
              console.error(`❌ Error triggering webhook for user ${user_id}:`, webhookError);
              results.push({ user_id, success: false, error: 'Failed to trigger webhook' });
            }
          } else {
            console.log(`⚠️  No N8N webhook configured for user ${user_id}`);
            results.push({ user_id, success: false, error: 'No webhook configured' });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${scheduledUsers.length} users`,
      usersChecked: scheduledUsers.length,
      usersStarted: results.length,
      results,
    });
  } catch (error: any) {
    console.error('❌ Cron job error:', error);
    return NextResponse.json(
      { error: error.message || 'Cron job failed' },
      { status: 500 }
    );
  }
}

