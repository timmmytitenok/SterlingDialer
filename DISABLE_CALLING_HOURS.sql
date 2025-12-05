-- ============================================================================
-- DISABLE CALLING HOURS FOR TESTING
-- ============================================================================

-- Step 1: Add the column if it doesn't exist
ALTER TABLE ai_control_settings 
ADD COLUMN IF NOT EXISTS disable_calling_hours BOOLEAN DEFAULT false;

-- Step 2: Set it to TRUE for your user
UPDATE ai_control_settings 
SET disable_calling_hours = true 
WHERE user_id = 'ee52ea60-5438-4d53-aa83-13161e2100aa';

-- Step 3: Verify it was set
SELECT 
  user_id,
  disable_calling_hours,
  status,
  execution_mode,
  target_lead_count
FROM ai_control_settings 
WHERE user_id = 'ee52ea60-5438-4d53-aa83-13161e2100aa';

