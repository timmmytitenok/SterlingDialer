import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      userId,
      contactName,
      contactPhone,
      contactAge,
      contactState,
      duration,
      scheduledAt,
    } = await request.json();

    // Validate user matches
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate required fields (only name, phone, duration, and scheduledAt are required)
    if (!contactName || !contactPhone || !duration || !scheduledAt) {
      return NextResponse.json(
        { error: 'Missing required fields (name, phone, duration, scheduledAt)' },
        { status: 400 }
      );
    }

    // Validate duration
    if (![10, 20, 30].includes(duration)) {
      return NextResponse.json(
        { error: 'Duration must be 10, 20, or 30 minutes' },
        { status: 400 }
      );
    }

    // Validate scheduled time is in the future (or at least not in the past by more than an hour)
    const scheduledDate = new Date(scheduledAt);
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    if (scheduledDate < oneHourAgo) {
      return NextResponse.json(
        { error: 'Appointment time cannot be in the past' },
        { status: 400 }
      );
    }

    // Validate date is within allowed range (today + 4 days ahead = 5 days total)
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 4); // Today + 4 more days = 5 days total
    maxDate.setHours(23, 59, 59, 999); // End of the 5th day
    
    if (scheduledDate > maxDate) {
      return NextResponse.json(
        { error: 'Appointment must be within the next 5 days (today + 4 days ahead)' },
        { status: 400 }
      );
    }

    console.log('📅 Creating manual appointment:', {
      contactName,
      contactPhone,
      scheduledAt,
      duration,
    });

    // Create the appointment
    // Use prospect_* column names (as per schema-v6-appointments.sql)
    const appointmentData: any = {
      user_id: user.id,
      scheduled_at: scheduledAt,
      status: 'scheduled',
      is_sold: false,
      is_no_show: false,
      prospect_name: contactName,
      prospect_phone: contactPhone,
      created_at: new Date().toISOString(),
    };

    // Add optional fields if provided
    if (contactAge) {
      appointmentData.prospect_age = contactAge;
    }
    if (contactState) {
      appointmentData.prospect_state = contactState;
    }

    // Note: duration_minutes column doesn't exist in current schema
    // Duration is handled by the duration parameter but not stored

    const { data, error } = await supabase
      .from('appointments')
      .insert([appointmentData])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating appointment:', error);
      throw error;
    }

    console.log('✅ Appointment created successfully:', data.id);

    // Send webhook to n8n with new appointment
    try {
      console.log('📤 Sending new appointment to n8n webhook...');
      
      // Strip phone number to plain digits and ensure it starts with 1
      let cleanPhone = contactPhone?.replace(/\D/g, '') || '';
      // If only 10 digits, add the 1 prefix
      if (cleanPhone.length === 10) {
        cleanPhone = '1' + cleanPhone;
      }
      
      const webhookPayload: any = {
        appointmentId: data.id,
        status: 'scheduled',
        phoneNumber: cleanPhone,
        prospectName: contactName,
        scheduledAt: scheduledAt,
        userId: user.id,
        timestamp: new Date().toISOString(),
      };

      // Add optional fields if provided
      if (contactAge) {
        webhookPayload.prospectAge = contactAge;
      }
      if (contactState) {
        webhookPayload.prospectState = contactState;
      }

      const webhookResponse = await fetch('https://timmmytitenok.app.n8n.cloud/webhook/167c711b-4cf9-46e7-a7cb-c37a4ef6f9f0', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      });
      
      if (webhookResponse.ok) {
        console.log('✅ Webhook sent successfully to n8n');
      } else {
        console.warn('⚠️ Webhook failed but continuing:', webhookResponse.status);
      }
    } catch (webhookError: any) {
      console.error('⚠️ Webhook error (non-critical):', webhookError.message);
    }

    return NextResponse.json({
      success: true,
      appointment: data,
      message: 'Appointment created successfully',
    });
  } catch (error: any) {
    console.error('❌ Error creating appointment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create appointment' },
      { status: 500 }
    );
  }
}

