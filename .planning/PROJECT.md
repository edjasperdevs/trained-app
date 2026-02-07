# Trained

## What This Is

Trained is a fitness gamification PWA (React 18 + TypeScript + Vite + Zustand + Supabase) targeting ~90k followers. It combines workout logging, macro tracking, XP/leveling, streaks, avatar evolution, and achievement badges in a premium dark aesthetic. The app is adding a coach dashboard so the sole coach can invite clients, manage their workout programs and macro targets, and review structured weekly check-ins — all from a dedicated `/coach` route.

## Core Value

**The coach can manage every client's training from one place — programs, macros, check-ins — and clients see their personalized plans without friction.** The coach dashboard is the command center; the client app is the delivery mechanism.

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

v1.3 Coach Dashboard:

- [ ] Invite clients by email (signup invite sent)
- [ ] Client roster with activity summaries (last workout, streak, macro adherence)
- [ ] Workout programming (assign specific workouts to specific dates on client calendar)
- [ ] Macro management (set client daily calorie/protein/carb/fat targets)
- [ ] Structured weekly check-ins (client fills out form, coach reviews responses)
- [ ] Coach route (`/coach`) — separate area, single coach account

### Out of Scope

- Native mobile app — still PWA
- Light mode — dark-only
- Marketing site — app only
- A/B testing infrastructure — premature for launch
- Custom analytics backend — leverage Plausible + Sentry

## Context

**Current State:**
- Three milestones shipped (v1.0 launch polish, v1.1 design refresh, v1.2 pre-launch confidence)
- 139 unit tests + 10 E2E tests passing
- App is fully client-facing — no coach/admin capabilities yet
- Supabase handles auth and cloud sync but no multi-user data relationships
- No email sending infrastructure (invites will need a solution)
- No real-time or messaging infrastructure

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

- **Single coach**: Only one coach account — no multi-tenancy needed
- **Supabase**: All backend through Supabase (auth, database, edge functions, realtime) — no separate backend
- **Privacy**: Client data visible only to coach — clients cannot see each other
- **Existing aesthetic**: Coach dashboard follows the same premium dark design system (shadcn/ui, CVA)
- **PWA**: Still a PWA — no native app

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

| Coach dashboard at /coach | Single coach, Supabase-only backend, keeps existing design system | — Pending |

---
*Last updated: 2026-02-07 after v1.3 milestone started*
