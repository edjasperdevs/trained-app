# CLAUDE.md — WellTrained App

This file is the standing brief for Claude Code. Read it fully before making any changes to this codebase. It defines the project identity, the design system, the data architecture, and the rules that govern every decision.

---

## Project Identity

**WellTrained** is a premium fitness and wellness app for men, gaymers, and those in the BDSM community. It uses RPG leveling theory and BDSM protocol language to help users achieve fitness goals. The app is built around the **Discipline System** — a framework from the owner's published book of the same name.

The tone is dominant but caring. It treats the user as capable. It does not hype, over-explain, or perform expertise. Every piece of UI copy should sound like a knowledgeable friend with standards: warm, direct, and structured.

**Words that belong:** protocol, orders, authority, structure, compliance, rank, discipline, forged, earned, devotion, obedience.

**Words that do not belong:** crush it, beast, grind, hustle, smash, amazing, awesome, journey.

---

## Current State of the Codebase

The Obsidian design system has been **partially implemented**. The following are already done and should not be reverted:

- `index.css` — Obsidian color tokens are live. True black background (`#0A0A0A`), warm gold primary (`#D4A853`), warm white foreground (`#F5F0E8`), deep charcoal cards (`#141414`). The lime green (`#C8FF00`) has been fully removed.
- `Navigation.tsx` — Four tabs are live: Home (`/`), Workout (`/workouts`), Fuel (`/macros`), Profile (`/avatar`). Settings is accessible from the Profile screen via a gear icon.
- `Home.tsx` — The DP-to-next-rank ring is implemented with the gold SVG arc and correct `dpToNext` / `progress` values from `useDPStore`. The XP system has been removed.
- `AvatarScreen.tsx` — "Your Champion" screen is implemented with mood badge, rank/DP/streak stat grid, rank evolution progress bar, and archetype card. Settings gear icon links to `/settings`.
- `dpStore.ts` — The XP system has been **fully removed and consolidated into DP**. There is no `xpStore` anymore. All progression is driven by DP alone.
- Avatar images — All five archetypes have five stage images each: `{archetype}_stage{1-5}.png` in `src/assets/avatars/`. The `EvolvingAvatar` component handles stage selection automatically based on rank.

**Work remaining** is detailed in the implementation order below.

---

## Design System — Obsidian

The full specification is in `welltrained_design_spec.md` in the project root. The summary below is for quick reference.

### Active Color Tokens (already in `index.css`)

| Token | Value | Role |
|---|---|---|
| `--background` | `#0A0A0A` | True black canvas |
| `--foreground` | `#F5F0E8` | Warm white text |
| `--card` | `#141414` | Deep charcoal card surface |
| `--popover` | `#1C1C1C` | Elevated surface |
| `--primary` | `#D4A853` | Warm gold — the signature accent |
| `--primary-foreground` | `#0A0A0A` | Black text on gold buttons |
| `--muted` | `#1C1C1C` | Recessive surface |
| `--muted-foreground` | `#8A8070` | Warm gray secondary text |
| `--destructive` | `#8B1A1A` | Deep crimson (Hades palette) |
| `--border` | `#2A2A2A` | Subtle charcoal border |
| `--ring` | `#D4A853` | Focus ring — matches primary |

### Extended Gold Tokens (in `@theme` block)

```css
--color-gold-bright: #D4A843;
--color-gold-muted: rgba(212, 168, 83, 0.15);
--color-gold-dim: #8B6914;
--color-amber-glow: rgba(212, 168, 83, 0.08);
--color-surface: #141414;
--color-surface-elevated: #1C1C1C;
```

Use `bg-surface`, `bg-surface-elevated`, `text-primary`, `border-primary/30`, `bg-primary/10` etc. via Tailwind. These are already wired.

### Typography

Three font families are installed and configured:

| Family | CSS Class | Use For |
|---|---|---|
| Oswald Variable | `font-heading` | Screen titles, section labels — always uppercase, `tracking-widest` |
| Inter Variable | `font-sans` (default) | Body text, labels, data values |
| JetBrains Mono Variable | `font-mono` | Timers, DP counts, numerical data |

### Elevation Model

No drop shadows. Depth is created through color:

- Background: `#0A0A0A`
- Card: `#141414` (`bg-surface`)
- Elevated card / modal: `#1C1C1C` (`bg-surface-elevated` or `bg-popover`)
- Active/selected: gold border (`border border-primary`) rather than a fill change

### Border Radius

`--radius` is `0.75rem`. Use `rounded-xl` for cards. Use `rounded-full` for pills and badges.

