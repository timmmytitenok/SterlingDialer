# Tier-Based Auto-Refill Amounts

## Overview
Auto-refill amounts now vary based on subscription tier to match the higher call volume needs of Elite users.

## Refill Options by Tier

### Starter Tier
- **Option 1**: $50 (≈ 500 minutes)
- **Option 2**: $100 (≈ 1,000 minutes)

### Pro Tier
- **Option 1**: $100 (≈ 1,000 minutes)
- **Option 2**: $200 (≈ 2,000 minutes)

### Elite Tier
- **Option 1**: $200 (≈ 2,000 minutes)
- **Option 2**: $400 (≈ 4,000 minutes)

## Where This Applies

### 1. Auto-Refill Settings
When users enable auto-refill in **Settings → Billing → Call Balance**, they'll see different options based on their tier.

**Starter users see:**
```
Refill Amount:
[ $50 ]  [ $100 ]
500 min   1000 min
```

**Pro users see:**
```
Refill Amount:
[ $100 ]  [ $200 ]
1000 min   2000 min
```

**Elite users see:**
```
Refill Amount:
[ $200 ]  [ $400 ]
2000 min   4000 min
```

### 2. Manual Top-Up Buttons
The "Add Funds Manually" buttons also adjust based on tier.

**Starter:**
- Add $50 (500 minutes)
- Add $100 (1,000 minutes)

**Pro:**
- Add $100 (1,000 minutes)
- Add $200 (2,000 minutes)

**Elite:**
- Add $200 (2,000 minutes)
- Add $400 (4,000 minutes)

## Implementation Details

### Component Changes
**File**: `components/call-balance-card.tsx`

```typescript
// Added currentTier prop
interface CallBalanceCardProps {
  currentTier?: 'none' | 'starter' | 'pro' | 'elite';
  // ... other props
}

// Dynamic refill options
const isElite = currentTier === 'elite';
const refillOptions = isElite 
  ? { small: 100, large: 200 } 
  : { small: 50, large: 100 };
```

### Billing Integration
**File**: `components/billing-tabs.tsx`

The component now passes the user's current tier to `CallBalanceCard`:

```typescript
<CallBalanceCard
  userId={userId}
  currentTier={currentTier}
  // ... other props
/>
```

## User Experience

### For Elite Users
- Highest refill amounts ($200-$400)
- Perfect for high-volume calling (up to 1,800 leads/day with 3 AI callers)
- Reduces frequency of refills
- Option for $400 provides 4,000 minutes of talk time

### For Pro Users
- Medium refill amounts ($100-$200)
- Good for serious closers (up to 1,200 leads/day with 2 AI callers)
- Balanced for moderate-to-high volume

### For Starter Users
- Lower entry amounts ($50-$100)
- Perfect for getting started (up to 600 leads/day)
- More flexible for smaller budgets

## Cost Breakdown

| Tier | Small Refill | Large Refill | Leads per Day (Max) | AI Callers |
|------|--------------|--------------|---------------------|------------|
| Starter | $50 | $100 | 600 leads | 1 |
| Pro | $100 | $200 | 1,200 leads | 2 |
| Elite | $200 | $400 | 1,800 leads | 3 |

## Auto-Refill Trigger

**All tiers:**
- Triggers when balance drops below **$10**
- Uses the selected refill amount (small or large)
- Charges automatically via saved payment method

## Testing

To test different tier experiences:

1. **Test as Starter/Pro:**
   - Default behavior for most users
   - You'll see $50 and $100 options

2. **Test as Pro:**
   - Upgrade to Pro tier
   - Visit Settings → Billing → Call Balance
   - You'll see $100 and $200 options

3. **Test as Elite:**
   - Upgrade to Elite tier
   - Visit Settings → Billing → Call Balance
   - You'll see $200 and $400 options

4. **Verify Auto-Refill:**
   - Set balance low: `UPDATE call_balance SET balance = 12 WHERE user_id = 'YOUR_ID'`
   - Run test call to drop below $10
   - Should auto-refill with your selected amount (tier-specific)

## Database Compatibility

The existing schema supports these amounts without changes:
```sql
auto_refill_amount DECIMAL(10, 2) DEFAULT 50.00
```

This can handle any amount up to $99,999,999.99, so 50, 100, 200, and 400 all work perfectly.

## Future Considerations

### Potential Enhancements
1. **Custom amounts**: Allow Elite users to set custom refill amounts
2. **Smart refill**: Auto-adjust refill amount based on daily usage patterns
3. **Refill scheduling**: Pre-schedule refills before high-volume days
4. **Bulk discounts**: Offer discounts for larger refill amounts

### Volume-Based Tiers
If you add more tiers in the future:
```typescript
const refillOptionsByTier = {
  starter: { small: 50, large: 100 },
  pro: { small: 100, large: 200 },
  elite: { small: 200, large: 400 },
  enterprise: { small: 500, large: 1000 }, // Future tier
};
```

## Support

Users can always:
- Change their refill amount in settings
- Manually top up with any amount via Stripe
- Disable auto-refill if they prefer manual control
- Upgrade/downgrade tiers as needed


