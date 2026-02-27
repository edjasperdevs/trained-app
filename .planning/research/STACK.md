# Technology Stack: V2 New Feature Additions

**Project:** WellTrained V2 -- RevenueCat, HealthKit, Design System, Gamification Engine
**Researched:** 2026-02-27
**Scope:** NEW dependencies and changes only. Existing stack (React 18, Vite 5, Tailwind v4, Zustand, Supabase, Capacitor 7.5) is validated and NOT re-researched.

---

## Recommended Stack Additions

### 1. RevenueCat iOS IAP Subscriptions

| Technology | Version | Purpose | Why |
|---|---|---|---|
| `@revenuecat/purchases-capacitor` | ^11.3.2 | StoreKit wrapper, subscription lifecycle, entitlement checks | Official RevenueCat Capacitor plugin. Handles StoreKit 2 receipt validation, subscription status, restore purchases. Eliminates writing raw StoreKit code. |
| `@revenuecat/purchases-capacitor-ui` | ^11.3.2 | Pre-built paywall UI components | Native paywall presentation (offering selection, purchase flow, restore). Saves building paywall from scratch. Can be customized in RevenueCat dashboard. |

**Version rationale:** 11.3.2 is the latest version that supports `@capacitor/core >=7.0.0`. The 12.x line requires Capacitor 8+, which the project cannot use yet (macOS Sonoma constraint documented in prior research). When the project migrates to Capacitor 8 before the April 2026 deadline, RevenueCat can be bumped to 12.x at the same time.

**Confidence: HIGH** -- Versions and peer dependencies verified via `npm view` on 2026-02-27. 11.3.2 published 2025-12-xx with `peerDependencies: { '@capacitor/core': '>=7.0.0' }`. UI plugin 11.3.2 has `peerDependencies: { '@capacitor/core': '^7.0.0' }`.

**Integration with existing stack:**

- **Supabase auth:** Call `Purchases.configure({ apiKey, appUserID: supabaseUserId })` after Supabase login. Using Supabase user ID as the RevenueCat `appUserID` links purchases to the existing user identity -- no new user system needed.
- **Supabase Edge Function (webhook):** Create a `handle-revenuecat-webhook` Edge Function that receives RevenueCat webhook events (INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION) and updates a `subscription_status` column in the Supabase `profiles` table. This is the server-side source of truth for premium status.
- **Client-side check:** `Purchases.getCustomerInfo()` returns entitlements. Check `customerInfo.entitlements.active['premium']?.isActive` for gating premium features. Cache the result in a Zustand `subscriptionStore` for synchronous UI reads.
- **No web payments:** RevenueCat only works on native (Capacitor). The PWA web version will check premium status from Supabase directly (set by webhook). Subscriptions can only be purchased in the iOS app.

**Key API surface:**

```typescript
import { Purchases } from '@revenuecat/purchases-capacitor';

// Init (after Supabase auth)
await Purchases.configure({ apiKey: 'appl_xxx', appUserID: userId });

// Get offerings (products configured in RevenueCat dashboard)
const { offerings } = await Purchases.getOfferings();
const monthly = offerings.current?.monthly;
const annual = offerings.current?.annual;

// Purchase
const { customerInfo } = await Purchases.purchasePackage({ aPackage: monthly });

// Check entitlement
const isPremium = customerInfo.entitlements.active['premium']?.isActive === true;

// Restore
const { customerInfo: restored } = await Purchases.restorePurchases();
```

**RevenueCat dashboard setup required:**
- Create project with iOS App Store app
- Configure products (monthly, annual subscriptions)
- Create "premium" entitlement
- Create default offering with monthly + annual packages
- Set webhook URL to Supabase Edge Function endpoint
- Set webhook authorization header secret

---

### 2. HealthKit Integration (Steps + Sleep)

| Technology | Version | Purpose | Why |
|---|---|---|---|
| `@capgo/capacitor-health` | ^7.2.15 | HealthKit data access (steps, sleep) | Only actively maintained Capacitor 7-compatible HealthKit plugin. Unified API for steps and sleep. Published 2026-02-23 (4 days ago). Supports `readSamples` with data type filtering. |

**Why this plugin over alternatives:**

