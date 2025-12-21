import { NextResponse } from 'next/server';

/**
 * Update lead status
 * This allows users to manually change the status of a lead
 */
export async function POST(request: Request) {
  try {
    const { leadId, newStatus } = await request.json();

    if (!leadId || !newStatus) {
      return NextResponse.json({ error: 'leadId and newStatus required' }, { status: 400 });
    }

    console.log(`📝 Updating lead ${leadId} status to: ${newStatus}`);

    // Use service role client to bypass RLS
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Update the lead record
    const { error: leadError } = await supabase
      .from('leads')
      .update({
        status: newStatus,
        last_call_outcome: newStatus,
      })
      .eq('id', leadId);

    if (leadError) {
      console.error('❌ Failed to update lead:', leadError);
      console.error('   Error details:', JSON.stringify(leadError, null, 2));
      return NextResponse.json({ error: `Failed to update lead: ${leadError.message}` }, { status: 500 });
    }

    console.log('✅ Lead status updated');

    return NextResponse.json({
      success: true,
      message: 'Lead status updated successfully',
      newStatus,
    });
  } catch (error: any) {
    console.error('❌ Error updating lead status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update lead status' },
      { status: 500 }
    );
  }
}

