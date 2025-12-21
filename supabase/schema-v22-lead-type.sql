-- =====================================================
-- LEAD TYPE SUPPORT (PER-LEAD SCRIPT TYPE)
-- =====================================================
-- This migration adds a lead_type column to track which
-- AI script should be used for each individual lead.
--
-- Lead Type Values:
--   1 = Final Expense (non-veteran)
--   2 = Final Expense (veteran)
--   3 = Mortgage Protection
--
-- The lead_type is sent to Retell as a variable so the
-- AI agent knows which script/prompt to use.
-- =====================================================

-- 1. Add lead_type to leads table
-- Default to 1 (Final Expense non-veteran) for existing leads
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS lead_type INTEGER DEFAULT 1;

-- 2. Add lead_type to user_google_sheets table
-- To remember what type of leads are in each sheet
ALTER TABLE user_google_sheets 
ADD COLUMN IF NOT EXISTS lead_type INTEGER DEFAULT 1;

-- 3. Create index for lead_type filtering
CREATE INDEX IF NOT EXISTS idx_leads_lead_type 
ON leads(lead_type);

-- 4. Add comments for documentation
COMMENT ON COLUMN leads.lead_type IS 'Lead type for AI script selection: 1=Final Expense, 2=Final Expense (Veteran), 3=Mortgage Protection';
COMMENT ON COLUMN user_google_sheets.lead_type IS 'Default lead type for all leads from this sheet: 1=Final Expense, 2=Final Expense (Veteran), 3=Mortgage Protection';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the migration worked:
--
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'leads' 
-- AND column_name = 'lead_type';
--
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'user_google_sheets' 
-- AND column_name = 'lead_type';
-- =====================================================

