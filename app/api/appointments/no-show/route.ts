import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getTodayDateString } from '@/lib/timezone-helpers';

export async function POST(request: Request) {
  console.log('');
  console.log('🔴🔴🔴 ========== NO-SHOW API CALLED ========== 🔴🔴🔴');
  console.log('');
  
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { appointmentId, userId } = await request.json();
    console.log('📋 Request data:', { appointmentId, userId });

    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get current appointment data
    const { data: appointment, error: aptError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .eq('user_id', user.id)
      .single();

    if (aptError || !appointment) {
      console.error('❌ Appointment not found:', aptError);
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    console.log('✅ Appointment found:', {
      id: appointment.id,
      lead_id: appointment.lead_id,
      prospect_name: appointment.prospect_name,
      prospect_phone: appointment.prospect_phone,
    });

    // If appointment was previously sold, remove the revenue
    if (appointment.is_sold && appointment.monthly_payment) {
      const annualPremium = appointment.monthly_payment * 12;
      const soldDate = appointment.sold_at ? new Date(appointment.sold_at).toISOString().split('T')[0] : getTodayDateString('America/New_York');

      console.log(`🔄 Removing revenue: $${annualPremium} from ${soldDate}`);

      const { data: existingRevenue } = await supabase
        .from('revenue_tracking')
        .select('revenue')
        .eq('user_id', user.id)
        .eq('date', soldDate)
        .single();

      if (existingRevenue && existingRevenue.revenue >= annualPremium) {
        await supabase
          .from('revenue_tracking')
          .update({ revenue: existingRevenue.revenue - annualPremium })
          .eq('user_id', user.id)
          .eq('date', soldDate);
        console.log(`✅ Revenue adjusted`);
      }
    }

    // Mark appointment as no-show
    const { error: updateAptError } = await supabase
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

    if (updateAptError) {
      console.error('❌ Failed to update appointment:', updateAptError);
      throw updateAptError;
    }
    console.log('✅ Appointment marked as no-show');

    // ========================================================================
    // UPDATE LEAD STATUS - SIMPLIFIED DIRECT APPROACH
    // ========================================================================
    let leadUpdated = false;
    let foundLeadId: string | null = null;
    let updateDebug: any = {};

    // Create service role client DIRECTLY with explicit credentials
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    console.log('');
    console.log('🔐 Service Role Setup:');
    console.log(`   URL: ${supabaseUrl ? 'SET' : 'MISSING!'}`);
    console.log(`   Key: ${serviceRoleKey ? `SET (${serviceRoleKey.substring(0, 20)}...)` : 'MISSING!'}`);
    
    if (!serviceRoleKey || !supabaseUrl) {
      console.error('❌ Missing Supabase credentials!');
      return NextResponse.json({ 
        success: true, 
        message: 'Marked as no-show (lead update skipped - missing credentials)',
        leadUpdated: false,
        leadId: null,
      });
    }

    // Create fresh service role client
    const adminSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Determine which lead to update
    if (appointment.lead_id) {
      console.log(`📋 Using appointment.lead_id: ${appointment.lead_id}`);
      foundLeadId = appointment.lead_id;
    } else if (appointment.prospect_phone) {
      // Find lead by phone
      const phoneDigits = appointment.prospect_phone.replace(/\D/g, '');
      const last10 = phoneDigits.slice(-10);
      console.log(`📋 Searching for lead by phone: ${last10}`);
      
      const { data: leadByPhone, error: phoneErr } = await adminSupabase
        .from('leads')
        .select('id, name')
        .eq('user_id', user.id)
        .or(`phone.ilike.%${last10}%`)
        .limit(1)
        .maybeSingle();
      
      if (phoneErr) {
        console.error('❌ Phone search error:', phoneErr);
      } else if (leadByPhone) {
        console.log(`✅ Found lead by phone: ${leadByPhone.name} (${leadByPhone.id})`);
        foundLeadId = leadByPhone.id;
      } else {
        console.log('⚠️ No lead found by phone');
      }
    }

    // UPDATE THE LEAD
    if (foundLeadId) {
      console.log('');
      console.log(`🔄 UPDATING LEAD: ${foundLeadId}`);
      
      // Step 1: Check lead exists BEFORE update
      const { data: beforeLead, error: beforeErr } = await adminSupabase
        .from('leads')
        .select('id, name, status, user_id')
        .eq('id', foundLeadId)
        .single();
      
      updateDebug.beforeLead = beforeLead;
      updateDebug.beforeErr = beforeErr?.message || null;
      
      if (beforeErr) {
        console.error('❌ Cannot find lead before update:', beforeErr);
      } else {
        console.log(`   Before: ${beforeLead.name} (status: ${beforeLead.status}, user: ${beforeLead.user_id})`);
      }
      
      // Step 2: Perform the update
      const { data: updateResult, error: updateError } = await adminSupabase
        .from('leads')
        .update({ status: 'no_show' })
        .eq('id', foundLeadId)
        .select();
      
      updateDebug.updateResult = updateResult;
      updateDebug.updateError = updateError?.message || null;
      
      console.log(`   Update result:`, updateResult);
      console.log(`   Update error:`, updateError);
      
      if (updateError) {
        console.error('❌ Update failed:', updateError);
      } else {
        // Step 3: Verify the update
        const { data: afterLead, error: afterErr } = await adminSupabase
          .from('leads')
          .select('id, name, status')
          .eq('id', foundLeadId)
          .single();
        
        updateDebug.afterLead = afterLead;
        updateDebug.afterErr = afterErr?.message || null;
        
        if (afterErr) {
          console.error('❌ Cannot verify lead after update:', afterErr);
        } else {
          console.log(`   After: ${afterLead.name} (status: ${afterLead.status})`);
          
          if (afterLead.status === 'no_show') {
            console.log('✅✅✅ LEAD STATUS UPDATED SUCCESSFULLY! ✅✅✅');
            leadUpdated = true;
          } else {
            console.error(`❌ STATUS DID NOT CHANGE! Still: ${afterLead.status}`);
          }
        }
      }
    } else {
      console.log('⚠️ No lead_id to update');
      updateDebug.reason = 'No lead_id found';
    }

    console.log('');
    console.log('📊 FINAL RESULT:');
    console.log(`   Lead Updated: ${leadUpdated}`);
    console.log(`   Lead ID: ${foundLeadId}`);
    console.log('');

    // Send webhook to n8n
    try {
      let cleanPhone = appointment.prospect_phone?.replace(/\D/g, '') || '';
      if (cleanPhone.length === 10) cleanPhone = '1' + cleanPhone;
      
      await fetch('https://timmmytitenok.app.n8n.cloud/webhook/167c711b-4cf9-46e7-a7cb-c37a4ef6f9f0', {
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
    } catch (e) {
      // Ignore webhook errors
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Marked as no-show',
      leadUpdated: leadUpdated,
      leadId: foundLeadId,
      debugInfo: {
        appointmentId: appointment.id,
        appointmentLeadId: appointment.lead_id || null,
        prospectName: appointment.prospect_name || null,
        prospectPhone: appointment.prospect_phone || null,
      },
      updateDebug: updateDebug,
    });
  } catch (error: any) {
    console.error('❌ Error marking no-show:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark as no-show' },
      { status: 500 }
    );
  }
}
