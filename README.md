# Gamify Gains

A gamified fitness tracking PWA that turns your workout and nutrition journey into an RPG-style progression system. Earn XP, level up, unlock achievements, and watch your avatar evolve as you build consistent habits.

## Current State

**This is a fully functional, production-ready codebase** - not a prototype or starting point. The app is feature-complete with:

- Full user authentication (Supabase)
- Complete workout tracking system
- Macro/nutrition logging with food search API
- XP and leveling system with 99 levels
- Avatar evolution (13 stages)
- Achievement badges (16+ unlockable)
- Coach dashboard for personal trainers
- Cloud sync across devices
- PWA support (installable, offline-capable)

### What's Working Right Now

| Feature | Status | Description |
|---------|--------|-------------|
| Auth | Complete | Email/password signup, login, password reset via Supabase |
| Onboarding | Complete | 6-step flow: name, gender, stats, goal, training days, avatar reveal |
| Workout Tracking | Complete | Push/Pull/Legs or Upper/Lower splits, fully customizable exercises (add/edit/remove/reorder) |
| Macro Tracking | Complete | Log meals, track P/C/F/Cal, food search API, saved meals |
| XP System | Complete | Earn XP for all actions, weekly Sunday claims with celebration |
| Leveling | Complete | 99 levels with progressive XP curve (100 XP to 2,500 XP/level) |
| Achievements | Complete | 16+ badges across streak, workout, nutrition, level categories |
| Avatar Evolution | Complete | 13 stages from Egg to Ascended with animations |
| Check-ins | Complete | Daily check-ins with "Never Miss Twice" streak protection |
| Weight Tracking | Complete | Daily weigh-ins with trend chart visualization |
| Coach Dashboard | Complete | Client management, macro adherence, activity feed, weight trends |
| Settings | Complete | Unit toggle (lbs/kg), data export/import, account management |
| Reminders | Complete | Contextual in-app reminders for actions |
| Cloud Sync | Complete | Real-time sync via Supabase with offline support |

### Recent Additions (This Session)

