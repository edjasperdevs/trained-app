# TRAINED

A sophisticated fitness PWA (Progressive Web App) that gamifies your fitness journey with XP, leveling, streaks, avatar evolution, and achievements. Built with a dual-theme system supporting both **TRAINED** (discipline-focused) and **Gamify Your Gains (GYG)** (RPG-styled) experiences.

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS with CSS custom properties
- **State Management:** Zustand
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **PWA:** vite-plugin-pwa
- **Testing:** Vitest

## Current Features

### Core User Features

#### Daily Assignments System
- Three daily tasks: Workout, Protein Target, Calorie Target
- XP rewards for completing each task
- Daily check-in for bonus XP
- Perfect day bonus for completing all tasks

#### XP/Leveling System
- Discipline Points (TRAINED) / XP (GYG) earned through daily activities
- Weekly claim ritual (Sundays) to pool earned XP
- Rank progression from 1-99
- Rank-up animations and notifications
- XP breakdown:
  - Workout: 50 DP
  - Protein Target: 30 DP
  - Calorie Target: 30 DP
  - Daily Check-In: 10 DP
  - Perfect Day Bonus: 20 DP
  - Streak Bonus: 2 DP per day of current streak

#### Streak System
- Current streak displayed with flame icon
- Visual 7-day calendar showing check-in status
- Safe Word Recovery (2-day grace period after missing 1 day)
- Longest streak tracking and personal records

#### Workout Logging
- Standard workout tracking with exercises, sets, reps, and weights
- Quick Compliance mode for minimal logging
- Customizable exercises per workout type
- Workout history (last 10 sessions)
- Three workout types: Strength, Hybrid, Athletic

#### Macro Tracking
- Daily calorie and protein targets (auto-calculated during onboarding)
- Meal builder for logging food
- Macro adherence visualization
- Integration with workout completion rewards

#### Avatar System
- 13 evolution stages with theme-specific names
- Three character classes:
  - Warrior → Strength-focused
  - Mage → Hybrid/Versatile
  - Rogue → Athletic/HIIT-focused
- Mood system (Happy, Hyped, Sad, Neutral, Neglected)
- Mood-based animations
- Automatic evolution at rank milestones

#### Achievements/Badge System
- 20+ badges with rarity levels (Common, Rare, Epic, Legendary)
- Categories: Streak, Workout, Nutrition, Level, Special
- Progress tracking toward unearned badges
- Badge unlock notifications with animations

#### Reminders System
- Daily workout reminder
- Evening macro logging reminder
- Morning and evening hydration reminders
- Flexible scheduling with toggle preferences
- Active reminders displayed on home screen

#### Motivational Messages
- 50+ contextual messages
- Categories: Discipline, Self-Care, Growth, Reward
- Theme-specific language
- Rotates daily on home screen

### Coach Dashboard

- Client list with summary cards (rank, streak, compliance)
- Per-client progress tracking
- Weight history charts (30-day view)
- Macro adherence visualization
- Activity feed / Behavior log
- Client email invitations with coach codes

### Additional Features

- **Onboarding Flow:** 8-10 step wizard collecting user data and preferences
- **Weight Tracking:** History, trend analysis, goal projection
- **Theme Toggle:** Real-time switching between TRAINED and GYG themes
- **Data Export/Import:** Full profile backup and restore
- **Access Code Gating:** Required at app entry
- **PWA Support:** Installable on mobile devices

## Dual-Theme System

The app supports two complete themes with different aesthetics and terminology:

