# Technology Stack: Coach Dashboard Features

**Project:** Trained -- Coach Dashboard Milestone
**Researched:** 2026-02-07
**Mode:** Ecosystem (Stack dimension)
**Overall confidence:** HIGH

---

## Executive Summary

The existing Trained stack is well-positioned for coach dashboard features. The Supabase schema already includes `user_role` enum (`client`/`coach`/`admin`), a `coach_clients` junction table with status tracking, comprehensive RLS policies granting coaches read access to client data, and a `coach_client_summary` materialized view. A Coach screen (`/coach`) with client roster, detail views, weight charts, macro adherence, and activity feed already exists. The `useClientDetails` hook with 5-minute caching is already built.

What is MISSING and needs to be added:

1. **Supabase Edge Functions** -- For sending invite emails (requires server-side execution with `service_role` key). No Edge Functions directory or configuration exists in the project yet.
2. **Resend** -- Email delivery service, called from Edge Functions. Free tier: 3,000 emails/month (sufficient for a single coach inviting clients).
3. **New database tables** -- `check_ins`, `workout_programs`, and `invites` tables with corresponding RLS policies.
4. **Supabase Realtime** -- For live-updating the coach dashboard when clients submit check-ins. Already bundled in `@supabase/supabase-js` v2.93.3 (installed). Zero new client-side dependencies.
5. **shadcn/ui Calendar component** -- For the workout programming date picker. Already compatible with the existing shadcn setup. Uses `react-day-picker` v9.x.

The critical finding: **only ONE new npm dependency is needed** (`resend` in the Edge Functions runtime, which is Deno-based and separate from the client bundle). Zero new client-side production dependencies. Everything else uses existing packages or Supabase built-in features.

---

## Existing Infrastructure (Already Built)

Before listing additions, here is what already exists and should NOT be rebuilt:

| Component | Location | Status |
|-----------|----------|--------|
| `user_role` enum (client/coach/admin) | `supabase/schema.sql` | Deployed |
| `coach_clients` table with status | `supabase/schema.sql` | Deployed |
| `coach_client_status` enum (pending/active/inactive) | `supabase/schema.sql` | Deployed |
| RLS: Coach reads client profiles, weights, macros, workouts, XP | `supabase/schema.sql` | Deployed |
| `coach_client_summary` view | `supabase/schema.sql` | Deployed |
| `isCoach()` helper | `src/lib/supabase.ts` | Implemented |
| Coach screen with client roster | `src/screens/Coach.tsx` | Implemented |
| `useClientDetails` hook (weight, macros, activity) | `src/hooks/useClientDetails.ts` | Implemented |
| WeightChart, ClientMacroAdherence, ClientActivityFeed | `src/components/` | Implemented |
| Mock coach data for dev bypass | `src/lib/devSeed.ts` | Implemented |
| `/coach` route (lazy loaded) | `src/App.tsx` | Implemented |
| shadcn/ui components: Button, Card, Input, Label, Textarea, Select, Tabs, Dialog, Sheet, Switch, Badge, Alert | `src/components/ui/` | Installed |

---

## New Stack Additions

### 1. Supabase Edge Functions (Email Sending + Invite Flow)

| Detail | Value |
|--------|-------|
| **Technology** | Supabase Edge Functions (Deno runtime) |
| **Type** | Server-side only (runs on Supabase infrastructure) |
| **Why** | Sending invite emails requires the `service_role` key which must NEVER be exposed client-side. Edge Functions run server-side with access to secrets. Also needed for `auth.admin.inviteUserByEmail()`. |
| **Cost** | Free tier: 500,000 invocations/month. Overage: $2/million. |
| **Confidence** | HIGH -- official Supabase documentation, official Resend integration example |

**What Edge Functions provide for this milestone:**

- **`send-invite` function**: Accepts coach_id + email, creates an invite record, sends email via Resend, optionally calls `supabase.auth.admin.inviteUserByEmail()` for new users
- **`process-invite` function** (optional): Webhook/callback when invited user signs up, auto-creates coach_client relationship
- Server-side secret management (RESEND_API_KEY, SUPABASE_SERVICE_ROLE_KEY)
- CORS handling for browser invocation via `@supabase/supabase-js` client

**Invocation from client:**

The existing `@supabase/supabase-js` v2.93.3 already supports `supabase.functions.invoke()`:

