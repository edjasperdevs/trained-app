# Trained

## What This Is

Trained is a fitness gamification PWA (React 18 + TypeScript + Vite + Zustand + Supabase) targeting ~90k followers. It combines workout logging, macro tracking, XP/leveling, streaks, avatar evolution, and achievement badges in a premium dark aesthetic. The app has completed three milestones (launch polish, design refresh, pre-launch confidence) and is ready for production deployment.

## Core Value

**When this launches to 90k people, nothing is broken and you can see exactly how they're using it.** E2E tests catch regressions before users do. Analytics and monitoring tell you what's working and what's not — from day one.

## Requirements

### Validated

Previous milestones delivered:

- ✓ User authentication (email/password, session persistence) — existing
- ✓ Onboarding flow (10-step wizard with progress indicator) — existing
- ✓ Workout logging (exercises, sets, reps, weights, history) — existing
- ✓ Macro tracking (calories, protein, food search with fallback) — existing
- ✓ XP/leveling system (DP, ranks, weekly claim ritual) — existing
- ✓ Streak system (daily check-in, grace period/safe word) — existing
- ✓ Avatar evolution (13 stages, mood system) — existing
- ✓ Achievement badges (20+ badges, unlock animations) — existing
- ✓ Offline-first with cloud sync (Zustand + Supabase) — existing
- ✓ PWA support (prompt-based updates, runtime caching) — existing
- ✓ Skeleton loading states, empty states, haptic feedback — v1.0
- ✓ Sync status indicator, online/offline detection — v1.0
- ✓ Sentry error monitoring wired into all error paths — v1.0
- ✓ Plausible analytics (22 custom events) — v1.0
- ✓ WCAG AA color contrast compliance — v1.0
- ✓ Premium dark aesthetic (Tailwind v4, shadcn/ui, CVA variants) — v1.1
- ✓ Single-theme codebase (GYG removed, 394 ternaries resolved) — v1.1
- ✓ Animation refinement (critically damped springs, no playful motion) — v1.1
- ✓ "What's New" update prompt for returning users — v1.1
- ✓ E2E test suite with Playwright (7 critical user journeys, 10 tests) — v1.2
- ✓ Existing test suite repaired and passing (139 tests) — v1.2
- ✓ Funnel analytics (3 funnels: activation, habit formation, daily engagement) — v1.2
- ✓ Engagement tracking (22 Plausible events across all screens) — v1.2
- ✓ Performance monitoring (Sentry Core Web Vitals, page load tracing) — v1.2
- ✓ Session replay with PII masking (health/fitness data protected) — v1.2
- ✓ Source map upload for readable production stack traces — v1.2

### Active

None — ready for deployment. Next milestone TBD after launch feedback.

### Out of Scope

- Coach dashboard — still client-only
- Native mobile app — still PWA
- Light mode — dark-only
- Marketing site — app only
- A/B testing infrastructure — premature for launch
- Custom analytics backend — leverage Plausible + Sentry

## Context

**Current State:**
- Three milestones shipped (v1.0 launch polish, v1.1 design refresh, v1.2 pre-launch confidence)
- 139 unit tests + 10 E2E tests passing
- 22 Plausible analytics events wired with 3 funnel definitions
- Sentry: performance tracing, source maps, session replay with PII masking, ErrorBoundary capture
- Ready for production deployment to ~90k followers

**Tech Stack:**
- React 18 + TypeScript + Vite + Tailwind v4 + shadcn/ui + CVA
- Zustand (localStorage persistence) + Supabase (cloud sync)
- Playwright (E2E) + Vitest (unit/component)
- Plausible (analytics) + Sentry (monitoring)

**Post-Deploy Manual Tasks:**
- Configure Sentry alert rules in dashboard (MON-03)
- Set SENTRY_AUTH_TOKEN/ORG/PROJECT in deploy environment
- Verify source maps, PII masking, session replay after first deploy

## Constraints

- **Timeline**: Ready to ship — launch when confident
- **Functionality**: Zero behavior changes in v1.2 — testing and observability only
- **Privacy**: Plausible is privacy-first (no cookies) — keep it that way
- **Bundle size**: Monitoring additions must not bloat the client
- **Existing tools**: Build on Sentry + Plausible — don't add new vendors

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Playwright for E2E | Fast, reliable, multi-browser support, Microsoft-backed | ✓ Good — 10 tests covering 7 critical flows |
| Build on Sentry + Plausible | Already integrated, avoid vendor sprawl | ✓ Good — zero new vendors added |
| E2E over unit tests | User journey coverage more valuable pre-launch | ✓ Good — caught real integration issues |
| No beta group | Launching to everyone at once — tests must provide confidence | — Pending (launch hasn't happened) |
| Static seed data in E2E | Deterministic over dynamic devSeed.ts | ✓ Good — stable, reproducible tests |
| Dual Playwright projects | Separate auth tests from bypassed tests | ✓ Good — clean isolation |
| maskAllText: false + [data-sentry-mask] | Readable replays + PII protection | ✓ Good — minimal masking, maximum insight |

---
*Last updated: 2026-02-07 after v1.2 milestone*
