-- =============================================
-- ADMIN DASHBOARD SCHEMA
-- =============================================
-- This file contains all tables and functions for admin dashboard analytics
-- Created: 2024

-- =============================================
-- 1. ADMIN ACTIVITY LOG
-- Track all admin actions for audit trail
-- =============================================
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'login', 'user_impersonation', 'test_call', 'data_export', 'user_edit', 'manual_credit'
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_email TEXT,
  action_details JSONB, -- Store additional context about the action
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_email ON admin_activity_log(admin_email);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action_type ON admin_activity_log(action_type);

-- =============================================
-- 2. SYSTEM HEALTH SNAPSHOTS
-- Store hourly/daily snapshots of system health
-- =============================================
CREATE TABLE IF NOT EXISTS system_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_type TEXT NOT NULL, -- 'hourly', 'daily'
  
  -- User metrics
  total_users INTEGER DEFAULT 0,
  free_trial_users INTEGER DEFAULT 0,
  starter_users INTEGER DEFAULT 0,
  pro_users INTEGER DEFAULT 0,
  elite_users INTEGER DEFAULT 0,
  vip_users INTEGER DEFAULT 0,
  new_signups_24h INTEGER DEFAULT 0,
  
  -- Call metrics
  total_calls_24h INTEGER DEFAULT 0,
  total_minutes_24h INTEGER DEFAULT 0,
  avg_call_duration_seconds INTEGER DEFAULT 0,
  
  -- Revenue metrics
  total_mrr DECIMAL(10,2) DEFAULT 0,
  total_call_balance DECIMAL(10,2) DEFAULT 0,
  revenue_24h DECIMAL(10,2) DEFAULT 0,
  
  -- Health metrics
  pending_setups INTEGER DEFAULT 0,
  low_balance_users INTEGER DEFAULT 0,
  expiring_trials INTEGER DEFAULT 0,
  failed_calls_24h INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_system_health_snapshots_created_at ON system_health_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_health_snapshots_type ON system_health_snapshots(snapshot_type);

-- =============================================
-- 3. USER NOTES (Admin can add notes about users)
-- =============================================
CREATE TABLE IF NOT EXISTS admin_user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_email TEXT NOT NULL,
  note_type TEXT DEFAULT 'general', -- 'general', 'support', 'billing', 'technical', 'warning'
  note_text TEXT NOT NULL,
  is_important BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_admin_user_notes_user_id ON admin_user_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_user_notes_created_at ON admin_user_notes(created_at DESC);

-- =============================================
-- 4. REVENUE ANALYTICS (Daily aggregated revenue data)
-- =============================================
CREATE TABLE IF NOT EXISTS revenue_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  
  -- Revenue breakdown
  mrr DECIMAL(10,2) DEFAULT 0,
  starter_revenue DECIMAL(10,2) DEFAULT 0,
  pro_revenue DECIMAL(10,2) DEFAULT 0,
  elite_revenue DECIMAL(10,2) DEFAULT 0,
  call_costs DECIMAL(10,2) DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  
  -- User counts on this date
  active_subscriptions INTEGER DEFAULT 0,
  new_subscriptions INTEGER DEFAULT 0,
  cancelled_subscriptions INTEGER DEFAULT 0,
  
  -- Call metrics
  total_calls INTEGER DEFAULT 0,
  total_call_minutes INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for date queries
CREATE INDEX IF NOT EXISTS idx_revenue_analytics_date ON revenue_analytics(date DESC);

