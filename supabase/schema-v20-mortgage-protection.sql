-- =====================================================
-- MORTGAGE PROTECTION SCRIPT SUPPORT
-- =====================================================
-- This migration adds support for different script types
-- (Final Expense vs Mortgage Protection) and new lead fields
-- for Mortgage Protection (lead_vendor, street_address)
-- =====================================================

-- 1. Add script_type to user_retell_config
-- Values: 'final_expense' (default) or 'mortgage_protection'
ALTER TABLE user_retell_config 
ADD COLUMN IF NOT EXISTS script_type TEXT DEFAULT 'final_expense';

-- 2. Add lead_vendor and street_address to leads table
-- These are mandatory for Mortgage Protection users
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS lead_vendor TEXT;

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS street_address TEXT;

-- 3. Add lead_vendor_column and street_address_column to user_google_sheets
-- For storing column mappings when syncing sheets
ALTER TABLE user_google_sheets 
ADD COLUMN IF NOT EXISTS lead_vendor_column TEXT;

ALTER TABLE user_google_sheets 
ADD COLUMN IF NOT EXISTS street_address_column TEXT;

-- 4. Create index for script_type lookups
CREATE INDEX IF NOT EXISTS idx_user_retell_config_script_type 
ON user_retell_config(script_type);

-- 5. Add session_start_spend to ai_control_settings
-- Used for session-based budgeting (budget only counts spend within current session)
ALTER TABLE ai_control_settings 
ADD COLUMN IF NOT EXISTS session_start_spend NUMERIC DEFAULT 0;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the migration worked:
--
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'user_retell_config' 
-- AND column_name = 'script_type';
--
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'leads' 
-- AND column_name IN ('lead_vendor', 'street_address');
--
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'user_google_sheets' 
-- AND column_name IN ('lead_vendor_column', 'street_address_column');
-- =====================================================

