# 🔐 Master Password Admin Login - Setup Guide

## Overview

You now have a master password feature that allows you to log into any user's dashboard using just their email and a master password. This is perfect for admin support and troubleshooting.

---

## 🚀 Setup Instructions

### Step 1: Get Your Supabase Service Role Key

1. Go to your **Supabase Dashboard**
2. Click **Settings** → **API**
3. Scroll down to **Project API keys**
4. Copy the `service_role` key (⚠️ **secret** key - never expose to client)

### Step 2: Add Environment Variables

Add these to your `.env.local` file:

```bash
# Supabase Service Role Key (if you don't have it already)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Master Admin Password (choose a VERY strong password)
MASTER_ADMIN_PASSWORD=your-super-secure-master-password-here
```

**Example:**
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
MASTER_ADMIN_PASSWORD=MyS3cur3M@sterP@ssw0rd2025!
```

### Step 3: Restart Your Development Server

```bash
# Stop the server (Ctrl+C) and restart
npm run dev
```

---

## 📱 How to Use

### 1. Go to the Login Page

Navigate to `/login` in your browser.

### 2. Enable Master Login Mode (Secret)

1. Make sure you're on the **Sign In** tab (not Sign Up)
2. **Click the Sterling AI logo 5 times rapidly** (within 2 seconds)
3. The text below will change to **"Admin Access"**
4. The password field border will turn purple (subtle indicator)

**Note:** This is completely hidden from regular users - no visible buttons or obvious UI changes.

### 3. Enter Credentials

- **Email**: Enter the email of the user you want to log in as
- **Password**: Enter your master password (from `.env.local`)

### 4. Sign In

Click **"Sign In"** and you'll be logged into that user's dashboard!

### 5. Disable Master Mode (Optional)

Click the logo 5 times again to toggle it off and return to normal login mode.

---

## 🎯 Use Cases

### Customer Support
```
Customer: "I can't see my calls!"
You: *Use master login to check their dashboard*
```

### Testing & Debugging
```
Test different user scenarios without needing their actual password
```

### Account Recovery
```
Help users who are locked out or having issues
```

---

## 🔒 Security Considerations

### ⚠️ CRITICAL SECURITY NOTES

1. **Strong Master Password**: Use a very strong, unique password
   - At least 20 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - Don't use common words

2. **Never Commit to Git**: 
   - The `.env.local` file is already in `.gitignore`
   - Never commit the service role key or master password

3. **Limit Access**:
   - Only share the master password with trusted admins
   - Consider rotating it periodically

4. **Logging**: 
   - All master login attempts are logged to console
   - Monitor for suspicious activity

5. **Production Use**:
   - Consider adding IP whitelist restrictions
   - Add rate limiting to prevent brute force
   - Consider 2FA for extra security

---

## 🛠️ Technical Details

### Files Created/Modified

1. **`lib/supabase/service.ts`**
   - Creates Supabase client with service role
   - Bypasses RLS policies

2. **`app/api/admin/master-login/route.ts`**
   - Verifies master password
   - Finds user by email
   - Creates session using service role

3. **`app/login/page.tsx`**
   - Added secret trigger (click logo 5 times)
   - Subtle purple border on password field when active
   - "Admin Access" text indicator
   - Handles master login flow

4. **`middleware.ts`**
   - Added `/api/admin/master-login` to exclusion list
   - Allows unauthenticated access to master login endpoint

### How It Works

1. User clicks Sterling AI logo 5 times (secret trigger)
2. Master mode activates (subtle purple border on password field)
3. User enters target user's email + master password
4. API verifies master password matches `.env.local`
5. Service role client finds user by email
6. Generates a magic link token for that user
7. Returns token to client
8. Client verifies token and creates session
9. User is logged into target user's dashboard

### API Endpoint

**POST** `/api/admin/master-login`

**Request:**
```json
{
  "email": "user@example.com",
  "masterPassword": "your-master-password"
}
```

**Response (Success):**
```json
{
  "success": true,
  "token": "3bf60b71d744f8daebb4b944755360bb...",
  "email": "user@example.com",
  "type": "magiclink"
}
```

**Response (Error):**
```json
{
  "error": "Invalid master password"
}
```

---

## 🧪 Testing

### Test the Feature

1. Create a test user account (or use an existing one)
2. Note their email address
3. Log out
4. Go to login page
5. Click "Admin Master Login"
6. Enter:
   - Email: test user's email
   - Password: your master password
7. Click Sign In
8. You should be logged into their dashboard!

### Expected Console Logs

When master login succeeds, you'll see:
```
✅ Master password verified, logging in as: user@example.com
✅ User found: [user-id]
✅ Session created successfully for user: user@example.com
```

When it fails:
```
❌ Invalid master password attempt for: user@example.com
```

---

## 🚨 Troubleshooting

### "Invalid master password"

- Check that `MASTER_ADMIN_PASSWORD` is set in `.env.local`
- Make sure you restarted the dev server after adding it
- Verify you're entering the password exactly as it appears in `.env.local`

### "User not found with that email"

- Check the email is spelled correctly
- Verify the user exists in Supabase (Authentication → Users)
- Make sure the user has confirmed their email

### "Failed to create session"

- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Check Supabase dashboard for any auth issues
- Check console logs for detailed error messages

### Session Doesn't Persist

- Clear browser cookies and try again
- Check that cookies are enabled
- Try in incognito mode

---

## 📝 Notes

- Master login mode is **only available on Sign In** (not Sign Up)
- Switching between Sign In/Sign Up resets master login mode
- The service role key has **full database access** - guard it carefully
- Sessions created via master login expire in 7 days (configurable in API route)

---

## 🎉 You're All Set!

You now have a powerful admin tool to access any user's dashboard. Use it responsibly! 🔐

