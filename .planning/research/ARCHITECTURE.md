# Architecture: Design System Refresh

**Domain:** Removing dual-theme system, implementing single premium design in React + Tailwind
**Researched:** 2026-02-05
**Confidence:** HIGH (based on direct codebase analysis, not external sources)

---

## Current Architecture (What Exists)

### Layer Diagram

```
                    +-------------------+
                    |    App.tsx        |
                    |  <ThemeProvider>  |
                    +--------+----------+
                             |
            +----------------+------------------+
            |                                   |
     +------+------+                    +-------+-------+
     |   Screens   |                    |  Components   |
     | (10 files)  |                    |  (13 files)   |
     | useTheme()  |                    |  useTheme()   |
     | isTrained?  |                    |  isTrained?   |
     +------+------+                    +-------+-------+
            |                                   |
            +----------------+------------------+
                             |
        +--------------------+----------------------+
        |                    |                      |
  +-----+-----+     +-------+-------+    +---------+---------+
  | CSS Vars  |     | Theme Object  |    | isTrained Branch  |
  | (tokens)  |     | (labels,      |    | (394 occurrences  |
  | Tailwind  |     |  stages,      |    |  across 21 files) |
  | classes   |     |  orders)      |    |                   |
  +-----------+     +---------------+    +-------------------+
```

### Three Consumption Patterns

The theme system is consumed in three distinct ways. Each requires a different migration strategy.

**Pattern 1: CSS Variables / Tailwind tokens (LOW risk)**
- `:root` CSS variables in `index.css` define color, typography, spacing, shadow tokens
- `tailwind.config.js` maps these to Tailwind utility classes (`bg-surface`, `text-primary`, etc.)
- `ThemeProvider.injectCSSVariables()` overwrites `:root` vars at runtime based on active theme
- Components use Tailwind classes like `bg-surface`, `text-text-primary`, `rounded-card`
- **Migration:** Collapse to static values. Remove runtime injection. Keep CSS variables but make them the single source of truth.

**Pattern 2: Theme object properties (MEDIUM risk)**
- `theme.labels.*` -- 18 string labels (e.g., "DP" vs "XP", "Dom/me" vs "Coach")
- `theme.avatarStages` -- 13 stage name strings
- `theme.standingOrders` -- 4 categories of motivational text
- Used via `const { theme } = useTheme()` then `theme.labels.xp`, etc.
- **Migration:** Inline the Trained values directly. Replace `theme.labels.xp` with `"DP"`. The labels are the Trained identity -- they stay, just no longer need indirection.

**Pattern 3: `isTrained` conditional branching (HIGH risk, HIGH volume)**
- **394 occurrences across 21 files**
- `const isTrained = themeId === 'trained'` then ternary everywhere
- Controls: border radius, font-family, text-transform, letter-spacing, copy text, layout choices, animation presence, icon selection, color variants
- Examples from `Button.tsx`:
  - `isTrained ? 'rounded' : 'rounded-xl'`
  - `isTrained ? 'font-heading uppercase tracking-widest' : 'font-bold'`
- Examples from `Home.tsx`:
  - `isTrained ? 'Daily Report Pending' : 'Daily Check-in'`
  - `isTrained ? 'Recovery Day' : 'Rest Day'`
- **Migration:** Resolve every ternary to the Trained branch. Delete the GYG branch. This is the bulk of the work.

### File-by-File Impact Assessment

