-- =====================================================
-- AI SETUP STATUS MANAGEMENT - Quick Commands
-- =====================================================
-- Use these commands in Supabase SQL Editor to manage user AI setup status

-- =====================================================
-- 1. VIEW ALL USERS PENDING SETUP
-- =====================================================
-- See all users waiting for AI configuration
SELECT 
  p.user_id,
  p.full_name,
  u.email,
  p.ai_setup_status,
  s.subscription_tier,
  p.setup_requested_at,
  EXTRACT(EPOCH FROM (NOW() - p.setup_requested_at)) / 3600 AS hours_waiting
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
LEFT JOIN subscriptions s ON p.user_id = s.user_id AND s.status = 'active'
WHERE p.ai_setup_status IN ('pending_setup', 'maintenance')
ORDER BY p.setup_requested_at ASC;


-- =====================================================
-- 2. MARK USER AS READY (Setup Complete)
-- =====================================================
-- Run this when you've finished setting up their AI/N8N workflows
-- Replace 'USER_EMAIL_HERE' with the actual user email

UPDATE profiles
SET 
  ai_setup_status = 'ready',
  setup_completed_at = NOW()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'USER_EMAIL_HERE'
);

-- Verify the update
SELECT 
  u.email,
  p.ai_setup_status,
  p.setup_requested_at,
  p.setup_completed_at,
  s.subscription_tier
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
LEFT JOIN subscriptions s ON p.user_id = s.user_id AND s.status = 'active'
WHERE u.email = 'USER_EMAIL_HERE';


-- =====================================================
-- 3. MANUALLY SET USER TO PENDING (For Testing)
-- =====================================================
-- Use this to test the setup pending UI

UPDATE profiles
SET 
  ai_setup_status = 'pending_setup',
  setup_requested_at = NOW(),
  setup_completed_at = NULL
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'USER_EMAIL_HERE'
);


-- =====================================================
-- 4. SET USER TO MAINTENANCE MODE (During Upgrade)
-- =====================================================
-- Use this when user upgrades and you need to configure new workflows

UPDATE profiles
SET 
  ai_setup_status = 'maintenance',
  setup_requested_at = NOW()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'USER_EMAIL_HERE'
);


-- =====================================================
-- 5. BULK MARK ALL PENDING AS READY
-- =====================================================
-- Careful! This marks ALL pending setups as ready

UPDATE profiles
SET 
  ai_setup_status = 'ready',
  setup_completed_at = NOW()
WHERE ai_setup_status IN ('pending_setup', 'maintenance');


-- =====================================================
-- 6. GET USER STATUS BY EMAIL
-- =====================================================
-- Quick lookup for a specific user

SELECT 
  u.email,
  p.ai_setup_status,
  s.subscription_tier,
  p.setup_requested_at,
  p.setup_completed_at,
  CASE 
    WHEN p.ai_setup_status = 'ready' THEN '✅ Can use AI'
    WHEN p.ai_setup_status = 'pending_setup' THEN '⏳ Setup in progress'
    WHEN p.ai_setup_status = 'maintenance' THEN '🔧 Maintenance mode'
  END as status_display
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
LEFT JOIN subscriptions s ON p.user_id = s.user_id AND s.status = 'active'
WHERE u.email = 'USER_EMAIL_HERE';


-- =====================================================
-- 7. RESET SETUP STATUS (Emergency)
-- =====================================================
-- If something goes wrong, reset to ready

UPDATE profiles
SET 
  ai_setup_status = 'ready',
  setup_requested_at = NULL,
  setup_completed_at = NOW()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'USER_EMAIL_HERE'
);

