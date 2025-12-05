import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/dialer/stop
 * Stops the AI dialer
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

    // Update AI control settings to stopped
    const { error } = await supabase
      .from('ai_control_settings')
      .update({
        status: 'stopped',
        queue_length: 0,
      })
      .eq('user_id', user.id);

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    console.log('⏹️ AI Dialer stopped for user:', user.id);

    // TODO: Trigger webhook to stop calling (finish current call then stop)
    // This allows the current call to complete gracefully
    // const webhookUrl = process.env.N8N_DIALER_STOP_WEBHOOK;
    // await fetch(webhookUrl, { method: 'POST', body: JSON.stringify({ userId: user.id }) });

    return NextResponse.json({
      success: true,
      message: 'AI Dialer stopped successfully. Current call will finish, then operations will cease.',
    });
  } catch (error: any) {
    console.error('Error stopping dialer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to stop dialer' },
      { status: 500 }
    );
  }
}

