# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-07)

**Core value:** Daily discipline earns visible rank progression -- the app makes consistency feel like leveling up
**Current focus:** v2.3 Engagement & Growth

## Current Position

Phase: 43 (Referral Rewards)
Plan: 01 (of 02)
Status: Complete
Last activity: 2026-03-07 — Completed 43-01 (Referral Premium Grant)

Progress: ⬛⬛⬛ (7/9 plans complete)

## Performance Metrics

**Prior Milestones:**
- v1.0 Launch Polish: 5 phases, 10 plans
- v1.1 Design Refresh: 7 phases, 12 plans (1.48 hours, avg 7.4min/plan)
- v1.2 Pre-Launch Confidence: 4 phases, 8 plans (1.01 hours, avg 7.9min/plan)
- v1.3 Coach Dashboard: 6 phases, 18 plans (61min, avg 3.4min/plan)
- v1.4 Intake Dashboard: 4 phases (built outside GSD)
- v1.5 Native iOS App: 6 phases, 12 plans (closed -- App Store submission pending Apple approval)
- v2.0 WellTrained V2: 7 phases, 17 plans (17/17 complete, Phase 24 deferred)
- v2.1 Onboarding Redesign: 5 phases, 9 plans (9/9 complete)
- v2.2 Auth Flow Redesign: 7 phases, 20 plans (19/20 complete, 1 plan remaining)
- v2.2.1 Social Sharing: 4 phases, 6 plans (6/6 complete, shipped 2026-03-07)

**v2.3 Engagement & Growth:**
- Total phases: 3 (Phases 41-43)
- Total plans: 9 (3 per phase)
- Plans complete: 7

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 41 | 01 | 5min | 2 | 3 |
| 41 | 02 | 7min | 3 | 5 |
| 41 | 03 | 5min | 2 | 4 |
| 42 | 01 | 4min | 2 | 4 |
| 42 | 02 | 5min | 2 | 3 |
| 42 | 03 | 8min | 3 | 5 |
| 43 | 01 | 3min | 2 | 5 |

### Decisions

**v2.3 Roadmap:**
- 3 phases: Weekly Report (all 7 WRPT reqs) → Referral System (6 REFR reqs) → Referral Rewards (2 REFR reqs)
- Condensed from 6 phases per user preference
- Push notifications reuse v1.5 infrastructure (APNs direct, no Firebase)
- Deep linking reuses v1.5 infrastructure (Universal Links)
- Share cards reuse v2.2.1 infrastructure (html-to-image, native sheet)
- RevenueCat promotional entitlement for 7-day Premium trial

**v2.2.1:**
- 4 phases following feature brief implementation order (infrastructure first, then card-by-card)
- DP rewards gated by daily limits (workout/compliance) and per-rank (rank-up)
- Web platform shows "Download Card" fallback instead of native share
- Camera compositing is final step after basic workout sharing works

