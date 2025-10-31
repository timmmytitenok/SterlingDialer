import { createClient } from '@supabase/supabase-js';

// Service role client - has full access, bypasses RLS
// ⚠️ ONLY use this server-side - never expose to client
export const createServiceRoleClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // ⚠️ Never expose this to client
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};

