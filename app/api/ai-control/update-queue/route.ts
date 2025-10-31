import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('📨 Update queue endpoint called');
    
    const body = await request.json();
    console.log('📦 Received body:', body);

    const { userId } = body;

    if (!userId) {
      console.log('❌ Missing required field: userId');
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Use service role client since this is called from N8N (no user session)
    const supabase = createServiceRoleClient();

    console.log(`✅ Request acknowledged for user ${userId}`);

    return NextResponse.json({ success: true, userId });
  } catch (error: any) {
    console.error('❌ Error processing request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'Update Queue Endpoint',
    method: 'POST',
    expectedBody: {
      userId: 'uuid'
    }
  });
}

