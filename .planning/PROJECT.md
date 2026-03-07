# WellTrained

## What This Is

WellTrained is a fitness gamification app (React 18 + TypeScript + Vite + Zustand + Supabase + Capacitor) that turns daily training, nutrition, and recovery habits into an RPG-style progression system. Users earn Discipline Points (DP) for completing real-world actions, rank up through a 15-tier system, and evolve a visual avatar. The app targets the WellTrained brand's ~90k audience with a premium "Dopamine Noir" dark aesthetic and a freemium subscription model.

## Core Value

**Daily discipline earns visible rank progression — the app makes consistency feel like leveling up.** Every workout, meal tracked, step walked, and hour slept pushes users toward the next rank, and the subscription unlocks deeper personalization.

## Requirements

### Validated

Previous milestones delivered:

- ✓ User authentication (email/password, session persistence) — existing
- ✓ Onboarding flow (10-step wizard with progress indicator) — existing (being replaced in v2.1)
- ✓ Workout logging (exercises, sets, reps, weights, history) — existing
- ✓ Macro tracking (calories, protein, food search with fallback) — existing
- ✓ Streak system (daily check-in, grace period) — existing
- ✓ Achievement badges (20+ badges, unlock animations) — existing
- ✓ Offline-first with cloud sync (Zustand + Supabase) — existing
- ✓ PWA support (prompt-based updates, runtime caching) — existing
- ✓ Skeleton loading states, empty states, haptic feedback — v1.0
- ✓ Sync status indicator, online/offline detection — v1.0
- ✓ Sentry error monitoring wired into all error paths — v1.0
- ✓ Plausible analytics (22 custom events) — v1.0
- ✓ WCAG AA color contrast compliance — v1.0
- ✓ Premium dark aesthetic (Tailwind v4, shadcn/ui, CVA variants) — v1.1
- ✓ Single-theme codebase — v1.1
- ✓ Animation refinement (critically damped springs) — v1.1
- ✓ E2E test suite with Playwright (7 critical journeys) — v1.2
- ✓ 139 unit tests passing — v1.2
- ✓ Funnel analytics + engagement tracking — v1.2
- ✓ Performance monitoring (Sentry Core Web Vitals, session replay) — v1.2
- ✓ Capacitor iOS shell with native haptics, dialogs, file sharing — v1.5
- ✓ Push notifications (APNs direct, daily reminders, coach triggers) — v1.5
- ✓ Local notifications (workout, meals, check-in reminders) — v1.5
- ✓ Deep linking for password reset — v1.5
- ✓ App lifecycle events (foreground sync) — v1.5
- ✓ Privacy policy + Apple privacy manifest — v1.5
- ✓ Account deletion with cascading cleanup — v1.5
- ✓ 8-screen onboarding flow (Welcome, Value, Profile, Goal, Archetype, Macros, Paywall, Final) — v2.1
- ✓ RevenueCat paywall with 7-day free trial and reverse trial — v2.1
- ✓ Value-first onboarding with protocol language — v2.1
- ✓ Rank-Up share card with +10 DP per-rank reward, RankUpModal integration — v2.2.1
- ✓ Workout share card with camera selfie compositing, +5 DP daily reward — v2.2.1
- ✓ Compliance share card for 5/5 days with +5 DP daily reward — v2.2.1
- ✓ Share infrastructure (html-to-image, @capacitor/share, web download fallback) — v2.2.1
- ✓ Weekly Protocol Report (Sunday summaries, auto-generated highlights, push notifications, share cards) — v2.3
- ✓ Recruit a Sub referral system (unique CALLSIGN-XXXX links, deep link capture, recruits tracking) — v2.3
- ✓ Referral rewards (7-day Premium for recruits via RevenueCat promo, 100 DP for referrers) — v2.3
- ✓ Locked Protocol (streak-based accountability with Continuous/Day Lock types, daily logging +15 DP, milestone bonuses 50-750 DP) — v2.3

### Active

**Current Milestone:** v2.4 App Store Readiness

**Goal:** Resolve all P0 and P1 blockers identified in AUDIT_REPORT.md to prepare for iOS App Store submission.

**Target deliverables:**
- Fix all P0 App Store submission blockers (PrivacyInfo.xcprivacy, aps-environment, Team ID, dev fallback)
- Complete App Store Connect metadata preparation
- Verify Xcode and iOS SDK compliance
- Address P1 UX issues (health disclaimer, workout name overflow, recovery day compliance)
- Optimize assets (splash screen branding, oversized logos)
- Clean up repository (remove .DS_Store files, legacy code)
- Host public privacy policy URL

### Out of Scope

