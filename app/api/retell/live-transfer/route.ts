import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/retell/live-transfer
 * 
 * Custom webhook for Retell to get the user's phone number for live transfer
 * This enables global agents while still transferring to the correct user
 * 
 * Retell sends:
 * - userId: The user to transfer the call to
 * - leadId: The lead being transferred
 * - customer_name: Name of the person
 * - reason: Why they want to speak to someone (optional)
 */
export async function POST(request: Request) {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📞 LIVE TRANSFER WEBHOOK');
  console.log('═══════════════════════════════════════════════════════');

  try {
    const body = await request.json();
    console.log('📥 Received:', JSON.stringify(body, null, 2));

    const {
      userId,
      leadId,
      customer_name,
      reason,
    } = body;

    if (!userId) {
      console.error('❌ Missing userId');
      return NextResponse.json({ 
        success: false, 
        error: 'userId is required',
        transfer_number: null,
      }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Get user's phone number for transfer
    const { data: retellConfig, error: configError } = await supabase
      .from('user_retell_config')
      .select('phone_number, agent_name')
      .eq('user_id', userId)
      .single();

    if (configError || !retellConfig) {
      console.error('❌ Failed to fetch user config:', configError);
      return NextResponse.json({ 
        success: false, 
        error: 'User configuration not found',
        transfer_number: null,
      }, { status: 404 });
    }

    // Get user's personal phone from profiles (for transfer)
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone_number, full_name')
      .eq('user_id', userId)
      .single();

    // Determine which number to transfer to
    // Priority: profile phone > retell config phone
    const transferNumber = profile?.phone_number || retellConfig.phone_number;

    if (!transferNumber) {
      console.error('❌ No phone number configured for transfer');
      return NextResponse.json({ 
        success: false, 
        error: 'No phone number configured for live transfer',
        transfer_number: null,
      }, { status: 400 });
    }

    console.log('✅ Transfer info found:');
    console.log(`   Transfer to: ${transferNumber}`);
    console.log(`   User name: ${profile?.full_name || 'Unknown'}`);
    console.log(`   Agent name: ${retellConfig.agent_name || 'Not set'}`);

    // Update lead status if provided
    if (leadId) {
      await supabase
        .from('leads')
        .update({ 
          status: 'live_transfer',
          last_call_outcome: 'live_transfer',
        })
        .eq('id', leadId);
      console.log(`📝 Lead ${leadId} marked as live_transfer`);
    }

    // Log the transfer attempt
    console.log(`📞 Returning transfer number: ${transferNumber}`);

    return NextResponse.json({
      success: true,
      transfer_number: transferNumber,
      user_name: profile?.full_name || 'Agent',
      message: `Transferring to ${profile?.full_name || 'agent'}`,
    });

  } catch (error: any) {
    console.error('❌ Fatal error in live-transfer webhook:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error', transfer_number: null },
      { status: 500 }
    );
  }
}

