import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if RETELL_API_KEY is set
    const retell_api_key_set = !!process.env.RETELL_API_KEY;

    // Check user's Retell config
    const { data: config } = await supabase
      .from('user_retell_config')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const user_has_config = !!config;
    const config_details = config ? {
      has_agent_id: !!config.retell_agent_id,
      has_phone_number: !!config.phone_number,
      agent_id: config.retell_agent_id,
      phone_number: config.phone_number,
    } : undefined;

    // Count callable leads
    const { data: leads } = await supabase
      .from('leads')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_qualified', true)
      .in('status', ['new', 'callback_later', 'unclassified'])
      .lt('call_attempts_today', 2);

    const callable_leads_count = leads?.length || 0;

    return NextResponse.json({
      retell_api_key_set,
      user_has_config,
      config_details,
      callable_leads_count,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

