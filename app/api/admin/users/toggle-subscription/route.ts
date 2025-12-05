import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

/**
 * POST /api/admin/users/toggle-subscription
 * Toggle user subscription status (for testing subscription ended flow)
 */
export async function POST(req: Request) {
  try {
    const adminMode = await isAdminMode();
    
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId, hasActiveSubscription } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    console.log(`🔄 Toggling subscription for user: ${userId}`);
    console.log(`   New status: ${hasActiveSubscription ? 'ACTIVE' : 'ENDED'}`);

    const supabase = createServiceRoleClient();

    // Update profile with subscription status
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        has_active_subscription: hasActiveSubscription,
        subscription_tier: hasActiveSubscription ? 'pro' : 'none',
        subscription_status: hasActiveSubscription ? 'active' : 'canceled',
      })
      .eq('user_id', userId);

    if (profileError) {
      console.error('❌ Error updating profile:', profileError);
      throw profileError;
    }

    // If ending subscription, also disable auto schedule AND clear agent config
    if (!hasActiveSubscription) {
      console.log('🛑 Disabling auto schedule...');
      const { error: scheduleError } = await supabase
        .from('dialer_settings')
        .update({ 
          auto_schedule_enabled: false,
        })
        .eq('user_id', userId);
      
      if (scheduleError) {
        console.error('⚠️ Error disabling auto schedule:', scheduleError);
        // Don't fail the whole request if this fails
      } else {
        console.log('✅ Auto schedule disabled');
      }

      // Clear AI agent configuration
      console.log('🧹 Clearing AI agent configuration...');
      const { error: retellError } = await supabase
        .from('user_retell_config')
        .update({ 
          retell_agent_id: null,
          phone_number: null,
          is_active: false,
        })
        .eq('user_id', userId);
      
      if (retellError) {
        console.error('⚠️ Error clearing agent config:', retellError);
        // Don't fail the whole request if this fails
      } else {
        console.log('✅ Agent configuration cleared');
      }
    }

    console.log(`✅ Subscription ${hasActiveSubscription ? 'ACTIVATED' : 'ENDED'} for user ${userId}`);

    return NextResponse.json({ 
      success: true,
      message: `Subscription ${hasActiveSubscription ? 'activated' : 'ended'}`
    });

  } catch (error: any) {
    console.error('❌ Error toggling subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to toggle subscription' },
      { status: 500 }
    );
  }
}

