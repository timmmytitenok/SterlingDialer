# 🚀 Admin Test Panel - Quick Start (30 Seconds)

## ⚡ Super Fast Setup

### 1️⃣ Add Your Phone Number (5 seconds)

Edit `.env.local`:
```env
ADMIN_TEST_PHONE_NUMBER=+15551234567
```
*(Replace with YOUR phone number)*

---

### 2️⃣ Add User's Webhook (10 seconds)

Run in Supabase SQL Editor:
```sql
INSERT INTO user_n8n_webhooks (user_id, ai_agent_webhook_url, ai_agent_webhook_enabled)
VALUES (
  'PUT_USER_ID_HERE',
  'https://n8n.app/webhook/THEIR_WEBHOOK_ID',
  true
);
```

**Where to get these:**
- `user_id`: From `profiles` table
- Webhook URL: From their N8N workflow

---

### 3️⃣ Test It! (15 seconds)

1. **Login** → Click 🔒 lock icon
2. **Email** → User's email
3. **Password** → Your master password
4. **Click** → Purple gear icon (bottom-right)
5. **Click** → "📞 Test AI Call"
6. **Answer** → Your phone rings!

---

## 🎯 That's It!

✅ You're now testing THEIR AI on YOUR phone!

---

## 📋 Common Commands

### Get User ID:
```sql
SELECT user_id, email, full_name 
FROM profiles 
WHERE email = 'user@example.com';
```

### Check User's Webhook:
```sql
SELECT * FROM user_n8n_webhooks 
WHERE user_id = 'user-uuid';
```

### View Test Calls:
```sql
SELECT * FROM calls 
WHERE disposition = 'admin_test' 
ORDER BY created_at DESC;
```

### Set AI to Ready:
```sql
UPDATE profiles 
SET ai_setup_status = 'ready' 
WHERE user_id = 'user-uuid';
```

---

## 🆘 Troubleshooting (One-Liners)

| Problem | Solution |
|---------|----------|
| No admin panel | Click lock icon 🔒 on login page |
| "No webhook configured" | Run SQL insert above |
| "AI must be ready" | Run "Set AI to Ready" SQL above |
| "Phone number not configured" | Add `ADMIN_TEST_PHONE_NUMBER` to .env.local |
| N8N doesn't call | Check workflow handles `testMode: true` |

---

## 🎨 What You'll See

```
                                    🟣 ← Click this
                                    ⚙️  (Spinning gear icon)
                                    
┌─────────────────────────────────┐
│ 🛡️ Admin Tools              _ X │
├─────────────────────────────────┤
│ Current User                    │
│ John Doe [pro] ✅               │
│                                 │
│ [📞 Test AI Call]               │
│                                 │
│ ✅ Success! Phone ringing...    │
└─────────────────────────────────┘
```

---

## 💡 Pro Tips

- **Minimize panel:** Click **_** button
- **Quick actions:** Jump to AI Config or Billing
- **View details:** Click "View Details" in result
- **Admin badge:** Purple border = admin mode active

---

## ✅ Done!

You're all set. Test away! 🎉

**Full docs:** See `ADMIN_TEST_PANEL_SETUP.md`

