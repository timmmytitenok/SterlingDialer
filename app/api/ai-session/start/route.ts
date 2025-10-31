import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, dailyLimit } = await request.json();

    // Verify the userId matches the authenticated user
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if there's already an active or paused session
    const { data: existingSession } = await supabase
      .from('ai_sessions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'paused'])
      .single();

    if (existingSession) {
      return NextResponse.json(
        { error: 'You already have an active session. Please stop it first.' },
        { status: 400 }
      );
    }

    // Create new AI session
    const { data: newSession, error } = await supabase
      .from('ai_sessions')
      .insert([
        {
          user_id: user.id,
          status: 'active',
          daily_call_limit: dailyLimit || 400,
          calls_made_today: 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Trigger N8N webhook to start AI calling
    const webhookUrl = process.env.N8N_WEBHOOK_START_DIAL;
    const useTestMode = process.env.N8N_TEST_MODE === 'true';
    let webhookResponseData = null;
    
    if (useTestMode) {
      console.log('🧪 TEST MODE: Using mock endpoint');
      const mockUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/test-n8n-mock`;
      console.log('🧪 Mock URL:', mockUrl);
      
      try {
        const mockResponse = await fetch(mockUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: newSession.id,
            dailyCallLimit: dailyLimit || 400,
            userId: user.id,
          }),
        });
        
        if (mockResponse.ok) {
          webhookResponseData = await mockResponse.json();
          console.log('🧪 Mock response:', webhookResponseData);
        }
      } catch (error) {
        console.error('🧪 Mock error:', error);
      }
    } else if (webhookUrl) {
      try {
        const webhookPayload = {
          userId: user.id,
          userEmail: user.email,
          sessionId: newSession.id,
          dailyCallLimit: dailyLimit || 400,
          callsMadeToday: 0,
          sessionStatus: 'active',
          startedAt: newSession.created_at,
          timestamp: new Date().toISOString(),
        };

        console.log('🚀 Sending to N8N webhook:', webhookPayload);
        console.log('📍 N8N URL:', webhookUrl);

        // N8N will process and respond back with completion data
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload),
        });

        console.log('📡 N8N Response Status:', webhookResponse.status);
        console.log('📡 N8N Response Headers:', Object.fromEntries(webhookResponse.headers.entries()));

        if (webhookResponse.ok) {
          const responseText = await webhookResponse.text();
          console.log('📄 N8N Raw Response:', responseText);
          
          try {
            webhookResponseData = JSON.parse(responseText);
            console.log('✅ N8N response parsed:', webhookResponseData);
          } catch (parseError) {
            console.error('❌ Failed to parse N8N response:', parseError);
            console.log('Response was:', responseText);
          }

          // Update session with N8N response data
          if (webhookResponseData && (webhookResponseData.status === 'finished' || webhookResponseData.status === 'completed')) {
            console.log('🔄 Updating session to stopped...');
            
            const updateData: any = {
              status: 'stopped',
              stopped_at: new Date().toISOString(),
            };

            if (webhookResponseData.callsMade !== undefined) {
              updateData.calls_made_today = webhookResponseData.callsMade;
              console.log('📊 Calls made:', webhookResponseData.callsMade);
            }

            const { data: updatedSession, error: updateError } = await supabase
              .from('ai_sessions')
              .update(updateData)
              .eq('id', newSession.id)
              .select()
              .single();

            if (updateError) {
              console.error('❌ Failed to update session:', updateError);
            } else {
              console.log('✅ Session updated successfully:', updatedSession);
            }
          } else {
            console.log('⚠️ N8N response does not indicate completion');
            console.log('Response status:', webhookResponseData?.status);
          }
        } else {
          const errorText = await webhookResponse.text();
          console.error('❌ N8N webhook failed with status:', webhookResponse.status);
          console.error('Error response:', errorText);
        }
      } catch (webhookError) {
        console.error('❌ Webhook error:', webhookError);
        // Don't fail the session creation if webhook fails
      }
    }

    return NextResponse.json({
      success: true,
      message: webhookResponseData 
        ? 'AI session completed successfully' 
        : 'AI session started successfully',
      session: newSession,
      n8nResponse: webhookResponseData,
    });
  } catch (error: any) {
    console.error('Error starting AI session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start AI session' },
      { status: 500 }
    );
  }
}

