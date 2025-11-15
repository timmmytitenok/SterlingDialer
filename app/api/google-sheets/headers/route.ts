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

    const { sheetId, sheetName } = await request.json();

    if (!sheetId) {
      return NextResponse.json({ error: 'Sheet ID required' }, { status: 400 });
    }

    // Get service account credentials
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

    // Read the header row - include tab name if specified
    const tabPrefix = sheetName ? `'${sheetName}'!` : '';
    const headerRange = `${tabPrefix}A1:Z1`;
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: headerRange,
    });

    const headers = headerResponse.data.values?.[0] || [];

    // Smart column detection with confidence scores
    const detectColumn = (keywords: string[], headers: string[]) => {
      const scores = headers.map((header, index) => {
        if (!header) return { index, score: 0 };
        
        const headerLower = header.toString().toLowerCase().trim();
        let score = 0;
        
        for (const keyword of keywords) {
          if (headerLower === keyword) {
            score += 100; // Exact match
          } else if (headerLower.includes(keyword)) {
            score += 50; // Partial match
          } else if (keyword.includes(headerLower) && headerLower.length > 2) {
            score += 30; // Header is substring of keyword
          }
        }
        
        return { index, score };
      });
      
      const best = scores.reduce((max, curr) => curr.score > max.score ? curr : max, { index: -1, score: 0 });
      return { index: best.index, confidence: best.score >= 50 ? 'high' : best.score > 0 ? 'medium' : 'low' };
    };

    // Detect columns with multiple keyword variations
    const detections = {
      name: detectColumn(['name', 'full name', 'fullname', 'contact', 'contact name', 'customer', 'lead name', 'first name', 'last name'], headers),
      phone: detectColumn(['phone', 'phone number', 'telephone', 'tel', 'mobile', 'cell', 'contact number', 'number'], headers),
      email: detectColumn(['email', 'e-mail', 'mail', 'email address', 'contact email', 'e mail'], headers),
      state: detectColumn(['state', 'st', 'location', 'province', 'region'], headers),
      date: detectColumn(['date', 'date generated', 'date created', 'created date', 'lead date', 'generated', 'timestamp', 'created at', 'created_at'], headers),
    };

    // Determine if we need manual mapping
            const needsManualMapping = 
              detections.name.confidence === 'low' || 
              detections.phone.confidence === 'low' ||
              detections.name.index === -1 ||
              detections.phone.index === -1;

    return NextResponse.json({
      success: true,
      headers: headers.map((h, i) => ({ index: i, name: h || `Column ${String.fromCharCode(65 + i)}` })),
      detections,
      needsManualMapping,
    });

  } catch (error: any) {
    console.error('❌ Error fetching headers:', error);
    
    if (error.code === 403) {
      return NextResponse.json({ 
        error: 'Permission denied. Make sure you shared the Google Sheet with the service account.' 
      }, { status: 403 });
    }
    
    if (error.code === 404) {
      return NextResponse.json({ 
        error: 'Google Sheet not found.' 
      }, { status: 404 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch headers' },
      { status: 500 }
    );
  }
}

