-- Add is_qualified column to track data quality
-- Run this in your Supabase SQL Editor

ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_qualified BOOLEAN DEFAULT true;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_leads_is_qualified ON leads(is_qualified);

-- Set existing leads to qualified by default (assume they were good)
UPDATE leads SET is_qualified = true WHERE is_qualified IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name = 'is_qualified';

