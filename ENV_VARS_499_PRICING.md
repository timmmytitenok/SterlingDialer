# Environment Variables for $499 Pricing

Add this to your `.env.local`:

```bash
# SterlingAI Pro Access - $499/month (Test Mode)
STRIPE_PRICE_ID_PRO=price_1SSssS060cz3QrqoKU7zMAkB

# When you go to production, add the live price ID:
# STRIPE_PRICE_ID_PRO_LIVE=price_xxxxx (create this in live mode)
```

**Note:** You only need ONE price ID now (not 3)!

---

## Remove These Old Variables:

You can remove these from `.env.local`:
- ~~STRIPE_PRICE_ID_STARTER~~
- ~~STRIPE_PRICE_ID_ELITE~~

Just keep:
- `STRIPE_PRICE_ID_PRO` (your new $499/month plan)
- `STRIPE_PRICE_ID_BALANCE_REFILL` (the $25 balance refill)
- `STRIPE_PRICE_ID_BALANCE_REFILL_TEST`

