import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

export async function POST(req: Request) {
  try {
    const adminMode = await isAdminMode();
    
    if (!adminMode) {
      console.error('❌ Admin mode not enabled');
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId, maintenanceMode } = await req.json();

    console.log('🎯 Toggle maintenance mode:', { userId, maintenanceMode });

    if (!userId || typeof maintenanceMode !== 'boolean') {
      console.error('❌ Invalid request:', { userId, maintenanceMode });
      return NextResponse.json({ error: 'User ID and maintenance mode required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Update profile with maintenance mode
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        ai_maintenance_mode: maintenanceMode,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }

    console.log('✅ Maintenance mode updated successfully:', data);

    return NextResponse.json({ success: true, maintenanceMode });

  } catch (error: any) {
    console.error('❌ Error toggling maintenance mode:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

