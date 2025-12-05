-- ============================================================================
-- FIX: Allow Same Tab Name from Different Google Sheets
-- ============================================================================
-- Problem: Users were blocked from connecting "Sheet1" from a different
-- Google Sheets file if they already had a "Sheet1" from another file.
--
-- Solution: Add a unique constraint on (user_id, sheet_id, tab_name) instead
-- of blocking all duplicate tab names globally. This allows:
-- ✅ Same tab name from DIFFERENT Google Sheets (e.g., Sheet1 from SheetA and Sheet1 from SheetB)
-- ❌ Same tab from the SAME Google Sheet twice (duplicate connections)
-- ============================================================================

-- Drop any existing constraint that might be too restrictive
-- (This won't error if the constraint doesn't exist)
ALTER TABLE user_google_sheets 
DROP CONSTRAINT IF EXISTS unique_user_tab_name;

ALTER TABLE user_google_sheets 
DROP CONSTRAINT IF EXISTS unique_user_sheet_tab;

-- Add the correct unique constraint
-- This prevents: Same user + Same Google Sheet ID + Same Tab Name
-- This allows: Same tab name from different Google Sheets
ALTER TABLE user_google_sheets 
ADD CONSTRAINT unique_user_sheet_tab 
UNIQUE (user_id, sheet_id, tab_name);

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_google_sheets_sheet_tab 
ON user_google_sheets(user_id, sheet_id, tab_name);

-- ============================================================================
-- EXPLANATION
-- ============================================================================
-- Now users can:
-- ✅ Connect "Sheet1" from Google Sheet A
-- ✅ Connect "Sheet1" from Google Sheet B (different sheet_id)
-- ✅ Connect "Sheet2" from Google Sheet A
-- ❌ Connect "Sheet1" from Google Sheet A twice (duplicate)
--
-- The constraint checks the combination of (user_id, sheet_id, tab_name),
-- not just tab_name alone.
-- ============================================================================

