# 👥 Admin Users Management - Complete Guide

## ✅ What Was Built

You now have a **complete admin panel** to manage all users and their Retell AI configurations!

### 🎯 Features

#### **1. Admin Users Page** (`/admin/users`)
- View all users in your system
- See each user's:
  - Supabase User ID
  - Full Name
  - Email Address
  - Retell Agent Name
  - Retell Agent ID
  - Outbound Phone Number
  - Configuration Status (Active/Inactive)
- Click "Configure" to edit any user's settings

#### **2. User Configuration Modal**
- Beautiful modal to edit Retell settings:
  - **Agent Name**: Friendly identifier (e.g., "John's AI Agent")
  - **Retell Agent ID**: The actual agent ID from Retell dashboard
  - **Outbound Phone Number**: Phone number that appears on caller ID
- Instant save with validation
- Real-time updates

#### **3. API Endpoints**
- `GET /api/admin/users` - Fetch all users with their configs
- `POST /api/admin/users/update-retell` - Update user's Retell settings

#### **4. Call System Integration**
- When AI makes calls, it automatically uses:
  - User's specific Retell Agent ID
  - User's specific outbound phone number
- Validates config before making calls
- Clear error messages if not configured

---

## 📋 Setup Instructions

### Step 1: Run Database Migration

Go to **Supabase SQL Editor** and run this:

```sql
-- Add phone_number and agent_name to user_retell_config
ALTER TABLE user_retell_config 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

ALTER TABLE user_retell_config 
ADD COLUMN IF NOT EXISTS agent_name TEXT;
```

### Step 2: Deploy to Vercel

Push your changes and deploy!

### Step 3: Access Admin Panel

1. **Log into your admin panel** (you already have access!)
2. Go to: `https://your-app.vercel.app/admin/users`
   - Or click "👥 Manage Users" from the admin dashboard
3. You'll see all users in a table
4. Click "Configure" on any user
5. Set their:
   - Agent Name (optional, for your reference)
   - Retell Agent ID (from Retell dashboard)
   - Outbound Phone Number (E.164 format, e.g., +15551234567)
6. Click "Save Configuration"

**Note:** The user management page uses your existing admin panel login - no additional setup needed!

---

## 🎨 UI Preview

### **Users Table:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ User ID      │ Name      │ Email           │ Agent      │ Phone        │ Status │ Actions    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 12ab34cd...  │ John Doe  │ john@email.com  │ John's AI  │ +15551234567 │ Active │ Configure  │
│ 56ef78gh...  │ Jane Smith│ jane@email.com  │ Not Config │ N/A          │ Inactive│ Configure  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### **Configuration Modal:**
```
┌───────────────────────────────────────────────────────┐
│ 📞 Configure Retell Agent                             │
│ john@email.com                                        │
├───────────────────────────────────────────────────────┤
│ 📝 Agent Name (Optional)                              │
│ [John's AI Agent________________________]             │
│                                                       │
│ 🤖 Retell Agent ID                                    │
│ [agent_xxxxxxxxxxxxx____________________]             │
│                                                       │
│ 📞 Outbound Phone Number                              │
│ [+15551234567___________________________]             │
├───────────────────────────────────────────────────────┤
│                          [Cancel]  [Save Configuration]│
└───────────────────────────────────────────────────────┘
```

---

## 🔧 How It Works

### **When AI Makes a Call:**

1. User clicks "Launch AI"
2. System calls `/api/ai-control/next-call`
3. API fetches user's `user_retell_config`:
   ```typescript
   {
     retell_agent_id: "agent_xxxxxxxxxxxxx",
     phone_number: "+15551234567",
     agent_name: "John's AI Agent"
   }
   ```
4. API validates config:
   - ❌ If `agent_id` missing → Error: "Retell Agent ID not configured"
   - ❌ If `phone_number` missing → Error: "Outbound phone number not configured"
   - ✅ If both present → Make call
5. Call is made with:
   ```json
   {
     "agent_id": "agent_xxxxxxxxxxxxx",
     "from_number": "+15551234567",
     "to_number": "+15559876543"
   }
   ```

### **Admin Updates Config:**

