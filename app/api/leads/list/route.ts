import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // Filter by status
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Apply status filter if provided
    if (status && status !== 'all') {
      if (status === 'not_interested') {
        query = query.eq('status', 'not_interested');
      } else if (status === 'no_answer') {
        query = query.eq('status', 'no_answer');
      } else if (status === 'callback') {
        query = query.eq('status', 'callback');
      } else if (status === 'booked') {
        query = query.eq('status', 'booked');
      } else if (status === 'sold') {
        query = query.eq('status', 'sold');
      } else if (status === 'new') {
        query = query.eq('status', 'new');
      } else if (status === 'callable') {
        // Leads that can be called (new, callback, or no_answer with < 2 attempts)
        query = query.or('status.eq.new,status.eq.callback,and(status.eq.no_answer,times_dialed.lt.2)');
      }
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: leads, error, count } = await query;

    if (error) throw error;

    // Get counts for each status
    const { data: statusCounts } = await supabase
      .from('leads')
      .select('status, call_attempts_today')
      .eq('user_id', user.id);

    const counts = {
      all: statusCounts?.length || 0,
      new: statusCounts?.filter(l => l.status === 'new').length || 0,
      not_interested: statusCounts?.filter(l => l.status === 'not_interested').length || 0,
      no_answer: statusCounts?.filter(l => l.status === 'no_answer').length || 0,
      callback: statusCounts?.filter(l => l.status === 'callback').length || 0,
      booked: statusCounts?.filter(l => l.status === 'booked').length || 0,
      sold: statusCounts?.filter(l => l.status === 'sold').length || 0,
      callable: statusCounts?.filter(l => 
        l.status === 'new' || 
        l.status === 'callback' || 
        (l.status === 'no_answer' && ((l as any).call_attempts_today || 0) < 2)
      ).length || 0,
    };

    return NextResponse.json({ 
      leads: leads || [],
      count: count || 0,
      counts,
      pagination: {
        limit,
        offset,
        total: count || 0,
      }
    });

  } catch (error: any) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

