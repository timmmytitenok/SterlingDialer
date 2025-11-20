-- ============================================================================
-- COMPLETE AFFILIATE SYSTEM
-- ============================================================================
-- Affiliates earn $99.80/month per user ONLY when user makes first payment
-- Commission continues monthly while user remains active
-- ============================================================================

-- Add affiliate partner flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_affiliate_partner BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS affiliate_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT; -- Add this column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS affiliate_payout_method TEXT; -- 'paypal', 'venmo', 'bank'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS affiliate_payout_email TEXT; -- PayPal email, etc.

-- Add unique constraint separately (in case column already exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_affiliate_code_key'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_affiliate_code_key UNIQUE (affiliate_code);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_affiliate_code ON profiles(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_is_affiliate ON profiles(is_affiliate_partner);

-- Update referrals table to track conversion
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS conversion_status TEXT DEFAULT 'trial';
-- Values: 'trial' (in free trial), 'converted' (paid), 'cancelled' (never paid)

ALTER TABLE referrals ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ; -- When they made first payment
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS first_payment_date TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_referrals_conversion_status ON referrals(conversion_status);

-- Commission Payouts Table (if not exists from previous migration)
CREATE TABLE IF NOT EXISTS commission_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- Format: '2025-11'
  amount DECIMAL(10,2) NOT NULL DEFAULT 99.80, -- $99.80 per month
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed'
  paid_at TIMESTAMPTZ,
  paid_via TEXT, -- 'paypal', 'venmo', 'bank_transfer'
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(referrer_id, referee_id, month)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_commission_payouts_referrer ON commission_payouts(referrer_id);
CREATE INDEX IF NOT EXISTS idx_commission_payouts_month ON commission_payouts(month);
CREATE INDEX IF NOT EXISTS idx_commission_payouts_status ON commission_payouts(status);

-- RLS
ALTER TABLE commission_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON commission_payouts;
CREATE POLICY "Service role full access" ON commission_payouts
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Affiliates can view own commissions" ON commission_payouts;
CREATE POLICY "Affiliates can view own commissions" ON commission_payouts
  FOR SELECT USING (auth.uid() = referrer_id);

-- ============================================================================
-- Function: Mark Referral as Converted (Call from Stripe webhook)
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_referral_converted(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_referral RECORD;
BEGIN
  -- Find if this user was referred
  SELECT * INTO v_referral
  FROM referrals
  WHERE referee_id = p_user_id
    AND status = 'completed'
    AND conversion_status = 'trial';
  
  IF FOUND THEN
    -- Mark as converted
    UPDATE referrals
    SET 
      conversion_status = 'converted',
      converted_at = NOW(),
      first_payment_date = NOW()
    WHERE id = v_referral.id;
    
    -- Create first commission for this month
    INSERT INTO commission_payouts (
      referrer_id,
      referee_id,
      month,
      amount,
      status
    ) VALUES (
      v_referral.referrer_id,
      v_referral.referee_id,
      TO_CHAR(NOW(), 'YYYY-MM'),
      99.80,
      'pending'
    )
    ON CONFLICT (referrer_id, referee_id, month) DO NOTHING;
    
    RAISE NOTICE 'Referral converted! Commission created for referrer %', v_referral.referrer_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function: Generate Monthly Recurring Commissions
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_monthly_commissions(target_month TEXT)
RETURNS TABLE (
  referrer_id UUID,
  referee_id UUID,
  amount DECIMAL,
  created BOOLEAN
) AS $$
BEGIN
  -- Create commissions for all CONVERTED referrals with active subscriptions
  RETURN QUERY
  INSERT INTO commission_payouts (referrer_id, referee_id, month, amount, status)
  SELECT 
    r.referrer_id,
    r.referee_id,
    target_month,
    99.80,
    'pending'
  FROM referrals r
  INNER JOIN subscriptions s ON s.user_id = r.referee_id
  WHERE 
    r.conversion_status = 'converted' -- ONLY converted (paid) users
    AND s.status = 'active' -- Must have active subscription
    AND NOT EXISTS (
      SELECT 1 FROM commission_payouts cp
      WHERE cp.referrer_id = r.referrer_id
        AND cp.referee_id = r.referee_id
        AND cp.month = target_month
    )
  ON CONFLICT (referrer_id, referee_id, month) DO NOTHING
  RETURNING referrer_id, referee_id, amount, true as created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION mark_referral_converted TO service_role;
GRANT EXECUTE ON FUNCTION generate_monthly_commissions TO service_role;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

