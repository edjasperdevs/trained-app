# Trained

## What This Is

Trained is a fitness gamification PWA (React 18 + TypeScript + Vite + Zustand + Supabase) targeting ~90k followers. It combines workout logging, macro tracking, XP/leveling, streaks, avatar evolution, and achievement badges in a premium dark aesthetic inspired by Equinox and Whoop. The app just completed a full visual overhaul (shadcn/ui migration, Tailwind v4, theme system removal) and needs pre-launch confidence before going live to everyone at once.

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
- ✓ Skeleton loading states, empty states, haptic feedback — launch polish
- ✓ Sync status indicator, online/offline detection — launch polish
- ✓ Sentry error monitoring wired into all error paths — launch polish
- ✓ Plausible analytics (22 custom events) — existing
- ✓ WCAG AA color contrast compliance — launch polish
- ✓ Premium dark aesthetic (Tailwind v4, shadcn/ui, CVA variants) — design refresh
- ✓ Single-theme codebase (GYG removed, 394 ternaries resolved) — design refresh
- ✓ Animation refinement (critically damped springs, no playful motion) — design refresh
- ✓ "What's New" update prompt for returning users — design refresh

### Active

Pre-launch confidence work:

- [ ] E2E test suite with Playwright covering critical user journeys
- [ ] Existing test suite updated and passing after design refresh
- [ ] Cross-browser verification (iOS Safari, Android Chrome, desktop)
- [ ] Funnel analytics (sign up → onboarding → first workout → habit)
- [ ] Engagement tracking (workout completion, meal logging, streak maintenance)
- [ ] Performance monitoring (Core Web Vitals, API latency, page load times)
- [ ] Operational dashboard (error rates, failed API calls, slow pages)

### Out of Scope

- Coach dashboard — still client-only
- New features or functionality changes — testing and observability only
- Native mobile app — still PWA
- Light mode — dark-only
- Marketing site — app only
- A/B testing infrastructure — premature for launch
- Custom analytics backend — leverage Plausible + Sentry

## Context

**Current State:**
- Design refresh milestone complete (7 phases, 25 requirements, all shipped)
- shadcn/ui migration merged to master
- Sentry already wired into 8 catch blocks + auth
- Plausible already tracking 22 custom events
- Some existing tests but likely need updating after the massive visual overhaul
- No E2E tests exist yet
- Launching to ~90k followers — no beta group, everyone at once

**What Exists (to build on):**
- Sentry for error monitoring — needs performance monitoring added
- Plausible for event tracking — needs funnel/engagement events added
- Existing unit/component tests — need audit and repair

**Gap Analysis:**
- No E2E tests → can't verify critical paths don't regress
- No funnel tracking → can't see where users drop off
- No performance monitoring → can't detect slow experiences
- Existing tests may be broken → false confidence

## Constraints

- **Timeline**: Before launch — move fast
- **Functionality**: Zero behavior changes — testing and observability only
- **Privacy**: Plausible is privacy-first (no cookies) — keep it that way
- **Bundle size**: Monitoring additions must not bloat the client
- **Existing tools**: Build on Sentry + Plausible — don't add new vendors

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Playwright for E2E | Fast, reliable, multi-browser support, Microsoft-backed | — Pending |
| Build on Sentry + Plausible | Already integrated, avoid vendor sprawl | — Pending |
| E2E over unit tests | User journey coverage more valuable pre-launch than isolated unit coverage | — Pending |
| No beta group | Launching to everyone at once — tests must provide the confidence | — Pending |

---
*Last updated: 2026-02-06 after pre-launch confidence milestone initialization*
