import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse} from 'next/server';

/**
 * Start AI - New Call-by-Call System (No N8N!)
 * Initiates the first call and lets the webhook chain continue
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Use service role client to bypass RLS for ai_control_settings updates
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      userId, 
      dailyCallLimit,
      executionMode,      // 'leads' or 'budget'
      targetLeadCount,    // For leads mode
      targetTime,         // For time mode (legacy)
      budget              // For budget mode (in dollars)
    } = await request.json();

    // Live transfer is always enabled - no longer a user choice
    const liveTransfer = true;

    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('🚀 Starting AI with new call-by-call system:', { 
      liveTransfer: true,  // Always enabled
      dailyCallLimit,
      executionMode,
      targetLeadCount,
      targetTime,
      budget
    });

    // FIRST: Fetch existing settings to preserve important values
    const { data: existingSettings } = await supabaseAdmin
      .from('ai_control_settings')
      .select('disable_calling_hours, today_spend')
      .eq('user_id', user.id)
      .maybeSingle();
    
    console.log('📋 Existing settings:', {
      disable_calling_hours: existingSettings?.disable_calling_hours,
      today_spend: existingSettings?.today_spend,
    });
    
    // Prepare update data
    // NOTE: We store 'leads' in execution_mode to pass DB constraint, 
    // but use budget_limit_cents > 0 to detect actual budget mode
    const updateData: any = {
      status: 'running',
      queue_length: 0,
      calls_made_today: 0,
      daily_call_limit: dailyCallLimit || 999, // High limit for budget mode
      auto_transfer_calls: true,
      execution_mode: 'leads', // Always 'leads' to pass DB constraint
      last_call_status: 'starting',
      // CRITICAL: Preserve the bypass restrictions setting!
      disable_calling_hours: existingSettings?.disable_calling_hours === true,
    };
    
    console.log('📋 Will set disable_calling_hours to:', updateData.disable_calling_hours);

    // Store execution parameters based on mode
    if (executionMode === 'leads') {
      updateData.target_lead_count = targetLeadCount || dailyCallLimit;
      updateData.target_time_military = null;
      updateData.budget_limit_cents = null; // NULL = lead count mode
    } else if (executionMode === 'budget') {
      // Budget mode: keep dialing until actual spend hits the budget
      // We detect budget mode by checking if budget_limit_cents > 0
      updateData.target_lead_count = 9999; // Very high so it doesn't stop by lead count
      updateData.target_time_military = null;
      updateData.budget_limit_cents = Math.round((budget || 1) * 100); // Convert dollars to cents
      console.log(`💰 Budget mode: Will dial until $${budget} spent (${updateData.budget_limit_cents} cents)`);
      
      // SESSION-BASED BUDGET: Use the already-fetched existingSettings
      const currentTodaySpend = existingSettings?.today_spend || 0;
      updateData.session_start_spend = currentTodaySpend;
      console.log(`💰 Session start spend: $${currentTodaySpend.toFixed(2)} (only NEW spend counts toward $${budget} budget)`);
    } else if (executionMode === 'time') {
      updateData.target_time_military = targetTime;
      updateData.target_lead_count = null;
      updateData.budget_limit_cents = null;
    }

    // Update or create AI status to running (upsert ensures row exists)
    // Use ADMIN client to bypass RLS!
    const { error } = await supabaseAdmin
      .from('ai_control_settings')
      .upsert({
        ...updateData,
        user_id: user.id, // Include user_id for upsert
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id' // Upsert based on user_id
      });

    if (error) {
      console.error('❌ Failed to update ai_control_settings:', error);
      throw error;
    }

    // Verify the settings were saved correctly
    const { data: verifySettings } = await supabaseAdmin
      .from('ai_control_settings')
      .select('status, disable_calling_hours, target_lead_count, budget_limit_cents')
      .eq('user_id', user.id)
      .single();
    
    console.log('✅ AI status updated to running');
    console.log('✅ Verified settings:', verifySettings);

    // ========================================================================
    // TRIGGER THE FIRST CALL
    // ========================================================================
    // Get the proper base URL (works in both local and production)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    console.log('');
    console.log('🚀 ========== INITIATING FIRST CALL ==========');
    console.log('📞 Target URL:', `${baseUrl}/api/ai-control/next-call`);
    console.log('📞 User ID:', user.id);
    console.log('📞 Method: POST');
    console.log('');
    
    try {
      console.log('📞 Making fetch request...');
      const callResponse = await fetch(`${baseUrl}/api/ai-control/next-call`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });
      
      console.log('📞 Fetch completed! Status:', callResponse.status, callResponse.statusText);
      
      console.log('📞 Response headers:', Object.fromEntries(callResponse.headers.entries()));
      
      // Get response text first
      console.log('📞 Reading response body...');
      const responseText = await callResponse.text();
      console.log('📞 Response text (first 1000 chars):', responseText.substring(0, 1000));
      console.log('📞 Full response length:', responseText.length);
      
      // Try to parse as JSON
      let callResult: any;
      try {
        console.log('📞 Attempting to parse JSON...');
        callResult = JSON.parse(responseText);
        console.log('✅ Successfully parsed JSON!');
        console.log('📞 Parsed result:', JSON.stringify(callResult, null, 2));
      } catch (parseError) {
        console.error('❌ ========== JSON PARSE ERROR ==========');
        console.error('Error:', parseError);
        
        // If it's HTML, extract useful info
        if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
          console.error('❌ Response is HTML, not JSON!');
          console.error('HTML snippet:', responseText.substring(0, 500));
          
          // Still return error to user
          return NextResponse.json(
            { 
              error: 'Server returned HTML instead of JSON',
              details: 'The next-call endpoint failed. Check server logs for details.',
              htmlPreview: responseText.substring(0, 200)
            },
            { status: 500 }
          );
        }
        
        // If parse fails but status is OK, assume success
        if (callResponse.ok || callResponse.status === 200) {
          console.log('✅ Call initiated (parse failed but status OK)');
          return NextResponse.json({ 
            success: true, 
            message: 'AI started successfully',
            mode: executionMode,
          });
        }
        
        throw parseError;
      }
      
      // Check if call failed
      if (!callResponse.ok) {
        console.error('❌ Call endpoint returned error:', callResult);
        
        // Revert AI status to stopped (use admin client)
        await supabaseAdmin
          .from('ai_control_settings')
          .update({ status: 'stopped' })
          .eq('user_id', user.id);
        
        return NextResponse.json(
          { 
            error: callResult.error || 'Failed to start calling',
            details: callResult
          },
          { status: 500 }
        );
      }
      
      console.log('✅ ========== FIRST CALL INITIATED ==========');
      console.log('Result:', callResult);
      console.log('');
      
      // If the first call returned done: true, that's a problem!
      if (callResult?.done) {
        console.warn('⚠️ First call returned done=true immediately!');
        console.warn('   Reason:', callResult.reason);
        console.warn('   Exit Point:', callResult.exitPoint);
        console.warn('   Message:', callResult.message);
        
        return NextResponse.json({ 
          success: false, 
          message: `AI stopped immediately: ${callResult.message || callResult.reason}`,
          mode: executionMode,
          targetLeads: executionMode === 'leads' ? (targetLeadCount || dailyCallLimit) : null,
          firstCallResult: callResult,
        });
      }
      
      // If successful, return with call info
      if (callResult?.success) {
        return NextResponse.json({ 
          success: true, 
          message: 'AI started successfully - first call initiated!',
          mode: executionMode,
          targetLeads: executionMode === 'leads' ? (targetLeadCount || dailyCallLimit) : null,
          firstCallResult: callResult,
        });
      }
    } catch (error: any) {
      console.error('');
      console.error('❌ ========== EXCEPTION DURING CALL INITIATION ==========');
      console.error('Error Type:', error.constructor.name);
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
      console.error('');
      
      // Check if AI is actually running (call might have succeeded despite error)
      console.log('🔍 Checking if call actually succeeded...');
      const { data: statusCheck } = await supabaseAdmin
        .from('ai_control_settings')
        .select('status, current_call_id, last_call_status')
        .eq('user_id', user.id)
        .single();
      
      console.log('AI Status Check:', statusCheck);
      
      // If we have a current call ID, the call actually succeeded
      if (statusCheck?.current_call_id) {
        console.log('✅ Call actually succeeded! (current_call_id exists)');
        console.log('Call ID:', statusCheck.current_call_id);
        return NextResponse.json({ 
          success: true, 
          message: 'AI started successfully',
          mode: executionMode,
          callId: statusCheck.current_call_id
        });
      }
      
      console.log('❌ Call did NOT succeed - no current_call_id found');
      
      // Revert AI status to stopped (use admin client)
      await supabaseAdmin
        .from('ai_control_settings')
        .update({ status: 'stopped' })
        .eq('user_id', user.id);
      
      return NextResponse.json(
        { error: error.message || 'Failed to initiate first call' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'AI started successfully with call-by-call system',
      mode: executionMode,
      targetLeads: executionMode === 'leads' ? (targetLeadCount || dailyCallLimit) : null,
    });
  } catch (error: any) {
    console.error('Error starting AI:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start AI' },
      { status: 500 }
    );
  }
}

