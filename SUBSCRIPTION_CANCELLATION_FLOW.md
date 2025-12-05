# 🔄 Subscription Cancellation Flow

## Overview

This document explains how subscription cancellations work, including what happens when users cancel during their trial or paid subscription period.

---

## 🎯 Key Principle: Access Until Period End

**Users get to use the service until the end of their billing period, just like Netflix, Spotify, etc.**

### Example Timeline:
```
Day 1:  User starts 30-day free trial with card on file ✅
Day 2:  User clicks "Cancel Subscription" ❌
        - Stripe sets cancel_at_period_end = true
        - User STILL has full access (28 days left)
Days 3-29: User continues using ALL features normally ✅
Day 30: Billing date arrives (current_period_end)
        - Stripe fires customer.subscription.deleted webhook 🔔
        - NOW we block AI features 🔒
        - Dashboard access remains ✅
```

---

## 📅 What Happens When User Clicks "Cancel"

### In Stripe Dashboard (or via API):
1. User clicks "Cancel Subscription" in billing portal
2. Stripe sets `cancel_at_period_end: true`
3. Subscription stays `active` or `trialing` 
4. No immediate changes in the app ✅

### What DOESN'T Happen:
- ❌ No immediate access loss
- ❌ Auto schedule keeps working
- ❌ AI Dialer stays available
- ✅ Everything works normally until period ends

---

## 🗓️ What Happens On Period End Date (Day 30)

### Stripe Webhook: `customer.subscription.deleted`

When the subscription period ends, Stripe fires the deletion webhook and we:

#### 1. **Update Subscription Record** ✅
```javascript
// Mark subscription as canceled in database
subscriptions.status = 'canceled'
```

#### 2. **Block AI Features** 🔒
```javascript
// Update user profile
profiles.has_active_subscription = false
profiles.subscription_tier = 'none'
profiles.subscription_status = 'canceled'
// Clear trial data if applicable
profiles.free_trial_started_at = null
profiles.free_trial_ends_at = null
```

#### 3. **Turn Off Auto Schedule** 🛑
```javascript
// Disable auto schedule
dialer_settings.auto_schedule_enabled = false
// Keep the schedule config (days/time) so they can see what it was
```

#### 4. **Stop Referral Commissions** 💰
```javascript
// Mark referral as cancelled (no more monthly commissions)
referrals.conversion_status = 'cancelled'
// Already earned commissions are kept by affiliate!
```

---

## 🔓 What Users Can Still Access

After subscription ends, users keep access to:

- ✅ **Dashboard** - View all metrics and data
- ✅ **Leads Page** - See and manage leads
- ✅ **Appointments** - View appointment history
- ✅ **Call History** - Review past calls
- ✅ **Settings** - Update profile, view billing
- ✅ **Account Info** - All personal data

---

## 🔒 What Gets Blocked

After subscription ends, users CANNOT access:

- ❌ **AI Dialer Page** (`/dashboard/ai-dialer`)
  - Shows "Subscription Ended" page instead
  - Clear CTA to reactivate
  
- ❌ **Auto Schedule Page** (`/dashboard/settings/dialer-automation`)
  - Shows "Subscription Ended" page instead
  - Auto schedule is turned OFF in database
  
- ❌ **AI Calling Features**
  - Can't start new calling sessions
  - Can't modify AI settings
  - Auto schedule won't trigger

---

## 💻 Implementation Details

### Files Modified:

#### 1. **Webhook Handler** (`app/api/stripe/webhook/route.ts`)
- Updated `customer.subscription.deleted` handler
- Blocks AI features on period end
- Turns off auto schedule
- Marks referral as cancelled

#### 2. **Subscription Ended Component** (`components/subscription-ended.tsx`)
- Beautiful page showing what happened
- Lists what they still have access to
- Lists what's blocked
- Big "Reactivate Subscription" CTA

#### 3. **AI Dialer Page** (`app/dashboard/ai-dialer/page.tsx`)
- Checks `has_active_subscription` before showing dialer
- Shows `SubscriptionEnded` component if no subscription

#### 4. **Dialer Automation Page** (`app/dashboard/settings/dialer-automation/page.tsx`)
- Checks `has_active_subscription` before showing settings
- Shows `SubscriptionEnded` component if no subscription

### Database Checks:

```sql
-- User with active subscription
SELECT 
  has_active_subscription,  -- true
  subscription_tier,        -- 'pro' or 'free_trial'
  subscription_status       -- 'active' or 'trialing'
FROM profiles 
WHERE user_id = 'xxx';

-- User with cancelled subscription
SELECT 
  has_active_subscription,  -- false
  subscription_tier,        -- 'none'
  subscription_status       -- 'canceled'
FROM profiles 
WHERE user_id = 'xxx';
```

