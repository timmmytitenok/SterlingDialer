-- Fix RLS to allow service role to insert
-- Service role SHOULD bypass RLS by default, but let's make sure

-- Option 1: Drop and recreate the insert policy to allow service role
DROP POLICY IF EXISTS "Users can insert their own calls" ON calls;

CREATE POLICY "Users can insert their own calls"
  ON calls
  FOR INSERT
  WITH CHECK (true);  -- Allow all inserts (service role will handle auth)

-- Option 2: Add a separate policy specifically for service role inserts
CREATE POLICY "Service role can insert any call"
  ON calls
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Verify the policies
SELECT policyname, cmd, roles, with_check 
FROM pg_policies 
WHERE tablename = 'calls';

