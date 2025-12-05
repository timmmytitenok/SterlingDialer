import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getTodayDateString } from '@/lib/timezone-helpers';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { appointmentId, userId, monthlyPayment } = await request.json();

    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!monthlyPayment || monthlyPayment <= 0) {
      return NextResponse.json({ error: 'Invalid monthly payment' }, { status: 400 });
    }

    // Get user's timezone from ai_control_settings
    const { data: aiSettings } = await supabase
      .from('ai_control_settings')
      .select('user_timezone')
      .eq('user_id', user.id)
      .single();
    
    const userTimezone = aiSettings?.user_timezone || 'America/New_York';

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

    // Use user's timezone to get today's date (not UTC!)
    const today = getTodayDateString(userTimezone);
    const annualPremium = monthlyPayment * 12;
    
    console.log('');
    console.log('💰💰💰 ========== MARKING APPOINTMENT AS SOLD ========== 💰💰💰');
    console.log(`🌍 User timezone: ${userTimezone}`);
    console.log(`📅 Today's date (user TZ): ${today}`);
    console.log(`💵 Monthly payment: $${monthlyPayment}`);
    console.log(`💵 Annual premium: $${annualPremium}`);
    console.log(`📋 Appointment ID: ${appointmentId}`);
    console.log(`👤 User ID: ${userId}`);

    // If appointment was previously sold with different amount, adjust revenue
    if (appointment.is_sold && appointment.monthly_payment) {
      const oldAnnualPremium = appointment.monthly_payment * 12;
      const soldDate = appointment.sold_at ? new Date(appointment.sold_at).toISOString().split('T')[0] : today;

      console.log(`🔄 Appointment was previously SOLD at $${oldAnnualPremium} - Adjusting to $${annualPremium}`);

      // Remove old revenue
      const { data: existingRevenue } = await supabase
        .from('revenue_tracking')
        .select('revenue')
        .eq('user_id', user.id)
        .eq('date', soldDate)
        .single();

      if (existingRevenue && existingRevenue.revenue >= oldAnnualPremium) {
        await supabase
          .from('revenue_tracking')
          .update({
            revenue: existingRevenue.revenue - oldAnnualPremium,
          })
          .eq('user_id', user.id)
          .eq('date', soldDate);

        console.log(`✅ Old revenue removed: $${oldAnnualPremium}`);
      }
    }

    // Mark as sold with payment info
    const { error } = await supabase
      .from('appointments')
      .update({
        status: 'sold',
        is_sold: true,
        is_no_show: false,
        monthly_payment: monthlyPayment,
        sold_at: new Date().toISOString(),
      })
      .eq('id', appointmentId)
      .eq('user_id', user.id);

    if (error) throw error;

    // Add new revenue for today - check if record exists first
    console.log(`🔍 Checking for existing revenue_tracking record for ${today}...`);
    const { data: existingToday, error: lookupError } = await supabase
      .from('revenue_tracking')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    if (lookupError) {
      console.error('❌ Error looking up revenue record:', lookupError);
    }
    console.log(`📊 Existing record found:`, existingToday);

    if (existingToday) {
      // Update existing record - ADD to current revenue
      const newRevenue = (existingToday.revenue || 0) + annualPremium;
      const { error: updateError } = await supabase
        .from('revenue_tracking')
        .update({ revenue: newRevenue })
        .eq('user_id', user.id)
        .eq('date', today);
      
      if (updateError) {
        console.error('❌ Failed to update revenue:', updateError);
      } else {
        console.log(`💰 Revenue UPDATED: $${existingToday.revenue || 0} + $${annualPremium} = $${newRevenue}`);
      }
    } else {
      // Create new record for today (only include columns that exist in the table!)
      const { error: insertError } = await supabase
        .from('revenue_tracking')
        .insert({
          user_id: user.id,
          date: today,
          revenue: annualPremium,
        });
      
      if (insertError) {
        console.error('❌ Failed to insert revenue:', insertError);
      } else {
        console.log(`💰 Revenue INSERTED: $${annualPremium} for new day`);
      }
    }

    console.log(`✅ Total revenue for sold appointment: $${annualPremium} (annual premium)`);
    
    // Verify the update worked
    const { data: verifyRecord } = await supabase
      .from('revenue_tracking')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();
    
    console.log(`🔍 VERIFICATION - Record after update:`, verifyRecord);
    console.log('💰💰💰 ========================================= 💰💰💰');
    console.log('');

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
          status: 'sold',
          phoneNumber: cleanPhone,
          prospectName: appointment.prospect_name,
          monthlyPayment: monthlyPayment,
          annualPremium: annualPremium,
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

    return NextResponse.json({
      success: true,
      message: 'Appointment marked as sold!',
      annualPremium: annualPremium,
    });
  } catch (error: any) {
    console.error('Error marking sold:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark as sold' },
      { status: 500 }
    );
  }
}

