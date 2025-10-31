import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('🏁 N8N automation completed - received callback');
    
    const body = await request.json();
    console.log('📦 Completion data:', body);

    const { userId, callsMade, status } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    console.log(`🔄 Updating AI status to stopped for user: ${userId}`);
    console.log(`📊 Total calls made: ${callsMade || 0}`);

    // Update AI status to stopped
    const { data, error } = await supabase
      .from('ai_control_settings')
      .update({ 
        status: 'stopped',
        queue_length: callsMade || 0
      })
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error('❌ Error updating status:', error);
      throw error;
    }

    console.log('✅ AI status updated to stopped');
    console.log('✅ Final call count:', callsMade || 0);

    return NextResponse.json({
      success: true,
      message: 'AI automation completed successfully',
      callsMade: callsMade || 0,
      updatedSettings: data
    });
  } catch (error: any) {
    console.error('❌ Error handling completion:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete automation' },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/ai-control/complete',
    method: 'POST',
    description: 'Called by N8N when automation finishes to update AI status',
    requiredFields: {
      userId: 'UUID of user',
      callsMade: 'Number of calls completed',
      status: 'Should be "finished" or "completed"'
    },
    example: {
      userId: 'abc-123-def',
      callsMade: 50,
      status: 'finished'
    }
  });
}

