-- ================================
-- ADD CALL ATTEMPTS TRACKING
-- ================================
-- Adds missing columns for the new call-by-call system

-- Add call_attempts_today to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS call_attempts_today INTEGER DEFAULT 0;

-- Add last_attempt_date to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS last_attempt_date TEXT;

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_leads_call_attempts ON leads(call_attempts_today);
CREATE INDEX IF NOT EXISTS idx_leads_status_qualified ON leads(status, is_qualified);
CREATE INDEX IF NOT EXISTS idx_leads_user_callable ON leads(user_id, is_qualified, status, call_attempts_today);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Call attempts tracking columns added!';
END $$;