| Plugin | Capacitor 7 Support | Last Published | Steps | Sleep | Verdict |
|---|---|---|---|---|---|
| `@capgo/capacitor-health` | YES (7.2.15) | 2026-02-23 | YES | YES | **USE THIS** |
| `@perfood/capacitor-healthkit` | NO (stuck on Cap 4) | 2025-02-13 | YES | YES | Dead. Alpha for Cap 5 abandoned in 2023. |
| `capacitor-healthkit` (community) | Unclear | Old | YES | Partial | Unmaintained fork. |
| `capacitor-health-extended` | Partial | Unknown | YES | YES | Fork of Capgo, less adoption. |

**Confidence: MEDIUM** -- Plugin version and peer deps verified via npm. API surface verified from GitHub README and Capgo docs. However, this is a community plugin (not official Capacitor team), so real-world behavior for sleep data granularity should be validated during implementation. The plugin is actively maintained with 35+ releases on the 7.x line.

**Integration with existing stack:**

- **Permission flow:** Call `requestAuthorization({ readPermissions: ['steps', 'sleep'] })` during onboarding or when user first accesses health features. HealthKit permissions are iOS-only and prompt a native permission dialog.
- **Steps query:** `readSamples({ dataType: 'steps', startDate, endDate, limit: 1 })` to get daily step count. Query once per foreground resume via existing `@capacitor/app` lifecycle listener.
- **Sleep query:** `readSamples({ dataType: 'sleep', startDate, endDate })` returns sleep state samples (asleep, awake, rem, deep, light). Aggregate total sleep hours from `asleep` + `rem` + `deep` + `light` states.
- **Manual fallback:** The spec requires manual entry as a fallback when HealthKit is unavailable (web/PWA, permission denied, no data). The `healthStore` in Zustand should always support manual number input alongside HealthKit reads.
- **Zustand store:** New `healthStore` with `{ todaySteps, todaySleepHours, source: 'healthkit' | 'manual', lastFetched }`. Auto-populate from HealthKit on app foreground; allow manual override.
- **Capacitor.isNativePlatform():** Gate all HealthKit calls behind platform check. On web, only manual entry is available.

**Key API surface:**

```typescript
import { CapacitorHealth } from '@capgo/capacitor-health';

// Request permission
await CapacitorHealth.requestAuthorization({
  readPermissions: ['steps', 'sleep'],
  writePermissions: [],
});

// Read today's steps
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const { samples } = await CapacitorHealth.readSamples({
  dataType: 'steps',
  startDate: yesterday.toISOString(),
  endDate: new Date().toISOString(),
  limit: 100,
});
const totalSteps = samples.reduce((sum, s) => sum + s.value, 0);

// Read last night's sleep
const { samples: sleepSamples } = await CapacitorHealth.readSamples({
  dataType: 'sleep',
  startDate: yesterday.toISOString(),
  endDate: new Date().toISOString(),
});
```

**iOS Xcode configuration required:**
- Add HealthKit capability in Xcode project settings
- Add `NSHealthShareUsageDescription` to Info.plist ("WellTrained reads your steps and sleep to award Discipline Points")
- Add HealthKit to the app's entitlements file
- Add HealthKit to Apple privacy manifest (PrivacyInfo.xcprivacy already exists from v1.5)

---

### 3. Design System Migration (Dopamine Noir V2)

**No new dependencies needed.** The design system migration is a CSS custom property update within the existing Tailwind v4 + shadcn/ui + CVA stack.

| What Changes | From (V1) | To (V2) | How |
|---|---|---|---|
| Signal/primary color | `#D55550` (red) | `#C8FF00` (lime) | Update `--primary` and all `--color-*-primary` tokens in `index.css` |
| Surface color | `#141414` | `#26282B` | Update `--card`, `--color-surface`, `--color-bg-secondary` |
| Border color | `#2A2A2A` | `#26282B` (same as surface) | Update `--border`, `--color-glass-border` |
| Foreground text | `#E8E8E8` | `#FAFAFA` | Update `--foreground`, `--color-text-primary` |
| Muted text | `#888888` | `#A1A1AA` | Update `--muted-foreground`, `--color-text-secondary` |
| Destructive | `#D55550` | `#B91C1C` | Update `--destructive` |
| Glow effects | Red glow `rgba(213,85,80,...)` | Lime glow `rgba(200,255,0,...)` | Update `--shadow-glow`, `--shadow-glow-intense` |
| XP bar token names | `--color-xp-bar` | `--color-dp-bar` | Rename to match DP terminology |
| Streak token names | `--color-streak-active` | `--color-streak-active` | Keep name, change value to lime |

