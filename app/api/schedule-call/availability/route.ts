import { NextRequest, NextResponse } from 'next/server';

const CAL_API_KEY = process.env.CAL_API_KEY || 'cal_live_b1fba7b98510e5ab31c20ff7bfe38475';
const EVENT_TYPE_ID = 4236738;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing startDate or endDate' },
        { status: 400 }
      );
    }

    // Cal.com API v2 - Get available slots
    const url = `https://api.cal.com/v2/slots/available?startTime=${startDate}&endTime=${endDate}&eventTypeId=${EVENT_TYPE_ID}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'cal-api-version': '2024-08-13',
        'Authorization': `Bearer ${CAL_API_KEY}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Cal.com availability error:', data);
      return NextResponse.json(
        { error: data.message || 'Failed to fetch availability', details: data },
        { status: response.status }
      );
    }

    // Return the available slots
    return NextResponse.json({
      success: true,
      slots: data.data?.slots || data.slots || data,
    });

  } catch (error) {
    console.error('Availability error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

