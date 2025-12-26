import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/dialer/override
 * Overrides the daily budget to run extra leads
 * This does NOT modify the daily budget setting, just allows temporary override
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

    const body = await request.json();
    const extraLeads = body.extraLeads || 20;

    // Validate
    if (extraLeads < 1 || extraLeads > 100) {
      return NextResponse.json(
        { error: 'Extra leads must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Estimate cost (assuming 1 min per lead at $0.35/min)
    const minutesPerLead = 1;
    const costPerMinute = 0.30;
    const estimatedCostCents = Math.round(extraLeads * minutesPerLead * costPerMinute * 100);

    // Update session to running with override flag
    const { data: session, error } = await supabase
      .from('dialer_sessions')
      .update({
        status: 'running',
        override_active: true,
        override_leads: extraLeads,
        override_started_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') {
      // If no session exists, create one
      const { data: newSession } = await supabase
        .from('dialer_sessions')
        .insert([{
          user_id: user.id,
          status: 'running',
          override_active: true,
          override_leads: extraLeads,
          override_started_at: new Date().toISOString(),
        }])
        .select()
        .single();
      
      console.log(`🔄 Override activated: ${extraLeads} extra leads (est. $${(estimatedCostCents / 100).toFixed(2)})`);
      
      // TODO: Trigger n8n webhook for override batch
      // const webhookUrl = process.env.N8N_DIALER_OVERRIDE_WEBHOOK;
      // await fetch(webhookUrl, { method: 'POST', body: JSON.stringify({ userId: user.id, extraLeads }) });

      return NextResponse.json({
        success: true,
        message: `Override started: ${extraLeads} extra leads`,
        session: newSession,
        estimatedCostCents,
      });
    }

    console.log(`🔄 Override activated: ${extraLeads} extra leads (est. $${(estimatedCostCents / 100).toFixed(2)})`);

    // TODO: Trigger n8n webhook for override batch
    // const webhookUrl = process.env.N8N_DIALER_OVERRIDE_WEBHOOK;
    // await fetch(webhookUrl, { method: 'POST', body: JSON.stringify({ userId: user.id, extraLeads }) });

    return NextResponse.json({
      success: true,
      message: `Override started: ${extraLeads} extra leads`,
      session,
      estimatedCostCents,
    });
  } catch (error: any) {
    console.error('Error activating override:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to activate override' },
      { status: 500 }
    );
  }
}

