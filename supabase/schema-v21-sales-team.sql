-- =====================================================
-- SALES TEAM MANAGEMENT SCHEMA
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Sales Team Members Table
CREATE TABLE IF NOT EXISTS sales_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT, -- For separate auth (optional, can use Supabase auth)
  full_name TEXT NOT NULL,
  phone TEXT,
  referral_code TEXT UNIQUE NOT NULL,
  commission_type TEXT DEFAULT 'recurring' CHECK (commission_type IN ('recurring', 'one_time')),
  commission_rate NUMERIC DEFAULT 0.35,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  total_earnings NUMERIC DEFAULT 0,
  total_paid NUMERIC DEFAULT 0,
  pending_payout NUMERIC DEFAULT 0,
  total_users_referred INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  notes TEXT,
  dashboard_stat TEXT DEFAULT 'pending', -- Saved dashboard stat preference
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add dashboard_stat column if table already exists
ALTER TABLE sales_team ADD COLUMN IF NOT EXISTS dashboard_stat TEXT DEFAULT 'pending';

-- Add commission_type to sales_referrals (per-user commission type)
ALTER TABLE sales_referrals ADD COLUMN IF NOT EXISTS commission_type TEXT DEFAULT 'recurring' CHECK (commission_type IN ('recurring', 'one_time'));

-- 2. Sales Referrals - Links users to sales people
CREATE TABLE IF NOT EXISTS sales_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_person_id UUID REFERENCES sales_team(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  user_email TEXT,
  user_name TEXT,
  referral_code TEXT NOT NULL,
  lead_source TEXT DEFAULT 'self' CHECK (lead_source IN ('self', 'provided')),
  status TEXT DEFAULT 'trial' CHECK (status IN ('trial', 'converted', 'churned', 'cancelled')),
  subscription_amount NUMERIC DEFAULT 0,
  converted_at TIMESTAMPTZ,
  churned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Sales Commissions/Payouts
CREATE TABLE IF NOT EXISTS sales_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_person_id UUID REFERENCES sales_team(id) ON DELETE SET NULL,
  referral_id UUID REFERENCES sales_referrals(id) ON DELETE SET NULL,
  user_id UUID,
  user_email TEXT,
  amount NUMERIC NOT NULL,
  commission_type TEXT NOT NULL CHECK (commission_type IN ('recurring', 'one_time')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  month_year TEXT, -- e.g., '2025-01' for recurring tracking
  description TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add referral tracking to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by_sales TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sales_referral_id UUID;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_team_referral_code ON sales_team(referral_code);
CREATE INDEX IF NOT EXISTS idx_sales_team_email ON sales_team(email);
CREATE INDEX IF NOT EXISTS idx_sales_team_status ON sales_team(status);

CREATE INDEX IF NOT EXISTS idx_sales_referrals_sales_person ON sales_referrals(sales_person_id);
CREATE INDEX IF NOT EXISTS idx_sales_referrals_user ON sales_referrals(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_referrals_code ON sales_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_sales_referrals_status ON sales_referrals(status);

CREATE INDEX IF NOT EXISTS idx_sales_commissions_sales_person ON sales_commissions(sales_person_id);
CREATE INDEX IF NOT EXISTS idx_sales_commissions_status ON sales_commissions(status);
CREATE INDEX IF NOT EXISTS idx_sales_commissions_month ON sales_commissions(month_year);

-- 6. Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_code TEXT;
  final_code TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base code from first 4 letters of name + random 4 digits
  base_code := UPPER(LEFT(REGEXP_REPLACE(name, '[^a-zA-Z]', '', 'g'), 4));
  IF LENGTH(base_code) < 4 THEN
    base_code := base_code || 'SALE';
  END IF;
  
  LOOP
    final_code := base_code || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Check if code exists
    IF NOT EXISTS (SELECT 1 FROM sales_team WHERE referral_code = final_code) THEN
      RETURN final_code;
    END IF;
    
    counter := counter + 1;
    IF counter > 100 THEN
      -- Fallback to UUID-based code
      RETURN 'REF' || UPPER(LEFT(gen_random_uuid()::TEXT, 8));
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 7. Function to update sales team stats
CREATE OR REPLACE FUNCTION update_sales_team_stats(sales_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE sales_team
  SET 
    total_users_referred = (
      SELECT COUNT(*) FROM sales_referrals WHERE sales_person_id = sales_id
    ),
    total_conversions = (
      SELECT COUNT(*) FROM sales_referrals WHERE sales_person_id = sales_id AND status = 'converted'
    ),
    total_earnings = (
      SELECT COALESCE(SUM(amount), 0) FROM sales_commissions 
      WHERE sales_person_id = sales_id AND status IN ('pending', 'paid')
    ),
    total_paid = (
      SELECT COALESCE(SUM(amount), 0) FROM sales_commissions 
      WHERE sales_person_id = sales_id AND status = 'paid'
    ),
    pending_payout = (
      SELECT COALESCE(SUM(amount), 0) FROM sales_commissions 
      WHERE sales_person_id = sales_id AND status = 'pending'
    ),
    updated_at = NOW()
  WHERE id = sales_id;
END;
$$ LANGUAGE plpgsql;

-- 8. RLS Policies (disable for now, admin manages via service role)
ALTER TABLE sales_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_commissions ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access to sales_team" ON sales_team
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to sales_referrals" ON sales_referrals
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to sales_commissions" ON sales_commissions
  FOR ALL USING (true) WITH CHECK (true);

-- Sales team members can read their own data
CREATE POLICY "Sales team can read own data" ON sales_team
  FOR SELECT USING (email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Sales team can read own referrals" ON sales_referrals
  FOR SELECT USING (
    sales_person_id IN (
      SELECT id FROM sales_team WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

CREATE POLICY "Sales team can read own commissions" ON sales_commissions
  FOR SELECT USING (
    sales_person_id IN (
      SELECT id FROM sales_team WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

SELECT 'Sales Team schema created successfully!' as status;

