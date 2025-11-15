-- ============================================================================
-- FIX STATUS CONSTRAINT - Run this in Supabase RIGHT NOW!
-- ============================================================================

-- Drop the old constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- Add new constraint with ALL statuses including unclassified
ALTER TABLE leads ADD CONSTRAINT leads_status_check 
  CHECK (status IN (
    'new',
    'calling',
    'no_answer',
    'not_interested',
    'callback_later',
    'appointment_booked',
    'live_transfer',
    'unclassified',
    'dead_lead',
    'booked',
    'sold',
    'do_not_call'
  ));

-- Verify the constraint exists
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'leads_status_check';

-- ============================================================================
-- After running this, the status updates will work!
-- ============================================================================

