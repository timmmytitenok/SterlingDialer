import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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

    const { sheetUrl } = await request.json();

    if (!sheetUrl) {
      return NextResponse.json({ error: 'Sheet URL is required' }, { status: 400 });
    }

    // Extract sheet ID from URL
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
    let sheetName = 'Google Sheet';
    try {
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: sheetId,
      });
      sheetName = spreadsheet.data.properties?.title || 'Google Sheet';
    } catch (error: any) {
      console.error('Error fetching sheet name:', error);
      if (error.code === 403) {
        return NextResponse.json({ 
          error: 'Permission denied. Make sure you shared the Google Sheet with sterlingdailer@sterlingdialer.iam.gserviceaccount.com as Editor.' 
        }, { status: 403 });
      }
      // If we can't fetch the name, continue with default name
    }

    return NextResponse.json({
      success: true,
      sheetId,
      sheetName,
    });

  } catch (error: any) {
    console.error('❌ Error validating sheet:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to validate sheet' },
      { status: 500 }
    );
  }
}

