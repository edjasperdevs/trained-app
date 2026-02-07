# Project Research Summary

**Project:** Trained v1.3 Coach Dashboard Milestone
**Domain:** Online fitness coaching platform (single coach managing clients via PWA)
**Researched:** 2026-02-07
**Confidence:** HIGH

## Executive Summary

The Trained app already has significant coach infrastructure in place: `coach_clients` table with RLS policies, a Coach screen with client roster and detail views, and the ability to view client data (weight, macros, workouts, activity). What is missing is the ability for the coach to **prescribe** (assign workouts, set macro targets) and **collect structured feedback** (weekly check-ins). This milestone transforms a read-only monitoring dashboard into a full coaching platform.

The recommended approach leverages the existing React 18 + TypeScript + Vite + Zustand + Supabase stack with minimal new dependencies. Only ONE new client-side production dependency is needed: the shadcn Calendar component (which adds react-day-picker, ~12KB gzipped). Server-side additions include Supabase Edge Functions for email invites (using Resend API), three new database tables (invites, check_ins, workout_programs), and optional Supabase Realtime for live dashboard updates. The existing Zustand + localStorage architecture continues for client-originated data; coach-assigned data is server-authoritative and flows downward.

The critical architectural challenge is preventing data ownership collisions. The existing app is offline-first with Zustand localStorage as source of truth. Coach-assigned data (workout programs, macro targets set by coach) is server-authoritative and must flow FROM Supabase TO client. The fundamental risk is that the existing `syncAllToCloud()` function does unconditional upserts that will overwrite coach data. This must be solved FIRST by establishing clear data ownership (client-owned vs. coach-owned) and splitting sync into directional flows (push client data, pull coach data). Get this wrong and coach updates disappear within seconds of clients opening the app.

## Key Findings

### Recommended Stack

The existing stack is well-positioned with significant coach infrastructure already deployed. The Supabase schema includes `user_role` enum, `coach_clients` table with status tracking, comprehensive RLS policies granting coaches read access to client data, and a `coach_client_summary` materialized view. Critical finding: only ONE new client-side dependency needed (shadcn Calendar). Everything else uses existing packages or Supabase built-in features.

**Core technologies:**

- **Supabase Edge Functions (Deno runtime)**: Email sending for client invites — requires `service_role` key which must never be client-side. Free tier: 500K invocations/month. Used with Resend API for deliverability.
- **Resend**: Email delivery service for invite emails — official Supabase integration, simple API, free tier 3,000 emails/month (sufficient for single coach). Alternative to complex SMTP or SendGrid setup.
- **shadcn/ui Calendar component**: Date selection for workout programming — integrates seamlessly with existing Tailwind v4 + shadcn setup. Adds react-day-picker v9.x (~12KB gzipped). Only new client production dependency.
- **Supabase Realtime**: Live check-in notifications when coach dashboard is open — already bundled in installed `@supabase/supabase-js` v2.93.3, zero new dependencies. Free tier: 200 concurrent connections.
- **Three new database tables**: `invites` (email tracking), `check_ins` (weekly structured forms), `workout_programs` (coach-assigned workouts for specific dates) — all with corresponding RLS policies following existing patterns.

**Critical "do NOT add" recommendations:**
- Do NOT add React Query/TanStack Query — existing `useClientDetails` hook pattern with Map-based cache works fine
- Do NOT add form library (React Hook Form, Formik) — 7-field check-in form does not justify dependency weight
- Do NOT add Socket.IO or Pusher — Supabase Realtime already provides WebSocket subscriptions
- Do NOT add drag-and-drop library — workout programming is a form, not a drag-and-drop interface
- Do NOT add React Email — single invite template does not need component-based email system

### Expected Features

Research across TrueCoach, TrainHeroic, Hevy Coach, Everfit, and CoachRx reveals clear table stakes vs. differentiators. The existing coach dashboard has the foundation (client roster, detail views, read-only data access) but is missing the ability to prescribe and collect feedback.

**Must have (table stakes):**

