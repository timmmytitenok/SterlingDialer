-- ============================================================================
-- NEW AUTOMATION SYSTEM - Call-by-Call Execution (No N8N!)
-- ============================================================================
-- Run this in your Supabase SQL Editor

-- 1. Add daily spend tracking columns to ai_control_settings
ALTER TABLE ai_control_settings 
ADD COLUMN IF NOT EXISTS daily_spend_limit DECIMAL(10,2) DEFAULT 10.00;

ALTER TABLE ai_control_settings 
ADD COLUMN IF NOT EXISTS today_spend DECIMAL(10,2) DEFAULT 0.00;

ALTER TABLE ai_control_settings 
ADD COLUMN IF NOT EXISTS spend_last_reset_date DATE DEFAULT CURRENT_DATE;

-- 2. Add real-time call tracking
ALTER TABLE ai_control_settings 
ADD COLUMN IF NOT EXISTS current_call_id TEXT;

ALTER TABLE ai_control_settings 
ADD COLUMN IF NOT EXISTS current_lead_id TEXT;

ALTER TABLE ai_control_settings 
ADD COLUMN IF NOT EXISTS calls_made_today INTEGER DEFAULT 0;

ALTER TABLE ai_control_settings 
ADD COLUMN IF NOT EXISTS last_call_status TEXT;

-- 3. Add call attempts tracking to leads (for retry logic)
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS call_attempts_today INTEGER DEFAULT 0;

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS last_attempt_date DATE;

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS last_call_result TEXT;

-- 4. Create index for faster lead queries
CREATE INDEX IF NOT EXISTS idx_leads_call_priority 
ON leads(user_id, status, call_attempts_today, last_attempt_date);

-- 5. Verify all columns were added
SELECT 'ai_control_settings' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ai_control_settings' 
AND column_name IN (
  'daily_spend_limit', 
  'today_spend', 
  'spend_last_reset_date',
  'current_call_id',
  'current_lead_id',
  'calls_made_today',
  'last_call_status'
)
UNION ALL
SELECT 'leads' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name IN (
  'call_attempts_today', 
  'last_attempt_date',
  'last_call_result'
);

-- ============================================================================
-- NOTES:
-- ============================================================================
-- - daily_spend_limit: User's max spend per day (e.g., $10, $50)
-- - today_spend: Current spend for today (resets at midnight in user's timezone)
-- - calls_made_today: Number of calls made today (for tracking)
-- - call_attempts_today: How many times we called this lead today (max 2)
-- - last_call_result: Last outcome (no_answer, not_interested, callback, etc.)
-- ============================================================================

