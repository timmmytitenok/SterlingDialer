-- Add "needs_review" status for leads with errors
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
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
    'needs_review',
    'booked',
    'sold',
    'do_not_call'
  ));

