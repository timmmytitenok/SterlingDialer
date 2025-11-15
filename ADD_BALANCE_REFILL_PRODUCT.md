# Add Balance Refill Product to .env.local

Add these two lines to your `.env.local` file:

```bash
# Balance Refill Product ($25)
STRIPE_PRICE_ID_BALANCE_REFILL=price_1SSrrT060cz3Qrqo3KP5c7LG
STRIPE_PRICE_ID_BALANCE_REFILL_TEST=price_1SSrtS060cz3QrqoF1VRvC1s
```

Save the file, then restart your dev server:

```bash
npm run dev
```

