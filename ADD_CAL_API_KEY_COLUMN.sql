-- Add Cal.ai API key column to user_retell_config table
-- Run this in Supabase SQL Editor

ALTER TABLE user_retell_config ADD COLUMN IF NOT EXISTS cal_api_key TEXT;

-- Verify it was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_retell_config' 
AND column_name = 'cal_api_key';

