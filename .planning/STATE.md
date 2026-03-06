# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-06)

**Core value:** Daily discipline earns visible rank progression -- the app makes consistency feel like leveling up
**Current focus:** v2.1 Onboarding Redesign

## Current Position

Phase: 28 - Archetype and Macros
Plan: 01 complete (1/2 plans in phase)
Status: In progress
Last activity: 2026-03-06 -- Completed 28-01 ArchetypeScreen

Progress: [=============_______] 65%

## Performance Metrics

**Prior Milestones:**
- v1.0 Launch Polish: 5 phases, 10 plans
- v1.1 Design Refresh: 7 phases, 12 plans (1.48 hours, avg 7.4min/plan)
- v1.2 Pre-Launch Confidence: 4 phases, 8 plans (1.01 hours, avg 7.9min/plan)
- v1.3 Coach Dashboard: 6 phases, 18 plans (61min, avg 3.4min/plan)
- v1.4 Intake Dashboard: 4 phases (built outside GSD)
- v1.5 Native iOS App: 6 phases, 12 plans (closed -- App Store submission pending Apple approval)

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 17-01 | Strip Coach Dashboard | 4min | 2 | 8 |
| 17-02 | Dopamine Noir V2 Design Tokens | 5min | 2 | 6 |
| 18-01 | dpStore Core | 8min | 2 | 11 |
| 18-02 | Gamification UI | 11min | 2 | 9 |
| 18-03 | Macros Rank-Up Modal | 2min | 1 | 1 |
| 19-01 | SDK Setup | 6min | 2 | 10 |
| 19-02 | Paywall and Terms UI | 4min | 2 | 4 |
| 19-03 | Webhook and Subscriptions Table | 2min | 2 | 2 |
| 19-04 | Premium Feature Gating | 2min | 2 | 3 |
| 20-01 | HealthKit Infrastructure | 5min | 2 | 7 |
| 20-02 | Health UI Components | 4min | 2 | 6 |
| 21-01 | Archetype Selection UI | 5min | 3 | 8 |
| 21-02 | Archetype DP Modifiers | 2min | 2 | 4 |
| 22-01 | Quest Infrastructure | 4min | 2 | 3 |
| 22-02 | Protocol Orders UI | 5min | 2 | 3 |
| 23-01 | Avatar Stage Components | 3min | 2 | 9 |
| 23-02 | Screen Integration | 2min | 2 | 2 |
| 25-01 | OnboardingStack Infrastructure | 4min | 3 | 7 |
| 26-01 | WelcomeScreen | 2min | 2 | 3 |
| 26-02 | ValueScreen | 3min | 3 | 5 |
| 27-01 | ProfileScreen | 2min | 2 | 3 |
| 27-02 | GoalScreen | 2min | 2 | 3 |
| 28-01 | ArchetypeScreen | 2min | 2 | 3 |

## Accumulated Context

### Decisions

