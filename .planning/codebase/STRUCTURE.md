# Codebase Structure

**Analysis Date:** 2026-02-04

## Directory Layout

```
trained-app/
├── src/                          # Application source code
│   ├── main.tsx                  # React app entry point (initializes Sentry, mounts app)
│   ├── App.tsx                   # Root component (routing, theme provider, auth checks)
│   ├── index.css                 # Global styles, CSS variable defaults, Tailwind directives
│   ├── vite-env.d.ts             # Vite type definitions
│   │
│   ├── screens/                  # Full-page components (routable)
│   │   ├── Home.tsx              # Dashboard (XP, workouts, macros, reminders, streak)
│   │   ├── Workouts.tsx          # Workout logging and history
│   │   ├── Macros.tsx            # Nutrition tracking and meal logging
│   │   ├── AvatarScreen.tsx       # Avatar customization and evolution viewer
│   │   ├── Achievements.tsx       # Badge/achievement showcase
│   │   ├── Settings.tsx           # User preferences (theme, units, theme toggle)
│   │   ├── Coach.tsx             # Coach-only view (client activity, macros, workouts)
│   │   ├── Onboarding.tsx         # Initial setup flow (profile, fitness level, avatar)
│   │   ├── Auth.tsx              # Login/signup screens
│   │   ├── AccessGate.tsx        # Pre-auth invite code verification
│   │   ├── CheckInModal.tsx       # Daily check-in modal
│   │   ├── XPClaimModal.tsx       # Weekly XP claiming with avatar reaction
│   │   └── index.ts              # Barrel export for all screens
│   │
│   ├── components/               # Reusable UI components
│   │   ├── Button.tsx            # Primary button (theme-aware variants)
│   │   ├── Card.tsx              # Container (default/elevated/subtle variants)
│   │   ├── ProgressBar.tsx        # XP progress visualization
│   │   ├── Avatar.tsx            # Renders user avatar with evolution stage
│   │   ├── XPDisplay.tsx          # Shows current level and XP bar
│   │   ├── Navigation.tsx         # Bottom tab navigation
│   │   ├── Toast.tsx             # Toast notification container
│   │   ├── WeightChart.tsx        # Weight trend visualization
│   │   ├── ReminderCard.tsx       # Reminder display component
│   │   ├── StreakDisplay.tsx      # Streak counter and badge
│   │   ├── BadgeUnlockModal.tsx   # Achievement unlock animation/modal
│   │   ├── Badges.tsx            # Badge sections (recent, nearest to unlock)
│   │   ├── WeeklySummary.tsx      # Week overview component
│   │   ├── MealBuilder.tsx        # Meal composition form
│   │   ├── FoodSearch.tsx         # Food database search UI
│   │   ├── ClientActivityFeed.tsx # Coach view activity log
│   │   ├── ClientMacroAdherence.tsx # Coach view nutrition stats
│   │   ├── Button.test.tsx        # Component tests
│   │   ├── Card.test.tsx
│   │   ├── ProgressBar.test.tsx
│   │   └── index.ts              # Barrel export for all components
│   │
│   ├── stores/                   # Zustand state management
│   │   ├── userStore.ts          # User profile, weight tracking, streak management
│   │   ├── authStore.ts          # Authentication state, login/logout, sync coordination
│   │   ├── workoutStore.ts       # Workout plans, exercise logging, workout history
│   │   ├── xpStore.ts            # XP calculation, levels, weekly history, claiming
│   │   ├── macroStore.ts          # Macro targets, daily logs, saved meals, meal planning
│   │   ├── avatarStore.ts         # Avatar state, evolution stages, mood triggers
│   │   ├── achievementsStore.ts   # Badges, unlock conditions, earned badges
│   │   ├── remindersStore.ts      # Reminder preferences, active reminders
│   │   ├── toastStore.ts          # Toast notifications (published via toast() helper)
│   │   ├── accessStore.ts         # Access code verification state
│   │   ├── index.ts              # Barrel export + type re-exports for all stores
│   │   ├── workoutStore.test.ts  # Store tests
│   │   ├── xpStore.test.ts
│   │   ├── macroStore.test.ts
│   │   └── [other].test.ts
│   │
│   ├── lib/                      # Utilities and services
│   │   ├── supabase.ts           # Supabase client initialization, auth helpers
│   │   ├── database.types.ts     # Auto-generated types from Supabase schema
│   │   ├── sync.ts               # Cloud sync functions (load/save profile, workouts, XP, etc.)
│   │   ├── sentry.ts             # Error tracking initialization and helpers
│   │   ├── analytics.ts          # Event tracking (if configured)
│   │   ├── foodApi.ts            # External food database API integration
│   │   ├── units.ts              # Unit conversion utilities (lbs/kg, cm/inches)
│   │   └── index.ts              # Barrel export for lib modules
│   │
│   ├── themes/                   # Design system and theme management
│   │   ├── index.ts              # Theme provider, context, useTheme hook, theme registry
│   │   ├── types.ts              # Theme type definitions (AppTheme, ThemeId, DesignTokens)
│   │   ├── trained.ts            # "Trained" theme (red/dark)
│   │   └── gyg.ts                # "GYG" theme (cyan/glassmorphism)
│   │
│   ├── hooks/                    # Custom React hooks
│   │   └── useClientDetails.ts   # Coach-only: fetch and format client data
│   │
│   ├── test/                     # Test utilities and setup
│   │   ├── setup.ts              # Vitest configuration, DOM setup
│   │   └── utils.tsx             # Test helpers (render with theme, store mocks)
│   │
│   ├── assets/                   # Static assets (images, icons, etc.)
│   │   └── [various assets]
│   │
│   └── data/                     # Static data files
│       └── [data files if any]
│
├── public/                       # Static files (favicon, PWA icons, manifest)
│   ├── index.html                # HTML entry point
│   ├── favicon.svg
│   ├── pwa-192x192.png
│   └── pwa-512x512.png
│
├── supabase/                     # Supabase project files
│   ├── migrations/               # SQL migrations for database schema
│   └── config.toml               # Supabase CLI configuration
│
├── vite.config.ts                # Vite build configuration + Vitest + PWA setup
├── tsconfig.json                 # TypeScript compiler options (strict mode, path aliases)
├── tailwind.config.js            # Tailwind CSS configuration
├── postcss.config.js             # PostCSS configuration for Tailwind
├── .env.example                  # Environment variables template
├── .env                          # Local environment variables (git-ignored)
├── package.json                  # Dependencies and scripts
├── package-lock.json             # Dependency lock file
└── README.md                     # Project documentation
```

