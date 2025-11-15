-- ============================================================================
-- FIX YOUR LEADS - Run this in Supabase SQL Editor NOW!
-- ============================================================================

-- Step 1: Check what's wrong with your leads
SELECT 
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE is_qualified = true) as qualified_leads,
  COUNT(*) FILTER (WHERE is_qualified = false OR is_qualified IS NULL) as unqualified_leads,
  COUNT(*) FILTER (WHERE status = 'new') as new_status,
  COUNT(*) FILTER (WHERE status IN ('dead_lead', 'not_interested')) as dead_status
FROM leads;

-- Step 2: Fix ALL leads to be qualified and have 'new' status
UPDATE leads 
SET 
  is_qualified = true,
  status = 'new'
WHERE is_qualified IS NULL 
   OR is_qualified = false
   OR status NOT IN ('new', 'callback_later', 'unclassified');

-- Step 3: Verify the fix worked
SELECT 
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE is_qualified = true) as qualified_leads,
  COUNT(*) FILTER (WHERE status = 'new') as new_status
FROM leads;

-- Step 4: Show a sample of your leads
SELECT 
  id,
  name,
  phone,
  status,
  is_qualified,
  created_at
FROM leads
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- After running this, your leads should be:
-- ✅ is_qualified = true
-- ✅ status = 'new'
-- ✅ Ready to be called!
-- ============================================================================

