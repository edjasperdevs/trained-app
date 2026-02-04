# TRAINED — App Build Spec

> **Context:** This app is a re-themed clone of the existing "Gamify Your Gains" (GYG) fitness PWA. The codebase is fully functional — workout logging, macro tracking, XP/leveling, streaks, avatar evolution, achievements, coach dashboard, and access code gating all work. The task is to add a theme system that lets the app run as either "Gamify Your Gains" (RPG-themed) or "Trained" (BDSM/discipline-themed), with Trained as the default build.

> **Stack:** Vite + React + TypeScript + Tailwind CSS + Zustand (state) + vite-plugin-pwa

---

## 1. ARCHITECTURE: THEME SYSTEM

### How It Should Work

Add a theme layer that controls **three things**: terminology (labels/copy), visual design (colors/typography/spacing), and avatar assets. The underlying logic (XP math, streak rules, macro calculations, workout tracking) stays completely untouched.

### Implementation Approach

Create a `src/themes/` directory:

```
src/themes/
├── index.ts          # Theme provider, context, hook
├── types.ts          # Theme type definitions
├── trained.ts        # Trained (BDSM) theme config
├── gyg.ts            # Gamify Your Gains (RPG) theme config
└── tokens.ts         # Shared design token types
```

**Theme config structure:**

```typescript
interface AppTheme {
  id: 'trained' | 'gyg'
  name: string

  // Terminology mapping
  labels: {
    xp: string                    // "DP" | "XP"
    xpFull: string                // "Discipline Points" | "Experience Points"
    level: string                 // "Rank" | "Level"
    streak: string                // "Obedience Streak" | "Streak"
    streakSaver: string           // "Safe Word" | "Streak Saver"
    dailyQuests: string           // "Daily Assignments" | "Daily Quests"
    checkIn: string               // "Daily Report" | "Daily Check-In"
    weeklyXPClaim: string         // "Weekly Reward Ritual" | "Weekly XP Claim"
    achievements: string          // "Marks of Devotion" | "Achievement Badges"
    reminders: string             // "Protocol Reminders" | "Smart Reminders"
    motivationalMessages: string  // "Standing Orders" | "Motivational Messages"
    coach: string                 // "Dom/me" | "Coach"
    client: string                // "Sub" | "Client"
    coachDashboard: string        // "Dom/me Dashboard" | "Coach Dashboard"
    macroAdherence: string        // "Protocol Compliance" | "Macro Adherence"
    activityFeed: string          // "Behavior Log" | "Activity Feed"
    minimalWorkout: string        // "Quick Compliance" | "Quick Workout"
    neverMissTwice: string        // "Safe Word Recovery" | "Never Miss Twice"
    avatarClasses: {
      warrior: string             // "The Dom/me" | "Warrior"
      mage: string                // "The Switch" | "Mage"
      rogue: string               // "The Brat" | "Rogue"
    }
  }

  // Avatar stage names (13 stages)
  avatarStages: string[]

  // Design tokens (see Section 2)
  tokens: DesignTokens

  // Motivational messages pool
  standingOrders: string[]
}
```

**Theme context + hook:**

```typescript
// useTheme() hook returns current theme config
// Components call useTheme().labels.xp instead of hardcoding "XP"
// Components call useTheme().tokens.colorPrimary instead of hardcoded colors
```

**Build flag:**

In `vite.config.ts`, add an env variable `VITE_DEFAULT_THEME=trained` so the production build defaults to Trained. Users can toggle themes in Settings if desired.

### What to Refactor

Search the entire codebase for hardcoded strings that need to become `theme.labels.*` calls. The main files:

- `Home.tsx` — "Daily Quests", "XP", streak display, motivational messages
- `Workouts.tsx` — "Quick Workout" label
- `XPClaimModal.tsx` — "Weekly XP Claim" header and copy
- `CheckInModal.tsx` — "Daily Check-In" header
- `Badges.tsx` — "Achievement Badges" header
- `Settings.tsx` — reminder labels, export labels
- `Coach.tsx` — "Coach Dashboard", "Client" references
- `Avatar.tsx` — stage names, class names
- `ReminderCard.tsx` — reminder copy
- Any toast messages referencing XP/streaks/levels

