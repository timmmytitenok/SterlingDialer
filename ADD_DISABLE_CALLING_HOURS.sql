-- Add toggle to disable calling hours (for testing)
ALTER TABLE ai_control_settings ADD COLUMN IF NOT EXISTS disable_calling_hours BOOLEAN DEFAULT false;

-- Verify it was added
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'ai_control_settings' 
AND column_name = 'disable_calling_hours';

