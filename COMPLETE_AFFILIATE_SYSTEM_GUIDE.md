# 🎉 Complete Affiliate System - Full Guide

## Overview

A complete affiliate/referral system where special users can earn **$99.80/month** for each paying customer they refer.

**Commission:** 20% of $499 = $99.80 per user per month

---

## 🚀 Setup Instructions

### Step 1: Run the Database Schema

In Supabase SQL Editor, run:
```
supabase/COMPLETE_AFFILIATE_SYSTEM.sql
```

This creates:
- ✅ Affiliate partner flags in profiles
- ✅ Commission tracking tables
- ✅ Conversion status tracking
- ✅ Auto-commission generation functions

### Step 2: Done!

The system is ready to use!

---

## 📋 How the System Works

### **The Flow:**

```
1. You create affiliate partner for a user (e.g., John)
   ↓
2. John gets unique code: JOHN2025
   ↓
3. John shares: yourapp.com/?ref=JOHN2025
   ↓
4. Someone clicks link → Signs up → Gets FREE TRIAL
   Status: "In Trial" (⚠️ NO commission yet!)
   ↓
5. After 7-30+ days, user makes FIRST PAYMENT to become Pro Access
   ↓
6. 💰 COMMISSION CREATED! $99.80 pending for John
   Status: "Converted" (✅ Earning commission!)
   ↓
7. Every month user stays subscribed → Another $99.80 for John
   ↓
8. You pay John manually via PayPal/Venmo
   ↓
9. Click "Mark as Paid" in admin → Payment recorded!
```

---

## 👨‍💼 Admin Side

### **Create Affiliate Partners:**

1. Go to **Admin → Affiliate Program**
2. Click **"Create Affiliate"** button
3. Enter:
   - User's email
   - Unique code (e.g., JOHN2025)
4. Click "Create Affiliate Partner"
5. ✅ User is now an affiliate!

### **View Affiliate Dashboard:**

**Summary Cards:**
- Total Affiliates
- Active Referrals (paying users)
- **Pending This Month** (what you owe)
- Total Paid All-Time

**Affiliates Table:**
- Each affiliate's name & email
- Total Referrals (all signups)
- Active Users (currently paying = earning commission)
- **Pending (Yellow)** - What you owe them this month
- **Total Paid (Green)** - Lifetime payouts
- Last Payout date
- **"Mark as Paid" button**

### **Monthly Workflow:**

**1. Generate Commissions (1st of month):**
- Click "Generate Commissions" button
- Creates payout records for all active converted referrals
- Shows in "Pending" column

**2. Pay Affiliates:**
- Pay each affiliate via PayPal/Venmo/Bank Transfer
- Use the pending amount shown

**3. Mark as Paid:**
- Click "Mark as Paid" for each affiliate
- Enter payment method (paypal/venmo/etc)
- Enter transaction ID (optional)
- ✅ Green notification!

---

## 👤 User Side (Affiliate Dashboard)

Affiliates can view their earnings at:
**Dashboard → Settings → Affiliate**

### **What They See:**

**Referral Link Card:**
- Their unique link: `yourapp.com/?ref=JOHN2025`
- Copy button
- Instructions

**Earnings Summary (4 Cards):**
- 💰 **Pending Payment** (Yellow) - What they'll be paid
- ✅ **Total Paid** (Green) - Lifetime earnings
- 👥 **Total Referrals** - All signups
- 📈 **Paying Users** - Active subscriptions

**Referral Breakdown (3 Cards):**
- ⏳ **In Free Trial** - Users still in trial (not earning yet)
- ✅ **Converted to Paid** - Users who paid (earning commission!)
- ❌ **Cancelled** - Users who never converted

**Payment History:**
- List of all past payouts
- Month, amount, payment date, method

---

## 💰 Commission Logic

### **When Commission is Created:**

**Trial Signup → NO COMMISSION**
- User signs up via affiliate link
- Gets free trial (7-30+ days)
- Status: "trial"
- ⚠️ Affiliate earns NOTHING yet

