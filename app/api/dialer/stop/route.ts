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

    // Update session to stopped
    const { data: session, error } = await supabase
      .from('dialer_sessions')
      .update({
        status: 'idle',
        stopped_at: new Date().toISOString(),
        override_active: false,
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    console.log('⏹️ AI Dialer stopped for user:', user.id);

    // TODO: Trigger n8n webhook to stop calling
    // const webhookUrl = process.env.N8N_DIALER_STOP_WEBHOOK;
    // await fetch(webhookUrl, { method: 'POST', body: JSON.stringify({ userId: user.id }) });

    return NextResponse.json({
      success: true,
      message: 'AI Dialer stopped successfully',
      session,
    });
  } catch (error: any) {
    console.error('Error stopping dialer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to stop dialer' },
      { status: 500 }
    );
  }
}

