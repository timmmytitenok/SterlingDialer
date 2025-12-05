-- ============================================================================
-- SIMPLIFIED 20-ATTEMPT SYSTEM
-- ============================================================================
-- This SQL ensures the leads table has the columns needed for the
-- simplified retry logic: 20 total attempts before marking as dead

-- Ensure total_calls_made column exists (primary counter)
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS total_calls_made INTEGER DEFAULT 0;

-- Ensure total_pickups column exists (tracks answered calls)
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS total_pickups INTEGER DEFAULT 0;

-- Ensure pickup_rate column exists (percentage of answered calls)
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS pickup_rate DECIMAL(5,2) DEFAULT 0.00;

-- Ensure call_attempts_today exists (prevents calling same lead twice in one day)
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS call_attempts_today INTEGER DEFAULT 0;

-- Ensure last_attempt_date exists (tracks last call date)
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS last_attempt_date TEXT;

-- Create index for faster lead queries
CREATE INDEX IF NOT EXISTS idx_leads_total_calls ON leads(total_calls_made);
CREATE INDEX IF NOT EXISTS idx_leads_call_attempts_today ON leads(call_attempts_today, last_attempt_date);

-- Add 'dead_lead' to status enum if it doesn't exist
-- Note: You may need to add this manually if using enum types
-- ALTER TABLE leads ALTER COLUMN status TYPE TEXT; -- Convert to TEXT if currently enum

-- Display current lead statistics
SELECT 
  status,
  COUNT(*) as count,
  AVG(total_calls_made) as avg_attempts,
  MAX(total_calls_made) as max_attempts
FROM leads
GROUP BY status
ORDER BY count DESC;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- OLD SYSTEM (complex):
-- - Tracked morning_missed_calls (0-6)
-- - Tracked daytime_missed_calls (0-6)
-- - Tracked evening_missed_calls (0-6)
-- - Total: 18 attempts across different time periods
--
-- NEW SYSTEM (simple):
-- - Tracks total_calls_made (0-20)
-- - After 20 attempts with no answer → status = 'dead_lead'
-- - No time-period tracking needed
-- - Double-dial logic remains (2 attempts count as 1 call)
-- ============================================================================

