import { NextRequest, NextResponse } from 'next/server';

// Force dynamic - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CAL_API_KEY = process.env.CAL_API_KEY || 'cal_live_b1fba7b98510e5ab31c20ff7bfe38475';
const EVENT_TYPE_ID = 4236738;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    console.log('Availability request:', { startDate, endDate, eventTypeId: EVENT_TYPE_ID });

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing startDate or endDate' },
        { status: 400 }
      );
    }

    // Cal.com API v2 - Get available slots
    // Format dates properly - Cal.com expects ISO format
    const url = `https://api.cal.com/v2/slots/available?startTime=${encodeURIComponent(startDate)}&endTime=${encodeURIComponent(endDate)}&eventTypeId=${EVENT_TYPE_ID}`;
    
    console.log('Calling Cal.com API:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'cal-api-version': '2024-08-13',
        'Authorization': `Bearer ${CAL_API_KEY}`,
      },
      cache: 'no-store', // Don't cache availability
    });

    const data = await response.json();
    console.log('Cal.com response status:', response.status);
    console.log('Cal.com response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('Cal.com availability error:', data);
      return NextResponse.json(
        { error: data.message || 'Failed to fetch availability', details: data },
        { status: response.status }
      );
    }

    // Parse slots from Cal.com response
    // Cal.com v2 returns: { status: "success", data: { slots: { "2024-01-15": [{ time: "..." }] } } }
    let slots: string[] = [];
    
    const slotsData = data.data?.slots || data.slots || {};
    console.log('Slots data:', slotsData);
    
    // If it's an object with date keys
    if (typeof slotsData === 'object' && !Array.isArray(slotsData)) {
      Object.entries(slotsData).forEach(([date, daySlots]: [string, any]) => {
        if (Array.isArray(daySlots)) {
          daySlots.forEach((slot: any) => {
            if (typeof slot === 'string') {
              slots.push(slot);
            } else if (slot.time) {
              slots.push(slot.time);
            }
          });
        }
      });
    } else if (Array.isArray(slotsData)) {
      // If it's already an array
      slotsData.forEach((slot: any) => {
        if (typeof slot === 'string') {
          slots.push(slot);
        } else if (slot.time) {
          slots.push(slot.time);
        }
      });
    }

    console.log('Parsed slots:', slots);

    return NextResponse.json({
      success: true,
      slots: slots,
      raw: data, // Include raw data for debugging
    });

  } catch (error) {
    console.error('Availability error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

