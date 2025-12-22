import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/debug/check-config?userId=xxx
 * Debug endpoint to check if a user's config is properly set up for calling
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId query param required' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  // Check all the things needed for calling
  const checks: any = {
    userId,
    timestamp: new Date().toISOString(),
    environmentVariables: {
      RETELL_API_KEY: process.env.RETELL_API_KEY ? '✅ SET' : '❌ NOT SET',
      RETELL_AGENT_ID_FE: process.env.RETELL_AGENT_ID_FE || '❌ NOT SET',
      RETELL_AGENT_ID_VET: process.env.RETELL_AGENT_ID_VET || '❌ NOT SET',
      RETELL_AGENT_ID_MP: process.env.RETELL_AGENT_ID_MP || '❌ NOT SET',
    },
  };

  // Check user_retell_config
  const { data: retellConfig, error: configError } = await supabase
    .from('user_retell_config')
    .select('*')
    .eq('user_id', userId)
    .single();

  checks.retellConfig = {
    found: !!retellConfig,
    error: configError?.message || null,
    data: retellConfig ? {
      retell_agent_id: retellConfig.retell_agent_id || '❌ NOT SET',
      phone_number: retellConfig.phone_number || '❌ NOT SET',
      agent_name: retellConfig.agent_name || '(default: Sarah)',
      agent_pronoun: retellConfig.agent_pronoun || '(default: she/her)',
      cal_ai_api_key: retellConfig.cal_ai_api_key ? '✅ SET' : '❌ NOT SET',
      cal_event_id: retellConfig.cal_event_id || '❌ NOT SET',
    } : null,
  };

  // Check AI control settings
  const { data: aiSettings, error: aiError } = await supabase
    .from('ai_control_settings')
    .select('status, daily_spend_limit, today_spend, calls_made_today, target_lead_count')
    .eq('user_id', userId)
    .single();

  checks.aiSettings = {
    found: !!aiSettings,
    error: aiError?.message || null,
    data: aiSettings,
  };

  // Check leads
  const { data: leads, error: leadsError, count } = await supabase
    .from('leads')
    .select('id, name, status, lead_type, is_qualified', { count: 'exact' })
    .eq('user_id', userId)
    .eq('is_qualified', true)
    .in('status', ['new', 'callback_later', 'unclassified', 'no_answer', 'potential_appointment', 'needs_review'])
    .limit(5);

  checks.leads = {
    callableCount: count || 0,
    error: leadsError?.message || null,
    samples: leads?.map((l: any) => ({
      name: l.name,
      status: l.status,
      lead_type: l.lead_type,
      lead_type_label: l.lead_type === 2 ? 'Final Expense' : l.lead_type === 3 ? 'Veterans' : l.lead_type === 4 ? 'Mortgage' : 'Default/Unknown',
    })),
  };

  // Overall readiness
  const isReady = 
    checks.environmentVariables.RETELL_API_KEY === '✅ SET' &&
    (checks.environmentVariables.RETELL_AGENT_ID_FE !== '❌ NOT SET' || retellConfig?.retell_agent_id) &&
    retellConfig?.phone_number &&
    (count || 0) > 0;

  checks.ready = isReady;
  checks.issues = [];

  if (checks.environmentVariables.RETELL_API_KEY !== '✅ SET') {
    checks.issues.push('❌ RETELL_API_KEY not set in environment');
  }
  if (checks.environmentVariables.RETELL_AGENT_ID_FE === '❌ NOT SET' && !retellConfig?.retell_agent_id) {
    checks.issues.push('❌ No agent configured - set RETELL_AGENT_ID_FE in Vercel or add agent ID in admin');
  }
  if (!retellConfig?.phone_number) {
    checks.issues.push('❌ No phone number configured - go to Admin → User Management → set phone number');
  }
  if ((count || 0) === 0) {
    checks.issues.push('❌ No callable leads - upload leads or check lead statuses');
  }

  return NextResponse.json(checks, { status: 200 });
}

