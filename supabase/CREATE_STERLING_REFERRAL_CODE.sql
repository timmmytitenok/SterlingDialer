-- =====================================================
-- CREATE DEFAULT "STERLING" REFERRAL CODE
-- =====================================================
-- This creates a public referral code that anyone can use
-- to get 30% off their first month!

-- Step 1: Create a system user for the STERLING code
-- (or use your own user_id)

-- Option A: Use YOUR user ID (recommended)
-- Replace 'YOUR_EMAIL_HERE' with your actual email

INSERT INTO referral_codes (user_id, code, created_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE' LIMIT 1),
  'STERLING',
  NOW()
)
ON CONFLICT (code) DO NOTHING;

-- Option B: If you want to create a dummy system user for this code
-- (Only use this if you don't want it tied to your account)

/*
-- First create a system profile entry (without auth user)
-- This is a workaround - not ideal but works

-- You'll need to manually get a user_id from an existing user
-- or create a dedicated "system" account

INSERT INTO referral_codes (user_id, code, created_at)
VALUES (
  'PASTE-A-REAL-USER-ID-HERE',  -- Use any existing user ID
  'STERLING',
  NOW()
)
ON CONFLICT (code) DO NOTHING;
*/

-- Step 2: Verify the code was created

SELECT 
  rc.code,
  rc.created_at,
  u.email as owner_email
FROM referral_codes rc
LEFT JOIN auth.users u ON rc.user_id = u.id
WHERE rc.code = 'STERLING';

-- Should see:
-- code: STERLING
-- owner_email: your email (or the user you chose)

-- =====================================================
-- USAGE
-- =====================================================

-- Users can now sign up with:
-- https://yourdomain.com/?ref=STERLING

-- Or enter "STERLING" during signup

-- They'll get 30% off first month!
-- Credits will go to the code owner (you or system user)

-- =====================================================
-- NOTES
-- =====================================================

-- 1. STERLING code is public - anyone can use it
-- 2. All referrals using STERLING will credit the owner $200
-- 3. If you don't want credits, you can create a special handling:
--    - Don't credit if code = 'STERLING' 
--    - Only apply discount, skip credit
-- 4. Recommended: Tie it to YOUR account and collect the credits!

-- =====================================================
-- ALTERNATIVE: Don't Credit for STERLING
-- =====================================================

-- If you want STERLING to ONLY give discount (no $200 credits):
-- Update the referral credit endpoint to skip STERLING code

/*
-- In app/api/referral/credit/route.ts:
-- Add this check before crediting:

if (referral.referral_code === 'STERLING') {
  console.log('ℹ️ STERLING code used - discount only, no credit');
  return NextResponse.json({ 
    success: true,
    message: 'Public referral code - discount applied but no credit issued'
  });
}
*/

