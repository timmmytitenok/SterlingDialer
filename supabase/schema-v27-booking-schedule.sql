-- ============================================
-- SCHEMA V27: Enhanced Booking Schedule
-- Run ALL of these commands in Supabase SQL Editor
-- ============================================

-- 1. Add booking_schedule (per-day schedule with times)
ALTER TABLE user_retell_config 
ADD COLUMN IF NOT EXISTS booking_schedule JSONB DEFAULT '{
  "0": {"enabled": false, "start": "09:00", "end": "17:00"},
  "1": {"enabled": true, "start": "09:00", "end": "17:00"},
  "2": {"enabled": true, "start": "09:00", "end": "17:00"},
  "3": {"enabled": true, "start": "09:00", "end": "17:00"},
  "4": {"enabled": true, "start": "09:00", "end": "17:00"},
  "5": {"enabled": true, "start": "09:00", "end": "17:00"},
  "6": {"enabled": false, "start": "09:00", "end": "17:00"}
}'::jsonb;

-- 2. Add booking start/end time (global fallback)
ALTER TABLE user_retell_config 
ADD COLUMN IF NOT EXISTS booking_start_time TEXT DEFAULT '09:00';

ALTER TABLE user_retell_config 
ADD COLUMN IF NOT EXISTS booking_end_time TEXT DEFAULT '17:00';

-- 3. Add booking_extra_dates (normally off but manually enabled)
ALTER TABLE user_retell_config 
ADD COLUMN IF NOT EXISTS booking_extra_dates JSONB DEFAULT '[]'::jsonb;

-- 4. Make sure all the v26 columns exist too (in case they weren't added)
ALTER TABLE user_retell_config 
ADD COLUMN IF NOT EXISTS blocked_dates JSONB DEFAULT '[]'::jsonb;

ALTER TABLE user_retell_config 
ADD COLUMN IF NOT EXISTS booking_days JSONB DEFAULT '[1,2,3,4,5]'::jsonb;

ALTER TABLE user_retell_config 
ADD COLUMN IF NOT EXISTS min_booking_days INTEGER DEFAULT 1;

ALTER TABLE user_retell_config 
ADD COLUMN IF NOT EXISTS auto_dialer_enabled BOOLEAN DEFAULT false;

ALTER TABLE user_retell_config 
ADD COLUMN IF NOT EXISTS dialer_days JSONB DEFAULT '[1,2,3,4,5]'::jsonb;

ALTER TABLE user_retell_config 
ADD COLUMN IF NOT EXISTS dialer_start_time TEXT DEFAULT '09:00';

ALTER TABLE user_retell_config 
ADD COLUMN IF NOT EXISTS dialer_daily_budget NUMERIC(10,2) DEFAULT 25.00;

ALTER TABLE user_retell_config 
ADD COLUMN IF NOT EXISTS dialer_skip_dates JSONB DEFAULT '[]'::jsonb;

ALTER TABLE user_retell_config 
ADD COLUMN IF NOT EXISTS dialer_extra_dates JSONB DEFAULT '[]'::jsonb;

-- 5. Verify all columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_retell_config' 
ORDER BY ordinal_position;
