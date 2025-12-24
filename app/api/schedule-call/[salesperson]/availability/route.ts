import { NextRequest, NextResponse } from 'next/server';
import { getSalesperson } from '@/lib/salesperson-config';

// Force dynamic - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

export async function GET(
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
      console.log(`⚠️ Cal.com not configured for ${config.name}:`, {
        isActive: config.isActive,
        hasApiKey: !!calApiKey,
        eventTypeId: config.calEventTypeId,
      });
      return NextResponse.json({
        success: false,
        error: 'Cal.com not configured for this salesperson',
        slots: [],
      });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    console.log(`📅 Availability request for ${config.name}:`, { startDate, endDate, eventTypeId: config.calEventTypeId });

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing startDate or endDate' },
        { status: 400 }
      );
    }

    const eventTypeId = parseInt(config.calEventTypeId);

    let data: any = null;
    let success = false;

    // Method 1: Try the simple public slots endpoint
    try {
      const simpleUrl = `https://cal.com/api/slots?eventTypeId=${eventTypeId}&startTime=${encodeURIComponent(startDate)}&endTime=${encodeURIComponent(endDate)}`;
      
      console.log(`Trying simple public slots API for ${config.name}...`);
      
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

    // Method 2: Try v1 API with key
    if (!success) {
      try {
        const urlV1 = `https://api.cal.com/v1/slots?apiKey=${calApiKey}&eventTypeId=${eventTypeId}&startTime=${encodeURIComponent(startDate)}&endTime=${encodeURIComponent(endDate)}`;
        
        console.log(`Trying Cal.com v1 API for ${config.name}...`);
        
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
        error: `Could not fetch availability for ${config.name} from Cal.com`,
        slots: [],
      });
    }

    // Parse slots from Cal.com response
    let slots: string[] = [];
    
    const slotsData = 
      data?.result?.data?.json?.slots || 
      data?.data?.slots || 
      data?.slots || 
      {};
    
    console.log('Slots data extracted:', slotsData);
    
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

    console.log(`✅ Found ${slots.length} available slots for ${config.name}`);

    return NextResponse.json({
      success: true,
      slots: slots,
      salesperson: config.name,
    });

  } catch (error) {
    console.error('Availability error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