## Directory Purposes

**src/screens/:**
- Purpose: Full-page route components that users navigate to
- Contains: Screen components, modals, routing logic within screens
- Key files: `Home.tsx` (main dashboard), `Auth.tsx`, `Onboarding.tsx`, `Workouts.tsx`

**src/components/:**
- Purpose: Reusable UI building blocks used across multiple screens
- Contains: Buttons, cards, charts, dialogs, form inputs
- Key files: `Button.tsx`, `Card.tsx`, `Avatar.tsx`, `Navigation.tsx`

**src/stores/:**
- Purpose: Zustand state management for all application domains
- Contains: Store definitions with actions, types, persistence setup
- Key files: `userStore.ts` (profile), `workoutStore.ts` (training), `xpStore.ts` (progression)

**src/lib/:**
- Purpose: Utility functions and service integrations
- Contains: API clients, sync logic, error tracking, external integrations
- Key files: `supabase.ts` (backend), `sync.ts` (persistence), `sentry.ts` (error tracking)

**src/themes/:**
- Purpose: Multi-theme design system with CSS variable injection
- Contains: Theme definitions, design tokens, provider component
- Key files: `index.ts` (provider + context), `trained.ts`, `gyg.ts` (theme implementations)

**src/test/:**
- Purpose: Testing infrastructure and helpers
- Contains: Vitest setup, DOM utilities, mock factories
- Key files: `setup.ts` (test config), `utils.tsx` (test render helpers)

**supabase/:**
- Purpose: Backend database schema and migrations
- Contains: SQL migrations, RLS policies, table definitions
- Managed via Supabase CLI

## Key File Locations

**Entry Points:**
- `src/main.tsx`: Browser entry point — initializes Sentry, mounts React app
- `src/App.tsx`: Root component — routing, theme provider, auth flow control
- `index.html`: HTML document loaded by browser

**Configuration:**
- `vite.config.ts`: Build and dev server setup, Vitest config, PWA plugin
- `tsconfig.json`: TypeScript compiler options, path aliases (`@/*` → `src/*`)
- `tailwind.config.js`: Tailwind CSS theme configuration
- `.env`: Environment variables (not committed)

**Core Logic:**
- `src/stores/`: All application state and mutations
- `src/lib/sync.ts`: Data synchronization to/from Supabase
- `src/lib/supabase.ts`: Supabase client and auth helpers

