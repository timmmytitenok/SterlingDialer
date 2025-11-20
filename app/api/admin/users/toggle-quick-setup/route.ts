import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const adminMode = cookieStore.get('admin_mode')?.value;

    // Check admin access
    if (adminMode !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, hideQuickSetup } = body;

    if (!userId || hideQuickSetup === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();

    console.log(`🎯 Admin toggling Quick Setup for user ${userId}: ${hideQuickSetup ? 'HIDE' : 'SHOW'}`);

    // Update onboarding_all_complete to hide/show Quick Setup page
    await supabase
      .from('profiles')
      .update({ 
        onboarding_all_complete: hideQuickSetup,
        onboarding_completed_at: hideQuickSetup ? new Date().toISOString() : null,
      })
      .eq('user_id', userId);

    console.log(`✅ Quick Setup ${hideQuickSetup ? 'hidden' : 'enabled'} by admin!`);

    return NextResponse.json({ 
      success: true, 
      message: `Quick Setup ${hideQuickSetup ? 'hidden' : 'enabled'}`,
      hideQuickSetup 
    });

  } catch (error: any) {
    console.error('❌ Error toggling Quick Setup:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

