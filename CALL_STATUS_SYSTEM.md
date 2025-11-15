# 📞 Call Status System - How It Works

## 🔄 **Call Flow:**

1. **AI Starts** → Makes first call via `/api/ai-control/next-call`
2. **Retell Makes Call** → Dials the lead's number
3. **Call Completes** → Retell sends webhook to `/api/retell/call-result`
4. **System Processes Result** → Updates lead status, spend, balance
5. **Check for More Calls** → Either continues or stops AI

---

## 📊 **Call Statuses:**

### **If Call NOT Answered:**
- ⏰ **Duration < 10 seconds** = No Answer
- 📋 **Status**: `no_answer`
- 💵 **Cost**: $0 (no charge for unanswered calls)
- 🔁 **Next**: Try calling once more (max 2 attempts/day)

### **If Call Answered:**
- ⏰ **Duration > 10 seconds** = Answered
- 💵 **Cost**: Based on subscription tier
  - **Starter**: $0.30 per minute
  - **Pro**: $0.25 per minute
  - **Elite**: $0.20 per minute
- 📋 **Status determined by**:
  - **Retell's custom_analysis_data** (most reliable)
  - **Call analysis** (Retell AI's interpretation)
  - **in_voicemail flag** (voicemail detection)

---

## 🎯 **Outcome Categories:**

| Outcome | Lead Status | What It Means |
|---------|------------|---------------|
| **Not Interested** | `not_interested` | Lead declined, mark as closed |
| **Callback Later** | `callback_later` | Lead wants you to call back |
| **Appointment Booked** | `appointment_booked` | 🎉 Meeting scheduled! |
| **Live Transfer** | `live_transfer` | Lead wants to speak to someone |
| **Unclassified** | `unclassified` | Unclear outcome, review later |
| **No Answer** | `no_answer` (after 2 tries) | Didn't pick up |

---

## 🛑 **AI Stops When:**

1. ✅ **Target Reached** - Made all the calls you requested
2. 📭 **No More Leads** - No more callable leads available
3. 💰 **Daily Spend Limit** - Hit your budget cap
4. 🤚 **Manual Stop** - You clicked the STOP button

---

## 🔍 **After Each Call, System Checks:**

```
1. Is AI still running? (status === 'running')
   ❌ No → Stop, don't trigger next call
   ✅ Yes → Continue

2. Have we reached the target call count?
   ✅ Yes → Stop AI, mark as 'target_reached'
   ❌ No → Continue

3. Are there more callable leads?
   ❌ No → Stop AI, mark as 'no_leads'
   ✅ Yes → Trigger next call!
```

---

## 📈 **What Gets Updated:**

### **After Each Call:**
- ✅ Lead status (`not_interested`, `callback_later`, etc.)
- ✅ Call attempts counter
- ✅ Last called timestamp
- ✅ Daily spend (`today_spend`)
- ✅ Calls made today (`calls_made_today`)
- ✅ Call balance (deducts cost)
- ✅ Call history (saved in `calls` table)

### **Dashboard Updates:**
- ✅ AI Control Center (live status, progress)
- ✅ Lead Manager (lead statuses)
- ✅ Dashboard metrics (revenue, calls)

---

## 🔗 **Webhook Setup:**

**Your Retell Webhook URL:**
```
https://YOUR_DOMAIN/api/retell/call-result
```

**Or for local testing:**
```
https://YOUR_NGROK_URL/api/retell/call-result
```

**Configure this in Retell dashboard:**
1. Go to Retell dashboard
2. Settings → Webhooks
3. Paste the URL above
4. Select "Call Ended" event

---

## 🎨 **Live Updates:**

The `LiveCallStatus` component polls every second and shows:
- 📞 Current lead being called
- 📊 Calls made / Target
- 💰 Today's spend / Daily limit
- 🛑 STOP button (stops AI instantly)

---

## 🐛 **Troubleshooting:**

### **Calls not continuing?**
- Check: `/admin/webhooks` to see if Retell is sending webhooks
- Check: Terminal logs for webhook processing
- Check: Retell dashboard has correct webhook URL

### **Wrong call statuses?**
- Check: Retell's call analysis accuracy
- Check: Transcript keywords in `/api/retell/call-result`
- May need to adjust outcome detection logic

### **AI stops too early?**
- Check: Daily spend limit setting
- Check: Callable leads count
- Check: Call attempts limit (max 2/day)

---

## ✅ **Everything is Working!**

Your AI calling system now:
- 📞 Makes calls automatically
- 📊 Tracks call outcomes
- 💰 Manages spend
- 🔄 Continues until target or no more leads
- 🛑 Stops when complete

**Go to `/admin/webhooks` to monitor recent calls!** 🎉