---

## Navigation (Already Implemented)

`src/components/Navigation.tsx` — four tabs, do not change:

| Tab | Label | Icon | Route |
|---|---|---|---|
| 1 | Home | `Home` | `/` |
| 2 | Workout | `Dumbbell` | `/workouts` |
| 3 | Fuel | `Flame` | `/macros` |
| 4 | Profile | `User` | `/avatar` |

Settings lives at `/settings` and is accessed via the gear icon in the Profile screen header. It is not a nav tab.

---

## The Progression System

### Discipline Points (DP) — The Only Progression Currency

XP has been removed. DP is the single currency that drives everything. It is earned through daily compliance actions and is cumulative — it never resets.

**Base DP values** (defined in `src/stores/dpStore.ts` as `DP_VALUES`):

| Action | Base DP |
|---|---|
| `training` | 50 |
| `protein` | 25 |
| `meal` | 15 (capped at 3 per day) |
| `steps` | 10 |
| `sleep` | 10 |

**Archetype modifiers** (defined in `src/design/constants.ts` as `ARCHETYPE_MODIFIERS`):

| Archetype | Modified Actions | Multiplier |
|---|---|---|
| Bro | None | 1.0× on all |
| Himbo | `training` | 1.5× → 75 DP |
| Brute | `meal`, `protein` | 1.5× → 22 / 37 DP |
| Pup | `steps`, `sleep` | 2.0× → 20 DP each |
| Bull | None yet | Deferred to v2.1 |

The `awardDP(action)` function in `dpStore` handles modifier application automatically by reading the user's archetype from `userStore`.

### Ranks (16 total — use these names verbatim everywhere)

Defined in `src/stores/dpStore.ts` as `RANKS`. Do not rename or reorder.

| Rank # | Name | DP Threshold |
|---|---|---|
| 0 | Uninitiated | 0 |
| 1 | Initiate | 250 |
| 2 | Compliant | 750 |
| 3 | Obedient | 1,500 |
| 4 | Disciplined | 2,250 |
| 5 | Conditioned | 3,000 |
| 6 | Proven | 3,750 |
| 7 | Hardened | 4,750 |
| 8 | Forged | 5,750 |
| 9 | Trusted | 6,750 |
| 10 | Enforcer | 7,750 |
| 11 | Seasoned | 9,000 |
| 12 | Elite | 10,250 |
| 13 | Apex | 11,500 |
| 14 | Sovereign | 13,000 |
| 15 | Master | 14,750 |

Use `useDPStore((s) => s.getRankInfo)()` to get `{ name, rank, dpForNext, progress }` — this is already wired and handles edge cases including max rank.

---

## Avatar System

### Architecture

The avatar is a **Hades-style illustrated warrior character** — the emotional center of the app. It appears on the Home screen and the Profile screen.

**Stage progression** — driven by rank, handled by `EvolvingAvatar` component:

| Stage | Ranks | Premium? |
|---|---|---|
| 1 | 0–3 | Free |
| 2 | 4–7 | Free |
| 3 | 8–11 | Premium |
| 4 | 12–14 | Premium |
| 5 | 15 | Premium |

Non-premium users see a `LockedAvatar` component for stages 3–5. Do not bypass this gate.

**Image files** are at `src/assets/avatars/{archetype}_stage{1-5}.png`. All five archetypes × five stages = 25 images are present. Import via `getAvatarImage(archetype, stage)` from `src/assets/avatars/index.ts`.

**Always use `<EvolvingAvatar />` component** — it handles stage calculation, premium gating, and image selection automatically. Do not manually import avatar images in screen components.

### Mood System

Five moods defined in `src/stores/avatarStore.ts` as `AvatarMood`:

| Mood | Trigger | Visual Treatment |
|---|---|---|
| `happy` | Logged in today, some compliance | Normal display |
| `hyped` | Workout logged / rank up / claim | Gold glow: `shadow-[0_0_20px_rgba(212,168,83,0.3)]` |
| `neutral` | No login today | Normal display |
| `sad` | Streak broken / missed day | Destructive color treatment |
| `neglected` | 3+ days without login | Dimmed, `text-gold-dim` treatment |

The mood badge is rendered in `AvatarScreen.tsx` using the `moodColors` map. The warm amber radial glow behind the avatar is a `bg-primary/15 blur-[120px]` div — keep this on both Home and Profile screens.

Use `useAvatarStore().triggerReaction(type)` to change mood:
- `'checkIn'` → happy
- `'levelUp'` or `'claim'` → hyped
- `'missedDay'` → sad

