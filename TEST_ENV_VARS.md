# Test Your Environment Variables

## Check if SUPABASE_SERVICE_ROLE_KEY is set

Run this in your terminal:

```bash
cd /Users/timothytitenok/life-insurance
cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY
```

You should see something like:
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...very_long_key
```

If you see **nothing** or it's empty, that's the problem!

## Get Your Service Role Key

1. Go to https://supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Scroll to **Project API keys**
5. Copy the **`service_role` key** (NOT the anon key!)
6. Add it to your `.env.local`:

```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

7. **Restart your dev server**

## Why This Fixes It

The `create-from-link` API uses `createServiceRoleClient()` which needs the service role key to bypass Row Level Security and create referral entries.

Without it, the API crashes when trying to access the database!

