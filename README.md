# Gamify Your Gains

A gamified fitness tracking Progressive Web App (PWA) that transforms your workout and nutrition journey into an RPG-style progression system. Earn XP, level up, unlock achievements, and watch your avatar evolve as you build consistent habits.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [What is This App?](#what-is-this-app)
3. [Tech Stack Overview](#tech-stack-overview)
4. [Project Structure](#project-structure)
5. [Local Development Setup](#local-development-setup)
6. [Environment Variables](#environment-variables)
7. [External Services](#external-services)
8. [Key Features Explained](#key-features-explained)
9. [State Management](#state-management)
10. [Database Schema](#database-schema)
11. [Common Tasks](#common-tasks)
12. [Troubleshooting](#troubleshooting)
13. [Deployment](#deployment)
14. [Contributing](#contributing)

---

## Quick Start

```bash
# 1. Clone the repository
git clone git@github.com:jasperprimelvl99/gamify-gains-app.git
cd gamify-gains-app

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your actual values (see Environment Variables section)

# 4. Start the development server
npm run dev

# 5. Open http://localhost:5173 in your browser
```

---

## What is This App?

**Gamify Your Gains** is a fitness companion app designed to make working out and tracking nutrition fun through gamification. Users:

- **Track workouts** with customizable exercise routines (3, 4, or 5-day splits)
- **Log meals** and track macros (protein, carbs, fats, calories)
- **Earn XP** for completing daily tasks (workouts, hitting macro targets, daily check-ins)
- **Level up** through 99 levels with increasing XP requirements
- **Watch their avatar evolve** through 13 stages (from Egg to Ascended)
- **Unlock achievements** for hitting milestones
- **Sync data** across devices via cloud backup

### Target Users
- People who have purchased the companion ebook (access is gated via license key)
- Personal trainers monitoring clients via the Coach Dashboard

---

## Tech Stack Overview

| Technology | Purpose | Documentation |
|------------|---------|---------------|
| **React 18** | UI framework | [react.dev](https://react.dev) |
| **TypeScript** | Type safety | [typescriptlang.org](https://www.typescriptlang.org) |
| **Vite** | Build tool & dev server | [vitejs.dev](https://vitejs.dev) |
| **Zustand** | State management | [zustand docs](https://docs.pmnd.rs/zustand) |
| **Tailwind CSS** | Styling | [tailwindcss.com](https://tailwindcss.com) |
| **Framer Motion** | Animations | [framer.com/motion](https://www.framer.com/motion/) |
| **Supabase** | Database, Auth, Real-time sync | [supabase.com/docs](https://supabase.com/docs) |
| **Vite PWA Plugin** | Progressive Web App features | [vite-pwa-org.netlify.app](https://vite-pwa-org.netlify.app/) |
| **Sentry** | Error tracking | [sentry.io](https://sentry.io) |
| **Plausible** | Privacy-friendly analytics | [plausible.io](https://plausible.io) |

---

## Project Structure

```
gamify-gains-app/
├── public/                  # Static assets (PWA icons, manifest)
│   ├── pwa-192x192.png     # PWA icon (small)
│   ├── pwa-512x512.png     # PWA icon (large)
│   ├── apple-touch-icon.png # iOS home screen icon
│   └── favicon.svg         # Browser tab icon
│
├── src/
│   ├── App.tsx             # Root component - routing & auth logic
│   ├── main.tsx            # Entry point - renders App
│   ├── index.css           # Global styles & Tailwind imports
│   │
│   ├── components/         # Reusable UI components
│   │   ├── Avatar.tsx      # Animated avatar with mood states
│   │   ├── Badges.tsx      # Achievement badge grid
│   │   ├── Button.tsx      # Styled button (variants: primary, ghost, danger)
│   │   ├── Card.tsx        # Card container with hover effects
│   │   ├── FoodSearch.tsx  # Food search with USDA API
│   │   ├── MealBuilder.tsx # Multi-ingredient meal creator
│   │   ├── Navigation.tsx  # Bottom tab bar
│   │   ├── ProgressBar.tsx # Animated progress indicators
│   │   ├── Toast.tsx       # Toast notification display
│   │   ├── WeeklySummary.tsx # Weekly XP breakdown
│   │   ├── WeightChart.tsx # SVG weight trend chart
│   │   └── XPDisplay.tsx   # Level & XP progress display
│   │
│   ├── screens/            # Full-page components (routes)
│   │   ├── Home.tsx        # Dashboard with daily quests
│   │   ├── Macros.tsx      # Nutrition tracking (4 tabs)
│   │   ├── Workouts.tsx    # Workout logging & customization
│   │   ├── AvatarScreen.tsx # Avatar display & evolution
│   │   ├── Achievements.tsx # Badge collection
│   │   ├── Settings.tsx    # User preferences
│   │   ├── Coach.tsx       # Coach dashboard (client management)
│   │   ├── Auth.tsx        # Login/signup/password reset
│   │   ├── Onboarding.tsx  # New user setup flow
│   │   ├── AccessGate.tsx  # License key entry
│   │   ├── CheckInModal.tsx # Daily check-in modal
│   │   └── XPClaimModal.tsx # Weekly XP celebration
│   │
│   ├── stores/             # Zustand state stores
│   │   ├── index.ts        # Re-exports all stores
│   │   ├── userStore.ts    # User profile, streaks, weight logs
│   │   ├── xpStore.ts      # XP, levels, daily logs
│   │   ├── macroStore.ts   # Macro targets, meals, food logs
│   │   ├── workoutStore.ts # Workout plans, exercises, logs
│   │   ├── avatarStore.ts  # Avatar stage, mood, reactions
│   │   ├── authStore.ts    # Supabase auth state
│   │   ├── achievementsStore.ts # Badge unlock tracking
│   │   ├── accessStore.ts  # License key validation
│   │   ├── remindersStore.ts # In-app reminder preferences
│   │   └── toastStore.ts   # Toast notification queue
│   │
│   ├── lib/                # Utilities and API clients
│   │   ├── supabase.ts     # Supabase client initialization
│   │   ├── sync.ts         # Cloud sync logic
│   │   ├── foodApi.ts      # USDA & Open Food Facts API
│   │   ├── analytics.ts    # Plausible event tracking
│   │   ├── sentry.ts       # Sentry error tracking setup
│   │   ├── units.ts        # Unit conversion (lbs/kg)
│   │   └── database.types.ts # TypeScript types for Supabase
│   │
│   └── hooks/              # Custom React hooks
│       └── useClientDetails.ts # Fetch coach client data
│
├── supabase/               # Database configuration
│   ├── schema.sql          # Main database schema
│   ├── access_codes.sql    # Access code tables
│   └── migrations/         # Database migrations
│
├── .env.example            # Template for environment variables
├── package.json            # Dependencies and scripts
├── tailwind.config.js      # Tailwind theme configuration
├── vite.config.ts          # Vite build configuration
├── vercel.json             # Vercel deployment config
└── tsconfig.json           # TypeScript configuration
```

---

## Local Development Setup

### Prerequisites

- **Node.js 18+** (we recommend using [nvm](https://github.com/nvm-sh/nvm))
- **npm** (comes with Node.js)
- **Git**

### Step-by-Step Setup

```bash
# 1. Ensure you have the right Node version
node --version  # Should be 18.x or higher
# If not, install it:
nvm install 18
nvm use 18

# 2. Clone and enter the project
git clone git@github.com:jasperprimelvl99/gamify-gains-app.git
cd gamify-gains-app

# 3. Install dependencies
npm install

# 4. Create your environment file
cp .env.example .env

# 5. Fill in your environment variables (see next section)

# 6. Start the development server
npm run dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at http://localhost:5173 |
| `npm run build` | Build for production (outputs to `dist/`) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint to check for code issues |

---

## Environment Variables

Create a `.env` file in the project root with these variables:

```bash
# REQUIRED - Supabase (Database & Auth)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# OPTIONAL - Error Tracking
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# OPTIONAL - License Validation
VITE_LEMONSQUEEZY_API_URL=https://api.lemonsqueezy.com

# OPTIONAL - Beta Tester Access (bypasses license check)
VITE_MASTER_ACCESS_CODE=YOURMASTERCODE

# OPTIONAL - Better Food Search (recommended)
VITE_USDA_API_KEY=your-usda-api-key
```

### Where to Get These Values

| Variable | Where to Get It |
|----------|-----------------|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → `anon` `public` key |
| `VITE_SENTRY_DSN` | Sentry → Project Settings → Client Keys (DSN) |
| `VITE_USDA_API_KEY` | [USDA FoodData Central](https://fdc.nal.usda.gov/api-key-signup.html) (free signup) |

---

## External Services

### 1. Supabase (Database & Auth)

**What it does:** Stores all user data, handles authentication, syncs data across devices.

**Dashboard:** https://supabase.com/dashboard

**Our Project:** Look for the project named similar to "gamify-gains"

**Common Tasks:**
- View user data: Go to Table Editor → Select a table (e.g., `profiles`)
- Check auth users: Go to Authentication → Users
- Run SQL queries: Go to SQL Editor
- View logs: Go to Logs → API logs

**Credentials Location:** Settings → API

### 2. Vercel (Hosting)

**What it does:** Hosts the production website, auto-deploys on git push.

**Dashboard:** https://vercel.com/dashboard

**Our Project URL:** https://gamify-gains-app.vercel.app

**Common Tasks:**
- View deployments: Click on project → Deployments tab
- Check build logs: Click on any deployment → View logs
- Add environment variables: Settings → Environment Variables
- Trigger manual redeploy: Deployments → Click "..." on latest → Redeploy

**Auto-Deploy:** Every push to `master` branch triggers a new deployment.

### 3. Sentry (Error Tracking)

**What it does:** Captures JavaScript errors in production, shows stack traces.

**Dashboard:** https://sentry.io

**Common Tasks:**
- View errors: Issues tab
- See error details: Click on any issue
- Check if errors are new: Look at "First seen" / "Last seen"

### 4. Plausible (Analytics)

**What it does:** Privacy-friendly analytics (no cookies, GDPR compliant).

**Dashboard:** Check with project owner for access

**Events We Track:**
- `signup`, `login` - Auth events
- `workout_started`, `workout_completed` - Workout tracking
- `meal_logged`, `macro_target_hit` - Nutrition tracking
- `level_up`, `badge_unlocked` - Progression events

### 5. Lemon Squeezy (License Keys)

**What it does:** Generates license keys for ebook purchasers.

**Dashboard:** https://app.lemonsqueezy.com

**How It Works:**
1. User buys ebook → Lemon Squeezy creates license key
2. User enters key in app → App validates via Lemon Squeezy API
3. Valid key → User gets full access

**Testing:** Use the `VITE_MASTER_ACCESS_CODE` to bypass license check during development.

### 6. USDA FoodData Central (Food Search)

**What it does:** Provides nutrition data for food search.

**API Key:** https://fdc.nal.usda.gov/api-key-signup.html (free)

**Fallback:** If no API key, falls back to Open Food Facts (less accurate).

---

## Key Features Explained

### XP & Leveling System

Users earn XP for daily actions:

| Action | XP Earned |
|--------|-----------|
| Complete workout | +100 XP |
| Hit protein target | +50 XP |
| Hit calorie target | +50 XP |
| Daily check-in | +25 XP |
| Streak bonus | +10 XP per day of streak |

**Level Progression:**
- 99 total levels
- XP required increases per level (100 → 2,500 max)
- XP is "claimed" on Sundays with a celebration modal

### Avatar Evolution

The avatar evolves through 13 stages based on level:

| Stage | Name | Levels | Emoji |
|-------|------|--------|-------|
| 0 | Egg | 0 | 🥚 |
| 1 | Hatchling | 1 | 🐣 |
| 2 | Sprout | 2-3 | 🌱 |
| 3 | Rookie | 4-5 | 🏃 |
| 4 | Contender | 6-8 | 💪 |
| 5 | Warrior | 9-12 | ⚔️ |
| 6 | Veteran | 13-18 | 🦾 |
| 7 | Elite | 19-25 | 🔥 |
| 8 | Champion | 26-35 | 🏆 |
| 9 | Legend | 36-50 | ⚡ |
| 10 | Mythic | 51-70 | ✨ |
| 11 | Titan | 71-90 | 🌟 |
| 12 | Ascended | 91-99 | 👑 |

### Workout System

**Workout Splits:**
- **3-Day Full Body:** Day A (Push+Quads), Day B (Pull+Hinge), Day C (Full Body)
- **4-Day Upper/Lower:** Upper Push, Lower Quad, Upper Pull, Lower Hinge
- **5-Day Split:** Push, Pull, Legs (Quad), Upper, Legs (Hinge) + Arms

**Features:**
- Pre-built exercise templates for each day
- Customizable exercises (add/edit/remove/reorder)
- Previous workout weights shown as hints
- Add exercises mid-workout
- End workout early option
- Exercise history with personal records

### Macro Tracking

**Tabs:**
1. **Log** - Quick food logging with search
2. **Meals** - Saved meals for quick re-logging
3. **Targets** - Set daily protein/carbs/fat/calorie goals
4. **History** - View past days

**Features:**
- USDA FoodData Central integration
- Quantity/unit selection (grams, oz, servings)
- Build meals with multiple ingredients
- Running macro totals

---

## State Management

We use **Zustand** for state management. Each "store" handles a specific domain:

### Store Overview

| Store | File | Purpose |
|-------|------|---------|
| `useUserStore` | `userStore.ts` | User profile, streak, weight logs |
| `useXPStore` | `xpStore.ts` | XP, levels, daily XP logs |
| `useMacroStore` | `macroStore.ts` | Macro targets, meals, food logs |
| `useWorkoutStore` | `workoutStore.ts` | Workout plans, exercises, logs |
| `useAvatarStore` | `avatarStore.ts` | Avatar stage, mood, reactions |
| `useAuthStore` | `authStore.ts` | Auth state (logged in user) |
| `useAchievementsStore` | `achievementsStore.ts` | Badge unlock tracking |
| `useAccessStore` | `accessStore.ts` | License key validation |
| `useRemindersStore` | `remindersStore.ts` | Reminder preferences |
| `toast` | `toastStore.ts` | Toast notifications |

### Using a Store

```tsx
import { useUserStore } from '@/stores'

function MyComponent() {
  // Get state
  const userName = useUserStore((state) => state.name)
  const streak = useUserStore((state) => state.streak)

  // Get actions
  const setName = useUserStore((state) => state.setName)

  return (
    <div>
      <p>Hello, {userName}!</p>
      <p>Streak: {streak} days</p>
      <button onClick={() => setName('New Name')}>Change Name</button>
    </div>
  )
}
```

### Data Persistence

All stores use `persist` middleware to save data to `localStorage`. Data syncs to Supabase when user is authenticated.

---

## Database Schema

Main tables in Supabase:

| Table | Purpose |
|-------|---------|
| `profiles` | User profile data (name, gender, goals, etc.) |
| `xp_logs` | XP transaction history |
| `daily_macro_logs` | Daily macro tracking |
| `macro_targets` | User's macro goals |
| `workout_logs` | Completed workouts |
| `weight_logs` | Daily weigh-ins |
| `coach_clients` | Coach-client relationships |

See `supabase/schema.sql` for full schema with Row Level Security policies.

---

## Common Tasks

### Adding a New Screen

1. Create file in `src/screens/NewScreen.tsx`
2. Add route in `src/App.tsx`
3. Add navigation link if needed in `src/components/Navigation.tsx`

### Adding a New Store

1. Create file in `src/stores/newStore.ts`
2. Export from `src/stores/index.ts`
3. Use in components with `useNewStore`

### Adding a New Component

1. Create file in `src/components/NewComponent.tsx`
2. Export from `src/components/index.ts`
3. Import where needed

### Modifying Workout Templates

Edit `src/stores/workoutStore.ts`:
- `THREE_DAY_TEMPLATES` - 3-day full body
- `FOUR_DAY_TEMPLATES` - 4-day upper/lower
- `FIVE_DAY_TEMPLATES` - 5-day split

### Testing Without License Key

Set `VITE_MASTER_ACCESS_CODE` in `.env` and use that code to bypass license validation.

### Clearing App Data (Testing)

Add `?reset=true` to any URL to clear all localStorage data:
```
http://localhost:5173/?reset=true
```

---

## Troubleshooting

### "Module not found" errors

```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### Supabase connection issues

1. Check `.env` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. Verify Supabase project is running (not paused)
3. Check browser console for specific errors

### Login says "Invalid credentials"

1. User may not have confirmed their email
2. Check Supabase Auth → Users to see if email is confirmed
3. The app shows a banner if email confirmation is needed

### Food search not working

1. Check if `VITE_USDA_API_KEY` is set
2. Falls back to Open Food Facts if no key
3. Check browser console for API errors

### PWA not updating

1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Clear browser cache
3. Unregister service worker in DevTools → Application → Service Workers

### Build fails on Vercel

1. Check Vercel build logs for specific error
2. Common issues:
   - Missing environment variables (add in Vercel dashboard)
   - TypeScript errors (run `npm run build` locally first)
   - Node version mismatch (we need 18+)

### "Rate limit exceeded" on signup

Supabase free tier has email rate limits. Wait a few minutes and try again.

### Dropdowns hidden behind other elements

This is a z-index issue. Components use React Portals for dropdowns. If still occurring, check z-index values in the component.

---

## Deployment

### Automatic (Recommended)

Every push to `master` triggers a Vercel deployment:

```bash
git add .
git commit -m "Your changes"
git push origin master
```

### Manual Vercel Deploy

1. Go to https://vercel.com/dashboard
2. Select the project
3. Click "Deployments" tab
4. Click "..." on latest deployment → "Redeploy"

### Environment Variables on Vercel

1. Go to Project Settings → Environment Variables
2. Add each variable from `.env.example`
3. Redeploy for changes to take effect

### Checking Deploy Status

1. Push to master
2. Go to Vercel dashboard
3. Watch the deployment progress
4. Green checkmark = success
5. Click deployment to see live URL

---

## Contributing

### Code Style

- Use TypeScript for all new files
- Follow existing patterns in similar files
- Use Tailwind CSS for styling
- Export components/stores from index files

### Git Workflow

```bash
# 1. Make your changes
# 2. Check TypeScript compiles
npm run build

# 3. Commit with descriptive message
git add .
git commit -m "Add feature: description of what you added"

# 4. Push to deploy
git push origin master
```

### File Naming

- Components: `PascalCase.tsx` (e.g., `FoodSearch.tsx`)
- Stores: `camelCaseStore.ts` (e.g., `macroStore.ts`)
- Utilities: `camelCase.ts` (e.g., `analytics.ts`)

---

## Need Help?

1. **Check this README** - Most common questions are answered here
2. **Search the codebase** - Similar features may already exist
3. **Check browser console** - Errors usually have helpful messages
4. **Check Supabase logs** - For database/auth issues

---

## License

MIT
