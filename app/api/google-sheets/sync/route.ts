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

    // Get optional sheetId from request body
    const body = await request.json().catch(() => ({}));
    const { sheetId } = body;

    console.log('🔄 Starting Google Sheets sync for user:', user.id, sheetId ? `sheet: ${sheetId}` : '(all sheets)');

    // Get user's connected Google Sheet(s)
    let query = supabase
      .from('user_google_sheets')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    // If specific sheet requested, filter by it
    if (sheetId) {
      query = query.eq('id', sheetId);
    }

    const { data: sheetConfigs, error: sheetError } = await query;

    if (sheetError) throw sheetError;

    if (!sheetConfigs || sheetConfigs.length === 0) {
      return NextResponse.json({ 
        error: 'No Google Sheet connected. Please connect a sheet first.' 
      }, { status: 400 });
    }

    // For now, sync the first sheet (or the one specified)
    const sheetConfig = sheetConfigs[0];
    
    console.log('🔄 SYNC - Sheet Config lead_type:', sheetConfig.lead_type);
    console.log('🔄 SYNC - Lead Type Mapping: 1=NULL/Default, 2=FE, 3=FE Veteran, 4=Mortgage Protection');

    // Get service account credentials from environment
    const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    
    if (!credentials) {
      console.error('❌ Missing GOOGLE_SERVICE_ACCOUNT_KEY environment variable');
      return NextResponse.json({ 
        error: 'Google Sheets integration not configured. Please contact support.' 
      }, { status: 500 });
    }

    // Parse credentials
    let serviceAccountKey;
    try {
      serviceAccountKey = JSON.parse(credentials);
    } catch (e) {
      console.error('❌ Invalid GOOGLE_SERVICE_ACCOUNT_KEY format');
      return NextResponse.json({ 
        error: 'Google Sheets configuration error. Please contact support.' 
      }, { status: 500 });
    }

    // Authenticate with Google
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Helper function to convert letter to column index (A=0, B=1, etc.)
    const letterToCol = (letter: string | null) => {
      if (!letter) return -1;
      return letter.toUpperCase().charCodeAt(0) - 65;
    };

    // Check if we have saved column mappings
    let nameCol, phoneCol, emailCol, dateCol, ageCol, stateCol, statusCol, leadVendorCol, streetAddressCol;

    if (sheetConfig.name_column && sheetConfig.phone_column) {
      // Use saved column mappings
      nameCol = letterToCol(sheetConfig.name_column);
      phoneCol = letterToCol(sheetConfig.phone_column);
      emailCol = letterToCol(sheetConfig.email_column);
      dateCol = letterToCol(sheetConfig.lead_date_column);
      ageCol = letterToCol(sheetConfig.age_column);
      stateCol = letterToCol(sheetConfig.state_column);
      statusCol = letterToCol(sheetConfig.status_column);
      // Mortgage Protection columns
      leadVendorCol = letterToCol(sheetConfig.lead_vendor_column);
      streetAddressCol = letterToCol(sheetConfig.street_address_column);
      
      console.log('✅ Using saved column mappings:', { nameCol, phoneCol, emailCol, stateCol, dateCol, ageCol, statusCol, leadVendorCol, streetAddressCol });
    } else {
      // Auto-detect column positions
      const tabPrefix = sheetConfig.tab_name ? `'${sheetConfig.tab_name}'!` : '';
      const headerRange = `${tabPrefix}A1:Z1`;
      const headerResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetConfig.sheet_id,
        range: headerRange,
      });

      const headers = headerResponse.data.values?.[0] || [];
      console.log('📋 Sheet headers:', headers);

      // Smart detection with multiple keywords
      const detectColumn = (keywords: string[]) => {
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
        return best.score >= 30 ? best.index : -1;
      };

      nameCol = detectColumn(['name', 'full name', 'fullname', 'contact', 'contact name', 'customer', 'lead name', 'first name', 'last name']);
      phoneCol = detectColumn(['phone', 'phone number', 'telephone', 'tel', 'mobile', 'cell', 'contact number', 'number']);
      emailCol = detectColumn(['email', 'e-mail', 'mail', 'email address', 'contact email', 'e mail']);
      stateCol = detectColumn(['state', 'st', 'location', 'province', 'region']);
      dateCol = detectColumn(['date', 'date generated', 'date created', 'created date', 'lead date', 'generated', 'timestamp', 'created at', 'created_at']);
      ageCol = -1; // Not used anymore
      statusCol = -1; // Not used anymore
      // Mortgage Protection columns (auto-detect)
      leadVendorCol = detectColumn(['vendor', 'lead vendor', 'source', 'lead source', 'vendor name']);
      streetAddressCol = detectColumn(['address', 'street address', 'street', 'property address', 'home address']);

      console.log('🔍 Auto-detected columns:', { nameCol, phoneCol, emailCol, stateCol, dateCol, leadVendorCol, streetAddressCol });
      
      if (nameCol === -1 || phoneCol === -1) {
        console.error('❌ Could not detect required columns (Name, Phone)!');
        console.error('Headers found:', headers);
        return NextResponse.json({ 
          error: 'AUTO_DETECT_FAILED',
          message: 'Could not automatically detect required columns (Name, Phone). Please map columns manually.',
          headers: headers.map((h, i) => ({ index: i, name: h || `Column ${String.fromCharCode(65 + i)}` })),
          needsMapping: true
        }, { status: 400 });
      }
      
      if (emailCol === -1) {
        console.log('⚠️ Email column not detected - email will be optional');
      }
      
      if (stateCol === -1) {
        console.log('⚠️ State column not detected - state will be optional');
      }
    }

    // Determine range to read (read all columns and all rows, start from row 2)
    const startRow = sheetConfig.data_start_row || 2;
    
    // Include tab name if specified (e.g., 'Sheet1'!A2:Z)
    const tabPrefix = sheetConfig.tab_name ? `'${sheetConfig.tab_name}'!` : '';
    const range = `${tabPrefix}A${startRow}:Z`; // Read ALL rows, all columns (no limit)

    console.log(`📖 Reading sheet ${sheetConfig.sheet_id}, range: ${range}`);

    // Read data from sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetConfig.sheet_id,
      range: range,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log('⚠️ No data rows found in sheet (rows are empty or null)');
      return NextResponse.json({ 
        success: true,
        message: 'No data found in Google Sheet. Make sure you have data starting from row 2.',
        imported: 0,
        skipped: 0
      });
    }

    console.log(`📊 Found ${rows.length} rows in sheet`);
    console.log(`📋 Sample first row:`, rows[0]);

    // Helper function to normalize state names to abbreviations
    const normalizeState = (state: string | null): string | null => {
      if (!state || state.trim().length === 0) return null;
      
      const cleaned = state.trim().toUpperCase();
      
      // Check for invalid states (question marks, unknown, etc.)
      if (cleaned.includes('?') || cleaned === 'UNKNOWN' || cleaned === 'N/A' || cleaned === 'NA') {
        return 'N/A';
      }
      
      // State mapping: Full name to abbreviation
      const stateMap: { [key: string]: string } = {
        'ALABAMA': 'AL', 'ALASKA': 'AK', 'ARIZONA': 'AZ', 'ARKANSAS': 'AR',
        'CALIFORNIA': 'CA', 'COLORADO': 'CO', 'CONNECTICUT': 'CT', 'DELAWARE': 'DE',
        'FLORIDA': 'FL', 'GEORGIA': 'GA', 'HAWAII': 'HI', 'IDAHO': 'ID',
        'ILLINOIS': 'IL', 'INDIANA': 'IN', 'IOWA': 'IA', 'KANSAS': 'KS',
        'KENTUCKY': 'KY', 'LOUISIANA': 'LA', 'MAINE': 'ME', 'MARYLAND': 'MD',
        'MASSACHUSETTS': 'MA', 'MICHIGAN': 'MI', 'MINNESOTA': 'MN', 'MISSISSIPPI': 'MS',
        'MISSOURI': 'MO', 'MONTANA': 'MT', 'NEBRASKA': 'NE', 'NEVADA': 'NV',
        'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ', 'NEW MEXICO': 'NM', 'NEW YORK': 'NY',
        'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', 'OHIO': 'OH', 'OKLAHOMA': 'OK',
        'OREGON': 'OR', 'PENNSYLVANIA': 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC',
        'SOUTH DAKOTA': 'SD', 'TENNESSEE': 'TN', 'TEXAS': 'TX', 'UTAH': 'UT',
        'VERMONT': 'VT', 'VIRGINIA': 'VA', 'WASHINGTON': 'WA', 'WEST VIRGINIA': 'WV',
        'WISCONSIN': 'WI', 'WYOMING': 'WY', 'DISTRICT OF COLUMBIA': 'DC', 'WASHINGTON DC': 'DC',
        'PUERTO RICO': 'PR', 'GUAM': 'GU', 'US VIRGIN ISLANDS': 'VI', 'VIRGIN ISLANDS': 'VI'
      };
      
      // Check if it's already a valid 2-letter abbreviation
      const validAbbreviations = new Set(Object.values(stateMap));
      if (cleaned.length === 2 && validAbbreviations.has(cleaned)) {
        return cleaned;
      }
      
      // Try to find full state name match
      if (stateMap[cleaned]) {
        return stateMap[cleaned];
      }
      
      // If it's 2 characters but not a valid state, set to N/A
      if (cleaned.length === 2) {
        return 'N/A';
      }
      
      // Check for partial matches (e.g., "calif" → "CA")
      for (const [fullName, abbr] of Object.entries(stateMap)) {
        if (fullName.includes(cleaned) || cleaned.includes(fullName)) {
          return abbr;
        }
      }
      
      // If no match found, return N/A
      return 'N/A';
    };

    // Helper function to validate if name is actually a name (not email, not mostly numbers)
    const isValidName = (name: string): boolean => {
      if (!name || name.trim().length === 0) return false;
      
      // Check if it's an email address
      if (name.includes('@') || name.includes('.com') || name.includes('.net')) {
        return false;
      }
      
      // Check if it's mostly numbers (more than 50% digits)
      const digitCount = (name.match(/\d/g) || []).length;
      if (digitCount / name.length > 0.5) {
        return false;
      }
      
      // Check if name is too short (less than 2 characters)
      if (name.trim().length < 2) {
        return false;
      }
      
      return true;
    };

    // Helper function to validate phone number
    const isValidPhone = (phone: string): boolean => {
      if (!phone) return false;
      
      const cleanPhone = phone.replace(/\D/g, '');
      
      // US phone numbers should be 10 or 11 digits (with country code)
      // Reject if it's 12+ digits or less than 10
      if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        return false;
      }
      
      // Check if all digits are the same (like 0000000000)
      if (/^(\d)\1+$/.test(cleanPhone)) {
        return false;
      }
      
      return true;
    };

    let imported = 0;
    let skipped = 0;
    let updated = 0;
    let unqualified = 0;

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = startRow + i;

      // Extract data from columns using detected positions
      const name = nameCol >= 0 && row[nameCol] ? row[nameCol].toString().trim() : null;
      const phone = phoneCol >= 0 && row[phoneCol] ? row[phoneCol].toString().trim() : null;
      const email = emailCol >= 0 && row[emailCol] ? row[emailCol].toString().trim() : null;
      const rawState = stateCol >= 0 && row[stateCol] ? row[stateCol].toString().trim() : null;
      const state = normalizeState(rawState); // Normalize state to abbreviation
      const dateStr = dateCol >= 0 && row[dateCol] ? row[dateCol].toString().trim() : null;
      // Mortgage Protection fields
      const leadVendor = leadVendorCol >= 0 && row[leadVendorCol] ? row[leadVendorCol].toString().trim() : null;
      const streetAddress = streetAddressCol >= 0 && row[streetAddressCol] ? row[streetAddressCol].toString().trim() : null;

      // Parse date if available
      let leadGeneratedAt: Date | null = null;
      if (dateStr) {
        try {
          leadGeneratedAt = new Date(dateStr);
          // Check if date is valid
          if (isNaN(leadGeneratedAt.getTime())) {
            leadGeneratedAt = null;
          }
        } catch (e) {
          leadGeneratedAt = null;
        }
      }

      // Log first few rows for debugging
      if (i < 3) {
        console.log(`Row ${rowNumber} data:`, { name, phone, email, rawState, normalizedState: state, date: leadGeneratedAt });
      }

      // Skip if missing required fields (only name and phone are required)
      if (!name || !phone) {
        if (i < 3) {
          console.log(`⚠️ Skipping row ${rowNumber}: missing required field (name or phone)`);
        }
        skipped++;
        continue;
      }

      // Validate data quality
      const nameIsValid = isValidName(name);
      const phoneIsValid = isValidPhone(phone);
      const isQualified = nameIsValid && phoneIsValid;

      // Log validation issues for first few rows
      if (i < 5) {
        console.log(`Row ${rowNumber} validation:`, { 
          name, 
          nameIsValid, 
          phone, 
          phoneIsValid, 
          isQualified 
        });
      }

      // Clean phone number (remove formatting)
      let cleanPhone = phone.replace(/\D/g, '');

      // Still skip if phone is completely invalid (less than 10 digits)
      if (cleanPhone.length < 10) {
        console.log(`⚠️ Invalid phone number in row ${rowNumber}: ${phone}`);
        skipped++;
        continue;
      }
      
      // FORMAT TO E.164 (+1 for US numbers)
      if (cleanPhone.length === 10) {
        cleanPhone = `+1${cleanPhone}`; // Add +1 for US 10-digit numbers
      } else if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
        cleanPhone = `+${cleanPhone}`; // Add + prefix to 11-digit numbers starting with 1
      } else if (!cleanPhone.startsWith('+')) {
        cleanPhone = `+${cleanPhone}`; // Add + to any other format
      }
      
      if (i < 3) {
        console.log(`📞 Phone formatting: ${phone} → ${cleanPhone}`);
      }

      // Check if lead already exists
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('phone', cleanPhone)
        .maybeSingle();

      // Track unqualified leads
      if (!isQualified) {
        unqualified++;
      }

      if (existingLead) {
        // Update existing lead if needed
        const updateData: any = {
          name,
          email,
          state,
          google_sheet_id: sheetConfig.id,
          sheet_row_number: rowNumber,
          synced_from_sheet: true,
          is_qualified: isQualified,
          updated_at: new Date().toISOString(),
          // Lead type for AI script selection (1=NULL, 2=FE, 3=FE Veteran, 4=MP)
          lead_type: sheetConfig.lead_type || 1,
        };
        
        // Add lead_generated_at if we have a valid date
        if (leadGeneratedAt) {
          updateData.lead_generated_at = leadGeneratedAt.toISOString();
        }
        
        // Add Mortgage Protection fields if present
        if (leadVendor) updateData.lead_vendor = leadVendor;
        if (streetAddress) updateData.street_address = streetAddress;

        const { error: updateError } = await supabase
          .from('leads')
          .update(updateData)
          .eq('id', existingLead.id);

        if (updateError) {
          console.error(`❌ Error updating lead ${existingLead.id}:`, updateError);
          skipped++;
        } else {
          updated++;
        }
      } else {
        // Insert new lead with 'new' status
        const insertData: any = {
          user_id: user.id,
          name,
          phone: cleanPhone,
          email,
          state,
          status: 'new',
          google_sheet_id: sheetConfig.id,
          sheet_row_number: rowNumber,
          synced_from_sheet: true,
          is_qualified: isQualified,
          times_dialed: 0,
          // Lead type for AI script selection (1=NULL, 2=FE, 3=FE Veteran, 4=MP)
          lead_type: sheetConfig.lead_type || 1,
        };
        
        // Add lead_generated_at if we have a valid date
        if (leadGeneratedAt) {
          insertData.lead_generated_at = leadGeneratedAt.toISOString();
        }
        
        // Add Mortgage Protection fields if present
        if (leadVendor) insertData.lead_vendor = leadVendor;
        if (streetAddress) insertData.street_address = streetAddress;

        const { error: insertError} = await supabase
          .from('leads')
          .insert(insertData);

        if (insertError) {
          console.error(`❌ Error inserting lead from row ${rowNumber}:`, insertError);
          skipped++;
        } else {
          imported++;
        }
      }
    }

    // Convert column indices to letters (A, B, C, etc.)
    const colToLetter = (col: number) => col >= 0 ? String.fromCharCode(65 + col) : null;
    
    // Update last sync time and save detected column positions
    await supabase
      .from('user_google_sheets')
      .update({ 
        last_sync_at: new Date().toISOString(),
        name_column: colToLetter(nameCol) || 'A',
        phone_column: colToLetter(phoneCol) || 'B',
        email_column: colToLetter(emailCol),
        state_column: colToLetter(stateCol),
        lead_date_column: colToLetter(dateCol),
        age_column: null,
        status_column: null,
        // Mortgage Protection columns
        lead_vendor_column: colToLetter(leadVendorCol),
        street_address_column: colToLetter(streetAddressCol),
      })
      .eq('id', sheetConfig.id);

    const qualified = (imported + updated) - unqualified;
    
    console.log(`✅ Sync complete: ${imported} imported, ${updated} updated, ${skipped} skipped, ${qualified} qualified, ${unqualified} unqualified`);

    // Check total leads count to mark onboarding step 3 complete
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    console.log(`📊 User has ${totalLeads || 0} total leads`);

    // Mark onboarding step 3 complete ONLY if they have more than 1 lead
    if (totalLeads && totalLeads > 1) {
      await supabase
        .from('profiles')
        .update({ onboarding_step_3_sheet: true })
        .eq('user_id', user.id);

      console.log('✅ Onboarding Step 3 (Sheet) marked complete - user has more than 1 lead!');

      // Check if all onboarding steps are now complete
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_step_1_form, onboarding_step_2_balance, onboarding_step_3_sheet, onboarding_step_4_schedule')
        .eq('user_id', user.id)
        .single();

      const allComplete = profile?.onboarding_step_1_form &&
                          profile?.onboarding_step_2_balance &&
                          profile?.onboarding_step_3_sheet &&
                          profile?.onboarding_step_4_schedule;

      if (allComplete) {
        console.log('🎉 All onboarding steps complete! Hiding Quick Setup forever.');
        
        await supabase
          .from('profiles')
          .update({
            onboarding_all_complete: true,
            onboarding_completed_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      }
    } else {
      console.log(`⚠️ Step 3 not complete yet - user needs more than 1 lead (current: ${totalLeads || 0})`);
    }

    return NextResponse.json({ 
      success: true,
      message: `Sync complete! ${qualified} qualified leads, ${unqualified} unqualified leads.`,
      imported,
      updated,
      skipped,
      qualified,
      unqualified,
      total: rows.length
    });

  } catch (error: any) {
    console.error('❌ Error syncing Google Sheet:', error);
    
    // Handle specific Google API errors
    if (error.code === 403) {
      return NextResponse.json({ 
        error: 'Permission denied. Make sure you shared the Google Sheet with SterlingDailer@gmail.com as Editor.' 
      }, { status: 403 });
    }
    
    if (error.code === 404) {
      return NextResponse.json({ 
        error: 'Google Sheet not found. Please check the URL and try again.' 
      }, { status: 404 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to sync Google Sheet' },
      { status: 500 }
    );
  }
}

