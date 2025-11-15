# 💰 $25 Balance Refill System - Setup Complete!

## ✅ What Was Changed:

### 1. **Fixed Refill Amount: $25**
- No more $50/$100 options
- Simple, clean $25 refills
- Auto-refill always uses $25

### 2. **Dynamic Minutes Calculation**
Shows estimated minutes based on user's tier:
- **Starter** ($0.30/min): $25 = **83 minutes**
- **Pro** ($0.25/min): $25 = **100 minutes**
- **Elite** ($0.20/min): $25 = **125 minutes**

### 3. **Smart Auto-Refill**
- Balance < $10 → Auto-charge $25
- Uses saved card
- No user interaction needed

---

## 🔧 Setup Steps:

### Step 1: Add to .env.local

Open your `.env.local` file and add these two lines:

```bash
# Balance Refill Product ($25)
STRIPE_PRICE_ID_BALANCE_REFILL=price_1SSrrT060cz3Qrqo3KP5c7LG
STRIPE_PRICE_ID_BALANCE_REFILL_TEST=price_1SSrtS060cz3QrqoF1VRvC1s
```

**Production Price ID:** `price_1SSrrT060cz3Qrqo3KP5c7LG`  
**Test Price ID:** `price_1SSrtS060cz3QrqoF1VRvC1s`

---

### Step 2: Restart Server

```bash
# Kill server (Ctrl+C)
npm run dev
```

---

### Step 3: Test It!

1. Go to **Dashboard → Settings → Call Balance**
2. Click **"Add Card & Refill Balance"**
3. Should show: **"$25 Per refill"** with **minutes calculation**
4. Complete payment
5. Balance should increase by $25! ✅

---

## 📊 What Users Will See:

### Call Balance Card:

```
💰 $25
   Per refill

83 minutes  ← Calculates based on their tier!
at $0.30/min

💳 When balance drops below $10, your card 
   will be charged $25 automatically
```

---

## 🔄 Auto-Refill Flow:

```
1. User makes calls
2. Balance drops: $15 → $12 → $9.50
3. 🚨 Balance < $10 detected!
4. 💳 Auto-charge $25
5. ✅ Balance: $9.50 → $34.50
6. Continue calling!
```

---

## 🎯 Why This Is Better:

✅ **Simpler** - Fixed amount, no options  
✅ **Reliable** - Uses Stripe product (not dynamic sessions)  
✅ **Predictable** - Users always know it's $25  
✅ **Flexible** - Minutes vary by tier (fair pricing!)  
✅ **Safer** - Fewer webhook edge cases  

---

## 🧪 Test Checklist:

- [ ] Added env variables to `.env.local`
- [ ] Restarted dev server
- [ ] Refill page shows "$25" 
- [ ] Minutes calculation shows based on tier
- [ ] Manual refill works (adds $25)
- [ ] Auto-refill triggers when balance < $10

---

## 📝 Files Modified:

1. `/app/api/balance/refill/route.ts` - Uses Stripe product
2. `/app/api/balance/deduct/route.ts` - Auto-refill fixed to $25
3. `/app/api/stripe/webhook/route.ts` - Processes $25 refills
4. `/components/call-balance-card.tsx` - Shows $25 + minutes

---

**Add those env variables and restart your server! The $25 refill system is ready!** 🎉

