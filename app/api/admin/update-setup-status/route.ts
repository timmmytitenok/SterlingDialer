import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId, status } = await request.json();

    if (!userId || !status) {
      return NextResponse.json({ error: 'Missing userId or status' }, { status: 400 });
    }

    if (!['ready', 'pending_setup', 'maintenance'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify the requesting user is updating their own status (or add admin check here)
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update the status
    const updateData: any = {
      ai_setup_status: status,
    };

    if (status === 'pending_setup' || status === 'maintenance') {
      updateData.setup_requested_at = new Date().toISOString();
      updateData.setup_completed_at = null;
    } else if (status === 'ready') {
      updateData.setup_completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating setup status:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`✅ AI setup status updated to: ${status} for user: ${userId}`);

    return NextResponse.json({ 
      success: true, 
      status,
      message: `Status updated to ${status}`
    });

  } catch (error: any) {
    console.error('Error updating setup status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

