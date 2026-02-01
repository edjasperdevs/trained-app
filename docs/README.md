# Gamify Your Gains

A Progressive Web App (PWA) that gamifies fitness tracking with XP, leveling, and avatar evolution. Designed as a companion app for fitness coaching clients.

**Live App:** https://gamify-gains-app.vercel.app

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS (dark gamer theme)
- **State Management:** Zustand with localStorage persistence
- **Animations:** Framer Motion
- **PWA:** vite-plugin-pwa (offline support, installable)
- **Backend:** Supabase (PostgreSQL + Auth) - Required
- **Hosting:** Vercel

---

## Current Features (v1.6)

### User Profile & Onboarding
- Multi-step onboarding flow
- Collects: name, fitness level, training days, height, weight, age, goal, avatar choice
- Goals: Cut, Recomp, Maintain, Bulk
- Fitness levels: Beginner, Intermediate, Advanced

### TDEE & Macro Calculator
- Mifflin-St Jeor equation for BMR (gender-specific formulas)
- Biological sex selection for accurate calculations
- Activity level multipliers (sedentary, light, moderate, active)
- Goal-based calorie adjustments:
  - Cut: -500 cal
  - Recomp: -200 cal
  - Maintain: 0
  - Bulk: +300 cal
- Auto-calculates protein (1g/lb), carbs, and fats

### Meal Logging
- Log meals with name + macros (protein, carbs, fats, calories)
- Auto-calculate calories from macros
- Save meals for quick-add later
- View today's logged meals
- Delete logged meals (recalculates totals)

### Daily Macro Tracking
- Visual progress rings for protein and calories
- Progress bars for carbs and fats
- XP indicators for hitting targets:
  - Protein within 10g of target: +50 XP
  - Calories within 100 of target: +50 XP

### Weight Tracking
- Daily weight logging
- 30-day trend chart with animated SVG
- Weight trend indicator (up/down/same)
- Compares 7-day rolling averages

### Workout System
- 3/4/5 day training splits:
  - 3-day: Push/Pull/Legs
  - 4-day: Upper/Lower/Upper/Lower
  - 5-day: Push/Pull/Legs/Upper/Lower
- **Customizable workout days** - users pick which days of the week
- Exercise templates with target sets/reps
- Full workout logging with weight/reps per set
- **Editable sets** - click completed sets to edit them
- **Skip sets** - mark sets as skipped if needed
- **Quick workout** - log a minimum viable workout when short on time (still earns XP)

### XP & Leveling System
- XP Sources:
  - Complete workout: +100 XP
  - Hit protein target: +50 XP
  - Hit calorie target: +50 XP
  - Daily check-in: +25 XP
- 1000 XP per level, max level 99
- Weekly XP claim on Sundays (accumulates all week)

### Avatar System
- 3 base characters: Warrior, Mage, Rogue
- 10 evolution stages based on level
- Mood system based on activity

### Streaks
- "Never Miss Twice" system
- First missed day: streak paused (warning)
- Second consecutive miss: streak reset
- Tracks current and longest streak

### Data Management
- Full data export to JSON
- Import from backup file
- Reset all progress option
- All data stored locally (localStorage)

### Coach Dashboard
- View all clients with status indicators (green/yellow/red based on last check-in)
- Quick stats: active today, needs check-in, falling off
- Client detail view: level, XP, streak, goal, weight, recent activity
- Add clients by email
- Remove clients
- Clients sorted by needs-attention (most neglected first)
- Access via Settings for users with coach role

### PWA Features
- Installable on mobile (Add to Home Screen)
- Offline support via service worker
- App manifest with icons

---

## Screens

| Screen | Path | Description |
|--------|------|-------------|
| Auth | `/auth` | Sign up / Sign in (required) |
| Onboarding | `/onboarding` | New user setup flow |
| Home | `/` | Dashboard with avatar, XP, daily quests, streak |
| Macros | `/macros` | Daily tracking, meal logging, meal plan, calculator |
| Workouts | `/workouts` | View workout plan, start/log workouts |
| Avatar | `/avatar` | Full avatar view, evolution timeline |
| Settings | `/settings` | Profile, weight tracking, workout days, data management |
| Coach | `/coach` | Coach dashboard for managing clients (coach role only) |

---

## Data Storage

### Local Storage
All data persisted to localStorage via Zustand for offline access:

| Store | Key | Contents |
|-------|-----|----------|
| User | `gamify-gains-user` | Profile, weight history |
| XP | `gamify-gains-xp` | XP totals, level, daily logs, claim history |
| Macros | `gamify-gains-macros` | Targets, meal plan, daily logs, saved meals |
| Workouts | `gamify-gains-workouts` | Current plan, workout logs |
| Avatar | `gamify-gains-avatar` | Character, evolution stage, mood |

### Cloud Sync
Data automatically syncs to Supabase when signed in:
- Profile and settings
- Weight history
- Macro targets and daily logs
- Saved meals and logged meals
- Workout logs
- XP and level progress

Local storage is the source of truth, with changes syncing to the cloud when connected.

---

## What's Missing / TODO

### High Priority (For Testing)
- [x] **Check-in flow improvements** - Make daily check-in more prominent
- [x] **Workout logging UX** - Log sets/reps, edit completed sets, skip sets, quick workouts
- [x] **XP claim celebration** - Sunday claim animation/feedback
- [ ] **Error states** - Handle edge cases gracefully

### Medium Priority (Quality of Life)
- [ ] **Food search API** - Search common foods for macro lookup (USDA FoodData Central or Open Food Facts)
- [ ] **Meal components** - Build meals from ingredients
- [ ] **Edit saved meals** - Modify existing saved meals
- [ ] **Workout customization** - Edit exercises in workout plan
- [ ] **Progress photos** - Optional photo logging
- [ ] **Notifications** - Reminder to log, check in, claim XP