---

## Archetypes (5 total)

Defined in `src/design/constants.ts` as `ARCHETYPE_INFO`. The `baseCharacter` field in `avatarStore` is set to the user's archetype and drives which avatar image set is shown.

| Archetype | Tagline | Premium? | DP Bonus |
|---|---|---|---|
| `bro` | Balanced Discipline | No | None |
| `himbo` | Training Obsessed | Yes | +50% training DP |
| `brute` | Nutrition Machine | Yes | +50% protein/meal DP |
| `pup` | Lifestyle Master | Yes | +100% steps/sleep DP |
| `bull` | Consistency King | Yes | Coming v2.1 — show locked state |

**Bull archetype** is not yet implemented. Its card must be visible but non-selectable, with a "Coming Soon" treatment. Do not hide it.

---

## Key Screens — Current Status

### Home (`src/screens/Home.tsx`) — Partially Done
The DP ring, greeting, and tab structure are implemented. The screen uses a `<Tabs>` component with three content tabs: `today`, `health`, `stats`. Remaining work:
- The avatar is not yet displayed on the Home screen — it currently lives only in AvatarScreen. Consider adding a smaller avatar display or mood indicator to the Home screen header area.
- The "Protocol Compliance" section (macro progress bars) is wired and working.
- The `WeeklyReportModal` and `CheckInModal` are already integrated.

### Profile / Your Champion (`src/screens/AvatarScreen.tsx`) — Done
Full avatar, mood badge, rank/DP/streak stats, rank evolution bar, archetype card, settings gear. This screen is largely complete in the Obsidian style.

### Workouts (`src/screens/Workouts.tsx`) — Partially Done
The Obsidian styling has been applied per recent commits. The workout log, set tracking, and history are functional. The active workout screen has been **removed from scope** — do not add it back.

### Fuel / Macros (`src/screens/Macros.tsx`) — Needs Obsidian Polish
The macro tracking logic is complete. The screen has four tabs: `daily`, `log` (Meals), `meals` (Saved), and `calculator` (hidden for coach-set macros). Remaining work:
- Macro ring should use gold/amber family for all three arcs — not the default chart colors.
- Meal categories in the log tab should include `Pre-Workout` and `Post-Workout` alongside standard meals.
- Apply Obsidian card styling throughout.

### Daily Report / Check-In (`src/screens/CheckInModal.tsx`) — Needs Obsidian Polish
The check-in logic is complete — it awards DP for training and protein compliance. The modal currently has two checkboxes: workout and protein. Remaining work:
- Apply Obsidian card styling with gold toggle/checkbox treatment.
- Show the DP amount each action will award (accounting for archetype modifier) as a gold badge next to each item.
- The "Today: +X DP earned" summary line should be prominent in gold.

### Achievements / Trophy Room (`src/screens/Achievements.tsx`) — Needs Obsidian Polish
The hexagonal badge grid is implemented with earned/locked states. Remaining work:
- Add the large gold trophy illustration above the badge grid.
- Ensure earned badges have the gold glow (`drop-shadow-[0_0_12px_rgba(212,168,83,0.4)]`).
- The screen title should be "TROPHY ROOM" in Oswald uppercase.

### Onboarding (`src/screens/Onboarding.tsx`) — Needs Obsidian Polish
Five steps: `welcome`, `profile`, `archetype`, `macros`, `initiate`. The welcome step uses `hero-welcome.png`. Remaining work:
- The welcome step should feel cinematic — full-bleed hero image, "BEGIN PROTOCOL" CTA, step indicator dots.
- The archetype selection step should use the Obsidian archetype card design with premium badges and Bull's "Coming Soon" state.
- The `initiate` step (final confirmation) should feel like a ceremony, not a form.

### Rank-Up Modal (`src/components/RankUpModal.tsx`) — Needs Obsidian Polish
The modal is implemented with confetti, the `EvolvingAvatar`, and a "Claim Your Rank" button. Remaining work:
- The rank name should display in massive Oswald display type in gold.
- The previous rank → new rank transition pills should be styled per the mock-up.
- The background should be true black with gold particle effects (the `Confetti` component handles particles — ensure it uses gold colors).

### Weekly Report Modal (`src/screens/WeeklyReportModal.tsx`) — Needs Obsidian Polish
Shows a 7-day DP breakdown by action type. Apply Obsidian card styling.

---

## Implementation Order

Work in this sequence. Each step is independent unless noted.

