-- Migrate Auto Schedule settings from dialer_settings to ai_control_settings
-- This ensures all users with auto schedule enabled are tracked properly

-- First, let's see what we have
SELECT 
  ds.user_id,
  ds.auto_start_enabled,
  ds.auto_start_days,
  ds.daily_budget_cents,
  acs.schedule_enabled,
  acs.schedule_days,
  acs.daily_spend_limit
FROM dialer_settings ds
LEFT JOIN ai_control_settings acs ON ds.user_id = acs.user_id
WHERE ds.auto_start_enabled = true;

-- Now migrate the data
-- Convert day names to day indices: sun=0, mon=1, tue=2, wed=3, thu=4, fri=5, sat=6
INSERT INTO ai_control_settings (
  user_id,
  schedule_enabled,
  schedule_days,
  daily_spend_limit,
  status
)
SELECT 
  ds.user_id,
  ds.auto_start_enabled,
  -- Convert day names array to day indices array
  ARRAY(
    SELECT 
      CASE day_name
        WHEN 'sun' THEN 0
        WHEN 'mon' THEN 1
        WHEN 'tue' THEN 2
        WHEN 'wed' THEN 3
        WHEN 'thu' THEN 4
        WHEN 'fri' THEN 5
        WHEN 'sat' THEN 6
      END
    FROM unnest(ds.auto_start_days) AS day_name
    ORDER BY 
      CASE day_name
        WHEN 'sun' THEN 0
        WHEN 'mon' THEN 1
        WHEN 'tue' THEN 2
        WHEN 'wed' THEN 3
        WHEN 'thu' THEN 4
        WHEN 'fri' THEN 5
        WHEN 'sat' THEN 6
      END
  )::integer[] AS schedule_days,
  (ds.daily_budget_cents / 100.0) AS daily_spend_limit,
  'idle' AS status
FROM dialer_settings ds
WHERE ds.auto_start_enabled = true
ON CONFLICT (user_id) DO UPDATE SET
  schedule_enabled = EXCLUDED.schedule_enabled,
  schedule_days = EXCLUDED.schedule_days,
  daily_spend_limit = EXCLUDED.daily_spend_limit;

-- Verify the migration
SELECT 
  user_id,
  schedule_enabled,
  schedule_days,
  daily_spend_limit
FROM ai_control_settings
WHERE schedule_enabled = true
ORDER BY user_id;

