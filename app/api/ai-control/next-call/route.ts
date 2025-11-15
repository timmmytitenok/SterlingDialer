import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getTodayDateString } from '@/lib/timezone-helpers';

/**
 * Call-by-Call System - Get Next Lead and Make Call
 * This replaces the N8N batch processing system
 */
export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    console.log('📞 next-call called for userId:', userId);

    // For server-to-server calls, use service role client to bypass RLS
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get AI settings
    const { data: aiSettings, error: settingsError } = await supabase
      .from('ai_control_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('📋 AI settings query result:', { found: !!aiSettings, error: settingsError });

    if (settingsError || !aiSettings) {
      console.error('❌ AI settings not found for user:', userId, settingsError);
      return NextResponse.json({ 
        error: 'AI settings not found',
        details: settingsError?.message || 'No AI control settings exist for this user',
        userId 
      }, { status: 404 });
    }

    console.log('✅ AI settings found, status:', aiSettings.status);

    // Check if AI is still running
    if (aiSettings.status !== 'running') {
      return NextResponse.json({ 
        done: true, 
        reason: 'AI stopped',
        message: 'AI has been stopped' 
      });
    }

    // Get today's date in user's timezone
    const userTimezone = aiSettings.user_timezone || 'America/New_York';
    const todayStr = getTodayDateString(userTimezone);

    // Reset daily counters if it's a new day
    let currentSpend = aiSettings.today_spend || 0;
    let callsMadeToday = aiSettings.calls_made_today || 0;

    if (aiSettings.spend_last_reset_date !== todayStr) {
      console.log('🔄 New day detected, resetting daily counters');
      currentSpend = 0;
      callsMadeToday = 0;

      await supabase
        .from('ai_control_settings')
        .update({
          today_spend: 0,
          calls_made_today: 0,
          spend_last_reset_date: todayStr,
        })
        .eq('user_id', userId);

      // Also reset all leads' daily attempt counters
      await supabase
        .from('leads')
        .update({ call_attempts_today: 0 })
        .eq('user_id', userId)
        .neq('last_attempt_date', todayStr);
    }

    // Check if daily spend limit reached
    const dailySpendLimit = aiSettings.daily_spend_limit || 10.00;
    if (currentSpend >= dailySpendLimit) {
      console.log('🛑 Daily spend limit reached');
      
      // Stop AI
      await supabase
        .from('ai_control_settings')
        .update({ status: 'stopped' })
        .eq('user_id', userId);

      return NextResponse.json({
        done: true,
        reason: 'spend_limit_reached',
        message: `Daily spend limit of $${dailySpendLimit} reached`,
        totalSpent: currentSpend,
      });
    }

    // Check if daily call limit reached (if using lead count mode)
    if (aiSettings.execution_mode === 'leads') {
      const targetLeadCount = aiSettings.target_lead_count || 100;
      if (callsMadeToday >= targetLeadCount) {
        console.log('🛑 Daily call limit reached');
        
        await supabase
          .from('ai_control_settings')
          .update({ status: 'stopped' })
          .eq('user_id', userId);

        return NextResponse.json({
          done: true,
          reason: 'call_limit_reached',
          message: `Target of ${targetLeadCount} calls reached`,
          callsMade: callsMadeToday,
        });
      }
    }

    // Determine current time period IN USER'S TIMEZONE
    const now = new Date();
    
    // Get current time in user's timezone
    const userTimeString = now.toLocaleString('en-US', { 
      timeZone: userTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    const currentHour = parseInt(userTimeString.split(':')[0]);
    const currentMinute = parseInt(userTimeString.split(':')[1]);
    
    console.log(`🕐 Server time (GMT): ${now.toISOString()}`);
    console.log(`🕐 User timezone: ${userTimezone}`);
    console.log(`🕐 User's local time: ${userTimeString} (${currentHour}:${currentMinute.toString().padStart(2, '0')})`);
    console.log(`🕐 Current hour (24h): ${currentHour}`);
    
    let currentTimePeriod = null;
    if (currentHour >= 8 && currentHour < 12) {
      currentTimePeriod = 'morning';
      console.log('   → Morning (8am-12pm)');
    } else if (currentHour >= 12 && currentHour < 18) {
      currentTimePeriod = 'daytime';
      console.log('   → Daytime (12pm-6pm)');
    } else if (currentHour >= 18 && currentHour < 21) {
      currentTimePeriod = 'evening';
      console.log('   → Evening (6pm-9pm)');
    } else {
      console.log('   → OUTSIDE HOURS');
      console.log(`   → Hour ${currentHour} is not in range 8-20`);
    }
    
    console.log(`🕐 Time period: ${currentTimePeriod || 'OUTSIDE HOURS'}`);
    
    // Check if calling hours are disabled (for testing)
    const callingHoursDisabled = aiSettings.disable_calling_hours === true;
    
    if (callingHoursDisabled) {
      console.log('⚠️  CALLING HOURS CHECK DISABLED (testing mode)');
      console.log(`   Current time: ${userTimeString} (would normally be outside hours)`);
      // Use a default time period for tracking
      if (!currentTimePeriod) {
        currentTimePeriod = 'evening'; // Default to evening if outside normal hours
        console.log(`   Using default time period: ${currentTimePeriod}`);
      }
    } else if (!currentTimePeriod) {
      // Normal mode - enforce calling hours
      console.log(`🛑 Outside calling hours! Current time: ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);
      console.log(`   Calling hours: 8am-9pm (${userTimezone})`);
      console.log(`   Current: ${currentHour < 8 ? 'Too early' : 'Too late'}`);
      
      await supabase
        .from('ai_control_settings')
        .update({ status: 'stopped', last_call_status: 'outside_calling_hours' })
        .eq('user_id', userId);
      
      return NextResponse.json({
        done: true,
        reason: 'outside_calling_hours',
        message: `Outside calling hours (8am-9pm in ${userTimezone}). Current time: ${userTimeString}`,
        userTime: userTimeString,
        timezone: userTimezone
      });
    }
    
    console.log(`✅ ${callingHoursDisabled ? 'Calling hours disabled - continuing anyway' : 'Within calling hours'}! Time period: ${currentTimePeriod}`);

    // ========================================================================
    // SUPER SIMPLE LEAD QUERY - NO FANCY FILTERING
    // ========================================================================
    console.log('🔍 ========== LOOKING FOR LEADS ==========');
    console.log(`📞 User ID: ${userId}`);
    
    // STEP 1: Count ALL leads for this user
    const { count: totalLeadsCount, error: countError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    console.log(`📊 Total leads in database: ${totalLeadsCount}`);
    if (countError) console.error('❌ Error counting leads:', countError);
    
    if (!totalLeadsCount || totalLeadsCount === 0) {
      console.log('❌ NO LEADS FOUND IN DATABASE!');
      await supabase
        .from('ai_control_settings')
        .update({ status: 'stopped', last_call_status: 'no_leads' })
        .eq('user_id', userId);
      
      return NextResponse.json({
        done: true,
        reason: 'no_leads',
        message: 'No leads found in database. Please add leads first.',
      });
    }
    
    // STEP 2: Try the simplest possible query - just get ANY lead
    console.log('🔍 Fetching first available lead (no filters)...');
    const { data: anyLead, error: anyLeadError } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    console.log('📋 First lead (any):', {
      found: !!anyLead,
      error: anyLeadError,
      id: anyLead?.id,
      name: anyLead?.name,
      phone: anyLead?.phone,
      status: anyLead?.status,
      is_qualified: anyLead?.is_qualified
    });
    
    // STEP 3: Check if is_qualified column exists
    const hasQualifiedColumn = anyLead && 'is_qualified' in anyLead;
    console.log(`📊 Has is_qualified column: ${hasQualifiedColumn}`);
    
    // STEP 4: Get a callable lead
    let nextLead = null;
    let leadError = null;
    
    console.log('🔍 Searching for callable lead...');
    console.log(`   Today's date: ${todayStr}`);
    
    try {
      let query = supabase
        .from('leads')
        .select('*')
        .eq('user_id', userId);
      
      // Only filter by is_qualified if the column exists
      if (hasQualifiedColumn) {
        console.log('   ✓ Filtering by is_qualified = true');
        query = query.eq('is_qualified', true);
      } else {
        console.log('   ⚠️ is_qualified column not found, skipping filter');
      }
      
      // Filter by status - include callable statuses
      console.log('   ✓ Filtering by callable statuses');
      query = query.in('status', ['new', 'callback_later', 'unclassified', 'no_answer']);
      
      // CRITICAL: Exclude ALL leads already called today (no exceptions!)
      // Once a lead is called, don't call it again the same day
      console.log('   ✓ Excluding ALL leads already called today');
      query = query.or(`call_attempts_today.is.null,call_attempts_today.eq.0,last_attempt_date.neq.${todayStr}`);
      
      query = query
        .order('created_at', { ascending: true })
        .limit(1);
      
      const result = await query.maybeSingle();
      nextLead = result.data;
      leadError = result.error;
      
      console.log('🔍 Query result:', {
        found: !!nextLead,
        error: leadError,
        leadId: nextLead?.id,
        leadName: nextLead?.name,
        leadStatus: nextLead?.status,
        leadPhone: nextLead?.phone,
        callAttemptsToday: nextLead?.call_attempts_today,
        lastAttemptDate: nextLead?.last_attempt_date
      });
      
      if (nextLead) {
        console.log(`✅ Found lead to call: ${nextLead.name}`);
        console.log(`   - Status: ${nextLead.status}`);
        console.log(`   - Call attempts today: ${nextLead.call_attempts_today || 0}`);
        console.log(`   - Last attempt date: ${nextLead.last_attempt_date || 'never'}`);
      }
    } catch (queryError: any) {
      console.error('❌ EXCEPTION in lead query:', queryError);
      leadError = queryError;
    }
    
    console.log('🔍 ========== LEAD SEARCH COMPLETE ==========');

    if (leadError) {
      console.error('Error fetching next lead:', leadError);
      return NextResponse.json({ error: 'Error fetching leads' }, { status: 500 });
    }

    if (!nextLead) {
      console.log('❌ ========== NO CALLABLE LEADS FOUND ==========');
      console.log(`📊 Total leads in DB: ${totalLeadsCount}`);
      
      // Get ALL leads to show their statuses
      const { data: allLeads } = await supabase
        .from('leads')
        .select('id, name, phone, status, is_qualified')
        .eq('user_id', userId)
        .limit(20);
      
      console.log('📋 All leads in database:');
      allLeads?.forEach((lead, idx) => {
        console.log(`   ${idx + 1}. ${lead.name} - Status: ${lead.status}, Qualified: ${lead.is_qualified ?? 'N/A'}`);
      });
      
      console.log('');
      console.log('🔧 POSSIBLE FIXES:');
      console.log('   1. Run this SQL in Supabase:');
      console.log('      UPDATE leads SET is_qualified = true WHERE user_id = \'' + userId + '\';');
      console.log('   2. Or change lead status to "new":');
      console.log('      UPDATE leads SET status = \'new\' WHERE user_id = \'' + userId + '\';');
      console.log('');
      
      // Stop AI
      await supabase
        .from('ai_control_settings')
        .update({ status: 'stopped', last_call_status: 'no_callable_leads' })
        .eq('user_id', userId);

      return NextResponse.json({
        done: true,
        reason: 'no_callable_leads',
        message: 'No callable leads found. Check if leads are qualified and have correct status.',
        totalLeads: totalLeadsCount,
        sampleLeads: allLeads?.slice(0, 5).map(l => ({
          name: l.name,
          status: l.status,
          qualified: l.is_qualified
        }))
      });
    }

    // ========================================================================
    // FORMAT PHONE NUMBER TO E.164 (+1 for US)
    // ========================================================================
    let phoneToCall = nextLead.phone.replace(/\D/g, ''); // Remove all non-digits
    
    console.log(`📞 Original phone: ${nextLead.phone}`);
    console.log(`   Cleaned: ${phoneToCall}`);
    
    // If 10 digits, add +1 for US
    if (phoneToCall.length === 10) {
      phoneToCall = `+1${phoneToCall}`;
      console.log(`   ✅ Auto-formatted to E.164: ${phoneToCall}`);
    } else if (phoneToCall.length === 11 && phoneToCall.startsWith('1')) {
      phoneToCall = `+${phoneToCall}`;
      console.log(`   ✅ Auto-formatted to E.164: ${phoneToCall}`);
    } else if (!phoneToCall.startsWith('+')) {
      phoneToCall = `+${phoneToCall}`;
      console.log(`   ⚠️ Added + prefix: ${phoneToCall}`);
    }

    console.log(`📞 Preparing to call lead ${nextLead.id} (${nextLead.name})`);
    console.log(`   - Phone to call: ${phoneToCall}`);
    console.log(`   - Current status: ${nextLead.status}`);
    console.log(`   - Total missed calls: ${nextLead.total_missed_calls || 0}/18`);
    console.log(`   - Morning missed: ${nextLead.morning_missed_calls || 0}/6`);
    console.log(`   - Daytime missed: ${nextLead.daytime_missed_calls || 0}/6`);
    console.log(`   - Evening missed: ${nextLead.evening_missed_calls || 0}/6`);
    console.log(`   - Calling in time period: ${currentTimePeriod}`);

    // Get user's Retell agent ID and phone number
    console.log('📋 Fetching Retell config for user:', userId);
    
    const { data: retellConfig, error: configError } = await supabase
      .from('user_retell_config')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('📋 Retell config result:', { 
      found: !!retellConfig, 
      error: configError,
      config: retellConfig ? {
        has_agent_id: !!retellConfig.retell_agent_id,
        has_phone: !!retellConfig.phone_number,
        agent_name: retellConfig.agent_name
      } : null
    });

    if (configError || !retellConfig) {
      console.error('❌ No Retell config found for user');
      return NextResponse.json({ 
        error: 'Retell not configured. Go to Admin → Manage Users to set up your agent.' 
      }, { status: 400 });
    }

    // Validate config has required fields
    if (!retellConfig.retell_agent_id) {
      console.error('❌ Missing retell_agent_id');
      return NextResponse.json({ 
        error: 'Retell Agent ID not configured. Go to Admin → Manage Users to set your Agent ID.' 
      }, { status: 400 });
    }

    if (!retellConfig.phone_number) {
      console.error('❌ Missing phone_number');
      return NextResponse.json({ 
        error: 'Outbound phone number not configured. Go to Admin → Manage Users to set your phone number.' 
      }, { status: 400 });
    }

    // Make call via Retell API
    const retellApiKey = process.env.RETELL_API_KEY;
    
    console.log('🔑 Checking RETELL_API_KEY:', retellApiKey ? `SET (starts with: ${retellApiKey.substring(0, 10)}...)` : 'NOT SET');
    
    if (!retellApiKey) {
      console.error('❌ RETELL_API_KEY not set in environment');
      return NextResponse.json({ 
        error: 'Retell API key not configured. Add RETELL_API_KEY to .env.local and restart server.' 
      }, { status: 500 });
    }

    console.log(`📞 Making call with Agent: ${retellConfig.retell_agent_id}, From: ${retellConfig.phone_number}, To: ${nextLead.phone}`);

    const callPayload = {
      agent_id: retellConfig.retell_agent_id,
      to_number: phoneToCall, // Use formatted phone!
      from_number: retellConfig.phone_number,
      metadata: {
        user_id: userId,
        lead_id: nextLead.id,
        lead_name: nextLead.name,
        lead_phone: phoneToCall, // Use formatted phone!
        attempt_number: (nextLead.call_attempts_today || 0) + 1,
      },
      retell_llm_dynamic_variables: {
        customer_name: nextLead.name || 'there',
        lead_name: nextLead.name,
        lead_phone: phoneToCall, // Use formatted phone!
        userId: userId,
        leadId: nextLead.id,
        live_transfer: "true",
        attempt_number: String((nextLead.call_attempts_today || 0) + 1),
      },
    };

    console.log('📞 Call payload:', JSON.stringify(callPayload, null, 2));
    console.log('📞 Authorization header:', `Bearer ${retellApiKey.substring(0, 15)}...${retellApiKey.substring(retellApiKey.length - 5)}`);
    console.log('📞 API Endpoint:', 'https://api.retellai.com/v2/create-phone-call');

    // Create call via Retell - using agent_id (not override_agent_id)
    const callResponse = await fetch('https://api.retellai.com/v2/create-phone-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${retellApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(callPayload),
    });

    console.log('📞 Retell API response status:', callResponse.status);
    console.log('📞 Retell API response headers:', Object.fromEntries(callResponse.headers.entries()));

    if (!callResponse.ok) {
      const errorText = await callResponse.text();
      console.error('❌ Retell API error response:', errorText.substring(0, 500));
      
      // Parse error
      let errorMessage = 'Failed to create call';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || JSON.stringify(errorJson);
      } catch {
          errorMessage = errorText.substring(0, 200);
        }
      
      console.error(`❌ Call failed for lead ${nextLead.id}: ${errorMessage}`);
      console.log('');
      console.log('🔧 Marking lead as needs_review and moving to next lead...');
      
      // Mark this lead as needing review (bad phone number or other issue)
      await supabase
        .from('leads')
        .update({
          status: 'needs_review',
          last_call_outcome: `error: ${errorMessage.substring(0, 100)}`,
          call_attempts_today: (nextLead.call_attempts_today || 0) + 1,
          last_attempt_date: todayStr,
        })
        .eq('id', nextLead.id);
      
      console.log(`✅ Lead ${nextLead.name} marked as needs_review`);
      console.log('🔄 Recursively calling next-call to try the next lead...');
      
      // Try the next lead recursively
      return fetch('http://localhost:3000/api/ai-control/next-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
        .then(res => res.json())
        .then(data => NextResponse.json(data))
        .catch(err => {
          console.error('❌ Recursive call failed:', err);
      return NextResponse.json({ 
            error: `Call failed and retry failed: ${errorMessage}` 
      }, { status: 500 });
        });
    }

    const callData = await callResponse.json();
    console.log('✅ Call created successfully:', callData.call_id);

    // Update lead with new attempt
    await supabase
      .from('leads')
      .update({
        call_attempts_today: (nextLead.call_attempts_today || 0) + 1,
        last_attempt_date: todayStr,
        last_called: new Date().toISOString(),
      })
      .eq('id', nextLead.id);

    // Update AI settings with current call info
    await supabase
      .from('ai_control_settings')
      .update({
        current_call_id: callData.call_id,
        current_lead_id: nextLead.id,
        last_call_status: 'calling',
      })
      .eq('user_id', userId);

    return NextResponse.json({
      success: true,
      callId: callData.call_id,
      leadId: nextLead.id,
      leadName: nextLead.name,
      leadPhone: nextLead.phone,
      attemptNumber: (nextLead.call_attempts_today || 0) + 1,
      callsMadeToday: callsMadeToday + 1,
      currentSpend: currentSpend,
      spendLimit: dailySpendLimit,
    });
  } catch (error: any) {
    console.error('❌ Error in next-call:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process next call' },
      { status: 500 }
    );
  }
}

