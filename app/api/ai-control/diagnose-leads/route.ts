import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * DIAGNOSTIC ENDPOINT - Check why leads aren't being called
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 ========== DIAGNOSTIC CHECK ==========');
    console.log('User ID:', user.id);

    // For server-to-server, use service role
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const adminSupabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Check active Google Sheets
    const { data: activeSheets, error: sheetsError } = await adminSupabase
      .from('user_google_sheets')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    console.log('📊 Active Google Sheets:', activeSheets?.length || 0);
    if (sheetsError) console.error('Error fetching sheets:', sheetsError);

    const activeSheetIds = activeSheets?.map(s => s.id) || [];

    // 2. Count ALL leads
    const { count: totalLeads } = await adminSupabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    console.log('📊 Total leads:', totalLeads);

    // 3. Count leads in active sheets
    const { count: leadsInActiveSheets } = await adminSupabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('google_sheet_id', activeSheetIds.length > 0 ? activeSheetIds : ['none']);

    console.log('📊 Leads in active sheets:', leadsInActiveSheets);

    // 4. Count qualified leads
    const { count: qualifiedLeads } = await adminSupabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_qualified', true)
      .in('google_sheet_id', activeSheetIds.length > 0 ? activeSheetIds : ['none']);

    console.log('📊 Qualified leads in active sheets:', qualifiedLeads);

    // 5. Count callable leads (by status)
    const { count: callableLeads } = await adminSupabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_qualified', true)
      .in('google_sheet_id', activeSheetIds.length > 0 ? activeSheetIds : ['none'])
      .in('status', ['new', 'callback_later', 'unclassified', 'no_answer']);

    console.log('📊 Callable leads (right status):', callableLeads);

    // 6. Count leads under 20 attempts
    const { count: leadsUnder20 } = await adminSupabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_qualified', true)
      .in('google_sheet_id', activeSheetIds.length > 0 ? activeSheetIds : ['none'])
      .in('status', ['new', 'callback_later', 'unclassified', 'no_answer'])
      .or('total_calls_made.is.null,total_calls_made.lt.20');

    console.log('📊 Callable leads under 20 attempts:', leadsUnder20);

    // 7. Get sample leads
    const { data: sampleLeads } = await adminSupabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id)
      .limit(5);

    console.log('📋 Sample leads:', sampleLeads?.map(l => ({
      name: l.name,
      status: l.status,
      is_qualified: l.is_qualified,
      google_sheet_id: l.google_sheet_id,
      total_calls_made: l.total_calls_made || 0,
      call_attempts_today: l.call_attempts_today || 0,
    })));

    // 8. Check AI settings
    const { data: aiSettings } = await adminSupabase
      .from('ai_control_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    console.log('⚙️ AI Settings:', aiSettings ? {
      status: aiSettings.status,
      execution_mode: aiSettings.execution_mode,
      target_lead_count: aiSettings.target_lead_count,
      calls_made_today: aiSettings.calls_made_today,
    } : 'NOT FOUND');

    // Return diagnostic info
    return NextResponse.json({
      success: true,
      user_id: user.id,
      active_google_sheets: {
        count: activeSheets?.length || 0,
        sheets: activeSheets?.map(s => ({
          id: s.id,
          sheet_name: s.sheet_name,
          tab_name: s.tab_name,
        })),
      },
      leads: {
        total: totalLeads,
        in_active_sheets: leadsInActiveSheets,
        qualified: qualifiedLeads,
        callable_status: callableLeads,
        callable_under_20_attempts: leadsUnder20,
      },
      sample_leads: sampleLeads?.map(l => ({
        id: l.id,
        name: l.name,
        phone: l.phone,
        status: l.status,
        is_qualified: l.is_qualified,
        google_sheet_id: l.google_sheet_id,
        total_calls_made: l.total_calls_made || 0,
        call_attempts_today: l.call_attempts_today || 0,
        last_attempt_date: l.last_attempt_date,
      })),
      ai_settings: aiSettings ? {
        status: aiSettings.status,
        execution_mode: aiSettings.execution_mode,
        target_lead_count: aiSettings.target_lead_count,
        calls_made_today: aiSettings.calls_made_today,
        today_spend: aiSettings.today_spend,
      } : null,
      diagnosis: {
        problem: callableLeads === 0 ? 'NO_CALLABLE_LEADS' : 'CHECK_LOGS',
        reason: callableLeads === 0 
          ? activeSheetIds.length === 0 
            ? 'No active Google Sheets found'
            : qualifiedLeads === 0
            ? 'No qualified leads found (is_qualified = false)'
            : 'All leads have non-callable status or hit 20 attempts'
          : 'Leads exist - check server logs for actual error',
      },
    });
  } catch (error: any) {
    console.error('❌ Diagnostic error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

