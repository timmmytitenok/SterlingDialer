-- ============================================================================
-- FIX CALLS TABLE - Add missing columns
-- ============================================================================

-- Add all missing columns to calls table
ALTER TABLE calls ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS call_id TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS duration NUMERIC DEFAULT 0;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS connected BOOLEAN DEFAULT false;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS recording_url TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS transcript TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS call_analysis JSONB;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS disconnection_reason TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS in_voicemail BOOLEAN DEFAULT false;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS call_time_period TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS was_double_dial BOOLEAN DEFAULT false;

-- Verify columns exist
SELECT column_name
FROM information_schema.columns 
WHERE table_name = 'calls'
AND column_name IN ('lead_id', 'call_id', 'call_analysis', 'in_voicemail')
ORDER BY column_name;

-- ============================================================================
-- Should show all 4 columns!
-- ============================================================================

