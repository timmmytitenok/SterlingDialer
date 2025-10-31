-- =====================================================
-- STERLING AI - MASTER DATABASE SCHEMA
-- Version: 2.0 (Production Ready - Full Deployment)
-- Last Updated: October 31, 2025
-- =====================================================
-- 
-- This file contains the COMPLETE database schema for Sterling AI.
-- Run this in a fresh Supabase project to set up everything.
--
-- Tables Included:
-- 1. profiles - User information
-- 2. calls - Call tracking and outcomes
-- 3. appointments - Calendar and bookings
-- 4. ai_control_settings - AI agent status
-- 5. subscriptions - Billing and plans
-- 6. call_balance - Prepaid credits
-- 7. balance_transactions - Transaction history
-- 8. revenue_tracking - Daily revenue/costs
-- 9. referral_codes - User referral codes
-- 10. referrals - Referral tracking
-- 11. calendar_settings - Calendar display prefs
-- 12. user_n8n_webhooks - Per-user N8N workflows
--
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =====================================================
-- 1. PROFILES TABLE
-- Stores user profile information
-- =====================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Basic Info
  full_name TEXT,
  phone_number TEXT,
  company_name TEXT,
  avatar_url TEXT,
  
  -- Stripe Integration
  stripe_customer_id TEXT UNIQUE,
  subscription_tier TEXT,
  subscription_status TEXT,
  has_active_subscription BOOLEAN DEFAULT FALSE,
  
  -- Referral System
  referred_by VARCHAR(12),
  
  -- AI Setup Status
  ai_setup_status TEXT DEFAULT 'ready' CHECK (ai_setup_status IN ('ready', 'pending_setup', 'maintenance')),
  setup_requested_at TIMESTAMPTZ,
  setup_completed_at TIMESTAMPTZ,
  
  -- Onboarding Status
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_completed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);
CREATE INDEX IF NOT EXISTS profiles_stripe_customer_id_idx ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS profiles_referred_by_idx ON profiles(referred_by);
CREATE INDEX IF NOT EXISTS profiles_ai_setup_status_idx ON profiles(ai_setup_status);
CREATE INDEX IF NOT EXISTS profiles_has_active_subscription_idx ON profiles(has_active_subscription);
CREATE INDEX IF NOT EXISTS profiles_subscription_tier_idx ON profiles(subscription_tier);

-- Comments
COMMENT ON TABLE profiles IS 'User profile information, Stripe integration, and AI setup status';
COMMENT ON COLUMN profiles.ai_setup_status IS 'ready: can launch AI, pending_setup: new subscriber (12-24hr setup), maintenance: upgrade in progress';
COMMENT ON COLUMN profiles.has_active_subscription IS 'Simple boolean flag - TRUE if user has ever purchased a subscription. Used by middleware for access control.';
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether the user has completed the onboarding process';
COMMENT ON COLUMN profiles.onboarding_completed_at IS 'When the user completed onboarding';
COMMENT ON COLUMN profiles.subscription_tier IS 'Current subscription tier: starter, pro, or elite';
COMMENT ON COLUMN profiles.subscription_status IS 'Current Stripe subscription status: active, canceled, etc.';
COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe customer ID for billing and subscription management';

-- =====================================================
-- 2. CALLS TABLE
-- Tracks every dial made by the AI
-- =====================================================

CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Call Details
  disposition TEXT CHECK (disposition IN ('answered', 'no_answer', 'busy', 'voicemail', 'other')) NOT NULL,
  outcome TEXT CHECK (outcome IN ('not_interested', 'callback_later', 'appointment_booked', 'live_transfer')),
  connected BOOLEAN DEFAULT false,
  
  -- Contact Info
  contact_name TEXT,
  contact_phone TEXT,
  
  -- Call Metrics
  duration_seconds INTEGER,
  recording_url TEXT,
  
  -- Legacy/Optional
  lead_id UUID, -- Optional: if using leads table
  notes TEXT,
  revenue DECIMAL(10, 2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS calls_user_id_idx ON calls(user_id);
CREATE INDEX IF NOT EXISTS calls_created_at_idx ON calls(created_at DESC);
CREATE INDEX IF NOT EXISTS calls_outcome_idx ON calls(outcome);
CREATE INDEX IF NOT EXISTS calls_connected_idx ON calls(connected);
CREATE INDEX IF NOT EXISTS calls_contact_name_idx ON calls(contact_name);

-- Comments
COMMENT ON TABLE calls IS 'Tracks every call made by AI agents (dialed and answered)';
COMMENT ON COLUMN calls.connected IS 'true if call was answered, false if no answer/busy/voicemail';
COMMENT ON COLUMN calls.outcome IS 'Only set if call was answered: appointment_booked, not_interested, callback_later, live_transfer';

-- =====================================================
-- 3. APPOINTMENTS TABLE
-- Calendar bookings and scheduled meetings
-- =====================================================

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- References
  lead_id UUID, -- Optional
  call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
  
  -- Prospect Information
  prospect_name TEXT,
  prospect_phone TEXT,
  prospect_age INTEGER,
  prospect_state TEXT,
  
  -- Appointment Details
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT CHECK (status IN ('scheduled', 'completed', 'no_show', 'cancelled', 'rescheduled', 'sold')) DEFAULT 'scheduled',
  is_no_show BOOLEAN DEFAULT false,
  
  -- Call Recording
  call_recording_url TEXT,
  
  -- Sold Policy Tracking
  is_sold BOOLEAN DEFAULT false,
  monthly_payment DECIMAL(10, 2),
  total_annual_premium DECIMAL(10, 2) GENERATED ALWAYS AS (monthly_payment * 12) STORED,
  sold_at TIMESTAMPTZ,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS appointments_user_id_idx ON appointments(user_id);
CREATE INDEX IF NOT EXISTS appointments_status_idx ON appointments(status);
CREATE INDEX IF NOT EXISTS appointments_scheduled_at_idx ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS appointments_is_no_show_idx ON appointments(is_no_show);
CREATE INDEX IF NOT EXISTS appointments_is_sold_idx ON appointments(is_sold);
CREATE INDEX IF NOT EXISTS appointments_sold_at_idx ON appointments(sold_at);
CREATE INDEX IF NOT EXISTS appointments_prospect_phone_idx ON appointments(prospect_phone);

-- Comments
COMMENT ON TABLE appointments IS 'Calendar appointments from Cal.ai bookings or manual creation';
COMMENT ON COLUMN appointments.is_sold IS 'true if policy was sold during this appointment';

-- =====================================================
-- 4. AI CONTROL SETTINGS TABLE
-- Controls AI agent status and configuration
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_control_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Status
  status TEXT CHECK (status IN ('running', 'stopped')) DEFAULT 'stopped',
  queue_length INTEGER DEFAULT 0,
  
  -- Limits
  daily_call_limit INTEGER DEFAULT 600 CHECK (daily_call_limit <= 1800),
  
  -- Settings
  auto_transfer_calls BOOLEAN DEFAULT true, -- Always enabled now
  
  -- Execution Mode
  execution_mode TEXT CHECK (execution_mode IN ('leads', 'time')) DEFAULT 'time',
  target_lead_count INTEGER, -- For 'leads' mode
  target_time_military INTEGER, -- For 'time' mode (e.g., 1800 for 6:00 PM)
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS ai_control_settings_user_id_idx ON ai_control_settings(user_id);
CREATE INDEX IF NOT EXISTS ai_control_settings_status_idx ON ai_control_settings(status);

-- Comments
COMMENT ON TABLE ai_control_settings IS 'AI agent status and execution configuration';
COMMENT ON COLUMN ai_control_settings.execution_mode IS 'leads: dial X leads then stop, time: dial until specific time';

-- =====================================================
-- 5. SUBSCRIPTIONS TABLE
-- Billing and subscription plans
-- =====================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Stripe Integration
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_price_id TEXT,
  
  -- Subscription Details
  subscription_tier TEXT DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'pro', 'elite')),
  status TEXT NOT NULL, -- active, canceled, past_due, trialing
  plan_name TEXT,
  
  -- Pricing
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'usd',
  
  -- Billing Period
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  
  -- Tier Features
  max_daily_calls INTEGER DEFAULT 600, -- 600 (starter), 1200 (pro), 1800 (elite)
  has_appointment_checker BOOLEAN DEFAULT false, -- Deprecated but kept for compatibility
  ai_caller_count INTEGER DEFAULT 1, -- 1 (starter), 2 (pro), 3 (elite)
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_idx ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS subscriptions_subscription_tier_idx ON subscriptions(subscription_tier);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(status);

