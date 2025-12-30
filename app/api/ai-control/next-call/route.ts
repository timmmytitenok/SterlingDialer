import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getTodayDateString } from '@/lib/timezone-helpers';

// =====================================================
// BLOCKED LEAD VENDORS - Safety check before sending to Retell
// These names will be converted to empty string to avoid getting flagged
// =====================================================
const BLOCKED_VENDORS = [
  // Major Banks
  'chase', 'wells', 'fargo', 'wells fargo', 'citi', 'citibank',
  'bank of america', 'boa', 'capital one', 'discover',
  'us bank', 'pnc', 'td bank', 'truist', 'fifth third',
  'regions', 'keybank', 'huntington', 'ally', 'sofi',
  'navy federal', 'usaa',
  // Mortgage Companies
  'rocket', 'quicken', 'freedom mortgage', 'mr. cooper', 'mr cooper',
  'pennymac', 'newrez', 'loandepot', 'loan depot', 'fairway',
  'guild mortgage', 'caliber', 'flagstar', 'suntrust', 'phh',
  // Government Programs
  'fha', 'va', 'hud', 'usda', 'fannie mae', 'freddie mac',
  'social security', 'medicare', 'medicaid',
];

// Placeholder value when lead_vendor is blocked or missing
// Check this in Retell: {{#if (eq lead_vendor "123456")}} = data unavailable
const VENDOR_PLACEHOLDER = '123456';

// =====================================================
// PER-USER AGENT SELECTION
// Each user has their own Agent 1 and Agent 2 configured
// lead_type 2 or 3 = Agent 1, lead_type 4 = Agent 2
// =====================================================

interface UserAgentConfig {
  agent1_id: string | null;
  agent1_phone: string | null;
  agent1_name: string | null;
  agent2_id: string | null;
  agent2_phone: string | null;
  agent2_name: string | null;
}

/**
 * Select the correct per-user agent based on lead_type
 * lead_type 2 or 3 = Agent 1
 * lead_type 4 = Agent 2
 * If lead_type is null/1, defaults to Agent 1
 */
const selectAgentByLeadType = (
  leadType: number | null, 
  userConfig: UserAgentConfig
): { agentId: string | null; phoneNumber: string | null; agentName: string | null; agentSource: string } => {
  // lead_type: 1/null=Default (use Agent 1), 2=Agent 1, 3=Agent 1 (Veteran), 4=Agent 2
  
  // Handle null, undefined, or 1 (default) - use Agent 1
  const effectiveLeadType = leadType === null || leadType === undefined || leadType === 1 ? 2 : leadType;
  
  console.log(`🎯 Agent Selection - leadType: ${leadType} → effectiveLeadType: ${effectiveLeadType}`);
  
  // lead_type 2 or 3 = Agent 1
  if (effectiveLeadType === 2 || effectiveLeadType === 3) {
    if (userConfig.agent1_id && userConfig.agent1_phone) {
      console.log(`✅ Using Agent 1: ${userConfig.agent1_name || 'Unnamed'}`);
      return { 
        agentId: userConfig.agent1_id, 
        phoneNumber: userConfig.agent1_phone,
        agentName: userConfig.agent1_name,
        agentSource: 'USER_AGENT_1' 
      };
      }
    console.log('⚠️ Agent 1 not fully configured, checking Agent 2 as fallback...');
    // Fallback to Agent 2 if Agent 1 not configured
    if (userConfig.agent2_id && userConfig.agent2_phone) {
      console.log(`⚠️ Falling back to Agent 2: ${userConfig.agent2_name || 'Unnamed'}`);
      return { 
        agentId: userConfig.agent2_id, 
        phoneNumber: userConfig.agent2_phone,
        agentName: userConfig.agent2_name,
        agentSource: 'USER_AGENT_2_FALLBACK' 
      };
      }
  }
  
  // lead_type 4 = Agent 2
  if (effectiveLeadType === 4) {
    if (userConfig.agent2_id && userConfig.agent2_phone) {
      console.log(`✅ Using Agent 2: ${userConfig.agent2_name || 'Unnamed'}`);
      return { 
        agentId: userConfig.agent2_id, 
        phoneNumber: userConfig.agent2_phone,
        agentName: userConfig.agent2_name,
        agentSource: 'USER_AGENT_2' 
      };
      }
    console.log('⚠️ Agent 2 not fully configured, checking Agent 1 as fallback...');
    // Fallback to Agent 1 if Agent 2 not configured
    if (userConfig.agent1_id && userConfig.agent1_phone) {
      console.log(`⚠️ Falling back to Agent 1: ${userConfig.agent1_name || 'Unnamed'}`);
      return { 
        agentId: userConfig.agent1_id, 
        phoneNumber: userConfig.agent1_phone,
        agentName: userConfig.agent1_name,
        agentSource: 'USER_AGENT_1_FALLBACK' 
      };
    }
  }
  
  // No agents configured
  console.log('❌ No agents configured for this user!');
  return { agentId: null, phoneNumber: null, agentName: null, agentSource: 'NONE' };
};

/**
 * Sanitize lead_vendor - returns "123456" placeholder if blocked or null
 */
const sanitizeVendorForRetell = (vendor: string | null | undefined): string => {
  if (!vendor) return VENDOR_PLACEHOLDER;
  
  const vendorLower = vendor.toLowerCase().trim();
  
  for (const blocked of BLOCKED_VENDORS) {
    if (vendorLower === blocked || vendorLower.includes(blocked)) {
      console.log(`🚫 BLOCKED VENDOR (safety check): "${vendor}" - sending placeholder "${VENDOR_PLACEHOLDER}" to Retell`);
      return VENDOR_PLACEHOLDER;
    }
  }
  
  return vendor;
};

/**
 * Call-by-Call System - Get Next Lead and Make Call
 * This replaces the N8N batch processing system
 */
