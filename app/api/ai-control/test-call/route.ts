import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Trigger the next-call endpoint (use localhost for internal API calls)
    const baseUrl = 'http://localhost:3000';
    
    console.log('🧪 Test Call: Calling next-call endpoint...');
    const response = await fetch(`${baseUrl}/api/ai-control/next-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    });

    console.log('🧪 Test Call: Response status:', response.status);
    
    // Try to parse as JSON, but handle HTML responses
    const contentType = response.headers.get('content-type');
    let result: any;
    
    if (contentType?.includes('application/json')) {
      result = await response.json();
    } else {
      const text = await response.text();
      console.log('🧪 Test Call: Non-JSON response:', text.substring(0, 200));
      result = { error: 'Server returned non-JSON response', raw: text.substring(0, 500) };
    }

    if (!response.ok) {
      console.error('🧪 Test Call: Failed with result:', result);
      return NextResponse.json({
        error: result.error || 'Failed to make call',
        details: result,
      }, { status: response.status });
    }

    console.log('🧪 Test Call: SUCCESS!', result);
    return NextResponse.json({
      success: true,
      message: 'Call initiated successfully! Check your phone!',
      call_id: result.call?.call_id,
      details: result,
    });
  } catch (error: any) {
    console.error('🧪 Test Call: Exception:', error);
    return NextResponse.json({
      error: error.message || 'Unknown error',
      details: error.stack,
    }, { status: 500 });
  }
}

