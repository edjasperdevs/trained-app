# Trained

A fitness coaching PWA that combines gamified client tracking (XP, leveling, streaks, avatar evolution) with a full coaching platform for macro management, workout programming, and weekly check-ins.

**Live App:** https://app.welltrained.fitness

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS v4 + shadcn/ui + CVA variants (dark theme)
- **State:** Zustand with localStorage persistence
- **Animations:** Framer Motion (critically damped springs)
- **Backend:** Supabase (PostgreSQL + Auth + Edge Functions + RLS)
- **Email:** Resend (transactional invite emails via Edge Function)
- **Analytics:** Plausible (privacy-friendly, 22 custom events)
- **Monitoring:** Sentry (error tracking, session replay, Core Web Vitals)
- **Testing:** Vitest (139 unit tests) + Playwright (10 E2E tests)
- **Hosting:** Vercel
- **PWA:** vite-plugin-pwa (offline support, installable)

---

## Features

### Client App

#### Workout Logging
- 3/4/5-day training splits (Push/Pull/Legs, Upper/Lower variations)
- Customizable workout days
- Exercise templates with target sets/reps
- Full workout logging with weight/reps per set
- Editable and skippable sets
- Quick workout mode for time-constrained sessions
- Coach-assigned workouts with "Assigned by Coach" indicator

#### Macro Tracking
- TDEE calculator (Mifflin-St Jeor, gender-specific)
- Goal-based calorie adjustments (cut/recomp/maintain/bulk)
- Daily progress rings for protein and calories
- Meal logging with food search (USDA + Open Food Facts fallback)
- Saved meals for quick-add
- Coach-set macro targets with "Set by Coach" badge and locked calculator

#### Gamification
- XP from workouts (+100), protein targets (+50), calorie targets (+50), check-ins (+25)
- 1000 XP per level, max level 99
- Weekly XP claim ritual on Sundays with celebration animation
- "Never Miss Twice" streak system with grace period
- 3 avatar characters (Warrior, Mage, Rogue) with 13 evolution stages
- 20+ achievement badges with unlock animations

#### Weekly Check-ins
- Structured 16-field form across 5 sections (Nutrition, Training, Lifestyle, Health, Feedback)
- Auto-computed data snapshot (weight trend, macro hit rate, workout count)
- Home screen "Weekly Check-in Due" banner
- Coach response viewing with modal overlay

#### Weight Tracking
- Daily weight logging
- 30-day trend chart
- 7-day rolling average comparison

### Coach Dashboard (`/coach`)

#### Client Management
- Invite clients by email (branded signup invite via Resend)
- Auto-link on signup (database trigger creates coach-client relationship)
- Paginated client roster with server-side search
- Client detail modal with 5 tabs: Overview, Progress, Activity, Programs, Check-ins

#### Macro Management
- Set calories, protein, carbs, fat targets for any client
- Revert to client self-calculated targets
- Changes sync to client on next app open via `pullCoachData`

#### Workout Programming
- Build workouts with exercises, sets, reps, weight targets
- Save as reusable templates
- Assign templates to clients on specific dates
- Conflict detection for existing assignments
- Prescribed vs actual comparison (completed/skipped/added exercises, adherence %)

#### Weekly Check-in Review
- Pending check-ins list sorted by submission date
- Full review view with auto-populated data summary
- Coach response textarea
- Client check-in history per client

---

## Architecture

### Data Ownership Model

The app uses directional sync to prevent data collisions:

- **Client-owned** (offline-first, push to Supabase): workouts, meals, weight, XP
- **Coach-owned** (server-authoritative, pull from Supabase): macro targets, assigned workouts, check-in responses

`pushClientData()` respects `set_by` ownership — never overwrites coach-set data.
`pullCoachData()` fetches macros, workouts, and check-in responses on app open.

### Data Storage

#### Local Storage (Zustand)

| Store | Key | Contents |
|-------|-----|----------|
| User | `trained-user` | Profile, weight history |
| XP | `trained-xp` | XP totals, level, daily logs, claim history |
| Macros | `trained-macros` | Targets, meal plan, daily logs, saved meals, setBy ownership |
| Workouts | `trained-workouts` | Current plan, workout logs, assigned workout (non-persisted) |
| Avatar | `trained-avatar` | Character, evolution stage, mood |
| Sync | (non-persisted) | Sync status, online state, pending changes |

#### Supabase Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles with role (client/coach) |
| `coach_clients` | Coach-client relationships |
| `invites` | Email invitations with status lifecycle |
| `weight_logs` | Daily weight entries |
| `macro_targets` | Macro targets with `set_by` ownership |
| `daily_macro_logs` | Daily macro totals |
| `logged_meals` | Individual meal logs |
| `saved_meals` | User's saved meal templates |
| `workout_logs` | Completed workout records with `assignment_id` FK |
| `workout_templates` | Reusable coach workout templates |
| `assigned_workouts` | Coach-assigned workouts per client per date |
| `weekly_checkins` | Structured weekly check-ins with coach response |
| `user_xp` | XP totals and level |
| `xp_logs` | Individual XP transactions |

RLS policies enforce:
- Users can only access their own data
- Coaches can read/write their clients' coaching data
- `set_by` ownership prevents sync collisions

---

## Screens

| Screen | Path | Description |
|--------|------|-------------|
| Auth | `/auth` | Sign up / Sign in |
| Onboarding | `/onboarding` | New user setup flow |
| Home | `/` | Dashboard with avatar, XP, quests, streak, check-in banners |
| Macros | `/macros` | Daily tracking, meal logging, calculator |
| Workouts | `/workouts` | Workout plan, coach assignments, logging |
| Avatar | `/avatar` | Full avatar view, evolution timeline |
| Settings | `/settings` | Profile, weight tracking, data management |
| Weekly Check-in | `/checkin` | Structured 16-field check-in form |
| Coach | `/coach` | Coach dashboard (protected, lazy-loaded) |

---

## Development

### Prerequisites
- Node.js 20+
- npm

### Setup
```bash
npm install
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` and add your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Dev Bypass Mode

The app includes a dev bypass mode that provides mock data without requiring a Supabase connection. When `VITE_SUPABASE_URL` is not set, the app runs with seeded mock data for all features including coach dashboard.

### Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Apply migrations 002-007 in order from `supabase/migrations/`
4. Deploy the Edge Function: `supabase functions deploy send-invite`
5. Set secrets: `supabase secrets set RESEND_API_KEY=re_xxxxx`

### Build
```bash
npm run build
```

### Test
```bash
npm run test        # Unit tests (Vitest)
npm run test:e2e    # E2E tests (Playwright)
```

### Project Structure
```
src/
├── components/     # Reusable UI components (WorkoutBuilder, PrescribedVsActual, etc.)
├── screens/        # Page components (Home, Macros, Workouts, Coach, WeeklyCheckIn)
├── stores/         # Zustand state stores (user, xp, macros, workouts, avatar, sync)
├── hooks/          # Custom hooks (useClientRoster, useCoachTemplates, useWeeklyCheckins)
├── lib/            # Utilities (sync, supabase, errors, haptics, analytics, devSeed)
├── themes/         # Theme tokens
└── main.tsx        # App entry point

supabase/
├── schema.sql      # Full database schema
├── migrations/     # Incremental migrations (002-007)
└── functions/      # Edge Functions (send-invite)
```
