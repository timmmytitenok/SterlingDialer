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

    const body = await request.json();
    const { dailyCallLimit = 50 } = body;

    console.log('🚀 Starting AI with direct Retell calling');
    console.log(`📊 Daily call limit: ${dailyCallLimit}`);

    // Check if user has Retell configured
    const { data: retellConfig, error: configError } = await supabase
      .from('user_retell_config')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (configError) throw configError;

    if (!retellConfig || !retellConfig.retell_api_key) {
      return NextResponse.json({ 
        error: 'Retell AI not configured. Please add your Retell API key in settings.',
        needsSetup: true
      }, { status: 400 });
    }

    // Get callable leads
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id)
      .or('status.eq.new,status.eq.callback,and(status.eq.no_answer,times_dialed.lt.2)')
      .order('created_at', { ascending: true })
      .limit(dailyCallLimit);

    if (leadsError) throw leadsError;

    if (!leads || leads.length === 0) {
      return NextResponse.json({ 
        error: 'No callable leads found. Please sync your Google Sheet or add leads manually.',
        needsLeads: true
      }, { status: 400 });
    }

    console.log(`📋 Found ${leads.length} callable leads`);

    // Update AI status to running
    const { error: statusError } = await supabase
      .from('ai_control_settings')
      .update({ 
        status: 'running',
        queue_length: leads.length,
        daily_call_limit: dailyCallLimit,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (statusError) throw statusError;

    // Start calling leads asynchronously
    // We'll trigger the calls but not wait for them to complete
    startCallingLeads(user.id, leads.slice(0, Math.min(5, leads.length)), retellConfig.retell_api_key, retellConfig.retell_agent_id);

    return NextResponse.json({ 
      success: true,
      message: `AI started! Calling ${leads.length} leads.`,
      leadsToCall: leads.length,
      status: 'running'
    });

  } catch (error: any) {
    console.error('❌ Error starting AI:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start AI' },
      { status: 500 }
    );
  }
}

// Function to start calling leads asynchronously
async function startCallingLeads(
  userId: string,
  leads: any[],
  retellApiKey: string,
  agentId: string
) {
  console.log(`📞 Starting to call ${leads.length} leads...`);

  for (const lead of leads) {
    try {
      // Call the Retell API endpoint we created
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/retell/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Use service role for internal API calls
        },
        body: JSON.stringify({
          leadId: lead.id,
          userId: userId,
        }),
      });

      if (!response.ok) {
        console.error(`❌ Failed to call lead ${lead.id}:`, await response.text());
      } else {
        console.log(`✅ Called lead ${lead.id} (${lead.name})`);
      }

      // Add a small delay between calls to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay

    } catch (error) {
      console.error(`❌ Error calling lead ${lead.id}:`, error);
    }
  }

  console.log('✅ Finished initiating all calls');
}

