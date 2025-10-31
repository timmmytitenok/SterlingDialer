# Stripe Webhook Customer ID Fix

## Problem
When purchasing a subscription, the payment would process forever and the UI wouldn't update. The terminal showed errors:
- "Profile lookup error: Cannot coerce the result to a single JSON object"
- "Profile not found by customer_id, checking Stripe metadata..."
- "No user found for customer: cus_XXX"

## Root Cause
The Stripe webhook handler was using `.single()` when looking up profiles by `stripe_customer_id`. This method throws an error when no rows are found, causing the webhook to fail before it could reach the fallback logic that retrieves the user_id from Stripe customer metadata.

## Solution Implemented

### 1. Fixed Webhook Handler (webhook/route.ts)
- **Changed**: `.single()` → `.maybeSingle()` in two places
- **Effect**: Now returns `null` instead of throwing an error when no profile is found
- **Result**: Webhook can now gracefully fall back to Stripe metadata lookup

### 2. Improved Create-Checkout Route (create-checkout/route.ts)
- **Changed**: Error handling to be non-fatal when customer ID save fails
- **Changed**: `.single()` → `.maybeSingle()` for the profile update
- **Effect**: Checkout continues even if profile update fails
- **Result**: Stripe customer metadata serves as reliable fallback

### 3. Added Database Index (schema-v15-stripe-customer-index.sql)
- **Added**: Unique index on `profiles.stripe_customer_id`
- **Effect**: Ensures one-to-one mapping between Stripe customers and profiles
- **Benefit**: Faster lookups and prevents duplicate customer IDs

## What You Need to Do

### Apply the Database Migration
Run this SQL in your Supabase SQL Editor:

```sql
-- Add unique index on stripe_customer_id in profiles table
CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_customer_id_unique_idx 
  ON profiles(stripe_customer_id) 
  WHERE stripe_customer_id IS NOT NULL;

COMMENT ON INDEX profiles_stripe_customer_id_unique_idx IS 
  'Ensures unique mapping between Stripe customers and user profiles, excluding NULL values';
```

### Test the Fix
1. Try purchasing a subscription again
2. Monitor the terminal output - you should now see:
   - ✅ "Found user ID in Stripe metadata" (if customer_id lookup fails)
   - ✅ "Profile updated with customer ID" (when it saves successfully)
   - ✅ "Subscription created/updated for user"
3. The UI should update immediately after payment completes

## How It Works Now

### Happy Path:
1. User clicks "Subscribe"
2. Stripe customer created with `metadata.supabase_user_id`
3. Customer ID saved to profile (if possible)
4. Checkout session created
5. User completes payment
6. Webhook receives event
7. Webhook finds profile by customer_id ✅
8. Subscription created in database
9. UI updates immediately

### Fallback Path (if customer_id not in profile):
1. User clicks "Subscribe"
2. Stripe customer created with `metadata.supabase_user_id`
3. Customer ID save fails or is skipped
4. Checkout session created anyway
5. User completes payment
6. Webhook receives event
7. Webhook can't find profile by customer_id (returns null, no error)
8. Webhook retrieves user_id from Stripe customer metadata ✅
9. Webhook updates profile with customer_id
10. Subscription created in database
11. UI updates immediately

## Key Improvements

1. **Resilient**: Works even if profile updates fail
2. **Self-healing**: Automatically saves customer_id during webhook if missing
3. **Performant**: Unique index speeds up customer lookups
4. **Safe**: Prevents duplicate customer IDs in database

## Logging
Watch for these new log messages:
- ✅ "Found user ID in Stripe metadata: [user_id]"
- ✅ "Profile updated with customer ID"
- ⚠️ "Continuing with checkout - customer ID will be retrieved from Stripe metadata"
- ⚠️ "No profile found to update with customer ID"

All of these are now handled gracefully instead of failing.