- **Client invitation flow (enhancement)**: Current implementation requires clients to already have accounts. Industry standard is email invite that triggers signup. Needs Supabase Edge Function + Resend integration with invite tracking table (`status: pending/accepted/expired`).
- **Workout programming (new)**: Coach assigns exercises with sets/reps/weight to specific client calendar dates. Universal across all coaching platforms. Requires `workout_programs` table separate from `workout_logs` (assigned vs. logged). Client sees prescribed workout in place of auto-generated template.
- **Macro target setting (enhancement)**: Coach sets protein/calories/carbs/fats remotely. RLS policy already grants coach UPDATE on `macro_targets` table — just needs UI and `set_by` column to distinguish coach-set from client-calculated.
- **Client roster & at-a-glance dashboard (enhancement)**: Already built with status indicators, quick stats, sort by urgency. Needs pagination for 50+ clients and compliance rate once workout programming exists.
- **Structured weekly check-ins (new)**: 10 standard questions (weight, training/nutrition adherence 1-10 scales, sleep, stress, energy, wins/challenges/questions). Separate from daily XP check-in. Coach reviews and responds. Critical for qualitative coaching feedback without fragmenting to external tools (Google Forms, WhatsApp).
- **Role-based navigation (new)**: Coach sees different nav than clients. Currently `/coach` route is not in bottom nav (accessed via Settings link). This is correct — most users are clients, not the coach. No changes needed to Navigation.tsx.

**Should have (competitive differentiators):**