- Android / Play Store — iOS only for V2
- Light mode — dark-only
- Marketing site — app only
- Coach dashboard in-app — moved to separate welltrained-coach app
- Coach messaging / chat — welltrained-coach handles communication
- Community leaderboard — potential V3 feature
- AI workout generation — coach expertise is the product
- Streak multiplier — spec mentions "future phase", not V2
- Custom themes / app icons — premium feature deferred to post-launch
- Multi-coach / team features — single-coach app

## Context

**Current State:**
- v2.2 Auth Flow Redesign complete (Splash, Sign Up, Sign In, Email forms, Forgot Password)
- v2.2.1 Social Sharing shipped (3 branded share cards, DP rewards, camera compositing)
- v2.1 Onboarding Redesign complete (8-screen value-first flow with reverse trial)
- Capacitor iOS shell fully functional with native features
- 139 unit tests + 10 E2E tests passing
- Apple Developer account enrollment submitted, awaiting verification
- Domain: app.welltrained.fitness (Vercel)

**V2 Spec Source:** `WellTrained V2_ Master Specification & Build Document.md` in repo root

**Tech Stack (continuing):**
- React 18 + TypeScript + Vite + Tailwind v4 + shadcn/ui + CVA
- Zustand (localStorage persistence) + Supabase (cloud sync, Edge Functions, RLS)
- Capacitor 7 for iOS native wrapper
- Playwright (E2E) + Vitest (unit/component)
- Plausible (analytics) + Sentry (monitoring)

**New for V2:**
- RevenueCat (@revenuecat/purchases-capacitor) for iOS IAP subscriptions
- HealthKit via Capacitor plugin for steps + sleep data
- New color system (lime signal #C8FF00 replacing red #D55550)

## Constraints

- **Single coach**: Only one coach account — coach features live in welltrained-coach
- **Supabase**: All backend through Supabase — no separate backend
- **iOS first**: Capacitor wrapping existing React app — no React Native rewrite
- **Apple Developer account**: Enrollment pending — blocks App Store submission but not development
- **RevenueCat**: iOS IAP required for App Store subscriptions — no web-only payment
- **Existing data**: Must handle migration from XP/levels → DP/ranks for any existing users
- **HealthKit**: Requires user permission, manual entry must always work as fallback

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Capacitor over React Native | Preserves entire React codebase, Tailwind, routing | ✓ Good |
| iOS only | Most fitness users on iPhone, reduces scope | — Pending |
| Direct APNs (no Firebase) | iOS-only, Supabase Edge Functions handle delivery | ✓ Good |
| RevenueCat for subscriptions | Handles StoreKit, receipt validation, subscription lifecycle; Capacitor plugin available | — Pending |
| HealthKit + manual fallback | Steps/sleep from HealthKit when available, manual entry always works | — Pending |
| Strip coach dashboard | Coach app is separate (welltrained-coach); reduces client app complexity by ~4,500 lines | — Pending |
| Lime signal color (#C8FF00) | Premium, unique brand identity; high contrast on dark backgrounds | — Pending |
| 15 ranks over 99 levels | Meaningful progression milestones, ~24-27 week mastery curve | — Pending |
| 5 archetypes (1 free, 4 premium) | Personalization drives subscription conversion; Bro (generalist) is the free hook | — Pending |
| Close v1.5 as-is | App Store submission becomes part of V2 launch phase | ✓ Good |

| Value-first onboarding | Show transformation promise before asking for data; paywall after investment | ✓ Good |
| Reverse trial | 7-day free Premium for users who skip paywall; increases conversion 30-50% | ✓ Good |
| 8-screen flow | Shorter than previous 10-step; value proposition screen before data collection | ✓ Good |
| 3-pass design implementation | Build → Review → Refine for each screen; ensures mockup fidelity | ✓ Good |
| Apple + Google Sign-In | Social auth reduces friction; Apple required for App Store if offering other social login | ✓ Good |
| Splash screen | Branded loading experience during app initialization | ✓ Good |
| html-to-image for share cards | DOM-to-PNG generation, works with native share sheet | ✓ Good |
| Daily/per-rank DP gating | Prevents share spam while rewarding engagement | ✓ Good |
| Week starts on Sunday | Aligns with local week utilities, Sunday 7pm push notifications | ✓ Good |
| CALLSIGN-XXXX referral codes | Personal + shareable format using username + 4-char suffix | ✓ Good |
| Fire-and-forget premium grant | Non-blocking UX, Edge Function handles RevenueCat promo entitlement | ✓ Good |
| Locked Protocol types | Continuous (evening reminder) vs Day Lock (morning reminder) serves different user preferences | ✓ Good |
| Milestone DP escalation | 7d=50, 14d=100, 21d=150, 30d=250, 60d=500, 90d=750 — rewards long-term commitment | ✓ Good |
| Streak yesterday grace | Allows user to log "today" if they logged yesterday but haven't yet today | ✓ Good |

---
*Last updated: 2026-03-07 after starting v2.4 App Store Readiness milestone*
