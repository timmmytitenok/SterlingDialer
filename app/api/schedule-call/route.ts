import { NextRequest, NextResponse } from 'next/server';

const CAL_API_KEY = process.env.CAL_API_KEY || 'cal_live_b1fba7b98510e5ab31c20ff7bfe38475';
const EVENT_TYPE_ID = 4236738;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, startTime } = body;

    if (!name || !email || !startTime) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, startTime' },
        { status: 400 }
      );
    }

    // Cal.com API v2 booking endpoint
    const response = await fetch('https://api.cal.com/v2/bookings', {
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
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: 'en',
        },
        metadata: {
          phone: phone || '',
        },
        guests: [],
      }),
    });

    const data = await response.json();

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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

