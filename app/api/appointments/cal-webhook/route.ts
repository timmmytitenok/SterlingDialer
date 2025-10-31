import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('📅 Cal.ai webhook received at:', new Date().toISOString());
    
    const payload = await request.json();
    console.log('📦 Full Cal.ai Payload:', JSON.stringify(payload, null, 2));

    // Cal.com webhook structure
    const {
      triggerEvent,
      payload: calData,
    } = payload;

    console.log('🎯 Trigger Event:', triggerEvent);

    // Only process BOOKING_CREATED events
    if (triggerEvent !== 'BOOKING_CREATED') {
      console.log(`⏭️  Skipping event: ${triggerEvent}`);
      return NextResponse.json({ received: true, skipped: triggerEvent });
    }

    // Extract booking details from Cal.com payload
    const {
      uid,
      title,
      startTime,
      endTime,
      attendees,
      metadata,
      responses,
    } = calData || {};

    console.log('📋 Booking Details:');
    console.log('  - UID:', uid);
    console.log('  - Title:', title);
    console.log('  - Start Time:', startTime);
    console.log('  - Start Time Type:', typeof startTime);
    console.log('  - End:', endTime);
    console.log('  - Attendees:', attendees);
    console.log('  - Responses:', responses);
    console.log('  - Metadata:', metadata);
    console.log('📦 FULL PAYLOAD:', JSON.stringify(payload, null, 2));

    // Get attendee info (usually the first attendee is the booker)
    const attendee = attendees?.[0] || {};
    let attendeeName = attendee.name || 'Unknown';
    const attendeeEmail = attendee.email || '';
    const attendeePhone = responses?.phone || attendee.phone || '';
    
    // Extract age and state if you collect them in Cal.com booking form
    const attendeeAge = responses?.age ? parseInt(responses.age) : null;
    const attendeeState = responses?.state || null;

    // Clean up attendee name - remove Cal.ai event title prefix if present
    // Pattern: "Event Name - Customer Name" or "Event Name – Customer Name"
    const dashPattern = /[-–—]\s*(.+)$/;
    const nameMatch = attendeeName.match(dashPattern);
    if (nameMatch && nameMatch[1]) {
      attendeeName = nameMatch[1].trim();
      console.log(`🧹 Cleaned up name: "${attendee.name}" → "${attendeeName}"`);
    }

    console.log('👤 Attendee Info:');
    console.log('  - Name:', attendeeName);
    console.log('  - Email:', attendeeEmail);
    console.log('  - Phone:', attendeePhone);
    console.log('  - Age:', attendeeAge);
    console.log('  - State:', attendeeState);

    // Get user_id from environment or metadata
    const userId = process.env.CAL_AI_USER_ID || metadata?.userId;

    if (!userId) {
      console.error('❌ No user_id found! Set CAL_AI_USER_ID in .env.local or pass userId in metadata');
      return NextResponse.json(
        { 
          error: 'Missing user_id. Please set CAL_AI_USER_ID environment variable or include userId in Cal.com metadata',
          received: true 
        },
        { status: 400 }
      );
    }

    console.log('👤 Using User ID:', userId);

    // Validate startTime exists
    if (!startTime) {
      console.error('❌ No startTime found in payload!');
      return NextResponse.json(
        { 
          error: 'Missing startTime in Cal.ai payload',
          received: true,
          debug: { calData }
        },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Create appointment in database
    console.log('💾 Creating appointment in database...');
    
    // Store the exact time Cal.ai sends (ISO 8601 format with timezone)
    const scheduledTime = startTime;
    console.log('🕐 Scheduled time:', scheduledTime);
    console.log('🕐 Scheduled time (parsed):', new Date(scheduledTime).toISOString());
    
    const appointmentData = {
      user_id: userId,
      prospect_name: attendeeName,
      prospect_phone: attendeePhone,
      prospect_age: attendeeAge,
      prospect_state: attendeeState,
      scheduled_at: scheduledTime,
      status: 'scheduled',
      is_sold: false,
      is_no_show: false,
      // Don't save notes - keeps the UI clean
      created_at: new Date().toISOString(),
    };

    console.log('📝 Appointment Data:', appointmentData);

    const { data, error } = await supabase
      .from('appointments')
      .insert([appointmentData])
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }

    console.log('✅ Appointment created successfully!');
    console.log('✅ Appointment ID:', data.id);
    console.log('✅ Scheduled for:', startTime);

    return NextResponse.json({
      success: true,
      appointment: {
        id: data.id,
        name: attendeeName,
        scheduledAt: startTime,
      },
      message: 'Appointment booked successfully via Cal.ai'
    });

  } catch (error: any) {
    console.error('❌ Cal.ai webhook error:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to process webhook',
        received: true 
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    endpoint: '/api/appointments/cal-webhook',
    message: 'Cal.ai webhook endpoint is active. Send POST requests from Cal.com webhooks.',
  });
}

