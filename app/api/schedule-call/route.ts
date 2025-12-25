import { NextRequest, NextResponse } from 'next/server';

// Force dynamic
export const dynamic = 'force-dynamic';

const CAL_API_KEY = process.env.CAL_API_KEY || 'cal_live_b1fba7b98510e5ab31c20ff7bfe38475';
const EVENT_TYPE_ID = 4236738;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, startTime, timeZone } = body;
    
    // Use user's timezone - default to EST if not provided
    const userTimezone = timeZone || 'America/New_York';

    console.log('Booking request:', { name, email, startTime, userTimezone });

    if (!name || !email || !startTime) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, startTime' },
        { status: 400 }
      );
    }

    // Try Cal.com API v1 first (apiKey as query param)
    const urlV1 = `https://api.cal.com/v1/bookings?apiKey=${CAL_API_KEY}`;
    
    let response = await fetch(urlV1, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventTypeId: EVENT_TYPE_ID,
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
          'Authorization': `Bearer ${CAL_API_KEY}`,
        },
        body: JSON.stringify({
          eventTypeId: EVENT_TYPE_ID,
          start: startTime,
          attendee: {
            name: name,
            email: email,
            timeZone: userTimezone, // Use the user's timezone
            language: 'en',
          },
          metadata: {
            phone: phone || '',
          },
          guests: [],
        }),
      });
      
      data = await response.json();
    }

    if (!response.ok) {
      console.error('Cal.com API error:', data);
      return NextResponse.json(
        { error: data.message || 'Failed to create booking', details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      booking: data,
      message: 'Booking confirmed!'
    });

  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

