# WellTrained - Features, Capabilities & Technology

## Overview

**WellTrained** is a premium fitness Progressive Web App (PWA) with native iOS support, designed for discipline-focused athletes. It combines comprehensive workout and macro tracking with an RPG-inspired gamification system, AI-powered meal planning, and a professional coaching platform.

**Version:** 1.7.0
**Target Audience:** Athletes aged 20-45 who value accountability, measurable progress, and a premium user experience.

---

## Core Features

### Gamification System

**Discipline Points (DP)** - The primary currency earned through daily actions:
- Training completion: +50 DP
- Meals tracked: +15 DP (capped at 3/day)
- Protein target hit: +25 DP
- 10k+ steps: +10 DP
- 7+ hours sleep: +10 DP

**DP Toast Notifications** - Floating "+15 DP" toasts animate on-screen when points are awarded, providing immediate visual feedback for each action.

**16-Rank Progression** - From Uninitiated (Rank 0) to Master (Rank 15):
| Rank | Name | Threshold |
|------|------|-----------|
| 0 | Uninitiated | 0 DP |
| 1 | Initiate | 250 DP |
| 2 | Compliant | 750 DP |
| 3 | Obedient | 1,500 DP |
| 4 | Disciplined | 2,250 DP |
| 5 | Conditioned | 3,000 DP |
| 6 | Proven | 3,750 DP |
| 7 | Hardened | 4,750 DP |
| 8 | Forged | 5,750 DP |
| 9 | Trusted | 6,750 DP |
| 10 | Enforcer | 7,750 DP |
| 11 | Seasoned | 9,000 DP |
| 12 | Elite | 10,250 DP |
| 13 | Apex | 11,500 DP |
| 14 | Sovereign | 13,000 DP |
| 15 | Master | 14,750 DP |

**5 Archetypes** (4 premium, 1 free):
| Archetype | Bonus |
|-----------|-------|
| Bro (Free) | Balanced, no modifiers |
| Himbo | +50% training DP |
| Brute | +50% nutrition DP |
| Pup | +100% lifestyle DP |
| Bull | Streak bonuses (v2.1) |

**Obedience Streaks** - Daily check-in streaks with "Safe Word" recovery (2-day grace period) and animated 7-day calendar visualization with staggered entry animations and pulsing glow on the current day.

**20+ Achievements/Badges** across 5 categories (Streak, Workout, Nutrition, Level, Special) with 4 rarity tiers (Common, Rare, Epic, Legendary).

**Avatar Evolution** - 13 stages across 3 character classes with a mood system (Happy, Neutral, Sad, Hyped, Neglected) that reacts to user behavior.

**Rank-Up Celebrations** - Full-screen confetti burst with bouncy trophy icon animation and Framer Motion transitions when users level up.

---

### Protocol AI (AI Meal Planning)

A new AI-powered meal planning system accessible at `/protocol-ai`:

**Features:**
- **AI-Generated Meal Plans** - Uses GPT-4o-mini to create daily meal plans that hit exact macro targets (within +/- 5% margin)
- **Food Preferences** - Configure cuisines, dietary restrictions, allergies, liked/disliked foods
- **Meal Swapping** - Request individual meal replacements with natural language feedback
- **Plan Rating** - Thumbs up/down feedback to improve future recommendations
- **One-Tap Logging** - Log AI-generated meals directly to the macro tracker

**Backend:**
- `generate-meal-plan` Edge Function - Fetches user macros and preferences, prompts OpenAI, returns structured meal plan
- `refine-meal-plan` Edge Function - Swaps individual meals based on user feedback
- `user_food_preferences` table - Stores dietary preferences per user
- `ai_meal_plans` table - One active plan per user per day with JSONB meal storage
- `meal_plan_feedback` table - Tracks ratings and swap requests

---

### Training Features

- Full workout logging (exercises, sets, reps, weights)
- Quick Compliance mode for minimal viable workouts
- Workout history and PR tracking
- Mid-workout exercise reordering
- Auto warmup sets (50% weight placeholders)
- Coach-assigned workouts with `assignmentId` linking

---

### Nutrition Tracking

