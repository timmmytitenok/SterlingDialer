# Billing Pages Structure - Documentation

## 📁 **URL Structure**

The billing section is now split into two separate pages for better user experience and easier navigation:

### 1. **Billing Management Page**
- **URL:** `/dashboard/settings/billing`
- **Purpose:** Manage subscription, view invoices, update payment methods
- **Access:** Available for users with active subscriptions

### 2. **Call Balance Page**
- **URL:** `/dashboard/settings/billing/callbalance`
- **Purpose:** Manage call balance, auto-refill settings, and manual top-ups
- **Access:** Available for all users (with or without active subscriptions)

---

## 🧭 **Navigation Between Pages**

Both pages feature a shared tab navigation bar at the top:

```
┌─────────────────────────────────────────────────────┐
│  [Billing Management]    [Call Balance]            │
│   (Active on /billing)   (Active on /callbalance)  │
└─────────────────────────────────────────────────────┘
```

### Tab Styling:
- **Active Tab:** Gradient background with shadow glow
  - Billing: Blue/Indigo/Purple gradient
  - Call Balance: Green/Emerald/Teal gradient
- **Inactive Tab:** Gray with hover effects

---

## 📄 **Page Details**

### `/dashboard/settings/billing`

**File:** `app/dashboard/settings/billing/page.tsx`

**Content:**
1. **Subscription Success Handler** - Handles post-checkout redirects
2. **Tab Navigation** - Links to Billing Management and Call Balance
3. **Content:**
   - If no subscription: Shows `SubscriptionTierSelector` for plan selection
   - If has subscription: Shows `BillingManagementContent` with:
     - Current subscription details
     - Stripe billing portal link
     - "Upgrade Plan" button (toggles to show plan selector)

**Components Used:**
- `SubscriptionSuccessHandler`
- `BillingManagementContent` (client component)
- `SubscriptionTierSelector`

---

### `/dashboard/settings/billing/callbalance`

**File:** `app/dashboard/settings/billing/callbalance/page.tsx`

**Content:**
1. **Tab Navigation** - Links to Billing Management and Call Balance
2. **Call Balance Card:**
   - Current balance display
   - Auto-refill toggle and settings
   - Manual top-up options ($50, $100, or $200)
   - Transaction history

**Components Used:**
- `CallBalanceCard`

---

## 🔗 **Redirects & Links**

### Internal Redirects

| Source | Destination | Reason |
|--------|-------------|--------|
| AI Control Center (Low Balance Warning) | `/dashboard/settings/billing/callbalance` | User needs to add funds |
| Subscription Success | `/dashboard/settings/billing?success=true` | After successful checkout |
| Auto-refill checkout success | `/dashboard/settings/billing/callbalance?success=true` | After balance refill |

### External Links
- **Manage Billing (Stripe Portal):** Opens Stripe Customer Portal
- **View Plans:** Stays on `/dashboard/settings/billing` but toggles to plan selector

---

## 🎨 **User Flows**

### Flow 1: User Needs to Add Funds
```
1. User clicks "Launch AI Agent"
   ↓
2. Balance < $10 → Low Balance Warning appears
   ↓
3. User clicks "Add Funds Now"
   ↓
4. Redirected to `/dashboard/settings/billing/callbalance` ✅
   ↓
5. User adds funds or enables auto-refill
```

### Flow 2: User Wants to Upgrade Subscription
```
1. User goes to `/dashboard/settings/billing`
   ↓
2. Clicks "Upgrade Plan" button
   ↓
3. Plan selector appears (client-side toggle)
   ↓
4. User selects new tier → Checkout
   ↓
5. After payment, redirected to `/dashboard/settings/billing?success=true`
```

### Flow 3: User Wants to Manage Payment Methods
```
1. User goes to `/dashboard/settings/billing`
   ↓
2. Clicks "Manage Billing" button
   ↓
3. Opens Stripe Customer Portal (external)
   ↓
4. User updates payment methods, views invoices, etc.
```

---

## 📂 **File Structure**

```
app/dashboard/settings/billing/
├── page.tsx                          # Main billing page
└── callbalance/
    └── page.tsx                      # Call balance page

components/
├── billing-management-content.tsx    # Client component for billing page
├── call-balance-card.tsx             # Call balance UI and logic
├── stripe-billing.tsx                # Stripe portal integration
├── subscription-tier-selector.tsx    # Plan selection UI
└── subscription-success-handler.tsx  # Post-checkout handler
```

---

## 🛠️ **Implementation Notes**

### Why Separate URLs?

1. **Easier Redirects**
   - Can link directly to Call Balance page: `/dashboard/settings/billing/callbalance`
   - No need for URL fragments or query parameters like `?tab=balance`

2. **Better UX**
   - Clear, dedicated pages for different purposes
   - Users can bookmark specific sections
   - Browser back button works as expected

3. **Reduced Friction**
   - Low balance warnings can direct users exactly where they need to go
   - Fewer clicks to get to call balance management

### Tab Navigation Implementation

Instead of client-side state (`useState` for active tab), we use Next.js `Link` components:

```tsx
<Link href="/dashboard/settings/billing">
  Billing Management
</Link>

<Link href="/dashboard/settings/billing/callbalance">
  Call Balance
</Link>
```

**Benefits:**
- Server-side routing (faster)
- Proper URL updates
- Browser history support
- SEO-friendly

---

## 🔐 **Access Control**

Both pages require authentication:
```typescript
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  redirect('/login');
}
```

---

## 🎯 **Future Enhancements**

1. **Breadcrumb Navigation**
   - Show "Settings > Billing > [Current Page]"

2. **Quick Actions**
   - Add "Quick Top-Up" button in navigation bar
   - Show balance indicator in navigation

3. **Mobile Optimization**
   - Stack tabs vertically on small screens
   - Simplify navigation for mobile users

4. **Analytics**
   - Track which page users visit more
   - Monitor conversion from Call Balance page

---

## 📚 **Related Documentation**
- [Balance Check Before Launch](./BALANCE_CHECK_BEFORE_LAUNCH.md)
- [Call Balance System Guide](./CALL_BALANCE_SYSTEM_GUIDE.md)
- [Auto-Refill Testing Guide](./AUTO_REFILL_TESTING_GUIDE.md)