**First Payment → COMMISSION CREATED! 💰**
- User makes first payment to become Pro Access
- Status changes: "trial" → "converted"
- SQL function `mark_referral_converted()` is called
- Creates commission payout: $99.80 (status: 'pending')
- ✅ Affiliate now earning!

**Monthly Recurring:**
- On 1st of each month, run "Generate Commissions"
- Creates $99.80 for each converted user still subscribed
- Shows in affiliate's "Pending Payment"

**User Cancels:**
- Status changes to "cancelled"
- No more commissions generated
- Previous paid commissions remain

---

## 🔄 Automatic Triggers

### **In Stripe Webhook:**

When `checkout.session.completed` (first payment):
```typescript
// After creating subscription...
await supabase.rpc('mark_referral_converted', {
  p_user_id: userId
});
```

This:
1. Finds if user was referred
2. Updates referral status: "trial" → "converted"
3. Creates first commission: $99.80 (pending)
4. Logs conversion date

---

## 📊 Database Tables

### **profiles:**
- `is_affiliate_partner` - Can this user earn commissions?
- `affiliate_code` - Their unique code (e.g., JOHN2025)

### **referrals:**
- `referrer_id` - The affiliate
- `referee_id` - The user who signed up
- `conversion_status` - 'trial', 'converted', or 'cancelled'
- `converted_at` - When they made first payment

### **commission_payouts:**
- `referrer_id` - The affiliate earning
- `referee_id` - The user generating the commission
- `month` - Which month (2025-11)
- `amount` - $99.80
- `status` - 'pending' or 'paid'
- `paid_at` - When you marked it as paid
- `paid_via` - Payment method

---

## 🎯 Example Scenario

### **John becomes an affiliate:**
1. You create affiliate for john@example.com
2. Code: JOHN2025
3. John shares: yourapp.com/?ref=JOHN2025

### **3 People sign up via his link:**

**Person A:**
- Signs up Nov 1 → Free trial (Status: trial)
- Nov 8 makes first payment → ✅ CONVERTED!
- Commission created: $99.80 pending for John
- Every month after: Another $99.80

**Person B:**
- Signs up Nov 5 → Free trial (Status: trial)
- Still in trial... no commission yet
- Waiting for conversion...

**Person C:**
- Signs up Nov 10 → Free trial (Status: trial)
- Trial expires Dec 10, never pays → ❌ CANCELLED
- No commission ever created

### **John's Dashboard Shows:**
- Total Referrals: 3
- In Trial: 1 (Person B)
- Converted: 1 (Person A)
- Cancelled: 1 (Person C)
- Pending: $99.80 (for Person A this month)

### **Your Admin Shows:**
- John: 1 active user
- Pending: $99.80
- Click "Mark as Paid" after you PayPal him

---

## ✨ Key Features

✅ **Only pay on conversion** - No commission until user actually pays  
✅ **Recurring monthly** - Commission continues while user stays subscribed  
✅ **Trial tracking** - See who's pending vs converted  
✅ **Manual payouts** - Full control over when you pay  
✅ **Payment history** - Complete audit trail  
✅ **User dashboard** - Affiliates can track their earnings  
✅ **Admin control** - Create affiliates, mark as paid  
✅ **Auto-calculations** - Commissions auto-generated monthly  

---

## 🎁 Pages Created

### **Admin:**
- `/admin/affiliate-program` - Main affiliate management

### **User:**
- `/dashboard/settings/affiliate` - Earnings dashboard

### **APIs:**
- `/api/admin/affiliates/stats` - Get all affiliate data
- `/api/admin/affiliates/create` - Create new affiliate
- `/api/admin/affiliates/mark-paid` - Record payment
- `/api/admin/affiliates/generate-commissions` - Monthly generation
- `/api/affiliate/my-stats` - User views their own stats

---

## 🚀 Success!

You now have a **COMPLETE affiliate system** that:
- Tracks trial vs paid conversions
- Only pays commission when users actually pay
- Continues monthly commissions
- Gives affiliates their own dashboard
- Lets you manage everything from admin panel
- Records full payment history

**Go create your first affiliate partner and test it out!** 🎉

