-- ============================================================================
-- AFFILIATE TRACKING SYSTEM - Manual Payouts
-- ============================================================================
-- Tracks affiliate commissions and manual payout history
-- Commission: 20% of $499/month = $99.80 per active referred user
-- ============================================================================

-- Commission Payouts Table
CREATE TABLE IF NOT EXISTS commission_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- Format: '2025-11'
  amount DECIMAL(10,2) NOT NULL, -- $99.80
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed'
  paid_at TIMESTAMPTZ,
  paid_via TEXT, -- 'paypal', 'venmo', 'bank_transfer', 'stripe'
  payment_reference TEXT, -- Transaction ID or note
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate commissions for same user in same month
  UNIQUE(referrer_id, referee_id, month)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_commission_payouts_referrer ON commission_payouts(referrer_id);
CREATE INDEX IF NOT EXISTS idx_commission_payouts_month ON commission_payouts(month);
CREATE INDEX IF NOT EXISTS idx_commission_payouts_status ON commission_payouts(status);
CREATE INDEX IF NOT EXISTS idx_commission_payouts_created_at ON commission_payouts(created_at DESC);

-- Affiliate Stats Summary (denormalized for fast dashboard)
CREATE TABLE IF NOT EXISTS affiliate_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_referrals INTEGER DEFAULT 0, -- All-time signups
  active_referrals INTEGER DEFAULT 0, -- Currently paying users
  pending_this_month DECIMAL(10,2) DEFAULT 0, -- Unpaid commission this month
  total_earned_all_time DECIMAL(10,2) DEFAULT 0, -- All-time commissions
  total_paid DECIMAL(10,2) DEFAULT 0, -- Actually paid out
  last_payout_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_stats_referrer ON affiliate_stats(referrer_id);

-- RLS Policies
ALTER TABLE commission_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_stats ENABLE ROW LEVEL SECURITY;

-- Service role can do anything
DROP POLICY IF EXISTS "Service role can manage commission payouts" ON commission_payouts;
CREATE POLICY "Service role can manage commission payouts" ON commission_payouts
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role can manage affiliate stats" ON affiliate_stats;
CREATE POLICY "Service role can manage affiliate stats" ON affiliate_stats
  FOR ALL USING (true);

-- Users can view their own stats
DROP POLICY IF EXISTS "Users can view own affiliate stats" ON affiliate_stats;
CREATE POLICY "Users can view own affiliate stats" ON affiliate_stats
  FOR SELECT USING (auth.uid() = referrer_id);

DROP POLICY IF EXISTS "Users can view own commission history" ON commission_payouts;
CREATE POLICY "Users can view own commission history" ON commission_payouts
  FOR SELECT USING (auth.uid() = referrer_id);

-- ============================================================================
-- Helper Function: Calculate Monthly Commissions
-- ============================================================================
-- Run this manually or via cron to generate commission records
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_monthly_commissions(target_month TEXT)
RETURNS TABLE (
  referrer_id UUID,
  referee_id UUID,
  amount DECIMAL,
  created BOOLEAN
) AS $$
BEGIN
  -- For each referral where referee has active subscription
  RETURN QUERY
  INSERT INTO commission_payouts (referrer_id, referee_id, month, amount, status)
  SELECT 
    r.referrer_id,
    r.referee_id,
    target_month,
    99.80, -- 20% of $499
    'pending'
  FROM referrals r
  INNER JOIN subscriptions s ON s.user_id = r.referee_id
  WHERE 
    r.status = 'completed' -- Referral must be completed
    AND s.status = 'active' -- Subscription must be active
    AND NOT EXISTS (
      -- Don't create duplicate for this month
      SELECT 1 FROM commission_payouts cp
      WHERE cp.referrer_id = r.referrer_id
        AND cp.referee_id = r.referee_id
        AND cp.month = target_month
    )
  ON CONFLICT (referrer_id, referee_id, month) DO NOTHING
  RETURNING referrer_id, referee_id, amount, true as created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Helper Function: Update Affiliate Stats
-- ============================================================================

CREATE OR REPLACE FUNCTION update_affiliate_stats(p_referrer_id UUID)
RETURNS void AS $$
DECLARE
  v_total_referrals INTEGER;
  v_active_referrals INTEGER;
  v_pending_this_month DECIMAL;
  v_total_paid DECIMAL;
  v_total_earned DECIMAL;
  v_current_month TEXT;
BEGIN
  v_current_month := TO_CHAR(NOW(), 'YYYY-MM');
  
  -- Count total referrals
  SELECT COUNT(*) INTO v_total_referrals
  FROM referrals
  WHERE referrer_id = p_referrer_id;
  
  -- Count active paying referrals
  SELECT COUNT(*) INTO v_active_referrals
  FROM referrals r
  INNER JOIN subscriptions s ON s.user_id = r.referee_id
  WHERE r.referrer_id = p_referrer_id
    AND r.status = 'completed'
    AND s.status = 'active';
  
  -- Calculate pending this month
  SELECT COALESCE(SUM(amount), 0) INTO v_pending_this_month
  FROM commission_payouts
  WHERE referrer_id = p_referrer_id
    AND month = v_current_month
    AND status = 'pending';
  
  -- Calculate total paid
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM commission_payouts
  WHERE referrer_id = p_referrer_id
    AND status = 'paid';
  
  -- Calculate total earned (paid + pending)
  SELECT COALESCE(SUM(amount), 0) INTO v_total_earned
  FROM commission_payouts
  WHERE referrer_id = p_referrer_id;
  
  -- Upsert stats
  INSERT INTO affiliate_stats (
    referrer_id,
    total_referrals,
    active_referrals,
    pending_this_month,
    total_earned_all_time,
    total_paid,
    updated_at
  ) VALUES (
    p_referrer_id,
    v_total_referrals,
    v_active_referrals,
    v_pending_this_month,
    v_total_earned,
    v_total_paid,
    NOW()
  )
  ON CONFLICT (referrer_id) DO UPDATE SET
    total_referrals = EXCLUDED.total_referrals,
    active_referrals = EXCLUDED.active_referrals,
    pending_this_month = EXCLUDED.pending_this_month,
    total_earned_all_time = EXCLUDED.total_earned_all_time,
    total_paid = EXCLUDED.total_paid,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_monthly_commissions TO service_role;
GRANT EXECUTE ON FUNCTION update_affiliate_stats TO service_role;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