- **Gamification visibility for coach**: No competitor shows XP, levels, streaks, badges to coach. Unique to Trained. Coach can see which clients are "leveling up" vs. "stagnating" in gamification terms.
- **Training-day vs. rest-day macro targets**: Most apps offer only flat daily targets. Everfit supports this natively. Genuine coaching best practice (higher carbs training days, lower rest days). Requires schema change — defer to v2.
- **Prescribed vs. actual reporting**: Coach prescribes 4x8 at 185 lbs, client logs 4x6,7,8,5 at 175 lbs. Show both side-by-side. TrainHeroic and Hevy Coach core feature.
- **Program templates**: Coach builds "12-Week Hypertrophy Program" once, assigns to many clients with modifications. Critical for scaling beyond 20 clients (TrueCoach's business model).

**Defer (v2+):**

- **In-app messaging**: Deceptively complex (realtime sync, read receipts, notification infrastructure). Weekly check-in system covers 80% of coach-client communication needs without infrastructure burden.
- **Progress photos**: Requires image upload to Supabase Storage, storage policies, compression, comparison viewer. Significant scope increase. Clients can share photos externally.
- **Exercise video library**: TrueCoach has 1,200+ videos. This is a content project, not a software project. Use exercise names with text notes; allow URL field if coach wants to link videos.
- **AI workout generation**: Sounds impressive, adds little value for single coach who already knows how to program. Manual builder with templates is more efficient.

### Architecture Approach

The fundamental design principle is "two data authorities": client-originated data flows FROM Zustand TO Supabase (offline-first, unchanged), while coach-originated data flows FROM Supabase TO client (server-authoritative, new pattern). The critical challenge is preventing these from conflicting. The existing `syncAllToCloud()` does unconditional upserts that will overwrite coach data — this must be refactored into directional flows.

**Major components:**

1. **Three new database tables with RLS policies**: `invites` (tracks email invitations with status/expiry), `check_ins` (weekly structured forms with coach review), `workout_programs` (coach-assigned workouts with exercises JSONB matching existing structure). RLS follows existing pattern: coaches own their data, clients view their assignments. Critical: add `set_by` column to `macro_targets` to distinguish coach-set from client-calculated.

2. **Directional sync refactor**: Split `syncAllToCloud()` into `pushClientOwnedData()` (workout logs, meal logs, weight entries, XP — unchanged) and `pullCoachOwnedData()` (assigned workouts, coach-set macros, check-in templates). Client NEVER pushes coach-owned data. Coach writes directly to Supabase, client polls on app open + visibility change. Supabase Realtime optional for live updates but NOT required initially (polling is correct pattern for low-frequency updates).

3. **Custom hooks with in-memory cache**: Extend existing `useClientDetails` pattern (5-minute Map-based cache) for coach data. New hooks: `useCoachTemplates`, `useClientAssignments`, `useCoachNotes`. NO new Zustand stores for coach data (server-authoritative, no localStorage persistence). Coach UI uses `useState` inside hooks, same as `useClientDetails`.

4. **Supabase Edge Function for email invites**: Deno-based function with Resend API integration. Accepts coach_id + email, creates invite record, sends branded email, optionally calls `auth.admin.inviteUserByEmail()` for new users. Server-side only (needs `service_role` key). Invoked from client via `supabase.functions.invoke('send-invite')`.

5. **RLS performance optimization**: Existing policies use `EXISTS` subqueries against `coach_clients` table. At 90K clients, this is catastrophically slow (subquery runs per-row). Replace with security definer functions for initPlan caching. Add partial index: `CREATE INDEX idx_coach_clients_active ON coach_clients(coach_id, client_id) WHERE status = 'active'`. Replace `coach_client_summary` view with paginated RPC function.

### Critical Pitfalls

Research identified 16 pitfalls across critical/moderate severity. Top 5 that will cause data corruption or require architectural rewrites:

1. **Offline-first vs. server-authoritative paradigm collision**: The entire existing app treats Zustand localStorage as source of truth. Coach-assigned data (workouts, macros set by coach, check-in schedules) is server-authoritative and must flow down to client. Current sync has NO mechanism for "server says your macros changed, update local state." If coach sets macros and client's `scheduleSync()` fires, stale localStorage values OVERWRITE coach update. **Prevention**: Add `source/set_by` column to `macro_targets` ('self' vs. 'coach'). When 'coach', client never pushes. Create `loadCoachDataFromCloud()` that runs on app load + Realtime subscription. NEVER let `syncAllToCloud()` touch coach-owned rows.

2. **RLS policy performance death at scale**: Existing RLS policies use `EXISTS` subqueries repeated 10 times across 8 tables. With 90K clients querying ANY client-related table, PostgreSQL executes correlated subquery FOR EVERY ROW. Supabase docs explicitly warn about this. `coach_client_summary` view has correlated subqueries for latest weight and workouts last 7 days — at 90K clients this will timeout. **Prevention**: Replace `EXISTS` with security definer functions wrapped in SELECT for initPlan caching. Add composite partial index on coach_clients(coach_id, client_id, status='active'). Replace view with paginated RPC function using LATERAL joins. Test with 1,000+ clients EARLY.

3. **Coach-assigned vs. client-owned data ownership ambiguity**: Single `macro_targets` table row per user. Coach sets targets, client recalculates via onboarding and overwrites. No way to distinguish "client calculated" from "coach set." Same for workouts: existing `workoutStore` generates from templates with no concept of "coach assigned this specific workout for this date." **Prevention**: Add `set_by` column to `macro_targets`. Create separate `assigned_workouts` table (NOT same as `workout_logs`). Assigned workouts have coach_id, client_id, assigned_date, exercises JSONB, status (assigned/completed/skipped). Client checks for assigned workout FIRST, falls back to template if none. Make distinction visible in UI with "Assigned by Coach" badge.

4. **Macro target overwrite race condition**: `syncMacroTargetsToCloud()` does unconditional upsert from localStorage. Timeline: T0 client has 2200 cal in localStorage, T1 coach sets 2500 cal via dashboard, T2 client logs meal triggering `scheduleSync()`, T3 after 2s debounce `syncMacroTargetsToCloud()` runs, T4 stale 2200 cal OVERWRITES coach's 2500 cal. This will happen every time coach updates macros for client with app open. **Prevention**: Use data ownership pattern — if `set_by='coach'`, client sync NEVER writes to macro_targets. Better: separate sync into `pushClientDataToCloud()` (only client-owned) and `pullCoachDataFromCloud()` (only reads). Use Realtime to push coach changes immediately rather than waiting for sync cycle.

5. **RLS role escalation via client-side role check**: Existing RLS policy "Coaches can manage their client relationships ON coach_clients FOR ALL USING (coach_id = auth.uid())" allows ANY authenticated user to insert rows where they are coach_id. No check that user has `role = 'coach'` in profiles table. Client could modify localStorage, create coach_clients row making themselves coach, access coach dashboard. **Prevention**: Fix policy to require `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach')`. Make `role` column non-updatable by user (column-level permission or trigger). Client-side check is UX only, RLS is security boundary. Set coach role via migration/admin only.

## Implications for Roadmap

Based on research, suggested phase structure aligns with pitfall analysis revealing clear dependency chain:

### Phase 1: Foundation — Data Ownership & Schema

**Rationale:** Pitfalls #1, #3, #4 form interconnected cluster around data ownership and sync direction. These MUST be solved together before any coach write feature. Building workout programming or macro management without solving data ownership guarantees corruption.

**Delivers:**
- Clear data ownership model documented (client-owned vs. coach-owned tables)
- Three new tables with RLS policies: `invites`, `check_ins`, `workout_programs`
- Schema additions: `set_by` column on `macro_targets`, `invite_status` enum
- RLS policy fixes: require `role='coach'` on coach_clients policy (security vulnerability)
- Composite partial index for RLS performance: `idx_coach_clients_active`
- Database types update in `database.types.ts`
- Auth guard on `/coach` route (redirects non-coaches)

**Addresses:**
- PITFALL #1: Offline-first vs. server-authoritative collision (schema foundation)
- PITFALL #3: Coach-assigned vs. client-owned ambiguity (set_by column, separate tables)
- PITFALL #8: Role escalation via client-side check (RLS policy fix)
- PITFALL #2: RLS performance at scale (index optimization)

**Research flags:** Standard schema work with existing patterns. Skip `/gsd:research-phase`.

---

### Phase 2: Sync System Refactor

**Rationale:** Must happen BEFORE any coach write operations exist. Current `syncAllToCloud()` does unconditional upserts that will overwrite coach data the moment client triggers `scheduleSync()`.

**Delivers:**
- `pushClientOwnedData()` function: syncs workout_logs, meal_logs, weight_logs, XP, client-calculated macros ONLY
- `pullCoachOwnedData()` function: fetches assigned workouts, coach-set macros, check-in templates
- Guard logic in sync functions: check `set_by` before upserting macro_targets
- `checkCoachUpdates()` integrated into app open + visibility change handler
- Sync ownership constants documented per-table
- Update to `loadAllFromCloud()` to include coach data tables

**Addresses:**
- PITFALL #4: Macro target overwrite race condition (directional sync)
- PITFALL #12: Existing sync writing coach data back incorrectly (refactor)
- PITFALL #1: Sync direction implementation

**Uses:**
- Existing `scheduleSync()` debounce mechanism (unchanged)
- Existing `flushPendingSync()` trigger points (enhanced)

**Research flags:** Standard refactor of existing patterns. Skip `/gsd:research-phase`.

---

### Phase 3: Email Infrastructure & Invite System

**Rationale:** Cannot invite clients without email delivery. Supabase default SMTP is 2-3 emails/hour (unusable). Must set up custom SMTP + Edge Function + invite tracking BEFORE building invite UI.

**Delivers:**
- Supabase Edge Function `send-invite` (Deno + Resend API)
- Resend account setup with verified sending domain (DNS records)
- RESEND_API_KEY stored as Supabase secret
- Invite table tracking with `status`, `expires_at`, `accepted_at`
- Client-side `supabase.functions.invoke('send-invite')` integration
- Branded HTML email template (simple, no React Email)
- Invite acceptance endpoint handling validation, user creation, coach_clients link
- Security: cryptographic tokens (UUIDv4), single-use, 7-day expiry, rate limiting (100/hour)

**Addresses:**
- PITFALL #5: Supabase email rate limits blocking bulk invites (custom SMTP)
- PITFALL #6: Invite link security and abuse vectors (token design)
- FEATURES: Client invitation flow (table stakes)

**Research flags:** Edge Functions + Resend integration well-documented. Official Supabase examples exist. Skip `/gsd:research-phase`.

---

### Phase 4: Client Roster with Pagination

**Rationale:** Coach dashboard entry point. Existing Coach.tsx loads all clients with `coach_client_summary` view that has N+1 query explosion. Must fix before building on top of it.

**Delivers:**
- Replace `coach_client_summary` view with paginated RPC function `get_coach_clients`
- Server-side pagination (25 clients per page), search (ILIKE on username/email), sort
- Security definer function with coach role verification
- Coach dashboard UI with lazy-loaded route (bundle splitting for coach code)
- Pagination controls, search input, total client count display
- Empty states for zero clients, zero search results
- Client detail modal enhancement: add "Assign Workout" and "Update Macros" buttons (Phase 5-6)
- Dev mock data for coach templates, assignments

**Addresses:**
- PITFALL #7: coach_client_summary view N+1 query explosion (replace with RPC)
- PITFALL #14: Pagination absence on 90K roster (server-side pagination)
- PITFALL #16: Coach bundle bloating client app (lazy loading)
- FEATURES: Client roster enhancement (table stakes)

**Uses:**
- React lazy loading for `/coach/*` routes
- Existing `useClientDetails` hook pattern (extend for coach needs)

**Research flags:** Standard data table + pagination. Skip `/gsd:research-phase`.

---

### Phase 5: Workout Programming (Coach Side)

**Rationale:** Core coaching feature. Higher complexity but well-documented pattern across all coaching platforms. Depends on schema (Phase 1), sync refactor (Phase 2), and roster (Phase 4) but NOT email infrastructure (Phase 3 can run parallel).

**Delivers:**
- `useCoachTemplates` hook (CRUD for workout_programs, Map-based cache)
- `CoachTemplateEditor` component (exercise list editor matching existing CustomExercise shape)
- Workout programming UI in coach dashboard: select date, assign exercises with sets/reps/weight
- Exercise library UI (reuse existing template exercises as starting point)
- Assignment creation linking workout_programs to client with date
- Coach view of client's upcoming programmed workouts (week-at-a-glance)

**Addresses:**
- FEATURES: Workout programming (table stakes, universal pattern)
- PITFALL #11: Assigned vs. logged workout data model (separate tables implemented in Phase 1)

**Implements:**
- ARCHITECTURE: workout_programs table from Phase 1 schema
- ARCHITECTURE: `useCoachTemplates` hook following existing pattern

**Research flags:** Exercise list editing is straightforward CRUD. Standard patterns from TrueCoach/Hevy Coach. Skip `/gsd:research-phase`.

---

### Phase 6: Workout Programming (Client Side)

**Rationale:** Client must see and execute coach-assigned workouts. Depends on Phase 5 (coach can assign) and Phase 2 (client pulls coach data).

**Delivers:**
- Client `pullCoachOwnedData()` fetches active workout_programs for today/upcoming
- Workouts screen: check for assigned workout FIRST, fall back to template if none
- "Custom plan from coach" indicator badge on Workouts screen
- Pre-loaded exercises from assignment when client starts workout
- `workout_logs` records actual performance with `assigned_workout_id` reference
- Coach dashboard: view client's actual performance against assigned workout (prescribed vs. actual)

**Addresses:**
- FEATURES: Client sees prescribed workout (table stakes)
- ARCHITECTURE: Client receives coach data (Phase 4 component from architecture doc)

**Uses:**
- Existing `workoutStore` for logging (unchanged)
- Phase 2 `pullCoachOwnedData()` sync function
- Phase 1 `workout_programs` table

**Research flags:** Integration of assigned workout into existing workout flow. Standard pattern. Skip `/gsd:research-phase`.

---

### Phase 7: Macro Management

**Rationale:** Lowest complexity coach feature. Existing schema + RLS already support it (coach can UPDATE macro_targets). Quick win delivering real coaching value. Independent of workout programming (Phases 5-6).

**Delivers:**
- `MacroTargetEditor` component (coach UI to set protein/calories/carbs/fats for client)
- Direct update to client's `macro_targets` row with `set_by='coach'`
- Client `pullCoachOwnedData()` checks macro_targets updated_at, updates macroStore if newer
- Macros screen: "Set by coach" indicator, disable "Recalculate" button when `set_by='coach'`
- Coach dashboard: audit trail of macro changes (timestamp, previous/new values)
- Toast notification when client sees coach-updated targets: "Your coach updated your macro targets"

**Addresses:**
- FEATURES: Macro target setting (table stakes)
- PITFALL #4: Overwrite race condition (set_by guard prevents client push)
- PITFALL #3: Data ownership ambiguity (set_by column implementation)

**Uses:**
- Phase 1 `set_by` column on macro_targets
- Phase 2 directional sync (client never pushes coach-set macros)

**Research flags:** Simple CRUD on existing table with ownership guard. Skip `/gsd:research-phase`.

---

### Phase 8: Weekly Check-ins

**Rationale:** Structured feedback loop. Depends on nothing from prior coach features (independent). Logically comes after workouts and macros are in place (check-in questions reference adherence).

**Delivers:**
- 10 standard check-in questions (weight, training/nutrition adherence 1-10, sleep, stress, energy, wins/challenges/questions)
- Client check-in form prominent on Home screen (persistent card when due)
- `check_ins` table: stores client responses with week_of date, submitted_at, reviewed_at
- Coach dashboard: "Pending check-ins" view (clients who have NOT submitted this week)
- Coach review UI: read check-in, write response (coach_notes field)
- Client sees "Coach reviewed your check-in" indicator
- Check-in completion awards XP (gamification integration)
- Supabase Realtime subscription: coach dashboard updates when client submits (optional, polling sufficient)

**Addresses:**
- FEATURES: Structured weekly check-ins (table stakes)
- PITFALL #10: Check-in form schema rigidity (hardcode 10 questions for MVP, defer custom templates)
- PITFALL #15: Check-in response rate collapse (home screen placement, short form, XP incentive)

**Uses:**
- Phase 1 `check_ins` table
- Existing gamification system (XP awards)
- Optional: Supabase Realtime for live updates (STACK decision)

**Research flags:** Standard form + review workflow. Questions derived from coaching best practices research. Skip `/gsd:research-phase`.

---

### Phase Ordering Rationale

The critical insight from pitfall analysis: Phases 1-2 (data ownership + sync refactor) are the FOUNDATION. Building any coach write feature without solving data ownership guarantees corruption. Phase 3 (email infrastructure) is infrastructure work that blocks invite feature but is independent of other features. Phase 4 (roster) is the coach dashboard entry point — must work before building features on top of it.

Phases 5-8 are coach features that can be sequenced flexibly:
- Workout programming (5-6) is highest value but highest complexity
- Macro management (7) is lowest complexity, quick win
- Check-ins (8) is independent feedback loop

Recommended order: Foundation (1-2) -> Infrastructure (3) -> Entry point (4) -> Quick win (7) -> Core feature (5-6) -> Feedback loop (8). This delivers value incrementally while respecting dependencies.

**Key dependencies discovered:**
- Data ownership model (Phase 1) blocks ALL coach write operations
- Sync refactor (Phase 2) blocks ALL coach data flowing to clients
- Roster with pagination (Phase 4) is entry point for ALL coach UI features
- Email infrastructure (Phase 3) blocks invites but nothing else (can run parallel with 4-5)

**Pitfall avoidance:**
- Phases 1-2 prevent data corruption (Pitfalls #1, #3, #4, #12)
- Phase 1 fixes security vulnerability (Pitfall #8)
- Phase 3 prevents invite system failure (Pitfalls #5, #6)
- Phase 4 prevents performance death (Pitfalls #2, #7, #14)
- Phase 8 design prevents check-in abandonment (Pitfall #15)

### Research Flags

**Phases with standard patterns (skip research-phase):**

- **Phase 1 (Schema):** Follows existing patterns in `schema.sql`. RLS policies match current structure. No novel patterns.
- **Phase 2 (Sync refactor):** Extends existing sync.ts patterns. Directional sync is straightforward guard logic.
- **Phase 3 (Email infrastructure):** Official Supabase + Resend integration with documented examples. Edge Functions well-documented.
- **Phase 4 (Client roster):** Standard data table with pagination. Similar to any admin panel client list.
- **Phase 5-6 (Workout programming):** Well-documented pattern across TrueCoach, Hevy Coach, TrainHeroic. Exercise CRUD is standard.
- **Phase 7 (Macro management):** Simple CRUD on existing table with ownership guard. Straightforward.
- **Phase 8 (Check-ins):** Form + review workflow. Questions derived from coaching research. Standard pattern.

**No phases require deeper research.** All patterns are well-documented in either official Supabase documentation, competitive platform research (TrueCoach, Hevy Coach, Everfit), or existing codebase patterns. The research files (STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md) provide sufficient detail for execution.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing stack analyzed, official Supabase docs verified, Resend integration documented, shadcn Calendar current (June 2025 upgrade to v9) |
| Features | HIGH | Codebase analysis of existing coach infrastructure, competitive research across 5 platforms (TrueCoach, Hevy Coach, TrainHeroic, Everfit, CoachRx), feature patterns validated |
| Architecture | HIGH | Direct codebase analysis of all 20+ relevant files, existing patterns documented (useClientDetails hook, sync.ts, workoutStore, macroStore, RLS policies), data ownership model clear |
| Pitfalls | HIGH | 16 pitfalls identified from Supabase RLS performance docs, offline-first architecture research, competitive platform postmortems, codebase vulnerability analysis (existing RLS policy flaw found) |

**Overall confidence:** HIGH

All four research dimensions have high confidence. Stack recommendations are based on official documentation and verified compatibility with installed versions. Features are validated by competitive analysis across multiple established platforms. Architecture is grounded in direct codebase analysis with existing patterns identified. Pitfalls are derived from official Supabase performance docs plus real failure modes documented in coaching platform development.

### Gaps to Address

**Edge Function CORS handling:** The project uses `@supabase/supabase-js` v2.93.3 which requires manual CORS headers in Edge Functions. Supabase docs mention v2.95.0+ has importable CORS helpers. Consider bumping to v2.95+ during Phase 3 implementation to simplify Edge Function CORS handling. Alternatively, use manual CORS headers (5 lines of boilerplate).

**Supabase Realtime free tier message limits:** 200 concurrent connections verified, but per-message pricing less clear in documentation. For single coach with <100 active clients, this is well within limits. If message costs become non-trivial, fall back to polling-only (already recommended as primary pattern).

**Coach roster scaling beyond 90K:** Research focused on 90K potential clients (0.1-0.2% conversion of ~90K followers). Pagination design handles this with keyset cursors. If roster grows beyond 90K, consider materialized `client_activity_cache` table (updated by triggers on weight_logs, workout_logs) to replace correlated subqueries in the RPC function. This is optimization for extreme scale, not required for launch.

**Check-in template customization:** Phase 8 hardcodes 10 standard questions. Research documented template+response pattern with JSONB for future customization (Pitfall #10 prevention). If coach requests custom questions post-launch, the schema supports this via `checkin_templates` table. But defer template builder UI to future milestone — MVP uses fixed questions.

## Sources

### Primary (HIGH confidence)

**Supabase official documentation:**
- [Supabase Edge Functions quickstart](https://supabase.com/docs/guides/functions/quickstart)
- [Supabase send emails example](https://supabase.com/docs/guides/functions/examples/send-emails)
- [Supabase Edge Functions CORS](https://supabase.com/docs/guides/functions/cors)
- [Supabase Edge Functions pricing](https://supabase.com/docs/guides/functions/pricing)
- [Supabase auth.admin.inviteUserByEmail](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail)
- [Supabase Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Supabase Realtime pricing](https://supabase.com/docs/guides/realtime/pricing)
- [Supabase Realtime limits](https://supabase.com/docs/guides/realtime/limits)
- [Supabase RLS performance and best practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)
- [Supabase auth rate limits](https://supabase.com/docs/guides/auth/rate-limits)
- [Supabase custom SMTP configuration](https://supabase.com/docs/guides/auth/auth-smtp)

**Resend integration:**
- [Resend + Supabase Edge Functions](https://resend.com/docs/send-with-supabase-edge-functions)
- [Resend pricing](https://resend.com/pricing)
- [Resend Supabase integration page](https://resend.com/supabase)

**shadcn/ui:**
- [shadcn/ui Calendar component](https://ui.shadcn.com/docs/components/radix/calendar)
- [shadcn Calendar June 2025 update](https://ui.shadcn.com/docs/changelog/2025-06-calendar)
- [react-day-picker v9.13.1](https://www.npmjs.com/package/react-day-picker)

**Codebase analysis (high confidence):**
- `supabase/schema.sql` (existing tables, RLS policies, coach_client_summary view, coach infrastructure)
- `src/screens/Coach.tsx` (existing coach dashboard, 708 lines, client roster + detail modal)
- `src/stores/workoutStore.ts` (workout templates, CustomExercise types, no assignment concept)
- `src/stores/macroStore.ts` (calculateMacros, syncMacroTargetsToCloud unconditional upsert)
- `src/lib/sync.ts` (scheduleSync 2s debounce, syncAllToCloud pattern, no pull mechanism)
- `src/hooks/useClientDetails.ts` (5-minute Map cache pattern, coach data fetch example)
- `src/lib/supabase.ts` (isCoach helper, profile role check)
- `src/components/Navigation.tsx` (5-tab bottom nav, coach not included)
- `src/screens/CheckInModal.tsx` (daily XP check-in, distinct from weekly coaching check-in)

### Secondary (MEDIUM confidence)

**Coaching platform feature research:**
- [TrueCoach Dashboard Features](https://truecoach.co/features/dashboard/)
- [TrueCoach Program & Workout Builder](https://truecoach.co/features/program-workout-builder/)
- [TrueCoach Client Invitation Email](https://help.truecoach.co/en/articles/2403930-client-invitation-email)
- [TrueCoach Compliance Tracking](https://truecoach.co/features/compliance-tracking/)
- [Hevy Coach Workout Builder](https://hevycoach.com/features/workout-builder/)
- [Everfit Nutrition Coaching Macros](https://help.everfit.io/en/articles/4578482-nutrition-coaching-macros)
- [Everfit Forms & Questionnaires](https://help.everfit.io/en/articles/6633667-how-to-create-forms-questionnaires)
- [TrainHeroic Coach Features](https://www.trainheroic.com/coach/)
- [CoachRx Competitive Comparison](https://www.coachrx.app/coachrx-comparison)

**Check-in best practices:**
- [MyPTHub: Essential Client Check-In Questions](https://www.mypthub.net/blog/essential-client-check-in-questions/)
- [HubFit: 10 Must-Ask Check-In Questions](https://hubfit.io/blog/10-questions-for-weekly-checkins)

**Offline-first architecture:**
- [Offline-First Frontend Apps 2025](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/)
- [Data Synchronization in PWAs](https://gtcsys.com/comprehensive-faqs-guide-data-synchronization-in-pwas-offline-first-strategies-and-conflict-resolution/)

### Tertiary (LOW confidence)

- ISSA: How Many Clients Should a Personal Trainer Have (15-25 typical for online coaches)
- Client roster scaling beyond 50 clients (no direct benchmark for creator-coach apps with 90K follower base; sizing extrapolated)

---

*Research completed: 2026-02-07*
*Ready for roadmap: yes*
*Synthesized from: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md*