export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📞 NEXT-CALL ENDPOINT TRIGGERED');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`   User ID: ${userId}`);
    console.log(`   Time: ${new Date().toISOString()}`);

    // For server-to-server calls, use service role client to bypass RLS
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get AI settings - try to fetch first
    let { data: aiSettings, error: settingsError } = await supabase
      .from('ai_control_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    console.log('📋 AI settings query result:', { found: !!aiSettings, error: settingsError });

    // If no settings exist, create default settings
    if (!aiSettings && !settingsError) {
      console.log('⚠️ No AI settings found, creating default settings...');
      
      const { data: newSettings, error: createError } = await supabase
        .from('ai_control_settings')
        .upsert({
          user_id: userId,
          status: 'running',
          daily_spend_limit: 10.00,
          today_spend: 0.00,
          calls_made_today: 0,
          execution_mode: 'leads',
          queue_length: 0,
          auto_transfer_calls: true,
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Failed to create AI settings:', createError);
        return NextResponse.json({ 
          error: 'AI settings not found and could not be created',
          details: createError.message,
          userId 
        }, { status: 500 });
      }
      
      aiSettings = newSettings;
      console.log('✅ Created default AI settings');
    }

    // If there was an error fetching, return error
    if (settingsError) {
      console.error('❌ Error fetching AI settings:', userId, settingsError);
      return NextResponse.json({ 
        error: 'AI settings error',
        details: settingsError.message,
        userId 
      }, { status: 500 });
    }

    // Final check - should have settings now
    if (!aiSettings) {
      console.error('❌ AI settings still not found after creation attempt');
      return NextResponse.json({ 
        error: 'AI settings not found',
        details: 'Failed to initialize AI control settings',
        userId 
      }, { status: 500 });
    }

    console.log('✅ AI settings found, status:', aiSettings.status);

    // Check if AI is still running
    if (aiSettings.status !== 'running') {
      console.log('🛑 [EXIT-1] AI status is not running:', aiSettings.status);
      return NextResponse.json({ 
        done: true, 
        reason: 'AI stopped',
        message: `AI has been stopped (status: ${aiSettings.status})`,
        exitPoint: 'EXIT-1-status-not-running'
      });
    }
    console.log('✅ [CHECK-1] AI status is running - continuing...');

    // Get user's timezone from user_retell_config (set in admin user management)
    const { data: userTimezoneConfig } = await supabase
      .from('user_retell_config')
      .select('timezone')
      .eq('user_id', userId)
      .maybeSingle();

    // Priority: user_retell_config.timezone (admin setting) > ai_control_settings.user_timezone > default
    const userTimezone = userTimezoneConfig?.timezone || aiSettings.user_timezone || 'America/New_York';
    console.log(`🌍 User timezone: ${userTimezone} (from ${userTimezoneConfig?.timezone ? 'user_retell_config' : aiSettings.user_timezone ? 'ai_control_settings' : 'default'})`);
    const todayStr = getTodayDateString(userTimezone);

    // Reset daily counters if it's a new day
    let currentSpend = aiSettings.today_spend || 0;
    let callsMadeToday = aiSettings.calls_made_today || 0;

    if (aiSettings.spend_last_reset_date !== todayStr) {
      console.log('🔄 New day detected, resetting daily counters');
      currentSpend = 0;
      callsMadeToday = 0;

      await supabase
        .from('ai_control_settings')
        .update({
          today_spend: 0,
          calls_made_today: 0,
          spend_last_reset_date: todayStr,
        })
        .eq('user_id', userId);

      // Also reset all leads' daily attempt counters
      await supabase
        .from('leads')
        .update({ call_attempts_today: 0 })
        .eq('user_id', userId)
        .neq('last_attempt_date', todayStr);
    }

    // Check if daily spend limit reached
    const dailySpendLimit = aiSettings.daily_spend_limit || 10.00;
    if (currentSpend >= dailySpendLimit) {
      console.log('🛑 [EXIT-2] Daily spend limit reached');
      console.log(`   Current spend: $${currentSpend}, Limit: $${dailySpendLimit}`);
      
      // Stop AI
      await supabase
        .from('ai_control_settings')
        .update({ status: 'stopped' })
        .eq('user_id', userId);

      return NextResponse.json({
        done: true,
        reason: 'spend_limit_reached',
        message: `Daily spend limit of $${dailySpendLimit} reached`,
        totalSpent: currentSpend,
        exitPoint: 'EXIT-2-daily-spend-limit'
      });
    }
    console.log('✅ [CHECK-2] Within daily spend limit - continuing...');

    // Check stopping condition based on execution mode
    // Budget mode is detected by budget_limit_cents > 0
    const isBudgetMode = aiSettings.budget_limit_cents && aiSettings.budget_limit_cents > 0;
    
    if (isBudgetMode) {
      // BUDGET MODE: Stop when SESSION spend reaches budget limit
      // Session spend = today_spend - session_start_spend
      const budgetLimitCents = aiSettings.budget_limit_cents;
      const sessionStartSpend = aiSettings.session_start_spend || 0;
      const sessionSpend = (currentSpend || 0) - sessionStartSpend;
      const sessionSpendCents = Math.round(sessionSpend * 100); // Convert to cents
      
      console.log(`💰 Budget Mode (Session-Based):`);
      console.log(`   - Today's total spend: $${(currentSpend || 0).toFixed(2)}`);
      console.log(`   - Session started at: $${sessionStartSpend.toFixed(2)}`);
      console.log(`   - This session spent: $${sessionSpend.toFixed(2)}`);
      console.log(`   - Session budget: $${(budgetLimitCents / 100).toFixed(2)}`);
      console.log(`   - Progress: $${sessionSpend.toFixed(2)} / $${(budgetLimitCents / 100).toFixed(2)}`);
      
      if (sessionSpendCents >= budgetLimitCents) {
        console.log('🛑 [EXIT-3] Session budget limit reached!');
        console.log(`   Session spent: $${sessionSpend}, Budget: $${(budgetLimitCents / 100).toFixed(2)}`);
        
        await supabase
          .from('ai_control_settings')
          .update({ status: 'stopped' })
          .eq('user_id', userId);

        return NextResponse.json({
          done: true,
          reason: 'budget_reached',
          message: `Session budget of $${(budgetLimitCents / 100).toFixed(2)} reached`,
          sessionSpent: sessionSpend,
          budget: budgetLimitCents / 100,
          totalTodaySpend: currentSpend,
          exitPoint: 'EXIT-3-session-budget-reached'
        });
      } else {
        const remainingCents = budgetLimitCents - sessionSpendCents;
        console.log(`✅ Within session budget, continuing ($${(remainingCents / 100).toFixed(2)} remaining)`);
      }
    } else {
      // LEAD COUNT MODE: Stop when target leads reached
      const targetLeadCount = aiSettings.target_lead_count || 100;
      console.log(`📊 Lead Count Mode: ${callsMadeToday} / ${targetLeadCount} calls made`);
      if (callsMadeToday >= targetLeadCount) {
        console.log('🛑 [EXIT-4] Daily call limit reached');
        console.log(`   Calls made: ${callsMadeToday}, Target: ${targetLeadCount}`);
        
        await supabase
          .from('ai_control_settings')
          .update({ status: 'stopped' })
          .eq('user_id', userId);

        return NextResponse.json({
          done: true,
          reason: 'call_limit_reached',
          message: `Target of ${targetLeadCount} calls reached`,
          callsMade: callsMadeToday,
          exitPoint: 'EXIT-4-call-limit-reached'
        });
      } else {
        console.log(`✅ Within limit, continuing (${targetLeadCount - callsMadeToday} calls remaining)`);
      }
    }

    // Check calling hours IN USER'S TIMEZONE
    const now = new Date();
    
    // Get current time in user's timezone
    const userTimeString = now.toLocaleString('en-US', { 
      timeZone: userTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    const currentHour = parseInt(userTimeString.split(':')[0]);
    const currentMinute = parseInt(userTimeString.split(':')[1]);
    
    console.log(`🕐 Server time (GMT): ${now.toISOString()}`);
    console.log(`🕐 User timezone: ${userTimezone}`);
    console.log(`🕐 User's local time: ${userTimeString} (${currentHour}:${currentMinute.toString().padStart(2, '0')})`);
    console.log(`🕐 Current hour (24h): ${currentHour}`);
    
    // Simple calling hours check: 9am-6pm (every day)
    const withinCallingHours = currentHour >= 9 && currentHour < 18;
    
    // Check if calling hours are disabled (for testing)
    const callingHoursDisabled = aiSettings.disable_calling_hours === true;
    
    console.log(`⚙️ disable_calling_hours setting: ${aiSettings.disable_calling_hours} (type: ${typeof aiSettings.disable_calling_hours})`);
    console.log(`⚙️ callingHoursDisabled: ${callingHoursDisabled}`);
    
    if (callingHoursDisabled) {
      console.log('⚠️  CALLING HOURS CHECK DISABLED (testing mode)');
      console.log(`   Current time: ${userTimeString}`);
    } else if (!withinCallingHours) {
      // Normal mode - enforce calling hours
      console.log(`🛑 [EXIT-6] Outside calling hours! Current time: ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);
      console.log(`   Calling hours: 9am-6pm (${userTimezone})`);
      console.log(`   Current: ${currentHour < 9 ? 'Too early' : 'Too late'}`);
      
      await supabase
        .from('ai_control_settings')
        .update({ status: 'stopped', last_call_status: 'outside_calling_hours' })
        .eq('user_id', userId);
      
      return NextResponse.json({
        done: true,
        reason: 'outside_calling_hours',
        message: `Outside calling hours (9am-6pm in ${userTimezone}). Current time: ${userTimeString}`,
        userTime: userTimeString,
        timezone: userTimezone,
        exitPoint: 'EXIT-6-outside-calling-hours'
      });
    }
    console.log('✅ [CHECK-3] Calling hours OK - continuing...');
    
    console.log(`✅ ${callingHoursDisabled ? 'Calling hours disabled - continuing anyway' : 'Within calling hours (9am-6pm)'}`);

    // ========================================================================
    // SIMPLIFIED LEAD SELECTION - 20 ATTEMPT LIMIT
    // ========================================================================
    console.log('🔍 ========== LOOKING FOR LEADS ==========');
    console.log(`📞 User ID: ${userId}`);
    
    // Get active Google Sheets for this user
    const { data: activeSheets } = await supabase
      .from('user_google_sheets')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    const activeSheetIds = activeSheets?.map(s => s.id) || [];
    console.log(`📊 Active Google Sheets: ${activeSheetIds.length}`);
    
    if (activeSheetIds.length === 0) {
      console.log('❌ [EXIT-7] NO ACTIVE GOOGLE SHEETS!');
      await supabase
        .from('ai_control_settings')
        .update({ status: 'stopped', last_call_status: 'no_leads' })
        .eq('user_id', userId);
      
      return NextResponse.json({
        done: true,
        reason: 'no_active_sheets',
        message: 'No active Google Sheets found. Please upload and activate a sheet first.',
        exitPoint: 'EXIT-7-no-active-sheets'
      });
    }
    console.log('✅ [CHECK-4] Active sheets found:', activeSheetIds.length);
    
    // STEP 1: Count total callable leads
    // First, let's see ALL leads for this user to understand the data
    const { count: allLeadsCount, data: sampleLeadsForDebug } = await supabase
      .from('leads')
      .select('id, name, status, is_qualified, google_sheet_id', { count: 'exact' })
      .eq('user_id', userId)
      .limit(10);
    
    console.log(`📊 DEBUG - Total leads for user: ${allLeadsCount || 0}`);
    if (sampleLeadsForDebug && sampleLeadsForDebug.length > 0) {
      console.log('📊 DEBUG - Sample leads:');
      sampleLeadsForDebug.forEach((lead, i) => {
        console.log(`   ${i+1}. ${lead.name} | status: ${lead.status} | is_qualified: ${lead.is_qualified} | sheet_id: ${lead.google_sheet_id}`);
      });
    }
    
    // Check how many are in active sheets
    const { count: leadsInActiveSheets } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('google_sheet_id', activeSheetIds);
    console.log(`📊 DEBUG - Leads in ACTIVE sheets: ${leadsInActiveSheets || 0}`);
    
    // Check how many are qualified
    const { count: qualifiedLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_qualified', true)
      .in('google_sheet_id', activeSheetIds);
    console.log(`📊 DEBUG - Qualified leads in active sheets: ${qualifiedLeads || 0}`);
    
    // Check how many have callable status
    const { count: callableStatusLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('google_sheet_id', activeSheetIds)
      .in('status', ['new', 'callback_later', 'unclassified', 'no_answer', 'potential_appointment', 'needs_review', 'no_show']);
    console.log(`📊 DEBUG - Leads with callable STATUS in active sheets: ${callableStatusLeads || 0}`);
    
    // Now the actual count - qualified + right status + active sheet
    const { count: totalLeadsCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_qualified', true)
      .in('google_sheet_id', activeSheetIds)
      .in('status', ['new', 'callback_later', 'unclassified', 'no_answer', 'potential_appointment', 'needs_review', 'no_show']);
    
    console.log(`📊 FINAL - Callable leads (qualified + right status + active sheet): ${totalLeadsCount || 0}`);
    
    if (!totalLeadsCount || totalLeadsCount === 0) {
      console.log('❌ [EXIT-8] NO CALLABLE LEADS FOUND!');
      console.log('❌ DIAGNOSIS:');
      console.log(`   - Total leads: ${allLeadsCount || 0}`);
      console.log(`   - In active sheets: ${leadsInActiveSheets || 0}`);
      console.log(`   - Qualified: ${qualifiedLeads || 0}`);
      console.log(`   - With callable status: ${callableStatusLeads || 0}`);
      await supabase
        .from('ai_control_settings')
        .update({ status: 'stopped', last_call_status: 'no_leads' })
        .eq('user_id', userId);
      
      // Build helpful message based on diagnosis
      let diagnosisMsg = 'No callable leads found. ';
      if ((allLeadsCount || 0) === 0) {
        diagnosisMsg += 'You have no leads uploaded.';
      } else if ((leadsInActiveSheets || 0) === 0) {
        diagnosisMsg += 'Your leads are not in any ACTIVE sheets. Go to Lead Manager and toggle the sheet ON.';
      } else if ((qualifiedLeads || 0) === 0) {
        diagnosisMsg += 'All leads are marked as NOT QUALIFIED (is_qualified=false). Check your lead data.';
      } else if ((callableStatusLeads || 0) === 0) {
        diagnosisMsg += 'All leads have been called already (status is not new/callback_later/no_answer).';
      }
      
      return NextResponse.json({
        done: true,
        reason: 'no_leads',
        message: diagnosisMsg,
        exitPoint: 'EXIT-8-no-callable-leads',
        // Include debug data in response!
        debug: {
          totalLeads: allLeadsCount || 0,
          leadsInActiveSheets: leadsInActiveSheets || 0,
          qualifiedLeads: qualifiedLeads || 0,
          callableStatusLeads: callableStatusLeads || 0,
          activeSheetIds: activeSheetIds,
          sampleLeads: sampleLeadsForDebug?.slice(0, 5).map(l => ({
            name: l.name,
            status: l.status,
            is_qualified: l.is_qualified,
            google_sheet_id: l.google_sheet_id
          }))
        }
      });
    }
    console.log('✅ [CHECK-5] Callable leads found:', totalLeadsCount);
    
    // STEP 2: Get next callable lead
    // SIMPLIFIED LOGIC:
    // - Callable statuses: new, callback_later, unclassified, no_answer, potential_appointment, no_show
    // - Total attempts < 20 (not dead yet)
    // - Not called already today (respects call_attempts_today)
    // NOTE: potential_appointment = time discussed but Cal.ai webhook not confirmed yet
    // - From active sheets only
    
    console.log('🔍 Searching for next callable lead...');
    console.log(`   Today's date: ${todayStr}`);
    console.log(`   Criteria:`);
    console.log(`   - Status: new, callback_later, unclassified, no_answer, potential_appointment, no_show`);
    console.log(`   - Total attempts < 20`);
    console.log(`   - Not called today`);
    console.log(`   - From active sheets`);
    
    let nextLead = null;
    let leadError = null;
    
    try {
      let query = supabase
        .from('leads')
        .select('*')
        .eq('user_id', userId)
        .eq('is_qualified', true)
        .in('google_sheet_id', activeSheetIds)
        .in('status', ['new', 'callback_later', 'unclassified', 'no_answer', 'potential_appointment', 'needs_review', 'no_show']);
      
      // Exclude leads that hit 20 attempts (marked as dead)
      // Use total_calls_made if it exists, otherwise check status != 'dead_lead'
      query = query.neq('status', 'dead_lead');
      query = query.or('total_calls_made.is.null,total_calls_made.lt.20');
      
      // Exclude leads already called today
      // EXCEPTION: needs_review leads can be retried even if attempted today
      query = query.or(`call_attempts_today.is.null,call_attempts_today.eq.0,last_attempt_date.neq.${todayStr},status.eq.needs_review`);
      
      // Order by fewest attempts first (prioritize fresh leads)
      // Then by sheet_row_number to follow the same order as the Google Sheet
      // This ensures the AI calls leads from the top of the spreadsheet first
      query = query
        .order('total_calls_made', { ascending: true, nullsFirst: true })
        .order('sheet_row_number', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true })
        .limit(1);
      
      const result = await query.maybeSingle();
      nextLead = result.data;
      leadError = result.error;
      
      console.log('🔍 Query result:', {
        found: !!nextLead,
        error: leadError,
        leadId: nextLead?.id,
        leadName: nextLead?.name,
        leadStatus: nextLead?.status,
        leadPhone: nextLead?.phone,
        totalCallsMade: nextLead?.total_calls_made || 0,
        callAttemptsToday: nextLead?.call_attempts_today || 0,
        lastAttemptDate: nextLead?.last_attempt_date || 'never'
      });
      
      if (nextLead) {
        console.log(`✅ Found lead to call: ${nextLead.name}`);
        console.log(`   - Status: ${nextLead.status}`);
        console.log(`   - Total calls made: ${nextLead.total_calls_made || 0} / 20`);
        console.log(`   - Call attempts today: ${nextLead.call_attempts_today || 0}`);
        console.log(`   - Last attempt date: ${nextLead.last_attempt_date || 'never'}`);
        
        // CRITICAL: Log lead_type from database
        console.log(`   🎯 LEAD TYPE FROM DATABASE:`);
        console.log(`   - lead_type value: ${nextLead.lead_type}`);
        console.log(`   - lead_type type: ${typeof nextLead.lead_type}`);
        console.log(`   - lead_type exists in object: ${'lead_type' in nextLead}`);
        
        console.log(`   🏠 MORTGAGE PROTECTION FIELDS:`);
        console.log(`   - Lead Vendor column exists: ${'lead_vendor' in nextLead}`);
        console.log(`   - Lead Vendor value: "${nextLead.lead_vendor || '(EMPTY - NOT IN DATABASE!)'}"`);
        console.log(`   - Street Address column exists: ${'street_address' in nextLead}`);
        console.log(`   - Street Address value: "${nextLead.street_address || '(EMPTY - NOT IN DATABASE!)'}"`);
        
        // Show all keys in the lead for debugging
        console.log(`   - All lead fields: ${Object.keys(nextLead).join(', ')}`);
      }
    } catch (queryError: any) {
      console.error('❌ EXCEPTION in lead query:', queryError);
      leadError = queryError;
    }
    
    console.log('🔍 ========== LEAD SEARCH COMPLETE ==========');

    if (leadError) {
      console.error('Error fetching next lead:', leadError);
      return NextResponse.json({ error: 'Error fetching leads' }, { status: 500 });
    }

    if (!nextLead) {
      console.log('❌ ========== NO CALLABLE LEADS FOUND ==========');
      console.log(`📊 Total leads in DB: ${totalLeadsCount}`);
      
      // Get ALL leads to show their statuses
      const { data: allLeads } = await supabase
        .from('leads')
        .select('id, name, phone, status, is_qualified')
        .eq('user_id', userId)
        .limit(20);
      
      console.log('📋 All leads in database:');
      allLeads?.forEach((lead, idx) => {
        console.log(`   ${idx + 1}. ${lead.name} - Status: ${lead.status}, Qualified: ${lead.is_qualified ?? 'N/A'}`);
      });
      
      console.log('');
      console.log('🔧 POSSIBLE FIXES:');
      console.log('   1. Run this SQL in Supabase:');
      console.log('      UPDATE leads SET is_qualified = true WHERE user_id = \'' + userId + '\';');
      console.log('   2. Or change lead status to "new":');
      console.log('      UPDATE leads SET status = \'new\' WHERE user_id = \'' + userId + '\';');
      console.log('');
      
      // Stop AI
      await supabase
        .from('ai_control_settings')
        .update({ status: 'stopped', last_call_status: 'no_callable_leads' })
        .eq('user_id', userId);

      return NextResponse.json({
        done: true,
        reason: 'no_callable_leads',
        message: 'No callable leads found. Check if leads are qualified and have correct status.',
        totalLeads: totalLeadsCount,
        sampleLeads: allLeads?.slice(0, 5).map(l => ({
          name: l.name,
          status: l.status,
          qualified: l.is_qualified
        }))
      });
    }

    // ========================================================================
    // FORMAT PHONE NUMBER TO E.164 (+1 for US)
    // ========================================================================
    let phoneToCall = nextLead.phone.replace(/\D/g, ''); // Remove all non-digits
    
    console.log(`📞 Original phone: ${nextLead.phone}`);
    console.log(`   Cleaned: ${phoneToCall}`);
    
    // If 10 digits, add +1 for US
    if (phoneToCall.length === 10) {
      phoneToCall = `+1${phoneToCall}`;
      console.log(`   ✅ Auto-formatted to E.164: ${phoneToCall}`);
    } else if (phoneToCall.length === 11 && phoneToCall.startsWith('1')) {
      phoneToCall = `+${phoneToCall}`;
      console.log(`   ✅ Auto-formatted to E.164: ${phoneToCall}`);
    } else if (!phoneToCall.startsWith('+')) {
      phoneToCall = `+${phoneToCall}`;
      console.log(`   ⚠️ Added + prefix: ${phoneToCall}`);
    }

    console.log(`📞 Preparing to call lead ${nextLead.id} (${nextLead.name})`);
    console.log(`   - Phone to call: ${phoneToCall}`);
    console.log(`   - Current status: ${nextLead.status}`);
    console.log(`   - Total attempts: ${nextLead.total_calls_made || 0}/20`);
    console.log(`   - Calls made today: ${nextLead.call_attempts_today || 0}`);

    // ========================================================================
    // IMMEDIATELY MARK LEAD AS "IN PROGRESS" TO PREVENT DUPLICATE CALLS
    // ========================================================================
    // This prevents race conditions when multiple calls are triggered rapidly
    // We set last_attempt_date to "lock" the lead, but DON'T increment call_attempts_today yet
    // (the webhook will increment it after the call is complete)
    console.log(`🔒 Locking lead ${nextLead.id} to prevent duplicate calls...`);
    await supabase
      .from('leads')
      .update({
        last_attempt_date: todayStr, // Lock the lead for today
        status: 'calling_in_progress', // Mark as currently being called
      })
      .eq('id', nextLead.id);
    console.log(`✅ Lead ${nextLead.id} locked (last_attempt_date = ${todayStr}) - won't be selected again`);

    // Get user's Retell agent ID and phone number
    console.log('📋 Fetching Retell config for user:', userId);
    
    const { data: retellConfig, error: configError } = await supabase
      .from('user_retell_config')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('📋 Retell config result:', { 
      found: !!retellConfig, 
      error: configError,
      config: retellConfig ? {
        agent_1: {
          id: retellConfig.retell_agent_1_id ? 'SET' : null,
          phone: retellConfig.retell_agent_1_phone || null,
          name: retellConfig.retell_agent_1_name || 'Agent 1',
        },
        agent_2: {
          id: retellConfig.retell_agent_2_id ? 'SET' : null,
          phone: retellConfig.retell_agent_2_phone || null,
          name: retellConfig.retell_agent_2_name || 'Agent 2',
        },
        voice_name: retellConfig.agent_name,
        voice_pronoun: retellConfig.agent_pronoun || 'She',
        cal_event_id: retellConfig.cal_event_id,
      } : null
    });
    
    
    // Log script type for Mortgage Protection debugging
    const scriptType = retellConfig?.script_type || 'final_expense';
    console.log(`🏠 Script Type: ${scriptType}`);
    if (scriptType === 'mortgage_protection') {
      console.log(`   ⚠️ MORTGAGE PROTECTION MODE - lead_vendor and street_address SHOULD be sent!`);
    }

    if (configError || !retellConfig) {
      console.error('❌ No Retell config found for user');
      return NextResponse.json({ 
        error: 'Retell not configured. Go to Admin → Manage Users to set up your agent.' 
      }, { status: 400 });
    }

    // Build user agent config from retell settings
    const userAgentConfig: UserAgentConfig = {
      agent1_id: retellConfig.retell_agent_1_id || null,
      agent1_phone: retellConfig.retell_agent_1_phone || null,
      agent1_name: retellConfig.retell_agent_1_name || 'Agent 1',
      agent2_id: retellConfig.retell_agent_2_id || null,
      agent2_phone: retellConfig.retell_agent_2_phone || null,
      agent2_name: retellConfig.retell_agent_2_name || 'Agent 2',
    };
    
    console.log('📋 Per-User Agent Config:');
    console.log(`   Agent 1: ${userAgentConfig.agent1_name} - ID: ${userAgentConfig.agent1_id ? 'SET' : '❌'}, Phone: ${userAgentConfig.agent1_phone ? 'SET' : '❌'}`);
    console.log(`   Agent 2: ${userAgentConfig.agent2_name} - ID: ${userAgentConfig.agent2_id ? 'SET' : '❌'}, Phone: ${userAgentConfig.agent2_phone ? 'SET' : '❌'}`);

    // Select the correct agent based on lead_type (uses per-user agents)
    const { agentId: selectedAgentId, phoneNumber: selectedPhoneNumber, agentName, agentSource } = selectAgentByLeadType(
      nextLead.lead_type,
      userAgentConfig
    );
    
    console.log(`🤖 Agent Selection:`);
    console.log(`   Lead Type: ${nextLead.lead_type}`);
    console.log(`   Selected Agent: ${agentName || 'None'}`);
    console.log(`   Agent ID: ${selectedAgentId ? selectedAgentId.substring(0, 20) + '...' : '❌ NONE'}`);
    console.log(`   Phone: ${selectedPhoneNumber || '❌ NONE'}`);
    console.log(`   Agent Source: ${agentSource}`);
    
    // Validate we have an agent to use
    if (!selectedAgentId) {
      console.error('');
      console.error('🚨🚨🚨 NO AGENT CONFIGURED! 🚨🚨🚨');
      console.error('');
      console.error('To fix this:');
      console.error('   1. Go to Admin → User Management');
      console.error(`   2. Find user ${userId}`);
      console.error('   3. Configure Agent 1 or Agent 2 with ID and Phone Number');
      console.error('');
      return NextResponse.json({ 
        error: `No AI agent configured for this lead type. Ask your admin to configure Agent 1 or Agent 2 in User Management.` 
      }, { status: 400 });
    }

    if (!selectedPhoneNumber) {
      console.error('❌ Missing phone number for selected agent');
      return NextResponse.json({ 
        error: `No phone number configured for ${agentName || 'selected agent'}. Ask your admin to set up the phone number.` 
      }, { status: 400 });
    }
    
    // Get user-specific agent identity
    const userAgentName = retellConfig.agent_name || 'Sarah';
    const userAgentPronoun = retellConfig.agent_pronoun || 'She';
    const userCalEventId = retellConfig.cal_event_id || '';
    // userTimezone is already declared above from aiSettings
    const retellTimezone = retellConfig.timezone || userTimezone || 'America/New_York';
    const userConfirmationEmail = retellConfig.confirmation_email || '';
    
    // Calculate current time in user's timezone for Retell to use
    const currentMoment = new Date();
    const currentTimeFormatted = currentMoment.toLocaleString('en-US', {
      timeZone: retellTimezone,
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    // Also get just the time for shorter references
    const currentTimeShort = currentMoment.toLocaleString('en-US', {
      timeZone: retellTimezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    // Get timezone abbreviation (EST, PST, etc.)
    const tzAbbrev = currentMoment.toLocaleString('en-US', {
      timeZone: retellTimezone,
      timeZoneName: 'short',
    }).split(' ').pop() || '';
    
    console.log(`👤 User Agent Identity:`);
    console.log(`   Agent Name: ${userAgentName}`);
    console.log(`   Agent Pronoun: ${userAgentPronoun}`);
    console.log(`   Cal Event ID: ${userCalEventId || '(not set)'}`);
    console.log(`   Timezone: ${retellTimezone}`);
    console.log(`   Current Time: ${currentTimeFormatted} (${tzAbbrev})`);
    console.log(`   Confirmation Email: ${userConfirmationEmail || '(not set)'}`);

    // Make call via Retell API
    const retellApiKey = process.env.RETELL_API_KEY;
    
    console.log('🔑 Checking RETELL_API_KEY:', retellApiKey ? `SET (starts with: ${retellApiKey.substring(0, 10)}...)` : 'NOT SET');
    
    if (!retellApiKey) {
      console.error('❌ RETELL_API_KEY not set in environment');
      return NextResponse.json({ 
        error: 'Retell API key not configured. Add RETELL_API_KEY to .env.local and restart server.' 
      }, { status: 500 });
    }

    console.log(`📞 Making call with Agent: ${selectedAgentId} (${agentSource}), From: ${selectedPhoneNumber}, To: ${nextLead.phone}`);

    // Build dynamic variables for Retell
    // CRITICAL: Retell requires ALL values to be STRINGS! No numbers, no booleans, no nulls!
    
    // ========================================================================
    // MORTGAGE PROTECTION LOGIC: Both lead_vendor AND street_address must exist
    // If either is missing/blocked, send BOTH as "123456" placeholder
    // mp_opener: "1" = missing data (generic opener), "2" = both have data (full opener)
    // ========================================================================
    const sanitizedVendor = sanitizeVendorForRetell(nextLead.lead_vendor);
    const sanitizedAddress = nextLead.street_address?.trim() || '';
    
    // Check if vendor is the placeholder (blocked/missing) or address is empty
    const vendorIsPlaceholder = sanitizedVendor === VENDOR_PLACEHOLDER;
    const addressIsMissing = sanitizedAddress === '';
    
    // Both must have REAL data, or both get placeholder
    const hasBothMPFields = !vendorIsPlaceholder && !addressIsMissing;
    const finalLeadVendor = hasBothMPFields ? sanitizedVendor : VENDOR_PLACEHOLDER;
    const finalStreetAddress = hasBothMPFields ? sanitizedAddress : VENDOR_PLACEHOLDER;
    
    // mp_opener: "1" = missing data (use generic opener), "2" = both have data (use full opener)
    const mpOpener = hasBothMPFields ? '2' : '1';
    
    console.log(`🏠 MORTGAGE PROTECTION OPENER: mp_opener = "${mpOpener}"`);
    if (mpOpener === '1') {
      console.log(`   ⚠️ mp_opener=1: Missing data - use GENERIC opener`);
      console.log(`   - lead_vendor: "${sanitizedVendor}" → "${VENDOR_PLACEHOLDER}"`);
      console.log(`   - street_address: "${sanitizedAddress || '(empty)'}" → "${VENDOR_PLACEHOLDER}"`);
    } else {
      console.log(`   ✅ mp_opener=2: Both fields have data - use FULL opener`);
      console.log(`   - lead_vendor: "${finalLeadVendor}"`);
      console.log(`   - street_address: "${finalStreetAddress}"`);
    }
    
    // ========================================================================
    // SCHEDULING & AVAILABILITY - Fetch user's calendar/booking preferences
    // ========================================================================
    const blockedDates: string[] = retellConfig.blocked_dates || [];
    const bookingDays: number[] = retellConfig.booking_days || [1, 2, 3, 4, 5]; // Default Mon-Fri
    const minBookingDays: number = retellConfig.min_booking_days ?? 1; // Default next day
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Day names for formatting
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Format available days for Retell (e.g., "Monday, Tuesday, Wednesday, Thursday, Friday")
    const availableDaysFormatted = bookingDays
      .sort()
      .map(d => dayNames[d])
      .join(', ') || 'no days available';
    
    // Calculate earliest booking date based on min_booking_days
    const earliestBookingDate = new Date(today);
    earliestBookingDate.setDate(earliestBookingDate.getDate() + minBookingDays);
    const earliestBookingFormatted = earliestBookingDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Human-friendly buffer description
    const bufferDescriptions: Record<number, string> = {
      0: 'today or later',
      1: 'tomorrow or later',
      2: 'at least 2 days from now',
      3: 'at least 3 days from now',
      7: 'at least 1 week from now',
    };
    const bufferDescription = bufferDescriptions[minBookingDays] || `at least ${minBookingDays} days from now`;
    
    // Filter to only future blocked dates and format them nicely for Retell
    const futureBlockedDates = blockedDates
      .filter(dateStr => {
        const [y, m, d] = dateStr.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        return date >= today;
      })
      .sort()
      .slice(0, 30); // Limit to 30 dates to avoid token overflow
    
    // Format blocked dates for Retell - human readable
    const blockedDatesFormatted = futureBlockedDates
      .map(dateStr => {
        const [y, m, d] = dateStr.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      })
      .join(', ') || 'none';
    
    console.log(`📅 Scheduling Settings:`);
    console.log(`   Available days: ${availableDaysFormatted}`);
    console.log(`   Minimum booking buffer: ${minBookingDays} days (${bufferDescription})`);
    console.log(`   Earliest booking: ${earliestBookingFormatted}`);
    console.log(`   Blocked dates: ${futureBlockedDates.length} specific dates`);
    if (futureBlockedDates.length > 0) {
      console.log(`   Blocked: ${blockedDatesFormatted}`);
    }
    
    const dynamicVariables: Record<string, string> = {
      // User-specific agent identity (each user has their own name/pronoun)
      agent_name: userAgentName,
      agent_pronoun: userAgentPronoun,
      cal_event_id: userCalEventId,
      timezone: retellTimezone,
      timezone_abbrev: tzAbbrev,
      current_time: currentTimeFormatted,  // e.g., "Monday, December 22, 4:52 PM"
      current_time_short: currentTimeShort, // e.g., "4:52 PM"
      confirmation_email: userConfirmationEmail,
      
      // Lead information
      customer_name: String(nextLead.name || 'there'),
      lead_name: String(nextLead.name || ''),
      lead_phone: String(phoneToCall || ''),
      userId: String(userId),
      leadId: String(nextLead.id),
      live_transfer: "true",
      attempt_number: String((nextLead.call_attempts_today || 0) + 1),
      
      // Lead type for AI script selection - reference as {{lead_type}} in Retell
      // "1" = NULL/default (should NOT happen for properly imported leads)
      // "2" = Final Expense (non-veteran)
      // "3" = Final Expense (veteran)
      // "4" = Mortgage Protection
      // CRITICAL: Use actual lead_type from database, warn if missing
      lead_type: String(nextLead.lead_type ?? 1),
      
      // Mortgage Protection variables - BOTH must exist or BOTH get placeholder
      lead_vendor: finalLeadVendor,
      street_address: finalStreetAddress,
      // mp_opener: "1" = missing data (generic opener), "2" = both have data (full opener)
      mp_opener: mpOpener,
      
      // ========================================================================
      // SCHEDULING & AVAILABILITY VARIABLES
      // ========================================================================
      
      // Which days of the week can appointments be booked
      // Example: "Monday, Tuesday, Wednesday, Thursday, Friday"
      available_days: availableDaysFormatted,
      
      // Minimum booking buffer - how far in advance appointments must be
      // Value: "0", "1", "2", "3", "7" etc.
      min_booking_days: String(minBookingDays),
      
      // Human-friendly description of booking buffer
      // Example: "tomorrow or later", "at least 3 days from now"
      booking_buffer: bufferDescription,
      
      // Earliest date an appointment can be booked
      // Example: "Friday, December 27"
      earliest_booking: earliestBookingFormatted,
      
      // Specific blocked dates (vacations, holidays, etc.)
      // Example: "Tuesday January 7, Friday January 10, Monday January 20"
      // If no dates blocked, value is "none"
      blocked_dates: blockedDatesFormatted,
      blocked_dates_count: String(futureBlockedDates.length),
    };
    
    // VERIFY all values are strings
    console.log('🔍 Verifying all dynamic variables are strings:');
    for (const [key, value] of Object.entries(dynamicVariables)) {
      const valueType = typeof value;
      if (valueType !== 'string') {
        console.error(`❌ PROBLEM: ${key} is ${valueType}, not string! Value: ${value}`);
      } else {
        console.log(`   ✅ ${key}: "${value}" (string)`);
      }
    }
    
    // Log lead type and mortgage protection data for debugging
    console.log('');
    console.log('🎯 ====== LEAD TYPE DEBUG ======');
    console.log(`   Lead ID: ${nextLead.id}`);
    console.log(`   Lead Name: ${nextLead.name}`);
    console.log(`   Raw lead_type from DB: ${nextLead.lead_type} (type: ${typeof nextLead.lead_type})`);
    console.log(`   Sending to Retell as: ${dynamicVariables.lead_type} (type: ${typeof dynamicVariables.lead_type})`);
    const leadTypeLabels: Record<string, string> = { '1': 'NULL/Default', '2': 'Final Expense', '3': 'Final Expense (Veteran)', '4': 'Mortgage Protection' };
    console.log(`   Meaning: ${leadTypeLabels[String(dynamicVariables.lead_type)] || 'UNKNOWN'}`);
    
    // CRITICAL WARNING: If lead_type is 1 but we have MP fields, something is wrong!
    if (dynamicVariables.lead_type === '1' && (nextLead.lead_vendor || nextLead.street_address)) {
      console.error('❌❌❌ WARNING: lead_type is 1 but lead has vendor/address data!');
      console.error('   This lead may have been imported before lead_type was properly set.');
      console.error('   The lead in the database needs to be updated with lead_type = 4');
      console.error(`   Lead ID to fix: ${nextLead.id}`);
    }
    
    // Also warn if lead_type was null/undefined in database
    if (nextLead.lead_type === null || nextLead.lead_type === undefined) {
      console.error('❌ WARNING: lead_type is NULL in database! Defaulted to 1.');
      console.error(`   Lead ID: ${nextLead.id} needs lead_type set in database.`);
    }
    console.log('================================');
    console.log('');
    console.log('🏠 Mortgage Protection Data:');
    console.log(`   Lead Vendor: "${nextLead.lead_vendor || '(not set)'}"`);
    console.log(`   Street Address: "${nextLead.street_address || '(not set)'}"`);
    console.log(`   Sending to Retell: lead_vendor="${dynamicVariables.lead_vendor}", street_address="${dynamicVariables.street_address}"`);

    const callPayload = {
      agent_id: selectedAgentId,  // Uses global agent based on lead_type, or user's custom agent
      to_number: phoneToCall, // Use formatted phone!
      from_number: selectedPhoneNumber, // Uses FE or MP phone based on lead_type
      metadata: {
        user_id: userId,
        lead_id: nextLead.id,
        lead_name: nextLead.name,
        lead_phone: phoneToCall, // Use formatted phone!
        attempt_number: (nextLead.call_attempts_today || 0) + 1,
        // Lead type for AI script selection (1=NULL, 2=FE, 3=FE Veteran, 4=MP)
        lead_type: nextLead.lead_type ?? 1,
        // Include mortgage protection data in metadata too
        lead_vendor: finalLeadVendor || null,
        street_address: finalStreetAddress || null,
        // mp_opener: "1" = generic opener (missing data), "2" = full opener (both have data)
        mp_opener: mpOpener,
        // Agent selection metadata
        agent_source: agentSource,
        agent_name: userAgentName,
        agent_pronoun: userAgentPronoun,
        timezone: retellTimezone,
        confirmation_email: userConfirmationEmail,
      },
      retell_llm_dynamic_variables: dynamicVariables,
    };

    console.log('📞 Call payload:', JSON.stringify(callPayload, null, 2));
    console.log('');
    console.log('🚨 RETELL DYNAMIC VARIABLES BEING SENT:');
    console.log(`   lead_type = ${dynamicVariables.lead_type} (${typeof dynamicVariables.lead_type})`);
    console.log(`   lead_vendor = "${dynamicVariables.lead_vendor}"`);
    console.log(`   street_address = "${dynamicVariables.street_address}"`);
    console.log(`   mp_opener = "${dynamicVariables.mp_opener}" (1=generic opener, 2=full opener)`);
    console.log('');
    console.log('📞 Authorization header:', `Bearer ${retellApiKey.substring(0, 15)}...${retellApiKey.substring(retellApiKey.length - 5)}`);
    console.log('📞 API Endpoint:', 'https://api.retellai.com/v2/create-phone-call');

    // ========================================================================
    // FINAL SAFEGUARD: Re-check target JUST before making the call
    // This prevents race conditions where another call just completed
    // ========================================================================
    const { data: finalCheck } = await supabase
      .from('ai_control_settings')
      .select('calls_made_today, target_lead_count, today_spend, budget_limit_cents, session_start_spend, status')
      .eq('user_id', userId)
      .single();
    
    if (finalCheck?.status !== 'running') {
      console.log('🛑 AI was stopped by another process - aborting this call');
      // Unlock the lead since we're not calling
      await supabase
        .from('leads')
        .update({ status: 'new', last_attempt_date: null })
        .eq('id', nextLead.id);
      
      return NextResponse.json({
        done: true,
        reason: 'ai_stopped',
        message: 'AI was stopped before this call could be made',
      });
    }
    
    // Check budget mode by budget_limit_cents > 0
    const finalIsBudgetMode = finalCheck?.budget_limit_cents && finalCheck.budget_limit_cents > 0;
    
    if (finalIsBudgetMode) {
      // Session-based budget check
      const finalSessionStartSpend = finalCheck?.session_start_spend || 0;
      const finalTodaySpend = finalCheck?.today_spend || 0;
      const finalSessionSpend = finalTodaySpend - finalSessionStartSpend;
      const finalSessionSpendCents = Math.round(finalSessionSpend * 100);
      const finalBudgetCents = finalCheck.budget_limit_cents;
      
      console.log(`🔒 FINAL SAFEGUARD (Session Budget): $${finalSessionSpend.toFixed(2)} / $${(finalBudgetCents / 100).toFixed(2)} spent this session`);
      
      if (finalSessionSpendCents >= finalBudgetCents) {
        console.log(`🛑 Session budget already reached - NOT making this call!`);
        // Unlock the lead since we're not calling
        await supabase
          .from('leads')
          .update({ status: 'new', last_attempt_date: null })
          .eq('id', nextLead.id);
        
        // Stop AI
        await supabase
          .from('ai_control_settings')
          .update({ status: 'stopped', last_call_status: 'budget_reached' })
          .eq('user_id', userId);
        
        return NextResponse.json({
          done: true,
          reason: 'budget_already_reached',
          message: `Session budget of $${(finalBudgetCents / 100).toFixed(2)} was already reached`,
          sessionSpent: finalSessionSpend,
          totalTodaySpend: finalTodaySpend,
        });
      }
    } else {
      const finalCallCount = finalCheck?.calls_made_today || 0;
      const finalTarget = finalCheck?.target_lead_count || 100;
      
      console.log(`🔒 FINAL SAFEGUARD (Lead Mode): ${finalCallCount}/${finalTarget} calls made`);
      
      if (finalCallCount >= finalTarget) {
        console.log(`🛑 Target already reached (${finalCallCount}/${finalTarget}) - NOT making this call!`);
        // Unlock the lead since we're not calling
        await supabase
          .from('leads')
          .update({ status: 'new', last_attempt_date: null })
          .eq('id', nextLead.id);
        
        // Stop AI
        await supabase
          .from('ai_control_settings')
          .update({ status: 'stopped', last_call_status: 'target_reached' })
          .eq('user_id', userId);
        
        return NextResponse.json({
          done: true,
          reason: 'target_already_reached',
          message: `Target of ${finalTarget} calls was already reached`,
          callsMade: finalCallCount,
        });
      }
    }

    // Create call via Retell - using agent_id (not override_agent_id)
    const callResponse = await fetch('https://api.retellai.com/v2/create-phone-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${retellApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(callPayload),
    });

    console.log('📞 Retell API response status:', callResponse.status);
    console.log('📞 Retell API response headers:', Object.fromEntries(callResponse.headers.entries()));

    if (!callResponse.ok) {
      const errorText = await callResponse.text();
      console.error('❌ Retell API error response:', errorText.substring(0, 500));
      
      // Parse error
      let errorMessage = 'Failed to create call';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || JSON.stringify(errorJson);
      } catch {
          errorMessage = errorText.substring(0, 200);
        }
      
      console.error(`❌ Call failed for lead ${nextLead.id}: ${errorMessage}`);
      console.log('');
      
      // ========================================================================
      // CRITICAL: Increment counters and mark as DEAD after multiple failures
      // This prevents infinite retry loops on bad phone numbers!
      // ========================================================================
      const currentTotalCalls = nextLead.total_calls_made || 0;
      const newTotalCalls = currentTotalCalls + 1;
      const currentAttemptsToday = nextLead.call_attempts_today || 0;
      
      // Check if this lead has failed before (last_call_outcome starts with 'error:')
      const lastOutcome = nextLead.last_call_outcome || '';
      const hadPreviousError = lastOutcome.startsWith('error:');
      
      // Mark as DEAD if:
      // 1. This is the 3rd+ consecutive error (2 previous errors + this one)
      // 2. OR total attempts >= 5 with current error
      // 3. OR error indicates permanently bad phone (invalid number, disconnected, etc.)
      const isPermanentError = errorMessage.toLowerCase().includes('invalid') || 
                               errorMessage.toLowerCase().includes('not a valid') ||
                               errorMessage.toLowerCase().includes('disconnected') ||
                               errorMessage.toLowerCase().includes('not in service');
      const shouldMarkDead = isPermanentError || (hadPreviousError && newTotalCalls >= 3) || newTotalCalls >= 5;
      
      const newStatus = shouldMarkDead ? 'dead_lead' : 'no_answer';
      
      console.log(`🔧 Lead error handling:`);
      console.log(`   - Previous outcome: ${lastOutcome || '(none)'}`);
      console.log(`   - Had previous error: ${hadPreviousError}`);
      console.log(`   - Total attempts: ${currentTotalCalls} → ${newTotalCalls}`);
      console.log(`   - Is permanent error: ${isPermanentError}`);
      console.log(`   - New status: ${newStatus}`);
      
      await supabase
        .from('leads')
        .update({
          status: newStatus,
          total_calls_made: newTotalCalls,
          call_attempts_today: currentAttemptsToday + 1,
          last_attempt_date: todayStr,
          last_call_outcome: `error: ${errorMessage.substring(0, 100)}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', nextLead.id);
      
      if (shouldMarkDead) {
        console.log(`💀 Lead ${nextLead.name} marked as DEAD_LEAD after ${newTotalCalls} attempts - won't be called again!`);
      } else {
        console.log(`⚠️ Lead ${nextLead.name} marked as no_answer (attempt ${newTotalCalls}) - will retry tomorrow`);
      }
      console.log('⚠️ Call failed - lead marked, returning error');
      
      // Return error - DO NOT use continueDialing flag (it caused infinite loops!)
      // The normal webhook flow will handle triggering the next call
      return NextResponse.json({
        success: false,
        error: `Call failed: ${errorMessage}`,
        leadId: nextLead.id,
        leadName: nextLead.name,
        leadMarkedDead: shouldMarkDead,
      });
    }

    const callData = await callResponse.json();
    console.log('✅ Call created successfully:', callData.call_id);

    // Update lead with call timestamp (already marked as "called today" above)
    await supabase
      .from('leads')
      .update({
        last_called: new Date().toISOString(),
      })
      .eq('id', nextLead.id);

    // Update AI settings with current call info
    await supabase
      .from('ai_control_settings')
      .update({
        current_call_id: callData.call_id,
        current_lead_id: nextLead.id,
        last_call_status: 'calling',
      })
      .eq('user_id', userId);

    // Include lead_type in response so you can see it in browser console!
    const leadTypeSent = nextLead.lead_type || 1;
    console.log(`✅ ====== CALL SUCCESS ======`);
    console.log(`   Lead ID: ${nextLead.id}`);
    console.log(`   Lead Name: ${nextLead.name}`);
    console.log(`   🤖 Agent Used: ${selectedAgentId?.substring(0, 20)}... (${agentSource})`);
    console.log(`   👤 Agent Identity: ${userAgentName} (${userAgentPronoun})`);
    console.log(`   📅 Cal Event ID: ${userCalEventId || '(not set)'}`);
    console.log(`   🎯 lead_type SENT TO RETELL: ${leadTypeSent}`);
    console.log(`   (1=Default, 2=FE, 3=FE Vet, 4=MP)`);
    console.log(`================================`);
    
    return NextResponse.json({
      success: true,
      callId: callData.call_id,
      leadId: nextLead.id,
      leadName: nextLead.name,
      leadPhone: nextLead.phone,
      attemptNumber: (nextLead.call_attempts_today || 0) + 1,
      callsMadeToday: callsMadeToday + 1,
      currentSpend: currentSpend,
      spendLimit: dailySpendLimit,
      // Show lead_type in response so you can verify it's being sent!
      lead_type: leadTypeSent,
      lead_type_meaning: leadTypeLabels[String(leadTypeSent)] || 'UNKNOWN',
      // Show agent selection info
      agent_source: agentSource,
      agent_name: userAgentName,
      agent_pronoun: userAgentPronoun,
      timezone: retellTimezone,
    });
  } catch (error: any) {
    console.error('❌ Error in next-call:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process next call' },
      { status: 500 }
    );
  }
}