**Architecture note:** The existing index.css already has a clean two-layer token system (`:root` for shadcn variables, `@theme` block for custom Tailwind utilities). The V2 migration is a find-and-replace of color values plus renaming XP-specific tokens to DP. No structural changes to the CSS architecture.

**What to explicitly NOT add:**
- No `next-themes` changes -- the app is dark-only. The existing `@custom-variant dark` in CSS stays as-is.
- No new font dependencies -- Oswald, Inter, JetBrains Mono all carry forward from V1.
- No CSS-in-JS library -- Tailwind v4 CSS-first approach handles everything.

**Confidence: HIGH** -- The existing `index.css` was reviewed and the color token system is well-structured for this migration. Tailwind v4's `@theme` block supports the exact same pattern with new values.

---

### 4. Gamification Engine (DP/Ranks/Archetypes)

**No new external dependencies needed.** The gamification engine is pure TypeScript business logic in Zustand stores.

**Existing store that gets replaced:** `src/stores/xpStore.ts` (305 lines) contains the current XP/level system with 99 levels, weekly claiming, and progressive XP curve. This entire store gets rewritten as a `dpStore` with the new 15-rank system.

**New Zustand stores needed (all using existing `zustand` + `persist` pattern):**

| Store | Purpose | Replaces |
|---|---|---|
| `dpStore.ts` | Discipline Points accumulation, 15-rank progression, rank-up detection | `xpStore.ts` (full rewrite) |
| `archetypeStore.ts` | Archetype selection (Bro/Himbo/Brute/Pup/Bull), DP modifier calculations | New (no equivalent in V1) |
| `healthStore.ts` | Steps + sleep data from HealthKit or manual input | New (no equivalent in V1) |
| `subscriptionStore.ts` | Premium status cache from RevenueCat, feature gating | New (no equivalent in V1) |
| `questStore.ts` | Protocol Orders (daily/weekly quests), completion tracking | New (no equivalent in V1) |

**Stores that get modified:**

| Store | Change |
|---|---|
| `avatarStore.ts` | Replace mood-based avatar with 5-stage evolving silhouette tied to rank milestones |
| `achievementsStore.ts` | Potentially merge into DP system or keep as complementary badges |
| `userStore.ts` | Add archetype selection, remove old XP references |
| `workoutStore.ts` | Add DP awarding on workout completion, PR detection for Bull archetype |
| `macroStore.ts` | Add DP awarding on meal tracking + protein target hit |

**Key gamification math (from spec, implemented in pure TS):**

```typescript
// DP earning with archetype modifiers
const BASE_DP = {
  TRAINING: 50,
  TRACKED_MEALS: 15,
  STEPS_10K: 10,
  HIT_PROTEIN: 25,
  SLEEP_7H: 10,
} as const;

// Rank thresholds (cumulative DP)
const RANK_THRESHOLDS = [
  0, 250, 750, 1500, 2250, 3000, 3750, 4750,
  5750, 6750, 7750, 9000, 10250, 11500, 13000, 14750
];

// Archetype bonuses (premium-gated except Bro)
type Archetype = 'bro' | 'himbo' | 'brute' | 'pup' | 'bull';
```

**No external gamification library needed** -- the spec defines a straightforward points/ranks/modifiers system. Adding a game engine or gamification SDK would be overkill. The logic is ~200-300 lines of TypeScript.

**Confidence: HIGH** -- The existing `xpStore.ts` pattern proves this architecture works. The V2 system is structurally similar (accumulate points, calculate rank from thresholds) with added archetype modifiers.

---

### 5. Supabase Schema Additions

**No new Supabase client dependencies** -- existing `@supabase/supabase-js ^2.93.3` handles everything.

**New Edge Function:**

| Function | Purpose | Trigger |
|---|---|---|
| `handle-revenuecat-webhook` | Process subscription events, update premium status | RevenueCat webhook POST |

**New database migrations needed:**

