-- Migration: Add timezone and confirmation_email to user_retell_config
-- Version: 24
-- Date: 2024-12-22

-- Add timezone column (for Retell dynamic variable like {{current_time_America/New_York}})
ALTER TABLE user_retell_config
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';

COMMENT ON COLUMN user_retell_config.timezone IS 'User timezone for Retell (e.g., America/New_York, America/Los_Angeles)';

-- Add confirmation_email column (for appointment confirmations)
ALTER TABLE user_retell_config
ADD COLUMN IF NOT EXISTS confirmation_email TEXT NULL;

COMMENT ON COLUMN user_retell_config.confirmation_email IS 'Email address to send appointment confirmations to';

-- Update existing rows to have default timezone if NULL
UPDATE user_retell_config 
SET timezone = 'America/New_York' 
WHERE timezone IS NULL;

