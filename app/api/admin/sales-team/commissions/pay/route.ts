import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

export async function POST(req: Request) {
  try {
    const adminMode = await isAdminMode();
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { commissionId } = await req.json();

    if (!commissionId) {
      return NextResponse.json({ error: 'Commission ID required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Get commission
    const { data: commission, error: fetchError } = await supabase
      .from('sales_commissions')
      .select('*')
      .eq('id', commissionId)
      .single();

    if (fetchError || !commission) {
      return NextResponse.json({ error: 'Commission not found' }, { status: 404 });
    }

    // Mark as paid
    const { error: updateError } = await supabase
      .from('sales_commissions')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', commissionId);

    if (updateError) throw updateError;

    // Update sales person stats
    const { error: statsError } = await supabase.rpc('update_sales_team_stats', {
      sales_id: commission.sales_person_id,
    });

    // If RPC doesn't exist, manually update
    if (statsError) {
      console.log('RPC not available, updating manually');
      
      // Get updated totals
      const { data: paidTotal } = await supabase
        .from('sales_commissions')
        .select('amount')
        .eq('sales_person_id', commission.sales_person_id)
        .eq('status', 'paid');

      const { data: pendingTotal } = await supabase
        .from('sales_commissions')
        .select('amount')
        .eq('sales_person_id', commission.sales_person_id)
        .eq('status', 'pending');

      const totalPaid = (paidTotal || []).reduce((sum, c) => sum + (c.amount || 0), 0);
      const totalPending = (pendingTotal || []).reduce((sum, c) => sum + (c.amount || 0), 0);

      await supabase
        .from('sales_team')
        .update({
          total_paid: totalPaid,
          pending_payout: totalPending,
          updated_at: new Date().toISOString(),
        })
        .eq('id', commission.sales_person_id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error marking commission paid:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark commission paid' },
      { status: 500 }
    );
  }
}

