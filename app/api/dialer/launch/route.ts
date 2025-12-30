import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * POST /api/dialer/launch
 * Launches the AI dialer
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Service role client for bypassing RLS on ai_control_settings
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check prerequisites
    const { data: settings } = await supabase
      .from('dialer_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!settings || !settings.daily_budget_cents || settings.daily_budget_cents <= 0) {
      return NextResponse.json(
        { error: 'Please set a daily budget first' },
        { status: 400 }
      );
    }

    // Check call balance
    const { data: callBalance } = await supabase
      .from('call_balance')
      .select('balance, auto_refill_enabled')
      .eq('user_id', user.id)
      .single();

    // Only block launch if balance is completely depleted (< $1) AND no auto-refill
    // Auto-refill will kick in at $1 anyway
    const hasBalance = (callBalance?.auto_refill_enabled) || (callBalance?.balance || 0) >= 1;
    
    if (!hasBalance) {
      return NextResponse.json(
        { error: 'Insufficient call balance. Please add funds or enable auto-refill.' },
        { status: 400 }
      );
    }

    // Check for any leads (not just 'pending' status - could be 'new', 'ready', null, etc.)
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Also check specifically for leads that haven't been called yet
    const { count: uncalledLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .or('status.is.null,status.eq.pending,status.eq.new,status.eq.ready');

    const availableLeads = uncalledLeads || totalLeads || 0;

    if (availableLeads === 0) {
      return NextResponse.json(
        { error: 'No pending leads to call. Please upload leads first.' },
        { status: 400 }
      );
    }

    console.log(`✅ Found ${availableLeads} available leads to call`);

    // Create or update dialer session
    const { data: existingSession } = await supabase
      .from('dialer_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const sessionData = {
      user_id: user.id,
      status: 'running',
      started_at: new Date().toISOString(),
      override_active: false,
    };

    let session;
    if (existingSession) {
      const { data: updated } = await supabase
        .from('dialer_sessions')
        .update(sessionData)
        .eq('id', existingSession.id)
        .select()
        .single();
      session = updated;
    } else {
      const { data: created } = await supabase
        .from('dialer_sessions')
        .insert([sessionData])
        .select()
        .single();
      session = created;
    }

    console.log('🚀 AI Dialer launched for user:', user.id);

    // CRITICAL: Also update ai_control_settings to 'running' - this is what next-call checks!
    // Use admin client to bypass RLS
    console.log('🔧 Setting ai_control_settings.status = running...');
    
    const { data: existingSettings, error: fetchError } = await supabaseAdmin
      .from('ai_control_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    console.log('📋 Existing ai_control_settings:', { 
      found: !!existingSettings, 
      status: existingSettings?.status,
      fetchError 
    });
    
    // Get budget from dialer_settings to use for this session
    const budgetCents = settings?.daily_budget_cents || 1000; // Default $10
    
    // PRESERVE the bypass setting if it was already enabled
    const preserveBypass = existingSettings?.disable_calling_hours === true;
    
    const { error: aiSettingsError } = await supabaseAdmin
      .from('ai_control_settings')
      .upsert({
        user_id: user.id,
        status: 'running',
        updated_at: new Date().toISOString(),
        // CRITICAL: Set these fields or the AI will stop immediately!
        target_lead_count: 9999, // Very high so it doesn't stop by lead count
        daily_spend_limit: budgetCents / 100, // Use the budget from settings
        daily_call_limit: 9999, // Very high
        execution_mode: 'leads', // Required field
        queue_length: 0,
        last_call_status: 'starting',
        // Budget mode: set budget_limit_cents so AI knows to stop by budget, not lead count
        budget_limit_cents: budgetCents,
        // Session-based budget: record current spend so only NEW spend counts
        session_start_spend: existingSettings?.today_spend || 0,
        // PRESERVE the bypass restrictions setting!
        disable_calling_hours: preserveBypass,
      }, {
        onConflict: 'user_id'
      });
    
    console.log('📋 AI Settings upserted with:', {
      target_lead_count: 9999,
      daily_spend_limit: budgetCents / 100,
      budget_limit_cents: budgetCents,
      session_start_spend: existingSettings?.today_spend || 0,
      disable_calling_hours: preserveBypass,
    });
    
    if (aiSettingsError) {
      console.error('❌ Failed to update ai_control_settings:', aiSettingsError);
      // Don't fail the whole request, but log it
    } else {
      console.log('✅ ai_control_settings.status set to RUNNING');
      
      // Verify it was set
      const { data: verify } = await supabaseAdmin
        .from('ai_control_settings')
        .select('status')
        .eq('user_id', user.id)
        .single();
      console.log('✅ Verified ai_control_settings.status:', verify?.status);
    }

    // ========================================================================
    // TRIGGER THE FIRST CALL - This starts the call chain!
    // ========================================================================
    // Get the proper base URL - extract from request if env vars not set
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl && process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    }
    if (!baseUrl) {
      // Fallback: extract from the incoming request URL
      try {
        const requestUrl = new URL(request.url);
        baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
        console.log(`📍 Using request origin as baseUrl: ${baseUrl}`);
      } catch {
        baseUrl = 'http://localhost:3000';
      }
    }
    
    console.log('');
    console.log('🚀 ========== TRIGGERING FIRST CALL ==========');
    console.log('📞 Target URL:', `${baseUrl}/api/ai-control/next-call`);
    console.log('📞 User ID:', user.id);
    
    let firstCallResult: any = null;
    let firstCallError: string | null = null;
    
    try {
      const callResponse = await fetch(`${baseUrl}/api/ai-control/next-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      
      firstCallResult = await callResponse.json();
      console.log('📞 First call result:', JSON.stringify(firstCallResult, null, 2));
      
      if (firstCallResult.done) {
        // If done is true, the AI has already stopped - this is a problem!
        console.error('⚠️ First call returned done=true immediately!');
        console.error('   Reason:', firstCallResult.reason);
        console.error('   Message:', firstCallResult.message);
        firstCallError = `AI stopped: ${firstCallResult.reason} - ${firstCallResult.message}`;
      } else if (firstCallResult.success) {
        console.log('✅ First call triggered successfully!');
        console.log(`   Call ID: ${firstCallResult.callId}`);
        console.log(`   Lead: ${firstCallResult.leadName}`);
      } else if (firstCallResult.error) {
        console.error('❌ First call failed:', firstCallResult.error);
        firstCallError = firstCallResult.error;
      }
    } catch (callError: any) {
      console.error('❌ Error triggering first call:', callError.message);
      firstCallError = callError.message;
      // Don't fail completely - the polling will retry
    }
    console.log('🚀 ========================================');

    // Return detailed result so frontend knows what happened
    return NextResponse.json({
      success: true,
      message: firstCallError 
        ? `AI Dialer launched but issue occurred: ${firstCallError}`
        : 'AI Dialer launched successfully - call initiated!',
      session,
      firstCallResult, // Include full result for debugging
      firstCallError,
    });
  } catch (error: any) {
    console.error('Error launching dialer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to launch dialer' },
      { status: 500 }
    );
  }
}

