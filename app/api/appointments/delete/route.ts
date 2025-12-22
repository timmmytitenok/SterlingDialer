import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { appointmentId, userId } = await request.json();

    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // SOFT DELETE: Mark as cancelled instead of actually deleting
    // This keeps the record for stats but removes it from calendar view
    const { error } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
      })
      .eq('id', appointmentId)
      .eq('user_id', user.id);

    if (error) throw error;

    console.log(`✅ Appointment ${appointmentId} marked as cancelled (soft delete)`);

    return NextResponse.json({ success: true, message: 'Appointment removed' });
  } catch (error: any) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete appointment' },
      { status: 500 }
    );
  }
}

