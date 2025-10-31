-- Run this in Supabase SQL Editor to check RLS policies

-- 1. Check if RLS is enabled on calls table
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'calls';

-- 2. Check all policies on calls table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'calls';

-- 3. Check if service role can bypass RLS
-- (Service role SHOULD bypass RLS, but let's verify)

-- 4. Try a direct insert to see if it works
-- Replace YOUR_USER_ID with your actual user ID
INSERT INTO calls (
  user_id,
  disposition,
  outcome,
  contact_name,
  contact_phone,
  duration_seconds,
  connected,
  created_at
) VALUES (
  'YOUR_USER_ID',  -- <-- REPLACE THIS
  'answered',
  'appointment_booked',
  'SQL TEST INSERT',
  '555-SQL-TEST',
  99,
  true,
  NOW()
) RETURNING *;

-- If this insert works, the problem is with the service role client
-- If this insert fails, RLS policies need fixing

