-- =====================================================
-- ADD LAST_LOGIN COLUMN TO PROFILES TABLE
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add last_login column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Optionally, set initial last_login to created_at for existing users
UPDATE profiles 
SET last_login = created_at 
WHERE last_login IS NULL;

SELECT 'last_login column added to profiles table!' as status;
