import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

export async function POST(req: Request) {
  try {
    console.log('📊 Update dashboard stats request received');
    
    const adminMode = await isAdminMode();
    console.log('🔐 Admin mode:', adminMode);
    
    if (!adminMode) {
      console.error('❌ Admin access denied');
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId, date, category, value } = await req.json();
    console.log('📝 Request data:', { userId, date, category, value });

    if (!userId || !date || !category || typeof value !== 'number') {
      console.error('❌ Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    console.log('✅ Supabase client created');

    // Get or create revenue_tracking record for this date
    console.log('🔍 Checking for existing record...');
    const { data: existing, error: fetchError } = await supabase
      .from('revenue_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle();
    
    if (fetchError) {
      console.error('❌ Error fetching existing record:', fetchError);
      throw fetchError;
    }
    
    console.log('📦 Existing record:', existing);

    let updateData: any = {};

    // Map categories to database fields
    switch (category) {
      case 'total_dials':
        updateData.total_calls = (existing?.total_calls || 0) + value;
        break;
      case 'connected_calls':
        updateData.connected_calls = (existing?.connected_calls || 0) + value;
        break;
      case 'callback':
        updateData.callbacks = (existing?.callbacks || 0) + value;
        break;
      case 'not_interested':
        updateData.not_interested = (existing?.not_interested || 0) + value;
        break;
      case 'live_transfer':
        updateData.live_transfers = (existing?.live_transfers || 0) + value;
        break;
      case 'appointments':
        updateData.appointments_booked = (existing?.appointments_booked || 0) + value;
        break;
      case 'policies_sold':
        updateData.policies_sold = (existing?.policies_sold || 0) + value;
        break;
      case 'revenue':
        updateData.revenue = (existing?.revenue || 0) + value;
        break;
      case 'ai_cost':
        updateData.ai_daily_cost = (existing?.ai_daily_cost || 0) + value;
        break;
      default:
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    console.log('💾 Update data:', updateData);
    
    if (existing) {
      // Update existing record
      console.log('🔄 Updating existing record...');
      const { error } = await supabase
        .from('revenue_tracking')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('date', date);

      if (error) {
        console.error('❌ Update error:', error);
        throw error;
      }
      console.log('✅ Record updated successfully');
    } else {
      // Create new record
      console.log('➕ Creating new record...');
      const { error } = await supabase
        .from('revenue_tracking')
        .insert({
          user_id: userId,
          date: date,
          ...updateData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('❌ Insert error:', error);
        throw error;
      }
      console.log('✅ Record created successfully');
    }

    console.log('🎉 Dashboard stats updated successfully!');
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error updating dashboard stats:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

