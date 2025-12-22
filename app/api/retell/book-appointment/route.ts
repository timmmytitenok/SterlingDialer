import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/retell/book-appointment
 * 
 * Custom webhook for Retell to book appointments using the USER's Cal.ai API key
 * This enables global agents while still using per-user calendars
 * 
 * Retell sends:
 * - userId: The user whose calendar to book on
 * - leadId: The lead being scheduled
 * - customer_name: Name of the person
 * - customer_phone: Phone number
 * - customer_email: Email (optional)
 * - preferred_time: When they want the appointment (e.g., "tomorrow at 2pm")
 * - notes: Any additional notes
 */
export async function POST(request: Request) {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📅 BOOK APPOINTMENT WEBHOOK');
  console.log('═══════════════════════════════════════════════════════');

  try {
    const body = await request.json();
    console.log('📥 RAW BODY RECEIVED:', JSON.stringify(body, null, 2));
    console.log('📥 BODY KEYS:', Object.keys(body));

    // Handle different formats Retell might send
    // Sometimes it's direct params and sometimes it's {args: {...}}
    const args = body.args || body;
    console.log('📦 PARSED ARGS:', JSON.stringify(args, null, 2));
    console.log('📦 ARGS KEYS:', Object.keys(args));
    
    // DEBUG MODE: If debug=true is passed, just return what we received
    if (body.debug || args.debug) {
      return NextResponse.json({
        debug: true,
        message: 'Debug mode - showing what was received',
        raw_body: body,
        raw_body_keys: Object.keys(body),
        parsed_args: args,
        parsed_args_keys: Object.keys(args),
      });
    }

    const {
      userId,
      leadId,
      customer_name,
      customer_phone,
      customer_email,
      preferred_time,
      notes,
      // Cal.ai specific fields - handle multiple field name variations
      start_time,
      startTime,
      selected_slot,
      slot,
      time,
      end_time,
      timezone,
    } = args;

    // Handle different field names Retell might use for the start time
    const actualStartTime = start_time || startTime || selected_slot || slot || time || args.SlotA_iso || args.slotA_iso;
    
    console.log('🕐 Start time detection:');
    console.log(`   start_time: ${start_time}`);
    console.log(`   startTime: ${startTime}`);
    console.log(`   selected_slot: ${selected_slot}`);
    console.log(`   slot: ${slot}`);
    console.log(`   time: ${time}`);
    console.log(`   SlotA_iso: ${args.SlotA_iso}`);
    console.log(`   → Using: ${actualStartTime}`);

    if (!userId) {
      console.error('❌ Missing userId');
      return NextResponse.json({ 
        success: false, 
        error: `userId is required. Received args: ${JSON.stringify(args)}`,
        debug_received: body,
      }, { status: 200 });
    }
    
    if (!actualStartTime) {
      console.error('❌ Missing start_time');
      console.error('   All args received:', JSON.stringify(args, null, 2));
      return NextResponse.json({ 
        success: false, 
        error: `Missing start_time. I received these fields: ${Object.keys(args).join(', ')}. Please provide start_time in ISO format.`,
        received_body: body,
        received_args: args,
        hint: 'Pass start_time with ISO datetime like 2025-12-23T09:00:00-05:00',
      }, { status: 200 });
    }

    const supabase = createServiceRoleClient();

    // Get user's Cal.ai configuration including timezone
    const { data: retellConfig, error: configError } = await supabase
      .from('user_retell_config')
      .select('cal_ai_api_key, cal_event_id, agent_name, timezone')
      .eq('user_id', userId)
      .single();

    if (configError || !retellConfig) {
      console.error('❌ Failed to fetch user config:', configError);
      return NextResponse.json({ 
        success: false, 
        error: 'User configuration not found' 
      }, { status: 404 });
    }

    if (!retellConfig.cal_ai_api_key) {
      console.error('❌ User has no Cal.ai API key configured');
      return NextResponse.json({ 
        success: false, 
        error: 'Cal.ai API key not configured for this user' 
      }, { status: 400 });
    }

    if (!retellConfig.cal_event_id) {
      console.error('❌ User has no Cal.ai Event ID configured');
      return NextResponse.json({ 
        success: false, 
        error: 'Cal.ai Event ID not configured for this user' 
      }, { status: 400 });
    }

    // Agent's timezone (from config) and Lead's timezone (passed from Retell)
    const agentTimezone = retellConfig.timezone || 'America/New_York';
    const leadTimezone = timezone || 'America/New_York'; // Lead's timezone for display
    
    console.log('✅ User config found:');
    console.log(`   Cal.ai API Key: ${retellConfig.cal_ai_api_key.substring(0, 15)}...`);
    console.log(`   Cal.ai Event ID: ${retellConfig.cal_event_id}`);
    console.log(`   Agent Name: ${retellConfig.agent_name || 'Not set'}`);
    console.log(`   Agent Timezone: ${agentTimezone}`);
    console.log(`   Lead Timezone: ${leadTimezone}`);

    // Build the Cal.com API request
    // Using Cal.com's v2 API for bookings - more reliable format
    const calApiUrl = 'https://api.cal.com/v2/bookings';
    
    // Generate a placeholder email if not provided
    const emailToUse = customer_email || `${customer_phone?.replace(/\D/g, '') || 'lead'}@ai-booking.com`;
    
    // V2 API format uses "attendee" instead of "responses"
    // Use LEAD's timezone so they see the correct time in confirmation
    // The ISO start time already encodes the exact moment, Cal.com converts for agent
    const bookingPayload: any = {
      eventTypeId: parseInt(retellConfig.cal_event_id),
      start: actualStartTime, // ISO format - e.g., 2025-12-23T09:00:00-08:00 (9am PST)
      attendee: {
        name: customer_name || 'AI Booked Lead',
        email: emailToUse,
        timeZone: leadTimezone, // Lead's timezone for their confirmation
      },
      metadata: {
        leadId: leadId || 'unknown',
        userId: userId,
        bookedBy: 'ai_agent',
        agentName: retellConfig.agent_name || 'AI',
        phone: customer_phone || '',
        notes: notes || '',
      },
    };

    console.log('📤 Calling Cal.com v2 API...');
    console.log(`   URL: ${calApiUrl}`);
    console.log(`   Payload:`, JSON.stringify(bookingPayload, null, 2));

    // V2 API uses Bearer token instead of query param
    const calResponse = await fetch(calApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${retellConfig.cal_ai_api_key}`,
        'cal-api-version': '2024-08-13',
      },
      body: JSON.stringify(bookingPayload),
    });

    const calResult = await calResponse.json();
    console.log('📥 Cal.com response:', JSON.stringify(calResult, null, 2));

    if (!calResponse.ok) {
      console.error('❌ Cal.com API error:', calResult);
      console.error('❌ Cal.com HTTP status:', calResponse.status);
      console.error('❌ Full Cal.com response:', JSON.stringify(calResult, null, 2));
      
      // Still create a pending appointment in our database
      if (leadId) {
        await supabase.from('appointments').insert({
          user_id: userId,
          lead_id: leadId,
          customer_name: customer_name,
          customer_phone: customer_phone,
          customer_email: customer_email,
          status: 'pending_manual', // Needs manual scheduling
          notes: `AI tried to book but Cal.com failed: ${calResult.message || JSON.stringify(calResult)}. Preferred time: ${actualStartTime || 'Not specified'}`,
          created_at: new Date().toISOString(),
        });
        console.log('📝 Created pending appointment record for manual follow-up');
      }

      return NextResponse.json({ 
        success: false, 
        error: calResult.message || calResult.error || JSON.stringify(calResult),
        cal_error_details: calResult,
        needs_manual_booking: true,
        attempted_time: actualStartTime,
      }, { status: 200 }); // Return 200 so Retell doesn't retry
    }

    // Success! Create appointment record
    console.log('✅ Appointment booked successfully!');
    
    if (leadId) {
      // Update lead status
      await supabase
        .from('leads')
        .update({ 
          status: 'booked',
          last_call_outcome: 'booked',
        })
        .eq('id', leadId);

      // Create appointment record
      const { error: appointmentError } = await supabase.from('appointments').insert({
        user_id: userId,
        lead_id: leadId,
        customer_name: customer_name,
        customer_phone: customer_phone,
        customer_email: customer_email,
        status: 'scheduled',
        cal_booking_id: calResult.id?.toString(),
        cal_booking_uid: calResult.uid,
        scheduled_time: calResult.startTime || start_time,
        notes: notes,
        created_at: new Date().toISOString(),
      });

      if (appointmentError) {
        console.error('⚠️ Failed to create appointment record:', appointmentError);
      } else {
        console.log('📝 Appointment record created in database');
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment booked successfully',
      booking: {
        id: calResult.id,
        uid: calResult.uid,
        startTime: calResult.startTime,
        endTime: calResult.endTime,
      },
    });

  } catch (error: any) {
    console.error('❌ Fatal error in book-appointment webhook:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

