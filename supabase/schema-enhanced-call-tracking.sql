-- ============================================================================
-- ENHANCED CALL TRACKING SYSTEM
-- ============================================================================
-- Implements advanced call tracking with:
-- - Time-of-day tracking (morning/daytime/evening)
-- - 18-missed-call logic (6 per time period)
-- - Double-dial support
-- - Accurate status classification
-- ============================================================================

-- Add enhanced tracking columns to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS morning_missed_calls INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS daytime_missed_calls INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS evening_missed_calls INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS total_missed_calls INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_call_time_period TEXT; -- 'morning', 'daytime', 'evening'
ALTER TABLE leads ADD COLUMN IF NOT EXISTS double_dial_pending BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_call_was_voicemail BOOLEAN DEFAULT false;

-- Add columns to track more detailed call history
ALTER TABLE leads ADD COLUMN IF NOT EXISTS total_calls_made INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS total_pickups INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pickup_rate NUMERIC DEFAULT 0;

-- Update status constraint to include new statuses
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
    'dead_lead', -- 18 missed calls reached
    'booked', 
    'sold', 
    'do_not_call'
  ));

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_leads_total_missed_calls ON leads(total_missed_calls);
CREATE INDEX IF NOT EXISTS idx_leads_last_call_time_period ON leads(last_call_time_period);
CREATE INDEX IF NOT EXISTS idx_leads_double_dial_pending ON leads(double_dial_pending);

-- Add columns to calls table for enhanced tracking
ALTER TABLE calls ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS call_id TEXT; -- Retell call ID
ALTER TABLE calls ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS in_voicemail BOOLEAN DEFAULT false;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS disconnection_reason TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS call_time_period TEXT; -- 'morning', 'daytime', 'evening'
ALTER TABLE calls ADD COLUMN IF NOT EXISTS was_double_dial BOOLEAN DEFAULT false;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS transcript TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS call_analysis JSONB;

-- Add indexes for calls table
CREATE INDEX IF NOT EXISTS idx_calls_lead_id ON calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_calls_call_id ON calls(call_id);
CREATE INDEX IF NOT EXISTS idx_calls_in_voicemail ON calls(in_voicemail);
CREATE INDEX IF NOT EXISTS idx_calls_call_time_period ON calls(call_time_period);

