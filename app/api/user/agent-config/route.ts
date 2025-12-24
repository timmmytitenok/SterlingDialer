import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/agent-config
 * Returns the user's configured AI agents for lead type selection
 */
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's Retell config with agent settings
    const { data: config, error: configError } = await supabase
      .from('user_retell_config')
      .select(`
        retell_agent_1_id,
        retell_agent_1_phone,
        retell_agent_1_name,
        retell_agent_1_type,
        retell_agent_2_id,
        retell_agent_2_phone,
        retell_agent_2_name,
        retell_agent_2_type,
        agent_name,
        agent_pronoun
      `)
      .eq('user_id', user.id)
      .maybeSingle();

    if (configError) {
      console.error('Error fetching agent config:', configError);
      return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
    }

    // Check if agent is fully configured (ALL fields must be present: id, phone, and name)
    const isAgent1Configured = !!(
      config?.retell_agent_1_id && 
      config?.retell_agent_1_phone && 
      config?.retell_agent_1_name
    );
    const isAgent2Configured = !!(
      config?.retell_agent_2_id && 
      config?.retell_agent_2_phone && 
      config?.retell_agent_2_name
    );

    // Build agent configuration response
    // If not configured, show "Script #1" or "Script #2" as default name
    const agents = {
      agent1: {
        id: config?.retell_agent_1_id || null,
        phone: config?.retell_agent_1_phone || null,
        name: isAgent1Configured ? config.retell_agent_1_name : 'Script #1',
        type: config?.retell_agent_1_type || 'final_expense',
        isConfigured: isAgent1Configured,
      },
      agent2: {
        id: config?.retell_agent_2_id || null,
        phone: config?.retell_agent_2_phone || null,
        name: isAgent2Configured ? config.retell_agent_2_name : 'Script #2',
        type: config?.retell_agent_2_type || 'final_expense',
        isConfigured: isAgent2Configured,
      },
      voiceName: config?.agent_name || 'Sarah',
      voicePronoun: config?.agent_pronoun || 'She',
    };

    return NextResponse.json({ agents });

  } catch (error: any) {
    console.error('Error in agent-config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

