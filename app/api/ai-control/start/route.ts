import { createClient } from '@/lib/supabase/server';
import { NextResponse} from 'next/server';

/**
 * Start AI - New Call-by-Call System (No N8N!)
 * Initiates the first call and lets the webhook chain continue
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      userId, 
      dailyCallLimit,
      executionMode,      // 'leads' or 'time'
      targetLeadCount,    // For leads mode
      targetTime          // For time mode
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
      targetTime
    });

    // Prepare update data
    const updateData: any = {
      status: 'running',
      queue_length: 0,
      calls_made_today: 0,
      daily_call_limit: dailyCallLimit,
      auto_transfer_calls: true,
      execution_mode: executionMode || 'leads',
      last_call_status: 'starting',
    };

    // Store execution parameters based on mode
    if (executionMode === 'leads') {
      updateData.target_lead_count = targetLeadCount || dailyCallLimit;
      updateData.target_time_military = null;
    } else if (executionMode === 'time') {
      updateData.target_time_military = targetTime;
      updateData.target_lead_count = null;
    }

    // Update AI status to running
    const { error } = await supabase
      .from('ai_control_settings')
      .update(updateData)
      .eq('user_id', user.id);

    if (error) throw error;

    console.log('✅ AI status updated to running');

    // ========================================================================
    // TRIGGER THE FIRST CALL
    // ========================================================================
    const baseUrl = 'http://localhost:3000';
    
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
        
        // Revert AI status to stopped
        await supabase
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
    } catch (error: any) {
      console.error('');
      console.error('❌ ========== EXCEPTION DURING CALL INITIATION ==========');
      console.error('Error Type:', error.constructor.name);
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
      console.error('');
      
      // Check if AI is actually running (call might have succeeded despite error)
      console.log('🔍 Checking if call actually succeeded...');
      const { data: statusCheck } = await supabase
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
      
      // Revert AI status to stopped
      await supabase
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

