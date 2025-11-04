# 🧪 Admin Test Panel - Setup Guide

## Overview

The Admin Test Panel is a floating control panel that appears when you log into a user's account using the master password. It allows you to:

- **Test Call Their AI**: Trigger a test call to YOUR phone using THEIR specific N8N workflow
- View user information and subscription tier
- Quick access to AI Config and Billing pages
- Monitor AI setup status

---

## 🔧 Setup Instructions

### Step 1: Add Admin Test Phone Number

Add your phone number to `.env.local`:

```env
# Your phone number for admin test calls (with country code)
ADMIN_TEST_PHONE_NUMBER=+15551234567
```

**Replace `+15551234567` with YOUR actual phone number** (include country code).

---

### Step 2: Set Up User's N8N Webhook

Before you can test a user's AI, you need to set their N8N webhook URL in the database.

#### **Option A: Using Supabase Dashboard (Easiest)**

1. Go to your Supabase project
2. Click **Table Editor** → `user_n8n_webhooks`
3. Click **Insert** → **Insert row**
4. Fill in:
   - `user_id`: The user's UUID (get from `profiles` table)
   - `ai_agent_webhook_url`: Their specific N8N workflow webhook URL
   - `ai_agent_webhook_enabled`: `true`
5. Click **Save**

#### **Option B: Using SQL**

```sql
INSERT INTO user_n8n_webhooks (user_id, ai_agent_webhook_url, ai_agent_webhook_enabled)
VALUES (
  'user-uuid-here',
  'https://n8n.example.com/webhook/their-unique-id',
  true
);
```

**Important:** Each user should have their OWN unique N8N workflow and webhook URL!

---

### Step 3: Ensure Master Password is Set

Make sure you have the master admin password set in `.env.local`:

```env
# Master password for admin login
MASTER_ADMIN_PASSWORD=your-super-secure-master-password-here
```

---

## 🚀 How to Use

### 1. Log In as Admin

1. Go to the login page
2. Click the lock icon 🔒 at the top right
3. Enter the user's email
4. Enter your **master password** (not their password!)
5. Click **Sign In**

You'll be logged into their account with admin access.

---

### 2. Access the Admin Panel

Once logged in with master password, you'll see a **purple spinning gear icon** at the bottom-right corner of the dashboard.

**Click the gear icon** to open the Admin Test Panel.

---

### 3. Test Their AI

In the admin panel:

1. **Check AI Status**: Must show "ready" (green badge)
2. **Click "📞 Test AI Call"**
3. **Wait for your phone to ring!**

The system will:
- ✅ Use THEIR N8N webhook URL
- ✅ Use THEIR AI configuration
- ✅ Call YOUR phone number (from `.env.local`)
- ✅ Log the test call in their call history

---

## 📋 What Gets Sent to N8N

When you click "Test AI Call", the system sends this payload to their N8N workflow:

```json
{
  "userId": "user-uuid",
  "userEmail": "user@example.com",
  "userName": "John Doe",
  "testMode": true,
  "testPhoneNumber": "+15551234567",
  "dailyCallLimit": 1,
  "callsMadeToday": 0,
  "sessionStatus": "active",
  "timestamp": "2024-11-04T10:30:00Z",
  "adminTest": true,
  "message": "Admin test call - verifying AI setup"
}
```

**Your N8N workflow should:**
1. Detect `testMode: true`
2. Use `testPhoneNumber` instead of pulling from database
3. Make ONE call to verify everything works
4. Return success response

---

## 🛡️ Security Features

- ✅ Admin panel only shows when logged in via master password
- ✅ Cookie-based admin mode detection (expires in 24 hours)
- ✅ All test calls are logged with "admin_test" disposition
- ✅ Master password required - never the user's actual password
- ✅ Only works if user's AI status is "ready"

---

## 🔍 Troubleshooting

### "No N8N webhook configured"

**Solution:** Add their webhook URL to the `user_n8n_webhooks` table (see Step 2 above).

### "N8N webhook is disabled"

**Solution:** Set `ai_agent_webhook_enabled` to `true` in their webhook record.

### "AI must be in 'ready' status"

**Solution:** Update their profile:

```sql
UPDATE profiles
SET ai_setup_status = 'ready'
WHERE user_id = 'user-uuid-here';
```

### "Admin test phone number not configured"

**Solution:** Add `ADMIN_TEST_PHONE_NUMBER` to your `.env.local` file.

### Admin panel doesn't appear

**Solution:** Make sure you logged in using the master password (click the lock icon on login page).

---

## 📊 Viewing Test Call Logs

Test calls are logged in the `calls` table with:

```sql
SELECT * FROM calls
WHERE disposition = 'admin_test'
ORDER BY created_at DESC;
```

---

## 🎯 Example Workflow

### **Setting Up a New User:**

1. **Create their N8N workflow**
   - Clone your template workflow
   - Get their unique webhook URL

2. **Add webhook to database:**
   ```sql
   INSERT INTO user_n8n_webhooks (user_id, ai_agent_webhook_url, ai_agent_webhook_enabled)
   VALUES (
     'abc-123-def-456',
     'https://n8n.app.com/webhook/user-unique-id',
     true
   );
   ```

3. **Log in as admin:**
   - Go to login page
   - Click lock icon 🔒
   - Email: `newuser@example.com`
   - Password: Your master password

4. **Test their setup:**
   - Open Admin Panel (purple gear icon)
   - Click "📞 Test AI Call"
   - Answer your phone
   - Verify the AI works correctly

5. **Hand off to user:**
   - Everything verified ✅
   - User can now launch their AI with confidence!

---

## 💡 Pro Tips

### **Quick Access Shortcuts:**

The admin panel includes quick action buttons:
- **View AI Config**: Jump to their AI Control Center
- **View Billing**: Check their subscription and billing

### **Minimize the Panel:**

Click the minimize button (**_**) to collapse the panel while keeping it accessible.

### **Check User Info:**

The panel shows:
- Full name
- Email
- User ID (first 20 chars)
- Subscription tier
- AI setup status

---

## 🔐 Production Recommendations

### **Secure Your Master Password:**
- Use a strong, unique password
- Never commit to version control
- Store securely (1Password, LastPass, etc.)
- Only share with trusted admins

### **Limit Admin Access:**
- Admin mode cookie expires in 24 hours
- Log out after testing
- Use separate admin account if possible

### **Monitor Test Calls:**
- Review `admin_test` calls regularly
- Ensure they're only from legitimate admins
- Set up alerts for suspicious activity

---

## 🎨 UI Features

The admin panel includes:

- 🟣 **Pulsing purple badge** - Shows active admin mode
- ⚡ **Spinning gear icon** - Indicates admin controls available
- 📊 **User info card** - Quick reference for current account
- 🟢 **Status indicators** - AI setup status with color coding
- ✅ **Success/Error feedback** - Real-time test call results
- 🔍 **Detailed logs** - View full N8N response in panel

---

## 📝 Summary

The Admin Test Panel provides a seamless way to:

1. Log into any user's account securely
2. Test their AI configuration end-to-end
3. Verify calls work before handing off
4. Troubleshoot issues quickly

**All with just one click!** 🚀

---

## 🆘 Need Help?

If you encounter issues:

1. Check the browser console for errors
2. Check server logs for N8N webhook responses
3. Verify all environment variables are set
4. Ensure user's webhook URL is correct in database

**Remember:** Test calls use the user's specific N8N workflow, so any issues likely indicate a problem with their workflow configuration.

