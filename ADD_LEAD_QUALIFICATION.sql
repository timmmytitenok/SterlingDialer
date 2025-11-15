-- Add is_qualified column to leads table
-- Run this in your Supabase SQL Editor

ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_qualified BOOLEAN DEFAULT true;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_leads_is_qualified ON leads(is_qualified);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name = 'is_qualified';