| File | `isTrained` count | `theme.*` usage | Risk | Notes |
|------|-------------------|-----------------|------|-------|
| `Onboarding.tsx` | 63 | labels, stages | HIGH | Heaviest file. 8 sub-components each with own `useTheme()`. |
| `Home.tsx` | 45 | labels, orders | HIGH | Core screen. Heavy label + branch usage. |
| `Settings.tsx` | 38 | labels | HIGH | Theme toggle UI must be removed. Coach labels. |
| `XPClaimModal.tsx` | 38 | labels | HIGH | Multi-step modal with confetti/animation branching. |
| `AvatarScreen.tsx` | 33 | labels, stages | HIGH | Deep theme integration. |
| `AccessGate.tsx` | 32 | -- | MEDIUM | Entry screen. Lots of copy differences. |
| `CheckInModal.tsx` | 23 | labels | MEDIUM | Multi-step. Passes `isTrained` as prop to children. |
| `Badges.tsx` | 21 | labels | MEDIUM | 4 sub-components. Rarity styling branches. |
| `BadgeUnlockModal.tsx` | 18 | labels | MEDIUM | Animation branching (confetti count, rotation). |
| `Workouts.tsx` | 14 | labels | MEDIUM | Workout vs Training copy. |
| `StreakDisplay.tsx` | 13 | -- | LOW | Mostly border-radius + copy differences. |
| `WeeklySummary.tsx` | 11 | labels | LOW | Summary vs Sprint copy. |
| `Avatar.tsx` | 8 | stages | LOW | Mood animation branching. |
| `XPDisplay.tsx` | 6 | labels | LOW | Small, focused. |
| `Toast.tsx` | 6 | -- | LOW | Position + border-radius. |
| `Button.tsx` | 4 | -- | LOW | Variant styling. Core primitive. |
| `ProgressBar.tsx` | 3 | -- | LOW | Color + border-radius. |
| `Card.tsx` | 3 | -- | LOW | Glass vs solid variant. |
| `Navigation.tsx` | 3 | -- | LOW | Minor styling. |
| `ReminderCard.tsx` | 4 | -- | LOW | Border-radius + animation. |
| `Achievements.tsx` | 8 | labels | LOW | Tab labels + minor styling. |

### Files NOT Using Theme (Already Clean)

These screens and components need no theme removal -- only visual refresh:

- `Macros.tsx` -- no theme usage
- `Auth.tsx` -- no theme usage
- `Coach.tsx` -- no theme usage
- `Skeleton.tsx` -- no theme usage
- `EmptyState.tsx` -- no theme usage
- `ErrorBoundary.tsx` -- no theme usage
- `UpdatePrompt.tsx` -- no theme usage
- `NotFound.tsx` -- no theme usage
- `FoodSearch.tsx` -- no theme usage
- `MealBuilder.tsx` -- no theme usage
- `WeightChart.tsx` -- no theme usage
- `ClientMacroAdherence.tsx` -- no theme usage
- `ClientActivityFeed.tsx` -- no theme usage
- `SyncStatusIndicator.tsx` -- no theme usage

---

## Recommended Architecture (What to Build)

### Target State

```
                    +-------------------+
                    |    App.tsx        |
                    | (no ThemeProvider)|
                    +--------+----------+
                             |
            +----------------+------------------+
            |                                   |
     +------+------+                    +-------+-------+
     |   Screens   |                    |  Components   |
     | Direct      |                    |  Direct       |
     | Tailwind    |                    |  Tailwind     |
     | classes     |                    |  classes      |
     +------+------+                    +-------+-------+
            |                                   |
            +----------------+------------------+
                             |
              +--------------+---------------+
              |                              |
       +------+------+            +---------+---------+
       | CSS Vars    |            | Design Constants  |
       | in :root    |            | (labels, stages,  |
       | (tokens =   |            |  orders)          |
       | single      |            | Plain TS exports  |
       | source)     |            +---------+---------+
       +------+------+
              |
       +------+------+
       | Tailwind    |
       | config      |
       | (references |
       |  CSS vars)  |
       +-------------+
```

### Component Boundaries After Migration

**Layer 1: Design Tokens (CSS Variables)**
- Single source of truth: `src/index.css` `:root` block
- Contains all color, typography, spacing, shadow values
- Tailwind config references these via `var(--token-name)`
- No runtime injection. No ThemeProvider. Static values.

**Layer 2: Design Constants (TypeScript)**
- New file: `src/design/constants.ts` (or inline where used)
- Contains the Trained-specific labels, avatar stages, standing orders
- Plain exports, no React context needed
- Example: `export const LABELS = { xp: 'DP', xpFull: 'Discipline Points', ... }`
- Example: `export const AVATAR_STAGES = ['Uninitiated', 'Novice', ...]`

