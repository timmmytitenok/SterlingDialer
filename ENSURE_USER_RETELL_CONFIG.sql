-- ================================
-- ENSURE USER_RETELL_CONFIG TABLE
-- ================================
-- This ensures the user_retell_config table exists with all necessary columns
-- Run this in your Supabase SQL Editor

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_retell_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  retell_agent_id TEXT,
  retell_api_key TEXT,
  phone_number TEXT,
  agent_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add missing columns if they don't exist
DO $$
BEGIN
  -- Add phone_number if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_retell_config' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE user_retell_config ADD COLUMN phone_number TEXT;
  END IF;

  -- Add agent_name if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_retell_config' AND column_name = 'agent_name'
  ) THEN
    ALTER TABLE user_retell_config ADD COLUMN agent_name TEXT;
  END IF;

  -- Add is_active if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_retell_config' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE user_retell_config ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;

  -- Add updated_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_retell_config' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE user_retell_config ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_retell_config_user_id ON user_retell_config(user_id);

-- Enable Row Level Security
ALTER TABLE user_retell_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own retell config" ON user_retell_config;
DROP POLICY IF EXISTS "Users can update their own retell config" ON user_retell_config;
DROP POLICY IF EXISTS "Users can insert their own retell config" ON user_retell_config;

-- Create RLS policies
-- Allow users to view their own config
CREATE POLICY "Users can view their own retell config"
  ON user_retell_config
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to update their own config
CREATE POLICY "Users can update their own retell config"
  ON user_retell_config
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to insert their own config
CREATE POLICY "Users can insert their own retell config"
  ON user_retell_config
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON user_retell_config TO authenticated;
GRANT ALL ON user_retell_config TO service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ user_retell_config table is ready!';
END $$;

