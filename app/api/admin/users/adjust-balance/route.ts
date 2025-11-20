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

    const supabase = createServiceRoleClient();

    // Get current balance
    const { data: balance, error: fetchError } = await supabase
      .from('call_balance')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'User balance not found' }, { status: 404 });
    }

    const currentBalance = balance.balance || 0;
    const newBalance = currentBalance + amount;

    // Update balance
    const { error: updateError } = await supabase
      .from('call_balance')
      .update({ balance: newBalance })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Record transaction
    const { error: transactionError } = await supabase
      .from('balance_transactions')
      .insert({
        user_id: userId,
        amount: amount,
        type: amount > 0 ? 'admin_credit' : 'admin_debit',
        description: `Admin ${amount > 0 ? 'added' : 'removed'} $${Math.abs(amount)}`,
        balance_after: newBalance,
      });

    if (transactionError) {
      console.error('Error recording transaction:', transactionError);
      // Don't fail the request if transaction logging fails
    }

    return NextResponse.json({ 
      success: true,
      newBalance,
    });

  } catch (error: any) {
    console.error('Error adjusting balance:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

