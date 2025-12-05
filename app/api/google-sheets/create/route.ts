import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sheetUrl, googleSheetId, sheetName, tabName, columnMapping, minLeadAgeDays } = await request.json();

    if (!sheetUrl || !googleSheetId || !columnMapping) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if this specific tab from this specific sheet is already connected
    if (tabName) {
      const { data: existingConnection } = await supabase
        .from('user_google_sheets')
        .select('id, sheet_name, tab_name')
        .eq('user_id', user.id)
        .eq('sheet_id', googleSheetId)
        .eq('tab_name', tabName)
        .eq('is_active', true)
        .maybeSingle();

      if (existingConnection) {
        return NextResponse.json({
          error: `You've already connected the "${tabName}" tab from this Google Sheet. Each tab can only be connected once per sheet.`,
        }, { status: 400 });
      }
    }

    // Convert column indices to letters (return null if -1)
    const colToLetter = (col: number) => col >= 0 ? String.fromCharCode(65 + col) : null;

    // Create the sheet record in database
    // Store sheet_name and tab_name separately (don't combine them)
    const insertData: any = {
      user_id: user.id,
      sheet_id: googleSheetId,
      sheet_name: sheetName, // Just the main Google Sheet name
      tab_name: tabName || null, // Individual tab name stored separately
      sheet_url: sheetUrl,
      name_column: colToLetter(columnMapping.name),
      phone_column: colToLetter(columnMapping.phone),
      email_column: colToLetter(columnMapping.email),
      state_column: colToLetter(columnMapping.state),
      lead_date_column: colToLetter(columnMapping.date),
      min_lead_age_days: minLeadAgeDays || 0,
      is_active: true,
    };

    const { data: sheet, error } = await supabase
      .from('user_google_sheets')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      
      // Handle unique constraint violation with a friendly message
      if (error.code === '23505') {
        return NextResponse.json({
          error: `This tab "${tabName || 'default'}" from this Google Sheet is already connected. Each tab can only be connected once per sheet.`,
        }, { status: 400 });
      }
      
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Sheet connected successfully',
      sheetId: sheet.id,
    });

  } catch (error: any) {
    console.error('❌ Error creating sheet:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create sheet' },
      { status: 500 }
    );
  }
}

