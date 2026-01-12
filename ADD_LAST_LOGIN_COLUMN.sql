-- =====================================================
-- ADD LAST_LOGIN COLUMN TO SALES_TEAM TABLE
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add last_login column if it doesn't exist
ALTER TABLE sales_team ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Optionally, set initial last_login to created_at for existing members
UPDATE sales_team 
SET last_login = created_at 
WHERE last_login IS NULL;

SELECT 'last_login column added successfully!' as status;
TW