| Migration | Tables/Columns | Purpose |
|---|---|---|
| `012_dp_system.sql` | `dp_logs` table, `profiles.total_dp`, `profiles.current_rank` | Server-side DP tracking for leaderboards and coach visibility |
| `013_archetypes.sql` | `profiles.archetype` column | Persist archetype selection |
| `014_subscriptions.sql` | `profiles.subscription_status`, `profiles.subscription_expires_at` | Server-side premium status (set by webhook) |
| `015_health_data.sql` | `health_logs` table (date, steps, sleep_hours, source) | Optional server sync of daily health data |
| `016_quests.sql` | `quest_definitions`, `quest_completions` tables | Protocol Orders system |

**RLS consideration:** Subscription status column on profiles should be read-only for the user (only the webhook Edge Function with service role key can update it). This prevents client-side subscription spoofing.

**Confidence: HIGH** -- Follows existing migration pattern (001-011). Supabase client version unchanged.

---

## What NOT to Add

| Tempting Addition | Why Skip It |
|---|---|
| `@capacitor/in-app-purchases` | Does not exist. RevenueCat IS the IAP solution. No official Capacitor IAP plugin. |
| `@capacitor-community/apple-sign-in` | Not in V2 scope. Email/password auth already works. |
| `react-native-purchases` | Wrong framework. The project is Capacitor, not React Native. |
| `storekit-js` | RevenueCat abstracts StoreKit entirely. No need for raw StoreKit access. |
| `capacitor-stripe` | Not needed. iOS IAP (via RevenueCat) is the only payment method. Apple requires IAP for digital subscriptions. |
| Any gamification SDK | Overkill. The DP/rank/archetype system is simple math. No need for an engine. |
| `motion` (framer-motion) | Existing `tw-animate-css` + CSS keyframes handle all current animations. Avatar evolution can use CSS transitions. Only add if avatar animation requirements exceed CSS capability. |
| Firebase Analytics | Plausible already handles analytics. RevenueCat has its own subscription analytics dashboard. |
| `@capgo/capacitor-purchases` | Third-party RevenueCat wrapper by Capgo. Use the official `@revenuecat/purchases-capacitor` instead. |
| `@perfood/capacitor-healthkit` | Dead -- stuck on Capacitor 4, alpha abandoned. Use `@capgo/capacitor-health` instead. |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|---|---|---|---|
| IAP Subscriptions | RevenueCat (@revenuecat/purchases-capacitor) | Raw StoreKit via custom Capacitor plugin | RevenueCat handles receipt validation, subscription lifecycle, webhooks, analytics. Building this from scratch would take weeks and be error-prone. |
| IAP Subscriptions | RevenueCat | Adapty | Smaller ecosystem, no official Capacitor plugin. RevenueCat has first-party Capacitor support. |
| HealthKit | @capgo/capacitor-health | @perfood/capacitor-healthkit | Perfood is stuck on Capacitor 4, alpha abandoned 2023. Capgo supports Cap 7 and is actively maintained. |
| HealthKit | @capgo/capacitor-health | Custom Capacitor plugin (Swift bridge) | Unnecessary complexity. Capgo plugin covers steps + sleep, which is all V2 needs. |
| Design tokens | CSS custom properties in index.css | Separate design token package (e.g., Style Dictionary) | Over-engineering for a single-app dark-only theme. CSS custom properties are the right tool. |
| Gamification | Pure Zustand stores | GamifyJS / gamification npm packages | These packages add abstraction for simple math. The DP system is ~300 lines of TypeScript. |
| Paywall UI | @revenuecat/purchases-capacitor-ui | Custom React paywall screen | RC UI components are native, handle edge cases (loading states, error recovery, restore), and can be configured in the RC dashboard. Build custom only if branding requires it. |

---

## Installation

```bash
# RevenueCat subscriptions (Capacitor 7 compatible)
npm install @revenuecat/purchases-capacitor@^11.3.2
npm install @revenuecat/purchases-capacitor-ui@^11.3.2

# HealthKit integration (Capacitor 7 compatible)
npm install @capgo/capacitor-health@^7.2.15

# Sync native plugins
npx cap sync ios
```

**Total new runtime dependencies: 3**
**Total new dev dependencies: 0**

| Package | Size Impact | Category |
|---|---|---|
| `@revenuecat/purchases-capacitor` | ~30KB JS + native SDK | IAP |
| `@revenuecat/purchases-capacitor-ui` | ~15KB JS + native views | IAP UI |
| `@capgo/capacitor-health` | ~10KB JS + native bridge | HealthKit |

