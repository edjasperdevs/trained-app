# WellTrained

A fitness PWA that gamifies your training with XP, leveling, streaks, avatar evolution, and achievements. Built for discipline-focused athletes who want accountability and progress tracking in a premium mobile experience. Includes a full coaching platform for client management, workout programming, and macro oversight.

**Domain:** app.welltrained.fitness

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **UI Components:** shadcn/ui (Radix primitives + CVA)
- **State Management:** Zustand (persisted to localStorage)
- **Backend:** Supabase (auth, cloud sync, profiles, coaching)
- **Animations:** tw-animate-css
- **Icons:** Lucide React
- **PWA:** vite-plugin-pwa (prompt-based updates, offline support)
- **Error Monitoring:** Sentry
- **Analytics:** Plausible (privacy-friendly, 22 custom events)
- **Testing:** Vitest (unit) + Playwright (E2E)

## Features

### Gamification
- **XP & Leveling** — Earn Discipline Points from workouts, macros, check-ins. Weekly claim ritual on Sundays. Rank 1-99 progression.
- **Streaks** — Daily check-in streaks with flame icon, 7-day calendar, and safe word recovery (2-day grace period).
- **Avatar Evolution** — 13 stages across 3 character classes (Warrior, Mage, Rogue). Mood system with animations.
- **Achievements** — 20+ badges across 5 categories with rarity levels (Common, Rare, Epic, Legendary).

### Training
- **Workout Logging** — Standard tracking (exercises, sets, reps, weights) or Quick Compliance mode. Workout history and PR tracking. Labeled weight/reps inputs, auto warmup sets (50% weight placeholder), placeholder carry-forward between sets, and mid-workout exercise reordering.
- **Macro Tracking** — Daily calorie and protein targets with food search (USDA + Open Food Facts fallback). Meal builder and adherence visualization.
- **Daily Assignments** — Three daily tasks (Workout, Protein, Calories) plus check-in bonus and perfect day multiplier.
- **Weekly Check-ins** — 16-field structured form with auto-populated data (weight, macros, workouts, cardio, steps). Coach review and response.

### Coaching Platform
- **Client Management** — Invite clients via email, roster with status indicators (active, needs attention, falling off, pending).
- **Workout Programming** — Create workout templates and assign them to clients. Clients see assigned workouts each session.
- **Macro Management** — Set client macro targets with "Set by Coach" indicator. Data ownership via `set_by` column.
- **Check-in Review** — Review client weekly check-ins and send responses. Activity feed per client.
- **Intake Pipeline** — New client intake submissions with badge count on Intake tab. Automatic email notification to coach via Resend when an intake is completed.
- **Client Detail Modal** — 5 tabs: overview, weight chart, macro adherence, workout history, activity feed.

### Infrastructure
- **Offline-First** — All data persisted to localStorage via Zustand. Full functionality without network.
- **Cloud Sync** — Incremental sync to Supabase after workouts and meals. Auto-retry with exponential backoff. Visual sync status indicator.
- **Resilience** — Online/offline detection, visibility-change sync, USDA 429 rate limit cooldown with Open Food Facts fallback.
- **PWA** — Installable on mobile, prompt-based service worker updates, runtime caching (NetworkFirst for API, CacheFirst for fonts).
- **Accessibility** — WCAG AA color contrast (4.5:1+), skeleton loading states, haptic feedback on key actions.
- **Error Monitoring** — Sentry capturing errors across sync, auth, and API paths with user context.
- **Analytics** — Plausible tracking onboarding, workouts, meals, gamification, and engagement events.

### Additional
- **Onboarding** — 10-step wizard with progress indicator ("Step X of Y")
- **Data Export/Import** — Full profile backup and restore
- **Access Code Gating** — Required at app entry

## Project Structure

```
src/
├── components/ui/       # shadcn/ui primitives (Button, Card, Dialog, Input, Tabs, Badge...)
├── components/          # Domain components (Avatar, EmptyState, IntakeView, SyncStatusIndicator...)
├── screens/             # Route components (Home, Workouts, Macros, Coach, WeeklyCheckIn, Settings...)
├── stores/              # Zustand stores (user, xp, workout, macro, avatar, achievements, sync...)
├── lib/                 # Utilities (sync, sentry, analytics, haptics, errors, foodApi, intakeApi...)
├── themes/              # Theme tokens (trained.ts — synced with :root CSS vars)
├── App.tsx              # Router with per-route Suspense boundaries
└── main.tsx             # Entry point with Sentry ErrorBoundary
e2e/
├── tests/               # Playwright E2E specs (smoke, auth-onboarding, core-journeys, workout-features)
├── fixtures/            # Test fixtures
└── helpers/             # Storage and Supabase mock helpers
```

