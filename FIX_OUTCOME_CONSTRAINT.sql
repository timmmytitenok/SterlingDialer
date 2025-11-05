-- ============================================================================
-- FIX: Allow 'other' as valid outcome value in calls table
-- ============================================================================
-- This fixes the "calls_outcome_check" constraint error when using outcome='other'
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- First, check the current constraint (for reference)
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'calls_outcome_check';

-- Drop the old constraint if it exists
ALTER TABLE calls DROP CONSTRAINT IF EXISTS calls_outcome_check;

-- Add the new constraint with all valid values INCLUDING 'other'
ALTER TABLE calls ADD CONSTRAINT calls_outcome_check 
CHECK (outcome IN (
  'not_interested',       -- Lead not interested
  'callback_later',       -- Lead wants callback
  'appointment_booked',   -- Appointment scheduled
  'live_transfer',        -- Call transferred to live agent
  'other'                 -- Other/unclassified outcome
) OR outcome IS NULL);    -- NULL is allowed for unanswered calls

-- Verify the new constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'calls_outcome_check';

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Outcome constraint updated successfully!';
  RAISE NOTICE '✅ Valid values: not_interested, callback_later, appointment_booked, live_transfer, other, null';
END $$;

