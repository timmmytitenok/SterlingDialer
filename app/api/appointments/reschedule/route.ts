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

    const { appointmentId, userId, newDateTime } = await request.json();

    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!newDateTime) {
      return NextResponse.json({ error: 'New date/time is required' }, { status: 400 });
    }

    // Get appointment data before updating
    const { data: appointment } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .eq('user_id', user.id)
      .single();

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Reschedule appointment
    const { error } = await supabase
      .from('appointments')
      .update({
        scheduled_at: newDateTime,
        status: 'rescheduled',
      })
      .eq('id', appointmentId)
      .eq('user_id', user.id);

    if (error) throw error;

    // Send webhook to n8n with reschedule update
    try {
      console.log('📤 Sending appointment reschedule to n8n webhook...');
      
      // Strip phone number to plain digits and ensure it starts with 1
      let cleanPhone = appointment.prospect_phone?.replace(/\D/g, '') || '';
      // If only 10 digits, add the 1 prefix
      if (cleanPhone.length === 10) {
        cleanPhone = '1' + cleanPhone;
      }
      
      const webhookResponse = await fetch('https://timmmytitenok.app.n8n.cloud/webhook/167c711b-4cf9-46e7-a7cb-c37a4ef6f9f0', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment.id,
          status: 'rescheduled',
          phoneNumber: cleanPhone,
          prospectName: appointment.prospect_name,
          newScheduledAt: newDateTime,
          userId: user.id,
          timestamp: new Date().toISOString(),
        }),
      });
      
      if (webhookResponse.ok) {
        console.log('✅ Webhook sent successfully to n8n');
      } else {
        console.warn('⚠️ Webhook failed but continuing:', webhookResponse.status);
      }
    } catch (webhookError: any) {
      console.error('⚠️ Webhook error (non-critical):', webhookError.message);
    }

    return NextResponse.json({ success: true, message: 'Appointment rescheduled' });
  } catch (error: any) {
    console.error('Error rescheduling appointment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reschedule appointment' },
      { status: 500 }
    );
  }
}

