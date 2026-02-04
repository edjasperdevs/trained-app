# Architecture

**Analysis Date:** 2026-02-04

## Pattern Overview

**Overall:** Offline-first SPA with Zustand state management, React Router navigation, and PWA capabilities. Local storage serves as the source of truth with optional Supabase cloud sync.

**Key Characteristics:**
- Client-side state management via Zustand stores with localStorage persistence
- Decoupled screens/components from state through store hooks
- Theme-based design system with CSS variables injected at runtime
- Optional Supabase backend (app works offline without it)
- Gamification layer with XP, levels, streaks, achievements, and avatar evolution
- Vite-based build with TypeScript strict mode enabled

## Layers

**Presentation (UI):**
- Purpose: Render screens and interactive components to users
- Location: `src/screens/`, `src/components/`
- Contains: React components, screens, modals, UI primitives
- Depends on: Store hooks (zustand), themes, router
- Used by: App.tsx (entry point)

**State Management:**
- Purpose: Manage all application state (user profile, workouts, XP, macros, etc.)
- Location: `src/stores/`
- Contains: Zustand stores with persist middleware, type definitions
- Depends on: Supabase client, sync service
- Used by: All screens and components via hooks

**API & Data Sync:**
- Purpose: Handle data persistence and cloud synchronization
- Location: `src/lib/sync.ts`, `src/lib/supabase.ts`
- Contains: Sync functions, Supabase client initialization, auth helpers
- Depends on: Supabase SDK, store getters
- Used by: Auth store, screen components

**Utilities & Services:**
- Purpose: Support functions for common operations
- Location: `src/lib/`
- Contains: Analytics, error tracking (Sentry), food API integration, unit conversion
- Depends on: External SDKs (Sentry, analytics)
- Used by: Stores and components

**Theming:**
- Purpose: Provide multi-theme support with design tokens injected as CSS variables
- Location: `src/themes/`
- Contains: Theme definitions, context provider, hooks
- Depends on: React context
- Used by: All components via `useTheme()` hook

## Data Flow

**Authentication Flow:**

1. `App.tsx` calls `useAuthStore.initialize()` on mount
2. Auth store checks Supabase session, listens for auth state changes
3. If authenticated user exists:
   - Load profile from localStorage or Supabase (via `authStore.syncData()`)
   - Check if onboarding is complete
   - Render home or onboarding screens
4. If not authenticated: render Auth screen

**User Session:**
```
[App startup]
  ↓
[useAuthStore.initialize()]
  ↓
[Check Supabase session / Listen for changes]
  ↓
[If authenticated] → [Load profile from localStorage]
  ↓
[If onboarding complete] → [Render home + navigation]
```

**Workout Logging Flow:**

1. User navigates to `/workouts` screen
2. `useWorkoutStore.startWorkout()` creates a new workout log
3. User completes exercises, logs sets via `logSet()`
4. User calls `completeWorkout()` which:
   - Marks workout as complete
   - Triggers XP calculation via `useXPStore.logDailyXP()`
   - Syncs to cloud if authenticated (via `syncWorkoutLogToCloud()`)
5. User can claim XP via XPClaimModal

**State Synchronization:**

```
[Local Action] (e.g., logWeight)
  ↓
[Update store state + persist to localStorage]
  ↓
[If user authenticated] → [syncProfileToCloud() / syncWeightLogsToCloud()]
  ↓
[Success toast or error handling]
```

**State Management:**
- All state lives in Zustand stores with `persist` middleware
- localStorage is the single source of truth
- Cloud sync happens after mutations (not real-time, not required)
- No Redux/context for global state — each store is independent domain

## Key Abstractions

**Zustand Stores:**
- Purpose: Domain-specific state containers with actions
- Examples: `useUserStore`, `useWorkoutStore`, `useXPStore`, `useMacroStore`, `useAvatarStore`, `useAchievementsStore`
- Pattern: Create store with `create()`, add `persist()` middleware, export both store and types from `src/stores/index.ts`

