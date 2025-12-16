import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const recordingUrl = searchParams.get('url');

    if (!recordingUrl) {
      return NextResponse.json(
        { error: 'Recording URL is required' },
        { status: 400 }
      );
    }

    // Decode the URL (it should be passed encoded)
    const decodedUrl = decodeURIComponent(recordingUrl);
    
    console.log('🎧 Streaming recording from:', decodedUrl);

    // Fetch the audio from the source
    const response = await fetch(decodedUrl, {
      headers: {
        // Pass through range headers for seeking support
        ...(request.headers.get('range') && {
          'Range': request.headers.get('range')!,
        }),
      },
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch recording:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch recording' },
        { status: response.status }
      );
    }

    // Get content type from response or default to audio/mpeg
    const contentType = response.headers.get('content-type') || 'audio/mpeg';
    const contentLength = response.headers.get('content-length');
    const contentRange = response.headers.get('content-range');
    const acceptRanges = response.headers.get('accept-ranges');

    // Create response headers
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };

    // Add content length if available
    if (contentLength) {
      headers['Content-Length'] = contentLength;
    }

    // Add range support headers
    if (acceptRanges) {
      headers['Accept-Ranges'] = acceptRanges;
    }

    if (contentRange) {
      headers['Content-Range'] = contentRange;
    }

    // Stream the response body
    const body = response.body;

    if (!body) {
      return NextResponse.json(
        { error: 'No audio data received' },
        { status: 500 }
      );
    }

    // Return streaming response
    return new Response(body, {
      status: response.status,
      headers,
    });
  } catch (error: any) {
    console.error('❌ Error streaming recording:', error);
    return NextResponse.json(
      { error: 'Failed to stream recording', details: error.message },
      { status: 500 }
    );
  }
}

