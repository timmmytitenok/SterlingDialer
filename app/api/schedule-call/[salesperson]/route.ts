import { NextRequest, NextResponse } from 'next/server';
import { getSalesperson } from '@/lib/salesperson-config';

// Force dynamic
export const dynamic = 'force-dynamic';

// Get API key for salesperson (read from env at runtime)
function getCalApiKey(slug: string): string | null {
  const envKey = `${slug.toUpperCase()}_CAL_API_KEY`;
  const apiKey = process.env[envKey];
  
  // Fallback for local development
  const fallbacks: Record<string, string> = {
    wardy: 'cal_live_b1a3def14790850edca137de6660e62f',
  };
  
  console.log(`🔑 Looking for ${envKey}: ${apiKey ? 'FOUND' : 'NOT FOUND, using fallback'}`);
  
  return apiKey || fallbacks[slug.toLowerCase()] || null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ salesperson: string }> }
) {
  try {
    const { salesperson: salespersonSlug } = await params;
    const config = getSalesperson(salespersonSlug);

    if (!config) {
      return NextResponse.json(
        { error: 'Salesperson not found' },
        { status: 404 }
      );
    }

    // Get API key at runtime (not from config which is build-time)
    const calApiKey = getCalApiKey(salespersonSlug);

    if (!config.isActive || !calApiKey || !config.calEventTypeId) {
      return NextResponse.json(
        { error: 'Cal.com not configured for this salesperson' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, email, phone, startTime, timeZone } = body;
    
    // Use user's timezone - default to salesperson's timezone if not provided
    const userTimezone = timeZone || config.timezone || 'America/New_York';

    console.log(`📅 Booking request for ${config.name}:`, { name, email, startTime, userTimezone });

    if (!name || !email || !startTime) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, startTime' },
        { status: 400 }
      );
    }

    const eventTypeId = parseInt(config.calEventTypeId);

    // Try Cal.com API v1 first (apiKey as query param)
    const urlV1 = `https://api.cal.com/v1/bookings?apiKey=${calApiKey}`;
    
    console.log(`📞 Creating booking for ${config.name}'s calendar (Event ID: ${eventTypeId})`);
    
    let response = await fetch(urlV1, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventTypeId: eventTypeId,
        start: startTime,
        responses: {
          name: name,
          email: email,
          notes: phone ? `Phone: ${phone}` : '',
        },
        timeZone: userTimezone, // Use the user's timezone
        language: 'en',
        metadata: {
          phone: phone || '',
          bookedWith: config.name,
        },
      }),
    });

    let data = await response.json();
    
    // If v1 fails with 401, try v2
    if (!response.ok && response.status === 401) {
      console.log('V1 booking failed, trying V2...');
      
      response = await fetch('https://api.cal.com/v2/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cal-api-version': '2024-08-13',
          'Authorization': `Bearer ${calApiKey}`,
        },
        body: JSON.stringify({
          eventTypeId: eventTypeId,
          start: startTime,
          attendee: {
            name: name,
            email: email,
            timeZone: userTimezone, // Use the user's timezone
            language: 'en',
          },
          metadata: {
            phone: phone || '',
            bookedWith: config.name,
          },
          guests: [],
        }),
      });
      
      data = await response.json();
    }

    if (!response.ok) {
      console.error(`❌ Cal.com API error for ${config.name}:`, data);
      return NextResponse.json(
        { error: data.message || 'Failed to create booking', details: data },
        { status: response.status }
      );
    }

    console.log(`✅ Booking confirmed for ${config.name}!`);

    return NextResponse.json({
      success: true,
      booking: data,
      message: `Booking confirmed with ${config.name}!`,
      salesperson: config.name,
    });

  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

