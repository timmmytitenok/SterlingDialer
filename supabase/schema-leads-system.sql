-- ============================================================================
-- LEADS MANAGEMENT SYSTEM - Direct Calling with Retell AI
-- ============================================================================
-- This schema enables Google Sheets integration, lead management, and direct
-- calling with Retell AI (eliminating N8N as middleware)
-- ============================================================================

-- ============================================================================
-- PART 1: USER GOOGLE SHEETS CONNECTION
-- ============================================================================
-- Track which Google Sheets each user has connected

CREATE TABLE IF NOT EXISTS user_google_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sheet_id TEXT NOT NULL, -- Google Sheet ID from URL
  sheet_name TEXT, -- Human-readable name
  sheet_url TEXT, -- Full URL for easy access
  name_column TEXT DEFAULT 'A', -- Column for name
  phone_column TEXT DEFAULT 'B', -- Column for phone
  email_column TEXT DEFAULT 'C', -- Column for email
  age_column TEXT DEFAULT 'D', -- Column for age
  state_column TEXT DEFAULT 'E', -- Column for state
  status_column TEXT DEFAULT 'F', -- Column where we write status back
  data_start_row INTEGER DEFAULT 2, -- Which row does data start (skip header)
  last_sync_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns for lead age management (if they don't exist)
ALTER TABLE user_google_sheets ADD COLUMN IF NOT EXISTS lead_date_column TEXT; -- Column for lead generation date
ALTER TABLE user_google_sheets ADD COLUMN IF NOT EXISTS min_lead_age_days INTEGER DEFAULT 0; -- Minimum days old before calling (0 = call immediately)

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_google_sheets_user_id ON user_google_sheets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_google_sheets_active ON user_google_sheets(is_active);

-- RLS Policies
ALTER TABLE user_google_sheets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own sheets" ON user_google_sheets;
CREATE POLICY "Users can view their own sheets" ON user_google_sheets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own sheets" ON user_google_sheets;
CREATE POLICY "Users can insert their own sheets" ON user_google_sheets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own sheets" ON user_google_sheets;
CREATE POLICY "Users can update their own sheets" ON user_google_sheets
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own sheets" ON user_google_sheets;
CREATE POLICY "Users can delete their own sheets" ON user_google_sheets
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- PART 2: LEADS TABLE
-- ============================================================================
-- Create leads table if it doesn't exist, or add columns if it does

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  age INTEGER,
  state TEXT,
  status TEXT DEFAULT 'new',
  google_sheet_id UUID REFERENCES user_google_sheets(id) ON DELETE SET NULL,
  sheet_row_number INTEGER,
  synced_from_sheet BOOLEAN DEFAULT false,
  times_dialed INTEGER DEFAULT 0,
  last_dial_at TIMESTAMPTZ,
  next_dial_at TIMESTAMPTZ,
  call_scheduled BOOLEAN DEFAULT false,
  last_call_outcome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if table already exists (for existing installations)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS google_sheet_id UUID REFERENCES user_google_sheets(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sheet_row_number INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS synced_from_sheet BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS times_dialed INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_dial_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_dial_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS call_scheduled BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_call_outcome TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_generated_at TIMESTAMPTZ; -- Date lead was generated/created

-- Add constraint for status values
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_status_check 
  CHECK (status IN ('new', 'calling', 'no_answer', 'not_interested', 'callback', 'booked', 'sold', 'do_not_call'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_times_dialed ON leads(times_dialed);
CREATE INDEX IF NOT EXISTS idx_leads_google_sheet_id ON leads(google_sheet_id);
CREATE INDEX IF NOT EXISTS idx_leads_last_dial_at ON leads(last_dial_at);
CREATE INDEX IF NOT EXISTS idx_leads_next_dial_at ON leads(next_dial_at);

-- RLS Policies for leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own leads" ON leads;
CREATE POLICY "Users can view their own leads" ON leads
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own leads" ON leads;
CREATE POLICY "Users can insert their own leads" ON leads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own leads" ON leads;
CREATE POLICY "Users can update their own leads" ON leads
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own leads" ON leads;
CREATE POLICY "Users can delete their own leads" ON leads
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all leads" ON leads;
CREATE POLICY "Service role can manage all leads" ON leads
  FOR ALL USING (true);

-- ============================================================================
-- PART 3: RETELL AI WEBHOOKS TABLE
-- ============================================================================
-- Store Retell webhook URLs for each user

CREATE TABLE IF NOT EXISTS user_retell_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  retell_api_key TEXT NOT NULL, -- User's Retell API key
  retell_agent_id TEXT, -- Default agent ID to use
  webhook_url TEXT, -- Custom webhook URL if needed
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_retell_config_user_id ON user_retell_config(user_id);

-- RLS Policies
ALTER TABLE user_retell_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own Retell config" ON user_retell_config;
CREATE POLICY "Users can view their own Retell config" ON user_retell_config
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own Retell config" ON user_retell_config;
CREATE POLICY "Users can insert their own Retell config" ON user_retell_config
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own Retell config" ON user_retell_config;
CREATE POLICY "Users can update their own Retell config" ON user_retell_config
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- PART 4: CALL QUEUE TABLE
-- ============================================================================
-- Track calls in progress and scheduled for retry

CREATE TABLE IF NOT EXISTS call_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  retell_call_id TEXT, -- Call ID from Retell
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, failed
  attempt_number INTEGER DEFAULT 1,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_call_queue_user_id ON call_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_call_queue_lead_id ON call_queue(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_queue_status ON call_queue(status);
CREATE INDEX IF NOT EXISTS idx_call_queue_scheduled_for ON call_queue(scheduled_for);

-- RLS Policies
ALTER TABLE call_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own queue" ON call_queue;
CREATE POLICY "Users can view their own queue" ON call_queue
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage queue" ON call_queue;
CREATE POLICY "Service role can manage queue" ON call_queue
  FOR ALL USING (true);

-- ============================================================================
-- PART 5: HELPER FUNCTIONS
-- ============================================================================

-- Function to get leads ready for calling
CREATE OR REPLACE FUNCTION get_callable_leads(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  lead_id UUID,
  name TEXT,
  phone TEXT,
  email TEXT,
  age INTEGER,
  state TEXT,
  status TEXT,
  times_dialed INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.name,
    l.phone,
    l.email,
    l.age,
    l.state,
    l.status,
    l.times_dialed
  FROM leads l
  WHERE l.user_id = p_user_id
    AND l.status IN ('new', 'callback')
    OR (l.status = 'no_answer' AND l.times_dialed < 2)
  ORDER BY 
    CASE l.status
      WHEN 'callback' THEN 1
      WHEN 'new' THEN 2
      WHEN 'no_answer' THEN 3
    END,
    l.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update lead after call
CREATE OR REPLACE FUNCTION update_lead_after_call(
  p_lead_id UUID,
  p_call_answered BOOLEAN,
  p_outcome TEXT,
  p_retell_call_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_times_dialed INTEGER;
  v_new_status TEXT;
BEGIN
  -- Get current times_dialed
  SELECT times_dialed INTO v_times_dialed
  FROM leads
  WHERE id = p_lead_id;
  
  -- Increment dial count
  v_times_dialed := COALESCE(v_times_dialed, 0) + 1;
  
  -- Determine new status
  IF p_call_answered THEN
    v_new_status := p_outcome; -- 'booked', 'not_interested', 'callback', etc.
  ELSE
    IF v_times_dialed >= 2 THEN
      v_new_status := 'no_answer'; -- Final status after 2 attempts
    ELSE
      v_new_status := 'no_answer'; -- Will retry
    END IF;
  END IF;
  
  -- Update lead
  UPDATE leads
  SET 
    times_dialed = v_times_dialed,
    last_dial_at = NOW(),
    status = v_new_status,
    last_call_outcome = p_outcome,
    updated_at = NOW()
  WHERE id = p_lead_id;
  
  -- Update call queue
  IF p_retell_call_id IS NOT NULL THEN
    UPDATE call_queue
    SET 
      status = 'completed',
      completed_at = NOW(),
      updated_at = NOW()
    WHERE retell_call_id = p_retell_call_id;
  END IF;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 6: COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE user_google_sheets IS 'Stores user connections to Google Sheets for lead management';
COMMENT ON TABLE user_retell_config IS 'Stores Retell AI configuration for each user';
COMMENT ON TABLE call_queue IS 'Tracks calls in progress and scheduled for retry';

COMMENT ON COLUMN leads.times_dialed IS 'Number of times this lead has been called';
COMMENT ON COLUMN leads.status IS 'Current status: new, calling, no_answer, not_interested, callback, booked, sold, do_not_call';
COMMENT ON COLUMN leads.google_sheet_id IS 'Reference to the Google Sheet this lead was imported from';
COMMENT ON COLUMN leads.sheet_row_number IS 'Row number in the Google Sheet for updating status';

-- ============================================================================
-- PART 7: GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_callable_leads TO authenticated;
GRANT EXECUTE ON FUNCTION update_lead_after_call TO authenticated;
GRANT EXECUTE ON FUNCTION get_callable_leads TO service_role;
GRANT EXECUTE ON FUNCTION update_lead_after_call TO service_role;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

