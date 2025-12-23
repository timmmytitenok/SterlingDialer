import { NextRequest, NextResponse } from 'next/server';

// Force dynamic - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CAL_API_KEY = process.env.CAL_API_KEY || 'cal_live_b1fba7b98510e5ab31c20ff7bfe38475';
const EVENT_TYPE_ID = 4236738;
const CAL_USERNAME = 'timmy-titenok-2ihn8s';
const CAL_EVENT_SLUG = 'consultation';

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

    let data: any = null;
    let success = false;

    // Method 1: Try Cal.com PUBLIC slots API (no auth needed for public event types)
    try {
      const publicUrl = `https://cal.com/api/trpc/public/slots.getSchedule?input=${encodeURIComponent(JSON.stringify({
        json: {
          isTeamEvent: false,
          usernameList: [CAL_USERNAME],
          eventTypeSlug: CAL_EVENT_SLUG,
          startTime: startDate,
          endTime: endDate,
          timeZone: 'America/New_York',
        }
      }))}`;
      
      console.log('Trying Cal.com public API...');
      
      const response = await fetch(publicUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });
      
      if (response.ok) {
        data = await response.json();
        console.log('Public API success:', JSON.stringify(data, null, 2));
        success = true;
      } else {
        console.log('Public API failed with status:', response.status);
      }
    } catch (err) {
      console.log('Public API error:', err);
    }

    // Method 2: Try the simple public slots endpoint
    if (!success) {
      try {
        const simpleUrl = `https://cal.com/api/slots?eventTypeId=${EVENT_TYPE_ID}&startTime=${encodeURIComponent(startDate)}&endTime=${encodeURIComponent(endDate)}`;
        
        console.log('Trying simple public slots API...');
        
        const response = await fetch(simpleUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });
        
        if (response.ok) {
          data = await response.json();
          console.log('Simple API success:', JSON.stringify(data, null, 2));
          success = true;
        } else {
          console.log('Simple API failed with status:', response.status);
        }
      } catch (err) {
        console.log('Simple API error:', err);
      }
    }

    // Method 3: Try v1 API with key
    if (!success) {
      try {
        const urlV1 = `https://api.cal.com/v1/slots?apiKey=${CAL_API_KEY}&eventTypeId=${EVENT_TYPE_ID}&startTime=${encodeURIComponent(startDate)}&endTime=${encodeURIComponent(endDate)}`;
        
        console.log('Trying Cal.com v1 API...');
        
        const response = await fetch(urlV1, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });
        
        data = await response.json();
        console.log('V1 API response:', response.status, JSON.stringify(data, null, 2));
        success = response.ok;
      } catch (err) {
        console.log('V1 API error:', err);
      }
    }

    if (!success || !data) {
      return NextResponse.json({
        success: false,
        error: 'Could not fetch availability from Cal.com',
        slots: [],
      });
    }

    // Parse slots from Cal.com response
    // Public API returns: { result: { data: { json: { slots: { "2024-01-15": [{ time: "..." }] } } } } }
    // V1 API returns: { slots: { "2024-01-15": [{ time: "..." }] } }
    let slots: string[] = [];
    
    // Try different response formats
    const slotsData = 
      data?.result?.data?.json?.slots || 
      data?.data?.slots || 
      data?.slots || 
      {};
    
    console.log('Slots data extracted:', slotsData);
    
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
      slotsData.forEach((slot: any) => {
        if (typeof slot === 'string') {
          slots.push(slot);
        } else if (slot.time) {
          slots.push(slot.time);
        }
      });
    }

    console.log('Final parsed slots:', slots);

    return NextResponse.json({
      success: true,
      slots: slots,
      raw: data,
    });

  } catch (error) {
    console.error('Availability error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