-- ============================================================================
-- HELPER FUNCTION: Determine time period based on hour
-- ============================================================================
CREATE OR REPLACE FUNCTION get_time_period(hour_24 INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF hour_24 >= 8 AND hour_24 < 12 THEN
    RETURN 'morning'; -- 8am-12pm
  ELSIF hour_24 >= 12 AND hour_24 < 17 THEN
    RETURN 'daytime'; -- 12pm-5pm
  ELSIF hour_24 >= 18 AND hour_24 < 21 THEN
    RETURN 'evening'; -- 6pm-9pm
  ELSE
    RETURN NULL; -- Outside calling hours
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- HELPER FUNCTION: Check if lead should be marked as dead
-- ============================================================================
CREATE OR REPLACE FUNCTION should_mark_lead_dead(
  p_morning_missed INTEGER,
  p_daytime_missed INTEGER,
  p_evening_missed INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Dead if 6 missed calls in each time period (18 total)
  RETURN (
    p_morning_missed >= 6 AND
    p_daytime_missed >= 6 AND
    p_evening_missed >= 6
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- HELPER FUNCTION: Update lead after call result
-- ============================================================================
CREATE OR REPLACE FUNCTION update_lead_call_result(
  p_lead_id UUID,
  p_call_answered BOOLEAN,
  p_in_voicemail BOOLEAN,
  p_outcome TEXT,
  p_time_period TEXT,
  p_was_double_dial BOOLEAN DEFAULT false
)
RETURNS TABLE (
  should_double_dial BOOLEAN,
  is_dead_lead BOOLEAN,
  new_status TEXT
) AS $$
DECLARE
  v_lead RECORD;
  v_morning_missed INTEGER;
  v_daytime_missed INTEGER;
  v_evening_missed INTEGER;
  v_total_missed INTEGER;
  v_total_calls INTEGER;
  v_total_pickups INTEGER;
  v_should_double_dial BOOLEAN := false;
  v_is_dead_lead BOOLEAN := false;
  v_new_status TEXT;
BEGIN
  -- Get current lead data
  SELECT * INTO v_lead FROM leads WHERE id = p_lead_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found: %', p_lead_id;
  END IF;
  
  -- Initialize counters
  v_morning_missed := COALESCE(v_lead.morning_missed_calls, 0);
  v_daytime_missed := COALESCE(v_lead.daytime_missed_calls, 0);
  v_evening_missed := COALESCE(v_lead.evening_missed_calls, 0);
  v_total_missed := COALESCE(v_lead.total_missed_calls, 0);
  v_total_calls := COALESCE(v_lead.total_calls_made, 0) + 1;
  v_total_pickups := COALESCE(v_lead.total_pickups, 0);
  
  IF p_call_answered THEN
    -- Call was answered!
    v_total_pickups := v_total_pickups + 1;
    
    -- Determine status based on outcome
    CASE p_outcome
      WHEN 'not_interested' THEN
        v_new_status := 'not_interested';
      WHEN 'callback_later' THEN
        v_new_status := 'callback_later';
      WHEN 'appointment_booked' THEN
        v_new_status := 'appointment_booked';
      WHEN 'live_transfer' THEN
        v_new_status := 'live_transfer';
      ELSE
        v_new_status := 'unclassified';
    END CASE;
    
  ELSIF p_in_voicemail AND NOT p_was_double_dial THEN
    -- Voicemail on first dial - should double dial!
    v_should_double_dial := true;
    v_new_status := v_lead.status; -- Keep existing status, we'll call again
    
  ELSIF p_in_voicemail AND p_was_double_dial THEN
    -- Voicemail on double dial - count as 1 missed call
    IF p_time_period = 'morning' THEN
      v_morning_missed := v_morning_missed + 1;
    ELSIF p_time_period = 'daytime' THEN
      v_daytime_missed := v_daytime_missed + 1;
    ELSIF p_time_period = 'evening' THEN
      v_evening_missed := v_evening_missed + 1;
    END IF;
    
    v_total_missed := v_total_missed + 1;
    
    -- Check if lead should be marked dead
    v_is_dead_lead := should_mark_lead_dead(v_morning_missed, v_daytime_missed, v_evening_missed);
    
    IF v_is_dead_lead THEN
      v_new_status := 'dead_lead';
    ELSE
      v_new_status := 'no_answer';
    END IF;
    
  ELSE
    -- No answer, not voicemail - treat as missed
    IF p_time_period = 'morning' THEN
      v_morning_missed := v_morning_missed + 1;
    ELSIF p_time_period = 'daytime' THEN
      v_daytime_missed := v_daytime_missed + 1;
    ELSIF p_time_period = 'evening' THEN
      v_evening_missed := v_evening_missed + 1;
    END IF;
    
    v_total_missed := v_total_missed + 1;
    
    -- Check if lead should be marked dead
    v_is_dead_lead := should_mark_lead_dead(v_morning_missed, v_daytime_missed, v_evening_missed);
    
    IF v_is_dead_lead THEN
      v_new_status := 'dead_lead';
    ELSE
      v_new_status := 'no_answer';
    END IF;
  END IF;
  
  -- Calculate pickup rate
  DECLARE
    v_pickup_rate NUMERIC;
  BEGIN
    IF v_total_calls > 0 THEN
      v_pickup_rate := (v_total_pickups::NUMERIC / v_total_calls::NUMERIC) * 100;
    ELSE
      v_pickup_rate := 0;
    END IF;
    
    -- Update lead
    UPDATE leads
    SET 
      status = v_new_status,
      morning_missed_calls = v_morning_missed,
      daytime_missed_calls = v_daytime_missed,
      evening_missed_calls = v_evening_missed,
      total_missed_calls = v_total_missed,
      total_calls_made = v_total_calls,
      total_pickups = v_total_pickups,
      pickup_rate = v_pickup_rate,
      last_call_time_period = p_time_period,
      last_call_was_voicemail = p_in_voicemail,
      double_dial_pending = v_should_double_dial,
      last_call_outcome = p_outcome,
      last_called = NOW(),
      updated_at = NOW()
    WHERE id = p_lead_id;
  END;
  
  -- Return results
  should_double_dial := v_should_double_dial;
  is_dead_lead := v_is_dead_lead;
  new_status := v_new_status;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_time_period TO authenticated;
GRANT EXECUTE ON FUNCTION get_time_period TO service_role;
GRANT EXECUTE ON FUNCTION should_mark_lead_dead TO authenticated;
GRANT EXECUTE ON FUNCTION should_mark_lead_dead TO service_role;
GRANT EXECUTE ON FUNCTION update_lead_call_result TO authenticated;
GRANT EXECUTE ON FUNCTION update_lead_call_result TO service_role;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