```typescript
const { data, error } = await supabase.functions.invoke('send-invite', {
  body: { email: 'client@example.com' }
})
```

**CORS handling:**

Starting with `@supabase/supabase-js` v2.95.0+, CORS headers can be imported from `@supabase/supabase-js/cors`. The project is on v2.93.3 which requires manual CORS headers in the Edge Function. Consider bumping to v2.95+ during implementation.

**Project structure for Edge Functions:**

```
supabase/
  functions/
    send-invite/
      index.ts        # Edge Function handler
    _shared/
      cors.ts         # Shared CORS headers
      supabase.ts     # Admin client factory
```

**Setup requirements:**

1. Install Supabase CLI: `npm install -D supabase` (or use `npx supabase`)
2. Initialize: `npx supabase init` (creates `supabase/config.toml`)
3. Create function: `npx supabase functions new send-invite`
4. Set secrets: `npx supabase secrets set RESEND_API_KEY=re_xxxxx`
5. Deploy: `npx supabase functions deploy send-invite`

**Sources:**
- [Supabase Edge Functions getting started](https://supabase.com/docs/guides/functions/quickstart)
- [Supabase send emails example](https://supabase.com/docs/guides/functions/examples/send-emails)
- [Supabase CORS for Edge Functions](https://supabase.com/docs/guides/functions/cors)
- [Supabase auth.admin.inviteUserByEmail](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail)
- [Supabase Edge Functions pricing](https://supabase.com/docs/guides/functions/pricing)

---

### 2. Resend (Email Delivery)

| Detail | Value |
|--------|-------|
| **Package** | `resend` (npm, used in Deno Edge Functions via `npm:resend`) |
| **Type** | Server-side only (called from Edge Functions, NOT from client) |
| **Why** | Supabase recommends Resend for transactional email. Official integration exists. Simple API, generous free tier, no complex SMTP config. |
| **Cost** | Free tier: 3,000 emails/month. Pro: $20/month for 50,000 emails. |
| **Bundle impact** | ZERO client-side impact. Resend runs only in Deno Edge Functions. |
| **Confidence** | HIGH -- official Supabase + Resend integration documentation |

**Why Resend over alternatives:**

| Provider | Why Not |
|----------|---------|
| **Resend** | RECOMMENDED. Official Supabase integration, simple API, free tier covers invite volume |
| SendGrid | More complex setup, requires SMTP or separate SDK, overkill for transactional-only |
| Mailgun | Similar complexity to SendGrid, no official Supabase integration |
| AWS SES | Requires AWS account, complex IAM setup, overkill |
| Supabase built-in auth emails | Only handles auth events (signup confirm, password reset), not custom invite emails with branded templates |
| Nodemailer/SMTP | Supabase Edge Functions are Deno-based, Nodemailer is Node.js. Incompatible. |

**Usage in Edge Function (Deno):**

```typescript
import { Resend } from "npm:resend"

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))

await resend.emails.send({
  from: "Trained <coach@yourdomain.com>",
  to: email,
  subject: "You've been invited to Trained",
  html: `<p>Your coach has invited you...</p>`
})
```

**Requirements:**
- Verified sending domain in Resend dashboard (DNS records)
- API key stored as Supabase Edge Function secret
- Custom HTML email template (simple, no React Email needed for MVP)

**Sources:**
- [Resend + Supabase Edge Functions](https://resend.com/docs/send-with-supabase-edge-functions)
- [Resend pricing](https://resend.com/pricing)
- [Resend Supabase integration page](https://resend.com/supabase)

---

### 3. Database Schema Additions (New Tables + RLS)

| Detail | Value |
|--------|-------|
| **Technology** | PostgreSQL via Supabase |
| **Type** | Database migration (SQL) |
| **Why** | Three new tables needed for invite tracking, check-in forms, and workout programming |
| **Confidence** | HIGH -- follows established schema patterns from existing tables |

**New tables needed:**

#### `invites` table

Tracks email invitations sent by the coach, with status for deduplication and audit trail.

```sql
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'expired');

CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status invite_status DEFAULT 'pending' NOT NULL,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days') NOT NULL,
  UNIQUE(coach_id, email)
);
```

#### `check_ins` table

Weekly structured check-in forms submitted by clients, reviewed by coach.

```sql
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_of DATE NOT NULL,  -- Monday of the check-in week

  -- Structured fields
  weight DECIMAL(5,1),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  adherence_rating INTEGER CHECK (adherence_rating BETWEEN 1 AND 5),
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 5),
  notes TEXT,
  wins TEXT,        -- What went well
  struggles TEXT,   -- What was hard

  -- Coach review
  coach_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),

  UNIQUE(client_id, week_of)
);
```

#### `workout_programs` table

Coach-assigned workouts for specific dates on client calendars.

```sql
CREATE TABLE workout_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  workout_type workout_type NOT NULL,  -- Reuse existing enum
  exercises JSONB DEFAULT '[]'::jsonb NOT NULL,  -- Same structure as workout_logs.exercises
  notes TEXT,
  UNIQUE(client_id, date)  -- One programmed workout per day
);
```

**RLS policies follow the existing pattern:** clients own their data, coaches access their clients' data via `coach_clients` junction check.

**Sources:**
- Pattern derived from existing `supabase/schema.sql` in the codebase

---

### 4. shadcn/ui Calendar Component (Date Selection for Programming)

| Detail | Value |
|--------|-------|
| **Package** | `react-day-picker` v9.x (installed automatically with shadcn calendar) |
| **Install** | `npx shadcn@latest add calendar` |
| **Type** | Client-side UI component |
| **Why** | Coach needs to select dates when assigning workouts to client calendars. shadcn Calendar integrates seamlessly with existing Tailwind v4 + shadcn component system. |
| **Bundle impact** | Minimal -- react-day-picker is ~12KB gzipped |
| **Confidence** | HIGH -- shadcn/ui official component, updated June 2025 to react-day-picker v9 |

**Why shadcn Calendar, not alternatives:**

| Option | Why Not |
|--------|---------|
| **shadcn Calendar** | RECOMMENDED. Already compatible with existing shadcn setup, Tailwind v4, radix-ui. Zero config. |
| react-big-calendar | Full-featured Google Calendar clone. Massive overkill for selecting workout dates. Has its own styling system that conflicts with Tailwind. |
| DayPilot | Commercial license for production. Overkill. |
| Syncfusion Scheduler | Commercial license. Enterprise-grade, not needed. |
| FullCalendar | Heavy (200KB+), brings its own CSS, complex API. Overkill for date selection. |
| Custom date grid | Unnecessary when shadcn Calendar exists and matches the design system. |

**Usage pattern for workout programming:**

The coach selects a date on the Calendar component, then assigns a workout type and exercises for that date. This is a date picker pattern, not a full calendar/scheduler pattern. The shadcn Calendar component (which wraps react-day-picker) is the right abstraction level.

For displaying a week-at-a-glance view of programmed workouts, build a simple custom 7-column grid using existing Tailwind utilities. A full calendar library is NOT needed for this.

**Sources:**
- [shadcn/ui Calendar](https://ui.shadcn.com/docs/components/radix/calendar)
- [shadcn Calendar June 2025 upgrade](https://ui.shadcn.com/docs/changelog/2025-06-calendar)
- [react-day-picker v9.13.1](https://www.npmjs.com/package/react-day-picker)

---

### 5. Supabase Realtime (Check-in Notifications)

| Detail | Value |
|--------|-------|
| **Package** | `@supabase/supabase-js` v2.93.3 (ALREADY INSTALLED) |
| **Type** | Uses existing client library, zero new dependencies |
| **Why** | When a client submits a check-in, the coach dashboard should update without manual refresh. Supabase Realtime's `postgres_changes` subscription is the simplest way. |
| **Cost** | Free tier: 200 concurrent connections, messages included. More than sufficient for single-coach use. |
| **Confidence** | HIGH -- built into installed supabase-js, official documentation |

**Decision: Realtime vs Polling**

For this project, the RIGHT answer is a **hybrid approach**:

| Scenario | Approach | Rationale |
|----------|----------|-----------|
| Coach viewing dashboard | **Polling on page load** | Coach loads /coach, fetches fresh client list. Simple, reliable. Already implemented. |
| Coach dashboard open, client submits check-in | **Supabase Realtime** | Subscribe to `check_ins` table INSERTs where `client_id` is in coach's client list. Avoids polling overhead, gives instant feedback. |
| Coach not on dashboard | **Nothing** | No wasted connections or polling. |

**Why not polling-only?** The coach may have the dashboard open while reviewing clients. A client submitting a check-in should surface immediately (badge count update, toast notification). Polling every 30 seconds would work but feels sluggish and wastes API calls.

**Why not Realtime-only?** Initial data load still needs a standard query. Realtime only notifies of changes -- it does not provide initial state.

**Implementation pattern:**

```typescript
// Subscribe when coach dashboard mounts
useEffect(() => {
  const channel = supabase
    .channel('coach-checkins')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'check_ins'
      },
      (payload) => {
        // Check if this client belongs to the coach
        // Update local state / show notification
      }
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [])
```

**Prerequisite:** Enable Realtime replication for the `check_ins` table in the Supabase dashboard (Database > Replication > toggle on `check_ins`).

**Sources:**
- [Supabase Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Supabase subscribe to channel](https://supabase.com/docs/reference/javascript/subscribe)
- [Supabase Realtime pricing](https://supabase.com/docs/guides/realtime/pricing)
- [Supabase Realtime limits](https://supabase.com/docs/guides/realtime/limits)

---

## Coach Authorization Strategy

**Decision: Profile role check, NOT custom claims**

| Approach | Verdict |
|----------|---------|
| **Profile `role` column check** | RECOMMENDED. Already implemented via `isCoach()` in `src/lib/supabase.ts`. Query `profiles.role = 'coach'` for auth guard. |
| Supabase custom claims (JWT) | Overkill for single-coach. Requires custom JWT hook, adds complexity. Would be right for multi-tenant SaaS. |
| Separate auth provider | Unnecessary. Supabase auth already handles this. |
| Hardcoded coach user ID | Fragile, not portable, bad practice. |

**How it works today:**

1. Coach logs in with same email/password auth as any user
2. `profiles.role` is set to `'coach'` in the database (manually or via admin)
3. `isCoach()` queries the profile to check role
4. `/coach` route renders Coach screen
5. RLS policies on all tables use `coach_clients` junction to gate data access

**What needs to change:**

- Add a client-side route guard that redirects non-coach users away from `/coach/*` routes
- Currently the `/coach` route renders for ALL authenticated users (no role check in `App.tsx`)
- Add `useCoachGuard()` hook that checks role and redirects if not coach
- Cache the role check in a Zustand store to avoid repeated profile queries

**RLS is the real security layer.** Even if a non-coach user navigates to `/coach`, the RLS policies will return empty data for all coach queries. The client-side guard is UX, not security.

---

## What NOT to Add (and Why)

### Do NOT add React Email for invite templates

React Email is a React-based email templating system. It is excellent for complex email templates with components but is overkill for a single invite email. Use a plain HTML string in the Edge Function. Add React Email later if email complexity grows.

### Do NOT add a form library (React Hook Form, Formik, etc.)

The check-in form has ~7 fields (weight, 4 rating sliders, 2 text areas). The existing shadcn components (Input, Textarea, Select, Label) with basic React state management handle this trivially. A form library adds dependency weight for zero benefit at this scale. Zustand state works fine for form management.

### Do NOT add TanStack Query (React Query)

The project uses direct Supabase client calls with custom hooks (`useClientDetails`). TanStack Query would provide caching, refetching, and optimistic updates -- but the existing 5-minute cache in `useClientDetails` already handles caching, and the data access patterns are simple enough that adding TanStack Query's complexity is not justified. If data fetching patterns grow more complex post-MVP, reconsider.

### Do NOT add Socket.IO or Pusher

Supabase Realtime provides WebSocket-based real-time subscriptions natively. Adding a separate real-time library duplicates functionality that is already bundled in the installed `@supabase/supabase-js`.

### Do NOT add a drag-and-drop library for workout programming

Workout programming is "pick a date, pick a workout type, assign exercises." This is a form, not a drag-and-drop interface. If drag-and-drop reordering of exercises within a workout is needed later, add `@dnd-kit` then -- but do not preemptively install it.

### Do NOT add Zustand persist for coach data

Coach data (client list, check-ins, programmed workouts) should NOT be cached in localStorage. It is multi-user data that can change at any time from either side (coach or client). Always fetch fresh from Supabase. The existing `useClientDetails` in-memory cache with 5-minute TTL is the right pattern.

### Do NOT add a notification service (OneSignal, Firebase Cloud Messaging)

Push notifications for "client submitted check-in" would be nice but are NOT in scope for this milestone. The Supabase Realtime subscription provides in-app notifications when the coach has the dashboard open. Push notifications are a separate feature with significant complexity (service worker registration, permission prompts, device token management).

### Do NOT add multi-tenant infrastructure

This is a single-coach app. Do NOT add organization tables, team management, role hierarchies, or tenant isolation patterns. The single `user_role` column + `coach_clients` junction table is the right abstraction for one coach managing clients.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Email sending | Resend via Edge Function | Supabase built-in auth emails | Built-in only handles auth events, not custom invite emails |
| Email sending | Resend via Edge Function | Direct SMTP from client | Exposes credentials, not possible from browser |
| Email delivery | Resend | SendGrid | More complex, no official Supabase integration, overkill |
| Server-side logic | Supabase Edge Functions | External API (Vercel, Cloudflare Workers) | Extra infrastructure. Edge Functions run on Supabase, co-located with DB. |
| Real-time updates | Supabase Realtime | Polling every 30s | Wasteful for long-lived dashboard sessions, sluggish UX |
| Real-time updates | Supabase Realtime | Server-Sent Events | Would require custom server, defeats Supabase-native architecture |
| Calendar UI | shadcn Calendar | react-big-calendar | Overkill, brings own styling, conflicts with Tailwind |
| Calendar UI | shadcn Calendar | FullCalendar | 200KB+, commercial for premium features, overkill |
| Date handling | Native Date API | date-fns / dayjs / luxon | Only need basic date formatting/comparison. Already using toISOString().split('T')[0] pattern throughout codebase. react-day-picker brings date-fns as peer dep if needed. |
| Form management | React useState + shadcn | React Hook Form | 7 fields. Form library overhead not justified. |
| Coach auth | Profile role column | Custom JWT claims | Single coach, not multi-tenant. Profile check is simpler. |
| Data fetching | Custom hooks + Supabase client | TanStack Query | Existing patterns work. Refactor later if needed. |
| Invite tracking | Database `invites` table | Stateless (just send email) | Need dedup, status tracking, expiry. Table is essential. |

---

## Installation Summary

### Client-side (zero new production dependencies)

```bash
# Add shadcn Calendar component (installs react-day-picker as dependency)
npx shadcn@latest add calendar

# Optional: bump supabase-js for CORS helper import
npm install @supabase/supabase-js@latest
```

### Server-side (Edge Functions setup)

```bash
# Install Supabase CLI as dev dependency
npm install -D supabase

# Initialize Supabase project (if config.toml doesn't exist)
npx supabase init

# Create the invite Edge Function
npx supabase functions new send-invite

# Set secrets (run once per environment)
npx supabase secrets set RESEND_API_KEY=re_xxxxx

# Deploy
npx supabase functions deploy send-invite
```

### Database migrations (run in Supabase SQL Editor)

- Add `invites` table + RLS
- Add `check_ins` table + RLS
- Add `workout_programs` table + RLS
- Enable Realtime replication for `check_ins` table

### No changes to existing production dependencies

All existing packages (`react`, `react-router-dom`, `zustand`, `@supabase/supabase-js`, `sonner`, `lucide-react`, `radix-ui`, `class-variance-authority`, `tailwind-merge`, `clsx`) remain unchanged.

---

## Integration Points with Existing Code

### 1. Coach Screen Expansion

The existing `src/screens/Coach.tsx` (708 lines) is a single file handling the entire coach dashboard. For the new features, it should be split into:

```
src/screens/coach/
  CoachDashboard.tsx       # Client roster (existing, extracted)
  ClientDetail.tsx          # Client detail modal (existing, extracted)
  InviteClient.tsx          # Email invite flow (NEW)
  CheckInReview.tsx         # Check-in review view (NEW)
  WorkoutProgramming.tsx    # Assign workouts to dates (NEW)
  MacroManagement.tsx       # Set client macro targets (NEW)
```

### 2. Client-Side Check-In Form

A new screen/component for the CLIENT side (not coach):

```
src/screens/CheckIn.tsx     # Weekly check-in form
src/stores/checkInStore.ts  # Local state for in-progress check-ins (NOT persisted)
```

### 3. New Supabase Types

Add to `src/lib/database.types.ts`:
- `invites` table types (Row, Insert, Update)
- `check_ins` table types
- `workout_programs` table types
- `invite_status` enum type

### 4. Sync Integration

Check-in submissions from clients should call `scheduleSync()` after submission (same pattern as workout/macro syncing). Coach-side data should NOT use `scheduleSync()` -- it reads from Supabase directly.

### 5. Route Changes

Add nested coach routes in `App.tsx`:

```
/coach                  # Dashboard (existing)
/coach/client/:id       # Client detail page
/coach/invite           # Invite flow
/checkin                # Client-side check-in form (new route for clients)
```

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Supabase Edge Functions setup | HIGH | Official docs, well-documented, official Resend example |
| Resend integration | HIGH | Official Supabase partnership, verified pricing |
| Resend free tier limits | HIGH | Verified: 3,000/month, sufficient for single coach |
| Edge Function CORS | MEDIUM | Known pain point per community discussions. `supabase-js` v2.93.3 may need manual CORS. Bump to v2.95+ recommended. |
| Supabase Realtime for check-ins | HIGH | Built into installed SDK, official documentation |
| Realtime free tier limits | MEDIUM | 200 concurrent connections verified. Message limits less clear but sufficient for single-coach with <100 active clients. |
| shadcn Calendar + react-day-picker | HIGH | Official shadcn component, upgraded June 2025, v9.13.1 current |
| Database schema additions | HIGH | Follow exact patterns from existing schema |
| Coach role auth (profile column) | HIGH | Already implemented in codebase (`isCoach()`) |
| No-new-client-dependencies strategy | HIGH | All capabilities achievable with existing + shadcn Calendar |

---

## Sources

### Verified (HIGH confidence)
- [Supabase Edge Functions docs](https://supabase.com/docs/guides/functions)
- [Supabase Edge Functions quickstart](https://supabase.com/docs/guides/functions/quickstart)
- [Supabase send emails example](https://supabase.com/docs/guides/functions/examples/send-emails)
- [Supabase Edge Functions CORS](https://supabase.com/docs/guides/functions/cors)
- [Supabase Edge Functions pricing](https://supabase.com/docs/guides/functions/pricing) -- 500K free invocations/month
- [Supabase auth.admin.inviteUserByEmail](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail)
- [Supabase Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Supabase Realtime pricing](https://supabase.com/docs/guides/realtime/pricing)
- [Supabase Realtime limits](https://supabase.com/docs/guides/realtime/limits) -- 200 concurrent connections free
- [Supabase RLS docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Resend + Supabase integration](https://resend.com/docs/send-with-supabase-edge-functions)
- [Resend pricing](https://resend.com/pricing) -- 3,000 emails/month free
- [Resend Supabase page](https://resend.com/supabase)
- [shadcn/ui Calendar component](https://ui.shadcn.com/docs/components/radix/calendar)
- [shadcn Calendar June 2025 update](https://ui.shadcn.com/docs/changelog/2025-06-calendar)
- [react-day-picker npm v9.13.1](https://www.npmjs.com/package/react-day-picker)

### Cross-referenced (MEDIUM confidence)
- [Supabase user invitations via Edge Functions (blog.mansueli.com)](https://blog.mansueli.com/allowing-users-to-invite-others-with-supabase-edge-functions)
- [RBAC Admin User Invitations (blog.hijabicoder.dev)](https://blog.hijabicoder.dev/create-and-invite-users-to-your-admin-app-using-supabase-edge-functions)
- [Supabase Realtime in React (codu.co)](https://www.codu.co/niall/real-time-table-changes-in-supabase-with-react-js-next-js-swmgqmq9)
- [Supabase custom claims RBAC](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac)

### Project-specific verification (HIGH confidence)
- `@supabase/supabase-js` v2.93.3 confirmed installed (node_modules check)
- `user_role` enum, `coach_clients` table, RLS policies confirmed in `supabase/schema.sql`
- `isCoach()`, `useClientDetails`, Coach screen confirmed in source code
- shadcn/ui setup confirmed (19 components in `src/components/ui/`)
- No existing Edge Functions directory (greenfield)
- No existing email infrastructure (greenfield)
