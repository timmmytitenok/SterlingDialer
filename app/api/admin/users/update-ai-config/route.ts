import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

export async function POST(req: Request) {
  try {
    const adminMode = await isAdminMode();
    
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId, agentId, phoneNumber, agentName, maintenanceMode } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Update or insert retell config
    const { data: existing } = await supabase
      .from('user_retell_config')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('user_retell_config')
        .update({
          retell_agent_id: agentId,
          phone_number: phoneNumber,
          agent_name: agentName,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      // Insert new
      const { error } = await supabase
        .from('user_retell_config')
        .insert({
          user_id: userId,
          retell_agent_id: agentId,
          phone_number: phoneNumber,
          agent_name: agentName,
          retell_api_key: 'placeholder', // Required field
          is_active: true,
        });

      if (error) throw error;
    }

    // Update maintenance mode in profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ ai_maintenance_mode: maintenanceMode })
      .eq('user_id', userId);

    if (profileError) throw profileError;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error updating AI config:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

