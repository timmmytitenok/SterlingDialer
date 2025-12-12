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
    const wasAnswered = pickedUp === true || pickedUp === 'true' || pickedUp === 1;
    
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

    // Insert call record
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

    const outcomeText = finalOutcome ? ` → ${finalOutcome}` : '';
    console.log(`✅ Call saved to database: ${contactName || 'Unknown'} - ${finalDisposition}${outcomeText} (Answered: ${wasAnswered})`);
    console.log(`✅ Inserted record ID: ${data[0].id}`);
    console.log(`✅ Connected: ${isConnected}, Disposition: ${finalDisposition}`);

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
        
        const costPerMinute = userProfile?.cost_per_minute || 0.30; // Default to $0.30 if not set
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
      
      const costPerMinute = userProfile?.cost_per_minute || 0.30; // Default to $0.30 if not set
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
            monthlyPrice = 499;
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

    // NEW: If appointment was booked, find and update matching Cal.ai appointment OR create new one
    if (finalOutcome === 'appointment_booked' && contactName) {
      console.log('🔗 Appointment booked! Looking for matching Cal.ai appointment...');
      
      try {
        // Find appointments from Cal.ai that match this contact (by name and user)
        // Look for appointments created recently (within last 7 days) that are still scheduled
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: matchingAppointments } = await supabase
          .from('appointments')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'scheduled')
          .ilike('prospect_name', `%${contactName}%`)
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(1);

        if (matchingAppointments && matchingAppointments.length > 0) {
          const appointment = matchingAppointments[0];
          console.log(`✅ Found matching appointment: ${appointment.id}`);
          console.log(`   Name: ${appointment.prospect_name}`);
          console.log(`   Scheduled: ${appointment.scheduled_at}`);

          // Update appointment with call details
          const updateData: any = {
            call_id: data[0].id,  // Link to the call
          };

          // Only update fields that are missing in the appointment
          if (contactPhone && !appointment.prospect_phone) {
            updateData.prospect_phone = contactPhone;
            console.log(`   Adding phone: ${contactPhone}`);
          }
          if (contactAge && !appointment.prospect_age) {
            updateData.prospect_age = contactAge;
            console.log(`   Adding age: ${contactAge}`);
          }
          if (contactState && !appointment.prospect_state) {
            updateData.prospect_state = contactState;
            console.log(`   Adding state: ${contactState}`);
          }
          if (recordingUrl && !appointment.call_recording_url) {
            updateData.call_recording_url = recordingUrl;
            console.log(`   Adding recording URL`);
          }

          // Update the appointment
          const { error: updateError } = await supabase
            .from('appointments')
            .update(updateData)
            .eq('id', appointment.id);

          if (updateError) {
            console.error('❌ Error updating appointment:', updateError);
          } else {
            console.log('✅ Appointment updated with call details!');
          }
        } else {
          // No matching appointment found - CREATE A NEW ONE!
          console.log('📅 No matching appointment found - creating new appointment from call...');
          
          // Use provided scheduledAt or default to 24 hours from now (preserving current time)
          let appointmentTime;
          if (scheduledAt) {
            appointmentTime = new Date(scheduledAt).toISOString();
            console.log('📆 Using provided scheduled time:', appointmentTime);
          } else {
            const nowPlus24Hours = new Date();
            nowPlus24Hours.setHours(nowPlus24Hours.getHours() + 24);
            appointmentTime = nowPlus24Hours.toISOString();
            console.log('📆 Using default time (24 hours from now):', appointmentTime);
          }

          const newAppointmentData = {
            user_id: userId,
            prospect_name: contactName,
            prospect_phone: contactPhone || null,
            prospect_age: contactAge || null,
            prospect_state: contactState || null,
            scheduled_at: appointmentTime,
            status: 'scheduled',
            is_sold: false,
            is_no_show: false,
            call_id: data[0].id,
            call_recording_url: recordingUrl || null,
            created_at: new Date().toISOString(),
          };

          console.log('📝 Creating appointment:', newAppointmentData);

          const { data: newAppointment, error: createError } = await supabase
            .from('appointments')
            .insert([newAppointmentData])
            .select()
            .single();

          if (createError) {
            console.error('❌ Error creating appointment:', createError);
          } else {
            console.log('✅ Appointment created successfully!');
            console.log('✅ Appointment ID:', newAppointment.id);
            console.log('✅ Scheduled for:', appointmentTime);
          }
        }
      } catch (appointmentError: any) {
        console.error('⚠️  Error managing appointment (non-fatal):', appointmentError.message);
        // Don't fail the whole request if appointment management fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      call: data[0],
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

