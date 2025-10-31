# Custom Referral Codes - User Guide

## Overview
Users can now create their own custom referral codes instead of having randomly generated ones. This makes codes more memorable and personal!

## Features

### 🎨 Custom Code Creation
- Users choose their own 8-character code
- Only letters (A-Z) and numbers (0-9) allowed
- No symbols or special characters
- Case-insensitive (automatically converted to uppercase)
- Must be unique across the platform

### 💎 Benefits Displayed
- **Free to Join** - No cost to participate
- **$200 Per Referral** - When friends subscribe
- **Unlimited Earnings** - No cap on referrals

### ✅ Validation Rules
1. **Exactly 8 characters** - Not more, not less
2. **Alphanumeric only** - Letters A-Z and numbers 0-9
3. **No symbols** - No spaces, dashes, or special characters
4. **Unique** - Code must not be already taken
5. **One code per user** - Users can only create one code

## User Flow

### First Visit to Referrals Page
1. User sees "Join Our Referral Program" screen
2. Three benefit cards display:
   - 🎉 Free to Join
   - 💰 $200 Per Referral
   - 🚀 Unlimited Earnings
3. Input field for custom code (with live validation)
4. Character counter shows progress (X/8)
5. "How It Works" section explains the process

### Creating a Code
1. User types their desired code (e.g., "MYCODE24")
2. Input automatically:
   - Converts to uppercase
   - Strips invalid characters
   - Limits to 8 characters
3. Character counter turns green when 8 characters reached
4. User clicks "Create My Referral Code"
5. API validates uniqueness
6. If successful, user sees their referral dashboard
7. If taken, error message: "This code is already taken. Please choose another one."

### After Code Creation
User sees the full referral dashboard with:
- Their custom code (displayed prominently)
- Shareable referral link
- Copy/Share buttons
- Referral stats (total, credits earned, pending)
- List of referrals (if any)

## API Endpoints

### POST `/api/referral/create-code`
Creates a custom referral code for the user.

**Request Body:**
```json
{
  "code": "MYCODE24"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "code": "MYCODE24",
  "link": "https://yourapp.com/signup?ref=MYCODE24"
}
```

**Error Responses:**

400 - Invalid format:
```json
{
  "error": "Code must be exactly 8 characters"
}
```

400 - Already has code:
```json
{
  "error": "You already have a referral code",
  "code": "EXISTING1"
}
```

409 - Code taken:
```json
{
  "error": "This code is already taken. Please choose another one."
}
```

### GET `/api/referral/get-code`
Fetches user's referral code (if exists).

**Success Response (200) - Has Code:**
```json
{
  "hasCode": true,
  "code": "MYCODE24",
  "link": "https://yourapp.com/signup?ref=MYCODE24"
}
```

**Success Response (200) - No Code Yet:**
```json
{
  "hasCode": false,
  "code": null,
  "link": null
}
```

## Database Changes

### Migration Required
Run this SQL in Supabase:

```sql
-- Remove automatic code generation
DROP TRIGGER IF EXISTS create_referral_code_trigger ON profiles;
DROP FUNCTION IF EXISTS create_referral_code_for_user();
DROP FUNCTION IF EXISTS generate_referral_code();
```

### Schema Notes
- `referral_codes` table structure unchanged
- `code` field remains VARCHAR(12) (supports up to 12 chars, we enforce 8)
- `UNIQUE` constraint on `code` ensures no duplicates
- `UNIQUE` constraint on `user_id` ensures one code per user

## UX Improvements

### Input Field Features
- **Real-time validation**: Invalid characters stripped immediately
- **Character counter**: Visual feedback on progress
- **Auto-uppercase**: Consistent formatting
- **Clear placeholder**: "MYCODE24" shows example
- **Helper text**: "Only letters & numbers" reminder
- **Visual feedback**: Border changes color on focus

### Error Handling
- Client-side validation before API call
- Server-side validation for security
- Clear, actionable error messages
- No crash on duplicate codes
- Graceful handling of edge cases

### Loading States
- Loading spinner while fetching existing code
- "Creating..." state with spinner on button
- Disabled button while creating
- Prevents double-submission

