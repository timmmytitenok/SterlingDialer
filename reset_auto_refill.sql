-- Reset Auto-Refill to Disabled for Existing Users
-- Run this in your Supabase SQL Editor if you want to disable auto-refill for all existing users

-- Option 1: Disable auto-refill for ALL users
UPDATE call_balance 
SET auto_refill_enabled = false;

-- Option 2: Disable auto-refill for a specific user (replace YOUR_USER_ID)
-- UPDATE call_balance 
-- SET auto_refill_enabled = false
-- WHERE user_id = 'YOUR_USER_ID';

-- Option 3: Set default for new users (already in schema-v13)
-- The schema now defaults auto_refill_enabled to false for new users
-- ALTER TABLE call_balance ALTER COLUMN auto_refill_enabled SET DEFAULT false;

-- Verify changes
SELECT 
  user_id,
  balance,
  auto_refill_enabled,
  auto_refill_amount
FROM call_balance
ORDER BY created_at DESC;

