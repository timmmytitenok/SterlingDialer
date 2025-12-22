-- =====================================================
-- SCHEMA v23: Global Agent System
-- =====================================================
-- Changes:
--   1. Add cal_event_id to user_retell_config (for booking appointments)
--   2. Add agent_pronoun to user_retell_config (for AI to use proper pronouns)
--   3. Global agent IDs are stored in environment variables, not database
--
-- Lead Type → Global Agent Mapping:
--   lead_type = 2 → Final Expense Agent (RETELL_AGENT_ID_FE)
--   lead_type = 3 → Veterans Final Expense Agent (RETELL_AGENT_ID_VET)
--   lead_type = 4 → Mortgage Protection Agent (RETELL_AGENT_ID_MP)
--
-- Each user still has their own:
--   - phone_number (outbound caller ID)
--   - cal_ai_api_key (their Cal.ai API key)
--   - cal_event_id (their Cal.ai event type ID)
--   - agent_name (name the AI uses: "Hi, I'm Sarah...")
--   - agent_pronoun (pronoun the AI uses: "she/her", "he/him")
-- =====================================================

-- Add cal_event_id column to user_retell_config
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_retell_config' AND column_name = 'cal_event_id'
  ) THEN
    ALTER TABLE user_retell_config 
    ADD COLUMN cal_event_id TEXT;
    
    COMMENT ON COLUMN user_retell_config.cal_event_id IS 'Cal.ai Event ID for booking appointments (e.g., "30min-meeting")';
  END IF;
END $$;

-- Add agent_pronoun column to user_retell_config
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_retell_config' AND column_name = 'agent_pronoun'
  ) THEN
    ALTER TABLE user_retell_config 
    ADD COLUMN agent_pronoun TEXT DEFAULT 'she/her';
    
    COMMENT ON COLUMN user_retell_config.agent_pronoun IS 'Pronoun for the AI agent to use (e.g., "she/her", "he/him", "they/them")';
  END IF;
END $$;

-- Ensure agent_name column exists (it should, but just in case)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_retell_config' AND column_name = 'agent_name'
  ) THEN
    ALTER TABLE user_retell_config 
    ADD COLUMN agent_name TEXT;
    
    COMMENT ON COLUMN user_retell_config.agent_name IS 'Name the AI agent uses when introducing itself (e.g., "Sarah")';
  END IF;
END $$;

-- Add comments for clarity
COMMENT ON TABLE user_retell_config IS 'User-specific Retell configuration. Global agent IDs are in environment variables (RETELL_AGENT_ID_FE, RETELL_AGENT_ID_VET, RETELL_AGENT_ID_MP).';

-- =====================================================
-- ENVIRONMENT VARIABLES NEEDED:
-- =====================================================
-- Add these to your .env.local and Vercel:
--
-- # Global Retell Agent IDs (one agent per script type)
-- RETELL_AGENT_ID_FE=agent_xxxxx          # Final Expense script
-- RETELL_AGENT_ID_VET=agent_xxxxx         # Veterans Final Expense script
-- RETELL_AGENT_ID_MP=agent_xxxxx          # Mortgage Protection script
--
-- =====================================================

SELECT 'Schema v23 applied: Global Agent System ready!' as result;

