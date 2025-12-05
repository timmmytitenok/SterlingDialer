import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

export const dynamic = 'force-dynamic';

// GET - Fetch all custom revenue and expenses
export async function GET(req: Request) {
  try {
    const adminMode = await isAdminMode();
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabase = createServiceRoleClient();
    
    const { data: items, error } = await supabase
      .from('custom_revenue_expenses')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ items: items || [] });
  } catch (error: any) {
    console.error('❌ Error fetching custom revenue/expenses:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch items' },
      { status: 500 }
    );
  }
}

// POST - Create a new custom revenue or expense
export async function POST(req: Request) {
  try {
    const adminMode = await isAdminMode();
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { type, category, amount, description, date } = body;

    if (!type || !category || amount === undefined) {
      return NextResponse.json(
        { error: 'Type, category, and amount are required' },
        { status: 400 }
      );
    }

    if (!['revenue', 'expense'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be either "revenue" or "expense"' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    
    const { data: item, error } = await supabase
      .from('custom_revenue_expenses')
      .insert({
        type,
        category,
        amount: parseFloat(amount),
        description: description || null,
        date: date || new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Custom ${type} created:`, item);
    return NextResponse.json({ item });
  } catch (error: any) {
    console.error('❌ Error creating custom revenue/expense:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create item' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a custom revenue or expense
export async function DELETE(req: Request) {
  try {
    const adminMode = await isAdminMode();
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    
    const { error } = await supabase
      .from('custom_revenue_expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;

    console.log('✅ Custom revenue/expense deleted:', id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error deleting custom revenue/expense:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete item' },
      { status: 500 }
    );
  }
}

// PATCH - Update a custom revenue or expense
export async function PATCH(req: Request) {
  try {
    const adminMode = await isAdminMode();
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { id, type, category, amount, description, date } = body;

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    
    const updateData: any = {};
    if (type !== undefined) {
      if (!['revenue', 'expense'].includes(type)) {
        return NextResponse.json(
          { error: 'Type must be either "revenue" or "expense"' },
          { status: 400 }
        );
      }
      updateData.type = type;
    }
    if (category !== undefined) updateData.category = category;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = date;

    const { data: item, error } = await supabase
      .from('custom_revenue_expenses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Custom revenue/expense updated:', item);
    return NextResponse.json({ item });
  } catch (error: any) {
    console.error('❌ Error updating custom revenue/expense:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update item' },
      { status: 500 }
    );
  }
}

