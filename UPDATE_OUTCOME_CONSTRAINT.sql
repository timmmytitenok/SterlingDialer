-- ============================================================================
-- UPDATE CALLS OUTCOME CONSTRAINT - Run in Supabase
-- ============================================================================

-- Drop old constraint
ALTER TABLE calls DROP CONSTRAINT IF EXISTS calls_outcome_check;

-- Add new constraint with all outcome values including double dial statuses
ALTER TABLE calls ADD CONSTRAINT calls_outcome_check 
CHECK (outcome IN (
  'not_interested',
  'callback_later',
  'appointment_booked',
  'live_transfer',
  'unclassified',
  'voicemail_first_attempt',
  'voicemail_double_attempt',
  'no_answer_first_attempt',
  'no_answer_double_attempt',
  'no_answer'
) OR outcome IS NULL);

-- Verify it worked
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'calls' 
AND constraint_name = 'calls_outcome_check';

