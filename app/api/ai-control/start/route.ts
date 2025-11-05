import { createClient } from '@/lib/supabase/server';
import { NextResponse} from 'next/server';

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
      targetTime,         // For time mode
      adminTestPhone      // For admin testing with real leads
    } = await request.json();

    // Live transfer is always enabled - no longer a user choice
    const liveTransfer = true;

    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('🚀 Starting AI with settings:', { 
      liveTransfer: true,  // Always enabled
      dailyCallLimit,
      executionMode,
      targetLeadCount,
      targetTime
    });

    // Prepare update data
    const updateData: any = {
      status: 'running',
      queue_length: 0,  // Start at 0, will increment as calls are made
      daily_call_limit: dailyCallLimit,  // Save for next launch
      auto_transfer_calls: true,  // Always enabled - included in package
      execution_mode: executionMode || 'leads',
    };

    // Store execution parameters based on mode
    if (executionMode === 'leads') {
      updateData.target_lead_count = targetLeadCount || dailyCallLimit;
      updateData.target_time_military = null;
    } else if (executionMode === 'time') {
      // targetTime is already converted to military format (e.g., 1802)
      updateData.target_time_military = targetTime;
      updateData.target_lead_count = null;
    }

    // Update AI status to running and save execution parameters
    const { error } = await supabase
      .from('ai_control_settings')
      .update(updateData)
      .eq('user_id', user.id);

    if (error) throw error;

    // Get user's subscription tier
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    const subscriptionTier = subscription?.subscription_tier || 'none';
    console.log('📦 User subscription tier:', subscriptionTier);

    // Get user's personal N8N webhook URL from database
    const { data: webhookConfig, error: webhookError } = await supabase
      .from('user_n8n_webhooks')
      .select('ai_agent_webhook_url, ai_agent_webhook_enabled')
      .eq('user_id', user.id)
      .maybeSingle();

    if (webhookError) {
      console.error('❌ Error fetching N8N webhook config:', webhookError);
      return NextResponse.json({ 
        error: 'Failed to load N8N configuration. Please contact support.' 
      }, { status: 500 });
    }

    if (!webhookConfig || !webhookConfig.ai_agent_webhook_url) {
      console.error('❌ No N8N webhook configured for user:', user.id);
      return NextResponse.json({ 
        error: 'AI agent not configured for your account. Please contact support to complete setup.',
        needsSetup: true
      }, { status: 400 });
    }

    if (!webhookConfig.ai_agent_webhook_enabled) {
      console.error('❌ N8N webhook disabled for user:', user.id);
      return NextResponse.json({ 
        error: 'AI agent is temporarily disabled. Please contact support.',
        disabled: true
      }, { status: 400 });
    }

    const webhookUrl = webhookConfig.ai_agent_webhook_url;
    console.log('🔗 Using user-specific N8N webhook:', webhookUrl);

    // Trigger N8N webhook to start AI with settings
    let n8nResponse = null;
    
    if (webhookUrl) {
      try {
        const payload: any = {
          userId: user.id,
          userEmail: user.email,
          action: 'start',
          liveTransferEnabled: true,  // Always enabled - included in package
          dailyCallLimit: dailyCallLimit,
          executionMode: executionMode || 'leads',
          subscriptionTier: subscriptionTier,  // starter, pro, elite, or none
          timestamp: new Date().toISOString(),
        };

        // Add admin test phone if provided
        if (adminTestPhone) {
          payload.adminTestPhone = adminTestPhone;
          payload.adminTest = true;
          console.log('🧪 Admin test mode: Will call', adminTestPhone);
        }

        // Add execution parameters based on mode
        if (executionMode === 'leads') {
          payload.targetLeadCount = targetLeadCount || dailyCallLimit;
          payload.stopCondition = 'lead_count';
        } else if (executionMode === 'time') {
          payload.targetTime = targetTime;
          payload.stopCondition = 'time_limit';
        }

        console.log('📤 Sending to N8N:', payload);

        // N8N will process and respond when automation is complete
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        console.log('📡 N8N Response Status:', webhookResponse.status);

        if (webhookResponse.ok) {
          const responseText = await webhookResponse.text();
          console.log('📄 N8N Raw Response:', responseText);

          try {
            n8nResponse = JSON.parse(responseText);
            console.log('✅ N8N response received:', n8nResponse);

            // ALWAYS update status to stopped when N8N responds (automation is done)
            console.log('🔄 N8N automation complete - updating AI status to stopped');
            
            const finalCallCount = n8nResponse.callsMade || 0;
            
            const { data: updatedSettings, error: updateError } = await supabase
              .from('ai_control_settings')
              .update({ 
                status: 'stopped',
                queue_length: finalCallCount  // Keep the final count
              })
              .eq('user_id', user.id)
              .select();

            if (updateError) {
              console.log('❌ Error updating status:', updateError);
            } else {
              console.log('✅ AI status updated to stopped. Calls made:', finalCallCount);
            }
          } catch (parseError) {
            console.error('❌ Failed to parse N8N response:', parseError);
            // Even if parse fails, stop the AI
            await supabase
              .from('ai_control_settings')
              .update({ status: 'stopped' })
              .eq('user_id', user.id);
          }
        } else {
          console.error('❌ N8N webhook failed with status:', webhookResponse.status);
        }
      } catch (webhookError) {
        console.error('❌ Webhook error:', webhookError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: n8nResponse ? 'AI automation completed' : 'AI started successfully',
      n8nResponse 
    });
  } catch (error: any) {
    console.error('Error starting AI:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start AI' },
      { status: 500 }
    );
  }
}

