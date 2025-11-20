# 🚀 Session-Wide Referral Tracking - Quick Start

## What's New?

Your referral links now **stay active for the entire browsing session**!

### Before vs After

**Before:**
- Link: `yourapp.com/?ref=CODE` 
- Only worked on signup page
- Lost if user navigated away

**After:**
- Link: `yourapp.com/login?ref=CODE&signup=true`
- ✅ Works on ANY page they visit
- ✅ Stays active until browser closes
- ✅ Goes straight to signup
- ✅ Still active if they browse around

---

## How To Use

### 1. Share Your Referral Link

Get your link from:
- **Dashboard → Settings → Referrals** (regular users)
- **Dashboard → Settings → Affiliate** (affiliate partners)

Your link looks like:
```
https://yourapp.com/login?ref=YOURCODE&signup=true
```

### 2. What Happens When Someone Clicks

```
User clicks link
↓
Stored in browser cookie (entire session)
↓
Taken to signup page
↓
User can navigate around site
↓
Referral stays active!
↓
When they signup → You get credit ✅
```

---

## Key Features

### ✨ Session-Wide Tracking
- Referral saved in browser cookie
- Persists across all pages
- Clears when browser closes
- Privacy-friendly!

### 🎯 Auto-Redirect to Signup
- Direct link to signup form
- Referral code pre-loaded
- Shows "You're invited!" badge
- Auto-fills referral field

### 🔄 Cross-Page Navigation
- User can browse landing page? ✅ Still tracked
- Check pricing? ✅ Still tracked
- Read documentation? ✅ Still tracked
- Come back to signup? ✅ Referral applied!

---

## Testing Your Links

### Quick Test:
1. **Copy your referral link**
2. **Open incognito window** (to simulate new user)
3. **Paste the link** and press Enter
4. **Should land on signup page** with referral active
5. **Navigate to home page** (test browsing)
6. **Return to signup** → Referral should still be there!

### Check Console:
Open Developer Tools (F12) and look for:
```
🎯 Middleware: Detected referral code: YOURCODE
✅ Middleware: Stored referral code in session cookie
🎯 Referral code active for session: YOURCODE
```

---

## All Referral Types Supported

### Regular Referrals (Earn $200)
```
/login?ref=ABC12345&signup=true
```

### Affiliate Links (Earn $99.80/mo)
```
/login?ref=JOHN2025&signup=true
```

### Free Trial Referrals
```
/login?ref=550e8400-e29b-41d4-a716-446655440000&signup=true
```

All work the same way!

---

## FAQ

### Q: How long does the referral stay active?
**A:** Until they close the browser or complete signup.

### Q: What if they bookmark a page and come back later?
**A:** Cookie is cleared when browser closes, so they'd need to click the referral link again.

### Q: Can they clear the referral before signing up?
**A:** Yes, by clearing cookies or using incognito mode. But most users won't do this.

### Q: Do I still get credit if they navigate away and come back?
**A:** Yes! As long as they don't close the browser, the referral stays active.

### Q: What if they visit the landing page first?
**A:** The middleware automatically redirects them to signup with the referral code.

---

## For Developers

### Files Changed:
- ✅ `middleware.ts` - Captures referral codes site-wide
- ✅ `app/login/page.tsx` - Reads from cookies + localStorage
- ✅ `app/api/referral/get-code/route.ts` - Updated link format
- ✅ `app/api/referral/create-code/route.ts` - Updated link format
- ✅ `components/affiliate-earnings-client.tsx` - Updated link format
- ✅ `app/admin/affiliate-program/page.tsx` - Updated preview

### Cookie Details:
```typescript
{
  name: 'pending_referral',
  httpOnly: false,  // JavaScript can read
  secure: true,     // HTTPS only (production)
  sameSite: 'lax',  // CSRF protection
  path: '/',        // Site-wide
  // No maxAge = session cookie
}
```

---

## 🎉 That's It!

Your referral system now works exactly how you wanted:

1. ✅ **Click referral link** → Goes to signup
2. ✅ **Navigate around** → Still active
3. ✅ **Sign up whenever** → Referral applied

No more lost referrals! 🚀

---

## Need Help?

Check the full documentation:
- `SESSION_WIDE_REFERRAL_TRACKING.md` - Complete technical guide
- `REFERRAL_SYSTEM_GUIDE.md` - Original referral system docs
- `COMPLETE_AFFILIATE_SYSTEM_GUIDE.md` - Affiliate program details

**Happy referring!** 🎁

