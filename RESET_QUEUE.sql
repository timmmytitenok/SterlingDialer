-- Reset queue_length for all users
-- Run this in Supabase SQL Editor if you see wrong numbers

UPDATE ai_control_settings 
SET queue_length = 0, status = 'stopped';

-- Or for just your user (replace YOUR_USER_ID):
-- UPDATE ai_control_settings 
-- SET queue_length = 0, status = 'stopped'
-- WHERE user_id = 'YOUR_USER_ID';