**Theme System:**
- Purpose: Multi-theme support with design tokens as CSS variables
- Examples: `trained` theme (red/dark), `gyg` theme (cyan/glassmorphism)
- Pattern: Define theme object with tokens + standing orders, inject as CSS variables in `ThemeProvider`, consume via `useTheme()` hook in components

**Sync Service:**
- Purpose: Handle data persistence to Supabase
- Examples: `syncProfileToCloud()`, `syncWorkoutLogToCloud()`, `syncXPToCloud()`, `loadAllFromCloud()`
- Pattern: Async functions that read from store state, make Supabase requests, return error or null

**Component Patterns:**
- Purpose: Reusable UI primitives
- Examples: `Button`, `Card`, `ProgressBar`, `Avatar`
- Pattern: Theme-aware components using `useTheme()`, styled with Tailwind + CSS variables

## Entry Points

**App Component (`src/App.tsx`):**
- Location: `src/App.tsx`
- Triggers: Application startup via `src/main.tsx`
- Responsibilities:
  - Initialize auth store
  - Check for reset URL parameter
  - Render conditional screens based on auth state and onboarding
  - Provide theme context wrapper
  - Mount toast container and navigation

**Main Entry (`src/main.tsx`):**
- Location: `src/main.tsx`
- Triggers: Browser loads app (index.html)
- Responsibilities:
  - Initialize Sentry error tracking
  - Mount React app to DOM
  - Wrap with BrowserRouter for React Router

**Screens (Page Components):**
- Location: `src/screens/`
- Examples: `Home.tsx` (dashboard), `Workouts.tsx` (logging), `Macros.tsx` (nutrition)
- Triggers: React Router navigation
- Responsibilities: Fetch data from stores, render page layout, handle user interactions

## Error Handling

**Strategy:** Layered error handling with graceful degradation

**Patterns:**
- **Sentry Integration (`src/lib/sentry.ts`):** Optional error tracking in production. Captures errors, sessions, breadcrumbs. Disabled in dev mode. Redacts PII before sending.
- **Error Boundary (`src/lib/sentry.ts`):** React ErrorBoundary wrapper in main.tsx catches component render errors and shows fallback UI
- **Sync Errors:** Sync failures are logged to console and caught in try-catch blocks. Doesn't block user from continuing offline.
- **Toast Notifications (`src/stores/toastStore.ts`):** User-facing error messages via `toast.error()` for non-critical failures
- **Auth Errors:** Caught in auth store methods, returned as `{ error: string | null }` for screen handling

**Error Recovery:**
- Offline: App continues to work with local data, syncs when connection restored
- Auth failure: User is logged out, redirected to Auth screen
- Sync failure: Error logged, user notified, can retry manually or syncs on next interaction
- Component crash: Error boundary renders fallback UI with "Refresh App" button

## Cross-Cutting Concerns

**Logging:**
- Console logs in development (auth init, Sentry init, sync operations)
- Sentry session replays and breadcrumbs in production for error context
- No persistent application logs (can be added via backend)

**Validation:**
- Form validation happens in screen components before store updates
- Type safety via TypeScript strict mode + store type definitions
- Supabase RLS policies enforce backend constraints
- Frontend validation is UX only; server is source of truth

**Authentication:**
- Supabase OAuth + password auth via `useAuthStore`
- Session persisted by Supabase SDK in browser storage
- Auth state changes trigger re-renders via store listener
- Reset functionality available via `?reset=true` URL parameter
- Access control: AccessGate screen for invite-code verification before auth

**State Persistence:**
- Zustand `persist()` middleware saves to localStorage on every store change
- Non-destructive: importing data merges with existing state
- Can be cleared via `resetProgress()` method or `?reset=true` URL parameter
- Cloud sync is opt-in when Supabase is configured

**Performance:**
- Components use store selectors to access specific state (not full store)
- Theme CSS variables prevent full re-renders when theme changes
- Framer Motion animations for smooth transitions without layout thrashing
- PWA caching via Workbox for offline asset availability
