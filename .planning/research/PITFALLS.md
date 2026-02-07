# Coach Dashboard Pitfalls

**Research Date:** 2026-02-07
**Context:** Adding coach dashboard features (invite, roster, workout programming, macro management, weekly check-ins) to existing Trained fitness PWA. The app is currently single-user, offline-first (Zustand localStorage as source of truth, Supabase as cloud sync). Coach features introduce multi-user relationships, server-authoritative data, and a fundamental paradigm shift for assigned vs. self-directed data.

---

## Table of Contents

1. [Offline-First vs. Server-Authoritative Paradigm Collision](#1-offline-first-vs-server-authoritative-paradigm-collision)
2. [RLS Policy Performance Death at Scale](#2-rls-policy-performance-death-at-scale)
3. [Coach-Assigned vs. Client-Owned Data Ownership Ambiguity](#3-coach-assigned-vs-client-owned-data-ownership-ambiguity)
4. [Macro Target Overwrite Race Condition](#4-macro-target-overwrite-race-condition)
5. [Supabase Email Rate Limits Blocking Bulk Invites](#5-supabase-email-rate-limits-blocking-bulk-invites)
6. [Invite Link Security and Abuse Vectors](#6-invite-link-security-and-abuse-vectors)
7. [coach_client_summary View N+1 Query Explosion](#7-coach_client_summary-view-n1-query-explosion)
8. [Role Escalation via Client-Side Role Check](#8-role-escalation-via-client-side-role-check)
9. [Coach Route Leaking Into Client Navigation](#9-coach-route-leaking-into-client-navigation)
10. [Check-In Form Schema Rigidity](#10-check-in-form-schema-rigidity)
11. [Assigned Workout vs. Logged Workout Data Model Confusion](#11-assigned-workout-vs-logged-workout-data-model-confusion)
12. [Existing Sync System Writing Coach Data Back Incorrectly](#12-existing-sync-system-writing-coach-data-back-incorrectly)
13. [Single Coach Account as a Single Point of Failure](#13-single-coach-account-as-a-single-point-of-failure)
14. [Pagination Absence on 90K Client Roster](#14-pagination-absence-on-90k-client-roster)
15. [Check-In Response Rate Collapse](#15-check-in-response-rate-collapse)
16. [Coach Dashboard Bundle Bloating Client App](#16-coach-dashboard-bundle-bloating-client-app)

---

## Critical Pitfalls

Mistakes that cause data corruption, security breaches, or require architectural rewrites.

---

### 1. Offline-First vs. Server-Authoritative Paradigm Collision

**What goes wrong:** The entire existing app treats Zustand localStorage as the source of truth. `loadAllFromCloud()` only runs on login; `syncAllToCloud()` pushes local state upward. This works for single-user self-directed data. But coach-assigned data (workout programs, macro targets set by coach, check-in schedules) is server-authoritative -- it originates on the server and must flow down to the client. The current sync architecture has NO mechanism for "server says your macros changed, update your local state." If the coach sets a client's macros to 2500 cal and the client's localStorage still has 2200 cal from their own calculation, the client sees 2200 until they log out and log back in.

**Why it happens in THIS codebase:** The `macroStore` calculates targets locally via `calculateMacros()` and persists them to localStorage via Zustand's `persist` middleware. The `syncMacroTargetsToCloud()` function pushes local targets UP to Supabase. There is no `loadMacroTargetsFromCloud()` function that checks whether the server has newer targets. The `loadAllFromCloud()` function only loads profile and weight logs -- it does NOT load macro targets, workout programs, or any coach-assigned data.

**Specific collision points:**
- `macro_targets` table: Coach updates via dashboard. Client's local macroStore still has old values. Next `syncMacroTargetsToCloud()` call OVERWRITES coach's update with stale client values.
- Assigned workouts: Coach assigns a workout for Tuesday. Client is offline. When client comes online, `syncAllToCloud()` pushes THEIR workout templates up, but never pulls coach-assigned workouts down.
- Check-in schedule: Coach expects weekly check-in. Client has no concept of coach-mandated schedules in their local stores.

**Warning signs:**
- Coach sets macros for a client, but client still sees old macros
- Coach assigns a workout, client never sees it
- Client's `scheduleSync()` overwrites coach data after reconnecting

**Prevention:**
1. Introduce a clear data ownership model with TWO categories:
   - **Client-owned data** (workout logs, meal logs, weight entries, XP, streaks): Continues using current offline-first pattern. Client is source of truth. Sync pushes up.
   - **Coach-owned data** (assigned workouts, macro targets set by coach, check-in templates): Server is source of truth. Client PULLS these on load and on realtime subscription. Client NEVER pushes these up.
2. Add a `source` or `set_by` column to `macro_targets` table: `'self' | 'coach'`. When source is `'coach'`, the client's `calculateMacros()` function is disabled or shows "Set by coach" UI. The `syncMacroTargetsToCloud()` function SKIPS targets where source is `'coach'`.
3. Create a new sync direction: `loadCoachDataFromCloud()` that runs on app load AND subscribes to Supabase Realtime for changes to coach-owned tables. This is the opposite of the existing push-only pattern.
4. NEVER let `syncAllToCloud()` touch coach-owned rows. Guard every upsert with a check: "Is this data owned by the client?"

**Detection:** After implementing coach macros, test this sequence: Coach sets macros -> Client opens app -> Client sees new macros -> Client goes offline -> Client logs a meal -> Client comes online -> Coach's macros should STILL be the targets, not overwritten.

**Phase relevance:** This is the FOUNDATIONAL architectural decision. It must be resolved BEFORE any coach feature is built. Every other feature (assigned workouts, check-ins, macro management) depends on getting the data ownership model right.

---

### 2. RLS Policy Performance Death at Scale

**What goes wrong:** The existing schema already has RLS policies for coach access using `EXISTS` subqueries against the `coach_clients` table. Example from the current `schema.sql`:

```sql
CREATE POLICY "Coaches can view client weight logs"
  ON weight_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_clients.coach_id = auth.uid()
      AND coach_clients.client_id = weight_logs.user_id
      AND coach_clients.status = 'active'
    )
  );
```

This pattern is repeated 10 times across 8 tables. For a coach with 90,000 clients querying ANY client-related table, PostgreSQL executes this correlated subquery FOR EVERY ROW in the table. If `workout_logs` has 10 million rows (90K clients x ~110 workouts each), the `EXISTS` subquery runs 10 million times. Even with the `idx_coach_clients_coach` index, this becomes catastrophically slow.

**Supabase documentation explicitly warns:** "A policy with EXISTS subquery executes for every row in the table. With 10,000 documents, Postgres runs 10,000 subqueries, even if you only need 10 rows." At 90K clients, this is orders of magnitude worse.

**The `coach_client_summary` view compounds the problem:** It joins `coach_clients` + `profiles` + `user_xp` + two correlated subqueries (latest weight, workouts in last 7 days). This view has no RLS itself (it is `GRANT SELECT ON coach_client_summary TO authenticated`), but the underlying tables do. With 90K clients, this view will timeout.

**Warning signs:**
- Coach dashboard takes 10+ seconds to load client list
- Supabase logs show queries timing out at 30 seconds
- Coach viewing a single client profile is slow (RLS check runs against ALL coach_clients rows)
- Database CPU spikes whenever coach accesses the dashboard

**Prevention:**
1. Replace `EXISTS` subqueries with security definer functions:
   ```sql
   CREATE OR REPLACE FUNCTION is_coach_of(client_user_id UUID)
   RETURNS BOOLEAN AS $$
     SELECT EXISTS (
       SELECT 1 FROM coach_clients
       WHERE coach_id = auth.uid()
       AND client_id = client_user_id
       AND status = 'active'
     )
   $$ LANGUAGE sql SECURITY DEFINER STABLE;
   ```
   Then wrap in `SELECT` for initPlan caching:
   ```sql
   CREATE POLICY "Coaches can view client weight logs"
     ON weight_logs FOR SELECT
     USING (user_id = (SELECT auth.uid()) OR (SELECT is_coach_of(user_id)));
   ```
2. Replace the `coach_client_summary` view with a security definer function that returns the summary data, bypassing RLS on the underlying tables and handling access control internally.
3. Add explicit indexes:
   - `CREATE INDEX idx_coach_clients_coach_status ON coach_clients(coach_id, status)` (composite for the common query pattern)
   - Ensure `user_id` indexes exist on ALL tables the coach accesses
4. NEVER query all 90K clients at once. Always paginate (see Pitfall #14).
5. Test with realistic data volumes EARLY. Create 1,000 test clients minimum before considering the schema "working."

**Phase relevance:** RLS optimization must happen in the FIRST phase when the data model is created. Retrofitting RLS performance on an existing schema with live data is painful. Get this right at the schema level before building any UI.

---

### 3. Coach-Assigned vs. Client-Owned Data Ownership Ambiguity

**What goes wrong:** The existing `macro_targets` table has a single row per user (`UNIQUE(user_id)`). When the coach sets a client's macros, it updates this same row. When the client recalculates their own macros via the onboarding flow or settings, it also updates this same row. There is no way to distinguish "client calculated these" from "coach set these." This creates several failure modes:

- Client completes onboarding, which calls `calculateMacros()` and overwrites coach-set targets
- Client clicks "Recalculate" in settings and blows away carefully tuned coach macros
- Coach cannot tell if a client is following coach-set macros or their own calculation
- If the coach removes a client, there is no "revert to self-calculated" path

**The same problem exists for workouts:** The existing `workoutStore` generates workout templates from hardcoded arrays (`THREE_DAY_TEMPLATES`, `FOUR_DAY_TEMPLATES`, etc.) based on the user's `trainingDaysPerWeek`. There is no concept of "coach assigned this specific workout for this specific date." If a coach assigns exercises, where do they go? Into the same `workoutStore`? Into a new table? How does the client distinguish "today's coach-assigned workout" from "today's auto-generated workout"?

**Warning signs:**
- Coach sets macros, client recalculates, coach's work is lost
- Client sees a workout but cannot tell if it is coach-assigned or self-generated
- After being removed from coaching, client has no macros at all (coach-set targets were the only ones)
- Coach assigns a workout but client also starts their auto-generated workout, creating duplicate logs

**Prevention:**
1. For macro targets: Add a `set_by` column (`'self' | 'coach'`) AND a `coach_macro_targets` table (or `set_by` + `coach_id` columns on `macro_targets`). When `set_by = 'coach'`, the client UI disables the "Recalculate" button and shows "Targets set by coach." When the coach relationship ends, fall back to `'self'` targets (which may need to be recalculated).
2. For workouts: Create a NEW `assigned_workouts` table separate from `workout_logs`. Assigned workouts have:
   - `coach_id`, `client_id`, `assigned_date`
   - `exercises` (JSONB, same structure as current workout exercises)
   - `status`: `'assigned' | 'completed' | 'skipped'`
   The client app checks for assigned workouts FIRST. If one exists for today, show it. If not, fall back to the auto-generated template. The `workout_logs` table continues to record what the client ACTUALLY DID.
3. Make the distinction visible in the UI: Coach-assigned items get a badge/indicator ("Assigned by Coach") so both coach and client know the data source.
4. Handle the "uncoaching" flow: When coach removes a client, transition `set_by` from `'coach'` to `'self'` and prompt client to recalculate if desired.

**Detection:** Test this sequence: Client has self-calculated macros -> Coach assigns new macros -> Client opens settings and sees "Set by coach" -> Client clicks "Recalculate" -> System blocks or warns "This will override coach-set targets."

**Phase relevance:** Data ownership must be modeled in the SCHEMA phase, before any coach write operations are built. Retrofitting `set_by` after data is already mixed is a migration headache.

---

### 4. Macro Target Overwrite Race Condition

**What goes wrong:** The existing `syncMacroTargetsToCloud()` function does an unconditional `upsert` on the `macro_targets` table. It reads from `useMacroStore.getState().targets` (localStorage) and writes to Supabase. If the coach updates a client's macros via the dashboard (writing directly to Supabase), and then the client's app triggers `scheduleSync()` (which fires `syncAllToCloud()` -> `syncMacroTargetsToCloud()`), the client's stale localStorage values OVERWRITE the coach's update.

**Timeline of the race:**
```
T0: Client has macros { protein: 150, calories: 2200 } in localStorage
T1: Coach sets macros { protein: 180, calories: 2500 } via dashboard (writes to Supabase)
T2: Client logs a meal, which triggers scheduleSync()
T3: After 2s debounce, syncMacroTargetsToCloud() runs
T4: Client's stale { protein: 150, calories: 2200 } OVERWRITES coach's update in Supabase
T5: Coach refreshes dashboard, sees their changes are gone
```

This is not hypothetical -- it will happen every time the coach updates macros for a client who has the app open or recently used.

**Warning signs:**
- Coach updates macros, refreshes, sees old values
- Client always shows their self-calculated macros regardless of coach updates
- Macro history shows ping-ponging between two sets of values

**Prevention:**
1. Add a `last_modified_by` and `updated_at` column to `macro_targets`. Before upserting, check: if `last_modified_by = 'coach'` and `updated_at` is after the client's last sync, SKIP the upsert. The coach's write wins.
2. Better: use the data ownership pattern from Pitfall #3. If `set_by = 'coach'`, the client sync function NEVER writes to `macro_targets`. It only reads.
3. Even better: separate the sync into directional flows:
   - `pushClientDataToCloud()`: Only pushes client-owned data (logs, weight, XP)
   - `pullCoachDataFromCloud()`: Only reads coach-owned data (targets, assigned workouts)
   The current `syncAllToCloud()` function must be refactored to NOT push coach-owned data.
4. Use Supabase Realtime to push coach changes to the client immediately, rather than waiting for the next sync cycle.

**Phase relevance:** This must be solved when building the macro management feature. The existing `syncMacroTargetsToCloud()` code must be modified BEFORE the coach can write to `macro_targets`.

---

### 5. Supabase Email Rate Limits Blocking Bulk Invites

**What goes wrong:** The coach wants to invite clients by email. Supabase's built-in email service has severe rate limits:
- Default SMTP: **2-3 emails per hour**
- Custom SMTP: Default starts at **30 emails per hour** (configurable)
- `auth.admin.inviteUserByEmail()` is subject to these same limits

If the coach needs to invite even 50 clients in one session (a reasonable batch when onboarding to the platform), they will hit rate limits immediately. The default SMTP is completely unusable for this use case.

**Additional email pitfalls:**
- Supabase's default email sender has no SLA on deliverability -- emails may go to spam or not arrive at all
- Email scanners (Microsoft SafeLinks, Proofpoint) may click the magic link in the invite, "consuming" it before the user does
- No built-in way to track which invites were delivered, opened, or bounced
- `auth.admin.inviteUserByEmail()` requires the service role key, which CANNOT be used from the client -- requires an Edge Function

**Warning signs:**
- Coach sends 10 invites, only 2 arrive
- Supabase returns 429 (rate limit) after 3 invites
- Clients report "invite link expired" because email scanners consumed the link
- No way to know if an invite failed -- coach just waits and wonders

**Prevention:**
1. Set up custom SMTP immediately (Resend, Postmark, or SendGrid). Configure DKIM, DMARC, and SPF for the sending domain to maximize deliverability. Supabase docs are clear: "Do not use the default SMTP for production."
2. Build a separate invite flow via Supabase Edge Functions + Resend API instead of using `auth.admin.inviteUserByEmail()`. This gives you:
   - Custom email templates (branded, not generic Supabase template)
   - Delivery tracking (Resend provides webhook events)
   - Higher rate limits (Resend free tier: 100 emails/day, paid: 50K/month)
   - Invite link that redirects through YOUR domain (prevents email scanner consumption)
3. Implement client-side invite queuing: If the coach pastes 50 emails, queue them and send in batches of 10 with delays. Show progress UI ("Sending invites... 20/50").
4. Store invite records in a `coach_invites` table:
   ```
   id, coach_id, email, status ('pending'|'sent'|'accepted'|'expired'),
   created_at, expires_at, accepted_at
   ```
   This lets the coach see which invites are pending, resend failed ones, and know when clients accept.
5. Set invite links to expire after 7 days (not 24 hours -- people check email irregularly). Allow the coach to resend.
6. Use a redirect URL (e.g., `trained.app/invite?token=xxx`) that lands on YOUR app, not a raw Supabase auth link. This prevents email scanners from consuming the token.

**Phase relevance:** Email infrastructure must be set up BEFORE the invite feature is built. This is infrastructure work (Edge Function + SMTP config + invite table) that blocks the entire invite flow.

---

### 6. Invite Link Security and Abuse Vectors

**What goes wrong:** The invite system creates a pathway from "anonymous internet user" to "authenticated user with a coach relationship." This opens several abuse vectors:

- **Invite link sharing:** A client shares their invite link on social media. Anyone who clicks it gets an account linked to the coach. With 90K followers, this could create thousands of unauthorized accounts.
- **Invite link enumeration:** If invite tokens are sequential or predictable, attackers can guess valid tokens.
- **Duplicate accounts:** The same email gets invited twice. Does it create two accounts? Two coach relationships? Or error silently?
- **Self-invite:** Coach accidentally invites their own email. Does this create a circular coach-client relationship?
- **Expired invites:** Client clicks an expired invite link. What happens? Generic error? Helpful message?

**Warning signs:**
- Unknown users appear in the coach's client roster
- Coach sees duplicate entries for the same email
- Invite links work indefinitely (no expiration enforced)
- Client clicks invite, gets a confusing Supabase error page

**Prevention:**
1. Invite tokens must be cryptographically random (UUIDv4 minimum, or a signed JWT with expiry). NEVER use sequential IDs or short codes.
2. Each invite token is single-use: once accepted, it is marked `status = 'accepted'` and cannot be reused. Attempts to reuse show "This invite has already been used."
3. Before creating an invite:
   - Check if the email is already a client of this coach (prevent duplicates)
   - Check if the email matches the coach's own email (prevent self-invite)
   - Check if a pending invite already exists for this email (offer to resend instead of creating a new one)
4. Invite acceptance must happen within a Supabase Edge Function that:
   - Validates the token
   - Checks expiration
   - Creates the user account (or links to existing)
   - Creates the `coach_clients` relationship
   - Marks the invite as accepted
   - All in a single transaction
5. Rate-limit invite creation: Max 100 invites per hour per coach. This prevents abuse if the coach account is compromised.
6. The invite landing page should handle all error states gracefully:
   - Expired: "This invite has expired. Please ask your coach to send a new one."
   - Already used: "This invite has already been accepted."
   - Invalid: "This invite link is invalid."
   - Already a client: "You are already connected to this coach. Open the app."

**Phase relevance:** Security design happens during the invite feature planning phase. The Edge Function that handles invite acceptance is the critical security boundary.

---

### 7. coach_client_summary View N+1 Query Explosion

**What goes wrong:** The existing `coach_client_summary` view in `schema.sql` contains two correlated subqueries:

```sql
(SELECT weight FROM weight_logs wl WHERE wl.user_id = p.id ORDER BY date DESC LIMIT 1) as latest_weight,
(SELECT date FROM weight_logs wl WHERE wl.user_id = p.id ORDER BY date DESC LIMIT 1) as latest_weight_date,
(SELECT COUNT(*) FROM workout_logs wl WHERE wl.user_id = p.id AND wl.completed = true
  AND wl.date >= CURRENT_DATE - INTERVAL '7 days') as workouts_last_7_days
```

For 90K clients, this executes 270K subqueries (3 per client). Even with indexes, this view will be extremely slow. The view also joins `profiles`, `user_xp`, and `coach_clients` -- at 90K rows, the join itself is expensive.

Additionally, this view has `GRANT SELECT ON coach_client_summary TO authenticated` -- meaning ANY authenticated user can query it, not just coaches. A regular client could query `SELECT * FROM coach_client_summary` and potentially see other clients' data (depending on whether the view's security context respects RLS on underlying tables).

**Warning signs:**
- Coach dashboard client list takes 30+ seconds to load
- Supabase connection pool exhausted when coach opens dashboard
- Database CPU pegged at 100% during dashboard load
- Regular clients can see the coach_client_summary view data

**Prevention:**
1. Replace the view with a security definer function that:
   - Verifies the caller is a coach (`SELECT role FROM profiles WHERE id = auth.uid()`)
   - Accepts pagination parameters (`page_size`, `page_offset`)
   - Uses a single efficient query with `LATERAL` joins instead of correlated subqueries
   - Returns only the columns needed for the current UI view
2. For "latest weight" and "workouts last 7 days", consider materialized views or caching:
   - A `client_activity_cache` table updated by triggers on `weight_logs` and `workout_logs`
   - Or compute these on the client side after loading basic client data
3. Drop the `GRANT SELECT ON coach_client_summary TO authenticated` and replace with RPC function access only.
4. Add pagination WITHIN the function (see Pitfall #14).

**Phase relevance:** The view must be rewritten or replaced when building the client roster feature. Do not build UI on top of this view as-is.

---

### 8. Role Escalation via Client-Side Role Check

**What goes wrong:** The `profiles` table has a `role` column (`user_role` enum: 'client', 'coach', 'admin'). If the coach dashboard route (`/coach`) only checks this role on the CLIENT side (e.g., `if (profile.role !== 'coach') redirect('/')`) without server-side enforcement, a malicious user can:
1. Modify localStorage to set `role: 'coach'`
2. Navigate to `/coach`
3. See the coach dashboard UI
4. Make API calls that succeed because RLS only checks the `coach_clients` relationship, not the `role` column

The existing RLS policies check `coach_clients.coach_id = auth.uid()` but do NOT verify that the user actually has `role = 'coach'` in the profiles table. If someone creates a row in `coach_clients` where they are the `coach_id` (which the "Coaches can manage their client relationships" policy allows for ANY authenticated user where `coach_id = auth.uid()`), they become a coach.

**The critical RLS policy flaw:**
```sql
CREATE POLICY "Coaches can manage their client relationships"
  ON coach_clients FOR ALL
  USING (coach_id = auth.uid());
```
This policy says "any authenticated user can insert/update/delete rows in coach_clients where coach_id equals their own user ID." This means ANY user can create a coach-client relationship where they are the coach. There is no check that the user has `role = 'coach'`.

**Warning signs:**
- A regular client can access `/coach` by modifying localStorage
- Users can create coach_clients rows making themselves a coach of other users
- No server-side enforcement of the coach role

**Prevention:**
1. Fix the RLS policy on `coach_clients` to require `role = 'coach'`:
   ```sql
   CREATE POLICY "Coaches can manage their client relationships"
     ON coach_clients FOR ALL
     USING (
       coach_id = auth.uid()
       AND EXISTS (
         SELECT 1 FROM profiles
         WHERE profiles.id = auth.uid()
         AND profiles.role = 'coach'
       )
     );
   ```
   Or better, use a security definer function to avoid the EXISTS subquery per-row.
2. The `role` column in `profiles` must NOT be updatable by the user themselves. Add a policy:
   ```sql
   CREATE POLICY "Users cannot change their own role"
     ON profiles FOR UPDATE
     USING (auth.uid() = id)
     WITH CHECK (
       role = (SELECT role FROM profiles WHERE id = auth.uid())
     );
   ```
   Or simply exclude `role` from the columns the user can update (use column-level permissions or a trigger that prevents role changes).
3. Client-side role check is for UX only (don't show the coach button to non-coaches). Server-side RLS is the actual security boundary. NEVER trust client-side role checks for authorization.
4. Set the coach role via a migration or admin action, NEVER via the client app.

**Phase relevance:** RLS policy fixes must happen IMMEDIATELY when the coach schema is deployed. This is a security vulnerability in the existing schema that should be fixed before any coach features go live.

---

## Moderate Pitfalls

Mistakes that cause poor UX, increased support burden, or significant rework.

---

### 9. Coach Route Leaking Into Client Navigation

**What goes wrong:** The existing app has a bottom tab navigation with 5 tabs (Home, Workouts, Macros, Avatar, Settings). Adding a `/coach` route raises navigation questions:
- Does the coach see the same bottom nav as clients?
- Does the coach see a "Coach" tab in addition to their client tabs?
- When a coach views a client's detail page, can they use the bottom nav to go back?
- What happens when a coach accidentally navigates to a client route while on the coach dashboard?

The most common mistake: adding coach routes as peers of client routes, so the router treats `/coach/clients/123` and `/workouts` as siblings. The coach clicks the browser back button from a client detail page and lands on their own workout screen instead of the coach dashboard.

**Warning signs:**
- Coach clicks back button and ends up on their own workout log
- Client sees a "Coach" button/tab in their nav (even if it errors when clicked)
- Deep linking to `/coach/clients/123` works for non-coach users (shows error or blank page)
- Coach navigation breadcrumbs break when mixed with client navigation

**Prevention:**
1. Treat `/coach/*` as a completely separate navigation context. The coach dashboard has its OWN layout, its OWN nav (sidebar or top nav, NOT the client bottom tab bar), and its OWN route hierarchy.
2. Use React Router's layout routes to isolate coach and client layouts:
   ```
   / -> ClientLayout (bottom tab nav)
     /home
     /workouts
     /macros
     /settings
   /coach -> CoachLayout (different nav, e.g., sidebar)
     /coach/clients
     /coach/clients/:id
     /coach/clients/:id/program
     /coach/clients/:id/macros
     /coach/clients/:id/checkins
   ```
3. The coach user has a toggle or link to switch between "Coach view" and "My training" (their own client experience). This is a context switch, not a tab within the same nav.
4. Add a route guard on `/coach/*` that redirects non-coach users to `/` immediately, before any coach components mount.
5. For the "coach viewing a client" screen, provide explicit "Back to roster" navigation, not browser back button dependency.

**Phase relevance:** Route structure must be decided in the first coach UI phase. Changing route hierarchy after building screens is a painful refactor.

---

### 10. Check-In Form Schema Rigidity

**What goes wrong:** The coach wants clients to fill out a weekly check-in. The naive implementation hardcodes form fields:

```typescript
interface CheckIn {
  weight: number
  sleepHours: number
  energyLevel: 1 | 2 | 3 | 4 | 5
  stressLevel: 1 | 2 | 3 | 4 | 5
  notes: string
}
```

Then the coach asks: "Can I add a question about soreness?" No. "Can I remove the stress question?" No. "Can I ask different questions for clients on a cut vs. a bulk?" No. The form is frozen at build time.

Even if you make the form "dynamic" by storing questions in a database, the data structure matters enormously:
- If answers are stored as named columns (`weight`, `sleep_hours`, etc.), adding a question requires a migration
- If answers are stored as JSONB, you gain flexibility but lose queryability ("show me all clients whose sleep dropped below 6 hours")
- If questions change week-to-week, historical comparisons break ("this week's question 3 is different from last week's question 3")

**Warning signs:**
- Coach requests a form change, developer says "that requires a code deployment"
- Coach cannot compare check-in responses across weeks because questions changed
- Data analysis requires parsing JSONB, not simple SQL queries
- Different clients answer different sets of questions with no structure

**Prevention:**
1. Use a hybrid schema:
   ```sql
   -- Template: defines what questions are asked
   CREATE TABLE checkin_templates (
     id UUID PRIMARY KEY,
     coach_id UUID REFERENCES profiles(id),
     name TEXT,
     questions JSONB NOT NULL,
     -- questions: [{ id: "q1", type: "number", label: "Weight (lbs)", required: true }, ...]
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Response: what the client answered
   CREATE TABLE checkin_responses (
     id UUID PRIMARY KEY,
     template_id UUID REFERENCES checkin_templates(id),
     client_id UUID REFERENCES profiles(id),
     week_of DATE NOT NULL,
     answers JSONB NOT NULL,
     -- answers: { "q1": 185, "q2": 7, "q3": "Feeling good" }
     submitted_at TIMESTAMPTZ,
     reviewed_at TIMESTAMPTZ,
     coach_notes TEXT
   );
   ```
2. Use stable question IDs (`q1`, `q2`) that persist across template versions. When the coach adds a question, it gets a new ID. When they remove one, the old ID just stops appearing in new templates but historical answers remain queryable.
3. For the MVP, start with a DEFAULT template that has the most common questions (weight, sleep, energy, stress, notes). Let the coach customize later. Do not over-engineer the template builder in v1.
4. Store answers as JSONB but with a defined question schema (type, label, options for selects). This gives flexibility without losing structure.
5. Version templates: when the coach modifies a template, create a new version. Link responses to specific template versions so historical context is preserved.

**Phase relevance:** Schema design for check-ins happens during the check-in feature phase. Getting the template+response pattern right prevents a rewrite when the coach inevitably asks for customization.

---

### 11. Assigned Workout vs. Logged Workout Data Model Confusion

**What goes wrong:** The existing `workout_logs` table records what the client ACTUALLY DID (exercises, sets, reps, weights, completion status). The coach needs to assign what the client SHOULD DO (exercises, target sets, target reps, date). These are fundamentally different data types that look superficially similar.

The trap: storing assigned workouts in the same `workout_logs` table with a `status = 'assigned'` flag. This creates confusion:
- The existing `getWorkoutHistory()` function returns `workoutLogs.filter(log => log.completed)`. Does it now need to filter out assigned-but-not-started workouts?
- The XP system awards XP for completed workouts. Does an assigned workout that is completed count? What if the client did a different workout than assigned?
- The `isWorkoutCompletedToday()` check would need to consider whether a coach-assigned workout exists AND whether the client did it.
- The Zustand `workoutStore` persist would try to sync assigned workouts to localStorage, bloating local storage with potentially hundreds of future assigned workouts.

**Warning signs:**
- Client's workout history shows "assigned" workouts they never did
- XP is awarded incorrectly for assigned vs. completed workouts
- `workoutStore` localStorage grows unboundedly with assigned workouts
- Queries for "what did the client do" return what the coach assigned, not what was logged

**Prevention:**
1. Create a SEPARATE `assigned_workouts` table:
   ```sql
   CREATE TABLE assigned_workouts (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     coach_id UUID NOT NULL REFERENCES profiles(id),
     client_id UUID NOT NULL REFERENCES profiles(id),
     assigned_date DATE NOT NULL,
     title TEXT,
     exercises JSONB NOT NULL,
     notes TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     UNIQUE(client_id, assigned_date) -- one assignment per client per day
   );
   ```
2. Keep `workout_logs` exclusively for LOGGED (completed) workouts. No changes to the existing table.
3. The client flow becomes:
   - App loads -> check `assigned_workouts` for today -> if exists, show "Coach's workout for today" with the assigned exercises pre-loaded
   - Client starts the assigned workout -> creates a new `workout_logs` entry with a reference to the assigned workout: `assigned_workout_id UUID REFERENCES assigned_workouts(id)`
   - Client can modify exercises (add, skip, change weight) during the actual workout
   - On completion, `workout_logs` records what they ACTUALLY did, `assigned_workout_id` links back to what they were SUPPOSED to do
4. The coach dashboard can then compare: assigned vs. actual (did the client follow the program?).
5. The existing `workoutStore` continues to manage `workout_logs` as before. A NEW `assignedWorkoutStore` (or server-fetched data, NOT persisted to localStorage) handles assigned workouts.

**Phase relevance:** The assigned workout data model must be designed when building the workout programming feature. It should be a separate table from day one.

---

### 12. Existing Sync System Writing Coach Data Back Incorrectly

**What goes wrong:** The existing `syncAllToCloud()` function calls these in sequence:
```typescript
syncProfileToCloud()
syncWeightLogsToCloud()
syncMacroTargetsToCloud()   // DANGER: will overwrite coach-set macros
syncSavedMealsToCloud()
syncXPToCloud()
syncDailyMacroLogToCloud()
// Plus recent workout logs
```

Every single one of these does an unconditional `upsert` based on what is in localStorage. None of them check whether the server has newer data, and none of them skip coach-owned rows. This means:

- If the coach sets a client's macro targets in Supabase, the next `scheduleSync()` from the client overwrites them (see Pitfall #4)
- If a new `assigned_workouts` table is added, but the sync function does not know about it, assigned workouts never reach the client's UI (because they are not in localStorage and `loadAllFromCloud()` does not fetch them)
- `syncProfileToCloud()` uses `upsert` on `profiles`. If the coach updates a client's profile notes or any other coach-managed field on the profiles table, the client's sync overwrites it

**Warning signs:**
- Any coach-written data disappears within minutes of the client opening the app
- Coach sees their changes briefly, then they revert
- Debugging reveals that `syncAllToCloud()` is the culprit, running on a 2-second debounce after any client action

**Prevention:**
1. Refactor `syncAllToCloud()` into two functions:
   - `pushClientOwnedData()`: Syncs workout logs, meal logs, weight logs, XP, client-calculated macro targets (ONLY if `set_by = 'self'`), streaks
   - `pullCoachOwnedData()`: Fetches assigned workouts, coach-set macro targets, check-in templates, and any coach-managed profile fields
2. `scheduleSync()` calls `pushClientOwnedData()` only. `pullCoachOwnedData()` is called on app init AND via Supabase Realtime subscription.
3. For each table, define ownership clearly in code:
   ```typescript
   const SYNC_OWNERSHIP = {
     macro_targets: 'conditional', // 'self' -> push, 'coach' -> pull only
     workout_logs: 'client',       // always push
     assigned_workouts: 'coach',   // always pull, never push
     checkin_responses: 'client',  // client fills in, push up
     checkin_templates: 'coach',   // coach creates, pull down
   }
   ```
4. Add a `loadAllFromCloud()` expansion that includes coach data tables in the pull. Currently it only loads profile and weight logs.

**Phase relevance:** Sync refactoring must happen alongside or immediately after the data ownership model (Pitfall #1). It is tightly coupled with every coach feature.

---

### 13. Single Coach Account as a Single Point of Failure

**What goes wrong:** The constraint says "single coach account" -- only one person will be the coach. This creates operational risks:

- If the coach's password is compromised, the attacker has access to ALL client data
- If the coach loses access to their email, password reset is impossible
- If the coach's Supabase session expires during a bulk operation (editing 50 client programs), work is lost
- There is no audit trail of coach actions (who changed this client's macros? Only one person could have, but when?)
- If the coach's device is lost/stolen, there is no way to revoke their session remotely without Supabase admin access

**Warning signs:**
- Coach locked out of their account with no recovery path
- Coach makes a mistake (wrong macros for wrong client) with no way to see what changed
- No way to temporarily delegate coach access (e.g., during vacation)

**Prevention:**
1. Enable MFA for the coach account. Supabase supports TOTP-based MFA. This is non-negotiable for an account that manages 90K users' data.
2. Store a recovery mechanism (backup email, recovery codes) outside the app.
3. Add an `audit_log` table:
   ```sql
   CREATE TABLE audit_log (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     actor_id UUID REFERENCES profiles(id),
     action TEXT NOT NULL, -- 'set_macros', 'assign_workout', 'invite_client', etc.
     target_client_id UUID REFERENCES profiles(id),
     details JSONB,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```
   This provides accountability and lets the coach review their own actions ("What did I set for client X last week?").
4. Build autosave for coach dashboard forms. If the session expires mid-edit, the coach should not lose work. Use localStorage for draft state on the coach side, syncing to Supabase only on explicit save.
5. Consider session management: the coach might use the dashboard on their phone AND laptop simultaneously. Supabase handles concurrent sessions, but UI should handle this gracefully (no data corruption from two tabs editing the same client).

**Phase relevance:** MFA and audit logging should be implemented in the first coach infrastructure phase, before the coach starts managing real client data.

---

### 14. Pagination Absence on 90K Client Roster

**What goes wrong:** Querying `SELECT * FROM coach_client_summary WHERE coach_id = ?` with 90K clients returns 90K rows. Even if each row is small (500 bytes), that is 45MB of data transferred over the network. The browser will struggle to render 90K rows. The Supabase PostgREST default limit is 1000 rows, so without explicit pagination, the coach sees only the first 1000 clients and thinks they are missing clients.

**Compounding issues:**
- Supabase's JS client does not paginate by default. `supabase.from('table').select('*')` returns up to 1000 rows silently.
- If you add `.range(0, 9999)` to get more, you hit PostgREST memory limits.
- Client-side search (filtering 90K rows in the browser) is impossible -- must be server-side.
- Sorting by "last workout" or "streak" requires the correlated subqueries from the view, which are already slow (Pitfall #7).

**Warning signs:**
- Coach sees exactly 1000 clients (PostgREST default limit) and thinks clients are missing
- Searching for a client name loads all 90K rows then filters in JS
- Scrolling the client list crashes the browser tab
- Coach tries to load "all clients" and the request times out

**Prevention:**
1. Implement server-side pagination from day one:
   ```typescript
   const PAGE_SIZE = 25
   const { data } = await supabase
     .rpc('get_coach_clients', {
       p_page: currentPage,
       p_page_size: PAGE_SIZE,
       p_search: searchQuery,
       p_sort_by: sortColumn,
       p_sort_dir: sortDirection
     })
   ```
2. Build the RPC function to handle search, sort, and pagination in PostgreSQL:
   ```sql
   CREATE FUNCTION get_coach_clients(
     p_page INT DEFAULT 1,
     p_page_size INT DEFAULT 25,
     p_search TEXT DEFAULT NULL,
     p_sort_by TEXT DEFAULT 'username',
     p_sort_dir TEXT DEFAULT 'asc'
   ) RETURNS TABLE (...) AS $$
   BEGIN
     -- Verify caller is coach
     -- Query with LIMIT/OFFSET (or better, keyset pagination)
     -- Return total_count alongside results for pagination UI
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```
3. Use keyset pagination (cursor-based) instead of OFFSET for large datasets. OFFSET becomes slower as page number increases.
4. Add a client search input that queries the server, not filters client-side. Use `ILIKE` or full-text search on username/email.
5. Show a total client count in the UI so the coach knows how many clients they have.
6. Use virtual scrolling (e.g., `@tanstack/react-virtual`) if displaying more than 50 rows at once.
7. Consider an "active clients" filter that defaults to showing only clients with recent activity (workout in last 30 days), reducing the default result set.

**Phase relevance:** Pagination must be implemented in the FIRST client roster UI. Building without it and adding later requires rewriting the entire list component and its data fetching.

---

### 15. Check-In Response Rate Collapse

**What goes wrong:** The coach adds a weekly check-in form. Week 1, 80% of clients fill it out. Week 4, 30%. Week 8, 10%. This is a well-documented pattern in coaching apps: check-in compliance drops rapidly unless actively managed. The technical pitfall is building the check-in system without the mechanisms to prevent this collapse.

**Common failure modes:**
- No reminder/notification when check-in is due (the app has no push notification infrastructure)
- Check-in form is too long (clients get form fatigue)
- No consequence or feedback loop for missed check-ins (coach does not review them, so clients stop filling them out)
- Check-in is buried 3 taps deep in the app (Home -> Settings -> Check-in)
- Coach cannot see at a glance which clients have NOT submitted their check-in

**Warning signs:**
- Check-in submission rate drops below 50% within a month
- Coach spends more time chasing check-ins than reviewing them
- Clients report not knowing a check-in was due
- Coach dashboard has no "pending check-ins" view

**Prevention:**
1. Surface the check-in prominently on the client's home screen when it is due. Not buried in a menu. A persistent card: "Weekly check-in due by Sunday" with a single tap to open the form.
2. Keep the default check-in SHORT: 3-5 questions maximum. Weight, sleep quality (1-5 scale), energy (1-5 scale), one free-text note. The coach can customize later, but the default should take under 60 seconds.
3. Build a "pending check-ins" view on the coach dashboard that shows which clients have NOT submitted their check-in this week. Sort by "days overdue."
4. Track check-in completion as an existing gamification hook: award XP for submitting weekly check-ins. This leverages the app's existing gamification system (XP, streaks, badges).
5. If push notifications are out of scope, use the check-in status in the home screen UI: show a badge/indicator that draws the client's attention.
6. Coach review flow: when the coach reviews a check-in, the client should see that it was reviewed (e.g., "Coach reviewed your check-in" in the app). This creates a feedback loop.

**Phase relevance:** Check-in UX decisions (placement, length, gamification integration) must be part of the check-in feature design phase. The technical implementation is straightforward; the UX design determines adoption.

---

### 16. Coach Dashboard Bundle Bloating Client App

**What goes wrong:** The coach dashboard needs components that regular clients never use: data tables, bulk actions, client detail views, workout builders, date pickers for scheduling, rich text editors for coach notes. If these components are imported directly in the main bundle, every client downloads coach code they will never use. Given that only ONE user (the coach) uses these features but 90K users download the app, this is a terrible efficiency tradeoff.

**Specific concerns:**
- Data table component (e.g., `@tanstack/react-table`) can add 15-30KB gzipped
- Date picker for workout scheduling adds another 10-20KB
- Coach-specific form components and validation
- Any charting library for client progress views
- The coach layout with sidebar navigation

**Warning signs:**
- Bundle size increases significantly after adding coach features
- Lighthouse performance score drops for clients
- Time to Interactive increases because coach code is being parsed

**Prevention:**
1. Use React lazy loading for ALL coach routes:
   ```typescript
   const CoachLayout = lazy(() => import('./layouts/CoachLayout'))
   const CoachDashboard = lazy(() => import('./pages/coach/Dashboard'))
   const ClientDetail = lazy(() => import('./pages/coach/ClientDetail'))
   ```
   This ensures coach code is in a separate chunk that is ONLY downloaded when navigating to `/coach/*`.
2. Verify chunk splitting with the build output:
   ```bash
   npm run build
   # Check that coach chunks are separate from main chunks
   ```
3. Do not import coach-specific libraries at the top level. If `@tanstack/react-table` is used only in coach views, it should be in the lazy-loaded coach chunk.
4. The coach layout, coach stores (if any), and coach API functions should all be co-located under `src/pages/coach/` or `src/features/coach/` so the code-split boundary is clean.
5. Set a bundle size budget: client main chunk should not increase by more than 5KB after adding coach features (the only addition should be the lazy import wrapper and route definition).

**Phase relevance:** Code splitting must be configured when creating the first coach route. Adding lazy loading after building multiple coach components requires refactoring all imports.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation | Severity |
|---|---|---|---|
| Schema/data model | Offline-first vs. server-authoritative collision (#1) | Define data ownership model before building features | Critical |
| Schema/data model | Coach-assigned vs. client-owned ambiguity (#3) | Add `set_by` columns, separate assigned_workouts table | Critical |
| Schema/data model | Assigned vs. logged workout confusion (#11) | Separate tables for assignments and logs | Critical |
| RLS/security | RLS performance at 90K scale (#2) | Security definer functions, initPlan caching | Critical |
| RLS/security | Role escalation via coach_clients RLS flaw (#8) | Fix policy to require role = 'coach' | Critical |
| Email/invite infrastructure | Rate limits blocking bulk invites (#5) | Custom SMTP + Edge Function + Resend API | Critical |
| Email/invite infrastructure | Invite link security (#6) | Cryptographic tokens, single-use, expiry | Moderate |
| Sync system | Existing sync overwriting coach data (#12) | Directional sync: push client data, pull coach data | Critical |
| Sync system | Macro target overwrite race (#4) | Ownership-aware sync, conditional upsert | Critical |
| Coach roster UI | N+1 query in summary view (#7) | Replace view with RPC function, LATERAL joins | Moderate |
| Coach roster UI | Pagination absence (#14) | Server-side pagination from day one | Critical |
| Coach UI/navigation | Coach route leaking into client nav (#9) | Separate layouts, route hierarchy isolation | Moderate |
| Check-in feature | Form schema rigidity (#10) | Template + response pattern with JSONB answers | Moderate |
| Check-in feature | Response rate collapse (#15) | Home screen placement, short form, XP incentive | Moderate |
| Build/performance | Coach bundle bloating client app (#16) | React lazy loading for all coach routes | Moderate |
| Operations | Single coach SPOF (#13) | MFA, audit log, autosave | Moderate |

---

## Recommended Phase Order Based on Pitfalls

The pitfall analysis reveals a clear dependency chain:

1. **Data Ownership Model + Schema** (Pitfalls #1, #3, #11) -- Define which data is client-owned vs. coach-owned. Create `assigned_workouts` table, add `set_by` to `macro_targets`. Fix the `coach_clients` RLS policy (#8). This is the foundation everything else builds on.

2. **Sync System Refactor** (Pitfalls #4, #12) -- Split `syncAllToCloud()` into directional flows. Add `pullCoachDataFromCloud()`. Guard upserts against overwriting coach data. Must happen before any coach write operations exist.

3. **Email Infrastructure + Invite System** (Pitfalls #5, #6) -- Set up custom SMTP, Edge Function for invite handling, `coach_invites` table. Cannot invite clients without this.

4. **Client Roster with Pagination** (Pitfalls #2, #7, #14) -- Replace `coach_client_summary` view with paginated RPC function. Build list UI with server-side search/sort. Use lazy-loaded coach routes (#16).

5. **Workout Programming** (Pitfall #11 implementation) -- Build assigned workout CRUD for coach. Build client-side assigned workout display. Link to existing workout logging.

6. **Macro Management** (Pitfalls #3, #4 implementation) -- Build coach macro setting UI. Ensure client UI shows "Set by coach" when applicable. Test the overwrite prevention end-to-end.

7. **Check-In System** (Pitfalls #10, #15) -- Build template + response schema. Build client check-in form (home screen placement). Build coach review UI.

**The critical insight:** Pitfalls #1, #3, #4, #8, and #12 form an interconnected cluster around data ownership and sync direction. These MUST be solved together in the first phase. Building any coach write feature without solving them first guarantees data corruption.

---

## Sources

### Supabase RLS and Performance
- [Supabase RLS Performance and Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) -- EXISTS subquery performance, security definer functions, initPlan caching (HIGH confidence)
- [Supabase Performance and Security Advisors](https://supabase.com/docs/guides/database/database-advisors?lint=0003_auth_rls_initplan) -- auth.uid() initPlan pattern (HIGH confidence)
- [Supabase RLS Discussion #14576](https://github.com/orgs/supabase/discussions/14576) -- Community performance patterns (MEDIUM confidence)
- [Optimizing RLS Performance with Supabase](https://www.antstack.com/blog/optimizing-rls-performance-with-supabase/) -- Security definer function examples (MEDIUM confidence)

### Supabase Email and Invites
- [Supabase Auth Rate Limits](https://supabase.com/docs/guides/auth/rate-limits) -- Default 2-3/hour, custom SMTP 30/hour configurable (HIGH confidence)
- [Supabase Custom SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp) -- DKIM/DMARC/SPF setup (HIGH confidence)
- [Supabase Sending Emails with Edge Functions](https://supabase.com/docs/guides/functions/examples/send-emails) -- Resend API integration (HIGH confidence)
- [Supabase Email Rate Limit Discussion #16209](https://github.com/orgs/supabase/discussions/16209) -- Custom SMTP rate limit is 30/hour initially (MEDIUM confidence)
- [Supabase inviteUserByEmail API Reference](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail) -- Requires service role key (HIGH confidence)

### Offline-First Architecture
- [Offline-First Frontend Apps 2025](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/) -- Conflict resolution strategies (MEDIUM confidence)
- [Data Synchronization in PWAs](https://gtcsys.com/comprehensive-faqs-guide-data-synchronization-in-pwas-offline-first-strategies-and-conflict-resolution/) -- Last-write-wins vs. custom merge (MEDIUM confidence)
- [Federated State: Zustand + TanStack Query](https://dev.to/martinrojas/federated-state-done-right-zustand-tanstack-query-and-the-patterns-that-actually-work-27c0) -- Client vs. server state separation (MEDIUM confidence)

### Fitness Coaching Platform Patterns
- [Online Coaching Platform Development](https://themindstudios.com/blog/online-coaching-platform-development/) -- Feature requirements, common patterns (MEDIUM confidence)
- [TrueCoach Dashboard Features](https://truecoach.co/features/dashboard/) -- Reference for coach dashboard UX (LOW confidence, competitor observation)
- [Personal Training Trends 2026](https://blog.everfit.io/personal-training-trend) -- Data-driven coaching, automation trends (LOW confidence)

### Codebase Analysis (HIGH confidence)
- Direct analysis of: `supabase/schema.sql` (existing RLS policies, coach_client_summary view, data model), `src/lib/sync.ts` (sync direction, upsert patterns, 2s debounce), `src/stores/macroStore.ts` (local macro calculation, no server pull), `src/stores/workoutStore.ts` (template-based workout generation, no concept of assignments), `src/stores/authStore.ts` (login-triggered sync), `src/stores/syncStore.ts` (non-persisted sync status)

---

*Research compiled: 2026-02-07*
