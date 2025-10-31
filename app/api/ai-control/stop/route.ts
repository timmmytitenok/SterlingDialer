import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await request.json();

    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update AI status to stopped and reset queue
    const { error } = await supabase
      .from('ai_control_settings')
      .update({ 
        status: 'stopped',
        queue_length: 0
      })
      .eq('user_id', user.id);

    if (error) throw error;

    // TODO: Trigger N8N webhook to stop AI
    const webhookUrl = process.env.N8N_WEBHOOK_STOP_DIAL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, action: 'stop' }),
        });
      } catch (webhookError) {
        console.error('Webhook error:', webhookError);
      }
    }

    return NextResponse.json({ success: true, message: 'AI stopped successfully' });
  } catch (error: any) {
    console.error('Error stopping AI:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to stop AI' },
      { status: 500 }
    );
  }
}