- Daily calorie & protein targets
- Food search via USDA FoodData Central with Open Food Facts fallback
- Meal builder for composition
- Saved/favorite meals with persistence
- Recent foods for quick logging
- Adherence visualization
- Coach-set macro targets with ownership tracking
- **Macro Calculator** - Built-in BMR/TDEE calculator using Mifflin-St Jeor formula with activity multipliers and goal-based adjustments (cut/recomp/maintain/bulk)

---

### Weekly Check-ins

A structured 16-field form including:
- Water intake, stress, recovery metrics
- Auto-populated snapshots: weight (current, 7-day avg, weekly change), macro hit rate %, cardio sessions, workouts completed, step average
- Coach review and response capability with status tracking

---

### Coaching Platform

**Client Management:**
- Email invitations with roster status indicators (active, needs attention, falling off, pending)
- Coach-set macro targets with `set_by` data ownership
- Email notifications via Resend when intakes complete

**Intake Pipeline:**
- 40+ field comprehensive intake form (personal info, body composition, goals, training history, nutrition, supplements, health conditions, lifestyle, coaching preferences)
- Photo uploads (front/back/side relaxed, front flexed)
- Status workflow: New → Reviewed → Active → Archived

**Client Detail Modal** with 5 tabs: Overview, Weight Trend, Macro Adherence, Workout History, Activity Feed

---

### Additional Capabilities

- **Animated Splash Screen** - Branded launch experience with SVG avatar logo, "WELLTRAINED" title animation, and "Enter The Protocol" tagline
- **11-step Onboarding Wizard** with progress persistence to localStorage
- **Health Integration** (iOS) - HealthKit permission soft-ask, daily health data fetch, manual fallback
- **Data Export/Import** - Full profile backup and restore
- **Accessibility** - WCAG AA color contrast (4.5:1+), skeleton loading states, haptic feedback, `reducedMotion` respect

---

## Animation System

Built on **Framer Motion** with a cohesive "Dopamine Noir V2" animation language:

### Spring Configurations
| Spring | Use Case | Settings |
|--------|----------|----------|
| `snappy` | Buttons, toggles | stiffness: 400, damping: 30 |
| `default` | General UI movement | stiffness: 300, damping: 25 |
| `smooth` | Page transitions | stiffness: 200, damping: 25 |
| `gentle` | Modals, overlays | stiffness: 150, damping: 20 |
| `bouncy` | Celebrations, badges | stiffness: 300, damping: 15 |

### Animated Components
- **AnimatedPage** - Page wrapper with fade/slide transitions
- **StaggerList / StaggerItem** - Staggered children animations
- **Confetti** - Multi-shape particle burst (circles, squares, strips)
- **CountUp** - Animated number counting
- **AnimatedRing** - Circular progress with animation
- **DPToast** - Floating DP award notifications
- **ProgressBar** - Animated fill with glow effect and shimmer on completion
- **Navigation** - Sliding `layoutId` indicator with haptic feedback

### Page Transitions
- `AnimatePresence` with `mode="wait"` for smooth route changes
- Location-keyed routes for proper exit animations
- Respect for `prefers-reduced-motion` via `MotionConfig`

---

## Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 + TypeScript 5.6 | Core framework |
| Vite 5.4 | Build tooling |
| Tailwind CSS v4 | Styling |
| shadcn/ui + Radix UI | Component primitives |
| Framer Motion | Animation library |
| Zustand 4.5 | State management (persisted with 90-day rolling window) |
| React Router v6 | Navigation |
| Lucide React | Icons |
| Sonner 2.0 | Toast notifications |

### Backend & Services
| Service | Purpose |
|---------|---------|
| Supabase (PostgreSQL) | Database, Auth, Real-time sync, RLS policies, Edge Functions |
| OpenAI (GPT-4o-mini) | AI meal plan generation |
| Sentry | Error monitoring with source maps |
| Plausible | Privacy-friendly analytics (22+ custom events, cookieless) |
| RevenueCat | In-app purchases and premium subscription handling |
| Resend | Transactional emails |
| USDA FoodData Central | Primary food/macro lookup |
| Open Food Facts | Fallback food API |