-- Comments
COMMENT ON TABLE subscriptions IS 'User subscription plans and Stripe billing information';
COMMENT ON COLUMN subscriptions.max_daily_calls IS 'Starter: 600, Pro: 1200, Elite: 1800';
COMMENT ON COLUMN subscriptions.ai_caller_count IS 'Starter: 1, Pro: 2, Elite: 3';

-- =====================================================
-- 6. CALL BALANCE TABLE
-- Prepaid credits for calling ($0.10/minute)
-- =====================================================

CREATE TABLE IF NOT EXISTS call_balance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Balance
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  
  -- Auto-Refill Settings
  auto_refill_enabled BOOLEAN DEFAULT false,
  auto_refill_threshold DECIMAL(10, 2) DEFAULT 10.00,
  auto_refill_amount DECIMAL(10, 2) DEFAULT 50.00, -- 50-400 (tier-based)
  last_refill_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS call_balance_user_id_idx ON call_balance(user_id);

-- Comments
COMMENT ON TABLE call_balance IS 'Prepaid calling credits. Cost: $0.10/minute. Auto-refill triggers below $10.';
COMMENT ON COLUMN call_balance.auto_refill_amount IS 'Starter: $50-$100, Pro: $100-$200, Elite: $200-$400';

-- =====================================================
-- 7. BALANCE TRANSACTIONS TABLE
-- Audit trail for all balance changes
-- =====================================================

CREATE TABLE IF NOT EXISTS balance_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Transaction Details
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'deduction', 'refund', 'referral_credit', 'auto_refill')),
  transaction_type TEXT GENERATED ALWAYS AS (type) STORED, -- Alias for backwards compatibility
  description TEXT NOT NULL,
  
  -- Balance Tracking
  balance_after DECIMAL(10, 2) NOT NULL,
  
  -- Stripe Reference (for refills)
  stripe_payment_intent_id TEXT,
  
  -- Optional Metadata
  metadata JSONB,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS balance_transactions_user_id_idx ON balance_transactions(user_id);
CREATE INDEX IF NOT EXISTS balance_transactions_created_at_idx ON balance_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS balance_transactions_type_idx ON balance_transactions(type);

-- Comments
COMMENT ON TABLE balance_transactions IS 'Complete audit trail of all balance changes (refills, deductions, referral credits)';

-- =====================================================
-- 8. REVENUE TRACKING TABLE
-- Daily revenue, AI costs, and profit tracking
-- =====================================================

