import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if in admin mode (logged in via master password)
    const adminMode = await isAdminMode();
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const {
      userId, // The user to create appointment FOR
      contactName,
      contactPhone,
      contactAge,
      contactState,
      duration,
      scheduledAt,
    } = await request.json();

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId - specify which user this appointment is for' },
        { status: 400 }
      );
    }

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

    console.log('📅 [ADMIN] Creating appointment for user:', {
      targetUserId: userId,
      adminUserId: user.id,
      contactName,
      contactPhone,
      scheduledAt,
      duration,
    });

    // Create the appointment for the target user
    const appointmentData: any = {
      user_id: userId, // Use the target user's ID
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

    const { data, error } = await supabase
      .from('appointments')
      .insert([appointmentData])
      .select()
      .single();

    if (error) {
      console.error('❌ [ADMIN] Error creating appointment:', error);
      throw error;
    }

    console.log('✅ [ADMIN] Appointment created successfully:', data.id);

    // Send webhook to n8n with new appointment (if needed)
    try {
      console.log('📤 Sending new appointment to n8n webhook...');
      
      // Strip phone number to plain digits and ensure it starts with 1
      let cleanPhone = contactPhone?.replace(/\D/g, '') || '';
      if (cleanPhone.length === 10) {
        cleanPhone = '1' + cleanPhone;
      }

      const webhookPayload = {
        event: 'appointment_created',
        appointment_id: data.id,
        user_id: userId,
        created_by_admin: true,
        admin_id: user.id,
        prospect: {
          name: contactName,
          phone: cleanPhone,
          age: contactAge || null,
          state: contactState || null,
        },
        scheduled_at: scheduledAt,
        duration_minutes: duration,
        status: 'scheduled',
      };

      // Fire and forget - don't wait for webhook response
      fetch('https://n8n.sterlingaisolutions.com/webhook/new-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      }).catch(err => console.error('Webhook error (non-blocking):', err));
      
    } catch (webhookError) {
      console.error('❌ Webhook error (non-blocking):', webhookError);
      // Don't fail the request if webhook fails
    }

    return NextResponse.json({
      success: true,
      appointment: data,
      message: 'Appointment created successfully',
    });

  } catch (error: any) {
    console.error('❌ [ADMIN] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create appointment' },
      { status: 500 }
    );
  }
}

