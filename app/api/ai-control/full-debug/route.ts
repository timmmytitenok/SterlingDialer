import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check API key
    const retellApiKey = process.env.RETELL_API_KEY;
    const apiKeyInfo = retellApiKey 
      ? `SET - Starts with: ${retellApiKey.substring(0, 10)}... Length: ${retellApiKey.length}`
      : 'NOT SET';

    // Get user config
    const { data: config } = await supabase
      .from('user_retell_config')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // Get a lead
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_qualified', true)
      .in('status', ['new', 'callback_later', 'unclassified'])
      .limit(1)
      .maybeSingle();

    // NOTE: This is DEBUG ONLY - we don't actually make calls here anymore!
    let retellTestResult = '⚠️ Test calls disabled in debug mode';
    let retellTestStatus = 0;
    let retellTestResponse = 'Call creation disabled in debug endpoint to prevent accidental calls. Use AI Control Center to make real calls.';

    // Just show configuration info without making actual calls
    if (retellApiKey && config && lead) {
      retellTestResult = '✅ Configuration looks good (test call not made)';
      retellTestResponse = JSON.stringify({
        message: 'Configuration is valid',
        agent_id: config.retell_agent_id,
        phone_number: config.phone_number,
        sample_lead: lead.name,
        note: 'Actual calls are disabled in debug mode'
      }, null, 2);
    }

    return NextResponse.json({
      environment: {
        retell_api_key: apiKeyInfo,
        next_public_app_url: process.env.NEXT_PUBLIC_APP_URL || 'Not set',
      },
      user: {
        id: user.id,
        email: user.email,
      },
      retell_config: config || null,
      sample_lead: lead ? {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        status: lead.status,
      } : null,
      retell_test: {
        result: retellTestResult,
        status: retellTestStatus,
        response_preview: retellTestResponse.substring(0, 500),
        full_response: retellTestResponse,
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