**Testing:**
- `src/**/*.test.tsx`: Component and store tests
- `src/test/setup.ts`: Vitest configuration
- `src/test/utils.tsx`: Test utility functions

## Naming Conventions

**Files:**
- Components: PascalCase with .tsx extension (e.g., `Button.tsx`, `Home.tsx`)
- Stores: camelCase with "Store" suffix and .ts extension (e.g., `userStore.ts`)
- Utilities: camelCase with .ts extension (e.g., `sync.ts`, `units.ts`)
- Tests: Original filename + `.test.tsx` or `.test.ts` (e.g., `Button.test.tsx`)
- Indexes: `index.ts` or `index.tsx` for barrel exports

**Directories:**
- Screen containers: `src/screens/` (kebab-case or PascalCase matching component)
- Component groups: `src/components/`
- Stores: `src/stores/`
- Utilities: `src/lib/`
- Design system: `src/themes/`

**Functions:**
- Hook: `use` prefix (e.g., `useTheme()`, `useUserStore()`)
- Store selectors: Direct property access via hooks (e.g., `useUserStore((state) => state.profile)`)
- Actions: Verb/action names (e.g., `updateStreak()`, `completeWorkout()`)
- Utilities: Descriptive verb/noun (e.g., `calculateLevel()`, `syncProfileToCloud()`)

**Variables:**
- State: PascalCase or camelCase based on context (e.g., `profile`, `currentLevel`)
- Constants: UPPERCASE with underscores (e.g., `MAX_LEVEL`, `XP_VALUES`)
- Types/Interfaces: PascalCase (e.g., `UserProfile`, `WorkoutLog`)

## Where to Add New Code

**New Feature (e.g., new tab on home):**
1. Create screen component in `src/screens/FeatureScreen.tsx`
2. Create or extend store in `src/stores/featureStore.ts` for state
3. Create reusable components in `src/components/` if needed
4. Add route in `src/App.tsx`
5. Add navigation button in `src/components/Navigation.tsx`
6. Add sync logic in `src/lib/sync.ts` if data needs cloud persistence

**New Component/UI Element:**
1. If reusable across multiple screens: create in `src/components/ComponentName.tsx`
2. If specific to one screen: create in screen file or in screen subfolder
3. Implement theme-aware styling using `useTheme()` and CSS variables
4. Add TypeScript interface for props
5. Add tests in `src/components/ComponentName.test.tsx`

**New Store:**
1. Create in `src/stores/domainStore.ts` (e.g., `nutritionStore.ts`)
2. Define types and interfaces at top
3. Create store with `create()` and wrap with `persist()` middleware
4. Export store and types from `src/stores/index.ts`
5. Test in `src/stores/domainStore.test.ts`

**Utilities and Helpers:**
1. Shared helpers (used by multiple stores/screens): `src/lib/helpers.ts`
2. Service integrations: `src/lib/serviceName.ts` (e.g., `foodApi.ts`)
3. Custom hooks (reusable React logic): `src/hooks/useHookName.ts`
4. Format/conversion functions: `src/lib/units.ts`, `src/lib/format.ts` (if needed)

**Cloud Sync:**
1. Add sync function in `src/lib/sync.ts` (export from here)
2. Call sync function in store action (after successful local update)
3. Export from `src/lib/index.ts`
4. Call from screen on user action or from `authStore.syncData()` on login

**Tests:**
1. Co-locate with source: `src/components/Button.test.tsx` next to `Button.tsx`
2. Run via `npm test` (watch mode) or `npm test:run` (single run)
3. Coverage via `npm test:coverage`

## Special Directories

**supabase/:**
- Purpose: Backend configuration and schema versioning
- Generated: Yes (migrations auto-generated by CLI)
- Committed: Yes (migrations tracked in git)
- Access: Via Supabase CLI or web dashboard

**dist/:**
- Purpose: Production build output
- Generated: Yes (output of `npm run build`)
- Committed: No (in .gitignore)

**node_modules/:**
- Purpose: Installed dependencies
- Generated: Yes (via `npm install`)
- Committed: No (in .gitignore)

**public/:**
- Purpose: Static files served directly by web server
- Generated: No (manually created)
- Committed: Yes (except PWA icons which can be auto-generated)
- Contents: favicon, PWA manifest, app icons

**.env files:**
- `.env.example`: Template showing required variables
- `.env`: Local development overrides (git-ignored)
- `.env.production.local`: Production secrets (git-ignored)
- Committed: `.env.example` only
