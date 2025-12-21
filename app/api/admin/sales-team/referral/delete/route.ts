import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

export async function POST(req: Request) {
  try {
    const adminMode = await isAdminMode();
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { referralId } = await req.json();

    if (!referralId) {
      return NextResponse.json({ error: 'Referral ID required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Get the referral first to update the sales person's stats
    const { data: referral } = await supabase
      .from('sales_referrals')
      .select('*')
      .eq('id', referralId)
      .single();

    if (!referral) {
      return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
    }

    const salesPersonId = referral.sales_person_id;

    // Delete the referral
    const { error: deleteError } = await supabase
      .from('sales_referrals')
      .delete()
      .eq('id', referralId);

    if (deleteError) {
      console.error('Error deleting referral:', deleteError);
      return NextResponse.json({ error: 'Failed to delete referral' }, { status: 500 });
    }

    // Clear the user's referral info in profiles
    if (referral.user_id) {
      await supabase
        .from('profiles')
        .update({
          referred_by_sales: null,
          sales_referral_id: null,
        })
        .eq('user_id', referral.user_id);
    }

    // Recalculate sales person stats
    if (salesPersonId) {
      await recalculateSalesPersonStats(supabase, salesPersonId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in referral delete:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to unassign user' },
      { status: 500 }
    );
  }
}

async function recalculateSalesPersonStats(supabase: any, salesPersonId: string) {
  // Get all referrals for this sales person
  const { data: referrals } = await supabase
    .from('sales_referrals')
    .select('id, status')
    .eq('sales_person_id', salesPersonId);

  const totalReferred = (referrals || []).length;
  const totalConversions = (referrals || []).filter((r: any) => r.status === 'converted').length;

  // Get all commissions for this sales person
  const { data: commissions } = await supabase
    .from('sales_commissions')
    .select('amount, status')
    .eq('sales_person_id', salesPersonId);

  const totalEarnings = (commissions || []).reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
  const totalPaid = (commissions || []).filter((c: any) => c.status === 'paid').reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
  const pendingPayout = (commissions || []).filter((c: any) => c.status === 'pending').reduce((sum: number, c: any) => sum + (c.amount || 0), 0);

  // Update sales person stats
  await supabase
    .from('sales_team')
    .update({
      total_users_referred: totalReferred,
      total_conversions: totalConversions,
      total_earnings: totalEarnings,
      total_paid: totalPaid,
      pending_payout: pendingPayout,
      updated_at: new Date().toISOString(),
    })
    .eq('id', salesPersonId);

  console.log(`📊 Updated stats for sales person ${salesPersonId}: ${totalReferred} referred, ${totalConversions} converted`);
}

