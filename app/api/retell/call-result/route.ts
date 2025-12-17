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
    const wasDoubleDial = metadata?.was_double_dial === true || metadata?.was_double_dial === 'true';

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

    // Calculate call duration in minutes
    const durationSeconds = end_timestamp && start_timestamp 
      ? (end_timestamp - start_timestamp) / 1000
      : 0;
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

    const costPerMinute = userProfile?.cost_per_minute || 0.30; // Default to $0.30 (starter)
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
    
    // Check if ANY outcome flag is true - this proves the call was answered!
    const hasOutcomeFlag = customAnalysis.BOOKED === true || 
                           customAnalysis.NOT_INTERESTED === true || 
                           customAnalysis.CALLBACK === true || 
                           customAnalysis.LIVE_TRANSFER === true;
    
    // CRITICAL FIX: If ANY outcome flag is set, the call WAS answered!
    // Retell may incorrectly report in_voicemail=true for transferred calls
    // But if we got BOOKED=true, NOT_INTERESTED=true, etc., the person definitely picked up!
    const callWasAnswered = !inVoicemail || hasOutcomeFlag;
    
    console.log(`📊 Call classification:`);
    console.log(`   - Duration: ${durationSeconds}s`);
    console.log(`   - In voicemail: ${inVoicemail}`);
    console.log(`   - Has outcome flag: ${hasOutcomeFlag} (BOOKED=${customAnalysis.BOOKED}, NOT_INTERESTED=${customAnalysis.NOT_INTERESTED})`);
    console.log(`   - Was answered: ${callWasAnswered} (in_voicemail=${inVoicemail} OR hasOutcomeFlag=${hasOutcomeFlag})`);
    console.log(`   - Was double dial: ${wasDoubleDial}`);
    
    if (!callWasAnswered) {
      // NO ANSWER (voicemail OR just rang with no pickup)
      console.log('📞 Call was NOT answered (no pickup)');
      
      if (!wasDoubleDial) {
        // First dial - NO ANSWER - DOUBLE DIAL NOW!
        shouldDoubleDial = true;
        shouldContinueToNextLead = false;
        outcome = 'no_answer_first_attempt';
        leadStatus = lead.status; // Keep current status
        console.log('🔄 FIRST ATTEMPT NO ANSWER - Will double dial immediately!');
        console.log('   → This does NOT count as a dial yet');
      } else {
        // Second dial also no answer - NOW count as 1 missed call
        outcome = 'no_answer_double_attempt';
        leadStatus = 'no_answer';
        console.log('📵 SECOND ATTEMPT NO ANSWER - NOW counting as 1 missed call');
        console.log('   → Moving to next lead');
        
        // This counts as 1 missed call in the current time period
      }
      
      callCost = 0; // No charge for unanswered calls
      
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
    
    // CRITICAL: A DOUBLE-DIAL (2 physical calls) = 1 ATTEMPT
    // Increment counter ONLY when lead session is complete:
    // - First call answered → Session complete, increment by 1
    // - First call no answer, then double-dial → Session complete after 2nd call, increment by 1
    // 
    // Logic: Increment if this is the FINAL call for this lead session
    // That's either: (wasDoubleDial) OR (callWasAnswered and !wasDoubleDial)
    if (wasDoubleDial || callWasAnswered) {
      const currentAttempts = lead.call_attempts_today || 0;
      
      // CRITICAL: Only increment by 1, regardless of how many physical calls were made
      leadUpdate.call_attempts_today = currentAttempts + 1;
      leadUpdate.last_attempt_date = todayStr;
      
      console.log(`   🔢 ATTEMPT COUNT: ${currentAttempts} → ${leadUpdate.call_attempts_today}`);
      console.log(`   📅 Last attempt date: ${todayStr}`);
      console.log(`   ✅ Lead session complete - counted as 1 attempt`);
      console.log(`   ${wasDoubleDial ? '(Double-dial completed)' : '(Answered on first call)'}`);
    } else {
      console.log(`   ⏸️  First attempt no answer - NOT incrementing yet`);
      console.log(`   🔁 Will double-dial before counting as attempt`);
      console.log(`   📊 call_attempts_today stays at: ${lead.call_attempts_today || 0}`);
    }
    
    // ========================================================================
    // SIMPLIFIED TRACKING - 20 ATTEMPT SYSTEM
    // ========================================================================
    // Increment counters on double dial OR if call was answered
    if (wasDoubleDial || callWasAnswered) {
      console.log('📊 Call completed - incrementing counters...');
      
      // Increment times_dialed (legacy column)
      if (lead.times_dialed !== undefined) {
        leadUpdate.times_dialed = (lead.times_dialed || 0) + 1;
        console.log(`   - times_dialed: ${lead.times_dialed || 0} → ${leadUpdate.times_dialed}`);
      }
      
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
      console.log('📊 First attempt no answer - NOT incrementing counters (waiting for double dial)');
    }
    
    console.log('📝 Final update object:', JSON.stringify(leadUpdate, null, 2));
    
    // Update the lead
    const { error: updateError } = await supabase
      .from('leads')
      .update(leadUpdate)
      .eq('id', leadId);
    
    if (updateError) {
      console.error('❌ Failed to update lead:', updateError);
    } else {
      console.log('✅ Lead updated successfully in database!');
    }

    // Insert call record ONLY if it's the double dial (second attempt)
    // First attempt doesn't count as a dial
    if (wasDoubleDial || callWasAnswered) {
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
      // APPOINTMENT BOOKING - Extract time AND timezone from transcript
      // Convert from lead's timezone to user's timezone
      // ========================================================================
      if (outcome === 'appointment_booked') {
        console.log('');
        console.log('📅📅📅 ========== APPOINTMENT BOOKED ========== 📅📅📅');
        console.log(`📞 Lead: ${lead.name} (${lead.phone})`);
        
        // Wait 3 seconds to give Cal.ai webhook a chance to fire first
        console.log('⏳ Waiting 3 seconds for Cal.ai webhook...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if Cal.ai already created an appointment for this lead
        const { data: existingCalAppt } = await supabase
          .from('appointments')
          .select('id, scheduled_at')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (existingCalAppt) {
          console.log('✅ Cal.ai already created appointment!');
          console.log(`   - ID: ${existingCalAppt.id}`);
          console.log(`   - Scheduled: ${existingCalAppt.scheduled_at}`);
          console.log('📅 No need to create another appointment');
        } else {
          console.log('⚠️ Cal.ai did not create appointment - extracting time from transcript...');
          
          // Get user's timezone from settings
          const userTimezone = aiSettings.user_timezone || 'America/New_York';
          console.log(`👤 User timezone: ${userTimezone}`);
          
          // Timezone mapping - what offset from UTC (in hours)
          const timezoneOffsets: Record<string, number> = {
            // Standard timezone names
            'pacific': -8, 'pst': -8, 'pdt': -7,
            'mountain': -7, 'mst': -7, 'mdt': -6,
            'central': -6, 'cst': -6, 'cdt': -5,
            'eastern': -5, 'est': -5, 'edt': -4,
            'alaska': -9, 'akst': -9, 'akdt': -8,
            'hawaii': -10, 'hst': -10,
          };
          
          // IANA timezone to offset (approximate - doesn't account for DST perfectly)
          const ianaToOffset: Record<string, number> = {
            'America/Los_Angeles': -8,
            'America/Denver': -7,
            'America/Phoenix': -7,
            'America/Chicago': -6,
            'America/New_York': -5,
            'America/Anchorage': -9,
            'Pacific/Honolulu': -10,
          };
          
          // Try to extract appointment time AND timezone from the transcript
          let extractedTime: Date | null = null;
          let leadTimezoneOffset: number | null = null;
          let leadTimezoneName: string | null = null;
          let timeConfidence = 'low';
          
          if (transcript) {
            console.log('🔍 Analyzing transcript for appointment time and timezone...');
            
            const transcriptLower = transcript.toLowerCase();
            
            // ============================================================
            // STEP 1: Extract TIMEZONE from transcript
            // ============================================================
            const timezonePatterns = [
              /\b(pacific|pst|pdt)\b/i,
              /\b(mountain|mst|mdt)\b/i,
              /\b(central|cst|cdt)\b/i,
              /\b(eastern|est|edt)\b/i,
              /\b(alaska|akst|akdt)\b/i,
              /\b(hawaii|hst)\b/i,
            ];
            
            for (const pattern of timezonePatterns) {
              const tzMatch = transcriptLower.match(pattern);
              if (tzMatch) {
                leadTimezoneName = tzMatch[1].toLowerCase();
                leadTimezoneOffset = timezoneOffsets[leadTimezoneName] || null;
                console.log(`   🌍 Found timezone: ${leadTimezoneName} (UTC${leadTimezoneOffset})`);
                break;
              }
            }
            
            // ============================================================
            // STEP 2: Extract TIME (hour, minute, am/pm)
            // ============================================================
            let foundHour: number | null = null;
            let foundMinute = 0;
            let foundPeriod: string | null = null;
            
            const timeMatch = transcriptLower.match(/(\d{1,2}):?(\d{2})?\s*(am|pm|a\.m\.|p\.m\.)/i);
            if (timeMatch) {
              foundHour = parseInt(timeMatch[1]);
              foundMinute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
              foundPeriod = timeMatch[3].replace(/\./g, '').toLowerCase();
              console.log(`   ⏰ Found time: ${foundHour}:${foundMinute.toString().padStart(2, '0')} ${foundPeriod}`);
              timeConfidence = 'medium';
            }
            
            // ============================================================
            // STEP 3: Extract DAY (Monday, Tuesday, tomorrow, etc.)
            // ============================================================
            let foundDay: string | null = null;
            const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            
            for (const day of daysOfWeek) {
              if (transcriptLower.includes(day)) {
                foundDay = day;
                console.log(`   📆 Found day: ${foundDay}`);
                if (foundHour !== null) timeConfidence = 'high';
                break;
              }
            }
            
            if (transcriptLower.includes('tomorrow')) {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              foundDay = daysOfWeek[tomorrow.getDay()];
              console.log(`   📆 Found "tomorrow" = ${foundDay}`);
              if (foundHour !== null) timeConfidence = 'high';
            }
            
            // ============================================================
            // STEP 4: BUILD THE APPOINTMENT DATE/TIME
            // ============================================================
            if (foundHour !== null) {
              const now = new Date();
              
              // Convert to 24-hour format
              let hour24 = foundHour;
              if (foundPeriod === 'pm' && foundHour !== 12) {
                hour24 = foundHour + 12;
              } else if (foundPeriod === 'am' && foundHour === 12) {
                hour24 = 0;
              }
              
              // Calculate the target date
              let targetDate = new Date();
              
              if (foundDay) {
                const targetDayIndex = daysOfWeek.indexOf(foundDay.toLowerCase());
                const currentDayIndex = now.getDay();
                let daysUntil = targetDayIndex - currentDayIndex;
                if (daysUntil <= 0) daysUntil += 7;
                targetDate.setDate(now.getDate() + daysUntil);
              }
              
              // ============================================================
              // STEP 5: TIMEZONE CONVERSION
              // If we found lead's timezone, convert to user's timezone
              // ============================================================
              const userOffset = ianaToOffset[userTimezone] || -5; // Default to Eastern
              
              if (leadTimezoneOffset !== null) {
                // We know the lead's timezone - do the conversion!
                const hourDifference = userOffset - leadTimezoneOffset;
                
                console.log(`   🔄 TIMEZONE CONVERSION:`);
                console.log(`      Lead said: ${foundHour}:${foundMinute.toString().padStart(2, '0')} ${foundPeriod} ${leadTimezoneName}`);
                console.log(`      Lead timezone offset: UTC${leadTimezoneOffset}`);
                console.log(`      User timezone offset: UTC${userOffset}`);
                console.log(`      Hour difference: ${hourDifference} hours`);
                
                // Apply the timezone difference
                const convertedHour24 = hour24 + hourDifference;
                
                // Handle day rollover
                if (convertedHour24 >= 24) {
                  targetDate.setDate(targetDate.getDate() + 1);
                  hour24 = convertedHour24 - 24;
                } else if (convertedHour24 < 0) {
                  targetDate.setDate(targetDate.getDate() - 1);
                  hour24 = convertedHour24 + 24;
                } else {
                  hour24 = convertedHour24;
                }
                
                const convertedPeriod = hour24 >= 12 ? 'PM' : 'AM';
                const convertedHour12 = hour24 > 12 ? hour24 - 12 : (hour24 === 0 ? 12 : hour24);
                
                console.log(`      CONVERTED TO: ${convertedHour12}:${foundMinute.toString().padStart(2, '0')} ${convertedPeriod} (user's timezone)`);
                
                timeConfidence = 'high';
              } else {
                console.log(`   ⚠️ No timezone found in transcript - assuming time is already in user's timezone`);
              }
              
              // Set the final time
              targetDate.setHours(hour24, foundMinute, 0, 0);
              extractedTime = targetDate;
              
              console.log(`   📅 Final appointment time: ${extractedTime.toLocaleString()}`);
              console.log(`   📊 Confidence: ${timeConfidence}`);
            }
          }
          
          // Create the appointment
          const appointmentTime = extractedTime || new Date(Date.now() + 24 * 60 * 60 * 1000);
          const needsConfirmation = !extractedTime || timeConfidence !== 'high';
          
          let noteText = '';
          if (!extractedTime) {
            noteText = '⚠️ PLEASE CONFIRM TIME - Could not extract time from transcript';
          } else if (leadTimezoneName) {
            noteText = `✅ Converted from ${leadTimezoneName.toUpperCase()} to your timezone`;
          } else if (timeConfidence !== 'high') {
            noteText = `⚠️ PLEASE CONFIRM TIME - Extracted from transcript (${timeConfidence} confidence)`;
          } else {
            noteText = '✅ Time extracted from call transcript';
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
          console.log(`   - Needs confirmation: ${needsConfirmation}`);
          
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
            console.log(`   - Scheduled: ${appointmentData.scheduled_at}`);
            if (needsConfirmation) {
              console.log('   ⚠️ User should verify the appointment time!');
            }
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
      // Double dial no answer - NOW increment counter (counts as 1 complete attempt)
      // IMPORTANT: Re-fetch current value to avoid race conditions!
      const { data: freshSettings } = await supabase
        .from('ai_control_settings')
        .select('calls_made_today')
        .eq('user_id', userId)
        .single();
      
      const currentCallCount = freshSettings?.calls_made_today || 0;
      const newCallCount = currentCallCount + 1;
      
      console.log(`📞 Double dial no answer - incrementing calls_made_today: ${currentCallCount} → ${newCallCount}`);
      console.log(`   This counts as completing 1 lead attempt`);
      
      await supabase
        .from('ai_control_settings')
        .update({
          calls_made_today: newCallCount,
          last_call_status: 'no_answer',
        })
        .eq('user_id', userId);
    } else if (!wasDoubleDial && !callWasAnswered) {
      // First attempt no answer - DON'T increment counter yet (will double dial)
      console.log(`📞 First attempt no answer - NOT incrementing counter (waiting for double dial)`);
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
            customer_name: lead.name,
            lead_name: lead.name,
            userId: userId,
            leadId: leadId,
            live_transfer: "true",
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
          console.error('❌ Retell API failed:', errorText.substring(0, 200));
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


