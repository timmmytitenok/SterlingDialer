# 🎁 Manual Affiliate Tracking System

## Overview

Track and manually pay your affiliate partners who earn **20% commission** ($99.80 per active user per month).

---

## 🚀 Setup Instructions

### Step 1: Run the Database Schema

In Supabase SQL Editor, run:
```
supabase/AFFILIATE_TRACKING_SCHEMA.sql
```

This creates:
- ✅ `commission_payouts` table - Tracks each monthly commission
- ✅ `affiliate_stats` table - Summary stats for each affiliate
- ✅ Helper functions for generating commissions

### Step 2: Done!

The system is ready to use!

---

## 📊 How It Works

### **Commission Rate:**
- **20% of $499/month** = **$99.80 per active user**
- Paid monthly for each user that stays subscribed

### **Monthly Workflow:**

**1. Generate Commissions (1st of each month)**
- Go to Admin → Affiliate Program
- Click "Generate This Month's Commissions"
- Creates payout records for all active referrals

**2. Review Pending Payouts**
- See yellow "Pending This Month" amount for each affiliate
- Shows how much you owe each person

**3. Pay Manually**
- Use PayPal, Venmo, or bank transfer
- Pay each affiliate their pending amount

**4. Mark as Paid**
- Click "Mark as Paid" button
- Enter payment method (paypal/venmo/bank_transfer)
- Enter transaction ID (optional)
- System records the payment

---

## 💻 Admin Dashboard

### **Summary Cards:**

**1. Total Affiliates**
- Number of active creators

**2. Active Referrals**
- Total paying users referred across all affiliates

**3. Pending This Month** (Yellow - Important!)
- Total amount you need to pay out this month

**4. Total Paid**
- All-time payouts to affiliates

### **Affiliates Table:**

Shows each affiliate with:
- Name & Email
- Total Referrals (all-time signups)
- Active Users (currently paying)
- **Pending (This Month)** - What you owe them (yellow)
- **Total Paid** - Lifetime payouts (green)
- Last Payout date
- **"Mark as Paid" button**

---

## 🔄 Monthly Process

### **Example for November 2025:**

**November 1st:**
1. Click "Generate This Month's Commissions"
2. System calculates: Each affiliate gets $99.80 × (# of active users they referred)
3. Amounts appear in "Pending" column

**During November:**
1. Review pending amounts
2. Pay each affiliate via PayPal/Venmo
3. Click "Mark as Paid" for each one
4. Enter payment method and transaction ID

**December 1st:**
1. Repeat! Generate December's commissions
2. Pay, mark as paid

---

## 📈 Example Calculation

**Affiliate: John Doe**
- Has 5 users who signed up via his link
- 3 of them have active subscriptions this month
- Commission: 3 × $99.80 = **$299.40**

**Affiliate: Jane Smith**
- Has 10 users who signed up
- 7 have active subscriptions
- Commission: 7 × $99.80 = **$698.60**

**Your Total Owed This Month:** $299.40 + $698.60 = **$998.00**

---

## 💡 **Pro Tips**

### **Automate the Generation:**
Set a calendar reminder for the 1st of each month to generate commissions.

### **Batch Payments:**
Use PayPal Mass Pay or similar to pay multiple affiliates at once.

### **Keep Records:**
The system tracks:
- When payment was made
- Payment method used
- Transaction reference
- Full history

### **Tax Compliance:**
Export the data at year-end for 1099 forms:
```sql
SELECT 
  referrer_id,
  SUM(amount) as total_2025
FROM commission_payouts
WHERE status = 'paid'
  AND EXTRACT(YEAR FROM paid_at) = 2025
GROUP BY referrer_id;
```

---

## 🎯 Upgrade Path

When you're ready to automate:

1. Implement Stripe Connect
2. Set up monthly cron job
3. Auto-transfer to affiliates' Stripe accounts
4. System pays them automatically!

But for now, this manual system lets you:
- ✅ Track everything accurately
- ✅ Pay on your schedule
- ✅ Have full control
- ✅ See exactly what you're paying

---

## 📱 What Affiliates See

You can build them a dashboard showing:
- Their referral link
- Total signups
- Active paying users
- Pending earnings this month
- Total earned all-time
- Payment history

(This would be a separate frontend page for affiliates)

---

## ✨ Success!

You now have a complete manual affiliate tracking system that:
- Automatically calculates commissions
- Tracks who you need to pay
- Records payment history
- Shows you exactly what you owe each month

**Go to Admin → Affiliate Program to see it in action!** 🚀

