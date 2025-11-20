# 🎯 Session-Wide Referral Tracking System

## Overview

Your referral system now tracks referral codes **throughout the entire browsing session** - not just on the signup page!

### ✨ What Changed

**Before:**
- Referral code only worked if user landed directly on `/login?ref=CODE`
- Lost if user navigated to other pages
- Stored only in localStorage (inconsistent)

**After:**
- ✅ Referral code captured on **ANY page** they visit
- ✅ Persists **entire session** until browser closes
- ✅ Stored in **session cookies** (more reliable)
- ✅ Auto-redirects to signup with referral active
- ✅ Works across all page navigation

---

## 🚀 How It Works

### The Flow:

```
1. User clicks: yourapp.com/login?ref=ABC123&signup=true
   ↓
2. Middleware detects ?ref=ABC123 on ANY page
   ↓
3. Stores in SESSION COOKIE (expires when browser closes)
   ↓
4. User navigates to landing page? ✅ Still active!
   ↓
5. User goes to pricing page? ✅ Still active!
   ↓
6. User finally signs up? ✅ Referral is applied!
   ↓
7. Cookie cleared after successful signup
```

---

## 🔧 Technical Implementation

### 1. **Middleware Capture** (`middleware.ts`)

The middleware now:
- Detects `?ref=` parameter on **ANY page**
- Stores it in a **session cookie** (no expiry = cleared on browser close)
- Redirects non-login pages to `/login?ref=CODE&signup=true`

```typescript
// Capture referral code from ANY URL
const refCode = request.nextUrl.searchParams.get('ref');

if (refCode) {
  // Store in session cookie
  response.cookies.set('pending_referral', refCode.toUpperCase(), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    // No maxAge = session cookie
  });
  
  // Redirect to signup if not already there
  if (pathname !== '/login' && pathname !== '/signup' && !pathname.startsWith('/api')) {
    const signupUrl = new URL('/login', request.url);
    signupUrl.searchParams.set('ref', refCode);
    signupUrl.searchParams.set('signup', 'true');
    return NextResponse.redirect(signupUrl);
  }
}
```

### 2. **Login Page Enhancement** (`app/login/page.tsx`)

The login page now:
- Checks **3 sources** for referral code: URL → Cookie → LocalStorage
- Auto-enables signup mode with `?signup=true`
- Clears cookie + localStorage after successful signup

```typescript
// Priority: URL > Cookie > LocalStorage
const refCode = searchParams.get('ref');
const cookieRef = getCookie('pending_referral');
const localRef = localStorage.getItem('pending_referral');

const finalRefCode = refCode || cookieRef || localRef;

if (finalRefCode) {
  setReferralCode(finalRefCode);
  setIsSignUp(true); // Force signup mode
}

// After successful signup:
localStorage.removeItem('pending_referral');
document.cookie = 'pending_referral=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
```

### 3. **Referral Link Generation**

All referral links now point directly to signup:

**Before:** `yourapp.com/?ref=CODE` or `yourapp.com/signup?ref=CODE`  
**After:** `yourapp.com/login?ref=CODE&signup=true`

Updated in:
- ✅ `/api/referral/get-code` - Regular referral codes
- ✅ `/api/referral/create-code` - Custom referral codes
- ✅ `components/affiliate-earnings-client.tsx` - Affiliate links
- ✅ `app/admin/affiliate-program/page.tsx` - Admin preview

---

## 📋 Benefits

### For Users:
1. **More forgiving** - Don't lose referral if they explore your site first
2. **Better UX** - Can browse pages and still get credit when ready to sign up
3. **No rush** - Referral stays active throughout entire session

### For You:
1. **Higher conversion** - Users more likely to complete signup
2. **Better tracking** - Cookies more reliable than localStorage
3. **Cleaner URLs** - Direct to signup instead of intermediate redirects

---

## 🎯 Example Scenarios

### Scenario 1: Direct to Signup
```
User clicks: yourapp.com/login?ref=JOHN2025&signup=true
↓
Middleware: Stores JOHN2025 in cookie
↓
Login page: Loads in signup mode with referral active
↓
User signs up → Referral applied ✅
```

### Scenario 2: Landing Page First
```
User clicks: yourapp.com/?ref=JOHN2025
↓
Middleware: Stores JOHN2025 in cookie → Redirects to signup
↓
User browses around site
↓
Cookie persists throughout session
↓
User returns to signup → Referral still active ✅
```