**Layer 3: Primitive Components**
- `Button`, `Card`, `ProgressBar`, `Toast` -- no theme branching
- Single styling path. Tailwind classes only.
- These become the "design system primitives" that all screens use.

**Layer 4: Composite Components**
- `Avatar`, `XPDisplay`, `StreakDisplay`, `Badges`, `WeeklySummary`, `BadgeUnlockModal`, `ReminderCard`, `Navigation`
- Import constants directly, no `useTheme()`
- Single visual path.

**Layer 5: Screens**
- All 13 screens use primitives + composites
- Import constants where labels/stages/orders are needed
- No conditional branching based on theme identity.

---

## Migration Strategy: Incremental, Bottom-Up

### Why NOT Big-Bang

A big-bang rewrite (change everything at once) is tempting because it's "one PR." But it's wrong here because:

1. **394 isTrained branches** means 394 decisions about which branch to keep. Each is a potential regression.
2. **No automated visual testing** -- you can't catch visual regressions without manually checking each screen.
3. **One broken import** from removing the theme system crashes the entire app.
4. **Can't ship partial progress** -- if you get 80% done and hit a problem, you have zero shippable state.

### Why Incremental Bottom-Up

1. **Each step is shippable** -- the app works after every phase.
2. **CSS variables already exist** -- Tailwind already references them. The token layer can stay unchanged initially.
3. **Bottom-up means primitives first** -- `Button`, `Card`, `ProgressBar` have only 3-4 `isTrained` branches each. Quick wins that prove the pattern.
4. **The ThemeProvider can stay until the very end** -- as long as it returns `trained` theme, all code works. Remove it last.

### Build Order

```
Phase 1: FOUNDATION (tokens + primitives)
  |
  |-- Step 1a: Lock theme to "trained" (prevent switching)
  |-- Step 1b: Hardcode new design tokens in :root
  |-- Step 1c: De-branch primitive components (Button, Card, ProgressBar, Toast)
  |
Phase 2: COMPOSITE COMPONENTS
  |
  |-- Step 2a: De-branch Avatar, Navigation, StreakDisplay
  |-- Step 2b: De-branch XPDisplay, ReminderCard, WeeklySummary
  |-- Step 2c: De-branch Badges, BadgeUnlockModal
  |
Phase 3: SCREENS (order by complexity, LOW to HIGH)
  |
  |-- Step 3a: Achievements, Workouts (8-14 branches each)
  |-- Step 3b: AccessGate, CheckInModal (23-32 branches)
  |-- Step 3c: XPClaimModal, AvatarScreen, Settings (33-38 branches)
  |-- Step 3d: Home, Onboarding (45-63 branches -- the big ones)
  |
Phase 4: REMOVE THEME INFRASTRUCTURE
  |
  |-- Step 4a: Replace useTheme() with direct constant imports
  |-- Step 4b: Remove ThemeProvider from App.tsx
  |-- Step 4c: Delete src/themes/ directory entirely
  |-- Step 4d: Delete gyg.ts, remove theme toggle from Settings
  |-- Step 4e: Clean up: remove THEME_STORAGE_KEY from localStorage, body class logic
  |-- Step 4f: Remove legacy Tailwind color mappings (bg.primary, accent.*, glass.*)
```

### Critical Ordering Rationale

**Why tokens first:** Everything downstream depends on the token values. If you change a component's styling but the tokens are still the old values, you can't see the real result.

**Why primitives before composites:** Composites use primitives. If `Card` still has `isTrained` branching when you're refreshing `Badges` (which uses `Card`), you'll fight two layers of branching at once.

**Why screens last:** Screens are the most complex and most likely to have regressions. By the time you get to screens, the components they use are already clean.

**Why infrastructure removal at the very end:** The `useTheme()` hook is a harmless no-op when there's only one theme. Removing it too early means you have to fix every import simultaneously. Leave it as a compatibility layer until all consumers are migrated, then do a clean sweep.

---

## Detailed Migration Steps

### Step 1a: Lock to Trained Theme

**What:** Ensure the app always uses the Trained theme. Make theme switching impossible.

