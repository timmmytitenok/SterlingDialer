import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user's Cal.ai API key
    // First check if there's a userId query param (for admin testing)
    const { searchParams } = new URL(request.url);
    const testUserId = searchParams.get('userId');
    const targetUserId = testUserId || user.id;
    
    console.log(`Looking for Cal.ai API key for user: ${targetUserId}`);
    
    const { data: retellConfig, error: configError } = await supabase
      .from('user_retell_config')
      .select('cal_ai_api_key')
      .eq('user_id', targetUserId)
      .maybeSingle();
    
    if (configError) {
      console.error('Error fetching config:', configError);
    }
    
    console.log('Retell config found:', retellConfig);

    const CAL_API_KEY = retellConfig?.cal_ai_api_key;

    if (!CAL_API_KEY) {
      return NextResponse.json({ 
        error: 'No Cal.ai API key configured',
        message: 'Go to Admin > User Management > [Your User] and add your Cal.ai API key'
      }, { status: 400 });
    }

    // Fetch recent bookings from Cal.ai
    const calResponse = await fetch(
      `https://api.cal.com/v1/bookings?apiKey=${CAL_API_KEY}&status=accepted`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!calResponse.ok) {
      const errorText = await calResponse.text();
      return NextResponse.json({ 
        error: 'Cal.ai API error',
        status: calResponse.status,
        details: errorText
      }, { status: 500 });
    }

    const calData = await calResponse.json();

    // Sort by creation date (newest first)
    const sortedBookings = (calData.bookings || []).sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Analyze each booking
    const analyzedBookings = sortedBookings.slice(0, 10).map((booking: any) => {
      const startTimeRaw = booking.startTime;
      const startTimeDate = new Date(startTimeRaw);
      
      return {
        id: booking.id,
        uid: booking.uid,
        title: booking.title,
        status: booking.status,
        
        // RAW time data from Cal.ai
        startTime_raw: startTimeRaw,
        endTime_raw: booking.endTime,
        
        // Parsed time data
        startTime_parsed: {
          iso: startTimeDate.toISOString(),
          utc: startTimeDate.toUTCString(),
          eastern: startTimeDate.toLocaleString('en-US', { timeZone: 'America/New_York' }),
          pacific: startTimeDate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }),
          central: startTimeDate.toLocaleString('en-US', { timeZone: 'America/Chicago' }),
          local_server: startTimeDate.toLocaleString(),
        },
        
        // Attendee info
        attendees: booking.attendees?.map((a: any) => ({
          name: a.name,
          email: a.email,
          phone: a.phone,
          timeZone: a.timeZone,
        })),
        
        // Event type
        eventType: booking.eventType?.title,
        
        // When was this booking created
        createdAt: booking.createdAt,
        createdAt_parsed: new Date(booking.createdAt).toLocaleString('en-US', { timeZone: 'America/New_York' }),
        
        // Responses (form fields)
        responses: booking.responses,
      };
    });

    return NextResponse.json({
      total_bookings: calData.bookings?.length || 0,
      showing: analyzedBookings.length,
      server_time: {
        utc: new Date().toUTCString(),
        iso: new Date().toISOString(),
        eastern: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }),
      },
      bookings: analyzedBookings,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

