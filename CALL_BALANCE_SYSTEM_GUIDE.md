# 💰 Call Balance System Setup Guide

## Overview

The Call Balance System is a prepaid wallet for AI call minutes. Each call minute costs **$0.10**, and users must maintain a positive balance to make calls.

---

## 🚀 Setup Instructions

### 1. Run Database Schema

Run the schema file in your Supabase SQL Editor:

```bash
supabase/schema-v13-call-balance.sql
```

This creates:
- ✅ `call_balance` table - Stores user balances and auto-refill settings
- ✅ `balance_transactions` table - Audit trail for all balance changes
- ✅ RLS policies for security
- ✅ Functions for balance deduction

### 2. System is Ready!

No additional configuration needed. The system will:
- Auto-create balance records for new users
- Handle payments through existing Stripe integration
- Auto-refill when balance drops below threshold

---

## 📋 Features

### For Users:

1. **View Balance**
   - Current balance displayed in dollars
   - Estimated minutes remaining
   - Balance status indicator (LOW/OK/GOOD)

2. **Manual Top-Up**
   - Add $50 (≈500 minutes)
   - Add $100 (≈1,000 minutes)
   - Instant activation via Stripe

3. **Auto-Refill Settings**
   - Toggle on/off
   - Choose refill amount ($50 or $100)
   - Triggers when balance < $10

4. **Low Balance Alerts**
   - Visual warnings when balance is low
   - Auto-refill notification if enabled

---

## 🔧 How It Works

### Balance Deduction Flow:

1. User makes an AI call
2. Call duration tracked (e.g., 5 minutes)
3. Cost calculated: `5 minutes × $0.10 = $0.50`
4. Balance deducted automatically
5. Transaction recorded in audit trail
6. If balance < $10 AND auto-refill enabled → Trigger refill

### Auto-Refill Flow:

1. Balance drops below $10
2. System checks if auto-refill is enabled
3. Creates Stripe payment for configured amount ($50 or $100)
4. Charges card on file
5. Credits balance immediately
6. Records transaction

### Manual Refill Flow:

1. User clicks "Add $50" or "Add $100"
2. Redirected to Stripe checkout
3. Completes payment
4. Webhook processes payment
5. Balance updated instantly
6. Transaction recorded

---

## 💳 Pricing

| Amount | Minutes | Cost per Minute |
|--------|---------|-----------------|
| $50    | ≈500    | $0.10           |
| $100   | ≈1,000  | $0.10           |

**Note:** Calls are charged per minute. Partial minutes are rounded up.

---

## 🎨 UI Components

### Call Balance Card

Located in: `components/call-balance-card.tsx`

Features:
- 💰 Balance display with status indicator
- ⏱️ Minutes remaining calculator
- ⚙️ Auto-refill settings panel
- 💳 Manual refill buttons
- 📊 Real-time balance updates

---

## 📡 API Endpoints

### GET `/api/balance/get`
- Returns current balance and settings
- Auto-creates balance record if missing

### POST `/api/balance/refill`
- Initiates Stripe checkout for balance top-up
- Body: `{ amount: 50 | 100 }`
- Returns checkout URL

### POST `/api/balance/update-settings`
- Updates auto-refill preferences
- Body: `{ auto_refill_enabled: boolean, auto_refill_amount: 50 | 100 }`

### Webhook: `/api/stripe/webhook`
- Handles `checkout.session.completed` for balance refills
- Automatically credits balance
- Records transaction

---

## 🗄️ Database Schema

### `call_balance` Table

| Column                  | Type      | Description                      |
|-------------------------|-----------|----------------------------------|
| id                      | UUID      | Primary key                      |
| user_id                 | UUID      | User reference                   |
| balance                 | DECIMAL   | Current balance ($)              |
| auto_refill_enabled     | BOOLEAN   | Auto-refill toggle               |
| auto_refill_threshold   | DECIMAL   | Trigger threshold ($10)          |
| auto_refill_amount      | DECIMAL   | Refill amount ($50 or $100)      |
| last_refill_at          | TIMESTAMP | Last refill timestamp            |
| created_at              | TIMESTAMP | Created timestamp                |
| updated_at              | TIMESTAMP | Updated timestamp                |

### `balance_transactions` Table

| Column                   | Type      | Description                |
|--------------------------|-----------|----------------------------|
| id                       | UUID      | Primary key                |
| user_id                  | UUID      | User reference             |
| amount                   | DECIMAL   | Transaction amount         |
| type                     | TEXT      | credit/debit/refund        |
| description              | TEXT      | Transaction description    |
| balance_before           | DECIMAL   | Balance before transaction |
| balance_after            | DECIMAL   | Balance after transaction  |
| stripe_payment_intent_id | TEXT      | Stripe payment ID          |
| metadata                 | JSONB     | Additional data            |
| created_at               | TIMESTAMP | Transaction timestamp      |

---

## 🔐 Security

- ✅ **RLS Policies** - Users can only view/update their own balance
- ✅ **Service Role** - Webhooks use service role for updates
- ✅ **Stripe Verification** - All payments verified via webhook signatures
- ✅ **Audit Trail** - All transactions logged with full history

---

## 🧪 Testing

### Test Refill Flow:

1. Go to **Settings → Billing**
2. Scroll to **Call Balance** card
3. Click **"Add $50"**
4. Use Stripe test card: `4242 4242 4242 4242`
5. Complete checkout
6. Verify balance updated
7. Check `balance_transactions` table for audit record

### Test Auto-Refill:

1. Manually set balance to $9 in database
2. Toggle auto-refill **ON**
3. Set refill amount to $50
4. Make a call to trigger deduction
5. System should auto-charge card
6. Balance should be topped up

---

## 📊 Balance Monitoring

To check user balances:

```sql
SELECT 
  u.email,
  cb.balance,
  cb.auto_refill_enabled,
  cb.auto_refill_amount,
  cb.last_refill_at
FROM call_balance cb
JOIN auth.users u ON u.id = cb.user_id
ORDER BY cb.balance ASC;
```

To view transaction history:

```sql
SELECT 
  bt.created_at,
  u.email,
  bt.type,
  bt.amount,
  bt.description,
  bt.balance_after
FROM balance_transactions bt
JOIN auth.users u ON u.id = bt.user_id
ORDER BY bt.created_at DESC
LIMIT 50;
```

---

## 🎯 Next Steps

1. **Run the schema** - Execute `schema-v13-call-balance.sql`
2. **Test manual refill** - Add funds via UI
3. **Configure auto-refill** - Set up automatic top-ups
4. **Monitor usage** - Check balance transactions

---

## 💡 Pro Tips

- Set auto-refill to $100 for fewer transactions
- Monitor low balance alerts daily
- Check transaction history monthly
- Set threshold higher ($20) for heavy usage

---

**Your Call Balance System is ready! 🎉**

