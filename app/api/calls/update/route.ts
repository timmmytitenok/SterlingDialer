import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('📞 Call update received from N8N');
    
    const body = await request.json();
    console.log('📦 Call data:', body);

    const { 
      userId, 
      contactName, 
      contactPhone, 
      pickedUp,  // true/false OR 'true'/'false' string - was the call answered?
      outcome,   // 'booked', 'not_interested', 'callback', 'live_transfer', or null if not answered
      duration,
      recordingUrl,
      contactAge,   // Optional: age from call
      contactState, // Optional: state from call
      scheduledAt   // Optional: ISO timestamp for appointment (if not provided, defaults to current time + 24 hours)
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Convert pickedUp to boolean (handle both boolean and string values)
    let wasAnswered = pickedUp === true || pickedUp === 'true' || pickedUp === 1;
    
    // 🚫 SHORT CALL FILTER: Calls under 5 seconds are treated as "No Answer"
    // Even if someone technically picked up, if the call was <5 seconds it doesn't count as connected
    // BUT we still deduct balance and track AI costs!
    const MIN_CALL_DURATION_SECONDS = 5;
    const callDuration = duration ? Number(duration) : 0;
    const isShortCall = callDuration > 0 && callDuration < MIN_CALL_DURATION_SECONDS;
    
    if (isShortCall) {
      console.log(`⏱️ SHORT CALL DETECTED: ${callDuration}s < ${MIN_CALL_DURATION_SECONDS}s minimum`);
      console.log(`📵 Treating as "No Answer" - will NOT be added to Call History, but WILL deduct balance`);
      wasAnswered = false; // Force to not answered
    }
    
    console.log(`📞 Call answered: ${wasAnswered} (original value: ${pickedUp}, type: ${typeof pickedUp})`);

    // Map outcome values to match expected format
    // IMPORTANT: Only set outcome if call was answered!
    let finalOutcome = null;
    if (wasAnswered && outcome) {
      const outcomeMap: Record<string, string> = {
        'booked': 'appointment_booked',
        'appointment_booked': 'appointment_booked',
        'not_interested': 'not_interested',
        'callback': 'callback_later',
        'callback_later': 'callback_later',
        'live_transfer': 'live_transfer',
        'transfer': 'live_transfer',
      };
      finalOutcome = outcomeMap[outcome.toLowerCase()] || outcome;
      console.log(`✅ Call was answered - Outcome: ${finalOutcome}`);
    } else if (!wasAnswered) {
      // Call not answered - explicitly set outcome to null
      finalOutcome = null;
      console.log(`📵 Call NOT answered - No outcome recorded (only affects dial count)`);
    }

    // Determine disposition based on whether call was picked up
    const finalDisposition = wasAnswered ? 'answered' : 'no_answer';
    const isConnected = wasAnswered;

    // Insert call record - SKIP for short calls (they don't go to Call History)
    let callRecordId: string | null = null;
    
    if (isShortCall) {
      console.log('⏱️ SHORT CALL: Skipping Call History insert (but will still process balance/costs)');
    } else {
      console.log('🔄 Attempting to insert call into database...');
      console.log('📝 Insert data:', {
        user_id: userId,
        disposition: finalDisposition,
        outcome: finalOutcome,
        contact_name: contactName,
        contact_phone: contactPhone,
        duration_seconds: duration,
        connected: isConnected,
        recording_url: recordingUrl || null,
      });

      const { data, error } = await supabase
        .from('calls')
        .insert([{
          user_id: userId,
          disposition: finalDisposition,
          outcome: finalOutcome,
          contact_name: contactName,
          contact_phone: contactPhone,
          duration_seconds: duration,
          connected: isConnected,
          recording_url: recordingUrl || null,
          created_at: new Date().toISOString(),
        }])
        .select();

      if (error) {
        console.error('❌ DATABASE INSERT ERROR:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      if (!data || data.length === 0) {
        console.error('❌ No data returned from insert!');
        throw new Error('Insert succeeded but no data returned');
      }

      callRecordId = data[0].id;
      const outcomeText = finalOutcome ? ` → ${finalOutcome}` : '';
      console.log(`✅ Call saved to database: ${contactName || 'Unknown'} - ${finalDisposition}${outcomeText} (Answered: ${wasAnswered})`);
      console.log(`✅ Inserted record ID: ${callRecordId}`);
      console.log(`✅ Connected: ${isConnected}, Disposition: ${finalDisposition}`);
    }

    // BALANCE DEDUCTION: If call had duration, deduct from user's balance
    if (duration && duration > 0) {
      const durationMinutes = duration / 60; // Convert seconds to minutes
      console.log(`💰 Processing balance deduction: ${duration}s = ${durationMinutes.toFixed(2)} minutes`);
      
      try {
        // Get user's cost per minute from profile
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('cost_per_minute')
          .eq('user_id', userId)
          .single();
        
        const costPerMinute = userProfile?.cost_per_minute || 0.35; // Default to $0.35 if not set
        console.log(`💰 User's cost per minute: $${costPerMinute}`);
        
        // DIRECT DEDUCTION - Don't use fetch, do it here directly
        const cost = durationMinutes * costPerMinute;
        
        // Get current balance
        const { data: balanceData } = await supabase
          .from('call_balance')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (balanceData) {
          const currentBalance = balanceData.balance;
          const newBalance = currentBalance - cost;

          console.log(`📊 Current balance: $${currentBalance.toFixed(3)}, Cost: $${cost.toFixed(3)}, New balance: $${newBalance.toFixed(3)}`);

          // Update balance
          await supabase
            .from('call_balance')
            .update({ 
              balance: newBalance,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

          // Record transaction
          await supabase
            .from('balance_transactions')
            .insert({
              user_id: userId,
              amount: -cost,
              type: 'deduction',
              description: `Call charge: ${durationMinutes.toFixed(2)} minutes`,
              balance_after: newBalance,
            });

          console.log(`✅ Balance deducted: $${cost.toFixed(3)} | New balance: $${newBalance.toFixed(3)}`);

          // Check for auto-refill
          if (balanceData.auto_refill_enabled && newBalance < 1) {
            console.log('🔄 Balance below $1 - Auto-refill will be triggered by background job');
            // Note: Auto-refill via Stripe should ideally be handled by a separate background job
            // For now, just log it
          }
        } else {
          console.warn('⚠️  No balance record found for user');
        }
      } catch (balanceError: any) {
        console.error('❌ Error deducting balance:', balanceError.message);
        // Don't fail the whole call insertion if balance deduction fails
      }
    }

    // UPDATE AI COSTS: Track daily AI costs in revenue_tracking
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Get user's cost per minute from profile
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('cost_per_minute')
        .eq('user_id', userId)
        .single();
      
      const costPerMinute = userProfile?.cost_per_minute || 0.35; // Default to $0.35 if not set
      const callCost = duration ? (duration / 60) * costPerMinute : 0; // Calculate actual call cost using user's rate
      
      console.log(`📊 Updating AI costs for ${today}: +$${callCost.toFixed(4)} (at $${costPerMinute}/min)`);
      
      // 💰 CALCULATE YOUR PROFIT from this call
      const YOUR_COST_PER_MINUTE = 0.12; // Your actual cost is $0.12/min
      const callMinutes = duration ? (duration / 60) : 0;
      const yourCost = callMinutes * YOUR_COST_PER_MINUTE;
      const yourProfit = callCost - yourCost; // User paid $X, your cost was $Y, profit = X - Y
      
      console.log(`💰 YOUR PROFIT: User paid $${callCost.toFixed(4)}, Your cost $${yourCost.toFixed(4)} = Profit: $${yourProfit.toFixed(4)}`);
      
      // 💎 UPDATE ADMIN PROFIT TRACKING TABLE
      // Get or create today's admin profit record
      const { data: profitData } = await supabase
        .from('admin_profit_tracking')
        .select('*')
        .eq('date', today)
        .single();
      
      if (profitData) {
        // Update existing record - add this call's profit
        const newMinutesProfit = (profitData.minutes_profit || 0) + yourProfit;
        const newTotalMinutesSold = (profitData.total_minutes_sold || 0) + callCost;
        const newTotalMinutesCost = (profitData.total_minutes_cost || 0) + yourCost;
        
        await supabase
          .from('admin_profit_tracking')
          .update({
            minutes_profit: newMinutesProfit,
            total_minutes_sold: newTotalMinutesSold,
            total_minutes_cost: newTotalMinutesCost,
            total_daily_profit: (profitData.subscription_profit || 0) + newMinutesProfit,
            updated_at: new Date().toISOString(),
          })
          .eq('date', today);
        
        console.log(`✅ Admin profit updated: +$${yourProfit.toFixed(4)} | Total today: $${newMinutesProfit.toFixed(2)}`);
      } else {
        // Create new record for today
        await supabase
          .from('admin_profit_tracking')
          .insert({
            date: today,
            minutes_profit: yourProfit,
            total_minutes_sold: callCost,
            total_minutes_cost: yourCost,
            total_daily_profit: yourProfit, // subscription_profit will be updated separately
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        
        console.log(`✅ Admin profit tracking created for ${today}: $${yourProfit.toFixed(4)}`);
      }
      
      // Get user's subscription tier to calculate base cost
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('subscription_tier, status')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      console.log('🔍 Subscription lookup:', { userId, subscription, error: subError });

      // Calculate daily base cost from subscription (monthly price / days in current month)
      let dailyBaseCost = 0;
      if (subscription) {
        // Get the actual number of days in the current month
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate(); // Last day of month
        
        // Get monthly price based on tier
        let monthlyPrice = 0;
        switch (subscription.subscription_tier) {
          case 'starter':
            monthlyPrice = 379;
            break;
          case 'pro':
            monthlyPrice = 899;
            break;
          case 'elite':
            monthlyPrice = 1499;
            break;
        }
        
        // Divide by actual days in month
        dailyBaseCost = monthlyPrice / daysInMonth;
        
        console.log(`💰 Daily base cost (${subscription.subscription_tier.toUpperCase()}): $${monthlyPrice} ÷ ${daysInMonth} days = $${dailyBaseCost.toFixed(2)}/day`);
      } else {
        console.log(`⚠️  No active subscription found for user - daily base cost will be $0`);
      }
      
      // Get or create today's revenue tracking record
      const { data: revenueData } = await supabase
        .from('revenue_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (revenueData) {
        // Update existing record - add to daily cost
        const newDailyCost = (revenueData.ai_daily_cost || 0) + callCost;
        
        const { error: updateError } = await supabase
          .from('revenue_tracking')
          .update({
            ai_retainer_cost: dailyBaseCost, // Update base cost in case tier changed
            ai_daily_cost: newDailyCost,
          })
          .eq('user_id', userId)
          .eq('date', today);
        
        if (updateError) {
          console.error(`❌ Error updating revenue tracking:`, updateError);
        } else {
          const oldCallCost = revenueData.ai_daily_cost || 0;
          console.log(`✅ AI costs updated:`);
          console.log(`   Base Cost: $${dailyBaseCost.toFixed(2)}`);
          console.log(`   Call Costs: $${oldCallCost.toFixed(3)} → $${newDailyCost.toFixed(3)} (+$${callCost.toFixed(3)})`);
          console.log(`   Total AI Cost Today: $${(dailyBaseCost + newDailyCost).toFixed(3)}`);
        }
      } else {
        // Create new record for today with base cost
        const { error: insertError } = await supabase
          .from('revenue_tracking')
          .insert({
            user_id: userId,
            date: today,
            revenue: 0,
            ai_retainer_cost: dailyBaseCost, // Base subscription cost / days in month
            ai_daily_cost: callCost, // Per-minute charges
          });
        
        if (insertError) {
          console.error(`❌ Error creating revenue tracking:`, insertError);
        } else {
          console.log(`✅ Created revenue tracking:`);
          console.log(`   Base Cost: $${dailyBaseCost.toFixed(2)}`);
          console.log(`   Call Costs: $${callCost.toFixed(3)}`);
          console.log(`   Total AI Cost Today: $${(dailyBaseCost + callCost).toFixed(3)}`);
        }
      }
    } catch (revenueError: any) {
      console.error('⚠️  Error updating revenue tracking:', revenueError.message);
      // Don't fail the call insertion if revenue tracking fails
    }

    // ========================================================================
    // APPOINTMENT BOOKING - Let Cal.ai handle appointment creation!
    // Cal.ai has the CORRECT scheduled time, we just update the lead status
    // and optionally store call details for Cal.ai to merge later
    // ========================================================================
    if (finalOutcome === 'appointment_booked' && contactName && !isShortCall) {
      console.log('🔗 Appointment booked! Cal.ai webhook will create the appointment with correct time.');
      console.log('📋 Storing call details for Cal.ai to merge...');
      
      try {
        // Find the lead and update with call details so Cal.ai can find them later
        if (contactPhone) {
          const normalizedPhone = contactPhone.replace(/\D/g, '');
          const last10Digits = normalizedPhone.slice(-10);
          
          console.log('🔍 Finding lead to store call details:', contactPhone, '→', last10Digits);
          
          const { data: matchingLead } = await supabase
            .from('leads')
            .select('id')
            .eq('user_id', userId)
            .or(`phone.ilike.%${last10Digits}%,phone.ilike.%${normalizedPhone}%`)
            .limit(1)
            .maybeSingle();
          
          if (matchingLead) {
            console.log('✅ Found lead:', matchingLead.id);
            
            // Store pending appointment info on the lead for Cal.ai to use
            const leadUpdate: any = {
              last_call_outcome: 'appointment_booked',
              updated_at: new Date().toISOString(),
            };
            
            if (contactAge) leadUpdate.age = contactAge;
            if (contactState) leadUpdate.state = contactState;
            
            await supabase
              .from('leads')
              .update(leadUpdate)
              .eq('id', matchingLead.id);
            
            console.log('✅ Lead updated with call details - Cal.ai will use this to create appointment');
            
            // Also try to find if Cal.ai already created the appointment (it might fire before us!)
            // Look for recent appointments for this lead
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            const { data: existingAppt } = await supabase
              .from('appointments')
              .select('id, prospect_name, scheduled_at')
              .eq('lead_id', matchingLead.id)
              .gte('created_at', fiveMinutesAgo)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (existingAppt) {
              console.log('✅ Cal.ai already created appointment!');
              console.log('   - ID:', existingAppt.id);
              console.log('   - Time:', existingAppt.scheduled_at);
              
              // Update with call recording if we have it
              if (recordingUrl || callRecordId) {
                await supabase
                  .from('appointments')
                  .update({
                    call_id: callRecordId,
                    call_recording_url: recordingUrl || null,
                    prospect_age: contactAge || undefined,
                    prospect_state: contactState || undefined,
                  })
                  .eq('id', existingAppt.id);
                console.log('✅ Updated Cal.ai appointment with call details!');
              }
            } else {
              console.log('⏳ Cal.ai appointment not found yet - it will be created by Cal.ai webhook');
              console.log('   📞 Make sure Cal.ai webhook is firing on booking!');
            }
          } else {
            console.log('⚠️ No matching lead found by phone');
          }
        }
      } catch (appointmentError: any) {
        console.error('⚠️  Error in appointment processing (non-fatal):', appointmentError.message);
      }
    }

    // Return response based on whether it was a short call or normal call
    if (isShortCall) {
      return NextResponse.json({ 
        success: true, 
        message: `Short call (${callDuration}s) - treated as No Answer, balance deducted but not added to Call History`,
        shortCall: true,
        duration: callDuration
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      callId: callRecordId,
      message: 'Call recorded successfully'
    });
  } catch (error: any) {
    console.error('❌ Error saving call:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save call' },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'Call Update Endpoint - Tracks all calls (dialed and answered)',
    method: 'POST',
    requiredFields: {
      userId: 'UUID (required) - User making the call',
      pickedUp: 'boolean or string (required) - true/"true" if answered, false/"false" if not answered',
    },
    optionalFields: {
      contactName: 'string - Name of person called',
      contactPhone: 'string - Phone number',
      contactAge: 'number - Age of contact (will update/create appointments)',
      contactState: 'string - State of contact (will update/create appointments)',
      outcome: 'string - Only if answered: "booked", "not_interested", "callback", "live_transfer"',
      duration: 'number - Call length in seconds',
      recordingUrl: 'string - URL to call recording',
      scheduledAt: 'ISO 8601 timestamp - When appointment should be scheduled (only used when creating new appointments). If not provided, defaults to 24 hours from now.'
    },
    outcomes: {
      booked: 'Appointment was scheduled - Will create appointment if none exists, or update existing Cal.ai appointment',
      not_interested: 'Lead declined/not interested',
      callback: 'Follow up needed later',
      live_transfer: 'Call was transferred to live agent'
    },
    appointmentLogic: {
      ifExistingAppointment: 'Updates Cal.ai appointment with phone, age, state, recording URL',
      ifNoAppointment: 'Creates new appointment. Uses scheduledAt if provided, otherwise defaults to 24 hours from call time',
      schedulingNote: 'Each appointment gets a unique time based on when the call occurred, preventing conflicts'
    },
    examples: {
      dialedNotAnswered: {
        userId: 'abc-123',
        pickedUp: false,
        contactName: 'John Doe',
        contactPhone: '555-1234'
      },
      answeredAndBooked: {
        userId: 'abc-123',
        pickedUp: true,
        outcome: 'booked',
        contactName: 'Jane Smith',
        contactPhone: '555-5678',
        contactAge: 45,
        contactState: 'CA',
        duration: 145,
        recordingUrl: 'https://...'
      },
      answeredAndBookedWithTime: {
        userId: 'abc-123',
        pickedUp: true,
        outcome: 'booked',
        contactName: 'Jane Smith',
        contactPhone: '555-5678',
        contactAge: 45,
        contactState: 'CA',
        duration: 145,
        recordingUrl: 'https://...',
        scheduledAt: '2025-10-29T14:30:00.000Z'
      }
    }
  });
}

