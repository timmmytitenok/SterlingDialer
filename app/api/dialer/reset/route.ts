import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * POST /api/dialer/reset
 * BULLETPROOF FIX: Reset stuck states and allow relaunch
 * 
 * This endpoint cleans up:
 * 1. Leads stuck in "calling_in_progress" status
 * 2. AI settings that might be in a bad state
 * 3. Any other blocking conditions that can be safely reset
 */
export async function POST() {
  try {
    const supabase = await createClient();
    
    // Service role client for bypassing RLS
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('');
    console.log('🔧 ========== DIALER RESET REQUESTED ==========');
    console.log(`   User ID: ${user.id}`);
    console.log(`   Time: ${new Date().toISOString()}`);

    const cleanupResults: {
      stuckLeadsCleaned: number;
      aiSettingsReset: boolean;
      dialerSessionReset: boolean;
      balanceRecordCreated: boolean;
    } = {
      stuckLeadsCleaned: 0,
      aiSettingsReset: false,
      dialerSessionReset: false,
      balanceRecordCreated: false,
    };

    // ========================================================================
    // CLEANUP 1: Unlock all "calling_in_progress" leads
    // These are leads that were being called but the call never completed
    // ========================================================================
    const { data: stuckLeads } = await supabaseAdmin
      .from('leads')
      .update({ 
        status: 'no_answer',
        last_call_outcome: 'reset_cleanup',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('status', 'calling_in_progress')
      .select('id');
    
    cleanupResults.stuckLeadsCleaned = stuckLeads?.length || 0;
    console.log(`🧹 Cleaned up ${cleanupResults.stuckLeadsCleaned} stuck leads (calling_in_progress)`);

    // ========================================================================
    // CLEANUP 2: Reset AI control settings to a clean state
    // ========================================================================
    const { error: aiResetError } = await supabaseAdmin
      .from('ai_control_settings')
      .update({
        status: 'stopped',
        last_call_status: 'manual_reset',
        current_call_id: null,
        current_lead_id: null,
        queue_length: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);
    
    if (!aiResetError) {
      cleanupResults.aiSettingsReset = true;
      console.log('✅ AI control settings reset to stopped state');
    } else {
      console.error('❌ Failed to reset AI settings:', aiResetError);
    }

    // ========================================================================
    // CLEANUP 3: Reset dialer session
    // ========================================================================
    const { error: sessionResetError } = await supabase
      .from('dialer_sessions')
      .update({
        status: 'stopped',
        override_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);
    
    if (!sessionResetError) {
      cleanupResults.dialerSessionReset = true;
      console.log('✅ Dialer session reset');
    }

    // ========================================================================
    // CLEANUP 4: Ensure user has a balance record (for new users)
    // ========================================================================
    const { data: existingBalance } = await supabase
      .from('call_balance')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (!existingBalance) {
      const { error: createBalanceError } = await supabase
        .from('call_balance')
        .insert({
          user_id: user.id,
          balance: 0,
          auto_refill_enabled: true,
          auto_refill_amount: 25,
          auto_refill_threshold: 1.00,
        });
      
      if (!createBalanceError) {
        cleanupResults.balanceRecordCreated = true;
        console.log('✅ Created balance record for user');
      }
    }

    console.log('🔧 ========== RESET COMPLETE ==========');
    console.log('');

    return NextResponse.json({
      success: true,
      message: 'Dialer reset complete. You can now try launching again.',
      cleanup: cleanupResults,
    });

  } catch (error: any) {
    console.error('Error resetting dialer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reset dialer' },
      { status: 500 }
    );
  }
}
