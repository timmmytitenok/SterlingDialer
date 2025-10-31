# 🔧 Referral System Troubleshooting

## ❌ **Issue: Referral Not Creating "Pending" Status**

### **Step 1: Check Database Setup**

**MOST COMMON ISSUE:** The referral tables don't exist yet!

1. Go to your **Supabase Dashboard**
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the entire contents of: `supabase/schema-v14-referrals.sql`
5. Click **RUN** (or press Cmd/Ctrl + Enter)

You should see:
```
Success. No rows returned
```

---

### **Step 2: Verify Tables Exist**

Run this in Supabase SQL Editor:
```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('referral_codes', 'referrals');
```

**Expected Result:**
```
referral_codes
referrals
```

If you DON'T see both tables, go back to Step 1!

---

### **Step 3: Check Your Referral Code**

Run this to see your referral code:
```sql
SELECT user_id, code, created_at 
FROM referral_codes 
WHERE user_id = 'YOUR-USER-ID';
```

Replace `YOUR-USER-ID` with your actual user ID from `auth.users`.

**Expected Result:**
```
user_id: abc-123...
code: ABC12345
created_at: 2024-...
```

If NO rows returned → You don't have a referral code yet!

**Fix:** Run the backfill script from `schema-v14-referrals.sql`:
```sql
-- This creates codes for existing users
DO $$
DECLARE
  user_record RECORD;
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  FOR user_record IN 
    SELECT p.user_id 
    FROM profiles p
    LEFT JOIN referral_codes rc ON p.user_id = rc.user_id
    WHERE rc.id IS NULL
  LOOP
    LOOP
      new_code := generate_referral_code();
      SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    
    INSERT INTO referral_codes (user_id, code)
    VALUES (user_record.user_id, new_code)
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
END $$;
```

---

### **Step 4: Test the Full Flow**

1. **Get your referral code:**
   - Go to Settings → Referrals
   - Copy the referral link

2. **Open in incognito/private window**

3. **Look at browser console** (F12 → Console tab)

4. **Sign up with the link**

5. **Check console logs for:**
   ```
   🎯 Validating referral code: ABC12345 for user: new-user-id
   📍 Calling validation API...
   📡 Validation response status: 200
   📦 Validation result: {success: true}
   ✅ Referral validated successfully
   ```

6. **If you see errors**, note them and check Step 5

---

### **Step 5: Common Error Messages**

#### Error: "Invalid referral code"
**Cause:** The code doesn't exist in `referral_codes` table

**Fix:**
1. Check if referrer's code exists:
   ```sql
   SELECT * FROM referral_codes WHERE code = 'YOUR-CODE';
   ```
2. If not found, run backfill script from Step 3

---

#### Error: "User already referred"
**Cause:** This user was already referred by someone else

**Fix:** This is by design. Each user can only be referred once.

**To reset for testing:**
```sql
-- WARNING: Only for testing!
DELETE FROM referrals WHERE referee_id = 'NEW-USER-ID';
DELETE FROM profiles WHERE user_id = 'NEW-USER-ID';
-- Then delete the user from Supabase Auth → Users
```

---

#### Error: "Cannot use your own referral code"
**Cause:** You're trying to refer yourself

**Fix:** Use a different account or ask a friend to test

---

#### Error: "Missing parameters"
**Cause:** Code or user ID not being sent properly

**Fix:** Check browser console logs:
```javascript
console.log('Code:', referralCode);
console.log('User ID:', data.user.id);
```

---

### **Step 6: Verify Referral Was Created**

After signup, check the database:
```sql
SELECT 
  r.id,
  r.referrer_id,
  r.referee_id,
  r.status,
  r.referral_code,
  r.created_at,
  p.full_name as referee_name
FROM referrals r
LEFT JOIN profiles p ON p.user_id = r.referee_id
ORDER BY r.created_at DESC
LIMIT 5;
```

**Expected Result:**
```
status: pending
referral_code: ABC12345
referee_name: John Doe
```

If you see the row → It worked! ✅

If NO rows → Something failed in the validation API

---

### **Step 7: Check Referrer's Dashboard**

1. Log in as the **referrer** (original account)
2. Go to Settings → Referrals
3. You should see:
   - Total Referrals: 1
   - Pending: 1
   - Referral list with the new user

If you DON'T see it → Refresh the page

---

## 🔍 **Advanced Debugging**

### Check API Endpoint is Working
```bash
# Test from terminal (replace values)
curl -X POST http://localhost:3000/api/referral/validate \
  -H "Content-Type: application/json" \
  -d '{"code":"ABC12345","newUserId":"test-user-id"}'
```

### Check Server Logs
When testing signup, watch your terminal where Next.js is running:
```
🎯 Validating referral code: ABC12345 for new user: xyz...
✅ Referral validated and tracked for user xyz...
```

### Check Supabase Logs
1. Go to Supabase Dashboard
2. Click **Logs** → **Postgres Logs**
3. Look for errors during referral insert

---

## ✅ **Quick Checklist**

- [ ] Database schema `schema-v14-referrals.sql` has been run
- [ ] Tables `referral_codes` and `referrals` exist
- [ ] Referrer has a code in `referral_codes` table
- [ ] Signup page shows referral code input field
- [ ] Browser console shows validation logs
- [ ] No errors in terminal/console
- [ ] Referral appears in `referrals` table with status='pending'
- [ ] Referrer's dashboard shows the referral

---

## 🆘 **Still Not Working?**

1. **Check your Supabase RLS policies:**
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename IN ('referral_codes', 'referrals');
   ```

2. **Verify service role client is working:**
   - Check `.env.local` has `SUPABASE_SERVICE_ROLE_KEY`

3. **Check the exact error in console:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for red error messages
   - Share the error message for help

---

## 📞 **Get Help**

If you've gone through all steps and it's still not working:

1. Check browser console (F12) for errors
2. Check terminal logs for API errors
3. Run the SQL queries above to verify database state
4. Share the specific error message

Most likely cause: **Database schema not run yet!** → Go to Step 1

