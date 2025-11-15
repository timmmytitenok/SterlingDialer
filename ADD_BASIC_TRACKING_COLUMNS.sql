-- ============================================================================
-- ADD BASIC TRACKING COLUMNS (Run this NOW in Supabase!)
-- ============================================================================
-- These are the MINIMUM columns needed for call tracking to work

-- Add basic tracking columns if they don't exist
ALTER TABLE leads ADD COLUMN IF NOT EXISTS times_dialed INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_called TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_call_outcome TEXT;

-- Add call record columns
ALTER TABLE calls ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS call_id TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS duration NUMERIC DEFAULT 0;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS connected BOOLEAN DEFAULT false;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS recording_url TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS transcript TEXT;

-- Verify columns were added
SELECT 
  'leads' as table_name,
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name IN ('times_dialed', 'last_called', 'last_call_outcome')

UNION ALL

SELECT 
  'calls' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'calls'
AND column_name IN ('lead_id', 'call_id', 'phone_number', 'duration', 'connected');

-- ============================================================================
-- If you see results for all columns above, YOU'RE GOOD! ✅
-- ============================================================================

