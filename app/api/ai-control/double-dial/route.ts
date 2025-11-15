import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log('🔄🔄🔄 DOUBLE DIAL ENDPOINT HIT 🔄🔄🔄');
  
  try {
    const body = await request.json();
    const { userId, leadId, reason } = body;
    
    console.log('User:', userId);
    console.log('Lead:', leadId);
    
    if (!userId || !leadId) {
      return NextResponse.json({ error: 'Missing userId or leadId' }, { status: 400 });
    }
    
    // Import Supabase
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Get lead
    const { data: lead } = await supabase.from('leads').select('*').eq('id', leadId).single();
    if (!lead) {
      console.error('Lead not found:', leadId);
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }
    
    console.log('Lead:', lead.name, lead.phone);
    
    // Get Retell config
    const { data: config } = await supabase.from('user_retell_config').select('*').eq('user_id', userId).single();
    if (!config) {
      console.error('Config not found');
      return NextResponse.json({ error: 'Config not found' }, { status: 404 });
    }
    
    console.log('Config found - Agent:', config.retell_agent_id);
    
    // Call Retell
    const retellApiKey = process.env.RETELL_API_KEY;
    if (!retellApiKey) {
      console.error('No API key');
      return NextResponse.json({ error: 'No API key' }, { status: 500 });
    }
    
    const payload = {
      agent_id: config.retell_agent_id,
      to_number: lead.phone,
      from_number: config.phone_number,
      metadata: {
        user_id: userId,
        lead_id: leadId,
        lead_name: lead.name,
        lead_phone: lead.phone,
        was_double_dial: true,
      },
      retell_llm_dynamic_variables: {
        customer_name: lead.name,
        lead_name: lead.name,
        userId: userId,
        leadId: leadId,
        live_transfer: "true",
      },
    };
    
    console.log('Calling Retell...');
    const response = await fetch('https://api.retellai.com/v2/create-phone-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${retellApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Retell error:', error);
      return NextResponse.json({ error: 'Retell failed' }, { status: 500 });
    }
    
    const result = await response.json();
    console.log('✅✅✅ DOUBLE DIAL SUCCESSFUL! Call ID:', result.call_id);
    
    return NextResponse.json({ success: true, callId: result.call_id });
    
  } catch (error: any) {
    console.error('💥 EXCEPTION:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
