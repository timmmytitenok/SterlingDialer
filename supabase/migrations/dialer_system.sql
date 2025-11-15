-- Dialer Settings Table
CREATE TABLE IF NOT EXISTS dialer_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Budget settings
  daily_budget_cents INTEGER NOT NULL DEFAULT 5000, -- $50
  currency TEXT NOT NULL DEFAULT 'usd',
  
  -- Auto-start schedule
  auto_start_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_start_days TEXT[] NOT NULL DEFAULT ARRAY['mon', 'tue', 'wed', 'thu', 'fri'],
  auto_start_time TEXT NOT NULL DEFAULT '09:00',
  auto_stop_time TEXT NOT NULL DEFAULT '20:00',
  
  -- Lead prioritization
  lead_priority_mode TEXT NOT NULL DEFAULT 'fresh-first',
  -- Options: 'fresh-first', 'callbacks-first', 'aged-first', 'random'
  
  -- Advanced settings
  advanced_lead_cap_enabled BOOLEAN NOT NULL DEFAULT false,
  advanced_daily_lead_cap INTEGER DEFAULT 600,
  default_override_leads INTEGER NOT NULL DEFAULT 20,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Dialer Sessions Table (Runtime State)
CREATE TABLE IF NOT EXISTS dialer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Status: 'idle', 'running', 'paused-budget', 'paused-balance', 'no-leads', 'error'
  status TEXT NOT NULL DEFAULT 'idle',
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  stopped_at TIMESTAMPTZ,
  
  -- Override mode
  override_active BOOLEAN NOT NULL DEFAULT false,
  override_leads INTEGER,
  override_started_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dialer_settings_user_id ON dialer_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_dialer_sessions_user_id ON dialer_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_dialer_sessions_status ON dialer_sessions(status);

-- Enable RLS
ALTER TABLE dialer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dialer_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own dialer settings"
  ON dialer_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own dialer settings"
  ON dialer_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dialer settings"
  ON dialer_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own dialer sessions"
  ON dialer_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own dialer sessions"
  ON dialer_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dialer sessions"
  ON dialer_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE dialer_settings IS 'User dialer automation settings';
COMMENT ON TABLE dialer_sessions IS 'Runtime state for AI dialer (one active session per user)';

