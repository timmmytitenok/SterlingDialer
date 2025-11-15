-- ============================================================================
-- ADD PHONE NUMBER TO RETELL CONFIG
-- ============================================================================
-- This adds the outbound calling number for each user's Retell agent
-- Run this in your Supabase SQL Editor

-- Add phone_number column
ALTER TABLE user_retell_config 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add agent_name for easy identification in admin panel
ALTER TABLE user_retell_config 
ADD COLUMN IF NOT EXISTS agent_name TEXT;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_retell_config' 
AND column_name IN ('phone_number', 'agent_name', 'retell_agent_id');

-- ============================================================================
-- NOTES:
-- ============================================================================
-- - phone_number: Outbound caller ID (e.g., "+15551234567")
-- - agent_name: Friendly name for admin reference (e.g., "John's Agent")
-- - retell_agent_id: Retell AI agent ID (e.g., "agent_xxxxxxxxxxxxx")
-- ============================================================================

