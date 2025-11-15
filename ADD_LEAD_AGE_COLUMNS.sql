-- Add columns for lead age management to user_google_sheets table
-- Run this in your Supabase SQL Editor

ALTER TABLE user_google_sheets ADD COLUMN IF NOT EXISTS lead_date_column TEXT;
ALTER TABLE user_google_sheets ADD COLUMN IF NOT EXISTS min_lead_age_days INTEGER DEFAULT 0;

-- Also add lead_generated_at to leads table if it doesn't exist
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_generated_at TIMESTAMPTZ;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_google_sheets' 
AND column_name IN ('lead_date_column', 'min_lead_age_days');

