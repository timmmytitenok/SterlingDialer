import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getTodayDateString } from '@/lib/timezone-helpers';

/**
 * Retell Webhook - Enhanced Call Processing with Double-Dial & Time-Based Tracking
 * PUBLIC ENDPOINT - No auth required (Retell calls this)
 * 
 * Features:
 * - Checks for 'call_analyzed' event (fully processed calls)
 * - Detects voicemail via in_voicemail flag
 * - Implements double-dial logic for voicemails
 * - Tracks time-of-day calls (morning/daytime/evening)
 * - Implements 18-missed-call logic (6 per time period)
 * - Accurate status classification (NOT_INTERESTED, CALLBACK, BOOKED, LIVE_TRANSFER, etc.)
 */
export async function POST(request: Request) {
  try {
    console.log('');
    console.log('');
    console.log('🚨🚨🚨 ========== RETELL WEBHOOK RECEIVED ========== 🚨🚨🚨');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('🌐 Request URL:', request.url);
    console.log('');
    
    const headers = Object.fromEntries(request.headers.entries());
    console.log('📋 Request Headers:', JSON.stringify(headers, null, 2));
    console.log('');
    
    const body = await request.json();
    
    console.log('📦 Full Webhook Body:');
    console.log(JSON.stringify(body, null, 2));
    console.log('');
    console.log('🔍 Event Type:', body.event);
    console.log('🚨🚨🚨 ================================================ 🚨🚨🚨');
    console.log('');
    
    // CRITICAL: Only process fully analyzed calls
    if (body.event !== 'call_analyzed') {
      console.log(`⏭️  Skipping event: ${body.event} (waiting for call_analyzed)`);
      return NextResponse.json({ 
        received: true, 
        skipped: true,
        reason: 'Not a call_analyzed event' 
      });
    }
    
    console.log('✅ Event is call_analyzed - processing full call analysis');
    
    // For "call_analyzed" event, data is in body.call
    const callData = body.call;

    const { 
      call_id,
      call_status,
      start_timestamp,
      end_timestamp,
      transcript,
      recording_url,
      call_analysis,
      disconnection_reason,
      metadata,
    } = callData;

    console.log('📞 Call ID:', call_id);
    console.log('📊 Call Status:', call_status);
    console.log('🎯 Metadata:', metadata);
    console.log('🔌 Disconnection Reason:', disconnection_reason);
    console.log('📊 Call Analysis:', JSON.stringify(call_analysis, null, 2));

    // Use createClient to access database (no user auth needed for webhooks)
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Extract metadata
    const userId = metadata?.user_id;
    const leadId = metadata?.lead_id;
    
    // Check metadata for double dial flag (multiple formats for safety)
    const metadataDoubleDial = metadata?.was_double_dial === true || 
                               metadata?.was_double_dial === 'true' || 
                               metadata?.was_double_dial === 1 ||
                               metadata?.was_double_dial === '1';
    
    console.log('🔍 METADATA CHECK:');
    console.log(`   - Raw was_double_dial value: ${JSON.stringify(metadata?.was_double_dial)}`);
    console.log(`   - Type: ${typeof metadata?.was_double_dial}`);
    console.log(`   - Parsed as double dial: ${metadataDoubleDial}`);

    // Save webhook to database for debugging
    try {
      await supabase
        .from('webhook_logs')
        .insert({
          webhook_type: 'retell_call_analyzed',
          call_id: call_id,
          user_id: userId,
          lead_id: leadId,
          payload: body,
          headers: headers,
          status: 'processing',
        });
      console.log('✅ Webhook logged to database');
    } catch (logError) {
      console.error('❌ Failed to log webhook:', logError);
    }

    if (!userId || !leadId) {
      console.error('❌ Missing user_id or lead_id in metadata');
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    // Get lead data
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (!lead) {
      console.error('❌ Lead not found:', leadId);
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // ========================================================================
    // DOUBLE DIAL DETECTION - CRITICAL SECTION
    // ========================================================================
    console.log('');
    console.log('🔍🔍🔍 ========== DOUBLE DIAL DETECTION ========== 🔍🔍🔍');
    
    // Check metadata
    let wasDoubleDial = metadataDoubleDial;
    console.log(`   Metadata was_double_dial: ${JSON.stringify(metadata?.was_double_dial)} (parsed: ${metadataDoubleDial})`);
    
    // Check fallback - was lead called recently?
    const lastDialAt = lead.last_dial_at ? new Date(lead.last_dial_at) : null;
    const now = new Date();
    const timeSinceLastDial = lastDialAt ? (now.getTime() - lastDialAt.getTime()) / 1000 : Infinity;
    
    console.log(`   Lead last_dial_at in DB: ${lead.last_dial_at || 'NULL/NEVER SET'}`);
    console.log(`   Current time: ${now.toISOString()}`);
    console.log(`   Time since last dial: ${timeSinceLastDial === Infinity ? 'NEVER' : timeSinceLastDial.toFixed(0) + 's'}`);
    
    // FALLBACK: If lead was called within 5 MINUTES, treat as double dial
    if (!wasDoubleDial && timeSinceLastDial < 300) {
      console.log('⚠️  FALLBACK TRIGGERED: Lead was called within 5 minutes!');
      wasDoubleDial = true;
    }
    
    console.log(`   ➡️  FINAL wasDoubleDial: ${wasDoubleDial}`);
    console.log('🔍🔍🔍 ============================================ 🔍🔍🔍');
    console.log('');

    // ========================================================================
    // 🔥🔥🔥 DOUBLE DIAL NO ANSWER - EARLY RETURN 🔥🔥🔥
    // ========================================================================
    // Only trigger if:
    // 1. This is a double dial (second attempt)
    // 2. AND the call was NOT answered (duration < 10 seconds)
    // If they PICKED UP (duration >= 10s), let normal flow handle it!
    
    // Calculate duration for this call
    const durationSecondsDD = end_timestamp && start_timestamp 
      ? (end_timestamp - start_timestamp) / 1000
      : 0;
    
    // Call is considered ANSWERED if duration >= 10 seconds
    const callWasPickedUp = durationSecondsDD >= 10;
    
    console.log(`📞 Call duration: ${durationSecondsDD.toFixed(1)}s`);
    console.log(`📞 Call was picked up (>=10s): ${callWasPickedUp}`);
    
    if (wasDoubleDial && !callWasPickedUp) {
      // Double dial AND they didn't pick up - mark as no_answer
      console.log('');
      console.log('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥');
      console.log('🔥 DOUBLE DIAL + NO ANSWER - UPDATING LEAD TO NO_ANSWER! 🔥');
      console.log(`🔥 Duration: ${durationSecondsDD.toFixed(1)}s (< 10s = not picked up)`);
      console.log('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥');
      console.log('');
      
      // 1. UPDATE THE LEAD
      const newTimesDialed = (lead.times_dialed || 0) + 1;
      const newTotalCalls = (lead.total_calls_made || 0) + 1;
      const newCallAttemptsToday = (lead.call_attempts_today || 0) + 1;
      
      // Get today's date string for tracking "already called today"
      const { data: settingsForTz } = await supabase
        .from('ai_control_settings')
        .select('user_timezone')
        .eq('user_id', userId)
        .single();
      const userTz = settingsForTz?.user_timezone || 'America/New_York';
      const todayStrDD = getTodayDateString(userTz);
      
      console.log('📝 UPDATING LEAD:');
      console.log(`   Lead ID: ${leadId}`);
      console.log(`   status: ${lead.status} → no_answer`);
      console.log(`   times_dialed: ${lead.times_dialed || 0} → ${newTimesDialed}`);
      console.log(`   call_attempts_today: ${lead.call_attempts_today || 0} → ${newCallAttemptsToday}`);
      console.log(`   last_attempt_date: → ${todayStrDD}`);
      
      const { error: leadErr } = await supabase
        .from('leads')
        .update({
          status: 'no_answer',
          times_dialed: newTimesDialed,
          total_calls_made: newTotalCalls,
          call_attempts_today: newCallAttemptsToday,
          last_attempt_date: todayStrDD,
          last_call_outcome: 'no_answer',
          last_dial_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);
      
      if (leadErr) {
        console.error('❌ LEAD UPDATE FAILED:', leadErr);
      } else {
        console.log('✅ LEAD UPDATED: status=no_answer, times_dialed=' + newTimesDialed + ', call_attempts_today=' + newCallAttemptsToday);
      }
      
      // 2. UPDATE calls_made_today
      const { data: settings } = await supabase
        .from('ai_control_settings')
        .select('calls_made_today')
        .eq('user_id', userId)
        .single();
      
      const newCallCount = (settings?.calls_made_today || 0) + 1;
      console.log(`📊 calls_made_today: ${settings?.calls_made_today || 0} → ${newCallCount}`);
      
      const { error: settingsErr } = await supabase
        .from('ai_control_settings')
        .update({ 
          calls_made_today: newCallCount,
          last_call_status: 'no_answer'
        })
        .eq('user_id', userId);
      
      if (settingsErr) {
        console.error('❌ SETTINGS UPDATE FAILED:', settingsErr);
      } else {
        console.log('✅ calls_made_today UPDATED to ' + newCallCount);
      }
      
      // 3. CREATE CALL RECORD
      const { error: callErr } = await supabase
        .from('calls')
        .insert({
          user_id: userId,
          lead_id: leadId,
          call_id: call_id,
          lead_name: lead.name || 'Unknown',
          phone_number: lead.phone || 'N/A',
          duration: durationSecondsDD / 60,
          disposition: 'no_answer',
          outcome: 'no_answer',
          connected: false,
          cost: 0,
          recording_url: recording_url,
          in_voicemail: call_analysis?.in_voicemail === true,
          was_double_dial: true,
          created_at: new Date().toISOString(),
        });
      
      if (callErr) {
        console.error('❌ CALL RECORD FAILED:', callErr);
      } else {
        console.log('✅ CALL RECORD CREATED');
      }
      
      // 4. TRIGGER NEXT LEAD
      console.log('📞 Triggering next lead...');
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sterlingdialer.com';
        const nextCallResponse = await fetch(`${baseUrl}/api/ai-control/next-call`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userId }),
        });
        const nextCallResult = await nextCallResponse.json();
        console.log('✅ Next call triggered:', nextCallResult.success ? 'SUCCESS' : 'FAILED');
      } catch (e: any) {
        console.error('❌ Failed to trigger next call:', e.message);
      }
      
      console.log('');
      console.log('🔥 DOUBLE DIAL NO ANSWER COMPLETE - RETURNING! 🔥');
      console.log('');
      
      return NextResponse.json({
        success: true,
        outcome: 'no_answer',
        wasDoubleDial: true,
        leadUpdated: !leadErr,
        callCountUpdated: !settingsErr,
      });
    }
    
    // If we get here, either:
    // 1. NOT a double dial (first attempt) - need to check if should double dial
    // 2. IS a double dial but call WAS picked up (duration >= 10s) - process normally
    if (wasDoubleDial && callWasPickedUp) {
      console.log('');
      console.log('📞 DOUBLE DIAL BUT CALL WAS PICKED UP!');
      console.log(`📞 Duration: ${durationSecondsDD.toFixed(1)}s - Processing as normal answered call`);
      console.log('');
    }
    
    // ========================================================================
    // CONTINUE WITH NORMAL FLOW FOR OTHER CASES
    // ========================================================================
    const durationSeconds = durationSecondsDD; // Use already calculated value
    const durationMinutes = durationSeconds / 60;

    console.log(`📊 Call Duration: ${durationSeconds}s (${durationMinutes.toFixed(2)}min)`);

    // Get user settings and pricing
    const { data: aiSettings } = await supabase
      .from('ai_control_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!aiSettings) {
      console.error('❌ AI settings not found for user:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's cost per minute based on their subscription tier
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('cost_per_minute, subscription_tier')
      .eq('user_id', userId)
      .single();

    const costPerMinute = userProfile?.cost_per_minute || 0.40; // Default to $0.40
    console.log(`💰 User cost per minute: $${costPerMinute} (tier: ${userProfile?.subscription_tier || 'unknown'})`);

    const userTimezone = aiSettings.user_timezone || 'America/New_York';
    const todayStr = getTodayDateString(userTimezone);

    // Note: We no longer track time periods (morning/daytime/evening)
    // Simple 20-attempt system now
    console.log(`🕐 Processing call result for lead ${leadId}`);

    // CRITICAL: Check if call went to voicemail
    const inVoicemail = call_analysis?.in_voicemail === true;
    console.log(`📞 In Voicemail: ${inVoicemail}`);

    // Track who hung up
    let hungUpBy = 'unknown';
    if (disconnection_reason === 'agent_hangup' || disconnection_reason === 'agent_ended') {
      hungUpBy = 'AI';
      console.log('🤖 AI hung up');
    } else if (disconnection_reason === 'user_hangup' || disconnection_reason === 'user_ended') {
      hungUpBy = 'User';
      console.log('👤 User hung up');
    }

    let outcome = 'unclassified';
    let leadStatus = 'unclassified';
    let callCost = 0;
    let shouldDoubleDial = false;
    let shouldContinueToNextLead = true;

    // ========================================================================
    // CALL CLASSIFICATION LOGIC
    // ========================================================================
    
    // Parse custom analysis data FIRST (needed to determine if call was actually answered)
    const customAnalysis = call_analysis?.custom_analysis_data || {};
    console.log('📊 Custom Analysis Data:', customAnalysis);
    
    // ========================================================================
    // CRITICAL: CALLS UNDER 10 SECONDS = TREAT AS UNANSWERED
    // ========================================================================
    // Regardless of what Retell says, if the call was under 10 seconds:
    // - It's NOT a real conversation
    // - Treat it as unanswered/unclassified
    // - Apply double dial logic
    // - DON'T show in call history
    const isShortCall = durationSeconds < 10;
    
    if (isShortCall) {
      console.log('');
      console.log('⚡⚡⚡ ========== SHORT CALL DETECTED (<10 SECONDS) ========== ⚡⚡⚡');
      console.log(`📞 Duration: ${durationSeconds.toFixed(1)}s - TOO SHORT!`);
      console.log('🔄 Treating as NO ANSWER regardless of Retell analysis');
      console.log('   → Will apply double dial logic');
      console.log('   → Lead status will be set to: no_answer');
      console.log('⚡⚡⚡ ====================================================== ⚡⚡⚡');
      console.log('');
    }
    
    // Check if ANY outcome flag is true - this proves the call was answered!
    // BUT IGNORE THIS IF CALL IS UNDER 10 SECONDS!
    const hasOutcomeFlag = !isShortCall && (
                           customAnalysis.BOOKED === true || 
                           customAnalysis.NOT_INTERESTED === true || 
                           customAnalysis.CALLBACK === true || 
                           customAnalysis.LIVE_TRANSFER === true);
    
    // CRITICAL FIX: A call is ONLY answered if:
    // 1. Not a short call (<10 seconds)
    // 2. NOT voicemail OR has an actual outcome flag
    // 3. Has at least ONE outcome flag OR duration is significant (>30s) indicating real conversation
    // 
    // ========================================================================
    // SIMPLE RULE: ANY call >= 10 seconds = ANSWERED. Period.
    // ========================================================================
    // User's explicit requirement: If they pick up and it lasts 10+ seconds,
    // that's an answered call. No double dial. Shows in call history.
    // Don't overcomplicate with "likely no answer" guessing.
    const callWasAnswered = durationSeconds >= 10;
    
    console.log(`📊 Call classification:`);
    console.log(`   - Duration: ${durationSeconds.toFixed(1)}s`);
    console.log(`   - Is short call (<10s): ${isShortCall}`);
    console.log(`   - In voicemail: ${inVoicemail}`);
    console.log(`   - Has outcome flag: ${hasOutcomeFlag} (BOOKED=${customAnalysis.BOOKED}, NOT_INTERESTED=${customAnalysis.NOT_INTERESTED}, CALLBACK=${customAnalysis.CALLBACK}, LIVE_TRANSFER=${customAnalysis.LIVE_TRANSFER})`);
    console.log(`   - Call >= 10s = ANSWERED: ${callWasAnswered}`);
    console.log(`   - Was answered: ${callWasAnswered}`);
    console.log(`   - Was double dial: ${wasDoubleDial}`);
    
    if (!callWasAnswered) {
      // NO ANSWER (voicemail OR just rang with no pickup OR short call <10s)
      if (isShortCall) {
        console.log('📞 Call was TOO SHORT (<10s) - treating as unanswered');
      } else {
        console.log('📞 Call was NOT answered (no pickup/voicemail)');
      }
      
      if (!wasDoubleDial) {
        // First dial - NO ANSWER - DOUBLE DIAL NOW!
        shouldDoubleDial = true;
        shouldContinueToNextLead = false;
        // Use simple outcome for tracking (won't create record yet anyway)
        outcome = 'no_answer';
        // Keep current status - we're about to double dial
        leadStatus = lead.status || 'new';
        console.log('🔄 FIRST ATTEMPT NO ANSWER - Will double dial immediately!');
        console.log('   → Lead status stays: ' + leadStatus + ' (waiting for double dial result)');
        console.log('   → This does NOT count as a dial yet');
      } else {
        // ================================================================
        // 🔥🔥🔥 DOUBLE DIAL NO ANSWER - DO EVERYTHING HERE! 🔥🔥🔥
        // ================================================================
        outcome = 'no_answer';
        leadStatus = 'no_answer';
        
        console.log('');
        console.log('📵📵📵 ========== DOUBLE DIAL NO ANSWER ========== 📵📵📵');
        console.log('🔢 Counting as 1 completed dial!');
        console.log('📌 Setting lead status to: no_answer');
        console.log('📞 Incrementing times_dialed');
        console.log('📵📵📵 ========================================= 📵📵📵');
        
        // ================================================================
        // 1. UPDATE THE LEAD - STATUS AND TIMES_DIALED
        // ================================================================
        const newTimesDialed = (lead.times_dialed || 0) + 1;
        const newTotalCalls = (lead.total_calls_made || 0) + 1;
        
        console.log(`📝 Updating lead ${leadId}:`);
        console.log(`   - status: ${lead.status} → no_answer`);
        console.log(`   - times_dialed: ${lead.times_dialed || 0} → ${newTimesDialed}`);
        console.log(`   - total_calls_made: ${lead.total_calls_made || 0} → ${newTotalCalls}`);
        
        const { error: leadError } = await supabase
          .from('leads')
          .update({
            status: 'no_answer',
            times_dialed: newTimesDialed,
            total_calls_made: newTotalCalls,
            last_call_outcome: 'no_answer',
            last_dial_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', leadId);
        
        if (leadError) {
          console.error('❌ FAILED to update lead:', leadError);
        } else {
          console.log('✅ LEAD UPDATED: status=no_answer, times_dialed=' + newTimesDialed);
        }
        
        // ================================================================
        // 2. UPDATE calls_made_today IN ai_control_settings
        // ================================================================
        const { data: currentSettings } = await supabase
          .from('ai_control_settings')
          .select('calls_made_today')
          .eq('user_id', userId)
          .single();
        
        const oldCallCount = currentSettings?.calls_made_today || 0;
        const newCallCount = oldCallCount + 1;
        
        console.log(`🔥 calls_made_today: ${oldCallCount} → ${newCallCount}`);
        
        const { error: settingsError } = await supabase
          .from('ai_control_settings')
          .update({ 
            calls_made_today: newCallCount,
            last_call_status: 'no_answer'
          })
          .eq('user_id', userId);
        
        if (settingsError) {
          console.error('❌ FAILED to update calls_made_today:', settingsError);
        } else {
          console.log('✅ calls_made_today UPDATED to ' + newCallCount);
        }
        
        // ================================================================
        // 3. CREATE CALL RECORD
        // ================================================================
        console.log('💾 Creating call record...');
        const { error: callError } = await supabase
          .from('calls')
          .insert({
            user_id: userId,
            lead_id: leadId,
            call_id: call_id,
            lead_name: lead.name || 'Unknown',
            phone_number: lead.phone || 'N/A',
            duration: durationMinutes,
            disposition: 'no_answer',
            outcome: 'no_answer',
            connected: false,
            cost: 0,
            recording_url: recording_url,
            transcript: transcript,
            call_analysis: call_analysis,
            in_voicemail: inVoicemail,
            was_double_dial: true,
            created_at: new Date().toISOString(),
          });
        
        if (callError) {
          console.error('❌ FAILED to create call record:', callError);
        } else {
          console.log('✅ CALL RECORD CREATED');
        }
        
        console.log('📵📵📵 ========== DOUBLE DIAL COMPLETE ========== 📵📵📵');
        console.log('');
      }
      
      callCost = 0; // No charge for unanswered/short calls
      
    } else {
      // CALL WAS PICKED UP!
      console.log('✅ Call was ANSWERED (pickup confirmed)');
      callCost = durationMinutes * costPerMinute;

      // Check flags in priority order (customAnalysis already parsed above)
      if (customAnalysis.NOT_INTERESTED === true) {
        outcome = 'not_interested';
        leadStatus = 'not_interested';
        console.log('❌ Lead is NOT INTERESTED - marking as dead lead');
        
      } else if (customAnalysis.BOOKED === true) {
        // BOOKED = TRUE means appointment was booked!
        // Update EVERYTHING right here - don't wait for Cal.ai
        outcome = 'appointment_booked';
        leadStatus = 'appointment_booked';
        console.log('🎯🎯🎯 APPOINTMENT BOOKED! 🎯🎯🎯');
        console.log('✅ Updating lead status to appointment_booked');
        console.log('✅ Lead will NOT be called again');
        // Cal.ai webhook will later update the appointment with the exact time
        
      } else if (customAnalysis.LIVE_TRANSFER === true) {
        outcome = 'live_transfer';
        leadStatus = 'live_transfer';
        console.log('📞 LIVE TRANSFER occurred');
        
      } else if (customAnalysis.CALLBACK === true) {
        outcome = 'callback_later';
        leadStatus = 'callback_later';
        console.log('🔄 Lead wants CALLBACK');
        
      } else {
        // All flags are false - unclassified
        outcome = 'unclassified';
        leadStatus = 'unclassified';
        console.log('⚠️  UNCLASSIFIED - no clear outcome detected');
      }
    }

    // ========================================================================
    // UPDATE LEAD - SIMPLE DIRECT UPDATE (No DB Function)
    // ========================================================================
    
    console.log(`💾 Updating lead ${leadId}...`);
    console.log(`   - Outcome: ${outcome}`);
    console.log(`   - Status: ${leadStatus}`);
    console.log(`   - In Voicemail: ${inVoicemail}`);
    console.log(`   - Was Double Dial: ${wasDoubleDial}`);
    console.log(`   - Call Was Answered: ${callWasAnswered}`);
    
    // Build update object with fields that exist
    const leadUpdate: any = {
      status: leadStatus,
      last_call_outcome: outcome,
      last_dial_at: new Date().toISOString(), // FIX: Use last_dial_at, not last_called!
      last_called: new Date().toISOString(), // Keep both for compatibility
      updated_at: new Date().toISOString(),
    };
    
    // CORRECT LOGIC:
    // 1. First dial no answer → DON'T count yet, trigger double dial
    // 2. Double dial no answer → NOW count as 1 dial, set status to no_answer
    // 3. Call answered (first or double) → count as 1 dial
    const currentAttempts = lead.call_attempts_today || 0;
    
    if (wasDoubleDial || callWasAnswered) {
      // Either double dial completed OR call was answered
      // NOW we count as 1 dial
      leadUpdate.call_attempts_today = currentAttempts + 1;
      leadUpdate.last_attempt_date = todayStr;
      
      if (wasDoubleDial && !callWasAnswered) {
        console.log(`   🔢 DOUBLE DIAL NO ANSWER - NOW counting as 1 dial`);
      } else if (callWasAnswered) {
        console.log(`   🔢 CALL ANSWERED - Counting as 1 dial`);
      }
      console.log(`   📅 call_attempts_today: ${currentAttempts} → ${leadUpdate.call_attempts_today}`);
      console.log(`   📌 Status: ${leadStatus}`);
    } else {
      // First attempt no answer - DON'T count yet, will double dial
      console.log(`   ⏸️ FIRST ATTEMPT NO ANSWER - NOT counting yet`);
      console.log(`   🔁 Will double-dial first, then count after`);
      console.log(`   📊 call_attempts_today stays at: ${currentAttempts}`);
    }
    
    // ========================================================================
    // SIMPLIFIED TRACKING - 20 ATTEMPT SYSTEM
    // ========================================================================
    // Increment counters only when session is complete (after double dial OR if answered)
    if (wasDoubleDial || callWasAnswered) {
      console.log('📊 Session complete - incrementing total call counters...');
      
      // ALWAYS increment times_dialed (this is what the UI displays!)
      const currentTimesDial = lead.times_dialed || 0;
      leadUpdate.times_dialed = currentTimesDial + 1;
      console.log(`   - times_dialed: ${currentTimesDial} → ${leadUpdate.times_dialed}`);
      
      // Increment total_calls_made (primary tracking)
      const newTotalCalls = (lead.total_calls_made || 0) + 1;
      leadUpdate.total_calls_made = newTotalCalls;
      console.log(`   - total_calls_made: ${lead.total_calls_made || 0} → ${newTotalCalls}`);
      
      // Only count pickups if call was answered
      if (callWasAnswered) {
        leadUpdate.total_pickups = (lead.total_pickups || 0) + 1;
        console.log(`   - total_pickups: ${lead.total_pickups || 0} → ${leadUpdate.total_pickups}`);
        
        // Calculate pickup rate
        if (newTotalCalls > 0) {
          leadUpdate.pickup_rate = (leadUpdate.total_pickups / newTotalCalls) * 100;
          console.log(`   - pickup_rate: ${leadUpdate.pickup_rate.toFixed(1)}%`);
        }
      }
      
      // ========================================================================
      // CHECK IF LEAD HIT 20 ATTEMPTS - MARK AS DEAD
      // ========================================================================
      if (newTotalCalls >= 20 && !callWasAnswered) {
        console.log('💀 ========== LEAD HIT 20 ATTEMPTS - MARKING AS DEAD ==========');
        console.log(`   Lead ${lead.name} has been called 20 times with no pickup`);
        leadUpdate.status = 'dead_lead';
        leadStatus = 'dead_lead';
        console.log('   ✅ Status changed to: dead_lead');
      }
    } else {
      console.log('📊 First attempt no answer - NOT incrementing counters yet (waiting for double dial)');
    }
    
    console.log('');
    console.log('💾💾💾 ========== FINAL LEAD UPDATE ========== 💾💾💾');
    console.log(`Lead ID: ${leadId}`);
    console.log(`Status BEFORE: ${lead.status}`);
    console.log(`Status AFTER: ${leadUpdate.status}`);
    console.log(`times_dialed BEFORE: ${lead.times_dialed || 0}`);
    console.log(`times_dialed AFTER: ${leadUpdate.times_dialed || 'not set'}`);
    console.log('Full update object:', JSON.stringify(leadUpdate, null, 2));
    console.log('💾💾💾 =========================================== 💾💾💾');
    console.log('');
    
    // Update the lead
    const { error: updateError, data: updatedLead } = await supabase
      .from('leads')
      .update(leadUpdate)
      .eq('id', leadId)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌❌❌ FAILED TO UPDATE LEAD:', updateError);
      console.error('   Lead ID:', leadId);
      console.error('   Update payload:', JSON.stringify(leadUpdate));
    } else {
      console.log('✅ Lead updated successfully!');
      console.log(`   - New status: ${updatedLead?.status}`);
      console.log(`   - New times_dialed: ${updatedLead?.times_dialed}`);
    }

    // Insert call record ONLY if it's the double dial (second attempt) OR answered
    // First attempt doesn't count as a dial
    // FIX: Short calls on DOUBLE DIAL attempt DO create a record now!
    // Only skip record for first attempt (about to double dial)
    const shouldCreateCallRecord = wasDoubleDial || callWasAnswered;
    
    if (shouldCreateCallRecord) {
      console.log(`💾 Creating call record (double dial or answered)...`);
      console.log(`   - Lead name: ${lead.name}`);
      console.log(`   - Phone: ${lead.phone}`);
      console.log(`   - Cost: $${callCost.toFixed(2)} (${durationMinutes.toFixed(2)} min @ $${costPerMinute}/min)`);
      
    const { error: callInsertError } = await supabase
      .from('calls')
      .insert({
        user_id: userId,
        lead_id: leadId,
        call_id: call_id,
        lead_name: lead.name || lead.first_name || 'Unknown',
        phone_number: lead.phone || lead.phone_number || 'N/A',
        duration: durationMinutes,
        disposition: callWasAnswered ? 'answered' : 'no_answer',
        outcome: outcome,
        connected: callWasAnswered,
        cost: callCost,
        recording_url: recording_url,
        transcript: transcript,
        call_analysis: call_analysis,
        disconnection_reason: disconnection_reason,
        in_voicemail: inVoicemail,
        was_double_dial: wasDoubleDial,
        created_at: new Date().toISOString(),
      });
    
    if (callInsertError) {
      console.error('❌ Failed to insert call record:', callInsertError);
    } else {
        console.log('✅ Call record created');
      }
      
      // ========================================================================
      // APPOINTMENT BOOKING - Query Cal.ai API for EXACT booking time
      // This is the reliable way - get the actual booking from Cal.ai!
      // ========================================================================
      if (outcome === 'appointment_booked') {
        console.log('');
        console.log('📅📅📅 ========== APPOINTMENT BOOKED ========== 📅📅📅');
        console.log(`📞 Lead: ${lead.name} (${lead.phone})`);
        
        // Wait 5 seconds for Cal.ai to process the booking
        console.log('⏳ Waiting 5 seconds for Cal.ai to process booking...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check if we already created an appointment for this lead
        const { data: existingAppt } = await supabase
          .from('appointments')
          .select('id, scheduled_at')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (existingAppt) {
          console.log('✅ Appointment already exists!');
          console.log(`   - ID: ${existingAppt.id}`);
          console.log(`   - Scheduled: ${existingAppt.scheduled_at}`);
        } else {
          // ============================================================
          // QUERY CAL.AI API FOR THE BOOKING
          // Get user's Cal.ai API key from their config
          // ============================================================
          console.log('🔍 Querying Cal.ai API for booking details...');
          
          // Fetch user's Cal.ai API key from their config
          const { data: userCalConfig } = await supabase
            .from('user_retell_config')
            .select('cal_ai_api_key')
            .eq('user_id', userId)
            .maybeSingle();
          
          const CAL_API_KEY = userCalConfig?.cal_ai_api_key || process.env.CAL_AI_API_KEY;
          
          if (!CAL_API_KEY) {
            console.log('⚠️ No Cal.ai API key configured for this user');
          } else {
            console.log('✅ Found Cal.ai API key for user');
          }
          
          let calBooking: any = null;
          let calError: string | null = null;
          
          // Only query Cal.ai if we have an API key
          if (!CAL_API_KEY) {
            calError = 'No Cal.ai API key configured for this user';
            console.log('⚠️ Skipping Cal.ai API call - no API key');
          } else {
            try {
              // Get recent bookings from Cal.ai
              const calResponse = await fetch(
                `https://api.cal.com/v1/bookings?apiKey=${CAL_API_KEY}&status=upcoming`,
                {
                  method: 'GET',
                  headers: { 'Content-Type': 'application/json' },
                }
              );
            
            if (!calResponse.ok) {
              const errorText = await calResponse.text();
              console.error('❌ Cal.ai API error:', calResponse.status, errorText);
              calError = `API returned ${calResponse.status}`;
            } else {
              const calData = await calResponse.json();
              console.log(`📦 Cal.ai returned ${calData.bookings?.length || 0} bookings`);
              
              // Find the booking that matches our lead's phone number
              const leadPhone = (lead.phone || '').replace(/\D/g, '');
              const leadPhoneLast10 = leadPhone.slice(-10);
              
              console.log(`🔍 Looking for booking matching phone: ${leadPhoneLast10}`);
              
              if (calData.bookings && calData.bookings.length > 0) {
                // Sort by creation date (newest first)
                const sortedBookings = calData.bookings.sort((a: any, b: any) => 
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                
                // Find matching booking by phone number
                for (const booking of sortedBookings) {
                  const attendees = booking.attendees || [];
                  const responses = booking.responses || {};
                  
                  // Check attendee phone
                  for (const attendee of attendees) {
                    const attendeePhone = (attendee.phone || responses.phone || '').replace(/\D/g, '');
                    const attendeePhoneLast10 = attendeePhone.slice(-10);
                    
                    console.log(`   Checking booking ${booking.id}: ${attendeePhoneLast10} vs ${leadPhoneLast10}`);
                    
                    if (attendeePhoneLast10 === leadPhoneLast10 || 
                        attendeePhone.includes(leadPhoneLast10) ||
                        leadPhone.includes(attendeePhoneLast10)) {
                      calBooking = booking;
                      console.log(`✅ FOUND MATCHING BOOKING!`);
                      console.log(`   - Booking ID: ${booking.id}`);
                      console.log(`   - Start Time: ${booking.startTime}`);
                      console.log(`   - End Time: ${booking.endTime}`);
                      break;
                    }
                  }
                  
                  if (calBooking) break;
                }
                
                // If no phone match, try to find by name similarity
                if (!calBooking) {
                  const leadName = (lead.name || '').toLowerCase().trim();
                  console.log(`🔍 No phone match - trying name match: "${leadName}"`);
                  
                  for (const booking of sortedBookings) {
                    const attendees = booking.attendees || [];
                    
                    for (const attendee of attendees) {
                      const attendeeName = (attendee.name || '').toLowerCase().trim();
                      
                      if (attendeeName.includes(leadName) || leadName.includes(attendeeName)) {
                        calBooking = booking;
                        console.log(`✅ FOUND BOOKING BY NAME!`);
                        console.log(`   - Booking ID: ${booking.id}`);
                        console.log(`   - Start Time: ${booking.startTime}`);
                        break;
                      }
                    }
                    
                    if (calBooking) break;
                  }
                }
                
                // Last resort: get the most recent booking created in last 5 minutes
                if (!calBooking) {
                  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
                  
                  for (const booking of sortedBookings) {
                    const bookingCreatedAt = new Date(booking.createdAt).getTime();
                    
                    if (bookingCreatedAt > fiveMinutesAgo) {
                      calBooking = booking;
                      console.log(`⚠️ Using most recent booking (created ${Math.round((Date.now() - bookingCreatedAt) / 1000)}s ago)`);
                      console.log(`   - Booking ID: ${booking.id}`);
                      console.log(`   - Start Time: ${booking.startTime}`);
                      break;
                    }
                  }
                }
              }
            }
          } catch (err: any) {
            console.error('❌ Cal.ai API exception:', err.message);
            calError = err.message;
          }
          } // End of Cal.ai API key check
          
          // ============================================================
          // CREATE APPOINTMENT WITH CAL.AI DATA OR FALLBACK
          // ============================================================
          let appointmentTime: Date;
          let noteText: string;
          
          if (calBooking && calBooking.startTime) {
            // SUCCESS! Use the exact time from Cal.ai
            console.log('');
            console.log('🎯 CAL.AI BOOKING DATA:');
            console.log(`   - Raw startTime: ${calBooking.startTime}`);
            console.log(`   - Raw endTime: ${calBooking.endTime}`);
            console.log(`   - Booking ID: ${calBooking.id}`);
            console.log(`   - Title: ${calBooking.title}`);
            console.log(`   - Event Type: ${calBooking.eventType?.title || 'Unknown'}`);
            
            // Cal.ai returns times in UTC format: "2024-12-18T14:00:00.000Z"
            // We store this DIRECTLY in the database - no conversion needed
            const rawStartTime = calBooking.startTime;
            
            // Parse to Date for logging purposes only
            appointmentTime = new Date(rawStartTime);
            
            console.log(`   - Parsed as Date object: ${appointmentTime.toString()}`);
            console.log(`   - toISOString(): ${appointmentTime.toISOString()}`);
            console.log(`   - Eastern Time: ${appointmentTime.toLocaleString('en-US', { timeZone: 'America/New_York' })}`);
            console.log(`   - UTC Time: ${appointmentTime.toUTCString()}`);
            
            // Check attendee timezone for debugging
            const attendeeTimezone = calBooking.attendees?.[0]?.timeZone || 'Unknown';
            console.log(`   - Attendee Timezone: ${attendeeTimezone}`);
            
            // IMPORTANT: If the raw startTime doesn't end with 'Z' or contain an offset,
            // Cal.ai might be returning it in the attendee's local timezone
            const hasTimezone = rawStartTime.includes('Z') || rawStartTime.includes('+') || rawStartTime.includes('-');
            console.log(`   - Has timezone info: ${hasTimezone}`);
            
            if (!hasTimezone && attendeeTimezone) {
              // Cal.ai returned a naive datetime - interpret it in the attendee's timezone
              console.log(`   ⚠️ No timezone in startTime - interpreting as ${attendeeTimezone}`);
              
              // Create the date string with explicit timezone for correct parsing
              // We need to get the UTC equivalent of the given local time
              const localTimeStr = rawStartTime.replace('T', ' ').replace('.000', '');
              console.log(`   - Local time string: ${localTimeStr}`);
            }
            
            // Store in the note for debugging
            noteText = `✅ Cal.ai booking #${calBooking.id} | Raw: ${rawStartTime} | TZ: ${attendeeTimezone}`;
            
            console.log('');
          } else {
            // FALLBACK: Use placeholder time
            console.log('');
            console.log('⚠️ Could not get booking from Cal.ai - using placeholder');
            if (calError) console.log(`   Error: ${calError}`);
            console.log('');
            
            // Get user's timezone for better fallback
            const { data: userSettings } = await supabase
              .from('ai_control_settings')
              .select('user_timezone')
              .eq('user_id', userId)
              .single();
            
            const userTimezone = userSettings?.user_timezone || 'America/New_York';
            
            // Create a date for tomorrow at 10am in user's timezone
            // First get current time in user's timezone
            const nowInUserTZ = new Date().toLocaleString('en-US', { timeZone: userTimezone });
            const userNow = new Date(nowInUserTZ);
            
            // Add 1 day and set to 10am
            userNow.setDate(userNow.getDate() + 1);
            userNow.setHours(10, 0, 0, 0);
            
            // Convert back to a proper Date object
            // We need to account for the timezone offset
            const tzOffset = new Date().toLocaleString('en-US', { timeZone: userTimezone, timeZoneName: 'shortOffset' });
            const offsetMatch = tzOffset.match(/GMT([+-]\d+)/);
            const hoursOffset = offsetMatch ? parseInt(offsetMatch[1]) : -5; // Default to EST
            
            appointmentTime = new Date(userNow);
            // Adjust for timezone (convert from local to UTC for storage)
            appointmentTime.setHours(appointmentTime.getHours() - hoursOffset);
            
            console.log(`   User timezone: ${userTimezone}`);
            console.log(`   Fallback time (user's local): ${userNow.toLocaleString()}`);
            console.log(`   Fallback time (stored as UTC): ${appointmentTime.toISOString()}`);
            
            noteText = `⚠️ PLEASE CONFIRM TIME - Cal.ai error: ${calError || 'No booking found'}`;
          }
          
        const appointmentData = {
          user_id: userId,
          lead_id: leadId,
          prospect_name: lead.name || lead.first_name || 'Unknown',
          prospect_phone: lead.phone || lead.phone_number || '',
            scheduled_at: appointmentTime.toISOString(),
          status: 'scheduled',
          is_sold: false,
          is_no_show: false,
            notes: noteText,
          created_at: new Date().toISOString(),
        };
        
          console.log('📝 Creating appointment...');
          console.log(`   - Name: ${appointmentData.prospect_name}`);
          console.log(`   - Phone: ${appointmentData.prospect_phone}`);
          console.log(`   - Time: ${appointmentTime.toLocaleString()}`);
          console.log(`   - Source: ${calBooking ? 'Cal.ai API ✅' : 'Fallback ⚠️'}`);
          
          const { data: newAppointment, error: appointmentError } = await supabase
          .from('appointments')
          .insert([appointmentData])
          .select()
          .single();
        
        if (appointmentError) {
          console.error('❌ Failed to create appointment:', appointmentError);
        } else {
          console.log('✅ APPOINTMENT CREATED!');
            console.log(`   - ID: ${newAppointment.id}`);
            console.log(`   - Scheduled: ${appointmentTime.toLocaleString()}`);
        }
        }
        
        console.log('📅📅📅 ========================================= 📅📅📅');
        console.log('');
      }
    } else {
      console.log('⏭️  First attempt - NOT creating call record (waiting for double dial)');
    }

    // ========================================================================
    // UPDATE SPEND & BALANCE & AI COSTS
    // ========================================================================
    
    // Only update spend/balance/calls_made for:
    // 1. Answered calls (charge money)
    // 2. Double dial no answer (count as 1 dial, no charge)
    const shouldIncrementCallCount = wasDoubleDial || callWasAnswered;
    
    if (callWasAnswered && callCost > 0) {
      // Only charge for answered calls
      // IMPORTANT: Re-fetch current values to avoid race conditions!
      const { data: freshSettings } = await supabase
        .from('ai_control_settings')
        .select('today_spend, calls_made_today')
        .eq('user_id', userId)
        .single();
      
      const currentSpend = freshSettings?.today_spend || 0;
      const currentCallCount = freshSettings?.calls_made_today || 0;
      const newSpend = currentSpend + callCost;
      const newCallCount = currentCallCount + 1;

      console.log(`💰 Updating spend: $${currentSpend.toFixed(2)} → $${newSpend.toFixed(2)}`);
      console.log(`📞 Incrementing calls_made_today: ${currentCallCount} → ${newCallCount}`);

      await supabase
        .from('ai_control_settings')
        .update({
          today_spend: newSpend,
          calls_made_today: newCallCount,
          last_call_status: outcome,
        })
        .eq('user_id', userId);

      // Deduct from call balance
      const { data: balance } = await supabase
        .from('call_balance')
        .select('balance, auto_refill_enabled')
        .eq('user_id', userId)
        .single();

      if (balance) {
        const newBalance = balance.balance - callCost;
        console.log(`💰 Updating balance: $${balance.balance.toFixed(2)} → $${newBalance.toFixed(2)}`);
        
        await supabase
          .from('call_balance')
          .update({ balance: newBalance })
          .eq('user_id', userId);

        // ========================================================================
        // CHECK FOR AUTO-REFILL (balance < $1)
        // ========================================================================
        if (balance.auto_refill_enabled && newBalance < 1) {
          console.log('');
          console.log('🔄🔄🔄 AUTO-REFILL TRIGGERED! 🔄🔄🔄');
          console.log(`💰 Balance dropped to $${newBalance.toFixed(2)} (below $1)`);
          console.log('💳 Charging card $25...');
          
          try {
            // Get user's Stripe customer and payment method
            const { data: profile } = await supabase
              .from('profiles')
              .select('stripe_customer_id')
              .eq('user_id', userId)
              .single();
            
            if (!profile?.stripe_customer_id) {
              console.error('❌ No Stripe customer ID - cannot auto-refill');
            } else {
              // Import Stripe
              const Stripe = (await import('stripe')).default;
              const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
                apiVersion: '2025-10-29.clover' as any,
              });
              
              // Get customer
              const customer = await stripe.customers.retrieve(profile.stripe_customer_id);
              
              if (customer.deleted) {
                console.error('❌ Customer deleted');
              } else {
                // Get payment method
                let paymentMethodId = null;
                if ('invoice_settings' in customer && customer.invoice_settings?.default_payment_method) {
                  paymentMethodId = typeof customer.invoice_settings.default_payment_method === 'string' 
                    ? customer.invoice_settings.default_payment_method 
                    : customer.invoice_settings.default_payment_method.id;
                }
                
                if (!paymentMethodId) {
                  console.log('🔍 No default payment method, getting first available...');
                  const paymentMethods = await stripe.paymentMethods.list({
                    customer: profile.stripe_customer_id,
                    type: 'card',
                  });
                  
                  if (paymentMethods.data.length > 0) {
                    paymentMethodId = paymentMethods.data[0].id;
                  }
                }
                
                if (paymentMethodId) {
                  console.log('💳 Charging card for $25 auto-refill...');
                  
                  // Charge the card
                  const paymentIntent = await stripe.paymentIntents.create({
                    amount: 2500, // $25
                    currency: 'usd',
                    customer: profile.stripe_customer_id,
                    payment_method: paymentMethodId,
                    description: 'Auto-refill: Call Balance $25',
                    metadata: {
                      type: 'auto_refill',
                      user_id: userId,
                      amount: '25',
                    },
                    off_session: true,
                    confirm: true,
                  });
                  
                  console.log('✅ Payment created:', paymentIntent.id);
                  console.log('   Status:', paymentIntent.status);
                  
                  if (paymentIntent.status === 'succeeded') {
                    // Update balance immediately
                    const refillBalance = newBalance + 25;
                    
                    await supabase
                      .from('call_balance')
                      .update({ balance: refillBalance })
                      .eq('user_id', userId);
                    
                    console.log(`✅ AUTO-REFILL SUCCESSFUL!`);
                    console.log(`   Balance: $${newBalance.toFixed(2)} → $${refillBalance.toFixed(2)}`);
                  }
                } else {
                  console.error('❌ No payment method found');
                }
              }
            }
          } catch (autoRefillError: any) {
            console.error('❌ Auto-refill failed:', autoRefillError.message);
          }
          
          console.log('🔄🔄🔄 ======================================== 🔄🔄🔄');
          console.log('');
        }
      }

      // ========================================================================
      // UPDATE AI COSTS IN REVENUE TRACKING (for dashboard graph!)
      // ========================================================================
      console.log('');
      console.log('💰💰💰 ========== UPDATING AI COSTS ========== 💰💰💰');
      console.log(`📊 Today's date: ${todayStr}`);
      console.log(`💵 Call cost: $${callCost.toFixed(4)}`);
      console.log('');
      
      try {
        const { data: existingRevenue, error: revenueQueryError } = await supabase
          .from('revenue_tracking')
          .select('*')
          .eq('user_id', userId)
          .eq('date', todayStr)
          .maybeSingle();
        
        console.log('📊 Existing revenue record:', existingRevenue);
        if (revenueQueryError) console.error('❌ Query error:', revenueQueryError);
        
        if (existingRevenue) {
          // Update existing record - add this call's cost
          const currentAICost = existingRevenue.ai_daily_cost || 0;
          const newAICost = currentAICost + callCost;
          
          console.log(`   Current AI Daily Cost: $${currentAICost.toFixed(4)}`);
          console.log(`   Adding call cost: $${callCost.toFixed(4)}`);
          console.log(`   New AI Daily Cost: $${newAICost.toFixed(4)}`);
          
          // Don't update total_ai_cost - it's a generated column!
          // Don't update updated_at - column doesn't exist!
          const { error: updateError } = await supabase
            .from('revenue_tracking')
            .update({
              ai_daily_cost: newAICost,
            })
            .eq('user_id', userId)
            .eq('date', todayStr);
          
          if (updateError) {
            console.error('❌ Failed to update revenue_tracking:', updateError);
          } else {
            console.log(`✅ AI costs updated successfully for ${todayStr}!`);
          }
        } else {
          // Create new record for today
          console.log(`   No existing record - creating new one for ${todayStr}`);
          
          // Calculate the daily retainer cost based on subscription tier
          let dailyRetainerCost = 0;
          try {
            const { data: subscription } = await supabase
              .from('subscriptions')
              .select('subscription_tier, status')
              .eq('user_id', userId)
              .eq('status', 'active')
              .single();
            
            if (subscription) {
              // Get days in current month
              const now = new Date();
              const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
              
              // Monthly prices
              let monthlyPrice = 0;
              switch (subscription.subscription_tier) {
                case 'starter': monthlyPrice = 499; break;
                case 'pro': monthlyPrice = 899; break;
                case 'elite': monthlyPrice = 1499; break;
              }
              
              dailyRetainerCost = monthlyPrice / daysInMonth;
              console.log(`   📊 Subscription: ${subscription.subscription_tier} ($${monthlyPrice}/mo ÷ ${daysInMonth} days = $${dailyRetainerCost.toFixed(2)}/day)`);
            } else {
              console.log(`   ⚠️ No active subscription found - daily retainer cost: $0`);
            }
          } catch (subErr) {
            console.error('   ⚠️ Failed to get subscription for retainer cost:', subErr);
          }
          
          // Don't include total_ai_cost - it's auto-calculated!
          // Don't include created_at - it has a default!
          const { error: insertError } = await supabase
            .from('revenue_tracking')
            .insert({
              user_id: userId,
              date: todayStr,
              revenue: 0,
              ai_retainer_cost: dailyRetainerCost,
              ai_daily_cost: callCost,
            });
          
          if (insertError) {
            console.error('❌ Failed to insert revenue_tracking:', insertError);
          } else {
            console.log(`✅ Revenue tracking created:`);
            console.log(`   - Daily retainer: $${dailyRetainerCost.toFixed(2)}`);
            console.log(`   - Call cost: $${callCost.toFixed(4)}`);
            console.log(`   - Total AI cost: $${(dailyRetainerCost + callCost).toFixed(4)} (auto-calculated by DB)`);
          }
        }
      } catch (revenueError: any) {
        console.error('❌ Exception updating AI costs:', revenueError);
      }
      
      console.log('💰💰💰 ========================================= 💰💰💰');
      console.log('');

      // Check if daily spend limit reached
      const dailySpendLimit = aiSettings.daily_spend_limit || 10.00;
      if (newSpend >= dailySpendLimit) {
        console.log('🛑 Daily spend limit reached, stopping AI');
        
        await supabase
          .from('ai_control_settings')
          .update({ status: 'stopped' })
          .eq('user_id', userId);

        return NextResponse.json({
          success: true,
          message: 'Call processed, daily limit reached',
          outcome: outcome,
          cost: callCost,
          aiStopped: true,
        });
      }
    } else if (wasDoubleDial && !callWasAnswered) {
      // Double dial no answer - NOW increment (session complete)
      console.log('');
      console.log('📊 ========== DOUBLE DIAL NO ANSWER - UPDATING COUNTS ==========');
      
      // IMPORTANT: Re-fetch current value to avoid race conditions!
      const { data: freshSettings, error: fetchError } = await supabase
        .from('ai_control_settings')
        .select('calls_made_today')
        .eq('user_id', userId)
        .single();
      
      if (fetchError) {
        console.error('❌ Error fetching ai_control_settings:', fetchError);
      }
      
      const currentCallCount = freshSettings?.calls_made_today || 0;
      const newCallCount = currentCallCount + 1;
      
      console.log(`📞 Double dial no answer - NOW incrementing calls_made_today: ${currentCallCount} → ${newCallCount}`);
      console.log(`   This counts as 1 completed dial attempt`);
      
      const { error: updateError } = await supabase
        .from('ai_control_settings')
        .update({
          calls_made_today: newCallCount,
          last_call_status: 'no_answer',
        })
        .eq('user_id', userId);
      
      if (updateError) {
        console.error('❌ Error updating calls_made_today:', updateError);
      } else {
        console.log(`✅ calls_made_today updated successfully to ${newCallCount}`);
      }
      console.log('📊 ============================================================');
      console.log('');
    } else if (!wasDoubleDial && !callWasAnswered) {
      // First attempt no answer - DON'T increment yet (waiting for double dial)
      console.log(`📞 First attempt no answer - NOT incrementing yet (waiting for double dial)`);
      console.log(`   Calls made today stays at: ${aiSettings.calls_made_today || 0}`);
    } else {
      console.log(`📞 Unexpected state - wasDoubleDial: ${wasDoubleDial}, answered: ${callWasAnswered}`);
    }

    // ========================================================================
    // DOUBLE DIAL LOGIC - INLINE (No separate endpoint!)
    // ========================================================================
    
    if (shouldDoubleDial) {
      console.log('');
      console.log('🔄🔄🔄 ========== DOUBLE DIAL - CALLING NOW! ========== 🔄🔄🔄');
      console.log(`📞 Lead: ${lead.name} (${lead.phone})`);
      console.log('');
      
      try {
        // Get Retell config
        const { data: retellConfig } = await supabase
          .from('user_retell_config')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (!retellConfig) {
          console.error('❌ No Retell config!');
          return NextResponse.json({ error: 'No Retell config' }, { status: 400 });
        }
        
        const retellApiKey = process.env.RETELL_API_KEY;
        if (!retellApiKey) {
          console.error('❌ No API key!');
          return NextResponse.json({ error: 'No API key' }, { status: 500 });
        }
        
        // Make the call directly
        // CRITICAL: All dynamic variables MUST be strings for Retell API!
        const doublDialPayload = {
          agent_id: retellConfig.retell_agent_id,
          to_number: lead.phone,
          from_number: retellConfig.phone_number,
          metadata: {
            user_id: userId,
            lead_id: leadId,
            lead_name: lead.name,
            lead_phone: lead.phone,
            was_double_dial: true,
          },
          retell_llm_dynamic_variables: {
            customer_name: String(lead.name || 'there'),
            lead_name: String(lead.name || ''),
            lead_phone: String(lead.phone || ''),
            userId: String(userId),
            leadId: String(leadId),
            live_transfer: "true",
            attempt_number: "2",
            // Lead type - MUST be string!
            lead_type: String(lead.lead_type || 1),
            lead_vendor: String(lead.lead_vendor || ''),
            street_address: String(lead.street_address || ''),
          },
        };
        
        console.log('📞 Calling Retell API directly for double dial...');
        const retellResponse = await fetch('https://api.retellai.com/v2/create-phone-call', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${retellApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(doublDialPayload),
        });
        
        if (!retellResponse.ok) {
          const errorText = await retellResponse.text();
          console.error('❌❌❌ DOUBLE DIAL FAILED! ❌❌❌');
          console.error('   Status:', retellResponse.status);
          console.error('   Error:', errorText.substring(0, 500));
          // Note: Status and count already updated on first attempt, so no need to update again
          console.log('ℹ️ Lead already marked as no_answer and counted on first attempt');
        } else {
          const callData = await retellResponse.json();
          console.log('✅✅✅ DOUBLE DIAL SUCCESSFUL!');
          console.log('   Call ID:', callData.call_id);
          console.log('   Phone will ring in 2-3 seconds!');
        }
      } catch (error: any) {
        console.error('❌ Double dial exception:', error.message);
      }
      
      console.log('🔄🔄🔄 ============================================== 🔄🔄🔄');
      console.log('');
      
      return NextResponse.json({
        success: true,
        message: 'Call processed, double dial initiated',
        outcome: outcome,
        cost: callCost,
        inVoicemail: inVoicemail,
        doubleDial: true,
        nextCallTriggered: true,
      });
      }

    // ========================================================================
    // CHECK IF SHOULD CONTINUE TO NEXT LEAD
    // ========================================================================

    // Check latest AI status
    const { data: latestSettings } = await supabase
      .from('ai_control_settings')
      .select('status, target_lead_count, calls_made_today, execution_mode')
      .eq('user_id', userId)
      .single();
    
    const targetCount = latestSettings?.target_lead_count || 100;
    const currentCount = latestSettings?.calls_made_today || 0;
    
    console.log(`📊 Current progress: ${currentCount}/${targetCount} calls made`);
    console.log(`   Execution mode: ${latestSettings?.execution_mode}`);
    console.log(`   Target reached? ${currentCount >= targetCount ? 'YES' : 'NO'}`);
    
    // Check if AI is still running
    if (latestSettings?.status !== 'running') {
      console.log('🛑 AI already stopped');
      return NextResponse.json({
        success: true,
        message: 'Call processed, AI stopped',
        outcome: outcome,
        cost: callCost,
        inVoicemail: inVoicemail,
        nextCallTriggered: false,
      });
    }
    
    // Check if target reached (ONLY for 'leads' mode, not 'time' mode)
    if (latestSettings.execution_mode === 'leads' && currentCount >= targetCount) {
      console.log(`🎯 Target reached! Made ${currentCount} calls, target was ${targetCount}`);
      console.log('🛑 Stopping AI...');
      
      await supabase
        .from('ai_control_settings')
        .update({ status: 'stopped', last_call_status: 'target_reached' })
        .eq('user_id', userId);
      
      return NextResponse.json({
        success: true,
        message: `Call processed, target reached (${currentCount}/${targetCount})`,
        outcome: outcome,
        cost: callCost,
        aiStopped: true,
        reason: 'target_reached',
      });
    }
    
    console.log(`✅ Target NOT reached yet (${currentCount}/${targetCount}) - continuing...`);
    
    // ========================================================================
    // ALWAYS TRIGGER NEXT CALL - Let next-call route handle lead selection
    // This is more reliable than checking leads here
    // ========================================================================
    
    console.log('');
    console.log('🔄🔄🔄 ========== TRIGGERING NEXT CALL ========== 🔄🔄🔄');
    console.log(`📞 AI still running, target not reached - calling next lead!`);
    console.log('');
    
    // Get the proper base URL (works in both local and production)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    console.log(`   Base URL: ${baseUrl}`);
    console.log(`   Endpoint: ${baseUrl}/api/ai-control/next-call`);
    console.log(`   User ID: ${userId}`);
    
    let nextCallSuccess = false;
    let nextCallError = null;
    
    // Add small delay to ensure database is updated before next query
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Try up to 2 times to trigger next call
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`📞 Making fetch request to next-call (attempt ${attempt})...`);
        
        const nextCallResponse = await fetch(`${baseUrl}/api/ai-control/next-call`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        
        console.log(`📞 Response status: ${nextCallResponse.status}`);
        
        const responseText = await nextCallResponse.text();
        console.log(`📞 Response body: ${responseText.substring(0, 500)}`);
        
        if (!nextCallResponse.ok) {
          console.error('❌ Next call endpoint returned error!');
          nextCallError = responseText;
          
          // If first attempt failed, wait and retry
          if (attempt === 1) {
            console.log('⏳ Waiting 1 second before retry...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        } else {
          try {
            const nextCallData = JSON.parse(responseText);
            console.log('✅✅✅ NEXT CALL TRIGGERED SUCCESSFULLY!');
            console.log('   Call ID:', nextCallData.callId);
            console.log('   Lead:', nextCallData.leadName);
            nextCallSuccess = true;
            
            // Check if next-call said "done" (no more leads, target reached, etc.)
            if (nextCallData.done) {
              console.log('🛑 Next-call returned done:', nextCallData.reason);
              console.log('   Message:', nextCallData.message);
            }
          } catch (parseError) {
            console.log('✅ Next call triggered (response not JSON)');
            nextCallSuccess = true;
          }
          break; // Success, exit retry loop
        }
      } catch (error: any) {
        console.error(`❌❌❌ FETCH ERROR triggering next call (attempt ${attempt}):`, error.message);
        nextCallError = error.message;
        
        // If first attempt failed, wait and retry
        if (attempt === 1) {
          console.log('⏳ Waiting 1 second before retry...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    // Log final status
    console.log('');
    console.log('📊 CALL RESULT WEBHOOK COMPLETE');
    console.log(`   Outcome: ${outcome}`);
    console.log(`   Cost: $${callCost.toFixed(2)}`);
    console.log(`   Next call triggered: ${nextCallSuccess ? 'YES ✅' : 'NO ❌'}`);
    if (nextCallError) console.log(`   Error: ${nextCallError}`);
    console.log('🔄🔄🔄 ============================================ 🔄🔄🔄');
    console.log('');

    return NextResponse.json({
      success: true,
      message: 'Call processed successfully',
      outcome: outcome,
      cost: callCost,
      inVoicemail: inVoicemail,
      hungUpBy: hungUpBy,
      nextCallTriggered: nextCallSuccess,
      nextCallError: nextCallError,
    });
  } catch (error: any) {
    console.error('❌ Error processing call result:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process call result' },
      { status: 500 }
    );
  }
}