-- =============================================
-- 5. ADMIN PROFIT TRACKING (Your personal profit)
-- =============================================
CREATE TABLE IF NOT EXISTS admin_profit_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  
  -- Subscription profit (daily base cost from all users)
  subscription_profit DECIMAL(10,2) DEFAULT 0,
  starter_daily_profit DECIMAL(10,2) DEFAULT 0,
  pro_daily_profit DECIMAL(10,2) DEFAULT 0,
  elite_daily_profit DECIMAL(10,2) DEFAULT 0,
  
  -- Minutes profit (your profit margin on call minutes)
  minutes_profit DECIMAL(10,2) DEFAULT 0,
  total_minutes_sold DECIMAL(10,2) DEFAULT 0, -- Total charged to users
  total_minutes_cost DECIMAL(10,2) DEFAULT 0, -- Your cost
  
  -- Combined totals
  total_daily_profit DECIMAL(10,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for date queries
CREATE INDEX IF NOT EXISTS idx_admin_profit_tracking_date ON admin_profit_tracking(date DESC);

-- =============================================
-- 5. USER ALERTS (System-generated alerts for admin)
-- =============================================
CREATE TABLE IF NOT EXISTS user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'low_balance', 'trial_expiring', 'setup_pending', 'payment_failed', 'high_call_volume'
  severity TEXT DEFAULT 'info', -- 'info', 'warning', 'critical'
  message TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  metadata JSONB, -- Additional context about the alert
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_alerts_user_id ON user_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_alerts_is_resolved ON user_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_user_alerts_severity ON user_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_user_alerts_created_at ON user_alerts(created_at DESC);

-- =============================================
-- 6. WEBHOOK FAILURE LOG (Track N8N webhook failures)
-- =============================================
CREATE TABLE IF NOT EXISTS webhook_failure_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  webhook_url TEXT NOT NULL,
  webhook_type TEXT DEFAULT 'ai_agent', -- 'ai_agent', 'calendar', 'other'
  error_message TEXT,
  status_code INTEGER,
  request_payload JSONB,
  response_payload JSONB,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhook_failure_log_user_id ON webhook_failure_log(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_failure_log_created_at ON webhook_failure_log(created_at DESC);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity(
  p_admin_email TEXT,
  p_action_type TEXT,
  p_target_user_id UUID DEFAULT NULL,
  p_target_user_email TEXT DEFAULT NULL,
  p_action_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO admin_activity_log (
    admin_email,
    action_type,
    target_user_id,
    target_user_email,
    action_details
  ) VALUES (
    p_admin_email,
    p_action_type,
    p_target_user_id,
    p_target_user_email,
    p_action_details
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create system health snapshot
CREATE OR REPLACE FUNCTION create_system_health_snapshot(
  p_snapshot_type TEXT DEFAULT 'hourly'
)
RETURNS UUID AS $$
DECLARE
  v_snapshot_id UUID;
  v_total_users INTEGER;
  v_free_trial INTEGER;
  v_starter INTEGER;
  v_pro INTEGER;
  v_elite INTEGER;
  v_vip INTEGER;
  v_new_signups INTEGER;
  v_total_calls INTEGER;
  v_total_minutes INTEGER;
  v_mrr DECIMAL(10,2);
BEGIN
  -- Get user counts
  SELECT COUNT(*) INTO v_total_users FROM profiles;
  SELECT COUNT(*) INTO v_free_trial FROM profiles WHERE subscription_tier = 'free_trial';
  SELECT COUNT(*) INTO v_starter FROM profiles WHERE subscription_tier = 'starter';
  SELECT COUNT(*) INTO v_pro FROM profiles WHERE subscription_tier = 'pro';
  SELECT COUNT(*) INTO v_elite FROM profiles WHERE subscription_tier = 'elite';
  SELECT COUNT(*) INTO v_vip FROM profiles WHERE subscription_tier = 'free_access';
  
  -- New signups in last 24 hours
  SELECT COUNT(*) INTO v_new_signups 
  FROM profiles 
  WHERE created_at >= NOW() - INTERVAL '24 hours';
  
  -- Call metrics (last 24 hours)
  SELECT COUNT(*), COALESCE(SUM(duration), 0)
  INTO v_total_calls, v_total_minutes
  FROM calls
  WHERE created_at >= NOW() - INTERVAL '24 hours';
  
  -- Calculate MRR
  SELECT COALESCE(
    SUM(CASE subscription_tier
      WHEN 'starter' THEN 499
      WHEN 'pro' THEN 899
      WHEN 'elite' THEN 1499
      ELSE 0
    END), 0
  ) INTO v_mrr
  FROM subscriptions
  WHERE status = 'active';
  
  -- Insert snapshot
  INSERT INTO system_health_snapshots (
    snapshot_type,
    total_users,
    free_trial_users,
    starter_users,
    pro_users,
    elite_users,
    vip_users,
    new_signups_24h,
    total_calls_24h,
    total_minutes_24h,
    total_mrr
  ) VALUES (
    p_snapshot_type,
    v_total_users,
    v_free_trial,
    v_starter,
    v_pro,
    v_elite,
    v_vip,
    v_new_signups,
    v_total_calls,
    v_total_minutes / 60, -- Convert to minutes
    v_mrr
  )
  RETURNING id INTO v_snapshot_id;
  
  RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create user alert
CREATE OR REPLACE FUNCTION create_user_alert(
  p_user_id UUID,
  p_alert_type TEXT,
  p_severity TEXT,
  p_message TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  -- Check if similar unresolved alert already exists
  IF EXISTS (
    SELECT 1 FROM user_alerts
    WHERE user_id = p_user_id
    AND alert_type = p_alert_type
    AND is_resolved = FALSE
  ) THEN
    -- Don't create duplicate alert
    RETURN NULL;
  END IF;
  
  INSERT INTO user_alerts (
    user_id,
    alert_type,
    severity,
    message,
    metadata
  ) VALUES (
    p_user_id,
    p_alert_type,
    p_severity,
    p_message,
    p_metadata
  )
  RETURNING id INTO v_alert_id;
  
  RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql;

-- Function to resolve user alert
CREATE OR REPLACE FUNCTION resolve_user_alert(
  p_alert_id UUID,
  p_resolved_by TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_alerts
  SET 
    is_resolved = TRUE,
    resolved_at = NOW(),
    resolved_by = p_resolved_by
  WHERE id = p_alert_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VIEWS FOR QUICK ANALYTICS
-- =============================================

-- View: Active users with important metrics
CREATE OR REPLACE VIEW admin_user_overview AS
SELECT 
  p.user_id,
  p.full_name,
  au.email,
  p.subscription_tier,
  COALESCE(cb.balance, 0) as call_balance,
  p.ai_setup_status,
  p.free_trial_ends_at,
  p.created_at as user_created_at,
  (
    SELECT COUNT(*) 
    FROM calls c2 
    WHERE c2.user_id = p.user_id
  ) as total_calls,
  (
    SELECT COUNT(*) 
    FROM user_alerts ua 
    WHERE ua.user_id = p.user_id 
    AND ua.is_resolved = FALSE
  ) as unresolved_alerts,
  (
    SELECT COUNT(*) 
    FROM admin_user_notes aun 
    WHERE aun.user_id = p.user_id
  ) as admin_notes_count
FROM profiles p
LEFT JOIN auth.users au ON p.user_id = au.id
LEFT JOIN call_balance cb ON p.user_id = cb.user_id;

-- View: Revenue summary (last 30 days)
CREATE OR REPLACE VIEW admin_revenue_summary AS
SELECT 
  date,
  total_revenue,
  mrr,
  starter_revenue,
  pro_revenue,
  elite_revenue,
  call_costs,
  active_subscriptions,
  new_subscriptions,
  cancelled_subscriptions
FROM revenue_analytics
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON TABLE admin_activity_log IS 'Tracks all admin actions for audit trail and compliance';
COMMENT ON TABLE system_health_snapshots IS 'Hourly/daily system health metrics for trend analysis';
COMMENT ON TABLE admin_user_notes IS 'Admin notes about specific users for context and follow-up';
COMMENT ON TABLE revenue_analytics IS 'Daily aggregated revenue and business metrics';
COMMENT ON TABLE user_alerts IS 'System-generated alerts requiring admin attention';
COMMENT ON TABLE webhook_failure_log IS 'Log of webhook failures for debugging';

-- =============================================
-- GRANT PERMISSIONS (if using service role)
-- =============================================
-- These tables should only be accessible via service role or admin functions
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =============================================
-- COMPLETE!
-- =============================================

