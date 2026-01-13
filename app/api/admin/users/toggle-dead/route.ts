import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

export async function POST(request: Request) {
  try {
    const adminMode = await isAdminMode();
    
    if (!adminMode) {
      console.error('❌ Admin mode not enabled');
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId, isDead } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    console.log(`🔄 Attempting to update user ${userId} to is_dead=${isDead}`);

    const supabase = createServiceRoleClient();

    // Update the user's dead status using admin client
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_dead: isDead })
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error('❌ Supabase error:', error);
      console.error('   Code:', error.code);
      console.error('   Message:', error.message);
      console.error('   Details:', error.details);
      console.error('   Hint:', error.hint);
      return NextResponse.json({ 
        error: `Database error: ${error.message}. You may need to add the is_dead column to the profiles table.` 
      }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.error('❌ No rows updated - user not found');
      return NextResponse.json({ error: 'User not found in profiles table' }, { status: 404 });
    }

    console.log(`✅ User ${userId} marked as ${isDead ? 'DEAD 💀' : 'ACTIVE 💚'}`);
    console.log('   Updated data:', data);

    // If marking as dead, also disable auto-scheduling to prevent AI from auto-launching
    if (isDead) {
      console.log('🔄 Disabling auto-scheduling for dead user...');
      
      // Disable in dialer_settings
      const { error: dialerError } = await supabase
        .from('dialer_settings')
        .update({ auto_start_enabled: false })
        .eq('user_id', userId);
      
      if (dialerError) {
        console.error('⚠️ Warning: Could not disable dialer_settings auto_start:', dialerError.message);
      } else {
        console.log('   ✅ dialer_settings.auto_start_enabled = false');
      }

      // Disable in ai_control_settings
      const { error: aiControlError } = await supabase
        .from('ai_control_settings')
        .update({ schedule_enabled: false })
        .eq('user_id', userId);
      
      if (aiControlError) {
        console.error('⚠️ Warning: Could not disable ai_control_settings schedule:', aiControlError.message);
      } else {
        console.log('   ✅ ai_control_settings.schedule_enabled = false');
      }

      console.log('✅ Auto-scheduling disabled for dead user - AI will not auto-launch');
    }

    return NextResponse.json({ success: true, isDead });
  } catch (error: any) {
    console.error('❌ Error toggling dead status:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}