### Scenario 3: Cross-Page Navigation
```
User clicks: yourapp.com/login?ref=JOHN2025&signup=true
↓
User goes to landing page (explore your app)
↓
Cookie still active
↓
User returns to /login
↓
Referral automatically detected from cookie ✅
```

---

## 🔒 Security & Privacy

### Session Cookie Properties:
- **httpOnly: false** - Allows JavaScript to read it
- **secure: true (in production)** - HTTPS only
- **sameSite: 'lax'** - Protects against CSRF
- **path: '/'** - Available site-wide
- **No maxAge** - Cleared when browser closes

### Privacy-Friendly:
- ✅ Automatically cleared on browser close
- ✅ Cleared after successful signup
- ✅ No long-term tracking
- ✅ Only used for legitimate referral attribution

---

## 🧪 Testing Guide

### Test 1: Direct Signup
1. Visit: `http://localhost:3000/login?ref=TEST123&signup=true`
2. Check console: Should see "🎯 Middleware: Detected referral code"
3. Login page should be in **signup mode**
4. Sign up → Check console for referral processing

### Test 2: Landing Page Redirect
1. Visit: `http://localhost:3000/?ref=TEST123`
2. Should auto-redirect to `/login?ref=TEST123&signup=true`
3. Check cookies: Should have `pending_referral=TEST123`
4. Navigate away and back → Referral still active

### Test 3: Session Persistence
1. Click referral link
2. Open DevTools → Application → Cookies
3. Verify `pending_referral` exists with no expiry date
4. Navigate to different pages
5. Cookie should persist
6. Close browser → Cookie cleared

### Test 4: Cleanup After Signup
1. Sign up with referral code
2. Check console: Should see cookie being cleared
3. Check DevTools → Cookies: `pending_referral` should be gone
4. Check localStorage: Should be cleared

---

## 📊 Analytics Tracking

### Log Points Added:

```typescript
// Middleware
console.log('🎯 Middleware: Detected referral code:', refCode);
console.log('✅ Middleware: Stored referral code in session cookie');
console.log('🔄 Middleware: Redirecting to signup with referral code');

// Login Page
console.log('🔍 useEffect - Checking for ref parameter:', refCode);
console.log('✅ Ref parameter found in URL:', refCode);
console.log('📦 Found referral in cookie:', cookieRef);
console.log('🎯 Referral code active for session:', finalRefCode);

// After Signup
console.log('🎁 Processing referral from:', referrerId);
console.log('✅ Referral applied!');
```

---

## 🎁 Referral Link Format

### Regular User Referrals:
```
https://yourapp.com/login?ref=ABC12345&signup=true
```

### Affiliate Partner Links:
```
https://yourapp.com/login?ref=JOHN2025&signup=true
```

### Free Trial Referrals (UUID-based):
```
https://yourapp.com/login?ref=550e8400-e29b-41d4-a716-446655440000&signup=true
```

All formats now work consistently!

---

## 🚨 Troubleshooting

### Issue: Referral not being detected
**Check:**
1. Is `?ref=` in the URL?
2. Open DevTools → Application → Cookies → Check for `pending_referral`
3. Check console for middleware logs
4. Verify middleware is running (should see logs on every page load)

### Issue: Referral not applying on signup
**Check:**
1. Is the cookie present during signup?
2. Check console during signup for referral processing logs
3. Verify `/api/referral/validate` or `/api/referral/create-from-link` is being called
4. Check Supabase for `referrals` table entry

### Issue: Referral persists after signup
**Cause:** Cookie not being cleared properly

**Fix:**
```typescript
// In signup handler, add:
document.cookie = 'pending_referral=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
localStorage.removeItem('pending_referral');
```

### Issue: Cookie not visible in JavaScript
**Cause:** `httpOnly: true` in middleware

**Fix:** Already set to `false` - JavaScript can read it

---

## ✅ Summary

You now have a **bulletproof referral tracking system** that:

✅ Captures referral codes from **any page**  
✅ Persists **throughout the browsing session**  
✅ Uses **reliable session cookies**  
✅ Auto-redirects to **signup**  
✅ Cleans up after **successful signup**  
✅ Works for **all referral types** (regular, affiliate, free trial)  
✅ Privacy-friendly (**no long-term tracking**)  

---

## 🎉 Ready to Test!

Try it out:
1. Copy a referral link from your dashboard
2. Open it in an incognito window
3. Navigate around your site
4. Sign up whenever you're ready
5. Referral should be applied successfully!

**Happy referring! 🚀**