1. **Fuel/Macros screen** — Obsidian polish: gold macro ring arcs, Pre/Post-Workout meal categories, card styling.
2. **Check-In Modal** — Obsidian polish: gold toggle treatment, DP badge per action, archetype-aware DP preview, summary line.
3. **Achievements/Trophy Room** — Add gold trophy illustration, polish badge grid glow states, update screen title.
4. **Rank-Up Modal** — Polish: massive gold rank name, transition pills, ensure Confetti uses gold.
5. **Onboarding** — Polish welcome step (cinematic), archetype step (premium badges, Bull locked), initiate step (ceremonial).
6. **Weekly Report Modal** — Obsidian card styling throughout.
7. **Home screen avatar** — Evaluate adding a mood-aware avatar element to the Home screen (small display or mood indicator in the header).

---

## Technical Rules

**Do not touch the stores unless fixing a bug.** `dpStore`, `avatarStore`, `workoutStore`, `macroStore`, `achievementsStore` are the source of truth. Visual work reads from stores, does not redefine them.

**XP is gone.** There is no `xpStore`. Do not reference XP, levels, or weekly claims anywhere in the UI. All progression language uses DP and Rank.

**No active workout screen.** This feature has been removed from scope. Do not add it back.

**`EvolvingAvatar` is the only way to render the avatar.** Do not import avatar images directly in screen components. The component handles stage, premium gating, and archetype automatically.

**Framer Motion is already installed — use it.** All animation variants are pre-defined in `src/lib/animations.ts`. Use `springs.smooth`, `springs.gentle`, `springs.bouncy` for transitions. Use `pageVariants` for screen entrances. Use `modalVariants` for modals. Keep animations weighty and deliberate — not bouncy or fast.

**Haptics are wired.** Use `haptics.light()` for nav taps, `haptics.medium()` for completing compliance actions, `haptics.heavy()` for rank-up moments, `haptics.success()` for claiming rewards.

**Test suite is live.** Run `pnpm test:run` after any store changes. Tests exist for `dpStore`, `macroStore`, `workoutStore`, and date utilities.

**RevenueCat gates premium content.** Always check `useSubscriptionStore((s) => s.isPremium)` before rendering premium-only features (archetype stages 3–5, premium archetypes). The `EvolvingAvatar` component already handles this for avatar stages.

**Supabase is the backend.** Auth, profiles, and coach data sync through `src/lib/sync.ts`. Do not bypass the sync layer.

**The app is always dark.** No light mode. No theme toggle. `:root` in `index.css` defines dark values directly.

**Capacitor is the native layer.** Build to iOS via `pnpm build:ios && pnpm cap:sync`. Use `isNative()` from `src/lib/platform.ts` before calling Capacitor APIs.

---

## Terminology Reference

| Concept | Correct Label | Do Not Use |
|---|---|---|
| Discipline Points | DP | XP, coins, points, experience |
| Rank progression | Rank | Level (XP/level system is removed) |
| Daily compliance log | Daily Report | Check-in, diary, log |
| Achievement badges | Marks of Devotion | Badges, trophies, achievements |
| Daily tasks | Daily Assignments | Quests, missions, tasks |
| Streak saver | Safe Word | Streak freeze, shield |
| Nutrition tab | Fuel | Macros, Nutrition, Diet |
| Character screen | Your Champion | Avatar, Profile, Character |
| Motivational messages | Standing Orders | Tips, motivation, quotes |
| Macro adherence section | Protocol Compliance | Nutrition tracking, diet log |
| Quick workout | Quick Workout | Minimal workout (internal only) |
| Streak recovery | Streak Recovery | Never miss twice (internal only) |

---

## Mock-Up Reference Files

All mock-up images are in `design_research/` (shared with this project). Reference them when implementing each screen.

| Screen | Mock-Up File |
|---|---|
| Splash | `welltrained_splash_final.png` |
| Onboarding | `screen_onboarding.png` |
| Home / Dashboard | `welltrained_dashboard_v2.png` |
| Daily Report | `screen_weekly_checkin.png` |
| Workout Log | `screen_workout_log.png` |
| Fuel / Macros | `welltrained_macros.png` |
| Log a Meal | `welltrained_food_log.png` |
| Progress | `screen_progress.png` |
| Trophy Room | `screen_trophy_room.png` |
| Profile / Your Champion | `screen_profile.png` |
| Archetype Selection | `welltrained_archetype_screen.png` |
| Rank-Up Modal | `screen_rankup_modal.png` |
| App Icon | `app_icon_final.png` |

The full design specification is in `welltrained_design_spec.md`. When in doubt about a design decision, that document is the authority.
