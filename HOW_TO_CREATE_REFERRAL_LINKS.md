# How to Create Referral Links - Quick Guide

## 🔗 Access the Tool

Go to: **`https://yourdomain.com/admin/create-referral-link`**

---

## 🎯 Two Methods to Create Links

### Method 1: Search by Email (Easiest)
1. Enter the user's email address
2. Click "Find User & Create Link"
3. The link will be automatically generated
4. Click "Copy Link" to copy it

**Example:**
- Email: `john@example.com`
- Generated Link: `https://yourdomain.com/login?ref=a1b2c3d4-e5f6-7890-abcd-ef1234567890`

---

### Method 2: Direct User ID
If you already have the user's ID from Supabase:
1. Paste the user ID (UUID format)
2. Click "Create Link from User ID"
3. Click "Copy Link" to copy it

**Example User ID:**
```
a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

## 🔍 How to Get a User's ID from Supabase

### Option A: SQL Editor
1. Go to Supabase Dashboard → SQL Editor
2. Run this query:
   ```sql
   SELECT id, email, subscription_tier 
   FROM auth.users 
   WHERE email = 'user@example.com';
   ```
3. Copy the `id` value

### Option B: Table Editor
1. Go to Supabase Dashboard → Table Editor
2. Select `auth.users` table
3. Search for the email
4. Copy the `id` column value

---

## 📋 Example: Creating Your Own Referral Link

**To create a referral link for yourself:**

1. Go to `/admin/create-referral-link`
2. Enter your email (the one you signed up with)
3. Click "Find User & Create Link"
4. Copy the generated link
5. Share with friends!

**Your link will look like:**
```
https://sterlingai.com/login?ref=YOUR-USER-ID-HERE
```

---

## ✅ What Happens When Someone Uses Your Link

1. **They click your link** → URL has `?ref=YOUR_USER_ID`
2. **They sign up** → System creates a `pending` referral entry
3. **They verify email** → Still pending
4. **They add payment method** → ✅ Referral marked `completed`
5. **You get +7 days** → Automatically added to your trial!

---

## 🎁 Referral Rewards

- **1 referral** = +7 days (🎁 Tier 1)
- **2 referrals** = +14 days total (🎉 Tier 2)
- **3 referrals** = +21 days total (🚀 Tier 3)
- **4 referrals** = +28 days total (👑 Tier 4 - MAX)

**Max trial length: 58 days (30 base + 28 bonus)**

---

## 📊 Track Your Referrals

Go to: **`/dashboard/settings/referrals`**

You'll see:
- Total valid referrals count
- Total days earned
- Unlocked tier badges
- List of all people you invited
- Status of each referral (Pending or Completed)

---

## 🧪 Quick Test

**Test your own referral link:**

1. Create your referral link using the tool
2. Open an incognito/private window
3. Paste your referral link
4. Sign up with a test email
5. Verify the test email
6. Add a payment method
7. Go back to your main account
8. Refresh `/dashboard/settings/referrals`
9. You should see: **"+7 Extra Days Earned"** and **Tier 1 unlocked!**

---

## 🚨 Troubleshooting

### "User not found"
- Make sure the email is correct
- Check if the user has completed sign-up
- Verify they confirmed their email

### Link doesn't work
- Make sure it includes `?ref=` parameter
- Check the user ID is a valid UUID
- Example: `/login?ref=a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### Not getting referral credit
**Check these:**
1. Is the referred person on free trial?
2. Did they verify their email?
3. Did they add a payment method?
4. Have you already reached 4 referrals (max)?

---

## 💡 Pro Tips

✅ **Share your link on:**
- Social media (LinkedIn, Facebook, Twitter)
- Email signature
- Text messages to friends
- WhatsApp groups
- Industry forums

✅ **Best practices:**
- Personalize your message when sharing
- Explain what Sterling AI does
- Mention they get 30 days free trial
- Let them know you both benefit

---

## 📞 Need Help?

If you have issues:
1. Check browser console for errors (F12)
2. Verify the SQL migration was run
3. Check Supabase logs
4. Test with a fresh incognito window

---

## 🎉 Ready to Go!

Your referral link creator is live at:
**`/admin/create-referral-link`**

Start sharing and extending your trial! 🚀

