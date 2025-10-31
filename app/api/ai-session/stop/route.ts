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

    const { sessionId } = await request.json();

    // Update session status to stopped
    const { data: session, error } = await supabase
      .from('ai_sessions')
      .update({ 
        status: 'stopped',
        stopped_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'AI session stopped',
      session,
    });
  } catch (error: any) {
    console.error('Error stopping AI session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to stop AI session' },
      { status: 500 }
    );
  }
}

