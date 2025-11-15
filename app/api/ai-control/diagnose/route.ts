import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Diagnostic endpoint - checks everything needed for AI to work
 */
export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    checks: {},
    errors: [],
    warnings: [],
  };

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      diagnostics.errors.push('Not authenticated');
      return NextResponse.json(diagnostics, { status: 401 });
    }

    diagnostics.user_id = user.id;
    diagnostics.user_email = user.email;

    // Check 1: Retell API Key
    const retellApiKey = process.env.RETELL_API_KEY;
    diagnostics.checks.retell_api_key = {
      exists: !!retellApiKey,
      length: retellApiKey?.length || 0,
      preview: retellApiKey ? `${retellApiKey.substring(0, 10)}...` : null,
    };
    if (!retellApiKey) {
      diagnostics.errors.push('RETELL_API_KEY not set in environment');
    }

    // Check 2: User Retell Config
    const { data: retellConfig, error: configError } = await supabase
      .from('user_retell_config')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    diagnostics.checks.user_retell_config = {
      exists: !!retellConfig,
      has_agent_id: !!retellConfig?.retell_agent_id,
      has_phone_number: !!retellConfig?.phone_number,
      agent_id: retellConfig?.retell_agent_id || null,
      phone_number: retellConfig?.phone_number || null,
      is_active: retellConfig?.is_active || false,
    };
    if (!retellConfig) {
      diagnostics.errors.push('User Retell config not found - go to Admin → Manage Users');
    } else if (!retellConfig.retell_agent_id) {
      diagnostics.errors.push('Retell Agent ID not configured');
    } else if (!retellConfig.phone_number) {
      diagnostics.errors.push('Outbound phone number not configured');
    }

    // Check 3: Callable Leads
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, name, phone, status, is_qualified, call_attempts_today')
      .eq('user_id', user.id)
      .eq('is_qualified', true)
      .in('status', ['new', 'callback_later', 'unclassified'])
      .limit(5);

    diagnostics.checks.callable_leads = {
      count: leads?.length || 0,
      sample: leads?.slice(0, 3).map(l => ({
        id: l.id,
        name: l.name,
        phone: l.phone,
        status: l.status,
        attempts_today: l.call_attempts_today || 0,
      })) || [],
    };
    if (!leads || leads.length === 0) {
      diagnostics.warnings.push('No callable leads found - import leads from Google Sheets');
    }

    // Check 4: AI Control Settings
    const { data: aiSettings } = await supabase
      .from('ai_control_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    diagnostics.checks.ai_control_settings = {
      exists: !!aiSettings,
      status: aiSettings?.status || null,
      daily_spend_limit: aiSettings?.daily_spend_limit || null,
      today_spend: aiSettings?.today_spend || null,
      calls_made_today: aiSettings?.calls_made_today || null,
    };

    // Check 5: Call Balance
    const { data: balance } = await supabase
      .from('call_balance')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    diagnostics.checks.call_balance = {
      exists: !!balance,
      amount: balance?.balance || 0,
    };
    if (!balance || balance.balance <= 0) {
      diagnostics.warnings.push('Low or zero call balance');
    }

    // Check 6: Test Retell API Connection
    if (retellApiKey && retellConfig?.retell_agent_id) {
      try {
        // Try getting agent details (correct endpoint)
        const testResponse = await fetch(`https://api.retellai.com/get-agent/${retellConfig.retell_agent_id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${retellApiKey}`,
          },
        });

        diagnostics.checks.retell_api_connection = {
          status: testResponse.status,
          ok: testResponse.ok,
          status_text: testResponse.statusText,
        };

        if (!testResponse.ok) {
          const errorText = await testResponse.text();
          diagnostics.errors.push(`Retell API test failed (${testResponse.status}): ${errorText.substring(0, 200)}`);
        } else {
          const agentData = await testResponse.json();
          diagnostics.checks.retell_api_connection.agent_found = true;
          diagnostics.checks.retell_api_connection.agent_name = agentData.agent_name || 'Unknown';
        }
      } catch (apiError: any) {
        diagnostics.errors.push(`Retell API connection error: ${apiError.message}`);
        diagnostics.checks.retell_api_connection = {
          error: apiError.message,
        };
      }
    }

    // Summary
    diagnostics.summary = {
      total_checks: Object.keys(diagnostics.checks).length,
      errors: diagnostics.errors.length,
      warnings: diagnostics.warnings.length,
      ready_to_call: diagnostics.errors.length === 0,
    };

    return NextResponse.json(diagnostics);
  } catch (error: any) {
    diagnostics.errors.push(`Exception: ${error.message}`);
    diagnostics.exception = {
      message: error.message,
      stack: error.stack,
    };
    return NextResponse.json(diagnostics, { status: 500 });
  }
}

