-- Add is_dead column to profiles table
-- This allows admins to mark users as "dead" (inactive/churned)
-- Dead users will be hidden from active user lists

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_dead BOOLEAN DEFAULT FALSE;

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_profiles_is_dead ON profiles(is_dead);

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'is_dead';