## Getting Started

```bash
# Install dependencies
npm install

# Copy env template and fill in values
cp .env.example .env.local

# Start development server
npm run dev

# Build for production
npm run build

# Run unit tests
npm run test:run

# Run E2E tests
npm run test:e2e
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `VITE_SENTRY_DSN` | Production | Sentry DSN for error monitoring |
| `VITE_USDA_API_KEY` | Recommended | USDA FoodData Central API key |
| `VITE_MASTER_ACCESS_CODE` | No | Universal bypass access code |
| `VITE_LEMONSQUEEZY_API_URL` | No | LemonSqueezy license validation URL |
| `SENTRY_AUTH_TOKEN` | Build | Sentry auth token for source map upload |
| `SENTRY_ORG` | Build | Sentry organization slug |
| `SENTRY_PROJECT` | Build | Sentry project slug |
| `RESEND_API_KEY` | Edge Functions | Resend API key for transactional emails |
| `EMAIL_FROM` | Edge Functions | Sender address (default: `noreply@contact.welltrained.fitness`) |

## Dev Testing

### Quick Start

Set `VITE_DEV_BYPASS=true` in `.env.local` to bypass auth, access code, and onboarding gates. Then seed test data from the browser console:

```js
seedTestData()   // Populate all stores with realistic data, then reload
clearTestData()  // Wipe all localStorage stores, then reload
```

### Seeded Test Data (localStorage)

The seed utility (`src/lib/devSeed.ts`) populates the following via `window.seedTestData()`:

| Store | Data |
|-------|------|
| **User Profile** | "TestUser", male, 28yo, 185lbs, intermediate, 4-day split, 7-day streak, goal weight 180 |
| **Weight History** | 30 days of entries trending from ~188 to ~185 lbs |
| **Workouts** | ~14 completed workout logs (push/pull/legs/upper), one minimal compliance day |
| **Macros** | 15 days of macro logs with 4 meals/day, 2 saved meals (Post-Workout Shake, Chicken Rice Bowl) |
| **XP** | 30 days of XP logs, level ~8-10, pending claim on current day |
| **Avatar** | Dominant base, evolution stage matched to level, happy mood |
| **Achievements** | 6 earned badges (first-rep, day-one, iron-will, warming-up, well-fueled, rising) |
| **Reminders** | All reminder types enabled, none dismissed |
| **Access** | Pre-granted with test license key |

### Coach Dashboard Mock Data

When `VITE_DEV_BYPASS=true`, the Coach page (`/coach`) uses mock data instead of Supabase:

| Client | Email | Status | Notes |
|--------|-------|--------|-------|
| **SarahLifts** | sarah@example.com | Active (green) | 15-day streak, level 12, checked in today, 30 days weight data |
| **MikeG** | mike@example.com | Needs attention (yellow) | 3-day streak, level 7, last check-in 2 days ago |
| **JakeR** | jake@example.com | Falling off (red) | 0 streak, level 4, last check-in 5 days ago |
| **FreshStart** | newbie@example.com | Pending (gray) | Hasn't completed onboarding |

**Add Client flow:** Enter `alex@example.com` to test adding a new client (AlexK). Any other email returns "User not found."

Each mock client has weight trends, macro adherence data, and activity feeds viewable in the detail modal tabs.

### Routes

All routes are available in dev bypass mode:

| Route | Screen |
|-------|--------|
| `/` | Home (dashboard, quests, streaks) |
| `/workouts` | Workout logging and history |
| `/macros` | Macro tracking and meal builder |
| `/avatar` | Avatar evolution and stats |
| `/achievements` | Badge collection |
| `/settings` | Profile, data export/import |
| `/coach` | Coach dashboard (mock data in dev bypass) |
| `/checkin` | Weekly check-in form |
| `/auth` | Auth screen (accessible directly in dev bypass) |
| `/access` | Access gate screen (accessible directly in dev bypass) |
| `/onboarding` | Onboarding wizard (accessible directly in dev bypass) |

## License

Private - All rights reserved
