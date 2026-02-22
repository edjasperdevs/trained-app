# Trained

## What This Is

Trained is a fitness gamification PWA (React 18 + TypeScript + Vite + Zustand + Supabase) targeting ~90k followers. It combines workout logging, macro tracking, XP/leveling, streaks, avatar evolution, and achievement badges in a premium dark aesthetic. The app includes a full coaching platform where the sole coach can invite clients, manage their workout programs and macro targets, and review structured weekly check-ins — all from a dedicated `/coach` route.

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
- ✓ Coach route protection with lazy-loaded dashboard — v1.3
- ✓ Directional sync (pushClientData/pullCoachData) with data ownership model — v1.3
- ✓ Email invitation system with auto-link on signup — v1.3
- ✓ Paginated client roster with server-side search and drill-down detail views — v1.3
- ✓ Coach macro management with "Set by Coach" indicator and locked calculator — v1.3
- ✓ Workout programming: template builder, assignment, prescribed-vs-actual comparison — v1.3
- ✓ Structured weekly check-ins with 16-field form, auto-data, coach review, response viewing — v1.3
- ✓ Intake submissions dashboard (4th Coach segment, detail views, photo gallery, coach notes) — v1.4
- ✓ Manual client-submission linking with Intake tab in client detail modal — v1.4
- ✓ Archive components restyled to shadcn/ui + CVA patterns — v1.4

### Active

**Current Milestone: v1.5 Native iOS App**

**Goal:** Wrap the PWA with Capacitor and ship to the iOS App Store for 90k-audience credibility, adding real push notifications for reminders and coach actions.

**Target features:**
- Capacitor iOS shell wrapping existing React app in native WebView
- Push notifications: daily reminders (workout, meals, check-in) + coach action triggers (macro update, workout assignment, check-in response)
- Native iOS haptics replacing no-op navigator.vibrate
- Native file sharing replacing Blob download hack
- App lifecycle events (background/foreground detection via Capacitor App plugin)
- Splash screen and App Store assets
- Deep link handling for password reset (replacing window.location.origin redirect)
- App Store submission preparation (metadata, screenshots, review compliance)

### Out of Scope

- Android / Play Store — iOS only for v1.5, Android in future milestone
- Light mode — dark-only
- Marketing site — app only
- A/B testing infrastructure — premature for launch
- Custom analytics backend — leverage Plausible + Sentry
- HealthKit / Apple Health integration — not needed for v1.5 scope
- Background fitness tracking (GPS, step counter) — not needed
- Full chat / messaging — check-in responses cover 80% of communication needs
- Multi-coach / team features — single-coach app
- AI workout generation — coach expertise is the product

## Context

**Current State:**
- Five milestones shipped (v1.0 launch polish, v1.1 design refresh, v1.2 pre-launch confidence, v1.3 coach dashboard, v1.4 intake dashboard)
- 139 unit tests + 10 E2E tests passing
- Full coaching platform: invitations, roster, macro management, workout programming, weekly check-ins
- Directional sync separates client-owned vs coach-owned data
- 6 Supabase migrations pending application (003-007)
- send-invite Edge Function needs deployment + Resend API key
- Domain configured at app.welltrained.fitness (Vercel subdomain)

**Tech Stack:**
- React 18 + TypeScript + Vite + Tailwind v4 + shadcn/ui + CVA
- Zustand (localStorage persistence) + Supabase (cloud sync, Edge Functions, RLS)
- Playwright (E2E) + Vitest (unit/component)
- Plausible (analytics) + Sentry (monitoring)
- Resend (transactional email via Edge Function)

**Post-Deploy Manual Tasks:**
- Apply Supabase migrations 003-007
- Deploy send-invite Edge Function
- Configure Resend API key in Supabase secrets
- Configure Sentry alert rules in dashboard
- Set SENTRY_AUTH_TOKEN/ORG/PROJECT in deploy environment
- Verify source maps, PII masking, session replay after first deploy

## Constraints

- **Single coach**: Only one coach account — no multi-tenancy needed
- **Supabase**: All backend through Supabase (auth, database, edge functions) — no separate backend
- **Privacy**: Client data visible only to coach — clients cannot see each other
- **Existing aesthetic**: Coach dashboard follows the same premium dark design system (shadcn/ui, CVA)
- **iOS first**: Capacitor wrapping existing PWA — no React Native rewrite
- **Apple Developer account**: Enrollment needed (can develop in parallel)

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
| Coach dashboard at /coach | Single coach, Supabase-only backend, keeps existing design system | ✓ Good — 1700+ line Coach.tsx, all features integrated |
| Directional sync (push/pull) | Prevents coach-set data from being overwritten by client sync | ✓ Good — zero data collisions across 3 coach features |
| set_by TEXT CHECK (not enum) | Simpler than PostgreSQL enum for 2 values | ✓ Good — worked cleanly across all phases |
| Edge Function + Resend for invites | Supabase-native, no external backend needed | ✓ Good — branded email with auto-link trigger |
| Non-persisted assignedWorkout | Server-authoritative data fetched fresh each session | ✓ Good — no stale workout assignments |
| localStorage for check-in status | Single read-only value doesn't need Zustand reactive state | ✓ Good — lightweight sync pattern |

| Adapt archive code, not new AuthContext | trained-app has Zustand authStore + CoachGuard, archive's AuthContext/useAuth not needed | ✓ Good |
| Manual client-submission linking | Coach manually associates submissions vs auto-match by email | ✓ Good |
| intake_submissions/intake_photos tables pre-exist | Tables already in Supabase from marketing site — no migration needed | ✓ Good |
| Capacitor over React Native | Preserves entire React codebase, Tailwind, routing — WebView performance fine for forms/lists | — Pending |
| iOS only for v1.5 | Most fitness users on iPhone, reduces scope, Android deferred | — Pending |
| Push via APNs + Supabase | Supabase Edge Functions can trigger APNs — no separate push infra | — Pending |

---
*Last updated: 2026-02-21 — v1.5 Native iOS App started*
