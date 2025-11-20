import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

export async function POST(req: Request) {
  try {
    const adminMode = await isAdminMode();
    
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId, active } = await req.json();

    if (!userId || typeof active !== 'boolean') {
      return NextResponse.json({ error: 'User ID and active status required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Update AI active status in retell config
    const { error } = await supabase
      .from('user_retell_config')
      .update({ 
        is_active: active,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error toggling AI:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