CREATE TABLE IF NOT EXISTS revenue_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Date
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Revenue
  revenue DECIMAL(10, 2) DEFAULT 0,
  
  -- AI Costs
  ai_retainer_cost DECIMAL(10, 2) DEFAULT 0, -- Monthly subscription / days in month
  ai_daily_cost DECIMAL(10, 2) DEFAULT 0, -- Call costs ($0.10/min)
  total_ai_cost DECIMAL(10, 2) GENERATED ALWAYS AS (ai_retainer_cost + ai_daily_cost) STORED,
  
  -- Profit
  profit DECIMAL(10, 2) GENERATED ALWAYS AS (revenue - (ai_retainer_cost + ai_daily_cost)) STORED,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(user_id, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS revenue_tracking_user_date_idx ON revenue_tracking(user_id, date DESC);
CREATE INDEX IF NOT EXISTS revenue_tracking_date_idx ON revenue_tracking(date DESC);

-- Comments
COMMENT ON TABLE revenue_tracking IS 'Tracks daily revenue, AI costs (subscription + calls), and profit per user';
COMMENT ON COLUMN revenue_tracking.ai_retainer_cost IS 'Daily prorated subscription cost (monthly price / days in month)';
COMMENT ON COLUMN revenue_tracking.ai_daily_cost IS 'Per-minute calling costs for the day ($0.10/min)';

-- =====================================================
-- 9. REFERRAL CODES TABLE
-- User unique referral codes
-- =====================================================

CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(12) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS referral_codes_user_id_idx ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS referral_codes_code_idx ON referral_codes(code);

-- Comments
COMMENT ON TABLE referral_codes IS 'Unique referral codes for each user (8 characters, alphanumeric)';

-- =====================================================
-- 10. REFERRALS TABLE
-- Tracks referral relationships and $200 credits
-- =====================================================

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Parties
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code VARCHAR(12) NOT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, credited
  credit_amount DECIMAL(10, 2) DEFAULT 200.00,
  
  -- Timestamps
  credited_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ, -- When referee subscribed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(referee_id) -- Each user can only be referred once
);

-- Indexes
CREATE INDEX IF NOT EXISTS referrals_referrer_id_idx ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS referrals_referee_id_idx ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS referrals_status_idx ON referrals(status);

-- Comments
COMMENT ON TABLE referrals IS 'Tracks who referred whom. Referrer gets $200 when referee subscribes.';
COMMENT ON COLUMN referrals.status IS 'pending: signup only, completed: subscribed, credited: $200 added to balance';

-- =====================================================
-- 11. CALENDAR SETTINGS TABLE
-- User calendar display preferences
-- =====================================================

CREATE TABLE IF NOT EXISTS calendar_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Display Hours
  start_hour INTEGER DEFAULT 8 CHECK (start_hour >= 0 AND start_hour < 24),
  end_hour INTEGER DEFAULT 20 CHECK (end_hour >= 0 AND end_hour <= 24),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_hour_range CHECK (end_hour > start_hour)
);

-- Index
CREATE INDEX IF NOT EXISTS calendar_settings_user_id_idx ON calendar_settings(user_id);

-- Comments
COMMENT ON TABLE calendar_settings IS 'Calendar display preferences (start/end hours for appointments view)';

-- =====================================================
-- 12. USER N8N WEBHOOKS TABLE
-- Per-user N8N workflow URLs
-- =====================================================

CREATE TABLE IF NOT EXISTS user_n8n_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- AI Calling Agent Webhook
  ai_agent_webhook_url TEXT,
  ai_agent_webhook_enabled BOOLEAN DEFAULT true,
  ai_agent_webhook_notes TEXT,
  
  -- Appointment Status Webhook (Optional)
  appointment_webhook_url TEXT,
  appointment_webhook_enabled BOOLEAN DEFAULT false,
  appointment_webhook_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_tested_at TIMESTAMPTZ,
  
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS user_n8n_webhooks_user_id_idx ON user_n8n_webhooks(user_id);
CREATE INDEX IF NOT EXISTS user_n8n_webhooks_enabled_idx ON user_n8n_webhooks(ai_agent_webhook_enabled);

-- Comments
COMMENT ON TABLE user_n8n_webhooks IS 'Per-user N8N workflow webhook URLs for isolation and scalability';
COMMENT ON COLUMN user_n8n_webhooks.ai_agent_webhook_url IS 'Required: URL to trigger user AI calling workflow';
COMMENT ON COLUMN user_n8n_webhooks.appointment_webhook_url IS 'Optional: URL for appointment reminders/confirmations';

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_control_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_n8n_webhooks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for clean re-runs)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Service role full access to profiles" ON profiles;

