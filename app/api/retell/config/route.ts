import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Get Retell configuration
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: config } = await supabase
      .from('user_retell_config')
      .select('id, retell_agent_id, webhook_url, is_active, created_at, updated_at')
      .eq('user_id', user.id)
      .maybeSingle();

    return NextResponse.json({ 
      config: config || null,
      hasApiKey: config?.retell_agent_id ? true : false
    });

  } catch (error: any) {
    console.error('Error fetching Retell config:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}

// Update or create Retell configuration
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
    const { retellApiKey, retellAgentId, webhookUrl } = body;

    if (!retellApiKey) {
      return NextResponse.json({ error: 'Retell API key is required' }, { status: 400 });
    }

    if (!retellAgentId) {
      return NextResponse.json({ error: 'Retell Agent ID is required' }, { status: 400 });
    }

    // Check if config exists
    const { data: existingConfig } = await supabase
      .from('user_retell_config')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingConfig) {
      // Update existing config
      const { data, error } = await supabase
        .from('user_retell_config')
        .update({
          retell_api_key: retellApiKey,
          retell_agent_id: retellAgentId,
          webhook_url: webhookUrl || null,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConfig.id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ 
        success: true,
        message: 'Retell configuration updated successfully',
        config: data
      });
    } else {
      // Create new config
      const { data, error } = await supabase
        .from('user_retell_config')
        .insert({
          user_id: user.id,
          retell_api_key: retellApiKey,
          retell_agent_id: retellAgentId,
          webhook_url: webhookUrl || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ 
        success: true,
        message: 'Retell configuration saved successfully',
        config: data
      });
    }

  } catch (error: any) {
    console.error('Error saving Retell config:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save configuration' },
      { status: 500 }
    );
  }
}

