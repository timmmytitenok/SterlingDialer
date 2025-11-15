import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(request: Request) {
  try {
    const { sheetId } = await request.json();

    if (!sheetId) {
      return NextResponse.json({ error: 'Sheet ID required' }, { status: 400 });
    }

    const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!credentials) {
      return NextResponse.json({ error: 'Google service account not configured' }, { status: 500 });
    }

    const serviceAccountKey = JSON.parse(credentials);

    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Get spreadsheet metadata to list all sheets/tabs
    const response = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });

    const sheetList = response.data.sheets?.map((sheet) => ({
      title: sheet.properties?.title || 'Untitled',
      sheetId: sheet.properties?.sheetId,
      index: sheet.properties?.index,
      rowCount: sheet.properties?.gridProperties?.rowCount || 0,
    })) || [];

    return NextResponse.json({ success: true, sheets: sheetList });
  } catch (error: any) {
    console.error('Error fetching sheet tabs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sheet tabs' },
      { status: 500 }
    );
  }
}

