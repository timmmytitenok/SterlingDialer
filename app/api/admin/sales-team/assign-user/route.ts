import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

export async function POST(req: Request) {
  try {
    const adminMode = await isAdminMode();
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { salesPersonId, userId, userEmail, userName } = await req.json();

    if (!salesPersonId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Get sales person info
    const { data: salesPerson, error: spError } = await supabase
      .from('sales_team')
      .select('referral_code')
      .eq('id', salesPersonId)
      .single();

    if (spError || !salesPerson) {
      console.error('Sales person not found:', spError);
      return NextResponse.json({ error: 'Sales person not found' }, { status: 404 });
    }

    // Check if user has active subscription (to determine if they're "converted")
    const { data: profile } = await supabase
      .from('profiles')
      .select('has_active_subscription')
      .eq('user_id', userId)
      .maybeSingle();

    const isConverted = profile?.has_active_subscription === true;
    const status = isConverted ? 'converted' : 'trial';

    // Check if referral already exists for this user
    const { data: existingReferral } = await supabase
      .from('sales_referrals')
      .select('id, sales_person_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingReferral) {
      // Update existing referral to new sales person
      const { error: updateError } = await supabase
        .from('sales_referrals')
        .update({
          sales_person_id: salesPersonId,
          referral_code: salesPerson.referral_code,
          user_email: userEmail,
          user_name: userName,
          status: status,
          converted_at: isConverted ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingReferral.id);

      if (updateError) {
        console.error('Error updating referral:', updateError);
        throw updateError;
      }
    } else {
      // Create new referral
      const { error: insertError } = await supabase
        .from('sales_referrals')
        .insert({
          sales_person_id: salesPersonId,
          user_id: userId,
          user_email: userEmail,
          user_name: userName,
          referral_code: salesPerson.referral_code,
          status: status,
          converted_at: isConverted ? new Date().toISOString() : null,
          lead_source: 'provided',
        });

      if (insertError) {
        console.error('Error inserting referral:', insertError);
        throw insertError;
      }
    }

    // Recalculate and update sales person stats based on actual data
    await recalculateSalesPersonStats(supabase, salesPersonId);

    // Also recalculate stats for the old sales person if reassigning
    if (existingReferral && existingReferral.sales_person_id && existingReferral.sales_person_id !== salesPersonId) {
      await recalculateSalesPersonStats(supabase, existingReferral.sales_person_id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error assigning user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to assign user' },
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
