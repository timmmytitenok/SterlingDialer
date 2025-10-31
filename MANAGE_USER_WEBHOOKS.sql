-- =====================================================
-- USER N8N WEBHOOKS MANAGEMENT - Quick Commands
-- =====================================================
-- Use these commands in Supabase SQL Editor to manage user N8N webhooks

-- =====================================================
-- 1. VIEW ALL USER WEBHOOKS
-- =====================================================
-- See all configured webhooks

SELECT 
  u.email,
  s.subscription_tier,
  w.ai_agent_webhook_url,
  w.ai_agent_webhook_enabled,
  w.last_tested_at,
  w.created_at
FROM user_n8n_webhooks w
JOIN auth.users u ON w.user_id = u.id
LEFT JOIN subscriptions s ON w.user_id = s.user_id AND s.status = 'active'
ORDER BY w.created_at DESC;


-- =====================================================
-- 2. ADD WEBHOOK FOR NEW USER
-- =====================================================
-- Run this when you've created a user's N8N workflow
-- Replace 'USER_EMAIL_HERE' with the user's email
-- Replace 'WEBHOOK_URL_HERE' with their N8N webhook URL

INSERT INTO user_n8n_webhooks (user_id, ai_agent_webhook_url, ai_agent_webhook_enabled)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'USER_EMAIL_HERE'),
  'https://yourn8n.app.n8n.cloud/webhook/USER-WORKFLOW-ID',
  true
)
ON CONFLICT (user_id) 
DO UPDATE SET 
  ai_agent_webhook_url = EXCLUDED.ai_agent_webhook_url,
  ai_agent_webhook_enabled = EXCLUDED.ai_agent_webhook_enabled,
  updated_at = NOW();


-- =====================================================
-- 3. UPDATE WEBHOOK URL FOR EXISTING USER
-- =====================================================
-- Use this when you change a user's N8N workflow

UPDATE user_n8n_webhooks
SET 
  ai_agent_webhook_url = 'https://yourn8n.app.n8n.cloud/webhook/NEW-WORKFLOW-ID',
  updated_at = NOW()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'USER_EMAIL_HERE'
);


-- =====================================================
-- 4. ENABLE/DISABLE WEBHOOK
-- =====================================================
-- Enable user's webhook

UPDATE user_n8n_webhooks
SET 
  ai_agent_webhook_enabled = true,
  updated_at = NOW()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'USER_EMAIL_HERE'
);

-- Disable user's webhook (prevents AI launch)

UPDATE user_n8n_webhooks
SET 
  ai_agent_webhook_enabled = false,
  updated_at = NOW()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'USER_EMAIL_HERE'
);


-- =====================================================
-- 5. VIEW USERS WITHOUT WEBHOOKS
-- =====================================================
-- Find users who have subscriptions but no webhook configured

SELECT 
  u.email,
  s.subscription_tier,
  s.status as subscription_status,
  p.ai_setup_status
FROM auth.users u
JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN user_n8n_webhooks w ON u.id = w.user_id
WHERE w.id IS NULL
ORDER BY s.created_at DESC;


-- =====================================================
-- 6. DELETE WEBHOOK CONFIGURATION
-- =====================================================
-- Remove webhook config for a user (use with caution)

DELETE FROM user_n8n_webhooks
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'USER_EMAIL_HERE'
);


-- =====================================================
-- 7. BULK INSERT WEBHOOKS (For Multiple Users)
-- =====================================================
-- Use this when setting up multiple users at once

INSERT INTO user_n8n_webhooks (user_id, ai_agent_webhook_url, ai_agent_webhook_enabled)
VALUES
  ((SELECT id FROM auth.users WHERE email = 'user1@example.com'), 'https://n8n.cloud/webhook/user1-id', true),
  ((SELECT id FROM auth.users WHERE email = 'user2@example.com'), 'https://n8n.cloud/webhook/user2-id', true),
  ((SELECT id FROM auth.users WHERE email = 'user3@example.com'), 'https://n8n.cloud/webhook/user3-id', true)
ON CONFLICT (user_id) 
DO UPDATE SET 
  ai_agent_webhook_url = EXCLUDED.ai_agent_webhook_url,
  updated_at = NOW();


-- =====================================================
-- 8. VERIFY USER CAN LAUNCH AI
-- =====================================================
-- Check if user has everything needed to launch AI

SELECT 
  u.email,
  CASE 
    WHEN s.id IS NULL THEN '❌ No subscription'
    WHEN s.status != 'active' THEN '❌ Subscription not active'
    WHEN p.ai_setup_status != 'ready' THEN '❌ Setup not complete (' || p.ai_setup_status || ')'
    WHEN w.id IS NULL THEN '❌ No webhook configured'
    WHEN w.ai_agent_webhook_enabled = false THEN '❌ Webhook disabled'
    ELSE '✅ Can launch AI'
  END as can_launch,
  s.subscription_tier,
  p.ai_setup_status,
  w.ai_agent_webhook_url,
  w.ai_agent_webhook_enabled
FROM auth.users u
LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN user_n8n_webhooks w ON u.id = w.user_id
WHERE u.email = 'USER_EMAIL_HERE';


-- =====================================================
-- 9. GET WEBHOOK BY EMAIL (Quick Lookup)
-- =====================================================

SELECT 
  u.email,
  w.ai_agent_webhook_url,
  w.ai_agent_webhook_enabled,
  w.last_tested_at,
  w.updated_at
FROM user_n8n_webhooks w
JOIN auth.users u ON w.user_id = u.id
WHERE u.email = 'USER_EMAIL_HERE';


-- =====================================================
-- 10. UPDATE WHEN WEBHOOK IS TESTED
-- =====================================================
-- Run this after successfully testing a webhook

UPDATE user_n8n_webhooks
SET 
  last_tested_at = NOW(),
  updated_at = NOW()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'USER_EMAIL_HERE'
);

