# 🎁 Referral System - Complete Implementation Guide

## 🎯 **Overview**

You now have a complete referral system with **dual incentives**:
- **Referrer gets:** $200 in calling credits when friend subscribes
- **Referee gets:** 30% off their first month!

---

## 📋 **What's Been Implemented**

### ✅ **Database Schema** (`supabase/schema-v14-referrals.sql`)
- **`referral_codes` table** - Stores unique 8-character codes for each user
- **`referrals` table** - Tracks referral relationships and credit status
- **Auto-generation** - Codes are automatically created when users sign up
- **RLS Policies** - Secure access control for referral data
- **Backfill script** - Creates codes for existing users

### ✅ **API Endpoints**
1. **GET `/api/referral/get-code`** - Retrieves user's unique referral code and link
2. **GET `/api/referral/stats`** - Returns referral statistics and history
3. **POST `/api/referral/validate`** - Validates referral code during signup
4. **POST `/api/referral/credit`** - Credits $200 to referrer when referee subscribes

### ✅ **UI Components**
1. **Referral Dashboard** (`components/referral-dashboard.tsx`)
   - Shows referral code and shareable link
   - Displays statistics (total referrals, credits earned, pending)
   - Lists all referrals with their status
   - Copy/share functionality
   - Beautiful animated UI

2. **Referrals Page** (`app/dashboard/settings/referrals/page.tsx`)
   - Dedicated page in Settings
   - Full referral management interface

3. **Settings Navigation**
   - Added "Referrals" link with Gift icon

### ✅ **Signup Flow** (`app/login/page.tsx`)
- Detects `?ref=CODE` in URL
- Shows "You're invited!" badge
- Validates referral code after signup
- Stores referral relationship

### ✅ **Stripe Webhook Integration** (`app/api/stripe/webhook/route.ts`)
- Automatically detects when referred user subscribes
- Credits $200 to referrer's call balance instantly
- Creates transaction record
- Logs all activity

---

## 🚀 **Setup Instructions**

### Step 1: Create Stripe Coupon

**Create the 30% off coupon in Stripe:**

1. Go to **Stripe Dashboard**: https://dashboard.stripe.com/coupons
2. Click **"Create coupon"**
3. Fill in:
   - **Name:** `Referral Discount - 30% Off First Month`
   - **ID:** `REFERRAL30` (must be exactly this!)
   - **Type:** Percentage
   - **Percentage off:** 30
   - **Duration:** Once (first invoice only)
4. Click **Create coupon**

✅ See `CREATE_STRIPE_COUPON.md` for detailed instructions!

---

### Step 2: Run Database Schema

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Open and run: `supabase/schema-v14-referrals.sql`

This will:
- Create all necessary tables
- Set up RLS policies
- Create helper functions
- Backfill referral codes for existing users

### Step 3: Set Environment Variable (Optional)

Add to your `.env.local`:
```bash
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

This is used to generate full referral links. Defaults to `http://localhost:3000` in development.

### Step 4: Test the System

1. **Get Your Referral Code:**
   - Log in to your dashboard
   - Go to Settings → Referrals
   - Copy your unique referral link

2. **Test Referral Flow:**
   - Open referral link in incognito mode
   - Sign up for a new account
   - Subscribe to any plan
   - **On checkout:** See 30% discount applied! 🎉
   - **After payment:** Check original account - $200 should be credited!

---

## 📊 **How It Works**

### User Flow

```
1. User A goes to Settings → Referrals
   ↓
2. Copies their referral link (e.g., https://app.com/signup?ref=ABC12345)
   ↓
3. Shares link with User B
   ↓
4. User B clicks link → lands on signup page with referral badge
   ↓
5. User B signs up → referral code validated and stored
   ↓
6. User B subscribes to any plan (Starter/Pro/Elite)
   ↓
7. Stripe webhook fires → checks for referral
   ↓
8. System credits $200 to User A's call balance 💰
   ↓
9. User A sees updated balance and "Credited" status in Referrals page
```

### Referral Statuses

| Status | Description |
|--------|-------------|
| **Pending** 🟠 | Friend signed up but hasn't subscribed yet |
| **Completed** 🔵 | Friend subscribed (transitioning to credited) |
| **Credited** 🟢 | $200 has been added to your balance |

---

## 🎨 **UI Features**

### Referral Dashboard

**Top Section:**
- How It Works (3-step guide)
- Referral Code (large, easy to copy)
- Referral Link (shareable URL)
- Copy & Share buttons

**Stats Grid:**
- **Total Referrals** - Number of friends invited
- **Credits Earned** - Total $ earned from referrals
- **Pending** - Friends who haven't subscribed yet

**Referral List:**
- Shows all your referrals
- Name, signup date, status badge
- Amount credited (for completed referrals)

### Signup Page Enhancement

When someone uses a referral link:
- Purple "You're invited!" badge appears
- Shows referral code being used
- Automatically switches to Sign Up mode
- Validates code upon account creation

---

## 💰 **Financial Details**

### Credit Amount (Referrer)
- **$200 per referral** (2,000 minutes of calling)
- Credits added to `call_balance` table
- Transaction recorded in `balance_transactions`
- No expiration date

### Discount Amount (Referee)
- **30% off first month** for using a referral code
- Applied automatically at checkout via Stripe coupon `REFERRAL30`
- Discount only applies to first invoice
- Works on all tiers (Starter, Pro, Elite)

### When Credits Are Awarded
- **Trigger:** When referred friend completes checkout for ANY plan
- **Timing:** Immediately after Stripe checkout completion
- **Plans Eligible:** Starter ($999), Pro ($1299), Elite ($1899)

### Transaction Record
Every referral credit creates a transaction:
```json
{
  "user_id": "referrer-id",
  "amount": 200.00,
  "type": "referral_credit",
  "description": "Referral bonus - Friend subscribed",
  "balance_after": 350.00
}
```

