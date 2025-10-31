import { NextResponse } from 'next/server';

// Mock N8N endpoint for testing
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log('🧪 Mock N8N received:', payload);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock response - same format N8N should send
    const mockResponse = {
      status: 'finished',
      callsMade: payload.dailyCallLimit || 5,
      message: 'Mock test completed successfully',
      sessionId: payload.sessionId,
    };

    console.log('🧪 Mock N8N responding with:', mockResponse);

    return NextResponse.json(mockResponse);
  } catch (error: any) {
    console.error('❌ Mock N8N error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

