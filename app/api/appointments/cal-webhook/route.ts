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

    // ========================================================================
    // FIND USER BY MATCHING LEAD PHONE NUMBER (works for ALL users!)
    // ========================================================================
    let userId: string | null = null;
    let leadId: string | null = null;
    
    if (attendeePhone) {
      // Normalize phone number for matching (remove all non-digits)
      const normalizedPhone = attendeePhone.replace(/\D/g, '');
      const last10Digits = normalizedPhone.slice(-10);
      
      console.log('🔍 Looking for matching lead with phone:', attendeePhone);
      console.log('🔍 Normalized (last 10 digits):', last10Digits);
      
      // Search for lead across ALL users by phone number
      const { data: matchingLead, error: leadError } = await supabase
        .from('leads')
        .select('id, user_id, name, phone, status, total_calls_made, total_pickups, call_attempts_today')
        .or(`phone.ilike.%${last10Digits}%,phone.ilike.%${normalizedPhone}%`)
        .order('created_at', { ascending: false }) // Get most recent lead first
        .limit(1)
        .maybeSingle();
      
      if (leadError) {
        console.error('❌ Error searching for lead:', leadError);
      }
      
      if (matchingLead) {
        leadId = matchingLead.id;
        userId = matchingLead.user_id;
        console.log(`✅ Found matching lead!`);
        console.log(`   - Lead: ${matchingLead.name} (ID: ${leadId})`);
        console.log(`   - User ID: ${userId}`);
        console.log(`   - Current status: ${matchingLead.status}`);
        
        // ========================================================================
        // UPDATE LEAD STATUS + TRACKING FIELDS
        // This ensures stats are updated even if Retell webhook failed
        // ========================================================================
        const leadUpdate: any = {
          status: 'appointment_booked',
          last_call_outcome: 'appointment_booked',
          last_dial_at: new Date().toISOString(),
          last_called: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        // Only increment counters if lead wasn't already marked as appointment_booked
        // (prevents double-counting if Retell webhook already processed)
        if (matchingLead.status !== 'appointment_booked') {
          leadUpdate.total_calls_made = (matchingLead.total_calls_made || 0) + 1;
          leadUpdate.total_pickups = (matchingLead.total_pickups || 0) + 1;
          leadUpdate.call_attempts_today = (matchingLead.call_attempts_today || 0) + 1;
          console.log('📊 Incrementing lead counters (Retell webhook may have failed)');
        } else {
          console.log('📊 Lead already marked as appointment_booked - not incrementing counters');
        }
        
        const { error: updateError } = await supabase
          .from('leads')
          .update(leadUpdate)
          .eq('id', leadId);
        
        if (updateError) {
          console.error('❌ Failed to update lead status:', updateError);
        } else {
          console.log('✅ Lead status updated to appointment_booked');
        }
        
        // ========================================================================
        // UPDATE AI CONTROL SETTINGS (calls_made_today)
        // Only if Retell webhook didn't already process this call
        // ========================================================================
        if (matchingLead.status !== 'appointment_booked' && matchingLead.status !== 'potential_appointment') {
          console.log('📊 Updating ai_control_settings (backup for Retell webhook)...');
          
          const { data: aiSettings } = await supabase
            .from('ai_control_settings')
            .select('calls_made_today')
            .eq('user_id', userId)
            .single();
          
          if (aiSettings) {
            const newCallCount = (aiSettings.calls_made_today || 0) + 1;
            
            await supabase
              .from('ai_control_settings')
              .update({
                calls_made_today: newCallCount,
                last_call_status: 'appointment_booked',
              })
              .eq('user_id', userId);
            
            console.log(`✅ calls_made_today updated: ${aiSettings.calls_made_today || 0} → ${newCallCount}`);
          }
        }
      } else {
        console.log('⚠️ No matching lead found for phone:', attendeePhone);
      }
    }
    
    // Fallback to metadata or env var if no lead found
    if (!userId) {
      userId = metadata?.userId || process.env.CAL_AI_USER_ID || null;
      console.log('⚠️ Using fallback user_id:', userId);
    }
    
    // If still no user_id, we can't create the appointment
    if (!userId) {
      console.error('❌ Could not determine user_id!');
      console.error('   - No matching lead found by phone number');
      console.error('   - No userId in metadata');
      console.error('   - No CAL_AI_USER_ID in environment');
      return NextResponse.json(
        { 
          error: 'Could not determine user. No matching lead found for this phone number.',
          phone: attendeePhone,
          received: true 
        },
        { status: 400 }
      );
    }
    
    console.log('👤 Final User ID:', userId);

    // ========================================================================
    // UPDATE OR CREATE APPOINTMENT
    // Retell/N8N webhook creates the appointment, Cal.ai updates with exact time
    // ========================================================================
    
    const scheduledTime = startTime;
    console.log('🕐 Scheduled time from Cal.ai:', scheduledTime);
    console.log('🕐 Scheduled time (parsed):', new Date(scheduledTime).toISOString());
    console.log('🕐 Local time:', new Date(scheduledTime).toLocaleString());
    
    let appointmentId = null;
    let existingAppointment = null;
    
    // Strategy 1: Find existing appointment by lead_id
    if (leadId) {
      console.log('🔍 Strategy 1: Looking for appointment by lead_id:', leadId);
      
      const { data: apptByLead, error: findError } = await supabase
        .from('appointments')
        .select('id, scheduled_at, prospect_name, notes')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (findError) {
        console.error('⚠️ Error finding by lead_id:', findError);
      }
      
      if (apptByLead) {
        existingAppointment = apptByLead;
        console.log('✅ Found by lead_id:', apptByLead.id);
        console.log('   - Current scheduled_at:', apptByLead.scheduled_at);
        console.log('   - Notes:', apptByLead.notes);
      }
    }
    
    // Strategy 2: Find by phone number if lead_id didn't work
    if (!existingAppointment && attendeePhone) {
      console.log('🔍 Strategy 2: Looking for appointment by phone:', attendeePhone);
      
      const normalizedPhone = attendeePhone.replace(/\D/g, '');
      const last10Digits = normalizedPhone.slice(-10);
      
      const { data: apptByPhone, error: phoneError } = await supabase
        .from('appointments')
        .select('id, scheduled_at, prospect_name, notes')
        .eq('user_id', userId)
        .or(`prospect_phone.ilike.%${last10Digits}%,prospect_phone.ilike.%${normalizedPhone}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (phoneError) {
        console.error('⚠️ Error finding by phone:', phoneError);
      }
      
      if (apptByPhone) {
        existingAppointment = apptByPhone;
        console.log('✅ Found by phone:', apptByPhone.id);
        console.log('   - Current scheduled_at:', apptByPhone.scheduled_at);
      }
    }
    
    // Strategy 3: Find by name if phone didn't work
    if (!existingAppointment && attendeeName && attendeeName !== 'Unknown') {
      console.log('🔍 Strategy 3: Looking for appointment by name:', attendeeName);
      
      // Look for recent appointments with similar name
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      
      const { data: apptByName, error: nameError } = await supabase
        .from('appointments')
        .select('id, scheduled_at, prospect_name, notes')
        .eq('user_id', userId)
        .ilike('prospect_name', `%${attendeeName}%`)
        .gte('created_at', tenMinutesAgo)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (nameError) {
        console.error('⚠️ Error finding by name:', nameError);
      }
      
      if (apptByName) {
        existingAppointment = apptByName;
        console.log('✅ Found by name:', apptByName.id);
        console.log('   - Current scheduled_at:', apptByName.scheduled_at);
      }
    }
    
    // Strategy 4: Find most recent appointment created in last 5 minutes for this user (last resort)
    if (!existingAppointment) {
      console.log('🔍 Strategy 4: Looking for recent appointment (last 5 min)...');
      
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: recentAppt, error: recentError } = await supabase
        .from('appointments')
        .select('id, scheduled_at, prospect_name, notes')
        .eq('user_id', userId)
        .gte('created_at', fiveMinutesAgo)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (recentError) {
        console.error('⚠️ Error finding recent:', recentError);
      }
      
      if (recentAppt) {
        existingAppointment = recentAppt;
        console.log('✅ Found recent appointment:', recentAppt.id);
        console.log('   - Current scheduled_at:', recentAppt.scheduled_at);
      }
    }
    
    // UPDATE existing appointment or CREATE new one
    if (existingAppointment) {
      console.log('📅 UPDATING appointment with CORRECT scheduled time from Cal.ai!');
      console.log('   - Appointment ID:', existingAppointment.id);
      console.log('   - OLD time:', existingAppointment.scheduled_at);
      console.log('   - NEW time:', scheduledTime);
      
      // UPDATE the existing appointment with the real scheduled time
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          scheduled_at: scheduledTime,
          prospect_name: attendeeName,
          prospect_phone: attendeePhone,
          prospect_age: attendeeAge,
          prospect_state: attendeeState,
          lead_id: leadId || undefined, // Link to lead if we found one
          notes: null, // Clear the placeholder notes
        })
        .eq('id', existingAppointment.id);
      
      if (updateError) {
        console.error('❌ Failed to update appointment:', updateError);
      } else {
        console.log('✅ Appointment UPDATED with CORRECT time from Cal.ai!');
        console.log(`✅ Changed: ${existingAppointment.scheduled_at} → ${scheduledTime}`);
        appointmentId = existingAppointment.id;
      }
    }
    
    // If no existing appointment found, create new one
    if (!appointmentId) {
      console.log('💾 No existing appointment found - creating new one with Cal.ai time...');
      
      const appointmentData = {
        user_id: userId,
        lead_id: leadId,
        prospect_name: attendeeName,
        prospect_phone: attendeePhone,
        prospect_age: attendeeAge,
        prospect_state: attendeeState,
        scheduled_at: scheduledTime,
        status: 'scheduled',
        is_sold: false,
        is_no_show: false,
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
      
      appointmentId = data.id;
      console.log('✅ NEW Appointment created with Cal.ai time!');
    }

    console.log('✅ Appointment ID:', appointmentId);
    console.log('✅ Scheduled for:', startTime);

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointmentId,
        name: attendeeName,
        scheduledAt: startTime,
      },
      message: 'Appointment processed successfully via Cal.ai'
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

