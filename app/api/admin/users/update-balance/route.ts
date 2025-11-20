import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

export async function POST(req: Request) {
  try {
    const adminMode = await isAdminMode();
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId, amount } = await req.json();

    if (!userId || typeof amount !== 'number') {
      return NextResponse.json({ error: 'User ID and amount required' }, { status: 400 });
    }

    console.log(`💰 Admin adjusting call balance for user ${userId}: ${amount >= 0 ? '+' : ''}${amount}`);

    const supabase = createServiceRoleClient();

    // Get current balance
    const { data: currentBalance, error: fetchError } = await supabase
      .from('call_balance')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching current balance:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch current balance' }, { status: 500 });
    }

    const newBalance = (currentBalance?.balance || 0) + amount;

    if (newBalance < 0) {
      return NextResponse.json({ error: 'Balance cannot be negative' }, { status: 400 });
    }

    // Update balance
    const { error: updateError } = await supabase
      .from('call_balance')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('❌ Error updating balance:', updateError);
      return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });
    }

    // Log the transaction in balance_transactions
    const { error: transactionError } = await supabase
      .from('balance_transactions')
      .insert({
        user_id: userId,
        amount: Math.abs(amount),
        transaction_type: amount >= 0 ? 'admin_credit' : 'admin_debit',
        description: `Admin adjustment: ${amount >= 0 ? '+' : ''}$${Math.abs(amount).toFixed(2)}`,
        created_at: new Date().toISOString(),
      });

    if (transactionError) {
      console.error('⚠️ Failed to log transaction (balance still updated):', transactionError);
    }

    console.log(`✅ Balance updated successfully. New balance: $${newBalance.toFixed(2)}`);

    return NextResponse.json({ 
      success: true,
      oldBalance: currentBalance?.balance || 0,
      newBalance: newBalance,
    });

  } catch (error: any) {
    console.error('❌ Error updating call balance:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