| Aspect | TRAINED | Gamify Your Gains |
|--------|---------|-------------------|
| Style | Dark, premium, discipline-focused | Bright, RPG-gamified |
| Colors | Deep blood red accents | Gold/amber accents |
| XP Term | Discipline Points | XP |
| Streak Term | Obedience | Consistency |
| Coach Term | Dom | Coach |
| Client Term | Sub | Client |
| Typography | Sharp, commanding | Rounded, playful |

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Avatar.tsx
│   ├── Badge.tsx
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Navigation.tsx
│   ├── ProgressBar.tsx
│   ├── StreakDisplay.tsx
│   └── ...
├── screens/             # Route/page components
│   ├── Home.tsx
│   ├── Workouts.tsx
│   ├── Macros.tsx
│   ├── AvatarScreen.tsx
│   ├── Achievements.tsx
│   ├── Settings.tsx
│   ├── Coach.tsx
│   ├── Onboarding.tsx
│   └── ...
├── stores/              # Zustand state management
│   ├── userStore.ts
│   ├── xpStore.ts
│   ├── workoutStore.ts
│   ├── macroStore.ts
│   ├── avatarStore.ts
│   ├── achievementsStore.ts
│   └── ...
├── themes/              # Theme system
│   ├── index.ts         # ThemeProvider & useTheme hook
│   ├── types.ts         # TypeScript interfaces
│   ├── trained.ts       # TRAINED theme config
│   └── gyg.ts           # GYG theme config
├── App.tsx
└── index.css
```

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Suggested Next Features

### High Priority

#### 1. Social Features & Community
- **Leaderboards:** Weekly/monthly rankings by XP earned, streak length, or workout frequency
- **Friends System:** Add friends, view their progress, send encouragement
- **Challenges:** Create or join group challenges (e.g., "30-day streak challenge")
- **Activity Feed:** See friends' achievements and milestones

#### 2. Enhanced Workout Experience
- **Workout Templates:** Save and reuse custom workout routines
- **Rest Timer:** Built-in timer between sets with audio cues
- **Exercise Library:** Searchable database with form videos/GIFs
- **Progressive Overload Tracking:** Automatic suggestions to increase weight/reps
- **Superset/Circuit Support:** Group exercises together

#### 3. Nutrition Improvements
- **Barcode Scanner:** Scan food items for quick macro logging
- **Recipe Builder:** Create and save custom recipes with macro calculations
- **Meal Plans:** Pre-built meal plans based on user goals
- **Water Tracking:** Daily hydration goals with reminders

### Medium Priority

#### 4. Analytics & Insights
- **Progress Photos:** Before/after photo storage with timeline view
- **Body Measurements:** Track chest, waist, arms, etc.
- **Workout Analytics:** Volume over time, muscle group balance, PR tracking
- **Weekly/Monthly Reports:** Email summaries of progress
- **Goal Milestones:** Visual timeline of achievements

#### 5. Gamification Enhancements
- **Daily Quests:** Rotating bonus challenges for extra XP
- **Seasonal Events:** Limited-time themes and exclusive badges
- **Avatar Customization:** Unlock clothing, accessories, backgrounds
- **Guild/Clan System:** Team up with others for group goals
- **Boss Battles:** Complete challenging workout combinations for rewards

#### 6. Integration & Connectivity
- **Apple Health / Google Fit Sync:** Import activity and workout data
- **Wearable Integration:** Connect Fitbit, Garmin, Apple Watch
- **Calendar Integration:** Sync workout schedule with personal calendar
- **Export to Strava/MyFitnessPal:** Share workouts to other platforms

### Lower Priority / Future Considerations

#### 7. AI & Personalization
- **AI Workout Generator:** Generate workouts based on goals, equipment, time
- **Smart Macro Suggestions:** AI-powered meal recommendations
- **Adaptive Training Plans:** Adjust difficulty based on performance
- **Form Analysis:** Video analysis for exercise form feedback

#### 8. Premium/Monetization Features
- **Custom Themes:** User-created color schemes
- **Advanced Analytics Dashboard:** Detailed charts and insights
- **Priority Coach Matching:** Connect with certified trainers
- **Ad-Free Experience:** Remove promotional content

#### 9. Accessibility & Quality of Life
- **Offline Mode:** Full functionality without internet
- **Voice Commands:** Log workouts hands-free
- **Widget Support:** Home screen widgets for quick logging
- **Dark/Light Mode:** Per-theme light mode options
- **Multi-language Support:** Localization for international users

## Contributing

Contributions are welcome! Please read the project documentation in `TRAINED_APP_SPEC.md` and `TRAINED_CONTENT_ADDENDUM.md` before making changes.

## License

Private - All rights reserved
