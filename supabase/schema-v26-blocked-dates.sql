-- ============================================
-- SCHEMA V26: Scheduling & Availability Feature
-- Add schedule settings columns to user_retell_config
-- ============================================

-- blocked_dates: Array of date strings (YYYY-MM-DD) when user is NOT available
-- Format: ["2025-01-07", "2025-01-15", "2025-02-14"]
ALTER TABLE user_retell_config 
ADD COLUMN IF NOT EXISTS blocked_dates JSONB DEFAULT '[]'::jsonb;

-- booking_days: Which days of week can book appointments (0=Sun, 6=Sat)
-- Default: Mon-Fri [1,2,3,4,5]
ALTER TABLE user_retell_config 
ADD COLUMN IF NOT EXISTS booking_days JSONB DEFAULT '[1,2,3,4,5]'::jsonb;

-- min_booking_days: Minimum days before an appointment can be booked
-- 0=same day, 1=next day, 2=2 days out, etc.
ALTER TABLE user_retell_config 
ADD COLUMN IF NOT EXISTS min_booking_days INTEGER DEFAULT 1;

-- auto_dialer_enabled: Whether the auto-dialer is enabled
ALTER TABLE user_retell_config 
ADD COLUMN IF NOT EXISTS auto_dialer_enabled BOOLEAN DEFAULT false;

-- dialer_days: Which days of week the AI dialer runs (0=Sun, 6=Sat)
-- Default: Mon-Fri [1,2,3,4,5]
ALTER TABLE user_retell_config 
ADD COLUMN IF NOT EXISTS dialer_days JSONB DEFAULT '[1,2,3,4,5]'::jsonb;

-- dialer_start_time: When the auto-dialer starts each day
ALTER TABLE user_retell_config 
ADD COLUMN IF NOT EXISTS dialer_start_time TEXT DEFAULT '09:00';

-- dialer_daily_budget: Daily budget for auto-dialer in dollars
ALTER TABLE user_retell_config 
ADD COLUMN IF NOT EXISTS dialer_daily_budget NUMERIC(10,2) DEFAULT 25.00;

-- dialer_skip_dates: Specific dates to skip AI dialer (vacation, etc.)
-- Format: ["2025-01-07", "2025-01-08", "2025-01-09"]
ALTER TABLE user_retell_config 
ADD COLUMN IF NOT EXISTS dialer_skip_dates JSONB DEFAULT '[]'::jsonb;

-- dialer_extra_dates: Specific dates to activate AI dialer (normally off days made active)
-- Format: ["2025-01-11", "2025-01-18"] (e.g., Saturdays that should be active)
ALTER TABLE user_retell_config 
ADD COLUMN IF NOT EXISTS dialer_extra_dates JSONB DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN user_retell_config.blocked_dates IS 'Array of date strings (YYYY-MM-DD) when the user is NOT available for appointments.';
COMMENT ON COLUMN user_retell_config.booking_days IS 'Array of day numbers (0-6) when appointments can be booked. 0=Sunday, 6=Saturday.';
COMMENT ON COLUMN user_retell_config.min_booking_days IS 'Minimum days in advance for booking. 0=same day, 1=next day, etc.';
COMMENT ON COLUMN user_retell_config.auto_dialer_enabled IS 'Whether the auto-dialer schedule is active.';
COMMENT ON COLUMN user_retell_config.dialer_days IS 'Array of day numbers (0-6) when the auto-dialer runs.';
COMMENT ON COLUMN user_retell_config.dialer_start_time IS 'Time when auto-dialer starts each day (HH:MM format).';
COMMENT ON COLUMN user_retell_config.dialer_daily_budget IS 'Daily budget for auto-dialer in dollars.';
COMMENT ON COLUMN user_retell_config.dialer_skip_dates IS 'Array of date strings (YYYY-MM-DD) when the AI dialer should NOT run (override weekly schedule to OFF).';
COMMENT ON COLUMN user_retell_config.dialer_extra_dates IS 'Array of date strings (YYYY-MM-DD) when the AI dialer SHOULD run even if normally off (override weekly schedule to ON).';

-- Create index for blocked_dates lookup
CREATE INDEX IF NOT EXISTS idx_user_retell_config_blocked_dates 
ON user_retell_config USING GIN (blocked_dates);

-- Verify columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_retell_config' 
AND column_name IN ('blocked_dates', 'booking_days', 'min_booking_days', 'auto_dialer_enabled', 'dialer_days', 'dialer_start_time', 'dialer_daily_budget', 'dialer_skip_dates', 'dialer_extra_dates');