**How:**
- In `Settings.tsx`: Remove the theme toggle UI section
- In `ThemeProvider`: Hardcode `trained` as the only theme, or just remove `toggleTheme`/`setTheme` functionality
- Delete `localStorage.getItem(THEME_STORAGE_KEY)` logic
- Remove the `VITE_DEFAULT_THEME` env var check

**Why first:** This is the safety net. Once the theme is locked, you can't accidentally switch to GYG and see broken styling during migration. Everything renders as Trained. You can make changes to components knowing they'll always render in Trained mode.

**Risk:** VERY LOW. The app already defaults to Trained.

### Step 1b: Refresh Design Tokens

**What:** Update the CSS variable values in `:root` to the new premium palette.

**Where:** `src/index.css` `:root` block + `src/themes/trained.ts` (keep in sync until infrastructure is removed)

**What changes:**
- Colors: new premium palette (Equinox-inspired)
- Typography: potentially new font stack
- Spacing: adjust border-radius, spacing-unit if needed
- Shadows: refine for premium feel

**Why here:** Every component immediately reflects the new tokens through Tailwind utilities. One change, app-wide effect. This is the highest-leverage step.

**Risk:** MEDIUM. Color contrast regressions possible. Must verify WCAG AA compliance.

### Step 1c: De-branch Primitive Components

**What:** Remove `isTrained` branching from `Button.tsx`, `Card.tsx`, `ProgressBar.tsx`, `Toast.tsx`.

**Total branches to resolve:** ~16 across 4 files.

**Pattern for each branch:**
```typescript
// BEFORE
const borderRadius = isTrained ? 'rounded' : 'rounded-xl'

// AFTER (keep Trained branch, or redesign)
const borderRadius = 'rounded'  // or whatever the new design specifies
```

**Then remove:** `const { themeId } = useTheme()` and `const isTrained = themeId === 'trained'` from each file.

**Risk:** LOW. Small files, few branches, highly testable.

### Steps 2a-2c: De-branch Composite Components

**Same pattern as primitives but more branches.** Work through each component:

1. Resolve every `isTrained` ternary to the Trained value (or the new design value)
2. Replace `theme.labels.*` with direct string values
3. Replace `theme.avatarStages` with direct array reference
4. Remove `useTheme()` import and call

**Order within composites:** Start with the ones that don't depend on other composites:
- `Navigation` (3 branches, standalone)
- `StreakDisplay` (13 branches, standalone)
- `Avatar` (8 branches, standalone)
- Then `XPDisplay`, `ReminderCard`, `WeeklySummary`
- Then `Badges`, `BadgeUnlockModal` (these are more complex)

### Steps 3a-3d: De-branch Screens

**Same pattern but at screen scale.** Each screen will:

1. Resolve all `isTrained` ternaries
2. Replace all `theme.labels.*` / `theme.avatarStages` / `theme.standingOrders` references
3. Remove `useTheme()` import and call
4. Visual refresh: apply new design language to layout, spacing, typography

**Order matters:** Do simpler screens first to build confidence and establish the visual language. Then tackle the complex ones (Onboarding with 63 branches, Home with 45).

### Step 4: Remove Infrastructure

**Only after every consumer is migrated:**

1. Remove `ThemeProvider` wrapper from `App.tsx`
2. Delete `src/themes/index.ts`, `src/themes/types.ts`, `src/themes/gyg.ts`, `src/themes/trained.ts`
3. Move any retained constants (labels, stages, orders) to `src/design/constants.ts`
4. Remove `injectCSSVariables()` -- tokens are now purely in `:root`
5. Clean `tailwind.config.js` -- remove legacy `bg.*`, `accent.*`, `glass.*` color mappings
6. Remove `theme-trained` body class from `index.css`
7. Clear `app-theme` key from localStorage (migration cleanup)
8. Remove test utils `ThemeProvider` wrapper (`src/test/utils.tsx`)

---

## Risk Areas

### Highest Risk: Onboarding.tsx (63 branches)

This file has 8 sub-components, each with its own `useTheme()` call. It's the most complex file in the migration. Sub-components: Welcome, NameStep, GenderStep, BodyStatsStep, FitnessLevelStep, TrainingDaysStep, GoalStep, FeaturesStep, DPExplainStep, AvatarClassStep, AvatarReveal.

