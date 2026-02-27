# Project Research Summary

**Project:** WellTrained V2 — RevenueCat Subscriptions, HealthKit, Design System, Gamification Engine
**Domain:** Freemium iOS fitness gamification app (Capacitor 7 + React 18 + Zustand + Supabase)
**Researched:** 2026-02-27
**Confidence:** HIGH

## Executive Summary

WellTrained V2 is a focused overhaul of an existing production app — not a greenfield build. The research confirms that all four major work streams (subscription monetization via RevenueCat, HealthKit integration, XP-to-DP gamification migration, and Dopamine Noir V2 design system) have well-documented implementation paths on the existing Capacitor 7 + React 18 + Zustand stack. Critically, only 3 new runtime dependencies are needed: `@revenuecat/purchases-capacitor@^11.3.2`, `@revenuecat/purchases-capacitor-ui@^11.3.2`, and `@capgo/capacitor-health@^7.2.15`. The gamification engine and design token migration require no new packages — they are pure TypeScript and CSS changes on the existing stack.

The recommended build order — strip coach code, swap design tokens, build DP engine, add RevenueCat, add HealthKit, build archetypes and quests — is derived directly from dependency analysis. Coach removal reduces ~4,600 lines of noise before building new features. Design tokens go second because all new UI must use V2 colors. The DP store must exist before health tracking or archetype modifiers can award points. RevenueCat must be initialized before any premium gating. This order is not arbitrary: reversing it creates rework. The architecture already proven by `xpStore.ts`, `achievementsStore.ts`, and `sync.ts` extends cleanly to all V2 systems.

The primary risk is App Store rejection. Eight of the twenty documented pitfalls are rejection vectors: missing restore purchases button, missing subscription legal text, missing IAP and HealthKit entitlements, RevenueCat SDK initialization race condition, stale PrivacyInfo.xcprivacy, products not fetchable during review, and the HealthKit permission irrevocability issue. Every one of these is preventable with a checklist-first approach. The secondary risk is data loss: XP-to-DP migration and Zustand localStorage key renaming both silently destroy user progress if not handled via the `version + migrate` pattern. Both must be addressed before any gamification code ships.

## Key Findings

### Recommended Stack

The existing stack handles everything. No framework changes, no new bundler, no CSS-in-JS, no game engine. Three native plugins are added: RevenueCat's official Capacitor plugin (v11.3.2, the last Capacitor 7-compatible version — v12.x requires Capacitor 8), and Capgo's CapacitorHealth plugin (v7.2.15) for HealthKit. When the project migrates to Capacitor 8 before the April 2026 App Store deadline, RevenueCat bumps to v12.x and CapacitorHealth bumps to v8.x simultaneously — a clean, coordinated upgrade path documented in STACK.md.

See `.planning/research/STACK.md` for full installation commands, configuration changes, and RevenueCat dashboard setup steps.

**Core technologies:**
- `@revenuecat/purchases-capacitor@^11.3.2`: iOS IAP subscriptions — only viable Capacitor 7 option; handles StoreKit 2 receipt validation, entitlements, webhooks automatically
- `@revenuecat/purchases-capacitor-ui@^11.3.2`: Native paywall UI — saves building purchase flow from scratch, configurable in RevenueCat dashboard without code changes
- `@capgo/capacitor-health@^7.2.15`: HealthKit steps + sleep — only actively maintained Capacitor 7-compatible HealthKit plugin; competitors (`@perfood`) are dead on Capacitor 4
- New Zustand stores (pure TS, no new deps): `dpStore`, `subscriptionStore`, `healthStore`, `questStore`
- New Supabase migrations: `user_dp`, `subscriptions`, `daily_health` tables + `handle-revenuecat-webhook` Edge Function
- Design token migration: CSS custom property values only in `src/index.css` — no structural changes, no new dependencies

**Critical version constraint:** RevenueCat v12.x requires Capacitor 8. Do not attempt to use v12 until the Capacitor 8 migration completes (required before April 28, 2026). Pin to `^11.3.2`.

### Expected Features

