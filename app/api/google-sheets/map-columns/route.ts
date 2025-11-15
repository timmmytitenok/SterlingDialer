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

    const { sheetId, columnMapping, minLeadAgeDays } = await request.json();

    if (!sheetId || !columnMapping) {
      return NextResponse.json({ error: 'Sheet ID and column mapping required' }, { status: 400 });
    }

    // Convert column indices to letters (return null if -1)
    const colToLetter = (col: number) => col >= 0 ? String.fromCharCode(65 + col) : null;

    // Update the sheet configuration with column mappings and lead age setting
    const { error } = await supabase
      .from('user_google_sheets')
      .update({
        name_column: colToLetter(columnMapping.name),
        phone_column: colToLetter(columnMapping.phone),
        email_column: colToLetter(columnMapping.email),
        state_column: colToLetter(columnMapping.state),
        lead_date_column: colToLetter(columnMapping.date),
        min_lead_age_days: minLeadAgeDays || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sheetId)
      .eq('user_id', user.id);

    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration saved successfully',
    });

  } catch (error: any) {
    console.error('❌ Error saving column mapping:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save column mapping' },
      { status: 500 }
    );
  }
}

