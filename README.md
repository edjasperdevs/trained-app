# TRAINED

A fitness PWA that gamifies your training with XP, leveling, streaks, avatar evolution, and achievements. Built for discipline-focused athletes who want accountability and progress tracking in a premium mobile experience.

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **UI Components:** shadcn/ui (Radix primitives + CVA)
- **State Management:** Zustand (persisted to localStorage)
- **Backend:** Supabase (auth, cloud sync, profiles)
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **PWA:** vite-plugin-pwa (prompt-based updates, offline support)
- **Error Monitoring:** Sentry
- **Analytics:** Plausible (privacy-friendly, 22 custom events)
- **Testing:** Vitest

## Features

### Gamification
- **XP & Leveling** — Earn Discipline Points from workouts, macros, check-ins. Weekly claim ritual on Sundays. Rank 1-99 progression.
- **Streaks** — Daily check-in streaks with flame icon, 7-day calendar, and safe word recovery (2-day grace period).
- **Avatar Evolution** — 13 stages across 3 character classes (Warrior, Mage, Rogue). Mood system with animations.
- **Achievements** — 20+ badges across 5 categories with rarity levels (Common, Rare, Epic, Legendary).

### Training
- **Workout Logging** — Standard tracking (exercises, sets, reps, weights) or Quick Compliance mode. Workout history and PR tracking.
- **Macro Tracking** — Daily calorie and protein targets with food search (USDA + Open Food Facts fallback). Meal builder and adherence visualization.
- **Daily Assignments** — Three daily tasks (Workout, Protein, Calories) plus check-in bonus and perfect day multiplier.

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
- **Coach Dashboard** — Client list, progress tracking, weight charts, macro adherence, activity feed
- **Data Export/Import** — Full profile backup and restore
- **Access Code Gating** — Required at app entry
- **Dual-Theme System** — TRAINED (dark, discipline) and GYG (RPG-gamified) themes

## Project Structure

```
src/
├── components/ui/       # shadcn/ui primitives (Button, Card, Dialog, Input, Tabs, Badge...)
├── components/          # Domain components (Avatar, EmptyState, SyncStatusIndicator...)
├── screens/             # Route components (Home, Workouts, Macros, Achievements, Settings...)
├── stores/              # Zustand stores (user, xp, workout, macro, avatar, achievements, sync...)
├── lib/                 # Utilities (sync, sentry, analytics, haptics, errors, foodApi, dateUtils...)
├── themes/              # Theme system (trained.ts, gyg.ts, ThemeProvider)
├── App.tsx              # Router with per-route Suspense boundaries
└── main.tsx             # Entry point with Sentry ErrorBoundary
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

# Run tests
npm run test:run
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `VITE_SENTRY_DSN` | Production | Sentry DSN for error monitoring |
| `VITE_USDA_API_KEY` | Recommended | USDA FoodData Central API key |
| `VITE_ACCESS_CODES` | Yes | Comma-separated access codes |
| `VITE_DEV_BYPASS` | No | Set to `true` to skip auth/access gates for UI testing |

## License

Private - All rights reserved
