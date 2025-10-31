# Balance Check Before AI Launch - Documentation

## 🛡️ **Feature Overview**

Before launching the AI calling agent, the system automatically checks the user's call balance to ensure they have sufficient funds. This prevents users from launching the AI without adequate funding and ensures smooth operation.

---

## 💰 **Balance Requirements**

### Minimum Balance to Launch
- **Minimum Required:** `$10.00`
- **Purpose:** Ensures the AI has enough funds to make calls without immediate interruption

### Why $10 Minimum?
- Calls cost `$0.10 per minute`
- $10 provides a buffer of approximately **100 minutes** of calling time
- Prevents immediate auto-refill triggers (which occur at balances below $10)
- Reduces transaction fees by avoiding frequent small charges

### Negative Balance Handling
Users **can go into negative balance** while the AI is actively running:
- ✅ If balance starts at `$11` and the AI runs all day, balance can drop to `-$40`
- ✅ This is acceptable during an active session
- ❌ **But** the next day, they **cannot launch** until balance is refilled above `$10`

---

## 🔄 **How It Works**

### 1. **User Clicks "Launch AI Agent"**
```typescript
onClick={handleLaunchClick}
```

### 2. **Balance Check API Call**
```typescript
const response = await fetch('/api/balance/get');
const data = await response.json();
```

### 3. **Balance Validation**
```typescript
if (data.balance < 10) {
  setShowLowBalanceWarning(true); // ❌ Show warning modal
  return;
}

setShowLaunchModal(true); // ✅ Proceed to launch configuration
```

---

## ⚠️ **Low Balance Warning Modal**

If the balance is below `$10`, a prominent warning modal appears with:

### Visual Design
- **Red themed** (border, icons, text) to grab attention
- **Pulsing icon** to indicate urgency
- **Large balance display** showing current balance with 3 decimal places
- **Clear messaging** about minimum requirement

### Content
1. **Warning Header**
   - "⚠️ Low Balance Warning"
   - "Insufficient funds to launch AI"

2. **Balance Display**
   ```
   Current Balance: $2.450
   Minimum required: $10.00
   ```

3. **Helpful Tip**
   - Suggestion to set up auto-refill to avoid interruptions

4. **Action Buttons**
   - **Cancel** - Closes modal, stays on AI Control Center
   - **Add Funds Now** - Redirects to `/dashboard/settings/billing/callbalance`

---

## 📊 **Balance States**

| Current Balance | Can Launch? | Action Required |
|----------------|-------------|-----------------|
| `$0.00` | ❌ No | Must add funds |
| `$5.00` | ❌ No | Must add funds |
| `$9.99` | ❌ No | Must add funds |
| `$10.00` | ✅ Yes | Can launch |
| `$50.00` | ✅ Yes | Can launch |
| `-$10.00` (during active session) | ⚠️ Allowed during session | Must refill before next launch |

---

## 🔐 **Error Handling**

### If Balance API Fails
```typescript
catch (error) {
  console.error('Error checking balance:', error);
  setShowLowBalanceWarning(true); // Show warning as safety measure
}
```

**Philosophy:** If we can't verify sufficient balance, we show the warning to be safe and prevent potential issues.

---

## 🎯 **User Flow**

### Successful Launch Flow
```
1. User clicks "Launch AI Agent"
   ↓
2. System checks balance ($35.00 available)
   ↓
3. Balance > $10 ✅
   ↓
4. Launch configuration modal opens
   ↓
5. User configures and launches AI
```

### Low Balance Flow
```
1. User clicks "Launch AI Agent"
   ↓
2. System checks balance ($3.50 available)
   ↓
3. Balance < $10 ❌
   ↓
4. Low Balance Warning modal appears
   ↓
5. User clicks "Add Funds Now"
   ↓
6. Redirected to Settings > Billing > Call Balance (`/dashboard/settings/billing/callbalance`)
   ↓
7. User adds funds ($50.00)
   ↓
8. Returns to AI Control Center
   ↓
9. Clicks "Launch AI Agent" again
   ↓
10. Balance check passes ✅
    ↓
11. AI launches successfully
```

---

## 💡 **Benefits**

1. **Prevents Wasted Effort**
   - Users don't spend time configuring AI only to have it fail immediately

2. **Clear Communication**
   - Users know exactly why they can't launch and what to do

3. **Reduces Support Tickets**
   - Self-service solution guides users to add funds

4. **Improves User Experience**
   - Proactive warning is better than reactive error after launch

5. **Protects Revenue**
   - Ensures users have paid before consuming resources

---

## 🛠️ **Implementation Files**

### Modified Files
- `components/ai-control-center-v2.tsx`
  - Added `showLowBalanceWarning` state
  - Added `currentBalance` state
  - Added `handleLaunchClick()` function
  - Updated launch button to use `handleLaunchClick`
  - Added low balance warning modal UI

### API Endpoint Used
- **GET** `/api/balance/get`
  - Returns: `{ balance: number }`
  - Example: `{ balance: 35.420 }`

---

## 📝 **Testing**

### Test Case 1: Sufficient Balance
1. Set user balance to `$50`
2. Click "Launch AI Agent"
3. **Expected:** Launch configuration modal opens

### Test Case 2: Zero Balance
1. Set user balance to `$0`
2. Click "Launch AI Agent"
3. **Expected:** Low balance warning appears showing "$0.00"

### Test Case 3: Low Balance (< $10)
1. Set user balance to `$5.75`
2. Click "Launch AI Agent"
3. **Expected:** Low balance warning appears showing "$5.750"

### Test Case 4: Exact Minimum
1. Set user balance to `$10.00`
2. Click "Launch AI Agent"
3. **Expected:** Launch configuration modal opens (balance sufficient)

### Test Case 5: Negative Balance
1. User ran AI yesterday, balance is now `-$15.00`
2. Click "Launch AI Agent" today
3. **Expected:** Low balance warning appears showing "-$15.000"
4. User adds $50
5. New balance: `$35.00`
6. Can now launch ✅

---

## 🚀 **Next Steps**

### Future Enhancements (Optional)
1. **Real-time Balance Display**
   - Show current balance on AI Control Center main screen
   - Update in real-time as calls are made

2. **Balance History Link**
   - Add link in warning modal to view balance transaction history

3. **Quick Top-Up Options**
   - Allow adding funds directly from warning modal
   - Pre-filled amounts: $50, $100, $200

4. **SMS/Email Alerts**
   - Notify users when balance drops below $10
   - Remind them to refill before next launch

---

## 📚 **Related Documentation**
- [Call Balance System Guide](./CALL_BALANCE_SYSTEM_GUIDE.md)
- [Auto-Refill Testing Guide](./AUTO_REFILL_TESTING_GUIDE.md)
- [Call Integration Fix](./CALL_INTEGRATION_FIX.md)