1. Admin goes to `/admin/users`
2. Clicks "Configure" on a user
3. Updates agent ID and phone number
4. Saves
5. Next time that user's AI runs, it uses the new config!

---

## 🚀 Admin Navigation

### **From Admin Dashboard:**
- Added "👥 Manage Users" button in top-right
- Click to go directly to users page

### **From Users Page:**
- "Back" button returns to admin dashboard
- Or click "Exit Admin" to go to main dashboard

---

## 🔐 Security

### **Admin Check Method:**

The user management page uses your **existing admin panel authentication** via the `admin_mode` cookie:

```typescript
import { isAdminMode } from '@/lib/admin-check';

const isAdmin = await isAdminMode();
if (!isAdmin) {
  return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
}
```

This means:
- ✅ If you can access `/admin/dashboard`, you can access `/admin/users`
- ✅ Same login system for all admin pages
- ✅ No need for additional database flags
- ✅ Works with your existing admin setup

---

## 📊 Database Schema

### **user_retell_config** (Updated):
```sql
CREATE TABLE user_retell_config (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  retell_api_key TEXT,          -- API key (global or per-user)
  retell_agent_id TEXT,          -- NEW: Agent ID
  phone_number TEXT,             -- NEW: Outbound phone
  agent_name TEXT,               -- NEW: Friendly name
  webhook_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

---

## 🎯 Usage Examples

### **Example 1: New User Setup**
1. User signs up
2. Admin goes to `/admin/users`
3. Finds the new user in the table
4. Clicks "Configure"
5. Enters:
   - Agent Name: "Alex's Life Insurance Agent"
   - Agent ID: "agent_abc123xyz456"
   - Phone: "+18005551234"
6. Clicks "Save"
7. User can now launch AI and make calls!

### **Example 2: Update Phone Number**
1. User's phone number needs to change
2. Admin opens user config modal
3. Updates phone number: "+18005559999"
4. Saves
5. Next call uses new number

### **Example 3: Troubleshooting**
User reports: "AI won't start"
1. Admin checks user config
2. Sees "Not Configured" in table
3. Realizes agent ID is missing
4. Adds agent ID
5. User tries again → Works!

---

## ✅ Checklist

- [ ] Run `ADD_RETELL_PHONE_NUMBER.sql` in Supabase
- [ ] Deploy to Vercel
- [ ] Log into admin panel
- [ ] Go to `/admin/users` (or click "Manage Users" from admin dashboard)
- [ ] Configure each user's Retell settings
- [ ] Test: Launch AI as a configured user
- [ ] Verify: Calls use correct agent and phone number

---

## 🐛 Troubleshooting

### **Error: "Forbidden - Admin only"**
**Solution:** Make sure you're logged into the admin panel first. Go to `/admin/dashboard` to log in, then access `/admin/users`.

### **Error: "Retell Agent ID not configured"**
**Solution:** Go to `/admin/users`, configure the user's agent ID.

### **Error: "Outbound phone number not configured"**
**Solution:** Go to `/admin/users`, configure the user's phone number.

### **Can't see any users**
**Solution:** 
1. Check browser console for errors
2. Verify you're an admin
3. Make sure users exist in your database

### **Config not saving**
**Solution:**
1. Check browser console for API errors
2. Verify database columns exist
3. Check Supabase logs

---

## 🎉 You're Done!

You now have:
- ✅ Complete admin panel to manage users
- ✅ Per-user Retell agent configuration
- ✅ Per-user outbound phone numbers
- ✅ Beautiful UI for easy management
- ✅ Secure admin-only access
- ✅ Real-time updates
- ✅ Validation and error handling

**Each user gets their own AI agent with their own phone number!** 📞✨

---

## 📝 Notes

- Agent Name is optional (just for your reference in admin panel)
- Agent ID and Phone Number are required for calls to work
- Phone numbers should be in E.164 format: `+[country code][number]`
- Example: `+15551234567` (US), `+442012345678` (UK)
- You can update configs at any time
- Changes take effect immediately on next call

---

## 🚀 Next Steps

Consider adding:
- Bulk import users from CSV
- Email notifications when config missing
- Usage analytics per user
- Agent performance metrics
- Call recording management
- Billing integration per user

Want any of these features? Let me know! 🎯