### Mobile (Native iOS)
| Technology | Purpose |
|------------|---------|
| Capacitor 7.5 | iOS native wrapper |
| @capgo/capacitor-health | HealthKit integration |
| @capawesome/capacitor-badge | App badge counts |
| Native APIs | Push notifications, haptics, deep linking, background sync |

### Testing
| Framework | Coverage |
|-----------|----------|
| Vitest + React Testing Library | 174 unit tests across 9 store/component files |
| Playwright | 27 E2E tests across 6 feature specs |

### Deployment
- **Web:** Vercel
- **PWA:** vite-plugin-pwa (installable, offline support, prompt-based updates)
- **Service Workers:** Workbox (NetworkFirst for API, CacheFirst for fonts)

---

## Architecture Highlights

### Offline-First Design
- All data synced to localStorage first
- 90-day rolling window data pruning
- Cloud sync on demand + visibility change detection
- Exponential backoff retry logic
- Full functionality without network connectivity

### State Management
21 Zustand stores with localStorage persistence:
- `userStore`, `workoutStore`, `macroStore`, `dpStore`, `avatarStore`, `achievementsStore`, `authStore`, `syncStore`, `subscriptionStore`, `healthStore`, `questStore`, `mealPlanStore`, and more

### Security
- Row-Level Security (RLS) policies on all tables
- `set_by` column tracks macro ownership (self vs coach)
- `is_coach_role()` SECURITY DEFINER function
- `prevent_role_change()` trigger blocks client API role changes
- Coach-client relationship gates access to sensitive data

---

## Design System: "Dopamine Noir V2"

**Philosophy:** Restrained confidence, signal vs. noise, typography as UI

| Element | Value |
|---------|-------|
| Primary | Lime (#C8FF00) |
| Background | #0A0A0A |
| Surface | #26282B |
| Foreground | #FAFAFA |
| Muted | #A1A1AA |

**Typography:**
- Display: Oswald (stats, rank, headings)
- Body: Inter Variable (UI, body copy)
- Data: JetBrains Mono (numbers, tables)

**Component Library:** 45+ reusable components built on shadcn/ui primitives with WellTrained theme overrides.

---

## Project Structure

```
src/
├── components/          # 45+ UI components (including animation primitives)
├── screens/             # 18 route components
├── stores/              # 21 Zustand stores
├── lib/                 # 35+ utility files (sync, analytics, APIs, animations, formulas)
├── design/              # Design constants
├── hooks/               # Custom React hooks
└── App.tsx              # Router with AnimatePresence and per-route Suspense

supabase/
├── functions/           # 7 Edge Functions (including AI meal planning)
├── migrations/          # 15 database migrations
└── schema.sql           # Full schema definition
```

---

## Third-Party Integrations

| Service | Purpose |
|---------|---------|
| Supabase | Auth, database, RLS, Edge Functions |
| OpenAI | GPT-4o-mini for AI meal generation |
| Sentry | Error monitoring with user context |
| Plausible | Privacy-friendly analytics |
| RevenueCat | Premium subscription gating |
| Resend | Coach intake email notifications |
| USDA/Open Food Facts | Food database with macro lookup |
| Capacitor | iOS native features (HealthKit, push, haptics) |
| Lemon Squeezy | License validation (with master code fallback) |

---

## Key Routes

| Route | Screen | Description |
|-------|--------|-------------|
| `/` | Home | Dashboard with DP, rank, streaks, avatar, quests |
| `/workouts` | Workouts | Workout logging and history |
| `/macros` | Macros | Meal tracking and macro visualization |
| `/protocol-ai` | MealPlanScreen | AI-generated meal plans |
| `/avatar` | AvatarScreen | Avatar evolution and stats |
| `/achievements` | Achievements | Badge collection |
| `/settings` | Settings | Profile, weight, preferences |
| `/checkin` | WeeklyCheckIn | Weekly check-in form |

---

This is a production-ready, actively developed fitness platform combining modern web technologies with native mobile capabilities, sophisticated gamification psychology, AI-powered nutrition planning, and a complete coaching ecosystem.
