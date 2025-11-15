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

    // Determine time period
    const now = new Date();
    const currentHour = parseInt(now.toLocaleString('en-US', { 
      hour: 'numeric', 
      hour12: false, 
      timeZone: userTimezone 
    }));
    
    let timePeriod = null;
    if (currentHour >= 8 && currentHour < 12) {
      timePeriod = 'morning';
    } else if (currentHour >= 12 && currentHour < 17) {
      timePeriod = 'daytime';
    } else if (currentHour >= 18 && currentHour < 21) {
      timePeriod = 'evening';
    }
    
    console.log(`🕐 Current hour: ${currentHour}, Time period: ${timePeriod}`);

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
    
    // Check if call was actually picked up
    // If in_voicemail = false, they picked up! (even if they hung up quickly)
    // Only if in_voicemail = true did it NOT get picked up
    const callWasAnswered = !inVoicemail;
    
    console.log(`📊 Call classification:`);
    console.log(`   - Duration: ${durationSeconds}s`);
    console.log(`   - In voicemail: ${inVoicemail}`);
    console.log(`   - Was answered: ${callWasAnswered} (in_voicemail = ${inVoicemail})`);
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

      // Parse outcome from Retell's custom_analysis_data
      const customAnalysis = call_analysis?.custom_analysis_data || {};
      console.log('📊 Custom Analysis Data:', customAnalysis);

      // Check flags in priority order
      if (customAnalysis.NOT_INTERESTED === true) {
        outcome = 'not_interested';
        leadStatus = 'not_interested';
        console.log('❌ Lead is NOT INTERESTED - marking as dead lead');
        
      } else if (customAnalysis.BOOKED === true) {
        outcome = 'appointment_booked';
        leadStatus = 'appointment_booked';
        console.log('🎉 APPOINTMENT BOOKED!');
        
        // TODO: Check Cal.AI webhook for appointment details
        
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
    console.log(`   - Time Period: ${timePeriod}`);
    console.log(`   - Was Double Dial: ${wasDoubleDial}`);
    
    // Build update object with fields that exist
    const leadUpdate: any = {
      status: leadStatus,
      last_call_outcome: outcome,
      last_dial_at: new Date().toISOString(), // FIX: Use last_dial_at, not last_called!
      last_called: new Date().toISOString(), // Keep both for compatibility
      updated_at: new Date().toISOString(),
    };
    
    // CRITICAL: Mark this lead as attempted today (prevent calling same lead twice today)
    // Increment on double dial OR answered call (not on first attempt no-answer)
    if (wasDoubleDial || callWasAnswered) {
      // This lead was fully attempted (either answered or double-dialed)
      leadUpdate.call_attempts_today = (lead.call_attempts_today || 0) + 1;
      leadUpdate.last_attempt_date = todayStr;
      console.log(`   - Marking lead as attempted today: call_attempts_today = ${leadUpdate.call_attempts_today}`);
      console.log(`   - Last attempt date: ${todayStr}`);
      console.log(`   - This lead will NOT be called again today!`);
    } else {
      console.log(`   - First attempt no answer - NOT marking as attempted (will double dial)`);
    }
    
    // Try to update enhanced tracking columns if they exist
    try {
      // Increment counters on double dial OR if call was answered
      if (wasDoubleDial || callWasAnswered) {
        console.log('📊 Call completed - incrementing counters...');
        
        // Increment times_dialed
        if (lead.times_dialed !== undefined) {
          leadUpdate.times_dialed = (lead.times_dialed || 0) + 1;
          console.log(`   - Incrementing times_dialed: ${lead.times_dialed || 0} → ${leadUpdate.times_dialed}`);
        }
        
        // Update enhanced tracking if columns exist
        if (lead.total_calls_made !== undefined) {
          leadUpdate.total_calls_made = (lead.total_calls_made || 0) + 1;
          console.log(`   - Incrementing total_calls_made: ${lead.total_calls_made || 0} → ${leadUpdate.total_calls_made}`);
        }
      } else {
        console.log('📊 First attempt no answer - NOT incrementing counters (waiting for double dial)');
      }
      
      // Only count pickups if call was answered
      if (callWasAnswered && lead.total_pickups !== undefined) {
        leadUpdate.total_pickups = (lead.total_pickups || 0) + 1;
        console.log(`   - Incrementing total_pickups: ${lead.total_pickups || 0} → ${leadUpdate.total_pickups}`);
    }

      // Update missed calls by time period (ONLY on double dial + no answer)
      if (!callWasAnswered && wasDoubleDial && timePeriod) {
        console.log(`   - Recording missed call in ${timePeriod} period`);
        
        if (timePeriod === 'morning' && lead.morning_missed_calls !== undefined) {
          leadUpdate.morning_missed_calls = (lead.morning_missed_calls || 0) + 1;
          console.log(`   - Incrementing morning_missed_calls: ${lead.morning_missed_calls || 0} → ${leadUpdate.morning_missed_calls}`);
        } else if (timePeriod === 'daytime' && lead.daytime_missed_calls !== undefined) {
          leadUpdate.daytime_missed_calls = (lead.daytime_missed_calls || 0) + 1;
          console.log(`   - Incrementing daytime_missed_calls: ${lead.daytime_missed_calls || 0} → ${leadUpdate.daytime_missed_calls}`);
        } else if (timePeriod === 'evening' && lead.evening_missed_calls !== undefined) {
          leadUpdate.evening_missed_calls = (lead.evening_missed_calls || 0) + 1;
          console.log(`   - Incrementing evening_missed_calls: ${lead.evening_missed_calls || 0} → ${leadUpdate.evening_missed_calls}`);
        }
        
        if (lead.total_missed_calls !== undefined) {
          leadUpdate.total_missed_calls = (lead.total_missed_calls || 0) + 1;
          console.log(`   - Incrementing total_missed_calls: ${lead.total_missed_calls || 0} → ${leadUpdate.total_missed_calls}`);
        }
      }
      
      if (lead.last_call_time_period !== undefined) {
        leadUpdate.last_call_time_period = timePeriod;
      }
      
      // Calculate pickup rate if columns exist
      if (leadUpdate.total_calls_made && leadUpdate.total_pickups !== undefined) {
        leadUpdate.pickup_rate = (leadUpdate.total_pickups / leadUpdate.total_calls_made) * 100;
        console.log(`   - Pickup rate: ${leadUpdate.pickup_rate.toFixed(1)}%`);
      }
      
    } catch (trackingError) {
      console.error('⚠️ Error updating enhanced tracking (columns may not exist):', trackingError);
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
    const { error: callInsertError } = await supabase
      .from('calls')
      .insert({
        user_id: userId,
        lead_id: leadId,
        call_id: call_id,
          phone_number: lead.phone,
          duration: durationMinutes,
          disposition: callWasAnswered ? 'answered' : 'no_answer',
        outcome: outcome,
          connected: callWasAnswered,
        recording_url: recording_url,
        transcript: transcript,
        call_analysis: call_analysis,
        disconnection_reason: disconnection_reason,
          in_voicemail: inVoicemail,
          call_time_period: timePeriod,
          was_double_dial: wasDoubleDial,
        created_at: new Date().toISOString(),
      });
    
    if (callInsertError) {
      console.error('❌ Failed to insert call record:', callInsertError);
    } else {
        console.log('✅ Call record created');
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
      const currentSpend = aiSettings.today_spend || 0;
      const newSpend = currentSpend + callCost;

      console.log(`💰 Updating spend: $${currentSpend.toFixed(2)} → $${newSpend.toFixed(2)}`);
      console.log(`📞 Incrementing calls_made_today: ${aiSettings.calls_made_today || 0} → ${(aiSettings.calls_made_today || 0) + 1}`);

      await supabase
        .from('ai_control_settings')
        .update({
          today_spend: newSpend,
          calls_made_today: (aiSettings.calls_made_today || 0) + 1,
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
        // CHECK FOR AUTO-REFILL (balance < $10)
        // ========================================================================
        if (balance.auto_refill_enabled && newBalance < 10) {
          console.log('');
          console.log('🔄🔄🔄 AUTO-REFILL TRIGGERED! 🔄🔄🔄');
          console.log(`💰 Balance dropped to $${newBalance.toFixed(2)} (below $10)`);
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
                apiVersion: '2024-11-20.acacia' as any,
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
          
          // Don't include total_ai_cost - it's auto-calculated!
          // Don't include created_at - it has a default!
          const { error: insertError } = await supabase
            .from('revenue_tracking')
            .insert({
              user_id: userId,
              date: todayStr,
              revenue: 0,
              ai_retainer_cost: 0, // Will be set by dashboard page
              ai_daily_cost: callCost,
            });
          
          if (insertError) {
            console.error('❌ Failed to insert revenue_tracking:', insertError);
          } else {
            console.log(`✅ Revenue tracking created with AI cost: $${callCost.toFixed(4)}`);
            console.log(`   (total_ai_cost will be auto-calculated by database)`);
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
      console.log(`📞 Double dial no answer - incrementing calls_made_today: ${aiSettings.calls_made_today || 0} → ${(aiSettings.calls_made_today || 0) + 1}`);
      console.log(`   This counts as completing 1 lead attempt`);
      
      await supabase
        .from('ai_control_settings')
        .update({
          calls_made_today: (aiSettings.calls_made_today || 0) + 1,
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
    
    // Check if there are more callable leads (simplified query)
    console.log('🔍 Checking for more callable leads...');
    
    const { data: callableLeads, error: leadCheckError } = await supabase
      .from('leads')
      .select('id, name, status')
      .eq('user_id', userId)
      .eq('is_qualified', true)
      .in('status', ['new', 'callback_later', 'unclassified', 'no_answer'])
      .limit(5); // Get up to 5 to see what's available
    
    console.log(`   Found ${callableLeads?.length || 0} callable leads`);
    if (leadCheckError) console.error('   Error:', leadCheckError);
    if (callableLeads && callableLeads.length > 0) {
      console.log('   Next lead:', callableLeads[0].name, '-', callableLeads[0].status);
    }
    
    if (!callableLeads || callableLeads.length === 0) {
      console.log('📭 No more callable leads, stopping AI');
      await supabase
        .from('ai_control_settings')
        .update({ status: 'stopped', last_call_status: 'no_leads' })
        .eq('user_id', userId);
      
      return NextResponse.json({
        success: true,
        message: 'Call processed, no more leads',
        outcome: outcome,
        cost: callCost,
        aiStopped: true,
        reason: 'no_more_leads',
      });
    }
    
    // Continue to next lead
    console.log('');
    console.log('🔄 ========== TRIGGERING NEXT CALL ========== 🔄');
    console.log(`   Will call next lead: ${callableLeads[0].name}`);
    console.log('');
    
    fetch('http://localhost:3000/api/ai-control/next-call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    }).catch(error => {
      console.error('❌ Error triggering next call:', error);
    });

    return NextResponse.json({
      success: true,
      message: 'Call processed successfully',
      outcome: outcome,
      cost: callCost,
      inVoicemail: inVoicemail,
      hungUpBy: hungUpBy,
      timePeriod: timePeriod,
      nextCallTriggered: true,
    });
  } catch (error: any) {
    console.error('❌ Error processing call result:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process call result' },
      { status: 500 }
    );
  }
}

