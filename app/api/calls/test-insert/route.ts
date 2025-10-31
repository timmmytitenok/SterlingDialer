import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Test endpoint to directly insert a call and verify database is working
export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    console.log('🧪 TEST: Inserting test call for user:', userId);

    // Insert a test call
    const { data, error } = await supabase
      .from('calls')
      .insert([{
        user_id: userId,
        disposition: 'answered',
        outcome: 'appointment_booked',
        contact_name: 'TEST CALL - ' + new Date().toLocaleTimeString(),
        contact_phone: '555-TEST',
        duration_seconds: 99,
        connected: true,
        created_at: new Date().toISOString(),
      }])
      .select();

    if (error) {
      console.error('❌ TEST: Database error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error 
      }, { status: 500 });
    }

    console.log('✅ TEST: Call inserted successfully:', data);

    // Now query it back to verify
    const { data: queryData, error: queryError } = await supabase
      .from('calls')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (queryError) {
      console.error('❌ TEST: Query error:', queryError);
    } else {
      console.log('📊 TEST: Recent calls for user:', queryData?.length);
    }

    return NextResponse.json({ 
      success: true,
      inserted: data[0],
      recentCallsCount: queryData?.length || 0,
      recentCalls: queryData?.slice(0, 3),
      message: 'Test call inserted! Check dashboard and refresh.'
    });

  } catch (error: any) {
    console.error('❌ TEST: Error:', error);
    return NextResponse.json(
      { error: error.message || 'Test failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test Call Insert Endpoint',
    method: 'POST',
    body: {
      userId: 'your-user-id'
    },
    description: 'Inserts a test call directly to verify database is working'
  });
}