See `.planning/research/FEATURES.md` for full dependency graph and phased MVP recommendation.

**Must have (table stakes):**
- DP earning on workout completion and meal tracking — replaces XP, core daily loop
- 15-rank progression display with rank-up celebration — primary motivation replacing 99-level system
- Lime (#C8FF00) design system applied to all screens — V2 brand identity
- Freemium paywall with subscription restore — revenue model and Apple compliance requirement
- Steps + sleep tracking (HealthKit + manual fallback) — new DP earning actions
- Bro archetype (free default) — generalist baseline with no modifiers
- Coach dashboard removal — ~4,600 lines deleted before new features are built
- DP persistence in Supabase — server truth needed for future leaderboards and coach visibility

**Should have (differentiators):**
- Premium archetypes (Himbo/Brute/Pup/Bull) with DP modifiers — core subscription conversion driver
- Evolving avatar silhouette (5 stages tied to rank milestones) — premium visual reward; stages 3-5 are premium-gated
- Protocol Orders (daily/weekly quests) — engagement layer; weekly quests premium-gated
- Bull archetype PR bonus (+50 DP for personal records) — requires PR detection in workout store
- Archetype modifier visualization — shows users how their archetype boosts earnings (incentivizes upgrade even for free users)

**Defer to post-V2:**
- Streak multiplier — spec explicitly marks as future phase; would require rank curve rebalancing
- Community leaderboard — requires social infrastructure, not V2 scope
- Custom themes or alternate app icons — needs theming abstraction beyond current single-theme
- Android support — HealthKit and RevenueCat configured as iOS-only in V2

### Architecture Approach

The V2 architecture follows the same proven patterns already in the codebase: cross-store reads via `getState()` (not subscriptions) to avoid circular dependencies, `isNative()` guards on all Capacitor plugin calls, Zustand `version + migrate` for all breaking state changes, and `pushClientData()` as the single egress point to Supabase. The key structural change is that `pullCoachData()` is removed from `sync.ts` entirely — trained-app becomes a client-only app that pushes data and receives subscription state from webhooks. RevenueCat entitlement state is the new async "pull" replacing coach data, but it flows through a Zustand `subscriptionStore` with localStorage persistence so premium gates render synchronously on cold start.

See `.planning/research/ARCHITECTURE.md` for full store interfaces, data flow diagrams, and the ordered 11-step build sequence.

**Major components:**
1. `dpStore` — DP accrual, rank calculation, archetype modifier application; reads cross-store via `getState()`; replaces `xpStore` with new localStorage key `trained-dp`; includes XP-to-DP migration via Zustand `migrate` function
2. `subscriptionStore` — RevenueCat entitlement state cached in localStorage; client-side primary gate with server-side webhook as fraud-prevention backup; includes 90-day grace period for legacy accessStore holders
3. `healthStore` — HealthKit steps/sleep with manual fallback; syncs on foreground only (no background delivery); dual-source design where manual entry always overrides HealthKit
4. `questStore` — Protocol Orders (daily/weekly quests); client-generated from template pool; progress evaluated via cross-store reads matching the achievementsStore pattern
5. `handle-revenuecat-webhook` (Supabase Edge Function) — processes INITIAL_PURCHASE/RENEWAL/CANCELLATION/EXPIRATION; writes to `subscriptions` table with service_role key; RLS prevents client-side spoofing of premium status
6. Coach removal — 5-step ordered deletion with `tsc --noEmit` validation after each step to catch cascading TypeScript errors before they compound

### Critical Pitfalls

Full details in `.planning/research/PITFALLS.md` (20 pitfalls, 8 critical, 7 moderate, 5 minor).

1. **RevenueCat SDK initialization race condition** — premium users see paywall on launch before entitlements load; free users briefly see premium content. Prevention: loading gate pattern (show splash until auth AND RevenueCat both initialized); persist last-known entitlement state in `subscriptionStore` localStorage for synchronous cold-start rendering.

2. **XP-to-DP migration + localStorage key rename wipes user progress** — Zustand silently initializes to default state if the persist key changes. Prevention: always use Zustand `version + migrate` pattern; `dpStore` reads old `gamify-gains-xp` key in its migrate function and maps XP level to approximate DP rank; never rename persist keys without migration; test with level 0, 15, and 50+ edge cases.

3. **Missing Restore Purchases button** — single most common subscription-related App Store rejection (Guideline 3.1.1). Prevention: add "Restore Purchases" to both the paywall screen AND Settings; test restore flow with sandbox accounts before submission.

4. **HealthKit permission is one-shot and irrevocable** — iOS cannot re-prompt after denial; app cannot distinguish "denied" from "no data available." Prevention: soft-ask screen explaining WHY the app needs HealthKit access before calling the native permission; build manual entry as first-class (not an afterthought); show "Check Settings > Health > WellTrained" banner when data is missing.

5. **Apple review cannot test subscriptions** — `getOfferings()` returns empty, reviewer sees blank paywall, rejection under Guideline 2.1. Prevention: submit IAP products for review WITH the app binary; handle empty offerings gracefully with retry UI; configure pricing for all territories; include sandbox test instructions in App Review Notes.

## Implications for Roadmap

Based on the dependency graph in FEATURES.md and the ordered build sequence in ARCHITECTURE.md, the following 8-phase structure is recommended. All 4 research files converge on this ordering.

### Phase 1: Foundation Cleanup
**Rationale:** Coach removal reduces ~4,600 lines of entangled code before new features add more complexity. Design token migration gives every subsequent screen the correct V2 visual foundation without component-by-component rework. Both are zero-dependency — they unblock everything else without requiring any new infrastructure.
**Delivers:** Codebase without coach dashboard; app running Dopamine Noir V2 color system throughout
**Addresses:** Coach dashboard removal (table stakes), design system migration (table stakes)
**Avoids:** Pitfall #7 (coach stripping breaks sync/imports) — use the 5-step deletion order with `tsc --noEmit` after each step; Pitfall #11 (color swap misses hardcoded values) — grep for all red-spectrum hex values before and after

### Phase 2: Gamification Engine (DP/Ranks)
**Rationale:** All health, archetype, and quest features award DP. The `dpStore` must exist before any of them can function. This is the hard critical path dependency. This phase also contains the highest data-loss risk, which must be resolved before the app ships to production.
**Delivers:** `dpStore` replacing `xpStore`, 15-rank progression display, rank-up celebration, basic DP earning (workout + meals + protein + check-in), XP-to-DP migration via Zustand `migrate`
**Addresses:** DP store (table stakes), rank progression display (table stakes), rank-up celebration (table stakes), Obedience Streak rename (table stakes)
**Avoids:** Pitfall #4 (XP-to-DP migration destroys progress) — percentage-of-max mapping with edge case testing; Pitfall #5 (localStorage key rename wipes state) — `version + migrate` pattern; Pitfall #19 (XP-named tokens and components linger)

### Phase 3: RevenueCat Subscriptions + Paywall
**Rationale:** Subscription gating is needed before archetype selection (premium archetypes are the core monetization driver). RevenueCat must be initialized early in the app lifecycle — the loading gate pattern is easier to implement before adding more startup complexity. Xcode entitlements must also be configured before any premium feature works on a real device.
**Delivers:** `subscriptionStore`, RevenueCat initialization with loading gate, paywall screen with full legal text, restore purchases in paywall + settings, `handle-revenuecat-webhook` Edge Function, `subscriptions` Supabase table with RLS, legacy accessStore 90-day grace period
**Addresses:** Freemium paywall (table stakes), subscription restore (table stakes)
**Avoids:** Pitfall #1 (RC initialization race) — loading gate + cached entitlement state; Pitfall #2 (missing restore button); Pitfall #3 (missing subscription legal text) — 10-item checklist from PITFALLS.md; Pitfall #8 (products not fetchable during review); Pitfall #15 (missing IAP entitlement) — Xcode capability checklist

### Phase 4: HealthKit Integration
**Rationale:** Depends on `dpStore` existing to award steps/sleep DP. Steps and sleep are new DP earning actions that expand the daily engagement loop beyond workout + meal tracking. Manual entry must be first-class from the start — it is both the web fallback and the graceful degradation path for iOS users who deny HealthKit.
**Delivers:** `healthStore`, HealthKit permission soft-ask screen, steps auto-population from HealthKit, sleep auto-population from HealthKit, manual fallback entry for both, foreground-only sync via existing `appStateChange` listener, `daily_health` Supabase table
**Addresses:** Steps tracking (table stakes), sleep tracking (table stakes)
**Avoids:** Pitfall #6 (HealthKit permission irrevocable) — soft-ask screen before native call; Pitfall #9 (background delivery unreliable) — foreground-only architecture, no background queries; Pitfall #10 (data gaps indistinguishable from denial) — `healthKitConnected` flag + always-available manual entry; Pitfall #15 (missing HealthKit entitlement); Pitfall #16 (sleep needs correct permission scope)

### Phase 5: Archetype System
**Rationale:** Depends on `dpStore` (to apply DP modifiers) and `subscriptionStore` (to gate 4 of 5 archetypes). This is the core subscription conversion driver — free users on Bro archetype who can see Himbo/Brute/Pup/Bull locked behind premium have a clear upgrade incentive.
**Delivers:** Archetype selection UI (onboarding + settings), `userStore.profile.archetype` field, archetype DP modifier logic in `dpStore`, premium gate for Himbo/Brute/Pup/Bull, archetype modifier visualization screen, `profiles.archetype` Supabase column, PR detection for Bull archetype bonus
**Addresses:** Premium archetypes (differentiator), Bro archetype free default (table stakes)
**Avoids:** Pitfall #18 (archetype balance exploits) — launch with conservative modifiers where all archetypes have same theoretical max DP per day; simulation pass required before implementation

### Phase 6: Protocol Orders (Quests)
**Rationale:** Depends on `dpStore`, `healthStore`, `workoutStore`, and `subscriptionStore` all being stable. Quest progress evaluation reads from all of these via cross-store `getState()` calls. Weekly quests are premium-gated. This is the last major engagement system and can ship after the core progression loop is validated in production.
**Delivers:** `questStore`, daily quest rotation with 3 quests, weekly quest rotation (premium, 2 quests), quest completion tracking, bonus DP awards, Protocol Orders UI screen
**Addresses:** Protocol Orders (differentiator)
**Avoids:** Cross-store circular dependency — use direct store imports (not barrel `@/stores`) matching the established sync.ts and achievementsStore pattern

### Phase 7: Avatar Evolution + Polish
**Rationale:** Depends on `dpStore.currentRank` for stage calculation and `subscriptionStore` for premium gate on stages 3-5. Visual polish layer that completes the V2 brand experience. Ships last because it depends on the rank system being stable and avatar SVG assets being ready (art asset dependency).
**Delivers:** 5-stage evolving avatar silhouette (requires 5 SVG illustrations), avatar stage transitions tied to rank milestones (ranks 1/4/8/12/15), premium gate on stages 3-5, `achievementsStore` updated to reference `dpStore` instead of `xpStore`, updated onboarding flow incorporating archetype + avatar
**Addresses:** Evolving avatar (differentiator)
**Avoids:** Pitfall #17 (PrivacyInfo.xcprivacy outdated) — update manifest to declare HealthKit and StoreKit API usage added in earlier phases

### Phase 8: App Store Submission
**Rationale:** Dedicated submission phase to run all compliance checklists, verify sandbox purchase flows on real devices, and submit IAP products with the binary. Not additional development — a required QA + submission gate to prevent rejection cycles that would delay the April 2026 Capacitor 8 deadline.
**Delivers:** App Store submission, TestFlight external beta, screenshots with V2 lime UI, PrivacyInfo.xcprivacy final update, sandbox purchase flow sign-off, App Review Notes with test instructions, all territory pricing configured
**Addresses:** DP persistence in Supabase (table stakes — `user_dp` table sync), all Apple compliance requirements
**Avoids:** Pitfall #8 (products not fetchable during review) — submit IAP with binary; Pitfall #17 (PrivacyInfo outdated); full Apple App Store Review Checklist from PITFALLS.md (13 subscription items, 6 HealthKit items, 4 privacy items, 5 general items)

### Phase Ordering Rationale

- Coach removal and design tokens (Phase 1) have zero dependencies and must precede all V2 UI work — building screens before token migration means doing visual work twice
- The DP store (Phase 2) precedes HealthKit, archetypes, and quests because all three depend on it — this is a hard technical dependency, not a preference
- RevenueCat (Phase 3) before HealthKit (Phase 4) because premium gating infrastructure should be established before adding new DP sources that might themselves be gated
- Archetypes (Phase 5) after RevenueCat because the premium gate must exist before premium archetypes can be unlocked
- Quests (Phase 6) last among new features because they depend on the most stores; building them last means those stores are stable and tested
- Avatar (Phase 7) last among feature phases due to art asset dependency and rank system stability requirement
- App Store submission (Phase 8) as a named phase forces explicit checklist discipline and makes the deadline constraint visible in the roadmap

### Research Flags

Phases likely needing `/gsd:research-phase` during planning:
- **Phase 3 (RevenueCat):** Sandbox testing setup, App Store Connect product configuration steps, and the exact Supabase webhook authentication pattern are well-documented but implementation-specific enough to warrant a planning spike before writing code. Also confirm the Xcode entitlements checklist is complete before any native builds.
- **Phase 4 (HealthKit):** Sleep data aggregation from overlapping samples (Apple Watch + iPhone + third-party apps) is flagged MEDIUM confidence in ARCHITECTURE.md. The `@capgo/capacitor-health` sleep API behavior should be validated on a real device before committing to the full implementation plan. Steps are HIGH confidence; sleep needs a spike.
- **Phase 5 (Archetypes):** Archetype DP modifier balance values are not in the spec. Requires a simulation pass (calculate max/avg DP per archetype per week with average adherence) before numeric values are committed to implementation.

Phases with standard patterns (research not needed):
- **Phase 1 (Foundation Cleanup):** CSS token migration is a value swap in one file. Coach removal has a fully documented 5-step deletion order in ARCHITECTURE.md. Both are HIGH confidence, no surprises expected.
- **Phase 2 (Gamification Engine):** Zustand persist migration is well-documented. DP math is spec-defined. `xpStore.ts` is the reference implementation proving the architecture works. HIGH confidence.
- **Phase 6 (Quests):** Protocol Orders use the same cross-store `getState()` pattern as `achievementsStore`. No novel patterns. Quest generation from template pool is standard client-side logic.
- **Phase 7 (Avatar + Polish):** Avatar stage derivation from rank is pure math. `achievementsStore` update is a reference swap. No new architectural patterns needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All 3 new packages verified via `npm view` on 2026-02-27. RC v11.3.2 peer dep confirmed (`@capacitor/core >=7.0.0`). CapacitorHealth v7.2.15 confirmed. Version constraint documented and upgrade path clear. |
| Features | HIGH | V2 spec analyzed directly. Existing codebase audited for all affected stores and files. Feature dependency graph explicitly mapped. Anti-features documented with technical rationale (not just product preference). |
| Architecture | HIGH | Based on direct codebase analysis of all 11 stores, sync.ts, App.tsx, and index.css. Data flow diagrams derived from existing proven patterns. One MEDIUM area: sleep data aggregation from multiple HealthKit sources needs device validation. |
| Pitfalls | HIGH | 20 pitfalls documented. 15 rated HIGH confidence (verified against official Apple docs, RevenueCat docs, direct codebase inspection). 5 rated MEDIUM (game design heuristics / community consensus). Phase-specific warning table maps every pitfall to the phase where it must be addressed. |

**Overall confidence:** HIGH

### Gaps to Address

- **Sleep data aggregation:** The exact logic for deduplicating overlapping HealthKit sleep samples (Apple Watch + iPhone + third-party apps) is documented at the concept level but needs real-device validation before Phase 4 implementation commits to a specific approach. Manual entry is the failsafe if this proves unexpectedly complex.
- **Archetype DP modifier values:** The V2 spec defines modifier categories (Himbo boosts training DP, Pup boosts cardio/steps, etc.) but not final numeric values. A balance simulation pass is required before Phase 5. Constraint: all archetypes must have the same theoretical maximum DP per day with perfect adherence.
- **Capacitor 8 migration timing:** RevenueCat v11.x supports Capacitor 7. Capacitor 8 is required before April 28, 2026 for App Store submission. V2 feature development must complete with buffer time for the Capacitor upgrade + regression testing. This constrains the roadmap end date — not a research gap, but a scheduling constraint the roadmapper must account for.
- **Access code grandfathering transition:** The 90-day grace period for existing accessStore holders is architecturally sound, but the user-facing communication (in-app messaging, email) and the technical cleanup (removing accessStore after 90 days) are not fully specified. Address during Phase 3 planning.
- **Avatar SVG assets:** 5 evolving silhouette stages must be designed and commissioned before Phase 7 can complete. This is an art asset dependency — not a technical gap — but it creates a lead time constraint. Commission assets no later than Phase 4 to avoid blocking Phase 7.
- **WCAG contrast for lime on dark text:** `--primary-foreground` must be dark (`#0A0A0A`) when lime is used as a background — different from V1 where red used white foreground. All text-on-lime combinations need WCAG AA (4.5:1) verification during Phase 1 token migration. Previous milestones showed planned color values failed contrast checks (corrected during execution) — verify proactively this time.

## Sources

### Primary (HIGH confidence)
- WellTrained V2 Master Specification (in-repo) — all feature definitions, DP math, rank thresholds, archetype descriptions
- Existing codebase (all 11 stores, sync.ts, App.tsx, index.css) — architecture patterns and current system state
- [RevenueCat Capacitor docs](https://www.revenuecat.com/docs/getting-started/installation/capacitor) — SDK integration pattern
- [RevenueCat App Store Rejections Guide](https://www.revenuecat.com/docs/test-and-launch/app-store-rejections) — subscription compliance requirements
- [RevenueCat Webhooks](https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields) — event types and fields
- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) — Guideline 3.1.1, 3.1.2, 5.1.3, 27.5
- [Apple: Authorizing Access to Health Data](https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data) — permission irrevocability behavior
- [Apple Auto-renewable Subscriptions](https://developer.apple.com/app-store/subscriptions/) — required subscription UI elements
- [@revenuecat/purchases-capacitor npm](https://www.npmjs.com/package/@revenuecat/purchases-capacitor) — v11.3.2 peer dep verification
- [@capgo/capacitor-health npm](https://www.npmjs.com/package/@capgo/capacitor-health) — v7.2.15 peer dep verification
- [Zustand persist migration](https://github.com/pmndrs/zustand/discussions/1717) — version + migrate pattern

### Secondary (MEDIUM confidence)
- [RevenueCat State of Subscription Apps 2025](https://www.revenuecat.com/state-of-subscription-apps-2025/) — paywall timing and conversion rate data
- [Apple Developer Forums: HealthKit background delivery](https://developer.apple.com/forums/thread/801627) — background delivery behavior on battery
- [Adapty: App Store Review Guidelines 2026](https://adapty.io/blog/how-to-pass-app-store-review/) — submission checklist corroboration
- [@capgo/capacitor-health GitHub](https://github.com/Cap-go/capacitor-health) — sleep API surface documentation (needs device validation)
- [RevenueCat community: Products not fetchable during review](https://community.revenuecat.com/tips-discussion-56/unable-to-fetch-subscription-products-during-app-store-review-5564) — reviewer testing pattern

### Tertiary (LOW confidence)
- Archetype DP modifier balance values — game design inference; needs simulation validation before implementation commits to specific numbers

---
*Research completed: 2026-02-27*
*Ready for roadmap: yes*
*Synthesized from: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md*
