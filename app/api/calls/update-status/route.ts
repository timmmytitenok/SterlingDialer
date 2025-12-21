import { NextResponse } from 'next/server';

/**
 * Update call status and corresponding lead status
 * This allows users to correct AI classifications after listening to recordings
 */
export async function POST(request: Request) {
  try {
    const { callId, newStatus, leadId } = await request.json();

    if (!callId || !newStatus) {
      return NextResponse.json({ error: 'callId and newStatus required' }, { status: 400 });
    }

    console.log(`📝 Updating call ${callId} status to: ${newStatus}`);

    // Use service role client to bypass RLS
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Map the new status to the appropriate lead status
    const statusMapping: Record<string, string> = {
      'appointment_booked': 'appointment_booked',
      'not_interested': 'not_interested',
      'callback_later': 'callback_later',
      'live_transfer': 'live_transfer',
      'unclassified': 'unclassified',
      'no_answer': 'no_answer',
    };

    const leadStatus = statusMapping[newStatus] || 'unclassified';

    // Update the call record (just the outcome field - updated_at might not exist)
    const { error: callError } = await supabase
      .from('calls')
      .update({
        outcome: newStatus,
      })
      .eq('id', callId);

    if (callError) {
      console.error('❌ Failed to update call:', callError);
      console.error('   Error details:', JSON.stringify(callError, null, 2));
      return NextResponse.json({ error: `Failed to update call: ${callError.message}` }, { status: 500 });
    }

    console.log('✅ Call status updated');

    // If we have a lead_id, also update the lead status
    if (leadId) {
      console.log(`📝 Also updating lead ${leadId} status to: ${leadStatus}`);

      const { error: leadError } = await supabase
        .from('leads')
        .update({
          status: leadStatus,
          last_call_outcome: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);

      if (leadError) {
        console.error('❌ Failed to update lead:', leadError);
        // Don't fail the whole request, just log the error
      } else {
        console.log('✅ Lead status updated');
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Status updated successfully',
      newStatus,
      leadStatus,
    });
  } catch (error: any) {
    console.error('❌ Error updating status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update status' },
      { status: 500 }
    );
  }
}

