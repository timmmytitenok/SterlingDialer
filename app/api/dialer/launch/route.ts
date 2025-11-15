import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/dialer/launch
 * Launches the AI dialer
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

    const hasBalance = (callBalance?.auto_refill_enabled) || (callBalance?.balance || 0) >= 5;
    
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

    // TODO: Trigger n8n webhook or Retell/Twilio integration here
    // const webhookUrl = process.env.N8N_DIALER_START_WEBHOOK;
    // await fetch(webhookUrl, { method: 'POST', body: JSON.stringify({ userId: user.id, sessionId: session.id }) });

    return NextResponse.json({
      success: true,
      message: 'AI Dialer launched successfully',
      session,
    });
  } catch (error: any) {
    console.error('Error launching dialer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to launch dialer' },
      { status: 500 }
    );
  }
}

