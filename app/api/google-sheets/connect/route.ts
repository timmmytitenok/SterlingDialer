import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sheetUrl } = body;

    if (!sheetUrl) {
      return NextResponse.json({ error: 'Sheet URL is required' }, { status: 400 });
    }

    // Extract sheet ID from URL
    // URLs look like: https://docs.google.com/spreadsheets/d/SHEET_ID/edit...
    const sheetIdMatch = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    
    if (!sheetIdMatch) {
      return NextResponse.json({ 
        error: 'Invalid Google Sheets URL. Please copy the full URL from your browser.' 
      }, { status: 400 });
    }

    const sheetId = sheetIdMatch[1];

    // Note: We allow the same sheet to be connected multiple times
    // (users can import different tabs/sheets from the same Google Sheets file)

    // Get Google Service Account credentials
    const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    
    if (!credentials) {
      return NextResponse.json({ 
        error: 'Google Sheets integration not configured.' 
      }, { status: 500 });
    }

    const serviceAccountKey = JSON.parse(credentials);

    // Authenticate with Google
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch the actual sheet name from Google Sheets
    let actualSheetName = 'Untitled';
    try {
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: sheetId,
      });
      actualSheetName = spreadsheet.data.properties?.title || 'Untitled';
    } catch (error: any) {
      console.error('Error fetching sheet name:', error);
      // If we can't fetch the name, we'll use a default but still continue
      if (error.code === 403) {
        return NextResponse.json({ 
          error: 'Permission denied. Make sure you shared the Google Sheet with sterlingdailer@sterlingdialer.iam.gserviceaccount.com as Editor.' 
        }, { status: 403 });
      }
    }

    // Create new connection with actual sheet name
    const { data, error } = await supabase
      .from('user_google_sheets')
      .insert({
        user_id: user.id,
        sheet_id: sheetId,
        sheet_url: sheetUrl,
        sheet_name: actualSheetName,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: `Google Sheet "${actualSheetName}" connected successfully!`,
      sheet: data,
      sheetId: data.sheet_id,
      sheetName: data.sheet_name
    });
  } catch (error: any) {
    console.error('Error connecting Google Sheet:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to connect Google Sheet' },
      { status: 500 }
    );
  }
}

// Get connected sheet
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: sheet } = await supabase
      .from('user_google_sheets')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    return NextResponse.json({ sheet });
  } catch (error: any) {
    console.error('Error fetching Google Sheet:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Google Sheet' },
      { status: 500 }
    );
  }
}

