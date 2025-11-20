import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdminMode } from '@/lib/admin-check';

export async function POST(req: Request) {
  try {
    const adminMode = await isAdminMode();
    
    if (!adminMode) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId, status } = await req.json();

    if (!userId || !status) {
      return NextResponse.json({ error: 'User ID and status required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Update profile with new onboarding status
    const { error } = await supabase
      .from('profiles')
      .update({ 
        ai_setup_status: status,
        onboarding_completed: status === 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error toggling onboarding:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