-- PROFILES Policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to profiles" ON profiles FOR ALL USING (auth.role() = 'service_role');

-- Drop existing calls policies
DROP POLICY IF EXISTS "Users can view their own calls" ON calls;
DROP POLICY IF EXISTS "Users can insert their own calls" ON calls;
DROP POLICY IF EXISTS "Users can update their own calls" ON calls;
DROP POLICY IF EXISTS "Users can delete their own calls" ON calls;
DROP POLICY IF EXISTS "Service role full access to calls" ON calls;

-- CALLS Policies
CREATE POLICY "Users can view their own calls" ON calls FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own calls" ON calls FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own calls" ON calls FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own calls" ON calls FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to calls" ON calls FOR ALL USING (auth.role() = 'service_role');

-- Drop existing appointments policies
DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can insert their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can delete their own appointments" ON appointments;
DROP POLICY IF EXISTS "Service role full access to appointments" ON appointments;

-- APPOINTMENTS Policies
CREATE POLICY "Users can view their own appointments" ON appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own appointments" ON appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own appointments" ON appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own appointments" ON appointments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to appointments" ON appointments FOR ALL USING (auth.role() = 'service_role');

-- Drop existing ai_control_settings policies
DROP POLICY IF EXISTS "Users can view their own ai settings" ON ai_control_settings;
DROP POLICY IF EXISTS "Users can insert their own ai settings" ON ai_control_settings;
DROP POLICY IF EXISTS "Users can update their own ai settings" ON ai_control_settings;
DROP POLICY IF EXISTS "Service role full access to ai_control_settings" ON ai_control_settings;

-- AI CONTROL SETTINGS Policies
CREATE POLICY "Users can view their own ai settings" ON ai_control_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own ai settings" ON ai_control_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ai settings" ON ai_control_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to ai_control_settings" ON ai_control_settings FOR ALL USING (auth.role() = 'service_role');

-- Drop existing subscriptions policies
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Service role full access to subscriptions" ON subscriptions;

-- SUBSCRIPTIONS Policies
CREATE POLICY "Users can view their own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subscriptions" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscriptions" ON subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to subscriptions" ON subscriptions FOR ALL USING (auth.role() = 'service_role');

-- Drop existing call_balance policies
DROP POLICY IF EXISTS "Users can view their own balance" ON call_balance;
DROP POLICY IF EXISTS "Users can update their own balance settings" ON call_balance;
DROP POLICY IF EXISTS "Service role full access to call_balance" ON call_balance;

-- CALL BALANCE Policies
CREATE POLICY "Users can view their own balance" ON call_balance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own balance settings" ON call_balance FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to call_balance" ON call_balance FOR ALL USING (auth.role() = 'service_role');

-- Drop existing balance_transactions policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON balance_transactions;
DROP POLICY IF EXISTS "Service role full access to balance_transactions" ON balance_transactions;

-- BALANCE TRANSACTIONS Policies
CREATE POLICY "Users can view their own transactions" ON balance_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to balance_transactions" ON balance_transactions FOR ALL USING (auth.role() = 'service_role');

-- Drop existing revenue_tracking policies
DROP POLICY IF EXISTS "Users can view their own revenue" ON revenue_tracking;
DROP POLICY IF EXISTS "Users can insert their own revenue" ON revenue_tracking;
DROP POLICY IF EXISTS "Users can update their own revenue" ON revenue_tracking;
DROP POLICY IF EXISTS "Service role full access to revenue_tracking" ON revenue_tracking;

-- REVENUE TRACKING Policies
CREATE POLICY "Users can view their own revenue" ON revenue_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own revenue" ON revenue_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own revenue" ON revenue_tracking FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to revenue_tracking" ON revenue_tracking FOR ALL USING (auth.role() = 'service_role');

