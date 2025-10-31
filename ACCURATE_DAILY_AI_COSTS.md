# Accurate Daily AI Costs by Month

## Overview
Daily AI costs are now calculated using the **actual number of days in the current month** for accurate cost breakdown.

## Formula
```
Daily Base Cost = Monthly Subscription Price ÷ Days in Current Month
```

## Monthly Breakdown

### Starter Package ($999/month)

| Month | Days | Daily Base Cost |
|-------|------|-----------------|
| January | 31 | $32.23 |
| February | 28 | $35.68 |
| February (Leap) | 29 | $34.45 |
| March | 31 | $32.23 |
| April | 30 | $33.30 |
| May | 31 | $32.23 |
| June | 30 | $33.30 |
| July | 31 | $32.23 |
| August | 31 | $32.23 |
| September | 30 | $33.30 |
| October | 31 | $32.23 |
| November | 30 | $33.30 |
| December | 31 | $32.23 |

**Annual Average**: $33.08/day

---

### Pro Package ($1,299/month)

| Month | Days | Daily Base Cost |
|-------|------|-----------------|
| January | 31 | $41.90 |
| February | 28 | $46.39 |
| February (Leap) | 29 | $44.79 |
| March | 31 | $41.90 |
| April | 30 | $43.30 |
| May | 31 | $41.90 |
| June | 30 | $43.30 |
| July | 31 | $41.90 |
| August | 31 | $41.90 |
| September | 30 | $43.30 |
| October | 31 | $41.90 |
| November | 30 | $43.30 |
| December | 31 | $41.90 |

**Annual Average**: $43.03/day

---

### Elite Package ($2,499/month)

| Month | Days | Daily Base Cost |
|-------|------|-----------------|
| January | 31 | $80.61 |
| February | 28 | $89.25 |
| February (Leap) | 29 | $86.17 |
| March | 31 | $80.61 |
| April | 30 | $83.30 |
| May | 31 | $80.61 |
| June | 30 | $83.30 |
| July | 31 | $80.61 |
| August | 31 | $80.61 |
| September | 30 | $83.30 |
| October | 31 | $80.61 |
| November | 30 | $83.30 |
| December | 31 | $80.61 |

**Annual Average**: $82.77/day

---

## Example Calculation

### October 2025 (31 days) - Pro Package
```
Monthly Price: $1,299
Days in Month: 31
Daily Base: $1,299 ÷ 31 = $41.90/day

Day 1:
  Base Cost: $41.90
  Call Costs: 100 calls × 2.5 min avg = 250 min × $0.10 = $25.00
  ────────────────────────────────────────────────────────────────
  Total AI Cost: $66.90

Day 2:
  Base Cost: $41.90
  Call Costs: 75 calls × 3 min avg = 225 min × $0.10 = $22.50
  ────────────────────────────────────────────────────────────────
  Total AI Cost: $64.40
```

### February 2026 (28 days) - Same Pro Package
```
Monthly Price: $1,299
Days in Month: 28
Daily Base: $1,299 ÷ 28 = $46.39/day  ← Higher daily rate!

Day 1:
  Base Cost: $46.39
  Call Costs: 100 calls × 2.5 min avg = $25.00
  ────────────────────────────────────────────────────────────────
  Total AI Cost: $71.39  ← $4.49 more than October
```

## Why This Matters

### More Accurate Billing
- **31-day months**: Lower daily rate (more days to spread cost)
- **28-day months**: Higher daily rate (fewer days to spread cost)
- **Fair representation**: Customers see accurate daily breakdown

### Example Impact
**Pro Package ($1,299/month):**
- **Longest month** (31 days): $41.90/day
- **Shortest month** (28 days): $46.39/day
- **Difference**: $4.49/day

**Over a full year:**
- Old method (÷30): $1,299 × 12 = $15,588/year
- New method (÷days): Same $15,588/year total, but **accurate daily breakdown**

## Implementation

The system automatically:
1. Gets the current date
2. Calculates days in the current month
3. Divides subscription price by actual days
4. Updates `revenue_tracking.ai_retainer_cost` accordingly

```javascript
// Auto-calculates based on current month
const now = new Date();
const daysInMonth = new Date(
  now.getFullYear(), 
  now.getMonth() + 1, 
  0
).getDate();

const dailyBaseCost = monthlyPrice / daysInMonth;
```

## Terminal Output

When a call comes in, you'll see:
```
💰 Daily base cost (pro): $1299/31 days = $41.90/day
✅ AI costs updated: Base $41.90 + Calls $0.02 → $0.04
```

## Database Example

**revenue_tracking table:**
```sql
SELECT 
  date,
  ai_retainer_cost,  -- Daily base (varies by month)
  ai_daily_cost,     -- Per-minute charges
  (ai_retainer_cost + ai_daily_cost) as total
FROM revenue_tracking
WHERE user_id = 'xxx'
ORDER BY date DESC;
```

**Result:**
```
date       | ai_retainer_cost | ai_daily_cost | total
-----------+------------------+---------------+-------
2025-10-31 | 41.90           | 15.20         | 57.10
2025-10-30 | 41.90           | 22.40         | 64.30
2025-10-29 | 41.90           | 18.90         | 60.80
```

## Leap Year Handling

February leap years are automatically handled:
```javascript
new Date(2024, 2, 0).getDate(); // Returns 29 (leap year)
new Date(2025, 2, 0).getDate(); // Returns 28 (normal)
```

**February 2024 (Leap Year) - Pro Package:**
- $1,299 ÷ 29 = $44.79/day

**February 2025 (Normal) - Pro Package:**
- $1,299 ÷ 28 = $46.39/day

## Summary

✅ **More accurate** - Uses actual days in month
✅ **Fair pricing** - Customers pay same monthly, see accurate daily breakdown
✅ **Automatic** - System handles all months and leap years
✅ **Transparent** - Graph shows real daily costs

---

**Now your revenue graph shows the most accurate AI cost breakdown possible!** 📊

