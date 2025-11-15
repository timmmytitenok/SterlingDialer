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

    const body = await request.json();
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
    }

    console.log('📞 Initiating call for lead:', leadId);

    // Get lead details
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('user_id', user.id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Get user's Retell configuration
    const { data: retellConfig, error: configError } = await supabase
      .from('user_retell_config')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (configError) throw configError;

    if (!retellConfig || !retellConfig.retell_api_key) {
      return NextResponse.json({ 
        error: 'Retell AI not configured. Please add your Retell API key in settings.' 
      }, { status: 400 });
    }

    // Update lead status to calling
    await supabase
      .from('leads')
      .update({ 
        status: 'calling',
        call_scheduled: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId);

    // Prepare webhook URL for Retell callbacks
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/retell/webhook`;

    // Call Retell API to initiate phone call
    console.log('🚀 Calling Retell API...');
    
    const retellResponse = await fetch('https://api.retellai.com/v2/create-phone-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${retellConfig.retell_api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: retellConfig.retell_agent_id,
        to_number: lead.phone,
        from_number: null, // Use default from Retell
        metadata: {
          lead_id: leadId,
          user_id: user.id,
          lead_name: lead.name,
          lead_state: lead.state,
          lead_age: lead.age,
        },
        retell_llm_dynamic_variables: {
          customer_name: lead.name || 'there',
          customer_state: lead.state || '',
          customer_age: lead.age?.toString() || '',
        },
        // Webhook for call events
        webhook_url: webhookUrl,
      }),
    });

    if (!retellResponse.ok) {
      const errorText = await retellResponse.text();
      console.error('❌ Retell API error:', errorText);
      
      // Revert lead status
      await supabase
        .from('leads')
        .update({ 
          status: lead.status, // Revert to previous status
          call_scheduled: false
        })
        .eq('id', leadId);

      return NextResponse.json({ 
        error: `Retell API error: ${errorText}` 
      }, { status: retellResponse.status });
    }

    const retellData = await retellResponse.json();
    console.log('✅ Retell call initiated:', retellData);

    // Add to call queue
    await supabase
      .from('call_queue')
      .insert({
        user_id: user.id,
        lead_id: leadId,
        retell_call_id: retellData.call_id,
        status: 'in_progress',
        attempt_number: (lead.times_dialed || 0) + 1,
        started_at: new Date().toISOString(),
      });

    return NextResponse.json({ 
      success: true,
      message: 'Call initiated successfully',
      call_id: retellData.call_id,
      lead: {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
      }
    });

  } catch (error: any) {
    console.error('❌ Error initiating call:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate call' },
      { status: 500 }
    );
  }
}