---

## 2. DESIGN SYSTEM: TRAINED THEME

### Design Philosophy

The Trained theme should feel like a premium men's athletic brand crossed with understated kink culture. Think Tom Ford meets a high-end gym meets a leather shop. **Not** rainbow, not playful, not cute. This is sleek, dark, confident, and quietly intimidating.

**Reference vibes:** Equinox gym branding, Rick Owens aesthetic, premium leather goods packaging, high-end tattoo studio interiors, matte black everything.

### Color Palette

```typescript
const trainedTokens: DesignTokens = {
  // Core
  colorBackground: '#0A0A0A',         // Near-black, not pure black
  colorSurface: '#141414',             // Card/panel backgrounds
  colorSurfaceElevated: '#1C1C1C',     // Modals, dropdowns, elevated surfaces
  colorBorder: '#2A2A2A',              // Subtle borders, dividers

  // Accent — deep blood red, desaturated, not bright
  colorPrimary: '#8B1A1A',             // Primary actions, CTA buttons
  colorPrimaryHover: '#A52222',         // Hover state
  colorPrimaryMuted: 'rgba(139,26,26,0.15)', // Backgrounds, badges, subtle fills

  // Secondary accent — brushed steel / gunmetal
  colorSecondary: '#4A4A4A',           // Secondary buttons, inactive states
  colorSecondaryHover: '#5C5C5C',

  // Text
  colorTextPrimary: '#E8E8E8',         // Primary text — warm white, not blue-white
  colorTextSecondary: '#888888',        // Secondary/muted text
  colorTextAccent: '#8B1A1A',          // Accent text (labels, highlights)
  colorTextOnPrimary: '#FFFFFF',        // Text on primary buttons

  // Status
  colorSuccess: '#2D5A27',             // Deep forest green, not neon
  colorWarning: '#8B6914',             // Dark amber
  colorError: '#8B1A1A',              // Matches primary (intentional)
  colorInfo: '#3A5A7A',               // Steel blue

  // XP/Progress bar
  colorXPBar: '#8B1A1A',              // Fill color for DP progress
  colorXPBarBg: '#1C1C1C',            // Track behind progress bar
  colorStreakActive: '#8B1A1A',         // Active streak indicator
  colorStreakInactive: '#2A2A2A',       // Missed day indicator

  // Typography
  fontHeading: "'Oswald', sans-serif",  // Tall, condensed, commanding
  fontBody: "'Inter', sans-serif",      // Clean, modern, readable
  fontMono: "'JetBrains Mono', monospace", // Stats, numbers, data

  // Sizing
  borderRadius: '4px',                 // Sharp corners — not rounded, not fully square
  borderRadiusLg: '6px',
  borderRadiusCard: '6px',

  // Spacing rhythm
  spacingUnit: '4px',                  // Base unit, multiples of 4

  // Shadows — minimal, dark
  shadowCard: '0 2px 8px rgba(0,0,0,0.4)',
  shadowModal: '0 8px 32px rgba(0,0,0,0.6)',
  shadowGlow: '0 0 20px rgba(139,26,26,0.2)', // Subtle red glow for active states
}
```

### Typography Scale

```
Stat numbers / rank display:  Oswald, 700, 48px
Section headers (h1):         Oswald, 600, 28px, uppercase, letter-spacing: 0.08em
Card headers (h2):            Oswald, 500, 20px, uppercase, letter-spacing: 0.05em
Body text:                    Inter, 400, 16px, line-height: 1.5
Secondary/muted:              Inter, 400, 14px
Labels/tags:                  Inter, 500, 12px, uppercase, letter-spacing: 0.1em
Data/numbers:                 JetBrains Mono, 500, varies
```