**Mitigation:** Migrate each sub-component individually within the file. Test each onboarding step after changes.

### Moderate Risk: Copy Changes

Many `isTrained` branches change user-facing text:
- "Recovery Day" vs "Rest Day"
- "Report Submitted" vs "Build deployed"
- "Claim Reward" vs "Deploy"
- "Dom/me" vs "Coach"

When resolving to the Trained branch, verify the copy still makes sense in context. Some Trained copy references the BDSM theme metaphor heavily -- the design refresh may want to refine some of this language.

**Mitigation:** Create a copy review pass after de-branching. Flag any copy that feels off in the new premium context.

### Moderate Risk: Animation Differences

GYG theme has more exuberant animations (bouncy scales, rotations, particle counts). Trained theme has more restrained animations. When de-branching, you're keeping the Trained (restrained) animations -- verify they still feel premium, not empty.

Examples:
- Confetti count: `isTrained ? 25 : 50` (Trained uses fewer)
- Scale animations: `isTrained ? undefined : { scale: [1, 1.2, 1] }` (Trained often has NONE)
- Rotation: `isTrained ? 0 : -180` (Trained has no rotation)

**Mitigation:** Animation refinement should happen AFTER de-branching, not during. First remove branches, then review motion design holistically.

### Low Risk: CSS Variable Duplication

Currently tokens exist in TWO places: `src/index.css` `:root` AND `src/themes/trained.ts`. The ThemeProvider overwrites `:root` at runtime. During migration, these must stay in sync. After infrastructure removal, only `:root` remains.

**Mitigation:** Update both files in lockstep during token refresh. Delete the TS version when ThemeProvider is removed.

### Low Risk: Test Utils

`src/test/utils.tsx` wraps test renders in `<ThemeProvider>`. This must be updated when ThemeProvider is removed.

---

## What NOT to Do

### Anti-Pattern: New Abstraction Layer

Do NOT replace the old theme system with a new abstraction. No `DesignSystemProvider`, no `useDesignSystem()` hook, no `design.tokens.colorPrimary`. The whole point is to remove indirection. CSS variables + Tailwind classes + plain TS constants is the right level of abstraction.

### Anti-Pattern: Gradual Feature Flags

Do NOT implement a "new design" / "old design" toggle. This recreates the dual-theme problem. The migration is directional -- old code gets replaced, not wrapped.

### Anti-Pattern: Component-by-Component Visual Refresh Mixed with De-branching

Do NOT try to refresh the visual design of a component at the same time you de-branch it. These are separate concerns:
1. De-branching = removing `isTrained` ternaries, keeping Trained values
2. Visual refresh = changing the actual design (colors, spacing, typography, layout)

Mixing them makes it impossible to tell if a visual regression is from de-branching (bug) or from intentional design changes.

**Recommended approach:** De-branch first (resolve to Trained values), then do visual refresh (apply new premium design). These can happen in the same phase but should be separate commits.

### Anti-Pattern: Deleting Theme Files First

Do NOT delete `src/themes/` before migrating all consumers. This creates a wall of import errors that must all be fixed simultaneously. Leave the infrastructure as a compatibility layer and remove it last.

---

## Sources

All findings are from direct codebase analysis:
- `src/themes/index.ts` -- ThemeProvider, useTheme, injectCSSVariables
- `src/themes/types.ts` -- DesignTokens, AppTheme, ThemeLabels interfaces
- `src/themes/trained.ts` -- Trained theme values (the ones to keep)
- `src/themes/gyg.ts` -- GYG theme values (being removed)
- `src/index.css` -- `:root` CSS variables, utility classes, theme-specific selectors
- `tailwind.config.js` -- CSS variable -> Tailwind mapping
- `src/App.tsx` -- ThemeProvider wrapper location
- `src/test/utils.tsx` -- ThemeProvider in test harness
- `grep -r "isTrained"` -- 394 occurrences across 21 files
- `grep -r "useTheme"` -- 22 files importing the hook
