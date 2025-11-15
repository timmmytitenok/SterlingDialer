import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

/**
 * POST /api/admin/users/update-retell
 * Update a user's Retell configuration
 */
export async function POST(request: Request) {
  try {
    // Check if in admin mode
    const adminMode = await isAdminMode();
    
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Use service role client to bypass RLS when in admin mode
    const supabase = createServiceRoleClient();

    // Parse request body
    const body = await request.json();
    const { userId, agentId, phoneNumber, agentName } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    console.log(`🔧 Updating Retell config for user ${userId}:`, {
      agentId: agentId || 'not set',
      phoneNumber: phoneNumber || 'not set',
      agentName: agentName || 'not set',
    });

    // Check if config exists
    const { data: existing } = await supabase
      .from('user_retell_config')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      // Update existing
      const { error: updateError } = await supabase
        .from('user_retell_config')
        .update({
          retell_agent_id: agentId || null,
          phone_number: phoneNumber || null,
          agent_name: agentName || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('❌ Update error:', updateError);
        throw updateError;
      }

      console.log('✅ Updated existing config');
    } else {
      // Insert new
      const { error: insertError } = await supabase
        .from('user_retell_config')
        .insert({
          user_id: userId,
          retell_agent_id: agentId || null,
          phone_number: phoneNumber || null,
          agent_name: agentName || null,
          retell_api_key: 'SET_BY_ADMIN',
          is_active: true,
        });

      if (insertError) {
        console.error('❌ Insert error:', insertError);
        throw insertError;
      }

      console.log('✅ Created new config');
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
    });

  } catch (error: any) {
    console.error('❌ Fatal error updating config:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update configuration' },
      { status: 500 }
    );
  }
}
