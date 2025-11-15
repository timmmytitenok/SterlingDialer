-- Ensure dialer_settings table has all required columns
-- Run this in Supabase SQL Editor if you're getting save errors

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS dialer_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Budget settings
  daily_budget_cents INTEGER NOT NULL DEFAULT 2500, -- $25
  currency TEXT NOT NULL DEFAULT 'usd',
  
  -- Auto-start schedule
  auto_start_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_start_days TEXT[] NOT NULL DEFAULT ARRAY['mon', 'tue', 'wed', 'thu', 'fri'],
  auto_start_time TEXT NOT NULL DEFAULT '09:00',
  auto_stop_time TEXT NOT NULL DEFAULT '20:00',
  
  -- Lead prioritization
  lead_priority_mode TEXT NOT NULL DEFAULT 'fresh-first',
  
  -- Advanced settings
  advanced_lead_cap_enabled BOOLEAN NOT NULL DEFAULT false,
  advanced_daily_lead_cap INTEGER DEFAULT 600,
  default_override_leads INTEGER NOT NULL DEFAULT 20,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add missing columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dialer_settings' AND column_name = 'auto_start_enabled') THEN
    ALTER TABLE dialer_settings ADD COLUMN auto_start_enabled BOOLEAN NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dialer_settings' AND column_name = 'auto_start_days') THEN
    ALTER TABLE dialer_settings ADD COLUMN auto_start_days TEXT[] NOT NULL DEFAULT ARRAY['mon', 'tue', 'wed', 'thu', 'fri'];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dialer_settings' AND column_name = 'auto_start_time') THEN
    ALTER TABLE dialer_settings ADD COLUMN auto_start_time TEXT NOT NULL DEFAULT '09:00';
  END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE dialer_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view own dialer_settings" ON dialer_settings;
CREATE POLICY "Users can view own dialer_settings"
  ON dialer_settings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own dialer_settings" ON dialer_settings;
CREATE POLICY "Users can update own dialer_settings"
  ON dialer_settings FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own dialer_settings" ON dialer_settings;
CREATE POLICY "Users can insert own dialer_settings"
  ON dialer_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Verify the setup
SELECT 
  user_id,
  auto_start_enabled,
  auto_start_time,
  auto_start_days,
  daily_budget_cents
FROM dialer_settings
LIMIT 5;