**Import fonts in `index.html`:**
```html
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Component Design Specs

#### Cards / Panels
- Background: `colorSurface` (#141414)
- Border: 1px solid `colorBorder` (#2A2A2A)
- Border radius: 6px
- Padding: 16px–20px
- No heavy shadows — depth comes from background contrast, not drop shadows
- On hover/active: border shifts to `colorPrimary` at 40% opacity

#### Buttons
- **Primary:** `colorPrimary` bg, white text, no border radius larger than 4px. Uppercase Oswald font, letter-spaced. Hover brightens slightly. No rounded pill shapes.
- **Secondary:** Transparent bg, 1px `colorBorder` border, `colorTextPrimary` text. Hover fills with `colorSecondary`.
- **Destructive:** Same as primary but confirm with modal.
- **Size:** Minimum touch target 48px height. Full-width on mobile for CTAs.

#### Progress Bars (DP/XP)
- Track: `colorXPBarBg` rounded 2px
- Fill: `colorPrimary` (#8B1A1A) with subtle left-to-right gradient to slightly lighter red
- Height: 8px for inline, 12px for featured (home screen rank bar)
- No animated shimmer — this isn't playful. Clean, static fill.

#### Streak Display
- Show streak days as a horizontal row of small squares (not circles)
- Active day: filled `colorPrimary`
- Inactive/future: `colorBorder` outline only
- Missed (within grace): `colorWarning` fill
- Safe Word Recovery indicator: small lock icon on the grace period day

#### Navigation (Bottom Tab Bar)
- Background: `colorBackground` with top border 1px `colorBorder`
- Icons: outlined style, `colorTextSecondary` default, `colorPrimary` when active
- Labels: 10px uppercase Inter, hidden on smaller screens (icon-only)
- Active indicator: 2px bar above the icon in `colorPrimary`, no background fill

#### Modals
- Background overlay: rgba(0,0,0,0.7) with backdrop-blur: 8px
- Modal surface: `colorSurfaceElevated`
- Border: 1px `colorBorder`
- Header: Oswald, uppercase
- Max-width: 420px on mobile, centered

#### Toast Notifications
- Minimal, bottom-positioned, no rounded corners beyond 4px
- Success: left border 3px `colorSuccess`, dark bg
- Error: left border 3px `colorError`, dark bg
- Auto-dismiss after 3s

#### Avatar Display
- Center stage on home screen
- Subtle `shadowGlow` behind avatar at higher ranks
- Rank badge displayed as a small military-style chevron below the avatar
- Stage name in Oswald, uppercase, letter-spaced

#### Weekly Reward Ritual (XP Claim Modal)
- This is the most theatrical moment in the app
- Full-screen takeover on dark bg
- Large DP number counting up in JetBrains Mono
- Subtle red pulse animation on the number
- "CLAIM YOUR REWARD" button, large, primary, centered
- After claim: rank bar fills, any rank-up triggers a flash + new rank displayed large
- Tone: ceremonial, earned, not confetti-and-fireworks

#### Check-In / Daily Report
- Clean form with toggle switches or checkboxes for each completed item
- Summary at bottom showing DP earned breakdown
- Confirm button: "SUBMIT REPORT"

### Tailwind Config

Extend `tailwind.config.js` to include the Trained palette as CSS custom properties driven by the theme provider. This way theme switching just swaps CSS variables:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        surface: 'var(--color-surface)',
        'surface-elevated': 'var(--color-surface-elevated)',
        border: 'var(--color-border)',
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        'primary-muted': 'var(--color-primary-muted)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-accent': 'var(--color-text-accent)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
      },
      fontFamily: {
        heading: ['Oswald', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '6px',
      }
    }
  }
}
```

---

## 3. TERMINOLOGY MAPPING (COMPLETE)

Find and replace all hardcoded UI strings with `theme.labels.*` references:

| Hardcoded String | Theme Key | Trained Value | GYG Value |
|---|---|---|---|
| XP | `labels.xp` | DP | XP |
| Experience Points | `labels.xpFull` | Discipline Points | Experience Points |
| Level | `labels.level` | Rank | Level |
| Level 1–99 | `labels.level` + number | Rank 1–99 | Level 1–99 |
| Streak | `labels.streak` | Obedience Streak | Streak |
| Streak Saver | `labels.streakSaver` | Safe Word | Streak Saver |
| Never Miss Twice | `labels.neverMissTwice` | Safe Word Recovery | Never Miss Twice |
| Daily Quests | `labels.dailyQuests` | Daily Assignments | Daily Quests |
| Daily Check-In | `labels.checkIn` | Daily Report | Daily Check-In |
| Weekly XP Claim | `labels.weeklyXPClaim` | Weekly Reward Ritual | Weekly XP Claim |
| Achievement Badges | `labels.achievements` | Marks of Devotion | Achievement Badges |
| Smart Reminders | `labels.reminders` | Protocol Reminders | Smart Reminders |
| Motivational Messages | `labels.motivationalMessages` | Standing Orders | Motivational Messages |
| Coach | `labels.coach` | Dom/me | Coach |
| Client | `labels.client` | Sub | Client |
| Coach Dashboard | `labels.coachDashboard` | Dom/me Dashboard | Coach Dashboard |
| Macro Adherence | `labels.macroAdherence` | Protocol Compliance | Macro Adherence |
| Activity Feed | `labels.activityFeed` | Behavior Log | Activity Feed |
| Quick Workout | `labels.minimalWorkout` | Quick Compliance | Quick Workout |
| Warrior | `labels.avatarClasses.warrior` | The Dom/me | Warrior |
| Mage | `labels.avatarClasses.mage` | The Switch | Mage |
| Rogue | `labels.avatarClasses.rogue` | The Brat | Rogue |

### Avatar Stage Names

| Stage | Trained | GYG |
|---|---|---|
| 1 | Uninitiated | Egg |
| 2 | Novice | Hatchling |
| 3 | Trainee | Juvenile |
| 4 | Pledged | Adolescent |
| 5 | Collared | Young Adult |
| 6 | Devoted | Adult |
| 7 | Bound | Mature |
| 8 | Proven | Elder |
| 9 | Mastered | Ancient |
| 10 | Dominant | Mythic |
| 11 | Sovereign | Legendary |
| 12 | Ascended | Transcendent |
| 13 | Unchained | Ascended |

### Standing Orders (Motivational Messages for Trained Theme)

Replace the current motivational messages with these when Trained theme is active:

```typescript
const standingOrders = [
  "The protocol doesn't care about your feelings. Follow it anyway.",
  "Discipline is choosing between what you want now and what you want most.",
  "You earned yesterday. Now earn today.",
  "Consistency isn't glamorous. It's powerful.",
  "The iron doesn't negotiate. Neither should you.",
  "Your body follows orders. Give it the right ones.",
  "Rest is earned, not defaulted to.",
  "Show up. Report in. Get it done.",
  "The only easy day was yesterday.",
  "Your rank isn't given. It's taken.",
  "Obedience to the process is freedom from the outcome.",
  "You don't rise to the occasion. You fall to your training.",
  "Weak moments pass. Regret doesn't.",
  "The protocol works. Trust it.",
  "Every rep is a statement. Make it count.",
  "You said you would. So do it.",
  "Comfort is the enemy of progress.",
  "Discipline today. Freedom tomorrow.",
  "Your future self is watching. Don't disappoint them.",
  "The grind doesn't stop. Neither do you.",
]
```

---

## 4. ONBOARDING FLOW ADJUSTMENTS

The 8-step onboarding stays the same structurally but the copy changes for Trained:

| Step | GYG Copy | Trained Copy |
|---|---|---|
| 1 - Welcome | "Gamify Your Gains" intro | "Welcome to the Protocol. Discipline starts now." |
| 2 - Name | "Enter your username" | "Enter your name." |
| 3 - Gender | Same | Same |
| 4 - Body Stats | Same | Same |
| 5 - Fitness Level | "Beginner / Intermediate / Advanced" | "Uninitiated / Trained / Elite" |
| 6 - Training Days | Same | "How many days per week will you commit?" |
| 7 - Goal | Cut / Recomp / Maintain / Bulk | "Cut / Recomp / Maintain / Build" |
| 8 - Avatar Reveal | "Choose your character" | "Choose your discipline" with class descriptions: The Dom/me (Strength), The Switch (Hybrid), The Brat (Athletic) |

---

## 5. FILES TO MODIFY (PRIORITY ORDER)

### Phase 1: Theme Infrastructure
1. Create `src/themes/types.ts` — type definitions
2. Create `src/themes/trained.ts` — Trained theme config
3. Create `src/themes/gyg.ts` — GYG theme config (move current hardcoded values here)
4. Create `src/themes/index.ts` — ThemeProvider, useTheme hook, CSS variable injection
5. Update `tailwind.config.js` — CSS variable references
6. Update `index.html` — font imports
7. Update `src/App.tsx` — wrap with ThemeProvider

