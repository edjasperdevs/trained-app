# Domain Pitfalls: V2 Revamp -- RevenueCat, HealthKit, Gamification Overhaul, Design System, Coach Stripping

**Domain:** Adding freemium subscriptions (RevenueCat iOS IAP), HealthKit steps/sleep integration, XP-to-DP gamification migration, Dopamine Noir V2 design system, and stripping ~4,600 lines of coach dashboard from an existing Capacitor 7 fitness app
**Researched:** 2026-02-27
**Existing Codebase:** Trained v1.5 -- React 18 + TypeScript + Vite + Zustand (localStorage) + Supabase + Capacitor 7.5 + Tailwind v4 + shadcn/ui
**Overall Confidence:** HIGH (verified against official docs, GitHub issues, and codebase inspection)

---

## Table of Contents

### Critical Pitfalls (cause App Store rejection, data loss, or rewrites)
1. [RevenueCat SDK Initialization Race Condition](#1-revenuecat-sdk-initialization-race-condition)
2. [Missing Restore Purchases Button -- Guaranteed Rejection](#2-missing-restore-purchases-button----guaranteed-rejection)
3. [Apple Guideline 3.1.2 Subscription Transparency Violations](#3-apple-guideline-312-subscription-transparency-violations)
4. [XP-to-DP Data Migration Destroys Existing User Progress](#4-xp-to-dp-data-migration-destroys-existing-user-progress)
5. [Zustand localStorage Key Rename Wipes Persisted State](#5-zustand-localstorage-key-rename-wipes-persisted-state)
6. [HealthKit Permission Is Irrevocable from App -- No Re-prompt](#6-healthkit-permission-is-irrevocable-from-app----no-re-prompt)
7. [Coach Code Stripping Breaks Sync and Import Graph](#7-coach-code-stripping-breaks-sync-and-import-graph)
8. [Apple Review Cannot Test Subscription -- Products Not Fetchable](#8-apple-review-cannot-test-subscription----products-not-fetchable)

### Moderate Pitfalls (cause bugs, degraded UX, or conversion loss)
9. [HealthKit Background Delivery Silently Stops](#9-healthkit-background-delivery-silently-stops)
10. [HealthKit Data Gaps Indistinguishable from Permission Denial](#10-healthkit-data-gaps-indistinguishable-from-permission-denial)
11. [Design System Color Swap Misses Hardcoded Values](#11-design-system-color-swap-misses-hardcoded-values)
12. [Paywall Shown Too Early Kills Conversion](#12-paywall-shown-too-early-kills-conversion)
13. [RevenueCat Capacitor Plugin Version Mismatch with Capacitor 7](#13-revenuecat-capacitor-plugin-version-mismatch-with-capacitor-7)
14. [Supabase Schema Migration for DP Tables Breaks RLS](#14-supabase-schema-migration-for-dp-tables-breaks-rls)
15. [Entitlements File Missing HealthKit and IAP Capabilities](#15-entitlements-file-missing-healthkit-and-iap-capabilities)

### Minor Pitfalls (cause friction, polish issues, or tech debt)
16. [Sleep Data Requires Activity Permission Scope -- Not Obvious](#16-sleep-data-requires-activity-permission-scope----not-obvious)
17. [PrivacyInfo.xcprivacy Must Declare HealthKit and Purchase APIs](#17-privacyinfoxcprivacy-must-declare-healthkit-and-purchase-apis)
18. [Archetype DP Modifiers Create Balance Exploits](#18-archetype-dp-modifiers-create-balance-exploits)
19. [XP-Named CSS Tokens and Components Linger After Rename](#19-xp-named-css-tokens-and-components-linger-after-rename)
20. [StoreKit 2 Only Available iOS 16+ -- Older Devices Fall Back](#20-storekit-2-only-available-ios-16----older-devices-fall-back)

---

## Critical Pitfalls

### 1. RevenueCat SDK Initialization Race Condition

**What goes wrong:** RevenueCat's `Purchases.configure()` must be called exactly once, early in the app lifecycle, BEFORE any purchase or entitlement check. In a Capacitor app, the WebView loads the React app which initializes auth, sync, and routing simultaneously. If any component checks `customerInfo.entitlements` before `configure()` resolves, it throws or returns empty entitlements -- making premium users see the paywall and free users see premium content.

**Why it happens:** The current app initializes auth in `useEffect` within `AppContent`, and multiple systems (sync, coach data pull, badge updates) fire in parallel. Adding a `Purchases.configure()` call that must complete before entitlement checks creates an ordering dependency that doesn't exist today.

**Consequences:**
- Premium users see paywall on every launch (entitlements not loaded yet)
- Free users briefly see premium content (race to opposite direction)
- Apple reviewer sees broken purchase flow -- rejection under Guideline 2.1 (App Completeness)

**Prevention:**
- Configure RevenueCat in a dedicated initialization step that completes BEFORE React renders the main app tree. Use a loading gate pattern: show splash/skeleton until both auth AND RevenueCat are initialized.
- Create a `subscriptionStore` (Zustand) that caches the latest entitlement state in localStorage so the app has a "last known" subscription status immediately, then updates asynchronously from RevenueCat.
- Never call `Purchases.getCustomerInfo()` or check entitlements until `configure()` has resolved.

**Detection:** If the paywall flashes on launch for a subscriber, or premium content flashes for a free user, the race condition exists.

**V2 Phase:** Subscription/RevenueCat integration phase. Must be addressed in the initial RevenueCat setup, not bolted on later.

**Confidence:** HIGH -- documented in RevenueCat Capacitor docs and community issues.

---

### 2. Missing Restore Purchases Button -- Guaranteed Rejection

**What goes wrong:** Apple requires a visible "Restore Purchases" button that calls `Purchases.restoreTransactions()`. If the reviewer cannot find it, the app is rejected under Guideline 3.1.1. This is the single most common subscription-related rejection reason according to RevenueCat's own documentation.

**Why it happens:** Developers build the paywall, test purchase flow, but forget to add restore functionality. Or they add it in Settings but the reviewer doesn't navigate there.

**Consequences:** App Store rejection. The fix is trivial but the rejection adds 1-2 weeks to the review cycle.

**Prevention:**
- Place "Restore Purchases" button on BOTH the paywall screen AND in Settings.
- After restore completes, close the paywall and show confirmation that the subscription was restored.
- Test the restore flow with sandbox accounts before submission.
- Add a note in App Review Information telling the reviewer where to find the restore button.

**Detection:** If you can't find "Restore Purchases" without searching, neither can the reviewer.

**V2 Phase:** Paywall UI phase. Must be a checklist item on the paywall component itself.

**Confidence:** HIGH -- RevenueCat's App Store rejection guide lists this as #1 cause.

**Sources:**
- [RevenueCat App Store Rejections Guide](https://www.revenuecat.com/docs/test-and-launch/app-store-rejections)
- [RevenueCat Community: Restore Purchases Rejection](https://community.revenuecat.com/sdks-51/we-get-rejected-from-apple-store-review-about-restore-purchases-693)

---

### 3. Apple Guideline 3.1.2 Subscription Transparency Violations

**What goes wrong:** Apple requires auto-renewable subscriptions to clearly display: (a) subscription price, (b) billing period, (c) "subscriptions auto-renew unless cancelled," (d) how to cancel, and (e) link to terms of service and privacy policy. Missing ANY of these triggers rejection under Guideline 3.1.2.

**Why it happens:** Developers focus on the purchase CTA and paywall design, treating the legal text as an afterthought. Apple reviewers check every word.

**Consequences:** Rejection, often with a vague message citing "3.1.2" with no specific fix -- requiring multiple resubmissions to guess which element was missing.

**Prevention -- Subscription Paywall Checklist:**
- [ ] Price displayed in local currency (RevenueCat provides this via `product.priceString`)
- [ ] Billing period stated explicitly ("$X.XX/month" or "$X.XX/year")
- [ ] "Payment will be charged to your Apple ID account at confirmation of purchase"
- [ ] "Subscription automatically renews unless it is canceled at least 24 hours before the end of the current period"
- [ ] "Your account will be charged for renewal within 24 hours prior to the end of the current period"
- [ ] "You can manage and cancel your subscriptions by going to your account settings on the App Store after purchase"
- [ ] Link to Terms of Service
- [ ] Link to Privacy Policy (already exists at `/privacy`)
- [ ] Free trial terms if offered: "X days free, then $Y.YY/period"
- [ ] "Cancel anytime" must be accurate -- no lock-in language

**Detection:** Have someone who has never seen the app attempt to understand exactly what they're paying for from the paywall alone.

**V2 Phase:** Paywall UI phase. Build this text into the paywall component template from day one.

**Confidence:** HIGH -- directly from Apple App Store Review Guidelines 3.1.2 and RevenueCat documentation.

**Sources:**
- [Apple Auto-renewable Subscriptions](https://developer.apple.com/app-store/subscriptions/)
- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Adapty: App Store Review Guidelines 2026](https://adapty.io/blog/how-to-pass-app-store-review/)

---

### 4. XP-to-DP Data Migration Destroys Existing User Progress

**What goes wrong:** The current system stores XP state in Zustand localStorage under the key `gamify-gains-xp` with fields `totalXP`, `currentLevel` (0-99), `pendingXP`, `weeklyHistory`, and `dailyLogs`. The V2 system replaces this with Discipline Points (DP) and a 15-rank system with completely different progression curves. If the migration is not handled, existing users lose all progress on update. If the migration formula is wrong, users land at inappropriate ranks.

**Why it happens:** The XP and DP systems have fundamentally different scales:
- Current XP: 99 levels, progressive curve starting at 100 XP/level, capping at 2,500 XP/level
- New DP: 15 ranks, ~24-27 week mastery curve, different earning actions and values
- There is no clean mathematical mapping between the two -- a level 30 XP user might be rank 4 or rank 8 depending on the conversion formula

**Consequences:**
- Users who earned weeks of XP see "Rank 1, 0 DP" -- feels like a reset, causes churn
- Users mapped to too-high ranks hit a progression wall (already "mastered" content)
- Supabase `user_xp` table still contains old data that doesn't match client state
- `xp_awarded` boolean on `workout_logs` becomes meaningless

**Prevention:**
- Write an explicit migration function that runs once on first launch of V2
- Migration should read `gamify-gains-xp` from localStorage, calculate equivalent DP based on a percentage-of-max approach (e.g., if user was at 30% of max XP progression, place them at 30% of max DP progression)
- Set a `migration_version` flag in localStorage to ensure migration runs exactly once
- Create a Supabase migration to add DP columns alongside (not replacing) XP columns, allowing rollback
- Show a "Welcome to V2" screen explaining the new system so users understand the number change
- Log the migration event (old XP, old level, new DP, new rank) to Sentry for debugging

**Detection:** If any user's rank after migration feels wrong compared to their history, the formula needs adjustment. Test with edge cases: brand new user (0 XP), moderate user (level 15), power user (level 50+).

**V2 Phase:** Gamification system phase. Must be implemented BEFORE the DP earning system, as it establishes initial state.

**Confidence:** HIGH -- verified by inspecting `xpStore.ts` (line 301: persist key `gamify-gains-xp`) and `sync.ts` (line 706: `syncXPToCloud` pushes to `user_xp` table).

---

### 5. Zustand localStorage Key Rename Wipes Persisted State

**What goes wrong:** Zustand's `persist` middleware identifies stored state by the `name` property. If you rename the store (e.g., `gamify-gains-xp` to `trained-dp` or `welltrained-dp`), Zustand treats it as a brand new store with no data. ALL existing persisted state is lost silently -- no error, no warning, just empty defaults.

**Why it happens:** The V2 rebrand from "Gamify Gains" to "WellTrained" naturally leads developers to rename persist keys. The current keys are: `gamify-gains-xp`, `gamify-gains-avatar`, `gamify-gains-achievements` (found in `devSeed.ts` line 828). Renaming these without migration loses ALL local data.

**Consequences:**
- XP/DP progress lost (even if migration function exists, it can't find the old data)
- Avatar state lost
- Achievement badges lost
- User appears as a brand new user despite having history
- If the user was offline when updating, their local-only data is permanently gone

**Prevention:**
- Use Zustand's built-in `version` + `migrate` pattern: increment the `version` number and provide a `migrate` function that reads from the old persist key
- OR: Keep the old persist key names and transform data in-place. The key name is cosmetic -- there is no technical reason to rename it.
- If you must rename: write a one-time migration in the persist config that reads `localStorage.getItem('gamify-gains-xp')`, parses it, transforms the data, and returns the new state shape
- Test the migration path: manually set old localStorage data, then load the new app version

**Detection:** After updating, check `localStorage` in DevTools. If the old key still exists AND the new key has empty/default values, the migration failed.

**V2 Phase:** Gamification system phase. Address BEFORE any store restructuring. This is a pre-requisite for Pitfall #4.

**Confidence:** HIGH -- verified with Zustand persist docs and confirmed current key names in codebase.

**Sources:**
- [Zustand Discussion: Best way to run a migration on first persist](https://github.com/pmndrs/zustand/discussions/1717)
- [How to migrate Zustand local storage store to a new version](https://dev.to/diballesteros/how-to-migrate-zustand-local-storage-store-to-a-new-version-njp)

---

### 6. HealthKit Permission Is Irrevocable from App -- No Re-prompt

**What goes wrong:** Unlike camera or notification permissions, HealthKit authorization can ONLY be requested once per data type. If the user denies access (or dismisses the dialog), the app cannot show the authorization sheet again. The app also CANNOT distinguish between "denied" and "never asked" for read permissions -- `authorizationStatus` for read types returns `.notDetermined` even after denial (Apple's privacy design).

**Why it happens:** Apple treats health data with extreme privacy protection. The authorization request is shown exactly once per data type. After that, the user must go to Settings > Health > [App Name] to re-enable access.

**Consequences:**
- User denies HealthKit on first prompt -> steps/sleep tracking permanently broken unless they manually visit Settings
- App cannot detect the denial to show helpful guidance
- If the permission prompt fires at the wrong time (e.g., during onboarding before the user understands why), they'll deny it instinctively

**Prevention:**
- Show a pre-permission screen explaining WHY the app needs HealthKit access BEFORE calling `requestAuthorization()`. Use a "soft ask" pattern: "WellTrained tracks your steps and sleep to earn Discipline Points. Tap Continue to connect to Apple Health." Then only call the real iOS permission when they tap Continue.
- If HealthKit returns no data, show a banner: "Not seeing your steps? Check Settings > Health > WellTrained to enable access."
- Always implement manual entry as a first-class fallback, not an afterthought. The manual entry UI should be just as polished as the HealthKit-powered UI.
- Request ONLY the specific data types needed (steps, sleep analysis) -- not broad access. Requesting unnecessary types triggers Apple review scrutiny.

**Detection:** If a user reports "steps always show 0" and they have an Apple Watch, they likely denied HealthKit. The app cannot programmatically confirm this for read permissions.

**V2 Phase:** HealthKit integration phase. The pre-permission screen must be built BEFORE the native HealthKit call.

**Confidence:** HIGH -- directly from Apple Developer documentation on `requestAuthorization(toShare:read:completion:)`.

**Sources:**
- [Apple: Authorizing Access to Health Data](https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data)
- [Apple Developer Forums: HealthKit Authorization](https://developer.apple.com/forums/thread/99474)

---

### 7. Coach Code Stripping Breaks Sync and Import Graph

**What goes wrong:** The coach dashboard code (~4,609 lines across 9 files) is deeply intertwined with the app's sync system, data types, and navigation. Deleting the files without surgically removing all references causes build failures, broken imports, and runtime errors. The entanglement points include:

| File to Remove | Lines | Entangled With |
|---|---|---|
| `Coach.tsx` | 2,158 | `App.tsx` (route, lazy import, CoachGuard), `screens/index.ts` (export) |
| `useCoachTemplates.ts` | 428 | `WorkoutAssigner.tsx` (import) |
| `useClientRoster.ts` | 226 | `Coach.tsx` only -- clean |
| `useClientDetails.ts` | 317 | `Coach.tsx` only -- clean |
| `useWeeklyCheckins.ts` | 450 | `Coach.tsx`, but also used by client-side check-in flow |
| `WorkoutAssigner.tsx` | 202 | `Coach.tsx` only -- clean |
| `IntakeView.tsx` | 432 | `Coach.tsx` only -- clean |
| `intakeApi.ts` | 123 | `IntakeView.tsx` only -- clean |
| `intakeTypes.ts` | 273 | `IntakeView.tsx` only -- clean |

But the dangerous entanglement is in the **sync layer** and **client-facing features that reference coach concepts:**
- `sync.ts` `pullCoachData()` function: pulls assigned workouts, macro targets with `set_by: 'coach'`, and check-in responses -- these are CLIENT features, not coach dashboard features
- `macroStore.ts`: `setBy: 'coach'`, `coachMacroUpdated`, `setCoachTargets()` -- client-side coach interaction
- `Home.tsx`: coach response banner, weekly check-in due banner
- `Workouts.tsx`: `coachNotes` display on assigned workouts
- `Macros.tsx`: "managed by your coach" banner
- `Settings.tsx`: coach dashboard link, coaching client check
- `supabase.ts`: `isCoach()` helper
- `badge.ts`: coach response badge count
- `database.types.ts`: all coach-related type definitions
- `devSeed.ts`: mock coach data

**Why it happens:** The coach dashboard and client features that interact with a coach share the same Supabase tables and type system. You can delete the coach dashboard UI but NOT the client-side features that receive coach-set data.

**Consequences:**
- Deleting `useWeeklyCheckins.ts` breaks the client's weekly check-in submission flow
- Deleting coach types from `database.types.ts` breaks `sync.ts`
- Removing `pullCoachData()` means clients never receive coach-set macros or assigned workouts
- Removing `isCoach()` breaks the Settings page coach section (which should be removed)
- TypeScript errors cascade through the entire build

**Prevention:**
- Create a deletion plan that categorizes files as: (a) pure coach dashboard -- safe to delete, (b) shared coach/client -- must keep client portions, (c) client-facing coach interaction -- keep entirely
- Delete in order: pure coach files first, then surgically edit shared files
- Keep `pullCoachData()` in sync.ts -- it pulls data FOR the client, not BY the coach
- Keep `database.types.ts` coach types -- they match the Supabase schema which hasn't changed
- Keep `useWeeklyCheckins.ts` client-side functions (submitCheckin, hasActiveCoach) -- only remove coach-specific functions (reviewCheckin, respondToCheckin)
- Remove from `App.tsx`: the `/coach` route, `CoachGuard` component, and the lazy `Coach` import
- Remove from `Settings.tsx`: the "Open Coach Dashboard" section
- Remove from `screens/index.ts`: the `Coach` export
- Run `tsc --noEmit` after each deletion step to catch cascading errors
- Run the full test suite after stripping

**Detection:** Build failures are immediate (TypeScript catches missing imports). Runtime failures require testing the weekly check-in flow, coach-set macro display, and assigned workout display.

**V2 Phase:** Coach stripping phase. Should be done EARLY (before new features add more code) but CAREFULLY (one file at a time with `tsc` validation).

**Confidence:** HIGH -- verified by grepping the full codebase for coach-related imports (see research above).

---

### 8. Apple Review Cannot Test Subscription -- Products Not Fetchable

**What goes wrong:** The app works perfectly in sandbox and TestFlight, but when Apple's reviewer runs it, `Purchases.getOfferings()` returns empty results. The reviewer sees a blank paywall or an error, and rejects under Guideline 2.1 (App Completeness). This is one of the most reported RevenueCat issues in the community.

**Why it happens:** Several conditions must ALL be true for the reviewer to see products:
1. In-app purchases must be submitted for review WITH the app binary (not separately)
2. The subscription must have cleared "Waiting for Review" status
3. The RevenueCat offering must be configured with the correct product IDs matching App Store Connect
4. The app's bundle ID must match the RevenueCat project configuration
5. The reviewer's account region must have pricing configured for the subscription

**Consequences:** Rejection under 2.1 (App Completeness) -- the app "doesn't work." The fix requires resubmission, adding 1-2 weeks per cycle.

**Prevention:**
- Submit in-app purchases for review at the SAME TIME as the app binary -- Apple reviews both together
- Handle the "no products available" case gracefully: show a retry button or informational message instead of a blank screen
- In App Store Connect, ensure "Cleared for Sale" is checked for all subscription products
- Ensure pricing is configured for ALL territories, not just your local one
- Add a note in App Review Information: "To test subscriptions, use a sandbox Apple ID. The subscription is [product name] at [$X.XX/period]."
- Test with a completely fresh sandbox account to verify the flow

**Detection:** If `Purchases.getOfferings()` returns null or empty offerings in any environment, the product configuration is broken.

**V2 Phase:** App Store submission phase. Must be verified BEFORE submitting for review.

**Confidence:** HIGH -- extensively documented in RevenueCat community forums.

**Sources:**
- [RevenueCat: Unable to Fetch Subscription Products During App Store Review](https://community.revenuecat.com/tips-discussion-56/unable-to-fetch-subscription-products-during-app-store-review-5564)
- [RevenueCat: Multiple iOS App Store Rejection Due to RevenueCat](https://community.revenuecat.com/general-questions-7/multiple-ios-app-store-rejection-due-to-revenue-cat-purchase-failure-there-was-a-problem-with-the-apple-store-7175)

---

## Moderate Pitfalls

### 9. HealthKit Background Delivery Silently Stops

**What goes wrong:** HealthKit background delivery (using `HKObserverQuery` + `enableBackgroundDelivery`) works initially but stops firing after a few hours on battery. The app only receives updates reliably when the phone is charging. This means step counts and sleep data can be hours stale when the user opens the app.

**Why it happens:** iOS aggressively manages background execution. HealthKit background delivery requires:
1. The `com.apple.developer.healthkit.background-delivery` entitlement (added in iOS 15)
2. Observer queries set up in `application(_:didFinishLaunchingWithOptions:)` -- but Capacitor apps don't have a traditional AppDelegate hook for this
3. The completion handler must be called in EVERY code path of the update handler -- missing it once causes iOS to stop sending updates permanently
4. Device must be unlocked for health data to be accessible

**Consequences:**
- Steps/sleep data is stale -- user sees yesterday's numbers
- DP calculation based on steps is incorrect at time of check-in
- Users think the feature is broken

**Prevention:**
- Do NOT rely on background delivery for a Capacitor app. Instead, query HealthKit for fresh data on app foreground (already have the `appStateChange` listener in `App.tsx`).
- Query HealthKit data for "today" every time the app becomes active, and for "last night" sleep data on morning launch.
- Cache the last successful HealthKit read timestamp so you know how stale the data is.
- Show "Last updated: X minutes ago" on the steps/sleep display so users understand the data might not be real-time.
- If the background delivery entitlement is added later, it requires a native Swift plugin or modification to the Capacitor iOS project's AppDelegate -- this is feasible but adds native code complexity.

**Detection:** If step counts don't update for 2+ hours while the phone is on battery, background delivery is not working.

**V2 Phase:** HealthKit integration phase. Design the architecture around foreground-only reads from the start.

**Confidence:** HIGH -- documented in Apple Developer Forums and multiple developer blogs.

**Sources:**
- [Apple: HealthKit Background Delivery Entitlement](https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.healthkit.background-delivery)
- [Apple Developer Forums: HKObserverQuery Background Delivery](https://developer.apple.com/forums/thread/690974)
- [Apple Developer Forums: Background Delivery Stops](https://developer.apple.com/forums/thread/801627)

---

### 10. HealthKit Data Gaps Indistinguishable from Permission Denial

**What goes wrong:** When HealthKit returns zero steps for a day, the app cannot determine whether: (a) the user didn't wear their device, (b) the user denied permission, (c) the user doesn't have an Apple Watch, or (d) there was a sync issue. Apple intentionally does not expose read authorization status for privacy -- `authorizationStatus(for:)` returns `.notDetermined` for read types even after denial.

**Why it happens:** Apple's privacy-first design means apps cannot know if health data access was denied -- only whether the user has been asked. This prevents apps from inferring health conditions from permission patterns.

**Consequences:**
- App shows "0 steps" which could mean "no device" or "denied access" -- confusing
- DP calculations award 0 points for steps on days the user simply didn't wear their watch
- If the gamification system penalizes missed days, users with data gaps are unfairly punished
- Support burden: "Why does it say 0 steps? I walked 10,000 today!"

**Prevention:**
- Never show raw "0 steps" -- instead show "No step data available" with a contextual help link
- Track whether the user has EVER successfully received HealthKit data. If yes and now getting 0, it's likely a data gap, not a permission issue. If never, it's likely a permission or device issue.
- Store a `healthKitConnected: boolean` flag after the first successful read
- Do NOT make DP calculation dependent on having HealthKit data -- always allow manual entry to fill gaps
- Consider a "sync steps" button that re-queries HealthKit, giving users agency
- When awarding DP for steps, use "DP earned from steps: [X]" with a manual override option

**Detection:** If users report confusion about step data, or DP feels unfair, the gap handling is insufficient.

**V2 Phase:** HealthKit integration phase. Must design the zero-data state UX alongside the happy path.

**Confidence:** HIGH -- verified with Apple documentation: "For privacy, results are the same as if authorization were denied."

**Sources:**
- [Apple: Authorizing Access to Health Data](https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data)
- [MyDataHelps: HealthKit Troubleshooting](https://support.mydatahelps.org/hc/en-us/articles/4407854940435-Apple-HealthKit-Troubleshooting-Connection-and-Data-Issues)

---

### 11. Design System Color Swap Misses Hardcoded Values

**What goes wrong:** The V2 design system changes the primary color from red (#D55550) to lime (#C8FF00). The CSS variable system in `index.css` has 45+ color references including `--primary`, `--color-primary-hover`, `--color-primary-muted`, `--color-xp-bar`, `--color-streak-active`, `--shadow-glow`, `--shadow-glow-intense`, and legacy aliases. Updating the CSS variables is the "right" approach, but grep found 238 occurrences of `#D55550`, `#E0605A`, or `primary` across 42 `.tsx`/`.ts` files. Some of these are hardcoded hex values, not CSS variable references.

**Why it happens:** Over 5 milestones of development, some components use inline styles, some use Tailwind utilities referencing the variable, some use hardcoded hex in SVGs, canvas draws, or animation keyframes. The CSS variable system centralizes most colors, but not all.

**Consequences:**
- Some UI elements remain red while the rest of the app is lime -- looks broken
- Shadow glow effects use `rgba(213, 85, 80, ...)` which is hardcoded red -- won't change with variables
- `capacitor.config.ts` has `iconColor: '#D4443B'` for notifications -- a different red entirely
- Chart colors (`--chart-1`) reference the old primary
- Skeleton loading states and error states may retain old colors

**Prevention:**
- Run a comprehensive grep for ALL red-spectrum hex values: `#D55550`, `#E0605A`, `#D4443B`, `#C13A33`, `rgba(213, 85, 80`
- Categorize each occurrence as: (a) CSS variable reference (will auto-update), (b) hardcoded value that needs manual update, (c) intentional non-primary red (e.g., error state) that should stay
- Update `capacitor.config.ts` `iconColor` to the new lime color
- Update `--shadow-glow` and `--shadow-glow-intense` in `index.css` to use the new primary's RGBA
- Consider that lime on dark (#C8FF00 on #0A0A0A) has different contrast properties than red on dark -- verify WCAG AA compliance for all text-on-primary combinations
- Lime (#C8FF00) as a foreground text color has very different readability than red -- `--primary-foreground` may need to change from #FFFFFF to #000000

**Detection:** Visual regression testing. Take screenshots of every screen before and after the color swap. Any remaining red is a miss (unless it's an error/destructive state).

**V2 Phase:** Design system phase. Must happen BEFORE any new component development so new code uses the correct colors.

**Confidence:** HIGH -- verified by grep across the codebase (238 occurrences in 42 files).

---

### 12. Paywall Shown Too Early Kills Conversion

**What goes wrong:** Showing the subscription paywall before the user has experienced value from the free tier causes immediate churn. Industry data from RevenueCat's 2025 State of Subscription Apps report shows freemium apps with aggressive early paywalls convert at 2.18% median, while apps that let users experience value first convert at 6-8%.

**Why it happens:** Business pressure to monetize quickly, combined with the desire to gate premium features (archetypes, Protocol Orders) behind the paywall immediately.

**Consequences:**
- Users who haven't completed a single workout see "pay to unlock" -- immediate uninstall
- App Store ratings drop from users who feel "bait-and-switched"
- Apple reviewers may flag the app under Guideline 3.1.1 if the free tier feels too limited

**Prevention:**
- The free tier (Bro archetype) must deliver genuine value: full workout logging, macro tracking, check-ins, basic DP earning, and rank progression
- Gate premium features (Himbo/Brute/Pup/Bull archetypes, Protocol Orders, DP modifiers) behind the paywall, but let users SEE them with a lock icon
- Show the paywall contextually: when a user tries to select a premium archetype, when they view Protocol Orders, when they hit a natural upgrade moment (e.g., reaching Rank 3)
- Never interrupt a user's current action with a paywall -- wait for them to request a premium feature
- Consider a 7-day free trial to let users experience premium before committing (RevenueCat data shows longer trials correlate with 45.7% conversion from trial to paid)

**Detection:** Track paywall impression-to-conversion rate. If below 3%, the paywall is either too aggressive or poorly timed.

**V2 Phase:** Paywall UX phase. Must be designed alongside the feature gating architecture.

**Confidence:** MEDIUM -- based on RevenueCat aggregate data, specific conversion rates will vary.

**Sources:**
- [RevenueCat: State of Subscription Apps 2025](https://www.revenuecat.com/state-of-subscription-apps-2025/)
- [RevenueCat: How Top Apps Approach Paywalls](https://www.revenuecat.com/blog/growth/how-top-apps-approach-paywalls/)
- [Apphud: Design High-Converting Subscription App Paywalls](https://apphud.com/blog/design-high-converting-subscription-app-paywalls)

---

### 13. RevenueCat Capacitor Plugin Version Mismatch with Capacitor 7

**What goes wrong:** The app runs Capacitor 7.5.0. The RevenueCat Capacitor plugin (`@revenuecat/purchases-capacitor`) has jumped from version 9.x (Capacitor 6) to version 12.x (current). The peer dependency requirements may not explicitly list `@capacitor/core@^7.0.0`, causing npm install warnings or build failures. Additionally, the plugin requires Swift >= 5.0 on the native side.

**Why it happens:** RevenueCat's Capacitor plugin version numbering follows the underlying RevenueCat SDK version, not the Capacitor version. Version 12.1.3 was released 2026-02-19, but its peer dependency matrix for Capacitor 7 specifically is not clearly documented in npm metadata.

**Consequences:**
- `npm install` warns about unmet peer dependencies
- Native iOS build fails if Swift version is incompatible
- Runtime crashes if the Capacitor bridge version doesn't match

**Prevention:**
- Check the exact peer dependency of `@revenuecat/purchases-capacitor@latest` against `@capacitor/core@7.5.0` before installing
- Pin the RevenueCat plugin version in `package.json` to avoid surprise breaking updates
- After installing, run `npx cap sync ios` and verify the Xcode build succeeds before writing any TypeScript code
- If the current version doesn't support Capacitor 7, check if version 10.x or 11.x does -- the version numbering jumps may include Capacitor 7 support
- Test on a real device, not just simulator, since StoreKit behaves differently

**Detection:** npm install warnings, Xcode build errors mentioning `RevenueCat` or `Purchases`, or runtime `PurchasesError` on app launch.

**V2 Phase:** RevenueCat integration phase. Resolve before writing any subscription code.

**Confidence:** MEDIUM -- npm shows v12.1.3 but exact Capacitor 7 peer dependency not confirmed in search results. The plugin IS actively maintained, so support is likely present.

**Sources:**
- [@revenuecat/purchases-capacitor on npm](https://www.npmjs.com/package/@revenuecat/purchases-capacitor)
- [RevenueCat purchases-capacitor GitHub](https://github.com/RevenueCat/purchases-capacitor)

---

### 14. Supabase Schema Migration for DP Tables Breaks RLS

**What goes wrong:** The V2 gamification system requires new Supabase tables (e.g., `user_dp`, `dp_logs`, `ranks`, `archetypes`, `protocol_orders`). The existing `user_xp` and `xp_logs` tables have RLS policies that reference `coach_clients` for coach read access. If new tables are created without matching RLS policies, or if old tables are modified without updating dependent views (`coach_client_summary`), the migration fails silently or creates security holes.

**Why it happens:** The `coach_client_summary` view joins `user_xp`, and RLS policies on `user_xp` reference the `coach_clients` table. Creating `user_dp` alongside `user_xp` means both tables need RLS, and the view may need updating (even though we're stripping the coach dashboard, the tables and policies should remain consistent).

**Consequences:**
- New tables without RLS = any authenticated user can read/write any other user's DP data
- Broken view = coach_client_summary query fails, which could affect sync
- Migration rollback impossible if old tables are dropped

**Prevention:**
- Create new DP tables ALONGSIDE existing XP tables -- don't drop XP tables in the same migration
- Copy the RLS policy pattern from `user_xp` to `user_dp`: "Users manage own data" + "Coaches can read client data"
- Update `coach_client_summary` view to reference `user_dp` instead of (or alongside) `user_xp`
- Write the Supabase migration as a single transaction so it either fully applies or fully rolls back
- Test the migration on a Supabase branch/staging environment before production
- Update `delete-account` Edge Function to include new tables in its cleanup cascade (currently references `user_xp`)

**Detection:** Run `SELECT * FROM user_dp` as a non-owner in Supabase SQL Editor -- if it returns data, RLS is missing.

**V2 Phase:** Database migration phase. Should happen early, before the app code references new tables.

**Confidence:** HIGH -- verified by reading the existing schema and RLS policies in `supabase/schema.sql`.

---

### 15. Entitlements File Missing HealthKit and IAP Capabilities

**What goes wrong:** The current `App.entitlements` file only contains `com.apple.developer.associated-domains` (for deep linking) and `aps-environment` (for push notifications). Adding HealthKit and In-App Purchase requires additional entitlements that must be configured both in Xcode AND in the Apple Developer portal.

**Why it happens:** Capacitor plugins handle JavaScript-side integration but DO NOT automatically add iOS entitlements. The developer must manually:
1. Enable "HealthKit" capability in Xcode target > Signing & Capabilities
2. Enable "In-App Purchase" capability in Xcode
3. Add `com.apple.developer.healthkit` entitlement
4. Add `com.apple.developer.healthkit.background-delivery` if using background delivery
5. Enable these capabilities in the Apple Developer portal's App ID configuration

**Consequences:**
- HealthKit calls fail silently or throw "not available" errors
- StoreKit purchase calls fail with "products not available"
- App Store submission fails with "Invalid Binary" if entitlements don't match provisioning profile

**Prevention -- Entitlements Checklist:**
- [ ] Enable "HealthKit" in Xcode Signing & Capabilities
- [ ] Enable "In-App Purchase" in Xcode Signing & Capabilities
- [ ] Verify `App.entitlements` contains `com.apple.developer.healthkit` = true
- [ ] Add `NSHealthShareUsageDescription` to `Info.plist` (required -- rejection without it)
- [ ] Add `NSHealthUpdateUsageDescription` to `Info.plist` if writing any data
- [ ] In Apple Developer portal: enable HealthKit and In-App Purchase for the App ID
- [ ] Re-generate provisioning profiles after enabling capabilities
- [ ] Run `npx cap sync ios` after any native configuration changes
- [ ] Verify with a real device build (simulator doesn't support StoreKit sandbox properly)

**Detection:** Xcode build warnings about missing entitlements, or runtime errors "HealthKit not available" on a device that has HealthKit.

**V2 Phase:** Project setup phase -- must be done before any HealthKit or RevenueCat code.

**Confidence:** HIGH -- verified by inspecting current `App.entitlements` which is missing both capabilities.

---

## Minor Pitfalls

### 16. Sleep Data Requires Activity Permission Scope -- Not Obvious

**What goes wrong:** The `@perfood/capacitor-healthkit` plugin groups sleep data under the `activity` permission scope, not a separate `sleep` scope. Developers request permission for `steps` but forget that `activity` (which includes sleep) is a separate authorization request.

**Why it happens:** HealthKit data types are categorized differently than you'd expect. Sleep analysis is an `HKCategoryType`, not an `HKQuantityType` like steps. The Capacitor plugin abstracts this but the permission scoping can be confusing.

**Consequences:** Steps work but sleep data returns empty -- looks like a bug but is a permissions issue.

**Prevention:**
- Request both `steps` and `activity` (or `sleepAnalysis` depending on the plugin) in the `requestAuthorization` call
- Query sleep data specifically using `HKCategoryTypeIdentifier.sleepAnalysis` sample type
- Verify both data types are returning data in development before assuming the integration works

**Detection:** Steps populate but sleep shows empty/zero.

**V2 Phase:** HealthKit integration phase.

**Confidence:** MEDIUM -- based on plugin documentation; exact API may vary with plugin version.

**Sources:**
- [@perfood/capacitor-healthkit GitHub](https://github.com/perfood/capacitor-healthkit)

---

### 17. PrivacyInfo.xcprivacy Must Declare HealthKit and Purchase APIs

**What goes wrong:** The app already has a `PrivacyInfo.xcprivacy` Apple privacy manifest (added in v1.5). Adding HealthKit and RevenueCat introduces new API usage that must be declared in this manifest and in the App Store privacy nutrition labels.

**Why it happens:** Apple requires privacy manifests for apps using certain APIs. HealthKit data is "Health & Fitness" data. RevenueCat may access the device's advertising identifier or purchase history.

**Consequences:** Inaccurate privacy labels are a top rejection reason in 2025-2026. Apple flags apps where SDK usage doesn't match declared privacy practices.

**Prevention:**
- Update `PrivacyInfo.xcprivacy` to declare HealthKit data collection (health, fitness)
- Update App Store Connect privacy nutrition labels to include "Health & Fitness" data
- Check RevenueCat's privacy manifest documentation for any additional required declarations
- Declare that health data is collected for "App Functionality" (not advertising/tracking)

**Detection:** App Store submission validation error mentioning privacy manifest, or rejection citing inaccurate privacy labels.

**V2 Phase:** App Store submission phase. Update the manifest when adding each new capability.

**Confidence:** HIGH -- Apple enforces this strictly as of 2025.

**Sources:**
- [Apple: NSHealthShareUsageDescription](https://developer.apple.com/documentation/BundleResources/Information-Property-List/NSHealthShareUsageDescription)
- [Twinr: Apple App Store Rejection Reasons 2025](https://twinr.dev/blogs/apple-app-store-rejection-reasons-2025/)

---

### 18. Archetype DP Modifiers Create Balance Exploits

**What goes wrong:** The V2 spec includes 5 archetypes with DP modifiers (e.g., Bull archetype earns more DP for heavy lifts, Pup earns more for cardio). If the modifiers are unbalanced, users will pick the archetype with the highest total DP earning rate regardless of their actual training style, making the "personalization" feature into a min-maxing game.

**Why it happens:** Gamification systems are notoriously hard to balance before real user data exists. The modifiers interact with all DP-earning actions (workout, steps, macros, sleep, check-in), creating a complex matrix.

**Consequences:**
- One archetype dominates (everyone picks it) -- defeats personalization purpose
- Users who picked "wrong" archetype feel punished when they see others ranking up faster
- Rebalancing after launch requires retroactive DP adjustments or a reset

**Prevention:**
- Keep modifiers small (e.g., +10% for favored action, not +50%)
- Ensure ALL archetypes have the same theoretical maximum DP per day assuming perfect adherence
- Modifiers should shift WHERE DP comes from, not HOW MUCH total
- Launch with flat DP (no modifiers) and add modifiers in a later update after collecting real usage data
- If launching with modifiers, run a simulation: for each archetype, calculate DP earned over a typical week with average adherence

**Detection:** If analytics show >60% of users picking one archetype, it's unbalanced.

**V2 Phase:** Gamification system phase. Consider deferring modifiers to post-launch.

**Confidence:** MEDIUM -- this is a game design concern, not a technical one. Evidence is from gamification best practices, not verified technical documentation.

---

### 19. XP-Named CSS Tokens and Components Linger After Rename

**What goes wrong:** After renaming XP to DP conceptually, CSS custom properties (`--color-xp-bar`, `--color-xp-bar-bg`), component names (`XPDisplay.tsx`, `XPClaimModal.tsx`, `xpStore.ts`), analytics events, and Supabase columns (`xp_awarded`, `total_xp`, `current_level`) still reference "XP." This creates confusion for developers, inconsistent naming, and potential bugs if some code checks for "xp" in strings.

**Why it happens:** Renaming is tedious and easy to miss. The Supabase schema rename is particularly risky because it requires a migration.

**Consequences:**
- Developer confusion: "Is this the old system or new system?"
- Supabase columns named `xp_awarded` storing DP values -- semantic mismatch
- Analytics events referencing "XP" when the user-facing term is "DP"
- Old component names in code reviews cause misunderstanding

**Prevention:**
- Rename TypeScript files and exports in the V2 gamification phase (XPDisplay -> DPDisplay, xpStore -> dpStore, XPClaimModal -> DPClaimModal)
- Keep Supabase column names as-is (renaming columns is risky) but alias them in the query layer
- OR create new `user_dp` table with correct names and deprecate `user_xp`
- Update analytics event names (`XP Claimed` -> `DP Claimed`)
- Use `// V2: renamed from XP` comments where old names persist for backward compatibility

**Detection:** Search for "xp" (case-insensitive) in the codebase after migration -- any remaining references should be intentional.

**V2 Phase:** Gamification system phase. Rename alongside the functional rewrite.

**Confidence:** HIGH -- verified by finding all XP-named entities in the codebase.

---

### 20. StoreKit 2 Only Available iOS 16+ -- Older Devices Fall Back

**What goes wrong:** RevenueCat uses StoreKit 2 by default on iOS 16+ but falls back to StoreKit 1 on older versions. If the app's minimum deployment target includes iOS 15 (which Capacitor 7 supports), some users will use the older StoreKit 1 path which has different behavior for subscription management, receipt validation, and sandbox testing.

**Why it happens:** StoreKit 2 is a complete rewrite of Apple's purchase APIs with better async/await support, but it's not backward-compatible.

**Consequences:**
- Different purchase behavior on iOS 15 vs iOS 16+ devices
- Testing must cover both StoreKit paths
- Some RevenueCat features (like Customer Center) may only work with StoreKit 2

**Prevention:**
- Set the minimum deployment target to iOS 16 if the user base supports it (iOS 16 covers 95%+ of active devices as of 2026)
- If supporting iOS 15, test the purchase flow on both an iOS 15 and iOS 16+ device
- RevenueCat abstracts most differences, but edge cases exist around subscription status checking

**Detection:** Purchase failures on older devices that work fine on newer ones.

**V2 Phase:** RevenueCat integration phase. Decide the minimum iOS version at project setup.

**Confidence:** MEDIUM -- RevenueCat handles most abstraction, but edge cases are possible.

**Sources:**
- [RevenueCat: StoreKit 2 and Older iOS Versions](https://www.revenuecat.com/blog/engineering/ios-in-app-subscription-tutorial-with-storekit-2-and-swift/)

---

## Phase-Specific Warnings

| V2 Phase | Likely Pitfall | Severity | Mitigation |
|----------|---------------|----------|------------|
| **Project Setup** | Missing entitlements for HealthKit + IAP (#15) | Critical | Entitlements checklist before writing any code |
| **Coach Stripping** | Breaking sync/imports (#7) | Critical | Delete pure-coach files first, keep client-facing coach interaction, validate with `tsc` after each file |
| **Coach Stripping** | Orphaned coach types in database.types.ts | Minor | Keep them -- they match the Supabase schema |
| **Design System** | Color swap misses hardcoded values (#11) | Moderate | Comprehensive grep for all red-spectrum hex values |
| **Design System** | Lime on dark fails WCAG for text (#11) | Moderate | Test every text-on-primary combination for 4.5:1 contrast |
| **Gamification (DP/Ranks)** | localStorage key rename wipes data (#5) | Critical | Use Zustand migrate pattern, NOT key rename |
| **Gamification (DP/Ranks)** | XP-to-DP migration formula wrong (#4) | Critical | Percentage-of-max approach with edge case testing |
| **Gamification (DP/Ranks)** | Archetype balance exploits (#18) | Minor | Launch with flat DP or small modifiers |
| **HealthKit** | Permission denied cannot be re-prompted (#6) | Critical | Pre-permission screen with soft ask pattern |
| **HealthKit** | Data gaps look like bugs (#10) | Moderate | Track `healthKitConnected` flag, always support manual entry |
| **HealthKit** | Background delivery unreliable (#9) | Moderate | Query on foreground only, don't depend on background updates |
| **RevenueCat** | SDK init race condition (#1) | Critical | Loading gate pattern: splash until auth + RC both ready |
| **RevenueCat** | Plugin version vs Capacitor 7 (#13) | Moderate | Verify peer deps before writing code |
| **Paywall** | Missing restore button (#2) | Critical | Add to paywall AND settings |
| **Paywall** | Missing subscription legal text (#3) | Critical | Use the 10-item checklist |
| **Paywall** | Paywall too early (#12) | Moderate | Gate premium features, don't block core UX |
| **App Store Submission** | Products not fetchable by reviewer (#8) | Critical | Submit IAP with binary, handle empty offerings gracefully |
| **App Store Submission** | Privacy manifest outdated (#17) | Minor | Update when adding each new capability |
| **Database Migration** | New tables without RLS (#14) | Moderate | Copy RLS pattern from existing tables, test with non-owner |

---

## Apple App Store Review Checklist for V2 Submission

This consolidates all Apple-specific requirements discovered during research:

### Subscriptions (Guideline 3.1.1 / 3.1.2)
- [ ] Restore Purchases button on paywall screen
- [ ] Restore Purchases button in Settings
- [ ] Price in local currency displayed on paywall
- [ ] Billing period stated explicitly
- [ ] Auto-renewal disclaimer text
- [ ] Cancellation instructions text
- [ ] Link to Terms of Service
- [ ] Link to Privacy Policy
- [ ] Free trial terms (if applicable)
- [ ] "Cancel anytime" language
- [ ] Subscriptions submitted for review WITH app binary
- [ ] All territories have pricing configured
- [ ] Empty offerings handled gracefully (retry/fallback UI)

### HealthKit (Guideline 5.1.3 / 27.5)
- [ ] `NSHealthShareUsageDescription` in Info.plist
- [ ] `NSHealthUpdateUsageDescription` in Info.plist (if writing data)
- [ ] HealthKit entitlement in App.entitlements
- [ ] HealthKit enabled in Apple Developer portal App ID
- [ ] App provides core health/fitness functionality (not peripheral use)
- [ ] Health data NOT used for advertising or sold to third parties

### Privacy (Guideline 5.1.1 / 5.1.2)
- [ ] PrivacyInfo.xcprivacy updated for HealthKit + purchases
- [ ] App Store privacy nutrition labels include Health & Fitness data
- [ ] Privacy policy covers health data collection and usage

### General (Guideline 2.1 / 4.0)
- [ ] All features work during review (no broken purchase flows)
- [ ] Demo account credentials provided in App Review Information
- [ ] Notes for reviewer explaining how to test subscription
- [ ] Screenshots match actual app UI (no red if app is now lime)
- [ ] App works on reviewer's device (test on multiple iOS versions)

---

## Sources

### Official Documentation
- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple Auto-renewable Subscriptions](https://developer.apple.com/app-store/subscriptions/)
- [Apple HealthKit: Authorizing Access](https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data)
- [Apple HealthKit Background Delivery Entitlement](https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.healthkit.background-delivery)
- [Apple NSHealthShareUsageDescription](https://developer.apple.com/documentation/BundleResources/Information-Property-List/NSHealthShareUsageDescription)

### RevenueCat
- [RevenueCat Capacitor Installation](https://www.revenuecat.com/docs/getting-started/installation/capacitor)
- [RevenueCat App Store Rejections Guide](https://www.revenuecat.com/docs/test-and-launch/app-store-rejections)
- [RevenueCat State of Subscription Apps 2025](https://www.revenuecat.com/state-of-subscription-apps-2025/)
- [@revenuecat/purchases-capacitor npm](https://www.npmjs.com/package/@revenuecat/purchases-capacitor)
- [RevenueCat purchases-capacitor GitHub](https://github.com/RevenueCat/purchases-capacitor)

### HealthKit Plugins
- [@perfood/capacitor-healthkit GitHub](https://github.com/perfood/capacitor-healthkit)
- [@perfood/capacitor-healthkit npm](https://www.npmjs.com/package/@perfood/capacitor-healthkit)

### Zustand Migration
- [Zustand: Best way to run migration on first persist](https://github.com/pmndrs/zustand/discussions/1717)
- [How to migrate Zustand local storage store](https://dev.to/diballesteros/how-to-migrate-zustand-local-storage-store-to-a-new-version-njp)

### Community / Analysis
- [RevenueCat Community: Restore Purchases Rejection](https://community.revenuecat.com/sdks-51/we-get-rejected-from-apple-store-review-about-restore-purchases-693)
- [RevenueCat Community: Products Not Fetchable During Review](https://community.revenuecat.com/tips-discussion-56/unable-to-fetch-subscription-products-during-app-store-review-5564)
- [Apple Developer Forums: Background Delivery Issues](https://developer.apple.com/forums/thread/801627)
- [Adapty: App Store Review Guidelines 2026](https://adapty.io/blog/how-to-pass-app-store-review/)
- [Apphud: Design High-Converting Paywalls](https://apphud.com/blog/design-high-converting-subscription-app-paywalls)
