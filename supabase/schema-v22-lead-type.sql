-- =====================================================
-- LEAD TYPE SUPPORT (PER-LEAD SCRIPT TYPE)
-- =====================================================
-- This migration adds a lead_type column to track which
-- AI script should be used for each individual lead.
--
-- Lead Type Values (UPDATED):
--   1 = NULL/Default (fallback)
--   2 = Final Expense (non-veteran)
--   3 = Final Expense (veteran)
--   4 = Mortgage Protection
--
-- The lead_type is sent to Retell as a NUMBER so the
-- AI agent knows which script/prompt to use.
-- =====================================================

-- 1. Add lead_type to leads table
-- Default to 1 for existing leads
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS lead_type INTEGER DEFAULT 1;

-- 2. Add lead_type to user_google_sheets table
-- To remember what type of leads are in each sheet
ALTER TABLE user_google_sheets 
ADD COLUMN IF NOT EXISTS lead_type INTEGER DEFAULT 1;

-- 3. Add lead_vendor column for Mortgage Protection leads
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS lead_vendor TEXT;

-- 4. Add street_address column for Mortgage Protection leads
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS street_address TEXT;

-- 5. Add lead_vendor_column to user_google_sheets (column mapping)
ALTER TABLE user_google_sheets
ADD COLUMN IF NOT EXISTS lead_vendor_column TEXT;

-- 6. Add street_address_column to user_google_sheets (column mapping)
ALTER TABLE user_google_sheets
ADD COLUMN IF NOT EXISTS street_address_column TEXT;

-- 7. Create index for lead_type filtering
CREATE INDEX IF NOT EXISTS idx_leads_lead_type 
ON leads(lead_type);

-- 8. Add comments for documentation
COMMENT ON COLUMN leads.lead_type IS 'Lead type for AI script selection: 1=NULL/Default, 2=Final Expense, 3=Final Expense (Veteran), 4=Mortgage Protection';
COMMENT ON COLUMN user_google_sheets.lead_type IS 'Default lead type for all leads from this sheet: 1=NULL/Default, 2=Final Expense, 3=Final Expense (Veteran), 4=Mortgage Protection';

-- =====================================================
-- RUN THIS QUERY TO VERIFY COLUMN EXISTS:
-- =====================================================
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'leads' 
-- AND column_name = 'lead_type';
-- =====================================================