- Gender-specific TDEE calculation (Mifflin-St Jeor formula)
- Enhanced check-in flow with streak calendar
- XP claim celebration modal with confetti
- Toast notification system for error handling
- Coach dashboard with tabs (Overview/Progress/Activity)
- Client weight trend charts
- Client macro adherence visualization
- Client activity feed
- Workout exercise customization with add/edit/remove/reorder
- Edit saved meals functionality

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **State**: Zustand with localStorage persistence
- **Backend**: Supabase (PostgreSQL + Auth + Row Level Security)
- **Styling**: Tailwind CSS (dark gamer theme)
- **Animations**: Framer Motion
- **PWA**: Vite PWA plugin

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Supabase URL and anon key

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Avatar.tsx       # Animated avatar with evolution stages
│   ├── Badges.tsx       # Achievement badge display
│   ├── Button.tsx       # Styled button variants
│   ├── Card.tsx         # Card container with hover effects
│   ├── FoodSearch.tsx   # Open Food Facts API search
│   ├── Navigation.tsx   # Bottom tab navigation
│   ├── ProgressBar.tsx  # Animated progress bars
│   ├── ReminderCard.tsx # Contextual reminder banners
│   ├── Toast.tsx        # Toast notifications
│   ├── WeeklySummary.tsx# Weekly progress overview
│   ├── WeightChart.tsx  # SVG line chart for weight
│   ├── XPDisplay.tsx    # Level and XP progress
│   ├── ClientMacroAdherence.tsx  # Coach: macro charts
│   └── ClientActivityFeed.tsx    # Coach: activity feed
├── screens/             # Page components
│   ├── Home.tsx         # Dashboard with daily quests
│   ├── Macros.tsx       # Nutrition tracking (4 tabs)
│   ├── Workouts.tsx     # Workout logging
│   ├── AvatarScreen.tsx # Avatar display and stats
│   ├── Achievements.tsx # Badge collection
│   ├── Settings.tsx     # User preferences
│   ├── Coach.tsx        # Coach dashboard
│   ├── Auth.tsx         # Login/signup/forgot password
│   ├── Onboarding.tsx   # New user flow
│   ├── CheckInModal.tsx # Daily check-in
│   └── XPClaimModal.tsx # Sunday XP celebration
├── stores/              # Zustand state stores
│   ├── userStore.ts     # Profile, streak, check-ins
│   ├── xpStore.ts       # XP, levels, pending claims
│   ├── macroStore.ts    # Targets, meals, daily logs
│   ├── workoutStore.ts  # Workouts, exercises, logs
│   ├── avatarStore.ts   # Evolution stage, mood
│   ├── authStore.ts     # Supabase auth state
│   ├── achievementsStore.ts # Badge unlocks
│   ├── remindersStore.ts    # Reminder preferences
│   └── toastStore.ts    # Toast notifications
├── hooks/               # Custom React hooks
│   └── useClientDetails.ts  # Coach client data fetching
├── lib/                 # Utilities and APIs
│   ├── supabase.ts      # Supabase client
│   ├── sync.ts          # Cloud sync logic
│   ├── foodApi.ts       # Open Food Facts API
│   ├── units.ts         # Unit conversion helpers
│   └── database.types.ts # Supabase type definitions
└── App.tsx              # Root component with routing
```

## Progression System

### XP Sources

| Action | XP Earned |
|--------|-----------|
| Complete workout | +100 XP |
| Hit protein target | +50 XP |
| Hit calorie target | +50 XP |
| Daily check-in | +25 XP |
| Streak bonus | +10 XP/day |

### Level Curve

| Level | XP Required | Cumulative |
|-------|-------------|------------|
| 1-2   | 100 XP      | 100 XP     |
| 2-3   | 150 XP      | 250 XP     |
| 3-4   | 250 XP      | 500 XP     |
| 4-5   | 400 XP      | 900 XP     |
| 5-6   | 600 XP      | 1,500 XP   |
| 10+   | +200/level  | (max 2,500)|

### Avatar Evolution

| Stage | Name      | Levels | Emoji |
|-------|-----------|--------|-------|
| 0     | Egg       | 0      | 🥚    |
| 1     | Hatchling | 1      | 🐣    |
| 2     | Sprout    | 2-3    | 🌱    |
| 3     | Rookie    | 4-5    | 🏃    |
| 4     | Contender | 6-8    | 💪    |
| 5     | Warrior   | 9-12   | ⚔️    |
| 6     | Veteran   | 13-18  | 🦾    |
| 7     | Elite     | 19-25  | 🔥    |
| 8     | Champion  | 26-35  | 🏆    |
| 9     | Legend    | 36-50  | ⚡    |
| 10    | Mythic    | 51-70  | ✨    |
| 11    | Titan     | 71-90  | 🌟    |
| 12    | Ascended  | 91-99  | 👑    |

## Database Schema

See `supabase/schema.sql` for the complete Supabase schema including:
- `profiles` - User data and preferences
- `xp_logs` - XP transaction history
- `workout_logs` - Workout completions
- `weight_logs` - Daily weigh-ins
- `daily_macro_logs` - Nutrition tracking
- `macro_targets` - User macro goals
- `coach_clients` - Coach-client relationships
- `coach_client_summary` - Aggregated client view for coaches

## Suggested Next Features

Based on the current roadmap:

1. **Workout Customization** - Allow users to add/edit/remove exercises per workout type (partially implemented in store, needs UI)
2. **Social Features** - Leaderboards, friend challenges
3. **Brand Partnership Portal** - Sponsored challenges and rewards
4. **Advanced Analytics** - Progress photos, body measurements, strength tracking

## Development Notes

- Uses Node.js v20+ (managed via nvm)
- TypeScript strict mode enabled
- ESLint configured for React/TypeScript
- Tailwind CSS with custom dark theme colors
- All state persisted to localStorage with cloud sync option

## License

MIT