## Testing Checklist

### Happy Path
- [ ] Visit referrals page (no code) → See join screen
- [ ] Enter valid 8-char code → Success
- [ ] See referral dashboard with custom code
- [ ] Copy code → Works
- [ ] Share link → Works

### Validation Tests
- [ ] Enter 7 chars → Error: "Must be exactly 8 characters"
- [ ] Enter 9 chars → Input stops at 8
- [ ] Enter symbols → Stripped automatically
- [ ] Enter spaces → Stripped automatically
- [ ] Enter lowercase → Converts to uppercase
- [ ] Submit empty → Button disabled
- [ ] Submit 7 chars → Button disabled

### Edge Cases
- [ ] Try duplicate code → Clear error message
- [ ] User with existing code → Can't create another
- [ ] Network error → Shows error, can retry
- [ ] Navigate away mid-creation → No duplicate code created
- [ ] Refresh page after creation → See dashboard (not join screen)

## Example Codes

### Good Codes (Valid)
- `MYCODE24`
- `STERLING`
- `JOHN2024`
- `REFER123`
- `AWESOME8`
- `12345678`
- `ABCD1234`

### Bad Codes (Invalid)
- `TOOSHORT` ❌ (Only 8 chars, but this is 8... actually valid!)
- `TOOLONG99` ❌ (9 characters)
- `MY-CODE1` ❌ (Contains dash)
- `MY_CODE1` ❌ (Contains underscore)
- `MYCODE!1` ❌ (Contains exclamation)
- `MY CODE1` ❌ (Contains space)

## Migration for Existing Users

If you have existing users with auto-generated codes:

### Option 1: Keep Existing Codes
- Do nothing
- Existing codes continue working
- New users create custom codes
- Existing users keep their random codes

### Option 2: Let Users Recreate
Run this SQL to allow recreation:
```sql
-- WARNING: This deletes all existing referral codes
-- Back up data first!
DELETE FROM referral_codes;
```

Then all users will see the join screen and can create custom codes.

### Option 3: Hybrid Approach
- Keep existing random codes
- Add a "Change My Code" feature (future enhancement)
- Let users replace their random code with a custom one

## Future Enhancements

### Potential Features
1. **Code Preview** - Show how the link will look before creating
2. **Suggested Codes** - Offer suggestions based on user's name
3. **Code History** - Track code changes (if allowing updates)
4. **Vanity URLs** - `yourapp.com/join/MYCODE24`
5. **QR Code** - Generate QR code for physical sharing
6. **Analytics** - Track which sharing method performs best
7. **Code Change** - Allow users to change code once per month

## Support

### Common Issues

**Q: I see "Loading..." forever**
- Check browser console for errors
- Verify API endpoints are accessible
- Check network tab for failed requests

**Q: Code is taken but I want it**
- Codes are first-come-first-served
- Try variations: MYCODE24 → MYCODE25
- Add numbers or letters to make unique

**Q: Can I change my code later?**
- Currently: No
- Future: Maybe (needs implementation)
- Choose carefully!

**Q: My code disappeared**
- Codes are permanent once created
- Check you're logged into correct account
- Contact support if issue persists

## Analytics & Monitoring

### Track These Metrics
- Code creation success rate
- Most common code patterns
- Average time to create code
- Duplicate code attempts
- Error rate by type
- User drop-off at join screen

### Logs to Monitor
```
✅ Successfully created code: MYCODE24
⚠️ Code already taken: MYCODE24
❌ Invalid format: MY-CODE
📊 User has existing code: EXISTING1
```

## Security Considerations

### Implemented
- ✅ Server-side validation (not just client)
- ✅ SQL injection prevention (parameterized queries)
- ✅ Rate limiting (via API)
- ✅ Authentication required
- ✅ Unique constraint on codes
- ✅ Case-insensitive checking (uppercase)

### Future Enhancements
- Rate limiting per user (prevent spam attempts)
- Profanity filter for codes
- Reserved words blacklist
- Length-based pricing (premium short codes?)

---

**Remember:** The best referral code is one that's memorable and represents the user! 🚀