-- Drop existing referral_codes policies
DROP POLICY IF EXISTS "Users can view their own referral code" ON referral_codes;
DROP POLICY IF EXISTS "Users can insert their own referral code" ON referral_codes;
DROP POLICY IF EXISTS "Service role full access to referral_codes" ON referral_codes;

-- REFERRAL CODES Policies
CREATE POLICY "Users can view their own referral code" ON referral_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own referral code" ON referral_codes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access to referral_codes" ON referral_codes FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Drop existing referrals policies
DROP POLICY IF EXISTS "Users can view their referrals" ON referrals;
DROP POLICY IF EXISTS "Service role full access to referrals" ON referrals;

-- REFERRALS Policies
CREATE POLICY "Users can view their referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "Service role full access to referrals" ON referrals FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Drop existing calendar_settings policies
DROP POLICY IF EXISTS "Users can view their own calendar settings" ON calendar_settings;
DROP POLICY IF EXISTS "Users can insert their own calendar settings" ON calendar_settings;
DROP POLICY IF EXISTS "Users can update their own calendar settings" ON calendar_settings;

-- CALENDAR SETTINGS Policies
CREATE POLICY "Users can view their own calendar settings" ON calendar_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own calendar settings" ON calendar_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own calendar settings" ON calendar_settings FOR UPDATE USING (auth.uid() = user_id);

-- Drop existing user_n8n_webhooks policies
DROP POLICY IF EXISTS "Users can view their own webhooks" ON user_n8n_webhooks;
DROP POLICY IF EXISTS "Users can update their own webhooks" ON user_n8n_webhooks;
DROP POLICY IF EXISTS "Service role full access to user_n8n_webhooks" ON user_n8n_webhooks;

-- USER N8N WEBHOOKS Policies
CREATE POLICY "Users can view their own webhooks" ON user_n8n_webhooks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own webhooks" ON user_n8n_webhooks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to user_n8n_webhooks" ON user_n8n_webhooks FOR ALL USING (true);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone_number, company_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_name', '')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- If profile creation fails, still allow user creation
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Initialize AI settings for new users
CREATE OR REPLACE FUNCTION initialize_ai_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ai_control_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Initialize call balance for new users
CREATE OR REPLACE FUNCTION initialize_call_balance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO call_balance (user_id, balance)
  VALUES (NEW.id, 0.00)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_control_settings_updated_at ON ai_control_settings;
CREATE TRIGGER update_ai_control_settings_updated_at
  BEFORE UPDATE ON ai_control_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_call_balance_updated_at ON call_balance;
CREATE TRIGGER update_call_balance_updated_at
  BEFORE UPDATE ON call_balance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_calendar_settings_updated_at ON calendar_settings;
CREATE TRIGGER update_calendar_settings_updated_at
  BEFORE UPDATE ON calendar_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_n8n_webhooks_updated_at ON user_n8n_webhooks;
CREATE TRIGGER update_user_n8n_webhooks_updated_at
  BEFORE UPDATE ON user_n8n_webhooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers for user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_user_created_ai_settings ON auth.users;
CREATE TRIGGER on_user_created_ai_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION initialize_ai_settings();

DROP TRIGGER IF EXISTS on_user_created_call_balance ON auth.users;
CREATE TRIGGER on_user_created_call_balance
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION initialize_call_balance();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the schema was created correctly

-- List all tables
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;

-- Count total tables (should be 12)
SELECT COUNT(*) as total_tables
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename NOT LIKE 'pg_%';

-- Verify RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'profiles', 'calls', 'appointments', 'ai_control_settings',
  'subscriptions', 'call_balance', 'balance_transactions', 
  'revenue_tracking', 'referral_codes', 'referrals',
  'calendar_settings', 'user_n8n_webhooks'
)
ORDER BY tablename;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Sterling AI Master Schema v1.0 installed successfully!';
  RAISE NOTICE '📊 Total Tables: 12';
  RAISE NOTICE '🔐 Row Level Security: Enabled';
  RAISE NOTICE '🚀 Ready for production!';
END $$;

