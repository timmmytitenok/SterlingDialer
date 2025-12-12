-- =====================================================
-- APP SETTINGS TABLE
-- Stores configurable app-wide settings like AI call costs
-- =====================================================

-- Create the app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default AI cost per minute setting
-- $0.15 per minute = your cost to Retell
INSERT INTO app_settings (key, value, description)
VALUES (
  'ai_cost_per_minute',
  '0.15',
  'Cost per minute for AI calls (what you pay Retell). User rate is $0.30/min, so profit = $0.30 - this value per minute.'
)
ON CONFLICT (key) DO NOTHING;

-- Also insert user rate for reference
INSERT INTO app_settings (key, value, description)
VALUES (
  'user_rate_per_minute',
  '0.30',
  'Rate charged to users per minute of AI calls ($0.30/min)'
)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- QUICK COMMANDS TO UPDATE AI COST
-- =====================================================

-- Set AI cost to $0.15/min (50% profit margin)
-- UPDATE app_settings SET value = '0.15', updated_at = NOW() WHERE key = 'ai_cost_per_minute';

-- Set AI cost to $0.20/min (33% profit margin)  
-- UPDATE app_settings SET value = '0.20', updated_at = NOW() WHERE key = 'ai_cost_per_minute';

-- Set AI cost to $0.25/min (17% profit margin)
-- UPDATE app_settings SET value = '0.25', updated_at = NOW() WHERE key = 'ai_cost_per_minute';

-- Check current settings
-- SELECT * FROM app_settings;

-- =====================================================
-- PROFIT CALCULATION EXAMPLES
-- =====================================================
-- At $0.15/min cost:
--   $25 refill = 83.33 min (at $0.30/min user rate)
--   Your cost = 83.33 × $0.15 = $12.50
--   Profit = $25 - $12.50 = $12.50 (50% margin)
--
-- At $0.20/min cost:
--   $25 refill = 83.33 min
--   Your cost = 83.33 × $0.20 = $16.67
--   Profit = $25 - $16.67 = $8.33 (33% margin)
--
-- At $0.25/min cost:
--   $25 refill = 83.33 min
--   Your cost = 83.33 × $0.25 = $20.83
--   Profit = $25 - $20.83 = $4.17 (17% margin)
