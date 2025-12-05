-- ============================================================================
-- FIX CALL HISTORY - Add missing columns
-- ============================================================================

-- Add lead_name column to calls table
ALTER TABLE calls 
ADD COLUMN IF NOT EXISTS lead_name TEXT;

-- Add cost column to calls table (our cost, not Retell's)
ALTER TABLE calls 
ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2) DEFAULT 0.00;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'calls' 
AND column_name IN ('lead_name', 'cost', 'phone_number', 'duration', 'outcome')
ORDER BY column_name;

-- Check recent calls to see if name and phone are there
SELECT 
  created_at,
  lead_name,
  phone_number,
  duration,
  cost,
  outcome,
  connected
FROM calls 
WHERE user_id = 'ee52ea60-5438-4d53-aa83-13161e2100aa'
ORDER BY created_at DESC 
LIMIT 5;

