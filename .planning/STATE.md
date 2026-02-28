# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-27)

**Core value:** Daily discipline earns visible rank progression -- the app makes consistency feel like leveling up
**Current focus:** v2.0 Phase 21 (Archetypes)

## Current Position

Phase: 21 of 24 (Archetypes) - IN PROGRESS
Plan: 1 of 2 in current phase (21-01 complete)
Status: Executing
Last activity: 2026-02-28 -- Completed 21-01 (Archetype Selection UI)

Progress: [############______] 67% (12/18 plans)

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

Last session: 2026-02-28
Stopped at: Completed 21-01-PLAN.md (Archetype Selection UI)
Resume file: None