Estimated JS bundle overhead: ~55KB (pre-minification). Native SDK sizes are larger but do not affect web bundle -- they are compiled into the iOS binary.

---

## Configuration Changes

### capacitor.config.ts additions

```typescript
// Add to plugins config
plugins: {
  // ...existing plugins...
  RevenueCat: {
    // No plugin-level config needed; configured via Purchases.configure() at runtime
  },
}
```

### Xcode project changes

1. **HealthKit capability** -- Enable in Signing & Capabilities
2. **In-App Purchase capability** -- Enable in Signing & Capabilities
3. **Info.plist additions:**
   - `NSHealthShareUsageDescription`: "WellTrained reads your steps and sleep data to award Discipline Points for your fitness activities."
4. **PrivacyInfo.xcprivacy updates:**
   - Add HealthKit API usage declaration
   - Add StoreKit API usage declaration

### RevenueCat dashboard

1. Create project at app.revenuecat.com
2. Add iOS app with bundle ID `fitness.welltrained.app`
3. Connect to App Store Connect (shared secret)
4. Create products: `welltrained_monthly`, `welltrained_annual`
5. Create entitlement: `premium`
6. Create offering: `default` with monthly + annual packages
7. Configure webhook URL: `https://<project-ref>.supabase.co/functions/v1/handle-revenuecat-webhook`
8. Set authorization header for webhook security

### Environment variables (Supabase)

```
REVENUECAT_WEBHOOK_SECRET=<shared secret for webhook auth header>
REVENUECAT_API_KEY_IOS=appl_<key from RC dashboard>
```

---

## Upgrade Path: Capacitor 7 to 8

When migrating to Capacitor 8 (required before April 28, 2026):

| Package | From | To |
|---|---|---|
| `@capacitor/core` | ^7.5.0 | ^8.x |
| `@revenuecat/purchases-capacitor` | ^11.3.2 | ^12.x |
| `@revenuecat/purchases-capacitor-ui` | ^11.3.2 | ^12.x |
| `@capgo/capacitor-health` | ^7.2.15 | ^8.x (already publishing 8.x line) |

All three new plugins already have Capacitor 8 versions available. The migration path is clear.

---

## Sources

- [RevenueCat Capacitor Plugin - GitHub](https://github.com/RevenueCat/purchases-capacitor)
- [RevenueCat Capacitor Installation Docs](https://www.revenuecat.com/docs/getting-started/installation/capacitor)
- [RevenueCat Getting Subscription Status](https://www.revenuecat.com/docs/customers/customer-info)
- [RevenueCat Webhooks Documentation](https://www.revenuecat.com/docs/integrations/webhooks)
- [RevenueCat Webhook Event Types](https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields)
- [RevenueCat Making Purchases](https://www.revenuecat.com/docs/getting-started/making-purchases)
- [@revenuecat/purchases-capacitor npm](https://www.npmjs.com/package/@revenuecat/purchases-capacitor) -- v11.3.2, peerDeps: @capacitor/core >=7.0.0
- [@revenuecat/purchases-capacitor-ui npm](https://www.npmjs.com/package/@revenuecat/purchases-capacitor-ui) -- v11.3.2, peerDeps: @capacitor/core ^7.0.0
- [@capgo/capacitor-health - GitHub](https://github.com/Cap-go/capacitor-health)
- [@capgo/capacitor-health - Capgo Docs](https://capgo.app/docs/plugins/health/)
- [@capgo/capacitor-health npm](https://www.npmjs.com/package/@capgo/capacitor-health) -- v7.2.15, peerDeps: @capacitor/core >=7.0.0
- [@perfood/capacitor-healthkit npm](https://www.npmjs.com/package/@perfood/capacitor-healthkit) -- v1.3.2, peerDeps: @capacitor/core ^4.0.0 (INCOMPATIBLE)
- [Tailwind v4 Theme Variables](https://tailwindcss.com/docs/theme)
- [Tailwind v4 Custom Styles](https://tailwindcss.com/docs/adding-custom-styles)
- [RevenueCat + Supabase Webhook Community Discussion](https://community.revenuecat.com/third-party-integrations-53/error-extracting-app-user-id-from-webhook-in-supabase-400-user-id-not-found-6557)
