import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Endpoint to verify we can insert into calls table
export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    console.log('🧪 VERIFICATION TEST: Attempting database insert...');
    console.log('🧪 User ID:', userId);

    const supabase = createServiceRoleClient();

    // First, check if the table and columns exist
    console.log('🧪 Step 1: Checking table structure...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('calls')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Table check failed:', tableError);
      return NextResponse.json({ 
        success: false, 
        step: 'table_check',
        error: tableError.message,
        details: tableError
      }, { status: 500 });
    }

    console.log('✅ Step 1 passed: Table accessible');

    // Step 2: Try minimal insert (only required fields)
    console.log('🧪 Step 2: Minimal insert test...');
    
    const { data: minimalData, error: minimalError } = await supabase
      .from('calls')
      .insert([{
        user_id: userId,
        disposition: 'answered',
        created_at: new Date().toISOString(),
      }])
      .select();

    if (minimalError) {
      console.error('❌ Minimal insert failed:', minimalError);
      return NextResponse.json({ 
        success: false, 
        step: 'minimal_insert',
        error: minimalError.message,
        details: minimalError,
        hint: 'Database may be rejecting inserts. Check RLS policies or column constraints.'
      }, { status: 500 });
    }

    console.log('✅ Step 2 passed: Minimal insert successful');
    console.log('✅ Inserted ID:', minimalData[0].id);

    // Step 3: Try full insert with all fields
    console.log('🧪 Step 3: Full insert test...');
    
    const { data: fullData, error: fullError } = await supabase
      .from('calls')
      .insert([{
        user_id: userId,
        disposition: 'answered',
        outcome: 'appointment_booked',
        contact_name: 'VERIFICATION TEST',
        contact_phone: '555-VERIFY',
        duration_seconds: 123,
        connected: true,
        recording_url: 'https://test.com/recording',
        created_at: new Date().toISOString(),
      }])
      .select();

    if (fullError) {
      console.error('❌ Full insert failed:', fullError);
      return NextResponse.json({ 
        success: false, 
        step: 'full_insert',
        error: fullError.message,
        details: fullError,
        minimalInsertWorked: true,
        hint: 'Some columns may not exist. Run ALTER TABLE commands to add missing columns.'
      }, { status: 500 });
    }

    console.log('✅ Step 3 passed: Full insert successful');
    console.log('✅ Inserted ID:', fullData[0].id);

    // Step 4: Verify we can read it back
    console.log('🧪 Step 4: Reading back data...');
    
    const { data: readData, error: readError } = await supabase
      .from('calls')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (readError) {
      console.error('❌ Read failed:', readError);
      return NextResponse.json({ 
        success: false, 
        step: 'read_back',
        error: readError.message,
        insertWorked: true,
        hint: 'Insert worked but read failed. This is unusual.'
      }, { status: 500 });
    }

    console.log('✅ Step 4 passed: Can read back data');
    console.log(`✅ Found ${readData?.length || 0} calls for user`);

    return NextResponse.json({ 
      success: true,
      message: 'All verification tests passed!',
      results: {
        tableAccessible: true,
        minimalInsertWorks: true,
        fullInsertWorks: true,
        readBackWorks: true,
        totalCallsForUser: readData?.length || 0,
        lastInsertedIds: [minimalData[0].id, fullData[0].id],
        recentCalls: readData?.slice(0, 3).map((c: any) => ({
          id: c.id,
          contact_name: c.contact_name,
          outcome: c.outcome,
          created_at: c.created_at
        }))
      }
    });

  } catch (error: any) {
    console.error('❌ Verification test failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Verification failed',
        details: error
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Verify Insert Endpoint',
    description: 'Tests if database inserts are working',
    method: 'POST',
    body: { userId: 'your-user-id' }
  });
}