### Lower Priority (Nice to Have)
- [ ] **Dark/light theme toggle**
- [ ] **Metric/imperial units toggle**
- [ ] **Weekly summary** - Recap of the week's progress
- [ ] **Achievement badges** - Unlock achievements for milestones
- [ ] **Social sharing** - Share progress/achievements

---

## Future: Coach Dashboard Enhancements

The basic Coach Dashboard is now implemented. Future enhancements:

### Client Detail View Improvements
- [ ] Macro adherence chart (weekly/monthly trends)
- [ ] Weight trend chart in client detail
- [ ] Workout completion rate visualization
- [ ] Recent activity feed

### Coach Tools
- [ ] Send messages/encouragement to clients
- [ ] Adjust client's macro targets remotely
- [ ] Assign custom workout plans
- [ ] Set client-specific goals

### Analytics
- [ ] Aggregate stats across all clients
- [ ] Export client reports (PDF/CSV)
- [ ] Weekly email digest of client activity

### Technical Infrastructure

Backend infrastructure is complete:

1. **Backend** - Supabase (PostgreSQL + Auth + RLS)
2. **Database** - Full schema with Row Level Security policies
3. **Authentication** - Supabase Auth (email/password)
4. **Data sync** - Sync layer for all user data
5. **Role system** - Client, Coach, Admin roles defined
6. **Privacy** - RLS policies ensure coaches only see their clients' data
7. **Coach Dashboard** - View clients, check status, add/remove clients

### Migration Path

1. **Phase 1:** Core app functionality - COMPLETE
2. **Phase 2:** Required authentication - COMPLETE
3. **Phase 3:** Cloud data sync - COMPLETE
4. **Phase 4:** Build coach dashboard - COMPLETE
5. **Phase 5:** Enhanced coach tools - TODO

---

## Development

### Prerequisites
- Node.js 20+
- npm
- Supabase account (required)

### Setup
```bash
cd gamify-gains-app
npm install
npm run dev
```

### Backend Setup (Required)

Authentication is required to use the app. To set up Supabase:

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Run the database schema** - Copy contents of `supabase/schema.sql` and run in Supabase SQL Editor

3. **Configure environment variables** - Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Restart the dev server** - The app will now show the sign-up/sign-in screen

5. **For Vercel deployment** - Add the same environment variables in Vercel Dashboard → Settings → Environment Variables

### Database Schema

The Supabase schema includes:

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (extends Supabase auth.users) |
| `coach_clients` | Coach-client relationships |
| `weight_logs` | Daily weight entries |
| `macro_targets` | User's macro targets |
| `daily_macro_logs` | Daily macro totals |
| `logged_meals` | Individual meal logs |
| `saved_meals` | User's saved meal templates |
| `workout_logs` | Completed workout records |
| `user_xp` | XP totals and level |
| `xp_logs` | Individual XP transactions |

Row Level Security (RLS) policies ensure:
- Users can only access their own data
- Coaches can view (read-only) their clients' data
- Admins have full access

### Build
```bash
npm run build
```

### Deploy
```bash
vercel --prod
```

### Project Structure
```
src/
├── components/     # Reusable UI components
├── screens/        # Page components
├── stores/         # Zustand state stores
├── assets/         # Static assets
└── main.tsx        # App entry point
```

---

## Changelog

### v1.6.0 (Current)
- **XP claim celebration** - Exciting Sunday claim experience:
  - Animated preview showing weekly XP breakdown
  - Confetti particle effects during claim
  - XP count-up animation with glow effects
  - Level-up celebration with special animations
  - Progress bar showing XP to next level
  - Enhanced claim banner with pulsing gift icon

### v1.5.0
- **Improved check-in flow** - More prominent and engaging daily check-ins:
  - Animated check-in reminder banner at top of Home screen
  - Pulsing check-in button with visual emphasis
  - 7-day streak calendar showing check-in history
  - Days until Sunday XP claim countdown
  - Success state with XP earned after check-in
  - Enhanced "Never Miss Twice" warning with clearer messaging

### v1.4.0
- **Gender selection for TDEE** - More accurate calorie calculations:
  - Added biological sex selection during onboarding
  - Uses proper Mifflin-St Jeor formula (+5 for male, -161 for female)
  - Gender can be updated in the Macros calculator
  - Syncs to cloud with other profile data

### v1.3.0
- **Coach Dashboard** - Full client management for coaches:
  - View all clients with status indicators (active/needs check-in/falling off)
  - Quick stats cards showing client engagement
  - Client detail modal with level, XP, streak, goal, weight info
  - Add clients by email address
  - Remove clients with confirmation
  - Clients sorted by needs-attention (most neglected first)
  - Access via Settings screen for users with coach role

### v1.2.0
- **Authentication required** - Users must sign up/sign in to use the app
- **Workout logging improvements:**
  - Editable sets - click checkmark to edit completed sets
  - Skip sets - mark sets as skipped without entering numbers
  - Quick workout - log a minimum viable workout with notes when short on time
- Deployed to Vercel: https://gamify-gains-app.vercel.app

### v1.1.0
- Supabase backend integration
- User authentication (sign up, sign in, password reset)
- Cloud data sync (automatic on login)
- Database schema with Row Level Security
- Coach/client role system (prepared for dashboard)

### v1.0.0
- Initial release
- Full onboarding flow
- TDEE calculator with height/age
- Meal logging with saved meals
- Weight tracking with chart
- Customizable workout days
- XP and leveling system
- Avatar evolution
- PWA support
