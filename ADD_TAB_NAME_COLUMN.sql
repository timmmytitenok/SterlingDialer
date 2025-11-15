-- Add tab_name column to store which specific sheet/tab to import from
ALTER TABLE user_google_sheets ADD COLUMN IF NOT EXISTS tab_name TEXT;

-- Add comment
COMMENT ON COLUMN user_google_sheets.tab_name IS 'The specific tab/sheet name within the Google Sheets file (e.g. Sheet1, Sheet2)';
