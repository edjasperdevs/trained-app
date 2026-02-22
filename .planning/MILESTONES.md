# Project Milestones: Trained

## v1.4 Intake Dashboard (Shipped: 2026-02-21)

**Delivered:** Intake submissions dashboard integrated into Coach section — 4th "Intake" segment with submission browsing, filtering by status, full detail views with collapsible sections and photo gallery, coach notes, status management, and manual client-submission linking via client detail Intake tab. All archive components restyled to shadcn/ui + CVA patterns.

**Phases completed:** 7-10 (built outside GSD)

**Key accomplishments:**

- Ported intake types and API layer to use existing Supabase client (no separate AuthContext)
- Built filterable submissions list with status tabs and new-count badge on segment tab
- Created submission detail view with 10 collapsible sections, signed-URL photo gallery, status dropdown, and coach notes
- Added Intake tab to client detail modal with manual submission linking

**What's next:** Native iOS app via Capacitor for App Store distribution.

---

## v1.3 Coach Dashboard (Shipped: 2026-02-08)

**Delivered:** Full coaching platform — invite clients, manage macro targets, program workouts, review structured weekly check-ins — all from a dedicated `/coach` route with directional sync preventing data collisions.

**Phases completed:** 1-6 (18 plans total)

**Key accomplishments:**

- Built directional sync architecture (pushClientData/pullCoachData) with data ownership model preventing coach-set data from being overwritten by client sync
- Created email invitation system with Supabase Edge Function + Resend, auto-linking clients via database trigger on signup
- Delivered paginated client roster with server-side search, drill-down detail views (weight history, macro adherence, activity feed)
- Implemented coach macro management with "Set by Coach" indicator and locked calculator preventing client override
- Built full workout programming: template builder, client assignment, "Assigned by Coach" badge, prescribed-vs-actual comparison
- Added structured weekly check-ins: 16-field form with auto-computed data, coach review flow, client response viewing on Home screen

**Stats:**

- 90 files created/modified
- +19,678 lines of TypeScript/TSX
- 6 phases, 18 plans, 79 commits
- 5 days (2026-02-04 to 2026-02-08)
- ~61 minutes total execution time (avg 3.4min/plan)

**Git range:** `22cf43f5` (v1.2) → `9cf71e26` (v1.3 audit)

**What's next:** Apply migrations 003-007, deploy send-invite Edge Function, configure Resend API key, deploy to production.

---

## v1.2 Pre-Launch Confidence (Shipped: 2026-02-07)

**Delivered:** E2E testing, analytics funnel tracking, and Sentry monitoring hardening — full pre-launch observability for a 90k-user launch with no beta phase.

**Phases completed:** 1-4 (8 plans total)

**Key accomplishments:**

- Repaired 4 failing component tests and established green 139-test baseline after design refresh
- Built Playwright E2E infrastructure with localStorage seeding, dual projects (bypass + real auth), and 60 data-testid selectors
- Wrote 7 E2E tests covering all critical user journeys: signup, signin, workout logging, meal logging, check-in, XP claim, offline sync
- Wired 15 missing Plausible analytics events and documented 3 funnel definitions (activation, habit formation, daily engagement)
- Activated Sentry performance tracing (Core Web Vitals), source map upload, and session replay with PII masking on 5 screens

**Stats:**

- 59 files created/modified
- +7,743 lines of TypeScript/TSX
- 4 phases, 8 plans
- 3 days (2026-02-04 to 2026-02-07)
- ~1 hour total execution time

**Git range:** `b1676076` (fix(01-01)) → `ccaab2dd` (docs(v1.2))

**What's next:** Deploy to production, configure Sentry alert rules, set deploy env vars.

---

## v1.1 Design Refresh (Shipped: 2026-02-05)

**Delivered:** Full visual overhaul with shadcn/ui migration, Tailwind v4, single-theme codebase, and animation refinement.

**Phases completed:** 7 phases, 12 plans, 25 requirements

---

## v1.0 Launch Polish (Shipped: 2026-02-04)

**Delivered:** Audit, performance, UX polish, resilience, and launch preparation across 5 phases.

**Phases completed:** 5 phases, 10 plans, 16 requirements

---
