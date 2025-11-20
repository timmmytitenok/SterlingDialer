import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { refereeId } = await req.json();
    
    if (!refereeId) {
      return NextResponse.json({ error: 'Missing refereeId' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    console.log(`🎁 Processing referral credit for referee: ${refereeId}`);

    // Find pending referral
    const { data: referral, error: refError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referee_id', refereeId)
      .eq('status', 'pending')
      .maybeSingle();

    if (refError || !referral) {
      console.log('⚠️ No pending referral found for referee:', refereeId);
      return NextResponse.json({ 
        error: 'No pending referral found',
        message: 'This is normal if the user was not referred by anyone.'
      }, { status: 404 });
    }

    console.log(`💰 Found referral: Referrer ${referral.referrer_id} will receive $${referral.credit_amount}`);

    // Update referral status to completed first
    const { error: updateError } = await supabase
      .from('referrals')
      .update({
        status: 'credited',
        completed_at: new Date().toISOString(),
        credited_at: new Date().toISOString()
      })
      .eq('id', referral.id);

    if (updateError) {
      console.error('Error updating referral status:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Get or create call balance for referrer
    const { data: existingBalance } = await supabase
      .from('call_balance')
      .select('balance')
      .eq('user_id', referral.referrer_id)
      .maybeSingle();

    const currentBalance = existingBalance?.balance || 0;
    const creditAmount = parseFloat(referral.credit_amount.toString());
    const newBalance = currentBalance + creditAmount;

    console.log(`📊 Referrer balance: $${currentBalance} → $${newBalance} (+$${creditAmount})`);

    // Upsert balance (create or update)
    const { error: balanceError } = await supabase
      .from('call_balance')
      .upsert({
        user_id: referral.referrer_id,
        balance: newBalance,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (balanceError) {
      console.error('Error updating balance:', balanceError);
      return NextResponse.json({ error: balanceError.message }, { status: 500 });
    }

    // Record transaction
    const { error: txError } = await supabase
      .from('balance_transactions')
      .insert({
        user_id: referral.referrer_id,
        amount: creditAmount,
        type: 'referral_credit',
        description: `Referral bonus - Friend subscribed`,
        balance_after: newBalance,
      });

    if (txError) {
      console.error('Error recording transaction:', txError);
      // Don't fail the whole operation if transaction recording fails
    }

    console.log(`✅ Successfully credited $${creditAmount} to referrer ${referral.referrer_id}`);

    return NextResponse.json({ 
      success: true, 
      credited: creditAmount,
      newBalance: newBalance
    });
  } catch (error: any) {
    console.error('Referral credit error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

