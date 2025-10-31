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

    const { appointmentId, userId } = await request.json();

    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get current appointment data to check if it was previously sold
    const { data: appointment } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .eq('user_id', user.id)
      .single();

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // If appointment was previously sold, remove the revenue
    if (appointment.is_sold && appointment.monthly_payment) {
      const annualPremium = appointment.monthly_payment * 12;
      const soldDate = appointment.sold_at ? new Date(appointment.sold_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

      console.log(`🔄 Appointment was previously SOLD - Removing $${annualPremium} revenue from ${soldDate}`);

      // Get existing revenue for that day
      const { data: existingRevenue } = await supabase
        .from('revenue_tracking')
        .select('revenue')
        .eq('user_id', user.id)
        .eq('date', soldDate)
        .single();

      if (existingRevenue && existingRevenue.revenue >= annualPremium) {
        // Subtract the revenue
        await supabase
          .from('revenue_tracking')
          .update({
            revenue: existingRevenue.revenue - annualPremium,
          })
          .eq('user_id', user.id)
          .eq('date', soldDate);

        console.log(`✅ Revenue adjusted: Removed $${annualPremium}`);
      }
    }

    // Mark as no-show (and clear sold status)
    const { error } = await supabase
      .from('appointments')
      .update({
        status: 'no_show',
        is_no_show: true,
        is_sold: false,
        monthly_payment: null,
        sold_at: null,
      })
      .eq('id', appointmentId)
      .eq('user_id', user.id);

    if (error) throw error;

    console.log(`✅ Appointment marked as no-show (revenue removed if previously sold)`);

    // Send webhook to n8n with status update
    try {
      console.log('📤 Sending appointment status to n8n webhook...');
      
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
          status: 'no_show',
          phoneNumber: cleanPhone,
          prospectName: appointment.prospect_name,
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
      // Don't fail the whole operation if webhook fails
    }

    return NextResponse.json({ success: true, message: 'Marked as no-show' });
  } catch (error: any) {
    console.error('Error marking no-show:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark as no-show' },
      { status: 500 }
    );
  }
}

