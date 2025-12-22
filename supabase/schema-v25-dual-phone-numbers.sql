-- Migration v25: Add separate phone numbers for Final Expense and Mortgage Protection
-- This allows users to have different caller IDs for different lead types

-- Add phone_number_fe (Final Expense) column
ALTER TABLE user_retell_config
ADD COLUMN IF NOT EXISTS phone_number_fe TEXT NULL;

COMMENT ON COLUMN user_retell_config.phone_number_fe IS 'Phone number used for Final Expense leads (lead_type 2 and 3)';

-- Add phone_number_mp (Mortgage Protection) column
ALTER TABLE user_retell_config
ADD COLUMN IF NOT EXISTS phone_number_mp TEXT NULL;

COMMENT ON COLUMN user_retell_config.phone_number_mp IS 'Phone number used for Mortgage Protection leads (lead_type 4)';

-- Migrate existing phone numbers to the new FE column
-- (existing phone_number becomes the FE phone for backwards compatibility)
UPDATE user_retell_config
SET phone_number_fe = phone_number
WHERE phone_number IS NOT NULL
  AND phone_number_fe IS NULL;

-- Note: The legacy phone_number column is kept for backwards compatibility
-- The system will use phone_number_fe preferentially, falling back to phone_number