### Phase 2: Visual Overhaul (Trained Default)
8. Update global CSS / `index.css` — dark background, font defaults
9. Update bottom navigation component — new styling
10. Update all card/panel components — surface colors, borders, typography
11. Update button components — new button styles
12. Update modal components — dark modals, blur overlay
13. Update toast component — left-border style
14. Update progress bars — DP bar styling
15. Update streak display — square indicators

### Phase 3: Terminology Swap
16. `Home.tsx` — all quest/XP/streak/motivation references
17. `Workouts.tsx` — quick workout label
18. `XPClaimModal.tsx` — weekly claim copy, button text
19. `CheckInModal.tsx` — check-in copy, button text
20. `Badges.tsx` — achievements header
21. `Settings.tsx` — reminder labels, theme toggle UI
22. `Coach.tsx` — coach/client terminology
23. `Avatar.tsx` — stage names, class names
24. `ReminderCard.tsx` — reminder copy
25. `Onboarding.tsx` — onboarding copy per step
26. `WeeklySummary.tsx` — summary labels

### Phase 4: Polish
27. Add theme toggle in Settings (Protocol Mode / Standard Mode)
28. Update PWA manifest for Trained branding (name, theme_color, background_color)
29. Update meta tags and page title
30. Test all flows end-to-end with Trained theme active

---

## 6. DESIGN DO'S AND DON'TS

### DO
- Use uppercase sparingly but intentionally — headers, labels, buttons
- Keep generous whitespace — let the dark background breathe
- Use the red accent for interactive elements and progress only — not decorative
- Make numbers and stats feel like data displays (JetBrains Mono, slightly larger)
- Keep transitions subtle — 150ms ease, opacity and transform only
- Use 1px borders in `colorBorder` to create structure without heaviness
- Make the Weekly Reward Ritual feel ceremonial and earned

### DON'T
- No gradients (except subtle on progress bar fill)
- No rounded pill buttons or circular cards
- No bright/saturated colors anywhere — everything is muted and deep
- No playful animations, bounces, or confetti
- No emoji in the UI (the standing orders / messages can be text-only)
- No light mode (Trained is dark-only; GYG theme can have its own palette)
- No decorative icons or illustrations — functional icons only (Lucide icon set, stroke weight 1.5)
- No "gaming" visual language — no pixel art, no 8-bit fonts, no power-up imagery
- Don't make it look like a fetish site — it should pass as a premium fitness app to anyone who sees it on your phone

---

## 7. BUILD & DEPLOY NOTES

- Default build (`npm run build`) should produce the Trained version
- Environment variable `VITE_DEFAULT_THEME=gyg` produces the GYG version
- Both versions deploy to separate Vercel projects with separate domains
- Same codebase, same repo, two deploy targets
- PWA manifest values should be driven by the build theme (app name, colors)
- Access code system stays the same — separate code pools per product in Supabase

---

## 8. ACCEPTANCE CRITERIA

The build is done when:

- [ ] Theme system is implemented and switching works without errors
- [ ] Trained theme is visually complete — dark UI, correct colors, correct typography
- [ ] All hardcoded strings are replaced with theme-driven labels
- [ ] Onboarding flow reflects Trained copy when in Trained theme
- [ ] Standing Orders replace motivational messages in Trained theme
- [ ] Avatar stages show Trained names (Uninitiated → Unchained)
- [ ] Avatar classes show Trained names (Dom/me, Switch, Brat)
- [ ] Weekly Reward Ritual modal is styled with the ceremonial dark treatment
- [ ] Streak display uses square indicators with correct color states
- [ ] Coach dashboard uses Dom/me terminology in Trained theme
- [ ] Settings includes a theme toggle (Protocol Mode / Standard Mode)
- [ ] PWA manifest reflects Trained branding in default build
- [ ] No GYG-specific strings leak through in Trained mode
- [ ] App passes Lighthouse PWA audit
- [ ] All existing functionality still works (workouts, macros, XP, streaks, avatars, badges, check-ins, export/import)
