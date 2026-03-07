# Project Milestones: Trained

## v1.5 Native iOS App (Closed: 2026-02-27)

**Delivered:** Capacitor iOS shell wrapping existing React app with native haptics, dialogs, file sharing, push notifications (direct APNs), local notification reminders, deep linking for password reset, app lifecycle events, privacy policy, and Apple privacy manifest. App Store submission paused pending Apple Developer account approval.

**Phases completed:** 11-16 (12 plans, 16-03/16-04 incomplete — Apple approval pending)

**Key accomplishments:**

- Capacitor 7.5 iOS shell with conditional service worker disabling for native builds
- Replaced all window.confirm() with async @capacitor/dialog on native
- Direct APNs push via Supabase Edge Function (no Firebase) with 50-min JWT cache
- Local notifications for workout, meals, check-in reminders with per-day targeting
- Deep linking via Apple App Site Association for password reset flow
- Sharp-based asset generation pipeline for icons and splash screens
- Account deletion Edge Function with 13-table cascading cleanup
- In-app privacy policy and PrivacyInfo.xcprivacy manifest

**Note:** Closed as-is. App Store submission (remaining 16-03/16-04 work) moves to V2 launch phase.

**What's next:** V2 revamp — new design system, DP/rank progression, archetypes, freemium model.

---

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

## v2.2.1 Social Sharing (Shipped: 2026-03-07)

**Delivered:** Three branded share card types (Rank-Up, Workout, Compliance) that users share to social media after key protocol moments. PNG generation via html-to-image, native share sheet via @capacitor/share, DP rewards for sharing with daily/per-rank gating.

**Phases completed:** 37-40 (4 phases, 6 plans)

**Key accomplishments:**

- Share infrastructure with html-to-image PNG generation, @capacitor/share native sheet, and dpStore share actions with daily/per-rank gating
- ShareCardWrapper component for off-screen DOM rendering with web download fallback
- RankUpShareCard with gold/obsidian styling, integrated into RankUpModal with +10 DP per-rank reward
- ComplianceShareCard with 5-check layout and milestone banners (Day 7/30/100), integrated into CheckInModal with +5 DP daily reward
- WorkoutShareCard with full-bleed photo layout and camera compositing via ShareBottomSheet, integrated into Workouts with +5 DP daily reward

**Stats:**

- 39 files created/modified
- +5,165 lines of TypeScript/TSX
- 4 phases, 6 plans
- Git range: `chore(37-01)` → `docs(40-02)`

**What's next:** Continue v2.2 Auth Flow Redesign (Phases 33-36).

---

