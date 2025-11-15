-- ================================
-- ADD AI CONTROL SETTINGS COLUMNS
-- ================================
-- Adds missing columns for the new automation system

-- Add daily spend tracking
ALTER TABLE ai_control_settings 
ADD COLUMN IF NOT EXISTS daily_spend_limit DECIMAL(10,2) DEFAULT 10.00;

ALTER TABLE ai_control_settings 
ADD COLUMN IF NOT EXISTS today_spend DECIMAL(10,2) DEFAULT 0.00;

ALTER TABLE ai_control_settings 
ADD COLUMN IF NOT EXISTS spend_last_reset_date TEXT;

-- Add call tracking
ALTER TABLE ai_control_settings 
ADD COLUMN IF NOT EXISTS calls_made_today INTEGER DEFAULT 0;

ALTER TABLE ai_control_settings 
ADD COLUMN IF NOT EXISTS last_call_status TEXT;

-- Add execution mode tracking
ALTER TABLE ai_control_settings 
ADD COLUMN IF NOT EXISTS execution_mode TEXT DEFAULT 'leads';

ALTER TABLE ai_control_settings 
ADD COLUMN IF NOT EXISTS target_lead_count INTEGER;

ALTER TABLE ai_control_settings 
ADD COLUMN IF NOT EXISTS target_time_military INTEGER;

-- Add current call tracking
ALTER TABLE ai_control_settings 
ADD COLUMN IF NOT EXISTS current_call_id TEXT;

ALTER TABLE ai_control_settings 
ADD COLUMN IF NOT EXISTS current_lead_id UUID;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ AI Control Settings columns added!';
END $$;

