import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId, webhookType, webhookUrl, enabled } = await request.json();

    if (!userId || !webhookType) {
      return NextResponse.json({ error: 'Missing userId or webhookType' }, { status: 400 });
    }

    if (!['ai_agent', 'appointment'].includes(webhookType)) {
      return NextResponse.json({ error: 'Invalid webhookType. Must be "ai_agent" or "appointment"' }, { status: 400 });
    }

    // Validate URL if provided
    if (webhookUrl) {
      try {
        const url = new URL(webhookUrl);
        if (!url.protocol.startsWith('http')) {
          return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
      }
    }

    const supabase = await createClient();

    // Verify the requesting user is updating their own webhook (or add admin check here)
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Prepare update data based on webhook type
    const updateData: any = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    if (webhookType === 'ai_agent') {
      updateData.ai_agent_webhook_url = webhookUrl?.trim() || null;
      updateData.ai_agent_webhook_enabled = enabled !== false;
    } else if (webhookType === 'appointment') {
      updateData.appointment_webhook_url = webhookUrl?.trim() || null;
      updateData.appointment_webhook_enabled = enabled === true;
    }

    // Upsert webhook configuration
    const { error } = await supabase
      .from('user_n8n_webhooks')
      .upsert(updateData, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error updating webhook:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`✅ ${webhookType} webhook updated for user: ${userId}`);
    console.log(`   URL: ${webhookUrl || 'null'}`);
    console.log(`   Enabled: ${enabled}`);

    return NextResponse.json({ 
      success: true, 
      message: `${webhookType === 'ai_agent' ? 'AI Agent' : 'Appointment'} webhook configuration saved`
    });

  } catch (error: any) {
    console.error('Error updating webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