- v1.5 closed as-is; App Store submission moves to V2 Phase 24
- Coach dashboard stripped from trained-app; lives in welltrained-coach (17-01: code deletion complete, 4276 lines removed)
- Coach response modal removed from client app -- responses viewed in welltrained-coach only
- RevenueCat for iOS IAP subscriptions (pinned to v11.3.2 for Capacitor 7)
- HealthKit via @capgo/capacitor-health for steps/sleep with manual fallback
- "Bro" is free generalist archetype; 4 premium archetypes drive subscription conversion
- Lime signal #C8FF00 replaces red #D55550 as primary brand color
- Dopamine Noir V2 color system fully applied: all CSS tokens, confetti, mask-icon updated (17-02)
- Border/input (#2A2A2A) kept distinct from card (#26282B) for visible card boundaries
- Rank badge thresholds mapped proportionally from 99-level to 15-rank: level 5->rank 3, level 10->rank 5, level 25->rank 8, level 50->rank 12
- V2 weekly claim reminder disabled (DP accrues immediately, no claim gate)
- Settings export format v2 with dp section; V1 xp import preserved as legacy fallback
- Onboarding no longer initializes xpStore -- dpStore starts at rank 1 by default
- RankUpModal auto-closes after 3 seconds with tap-to-dismiss and local notification
- CheckInModal prevents double-counting DP by checking todayLog before awarding
- Home streak validation resets stale streaks on mount (gap > 1 day)
- getAvatarStage() exported from AvatarScreen for Phase 23 avatar SVG wiring
- ENTITLEMENT_ID='premium' for RevenueCat -- must match dashboard config (19-01)
- subscriptionStore only persists isPremium, not offerings/customerInfo (19-01)
- Paywall auto-redirects to home if isPremium is true (19-02)
- Purchase cancellation handled silently, no error toast (19-02)
- Settings subscription section guarded with isNative() (19-02)
- [Phase 19]: Bearer token auth for webhook (REVENUECAT_WEBHOOK_SECRET), not Supabase JWT
- [Phase 19]: UNIQUE(user_id) on subscriptions table for upsert pattern - one record per user
- [Phase 19-04]: PremiumGate wrapper with web bypass (isNative check) and UpgradePrompt fallback variants
- [Phase 20-01]: Sleep HealthKit integration deferred - @capgo/capacitor-health does not support sleep data type
- [Phase 20-01]: readTodaySleep returns 0 - manual entry required for sleep tracking
- [Phase 20-01]: Steps read via readSamples + manual sum (queryAggregated not available in plugin API)
- [Phase 20-02]: HealthPermission shown once after onboarding for iOS users with unknown permission status
- [Phase 20-02]: HealthCard awards DP with todayLog guard (same pattern as CheckInModal)
- [Phase 20-02]: ManualHealthEntry allows overriding HealthKit values with manual input
- [Phase 21-01]: Bro is free generalist; Himbo/Brute/Pup/Bull require premium
- [Phase 21-01]: ARCHETYPE_MODIFIERS prepared for Plan 02 DP calculation integration
- [Phase 21-01]: Bull streak bonuses deferred to v2.1 (empty modifier for now)
- [Phase 21-02]: Duplicated DP_VALUES in constants.ts to avoid circular import
- [Phase 21-02]: Meal cap enforced before modifier (cap is on count, not DP value)
- [Phase 21-02]: archetype column uses text with CHECK constraint rather than enum type
- [Phase 22]: Quest bonus DP bypasses archetype modifiers (direct totalDP add)
- [Phase 22]: Seeded shuffle for deterministic quest rotation (date+userId for daily, weekString+userId for weekly)
- [Phase 22-02]: Module-level store subscriptions avoid duplicate listeners on component re-render
- [Phase 22-02]: Non-premium users see locked weekly quest preview (not hidden) to drive conversion
- [Phase 22-02]: Streak display kept outside ProtocolOrders to maintain existing streak card styling
- [Phase 23]: Placeholder SVG silhouettes designed for easy swap when artist assets arrive
- [Phase 23-02]: EvolvingAvatar reads currentRank internally via dpStore subscription
- [Phase 23-02]: Transition wrapper (duration-500 ease-out) for smooth avatar stage changes
- [Phase 25]: [Phase 25-01]: onboarding-v2 folder used to avoid case-insensitive conflict with existing Onboarding.tsx
- [Phase 25]: [Phase 25-01]: localStorage key welltrained-onboarding-v2 avoids conflict with existing onboarding progress
- [Phase 25]: [Phase 25-01]: OnboardingStack URL syncs with onboardingStore.currentStep via useEffect
- [Phase 26]: [Phase 26-01]: Gold (#D4A853) wordmark matches mockup brand identity
- [Phase 26]: [Phase 26-01]: Cubic-bezier ease values used for framer-motion TypeScript compatibility
- [Phase 26]: [Phase 26-01]: 5-dot progress indicator shows first dot active
- [Phase 26]: [Phase 26-02]: ProgressIndicator reusable component with totalSteps/currentStep props
- [Phase 26]: [Phase 26-02]: Benefit row stagger animations (0.4s headline delay, 0.1s row stagger)
- [Phase 27]: [Phase 27-01]: Local state for form values, committed to store on CONTINUE tap
- [Phase 27]: [Phase 27-01]: Gold (#D4A853) border with 8% tint for selected states
- [Phase 27]: [Phase 27-01]: Training days chip scale-110 on selection for visual emphasis
- [Phase 27]: [Phase 27-01]: ProgressIndicator currentStep=1 (second dot) for profile screen
- [Phase 27]: [Phase 27-02]: ProgressIndicator currentStep=2 (third dot) for goal screen
- [Phase 27]: [Phase 27-02]: Gold icons always visible on goal cards (not conditional on selection)
- [Phase 28]: [Phase 28-01]: Bro pre-selected as default archetype (free tier default)
- [Phase 28]: [Phase 28-01]: Bull dimmed at 40% opacity with COMING SOON badge (not yet implemented)
- [Phase 28]: [Phase 28-01]: ProgressIndicator currentStep=3 (fourth dot) for archetype screen
- [Phase 28]: [Phase 28-01]: Badge variants: FREE=#22C55E, PREMIUM=#D4A853, COMING SOON=#3F3F46

### Pending Todos

- Apple Developer account verification (submitted, awaiting response)
- Commission avatar SVG assets (5 stages) before Phase 23
- Archetype DP modifier balance simulation needed before Phase 21
- Capacitor 7->8 migration needed before April 28, 2026 Apple deadline

### Blockers/Concerns

- Apple Developer enrollment awaiting approval (blocks App Store submission, not development)
- Capacitor 7->8 migration constrains roadmap end date
- Sleep data aggregation from multiple HealthKit sources needs device validation (Phase 20)

## Session Continuity

Last session: 2026-03-06
Stopped at: Completed 28-01-PLAN.md (ArchetypeScreen)
Resume file: None -- ready for 28-02
