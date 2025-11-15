-- ============================================================================
-- FIX COLUMN NAMES - Run this in Supabase RIGHT NOW!
-- ============================================================================

-- Add BOTH column names for compatibility
ALTER TABLE leads ADD COLUMN IF NOT EXISTS times_dialed INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_dial_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_called TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_call_outcome TEXT;

-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name IN ('times_dialed', 'last_dial_at', 'last_called', 'last_call_outcome')
ORDER BY column_name;

-- ============================================================================
-- Should show ALL 4 columns!
-- ============================================================================

