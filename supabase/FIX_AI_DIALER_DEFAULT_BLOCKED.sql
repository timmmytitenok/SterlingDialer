-- ============================================================================
-- FIX: AI Dialer Should Be BLOCKED by Default for New Users
-- ============================================================================
-- This ensures ai_maintenance_mode exists and defaults to TRUE
-- so all new users will have their AI Dialer blocked until manually enabled by admin
-- ============================================================================

-- Step 1: Add the column if it doesn't exist (with correct default)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS ai_maintenance_mode BOOLEAN DEFAULT true;

-- Step 2: If column already exists, update its default value for NEW users
ALTER TABLE profiles 
ALTER COLUMN ai_maintenance_mode SET DEFAULT true;

-- Step 2: Update EXISTING users who currently have NULL or false (optional - comment out if you don't want to update existing users)
-- UPDATE profiles 
-- SET ai_maintenance_mode = true 
-- WHERE ai_maintenance_mode IS NULL OR ai_maintenance_mode = false;

-- ============================================================================
-- VERIFY IT WORKED
-- ============================================================================
-- Run this to check the default value is now 'true':
SELECT column_name, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'ai_maintenance_mode';

-- Should show: column_default = 'true'
-- ============================================================================

