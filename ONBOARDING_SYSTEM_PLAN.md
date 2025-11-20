# 🎯 Onboarding System - Implementation Plan

## Overview
Streamlined 4-step onboarding that guides new users through setup and disappears when complete.

---

## Database Schema Needed

```sql
-- Add onboarding tracking to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step_1_form BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step_2_balance BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step_3_sheet BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step_4_schedule BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_all_complete BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
```

---

## The Flow

### 1. Signup → Trial Activation
```
User signs up
  ↓
Redirected to /trial-activate
  ↓
Adds card (30-day trial starts)
  ↓
Redirected to /onboarding?trial_activated=true
```

### 2. Welcome Modal
```
/onboarding page loads
  ↓
Shows animated "Welcome to Sterling AI!" popup
  ↓
Cool animations, confetti, celebration
  ↓
"Thanks for joining!" message
  ↓
User clicks "Continue" button
  ↓
Modal closes, onboarding steps appear
```

### 3. Onboarding Steps
```
Step 1: Complete Onboarding Form
  - Click "Complete Form" button
  - Redirects to /onboarding/form
  - After submission → Step 1 marked complete ✅

Step 2: Add Call Balance + Auto-Refill
  - Click "Set Up Balance" button
  - Redirects to /dashboard/settings/balance
  - When they add balance + enable auto-refill → Step 2 marked complete ✅

Step 3: Upload Google Sheet
  - Click "Upload Sheet" button
  - Redirects to /dashboard/leads
  - When sheet is connected → Step 3 marked complete ✅

Step 4: Check Auto-Schedule (Optional)
  - Click "Configure Dialer" button
  - Redirects to /dashboard/settings/dialer-automation
  - Just visiting the page → Step 4 marked complete ✅
```

### 4. Completion
```
All 4 steps complete
  ↓
onboarding_all_complete = true
  ↓
Onboarding page auto-redirects to /dashboard
  ↓
Never shows again!
```

---

## Files to Create/Modify

### New Files:
1. `/app/onboarding-steps/page.tsx` - Main onboarding page
2. `/components/welcome-modal.tsx` - Welcome animation popup
3. `/components/onboarding-step-card.tsx` - Individual step component
4. `/app/api/onboarding/mark-step-complete/route.ts` - API to mark steps

### Files to Modify:
1. `/app/api/trial/activate/route.ts` - Redirect to /onboarding instead of /onboarding/form
2. `/app/dashboard/settings/balance/page.tsx` - Mark step 2 when balance added
3. `/app/dashboard/leads/page.tsx` - Mark step 3 when sheet uploaded
4. `/app/dashboard/settings/dialer-automation/page.tsx` - Mark step 4 when visited
5. `/app/dashboard/layout.tsx` - Check if onboarding incomplete, redirect to /onboarding-steps

---

## Step Completion Logic

### Step 1: Onboarding Form
- Marked when: Form submitted successfully
- API call after `/api/onboarding/submit`

### Step 2: Call Balance
- Marked when: Balance > 0 AND auto_refill_enabled = true
- Check on page load of balance settings

### Step 3: Google Sheet
- Marked when: google_sheet_id IS NOT NULL in user profile
- Check when sheet sync completes

### Step 4: Auto-Schedule
- Marked when: User visits /dashboard/settings/dialer-automation
- Simple page visit tracking

---

## Welcome Modal Features

**Animations:**
- Fade in from center
- Confetti animation
- Pulsing glow effect
- Smooth transitions

**Content:**
- "🎉 Welcome to Sterling AI!"
- "Thanks for joining - let's get you set up!"
- "We'll help you configure everything in 4 simple steps"
- Big "Continue" button

---

## Onboarding Page UI

**Progress Indicator:**
```
[✅] [✅] [○] [○]  2 of 4 steps complete
```

**Step Cards:**
```
┌─────────────────────────────────────┐
│ ✅ Step 1: Complete Onboarding Form │
│ Tell us about your business         │
│ [Completed!]                        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ○ Step 2: Set Up Call Balance       │
│ Add funds and enable auto-refill    │
│ [Set Up Balance →]                  │
└─────────────────────────────────────┘
```

---

## Ready to implement! 🚀

This will make onboarding smooth and guide users through setup perfectly!

