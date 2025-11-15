-- Add columns to track daily call attempts (prevent calling same lead multiple times per day)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS call_attempts_today INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_attempt_date DATE;

-- Verify columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name IN ('call_attempts_today', 'last_attempt_date');

