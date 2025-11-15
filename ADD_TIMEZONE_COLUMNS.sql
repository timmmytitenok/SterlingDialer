-- ============================================================================
-- TIMEZONE FIX - Day Reset at Midnight (not 7pm!)
-- ============================================================================
-- This migration adds timezone tracking and scheduling support
-- Run this in your Supabase SQL Editor

-- Add timezone to ai_control_settings
ALTER TABLE ai_control_settings ADD COLUMN IF NOT EXISTS user_timezone TEXT DEFAULT 'America/New_York';

-- Add scheduling columns
ALTER TABLE ai_control_settings ADD COLUMN IF NOT EXISTS schedule_enabled BOOLEAN DEFAULT false;
ALTER TABLE ai_control_settings ADD COLUMN IF NOT EXISTS schedule_time TEXT DEFAULT '10:00';
ALTER TABLE ai_control_settings ADD COLUMN IF NOT EXISTS schedule_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5];

-- Verify columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'ai_control_settings' 
AND column_name IN ('user_timezone', 'schedule_enabled', 'schedule_time', 'schedule_days');

-- ============================================================================
-- VERCEL ENVIRONMENT VARIABLES NEEDED:
-- ============================================================================
-- Add this to your Vercel Environment Variables:
--
-- CRON_SECRET=your-random-secret-here
--
-- Generate a random secret with: openssl rand -base64 32
--
-- This secret protects the cron endpoint from unauthorized access.
-- ============================================================================

