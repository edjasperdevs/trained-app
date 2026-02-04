# Trained MVP Launch Polish

## What This Is

Polish and harden the Trained fitness gamification app for launch to ~90k fitness enthusiast followers. Focus on ensuring core flows work flawlessly, UX is intuitive, and the app feels solid and premium — fixing bugs, improving error handling, and tightening the existing design system. Not adding new features or doing a full redesign.

## Core Value

**First impression must be flawless.** Fitness enthusiasts who already use apps like MyFitnessPal, Strong, and Hevy will judge harshly. Any broken flow, confusing UX, or visual jank kills trust immediately. The app must feel solid from first tap.

## Requirements

### Validated

These capabilities exist and work (inferred from codebase):

- ✓ User authentication (email/password, session persistence) — existing
- ✓ Onboarding flow (8-10 step wizard) — existing
- ✓ Workout logging (exercises, sets, reps, weights, history) — existing
- ✓ Macro tracking (calories, protein, food search API, saved meals) — existing
- ✓ XP/leveling system (DP, ranks, weekly claim ritual) — existing
- ✓ Streak system (daily check-in, grace period/safe word) — existing
- ✓ Avatar evolution (13 stages, mood system) — existing
- ✓ Achievement badges (20+ badges, unlock animations) — existing
- ✓ Reminders system (4 types, daily dismissal) — existing
- ✓ Offline-first with cloud sync (localStorage + Supabase) — existing
- ✓ PWA support (installable, service worker) — existing
- ✓ Dual theme system (Trained/GYG) — existing
- ✓ Error tracking (Sentry integration) — existing

### Active

Polish and hardening work for launch:

- [ ] Audit full user journey and document issues
- [ ] Fix all critical bugs blocking core flows
- [ ] Onboarding: progress indicator, validation, edge cases
- [ ] Core loop: verify XP calculations, streak logic, timezone handling
- [ ] PWA: test install experience, offline mode, service worker caching
- [ ] Error handling: network failures, API fallbacks, graceful degradation
- [ ] Data integrity: sync conflict resolution, export/import verification
- [ ] Performance: bundle audit, lazy loading, animation smoothness
- [ ] Visual polish: consistency audit, loading states, empty states
- [ ] Copy: error messages, empty states, motivational messages voice
- [ ] Analytics: verify Sentry context, add key funnel events
- [ ] Launch prep: load testing, marketing assets (screenshots, OG images)

### Out of Scope

- Coach dashboard — client experience only for this launch
- FAQ/support documentation — handle manually at first
- New features — polish existing, don't add
- Full design redesign — deferred to next project (Equinox/luxury aesthetic exploration)
- GYG theme polish — Trained theme only

## Context

**Existing Codebase:**
- React 18 + TypeScript + Vite PWA
- Zustand for state (8 stores, localStorage persistence)
- Supabase backend (optional, offline-first architecture)
- Tailwind CSS + CSS variables for theming
- Framer Motion for animations
- ~11k lines of TypeScript/TSX

**Target Audience:**
- ~90k fitness enthusiast followers
- Already use fitness apps — high expectations
- Will compare to MyFitnessPal, Strong, Hevy, Whoop
- Low tolerance for bugs or confusion

**Timeline:**
- Launch: This week
- Approach: Audit first (unknown current state), then fix, then polish

**Future Direction:**
- Design refresh planned as next project
- Target aesthetic: Equinox/luxury gym — darker, cleaner, more masculine
- Current design works but feels "too playful" per user feedback

## Constraints

- **Timeline**: This week launch — ruthless prioritization required
- **Scope**: Client experience only, no coach dashboard
- **Design**: Polish within current system, no redesign
- **Testing**: Must verify on real devices (iOS Safari, Android Chrome)
- **Zero data loss**: User workout/streak data is sacred

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Audit before fix | Haven't tested recently, unknown bugs | — Pending |
| Client-only launch | Coach features not ready for public | — Pending |
| Defer redesign | Can't do full visual refresh in a week | — Pending |
| Skip FAQ docs | Handle support manually, learn what users actually ask | — Pending |

---
*Last updated: 2026-02-04 after initialization*
