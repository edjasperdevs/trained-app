# Phase 19: Subscriptions - Research

**Researched:** 2026-02-27
**Domain:** iOS In-App Purchase Subscriptions via RevenueCat
**Confidence:** HIGH

## Summary

This phase implements a freemium subscription model using RevenueCat SDK for iOS in-app purchases. RevenueCat abstracts StoreKit complexity, provides server-side receipt validation, and handles subscription lifecycle events. The implementation requires three layers: (1) client-side SDK integration with a subscriptionStore for state management, (2) a paywall screen with Apple-compliant legal text, and (3) a Supabase Edge Function webhook handler to sync subscription status server-side.

The project already uses Zustand persist stores (dpStore, accessStore patterns), Capacitor 7.x with native iOS entitlements, and Supabase Edge Functions with Deno. RevenueCat's Capacitor plugin v11.3.2 is pinned per STATE.md decisions. The SDK provides automatic offline caching of entitlements, eliminating the need for network calls on app restart to verify subscription status.

**Primary recommendation:** Configure RevenueCat SDK with Supabase user ID as app_user_id, create a Zustand subscriptionStore with persist middleware for local caching, and build a custom paywall screen (not RevenueCat's paywall UI) to maintain design consistency with Dopamine Noir V2 tokens.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SUB-01 | App integrates RevenueCat SDK for iOS in-app purchase subscriptions | Standard Stack section covers @revenuecat/purchases-capacitor v11.3.2 installation, Xcode entitlements, SDK configuration pattern |
| SUB-02 | User sees a paywall presenting subscription tiers (monthly and annual) | Architecture Patterns section covers Paywall screen component, getOfferings() for product data, package display |
| SUB-03 | Premium features gated behind active subscription | subscriptionStore.isPremium selector pattern, CustomerInfo.entitlements.active check |
| SUB-04 | User can restore previous purchases | restorePurchases() method documented in Standard Stack, Settings screen placement |
| SUB-05 | Subscription entitlement status persists across app restarts | Zustand persist middleware + RevenueCat's 5-minute cache refresh, no network required for cached status |
| SUB-06 | Paywall displays all Apple-required subscription transparency text | Apple Schedule 2 Section 3.8(b) requirements documented in Common Pitfalls |
| SUB-07 | User can manage subscription from Settings screen | Settings integration pattern with subscription section, managementURL from CustomerInfo |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @revenuecat/purchases-capacitor | 11.3.2 | iOS IAP SDK wrapper | Pinned in STATE.md for Capacitor 7 compatibility. Wraps StoreKit, handles receipt validation, provides webhook infrastructure |
| zustand | 4.5.2 | State management | Already used throughout app (dpStore, macroStore, authStore). persist middleware for offline-first subscription status |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @capacitor/core | ^7.5.0 | Native platform detection | isNative() check before RevenueCat operations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @revenuecat/purchases-capacitor-ui | Custom paywall | RevenueCat UI provides built-in paywalls but breaks Dopamine Noir V2 design consistency. Custom paywall allows Signal #C8FF00 branding |
| Native StoreKit | RevenueCat | StoreKit 2 requires iOS 15+, complex receipt validation, no webhook infrastructure. RevenueCat abstracts all this |

**Installation:**
```bash
npm install @revenuecat/purchases-capacitor@11.3.2
npx cap sync ios
```

**Xcode Configuration Required:**
1. Open `ios/App/App.xcworkspace` in Xcode
2. Select App target > Signing & Capabilities
3. Add "In-App Purchase" capability
4. Verify Swift Language Version is 5.0+ in Build Settings

**Entitlements Update:**
Add to `ios/App/App/App.entitlements`:
```xml
<key>com.apple.developer.in-app-payments</key>
<array>
    <string>merchant.fitness.welltrained.app</string>
</array>
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── stores/
│   └── subscriptionStore.ts     # Zustand store with isPremium, offerings, purchase actions
├── screens/
│   └── Paywall.tsx              # Full-screen paywall with legal text
├── components/
│   └── PremiumGate.tsx          # Wrapper component for premium-only content
├── lib/
│   └── revenuecat.ts            # SDK initialization and configuration helper
supabase/
└── functions/
    └── handle-revenuecat-webhook/
        └── index.ts             # Webhook handler for subscription events
```

### Pattern 1: subscriptionStore with Zustand Persist
**What:** A Zustand store that caches subscription status locally and syncs with RevenueCat on app launch
**When to use:** Always - provides offline-first subscription verification

```typescript
// src/stores/subscriptionStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Purchases, CustomerInfo, PurchasesOfferings, PurchasesPackage } from '@revenuecat/purchases-capacitor'
import { isNative } from '@/lib/platform'

interface SubscriptionStore {
  // State
  isLoading: boolean
  isPremium: boolean
  customerInfo: CustomerInfo | null
  offerings: PurchasesOfferings | null

  // Actions
  initialize: () => Promise<void>
  checkEntitlements: () => Promise<void>
  purchase: (pkg: PurchasesPackage) => Promise<{ success: boolean; error?: string }>
  restorePurchases: () => Promise<{ success: boolean; error?: string }>
}

const ENTITLEMENT_ID = 'premium' // Must match RevenueCat dashboard

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set, get) => ({
      isLoading: true,
      isPremium: false,
      customerInfo: null,
      offerings: null,

      initialize: async () => {
        if (!isNative()) {
          set({ isLoading: false })
          return
        }
        // Implementation follows SDK initialization pattern
      },

      checkEntitlements: async () => {
        if (!isNative()) return
        const { customerInfo } = await Purchases.getCustomerInfo()
        const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID]?.isActive === true
        set({ customerInfo, isPremium })
      },

      // ... purchase and restore methods
    }),
    {
      name: 'trained-subscription',
      partialize: (state) => ({ isPremium: state.isPremium }), // Only persist isPremium
    }
  )
)
```

### Pattern 2: SDK Initialization with Supabase User ID
**What:** Configure RevenueCat with Supabase auth user ID for cross-device subscription tracking
**When to use:** After user authentication completes

```typescript
// src/lib/revenuecat.ts
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor'
import { isNative } from '@/lib/platform'

const REVENUECAT_IOS_API_KEY = import.meta.env.VITE_REVENUECAT_IOS_API_KEY

export async function initializeRevenueCat(userId: string) {
  if (!isNative()) return

  await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG }) // Remove in production
  await Purchases.configure({
    apiKey: REVENUECAT_IOS_API_KEY,
    appUserID: userId, // Supabase user.id
  })
}

export async function loginToRevenueCat(userId: string) {
  if (!isNative()) return
  await Purchases.logIn({ appUserID: userId })
}

export async function logoutFromRevenueCat() {
  if (!isNative()) return
  await Purchases.logOut()
}
```

### Pattern 3: Purchase Flow with Error Handling
**What:** Complete purchase flow with proper error handling for user cancellation and failures
**When to use:** Paywall purchase buttons

```typescript
// Inside subscriptionStore
purchase: async (pkg: PurchasesPackage) => {
  if (!isNative()) return { success: false, error: 'Not available on web' }

  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg })
    const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID]?.isActive === true
    set({ customerInfo, isPremium, isLoading: false })
    return { success: isPremium }
  } catch (error: any) {
    // RevenueCat error codes
    if (error.code === 'PURCHASE_CANCELLED') {
      return { success: false } // User cancelled - no error message
    }
    return { success: false, error: error.message || 'Purchase failed' }
  }
}
```

### Pattern 4: Loading Gate for SDK Initialization
**What:** Prevent app content from rendering until subscription status is known
**When to use:** App.tsx initialization sequence

```typescript
// In App.tsx, after auth initialization
useEffect(() => {
  const initSubscriptions = async () => {
    if (user && isNative()) {
      await initializeRevenueCat(user.id)
      await useSubscriptionStore.getState().checkEntitlements()
    }
  }
  initSubscriptions()
}, [user])

// Add loading gate
const subscriptionLoading = useSubscriptionStore((s) => s.isLoading)
if (isNative() && subscriptionLoading) {
  return <LoadingScreen />
}
```

### Anti-Patterns to Avoid
- **Checking subscription on every screen:** Use the cached isPremium value from store instead
- **Blocking UI during getCustomerInfo:** Call is cached and fast; only block on initial load
- **Hardcoding product IDs in code:** Fetch from offerings; products can change without app update
- **Not handling user cancellation gracefully:** PURCHASE_CANCELLED is normal, not an error to show

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Receipt validation | Server-side StoreKit verification | RevenueCat SDK | Apple receipt validation is complex, requires server infrastructure, changes frequently |
| Subscription state sync | Custom server subscription table | RevenueCat CustomerInfo + webhooks | RevenueCat handles all edge cases (grace periods, billing retry, family sharing) |
| Product catalog | Hardcoded prices/durations | Purchases.getOfferings() | Prices vary by locale, Apple can change them, offerings are configured in RevenueCat dashboard |
| Offline entitlements | Custom offline caching | RevenueCat 5-minute cache + offline entitlements | SDK automatically verifies purchases device-side if servers unreachable |

**Key insight:** RevenueCat handles the subscription lifecycle entirely. The app only needs to: (1) display offerings, (2) call purchasePackage, (3) check entitlements.active. All receipt validation, renewal handling, and state management happens in RevenueCat.

## Common Pitfalls

### Pitfall 1: Apple Schedule 2 Section 3.8(b) Rejection
**What goes wrong:** App Store rejection for missing subscription disclosure text
**Why it happens:** Apple requires specific legal text displayed "clearly and conspicuously" during purchase flow
**How to avoid:** Include ALL required elements in Paywall:
1. Title of subscription
2. Length of subscription period
3. Price (including price per unit if applicable)
4. "Payment will be charged to iTunes Account at confirmation of purchase"
5. "Subscription automatically renews unless auto-renew is turned off at least 24-hours before the end of the current period"
6. "Account will be charged for renewal within 24-hours prior to the end of the current period at [renewal price]"
7. "Subscriptions may be managed and auto-renewal turned off in Account Settings after purchase"
8. Links to Privacy Policy and Terms of Use
9. "Any unused portion of a free trial period will be forfeited if you purchase a subscription" (if offering trials)
**Warning signs:** Paywall has no legal text section, links are not tappable

### Pitfall 2: Anonymous User ID in Webhooks
**What goes wrong:** Webhook receives `$RCAnonymousID` instead of Supabase user ID
**Why it happens:** RevenueCat was configured before user authentication, or logIn() was never called
**How to avoid:** Configure RevenueCat AFTER Supabase auth completes, pass user.id as appUserID
**Warning signs:** Webhook handler can't find user in database by app_user_id

### Pitfall 3: Stale Entitlements After Purchase
**What goes wrong:** User purchases but isPremium remains false
**Why it happens:** Store not updated after purchase completes
**How to avoid:** Always update store state from purchasePackage response's customerInfo
**Warning signs:** Purchase succeeds but premium features still locked

### Pitfall 4: Web Platform Crashes
**What goes wrong:** App crashes on web trying to call Purchases methods
**Why it happens:** RevenueCat Capacitor plugin only works in native context
**How to avoid:** Guard ALL RevenueCat calls with `if (!isNative()) return`
**Warning signs:** Uncaught errors in browser dev tools mentioning Purchases

### Pitfall 5: Missing Xcode Entitlements
**What goes wrong:** StoreKit errors during purchase, products don't load
**Why it happens:** In-App Purchase capability not added in Xcode
**How to avoid:** Add capability before testing; run `npx cap sync ios` after
**Warning signs:** Empty offerings, SKErrorDomain errors

## Code Examples

### Paywall Screen with Legal Text
```typescript
// src/screens/Paywall.tsx
import { useNavigate } from 'react-router-dom'
import { useSubscriptionStore } from '@/stores'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/format'

export function Paywall() {
  const navigate = useNavigate()
  const offerings = useSubscriptionStore((s) => s.offerings)
  const purchase = useSubscriptionStore((s) => s.purchase)
  const isPremium = useSubscriptionStore((s) => s.isPremium)
  const [loading, setLoading] = useState(false)

  // Redirect if already premium
  useEffect(() => {
    if (isPremium) navigate('/')
  }, [isPremium])

  const monthly = offerings?.current?.monthly
  const annual = offerings?.current?.annual

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setLoading(true)
    const { success, error } = await purchase(pkg)
    setLoading(false)
    if (success) {
      navigate('/')
    } else if (error) {
      toast.error(error)
    }
  }

  return (
    <div className="min-h-screen bg-background p-5">
      <h1 className="text-2xl font-bold mb-6">Unlock Premium</h1>

      {/* Subscription Options */}
      <div className="space-y-3 mb-6">
        {monthly && (
          <Button onClick={() => handlePurchase(monthly)} disabled={loading}>
            Monthly - {monthly.product.priceString}/month
          </Button>
        )}
        {annual && (
          <Button onClick={() => handlePurchase(annual)} disabled={loading}>
            Annual - {annual.product.priceString}/year
          </Button>
        )}
      </div>

      {/* Apple-Required Legal Text - SUB-06 */}
      <div className="text-xs text-muted-foreground space-y-2">
        <p>
          Payment will be charged to your iTunes Account at confirmation of purchase.
        </p>
        <p>
          Subscription automatically renews unless auto-renew is turned off at least
          24-hours before the end of the current period.
        </p>
        <p>
          Account will be charged for renewal within 24-hours prior to the end of
          the current period.
        </p>
        <p>
          Subscriptions may be managed and auto-renewal may be turned off by going
          to your Account Settings after purchase.
        </p>
        <div className="flex gap-4 mt-4">
          <button onClick={() => navigate('/privacy')} className="text-primary">
            Privacy Policy
          </button>
          <button onClick={() => navigate('/terms')} className="text-primary">
            Terms of Use
          </button>
        </div>
      </div>

      {/* Restore Purchases */}
      <button
        onClick={() => useSubscriptionStore.getState().restorePurchases()}
        className="mt-6 text-sm text-primary"
      >
        Restore Purchases
      </button>
    </div>
  )
}
```

### Webhook Handler Edge Function
```typescript
// supabase/functions/handle-revenuecat-webhook/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const REVENUECAT_WEBHOOK_SECRET = Deno.env.get('REVENUECAT_WEBHOOK_SECRET')!

interface RevenueCatEvent {
  event: {
    type: string
    app_user_id: string
    entitlement_ids: string[]
    product_id: string
    expiration_at_ms: number
    environment: 'SANDBOX' | 'PRODUCTION'
  }
}

Deno.serve(async (req) => {
  // Verify authorization header
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${REVENUECAT_WEBHOOK_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const payload: RevenueCatEvent = await req.json()
    const { type, app_user_id, entitlement_ids, expiration_at_ms, environment } = payload.event

    // Skip sandbox events in production
    if (environment === 'SANDBOX' && Deno.env.get('DENO_DEPLOYMENT_ID')) {
      return new Response(JSON.stringify({ skipped: 'sandbox' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Upsert subscription record
    const { error } = await supabase.from('subscriptions').upsert({
      user_id: app_user_id,
      event_type: type,
      entitlements: entitlement_ids,
      expires_at: expiration_at_ms ? new Date(expiration_at_ms).toISOString() : null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id'
    })

    if (error) {
      console.error('Database error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

### Migration: subscriptions Table
```sql
-- supabase/migrations/012_subscriptions.sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION, etc.
  entitlements TEXT[] NOT NULL DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS: Users can read their own subscription
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert/update (webhook handler)
CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Index for user lookups
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| StoreKit 1 | StoreKit 2 | iOS 15 (2021) | RevenueCat abstracts this; no direct impact |
| Manual receipt validation | RevenueCat server-side | Ongoing | Eliminates server-side StoreKit code |
| cordova-plugin-purchases | @revenuecat/purchases-capacitor | 2023 | Official Capacitor support with TypeScript types |

**Deprecated/outdated:**
- cordova-plugin-purchases: Replaced by @revenuecat/purchases-capacitor
- Manual StoreKit integration: Use RevenueCat unless specific Apple-only requirements exist

## Open Questions

1. **RevenueCat Dashboard Configuration**
   - What we know: SDK configuration happens in code
   - What's unclear: App Store Connect products, RevenueCat entitlements, offerings must be configured in dashboards before SDK works
   - Recommendation: Document dashboard setup as prerequisite; add link to RevenueCat quickstart in plan tasks

2. **Terms of Use Screen**
   - What we know: Apple requires Terms of Use link on paywall
   - What's unclear: Does app have Terms of Use screen or is Privacy.tsx sufficient?
   - Recommendation: Create Terms.tsx screen if not exists, or combine with Privacy

## Sources

### Primary (HIGH confidence)
- [RevenueCat Capacitor Installation](https://www.revenuecat.com/docs/getting-started/installation/capacitor) - SDK setup, configuration, Swift requirements
- [RevenueCat CustomerInfo](https://www.revenuecat.com/docs/customers/customer-info) - Entitlement checking, offline caching
- [RevenueCat Webhooks](https://www.revenuecat.com/docs/integrations/webhooks) - Event types, payload structure, authentication
- [RevenueCat Making Purchases](https://www.revenuecat.com/docs/getting-started/making-purchases) - Purchase flow, error handling

### Secondary (MEDIUM confidence)
- [Apple Schedule 2 Section 3.8(b) Compliance](https://www.revenuecat.com/blog/engineering/schedule-2-section-3-8-b/) - Legal text requirements
- [GitHub RevenueCat/purchases-capacitor](https://github.com/RevenueCat/purchases-capacitor) - Source code, releases, version info

### Tertiary (LOW confidence)
- RevenueCat Community discussions on Supabase integration - Implementation patterns, not official

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - RevenueCat is industry standard, version pinned in STATE.md
- Architecture: HIGH - Follows existing Zustand patterns in codebase (dpStore, accessStore)
- Pitfalls: HIGH - Apple requirements well-documented, common rejection reasons known

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (30 days - RevenueCat SDK is stable)