---

## 🔒 **Security & Validation**

### Protections In Place

1. **Unique Codes** - Each user gets one unique 8-character code
2. **One Referral Per User** - Users can only be referred once
3. **Self-Referral Prevention** - Users can't use their own code
4. **RLS Policies** - Database-level security
5. **Validation** - Codes checked against database before accepting

### Code Format
- **Length:** 8 characters
- **Characters:** A-Z, 2-9 (excludes confusing: 0, O, I, 1, L)
- **Example:** `ABC12345`, `XYZ98765`

---

## 📈 **Analytics & Tracking**

### What's Tracked

For each user, the system tracks:
- Referral code generated
- Total referrals made
- Pending referrals (signed up, not subscribed)
- Completed referrals (subscribed)
- Total credits earned
- Individual referral details (name, date, status, amount)

### Where to View

**Dashboard Location:** Settings → Referrals

Shows:
- Real-time statistics
- Complete referral history
- Credit earnings breakdown

---

## 🛠️ **Testing Checklist**

### Manual Testing

- [ ] Run database schema in Supabase
- [ ] Check that your profile has a referral code
- [ ] Visit Settings → Referrals
- [ ] Copy referral link
- [ ] Open in incognito/new browser
- [ ] Sign up with referral link
- [ ] Verify referral badge shows
- [ ] Subscribe to a plan
- [ ] Check webhook logs in Stripe
- [ ] Verify $200 credited in original account
- [ ] Check referral status updated to "Credited"

### Expected Behavior

**On Signup:**
```
Console: "🎯 Validating referral code: ABC12345 for user: user-id"
Console: "✅ Referral validated successfully"
```

**On Subscription:**
```
Console: "🎁 Checking for referral..."
Console: "🎯 User user-id was referred with code ABC12345"
Console: "✅ Successfully credited referrer: $200"
```

---

## 🔧 **Troubleshooting**

### Issue: No referral code showing

**Solution:**
1. Run the backfill script in `schema-v14-referrals.sql`
2. Or manually insert:
```sql
SELECT generate_referral_code(); -- Generate a code
INSERT INTO referral_codes (user_id, code) VALUES ('your-user-id', 'GENERATEDCODE');
```

### Issue: Credits not appearing

**Checklist:**
1. Check Stripe webhook logs
2. Verify webhook endpoint is set up in Stripe
3. Check terminal for webhook processing logs
4. Verify `NEXT_PUBLIC_APP_URL` is set correctly
5. Check `balance_transactions` table for entry

### Issue: "User already referred" error

**Cause:** User has already been referred by someone else

**Solution:** Each user can only be referred once - this is by design

---

## 📝 **API Reference**

### GET `/api/referral/get-code`

**Authentication:** Required

**Response:**
```json
{
  "code": "ABC12345",
  "link": "https://app.com/signup?ref=ABC12345"
}
```

### GET `/api/referral/stats`

**Authentication:** Required

**Response:**
```json
{
  "totalReferrals": 5,
  "completedReferrals": 3,
  "pendingReferrals": 2,
  "totalCreditsEarned": 750,
  "referrals": [
    {
      "id": "...",
      "referee": {
        "name": "John Doe",
        "signupDate": "2024-01-15"
      },
      "status": "credited",
      "credit_amount": 250,
      "created_at": "2024-01-15",
      "credited_at": "2024-01-15"
    }
  ]
}
```

### POST `/api/referral/validate`

**Authentication:** Service Role (internal)

**Body:**
```json
{
  "code": "ABC12345",
  "newUserId": "user-id"
}
```

**Response:**
```json
{
  "success": true
}
```

### POST `/api/referral/credit`

**Authentication:** Service Role (internal)

**Body:**
```json
{
  "refereeId": "user-id"
}
```

**Response:**
```json
{
  "success": true,
  "credited": 250,
  "newBalance": 350
}
```

---

## 🎁 **Marketing Copy**

Use these messages in your app:

### Email Template (Referral Reminder)
```
🎁 Earn $200 in Credits!

Share Sterling AI with friends and earn $200 in calling credits for each referral.

Your unique link: [LINK]

How it works:
1. Share your link
2. Friend subscribes to any plan
3. You get $200 instantly!

No limit on referrals. Start earning today!
```

### In-App Banner
```
💰 Refer friends, earn $200 per referral!
[View My Referral Link]
```

### Social Share Text
```
I'm using Sterling AI for automated calling - it's amazing! 
Use my link to sign up: [LINK]
```

---

## 🚀 **Future Enhancements (Optional)**

### Phase 2 Ideas

1. **Email Notifications**
   - Notify referrer when friend signs up
   - Notify when credits are earned

2. **Leaderboard**
   - Top referrers page
   - Gamification badges

3. **Tiered Rewards**
   - All referrals: $200 each (flat rate)

4. **Referral Dashboard Widget**
   - Mini stats on main dashboard
   - Quick share button

5. **Social Sharing**
   - One-click share to Twitter/LinkedIn/Facebook
   - Pre-written messages

6. **Ambassador Program**
   - Special codes for influencers
   - Higher commission rates

---

## ✅ **System Status**

All components are fully implemented and ready to use:

- ✅ Database schema
- ✅ API endpoints
- ✅ UI components
- ✅ Signup integration
- ✅ Stripe webhook integration
- ✅ Security & validation
- ✅ Documentation

**Next Step:** Run the SQL schema in your Supabase dashboard!

---

## 📞 **Support**

If you encounter any issues:
1. Check the troubleshooting section above
2. Review webhook logs in Stripe dashboard
3. Check terminal logs for detailed error messages
4. Verify all environment variables are set

Happy referring! 🎉