**v2.2:**
- 3-pass implementation per screen (Build / Review / Refine) for mockup fidelity
- Apple + Google Sign-In as primary auth methods, email as secondary
- Obsidian design tokens (#0A0A0A bg, #D4A853 gold accents)
- AuthStack separate from OnboardingStack -- auth first, then onboarding for new users

**v2.1:**
- Value-first onboarding (show transformation promise before asking for data)
- Reverse trial (7-day free Premium for users who skip paywall)
- 8-screen flow (shorter than previous 10-step)

**v2.0:**
- Capacitor over React Native (preserves entire React codebase)
- iOS only (most fitness users on iPhone)
- Direct APNs (no Firebase, Supabase Edge Functions)
- RevenueCat for subscriptions (handles StoreKit)
- HealthKit + manual fallback (permission-gated)
- Lime signal color (#C8FF00)
- 15 ranks over 99 levels
- 5 archetypes (1 free, 4 premium)

**Implementation Details:**
- 30-01: Used @southdevs/capacitor-google-auth instead of @codetrix-studio (Capacitor 7 compatibility)
- 30-01: Native sign-in returns to Supabase via signInWithIdToken, not OAuth redirect flow
- 30-02: Used auth-screens/ directory instead of auth/ to avoid case collision with existing Auth.tsx
- 31-01: Used inline SVG React component instead of file import for better animation control
- 31-02: User approved splash screen - no visual gaps identified, Plan 03 verification-only
- 31-03: Verification-only pass - no refinements needed per 31-02 review approval
- 32-01: Inline ChainLinkCrownLogo SVG in SignUpScreen.tsx (simpler than shared component)
- 32-01: Disable social auth on web with fallback notice (native-only feature)
- 32-02: User approved Sign Up screen visual - no gaps identified, Plan 03 verification-only
- 32-03: Verification-only pass - no refinements needed per 32-02 review approval
- 37-01: Used @capacitor/camera@7.0.2 for Capacitor 7.x compatibility (v8 requires Capacitor 8)
- 37-02: Used underscore prefix (_streak) for unused parameter to maintain API consistency
- 38-01: Used getAvatarStage(newRank) to derive avatar stage from rank
- 38-01: Removed auto-close after claim to allow share action before dismissal
- 39-01: Used underscore prefix for unused totalDP/rankName props to maintain API consistency (values used in share text, not card display)
- 40-01: Used underscore prefix for unused workoutName/rankName props to maintain API consistency (values used in share text, not card display)
- 40-01: ShareBottomSheet stays open if user cancels camera - only closes on successful share or explicit cancel
- 40-02: Used username field as callsign for share card (profile.username maps to callsign prop)
- 40-02: Type assertion for avatarStage (getAvatarStage returns number, card expects 1|2|3|4|5)
- 33-01: Reused inline SVG icons from SignUpScreen (no shared component)
- 33-01: Used navigate(-1) for back arrow navigation
- 33-01: Added underline styling to Create Account and Forgot Password links per mockup
- 33-02: User approved Sign In screen visual - no gaps identified, Plan 03 verification-only
- 33-03: Verification-only pass - no refinements needed per 33-02 review approval
- 34-01: Implemented complete screen in single commit (all tasks share same file)
- 34-01: Reused inline ChainLinkCrownLogo pattern from SignInScreen
- 34-01: Password strength criteria: 8+ chars (1), uppercase (2), number (3), special char (4)
- 34-02: User approved Email Sign Up screen visual - no gaps identified, Plan 03 verification-only
- 35-02: User approved Email Sign In screen visual - no gaps identified, Plan 03 may be verification-only
- 36-01: Implemented all tasks in single commit (all tasks share same file) — All 3 tasks modify the same file and represent cohesive feature
- 36-01: Security pattern: always show success state regardless of email existence — Prevents email enumeration attacks
- [Phase 36-02]: Implementation approved with zero visual gaps - Plan 03 will be verification-only
- [Phase 36-03]: Verification-only execution - no code changes needed, all success criteria met
- 41-01: Week starts on Sunday (aligns with local week utilities)
- 41-01: DP compliance calculated as days with any DP action / 7
- 41-01: Report shows once per week (gated by lastShownWeekStart)
- 41-01: Always generate at least one highlight (default: Week Complete with top stat)
- [Phase 41]: weeklyReport notification defaults to enabled at 7pm Sunday (matches claimXP notification timing)
- [Phase 41]: Deep link /weekly-report uses sessionStorage flag pattern (avoids route conflict with modal-based UI)
- 41-03: No DP award for weekly report share (informational content, not reward action)
- 41-03: Share functionality internal to WeeklyReportScreen (no onShare prop pattern)
- 42-01: Referral code format CALLSIGN-XXXX (4-char alphanumeric suffix)
- 42-01: referral_code nullable in profiles (generated lazily on first access)
- 42-01: Client-side code generation to reduce DB round-trips
- 42-02: Used RANKS array from dpStore for rank name lookup (no separate RANK_INFO)
- 42-02: Native share uses @capacitor/share, web uses platform-specific URLs
- 42-02: Instagram web fallback copies text to clipboard (no direct share URL)
- 42-03: Referral code captured before auth flow, attributed after signup (fire-and-forget)
- 42-03: capturedReferralCode persisted via zustand partialize for app restart resilience
- 43-01: grantReferralPremium called after attributeReferral (order matters for referral record existence)
- 43-01: Fire-and-forget pattern for premium grant (non-blocking UX)
- 43-01: Edge Function verifies referral record exists before granting (prevents abuse)

### Pending Todos

- Apple Developer account verification (submitted, awaiting response)
- Capacitor 7->8 migration needed before April 28, 2026 Apple deadline
- Phase 36 Complete ✓ (v2.2 Forgot Password Screen)
- Phase 35 Plan 03 remaining (v2.2 Email Sign In Form)
- Phase 34 Plan 03 remaining (v2.2 Email Sign Up Form)
- Phase 24 (v2.0 App Store Submission) - 3 plans remaining

### Blockers/Concerns

- Apple Developer enrollment awaiting approval (blocks App Store submission, not development)
- Capacitor 7->8 migration constrains roadmap end date

### v2.3 Requirements Coverage

**Phase 41 - Weekly Protocol Report (7 requirements):**
- WRPT-01, WRPT-02, WRPT-03, WRPT-04, WRPT-05, WRPT-06, WRPT-07

**Phase 42 - Referral System (6 requirements):**
- REFR-01, REFR-04, REFR-05, REFR-06, REFR-07, REFR-08

**Phase 43 - Referral Rewards (2 requirements):**
- REFR-02, REFR-03

**Coverage:** 15/15 (100%) ✓

## Session Continuity

Last session: 2026-03-07
Stopped at: Completed 43-01-PLAN.md (Referral Premium Grant)
Resume file: None
Next action: Execute Phase 43 Plan 02 (Referrer DP Rewards)
