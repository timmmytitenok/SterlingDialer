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
    console.log('📥 Received:', JSON.stringify(body, null, 2));

    const {
      userId,
      leadId,
      customer_name,
      customer_phone,
      customer_email,
      preferred_time,
      notes,
      // Cal.ai specific fields
      start_time,
      end_time,
      timezone,
    } = body;

    if (!userId) {
      console.error('❌ Missing userId');
      return NextResponse.json({ 
        success: false, 
        error: 'userId is required' 
      }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Get user's Cal.ai configuration
    const { data: retellConfig, error: configError } = await supabase
      .from('user_retell_config')
      .select('cal_ai_api_key, cal_event_id, agent_name')
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

    console.log('✅ User config found:');
    console.log(`   Cal.ai API Key: ${retellConfig.cal_ai_api_key.substring(0, 15)}...`);
    console.log(`   Cal.ai Event ID: ${retellConfig.cal_event_id}`);
    console.log(`   Agent Name: ${retellConfig.agent_name || 'Not set'}`);

    // Build the Cal.com API request
    // Using Cal.com's booking API: https://cal.com/docs/enterprise-features/api/api-reference/bookings
    const calApiUrl = 'https://api.cal.com/v1/bookings';
    
    const bookingPayload: any = {
      eventTypeId: parseInt(retellConfig.cal_event_id),
      name: customer_name || 'Unknown',
      email: customer_email || `${customer_phone?.replace(/\D/g, '') || 'unknown'}@placeholder.com`,
      phone: customer_phone,
      notes: notes || `Booked via AI Agent${retellConfig.agent_name ? ` (${retellConfig.agent_name})` : ''}`,
      timeZone: timezone || 'America/New_York',
      language: 'en',
      metadata: {
        leadId: leadId,
        userId: userId,
        bookedBy: 'ai_agent',
        agentName: retellConfig.agent_name,
      },
    };

    // If specific times provided, use them
    if (start_time) {
      bookingPayload.start = start_time;
    }
    if (end_time) {
      bookingPayload.end = end_time;
    }

    console.log('📤 Calling Cal.com API...');
    console.log(`   URL: ${calApiUrl}`);
    console.log(`   Payload:`, JSON.stringify(bookingPayload, null, 2));

    const calResponse = await fetch(`${calApiUrl}?apiKey=${retellConfig.cal_ai_api_key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingPayload),
    });

    const calResult = await calResponse.json();
    console.log('📥 Cal.com response:', JSON.stringify(calResult, null, 2));

    if (!calResponse.ok) {
      console.error('❌ Cal.com API error:', calResult);
      
      // Still create a pending appointment in our database
      if (leadId) {
        await supabase.from('appointments').insert({
          user_id: userId,
          lead_id: leadId,
          customer_name: customer_name,
          customer_phone: customer_phone,
          customer_email: customer_email,
          status: 'pending_manual', // Needs manual scheduling
          notes: `AI tried to book but Cal.com failed: ${calResult.message || 'Unknown error'}. Preferred time: ${preferred_time || 'Not specified'}`,
          created_at: new Date().toISOString(),
        });
        console.log('📝 Created pending appointment record for manual follow-up');
      }

      return NextResponse.json({ 
        success: false, 
        error: calResult.message || 'Failed to book appointment',
        needs_manual_booking: true,
        preferred_time: preferred_time,
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