---

## 🔄 Reactivation Flow

When user reactivates:

1. User clicks "Reactivate Subscription" button
2. Redirected to `/dashboard/settings/billing`
3. Clicks "Subscribe" button
4. Goes through Stripe checkout
5. Webhook fires `checkout.session.completed`
6. Updates:
   ```javascript
   profiles.has_active_subscription = true
   profiles.subscription_tier = 'pro'
   profiles.subscription_status = 'active'
   ```
7. Instant access to AI Dialer and Auto Schedule ✅

---

## 🧪 Testing the Flow

### Test Scenario 1: Cancel During Trial

```bash
# Day 2 of trial
1. User clicks "Cancel Subscription" in billing portal
2. Verify: User still has full access to AI Dialer
3. Verify: Auto schedule still works
4. Verify: cancel_at_period_end = true in Stripe

# Day 30 (simulate with Stripe CLI)
stripe trigger customer.subscription.deleted

# Expected Results:
✅ Subscription marked as canceled
✅ has_active_subscription = false
✅ AI Dialer shows "Subscription Ended" page
✅ Auto Schedule page shows "Subscription Ended" page
✅ Dashboard still accessible
✅ Auto schedule disabled in database
```

### Test Scenario 2: Reactivate After Cancellation

```bash
1. User visits /dashboard/ai-dialer
2. Sees "Subscription Ended" page
3. Clicks "Reactivate Subscription"
4. Goes through checkout
5. Webhook fires, updates subscription
6. User can now access AI Dialer ✅
```

---

## 📊 User Experience

### When They Cancel (Day 2):
- ✅ No interruption to service
- ✅ Full access for remaining 28 days
- ℹ️ See "Cancels on [date]" in billing portal

### On Cancellation Date (Day 30):
- 🔒 AI features blocked
- ✅ Dashboard still works
- 💡 Clear path to reactivate
- 📧 Could send email notification (optional)

### After Cancellation:
- 📊 Can view all their data
- 🤝 Can access leads and appointments
- 💳 One-click reactivation available
- 🎯 No data loss

---

## 🎨 UI/UX Highlights

### Subscription Ended Page Features:
- 🎨 Beautiful gradient design
- ✅ Green box: "What you still have access to"
- ❌ Red box: "What requires subscription"
- 💳 Big blue CTA: "Reactivate Subscription"
- 📅 Shows when subscription ended
- 🎯 Different message for trial vs paid

---

## 🔐 Security Considerations

### Access Control Layers:

1. **Page Level** (`page.tsx` files)
   - Check `has_active_subscription` 
   - Show `SubscriptionEnded` if false
   
2. **API Level** (AI control endpoints)
   - Should also check subscription status
   - Return 403 if no active subscription
   
3. **Database Level** (RLS policies)
   - Already in place for data access

### Why Not Block Dashboard?
- Users need to see billing settings to reactivate
- They own their data (leads, calls, appointments)
- Better UX = higher reactivation rate
- Industry standard (Netflix, Spotify, etc.)

---

## 🚨 Important Notes

### Stripe Behavior:
- `cancel_at_period_end = true` means subscription stays active until period ends
- Only when period ends does Stripe fire `customer.subscription.deleted`
- This is standard Stripe behavior, not a bug!

### Database State During Cancellation Period:
```javascript
// While cancel_at_period_end = true (Days 2-29)
subscription.status = 'active' or 'trialing'  // Still active!
subscription.cancel_at_period_end = true      // Will cancel at end

// After period ends (Day 30)
subscription.status = 'canceled'              // Now canceled
profiles.has_active_subscription = false       // Access blocked
```

### Auto Schedule:
- Doesn't stop when user clicks cancel
- Only stops on cancellation date (Day 30)
- This is intentional! User paid for 30 days
- Config is preserved (days/time) for when they return

---

## 💡 Future Enhancements

Possible additions:

- 📧 **Email notification** when subscription ends
- 🎁 **Win-back offer** on cancellation page
- 💬 **Cancellation survey** to understand why
- ⏰ **Grace period** (3 days extra access)
- 🔔 **In-app notification** before subscription ends
- 📊 **Usage summary** email before cancellation

---

## ✅ Checklist

Implementation complete:

- [x] Webhook handles subscription.deleted
- [x] Blocks AI features (not full dashboard)
- [x] Turns off auto schedule
- [x] Created SubscriptionEnded component
- [x] Added access control to AI Dialer page
- [x] Added access control to Dialer Automation page
- [x] Preserves dashboard and data access
- [x] Clear reactivation path

Ready for testing! 🚀

