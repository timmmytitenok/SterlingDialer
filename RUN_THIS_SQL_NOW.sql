-- ============================================
-- RUN THIS IN SUPABASE SQL EDITOR NOW!
-- ============================================
-- This adds ALL missing columns for the new call-by-call system

-- ================================
-- 1. LEADS TABLE - ALL COLUMNS
-- ================================
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS call_attempts_today INTEGER DEFAULT 0;

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS last_attempt_date TEXT;

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS last_called TIMESTAMPTZ;

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS last_call_result TEXT;

-- ================================
-- 2. AI CONTROL SETTINGS TABLE
-- ================================
ALTER TABLE ai_control_settings 
ADD COLUMN IF NOT EXISTS daily_spend_limit DECIMAL(10,2) DEFAULT 10.00;

ALTER TABLE ai_control_settings 
ADD COLUMN IF NOT EXISTS today_spend DECIMAL(10,2) DEFAULT 0.00;

ALTER TABLE ai_control_settings 
ADD COLUMN IF NOT EXISTS spend_last_reset_date TEXT;

ALTER TABLE ai_control_settings 
ADD COLUMN IF NOT EXISTS calls_made_today INTEGER DEFAULT 0;

ALTER TABLE ai_control_settings 
ADD COLUMN IF NOT EXISTS last_call_status TEXT;

ALTER TABLE ai_control_settings 
ADD COLUMN IF NOT EXISTS execution_mode TEXT DEFAULT 'leads';

ALTER TABLE ai_control_settings 
ADD COLUMN IF NOT EXISTS target_lead_count INTEGER;

ALTER TABLE ai_control_settings 
ADD COLUMN IF NOT EXISTS target_time_military INTEGER;

ALTER TABLE ai_control_settings 
ADD COLUMN IF NOT EXISTS current_call_id TEXT;

ALTER TABLE ai_control_settings 
ADD COLUMN IF NOT EXISTS current_lead_id UUID;

-- ================================
-- 3. INDEXES FOR PERFORMANCE
-- ================================
CREATE INDEX IF NOT EXISTS idx_leads_call_attempts ON leads(call_attempts_today);
CREATE INDEX IF NOT EXISTS idx_leads_status_qualified ON leads(status, is_qualified);
CREATE INDEX IF NOT EXISTS idx_leads_user_callable ON leads(user_id, is_qualified, status, call_attempts_today);

-- ================================
-- SUCCESS!
-- ================================
DO $$
BEGIN
  RAISE NOTICE '✅✅✅ ALL COLUMNS ADDED SUCCESSFULLY! ✅✅✅';
  RAISE NOTICE '🚀 Your AI calling system is now ready!';
  RAISE NOTICE '📞 Go launch your AI and test with 1 lead!';
END $$;

