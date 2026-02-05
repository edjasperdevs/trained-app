---
phase: 01-foundation
plan: 02
subsystem: ui
tags: [design-tokens, color-audit, fontsource, self-hosted-fonts, motion-v12, framer-motion-migration, tailwindcss-v4]

# Dependency graph
requires:
  - phase: 01-foundation-01
    provides: "Tailwind v4 @theme token system with all design tokens defined"
provides:
  - "Zero hardcoded colors in component/screen files -- all flow through @theme tokens"
  - "Self-hosted variable fonts via Fontsource (Inter, Oswald, JetBrains Mono) -- no CDN dependency"
  - "motion v12 replacing framer-motion across all 29 component/screen files"
  - "Chart-specific CSS custom properties for SVG inline color values"
affects: [02-theme-removal, 03-component-primitives, 04-screen-refresh, 05-animation, 06-cleanup, 07-deploy]

# Tech tracking
tech-stack:
  added: ["@fontsource-variable/inter", "@fontsource-variable/oswald", "@fontsource-variable/jetbrains-mono", "motion@12"]
  removed: ["framer-motion"]
  patterns: ["CSS custom properties for SVG/chart colors that can't use Tailwind classes", "Semantic token class mapping (text-text-secondary, bg-surface, border-border, etc.)"]

key-files:
  created: []
  modified:
    - src/index.css
    - src/main.tsx
    - index.html
    - vite.config.ts
    - package.json
    - package-lock.json
    - src/components/Avatar.tsx
    - src/components/BadgeUnlockModal.tsx
    - src/components/Badges.tsx
    - src/components/Button.tsx
    - src/components/ClientActivityFeed.tsx
    - src/components/ClientMacroAdherence.tsx
    - src/components/FoodSearch.tsx
    - src/components/MealBuilder.tsx
    - src/components/WeightChart.tsx
    - src/screens/Achievements.tsx
    - src/screens/Auth.tsx
    - src/screens/AvatarScreen.tsx
    - src/screens/CheckInModal.tsx
    - src/screens/Macros.tsx
    - src/screens/Onboarding.tsx
    - src/screens/Settings.tsx
    - src/screens/XPClaimModal.tsx

key-decisions:
  - "Chart SVG colors use CSS custom properties (--chart-*) in :root, not Tailwind classes -- SVG stroke/fill attributes need direct color strings"
  - "Confetti hex arrays in BadgeUnlockModal/XPClaimModal left as JS constants -- they are theme-branched values passed to style objects, not Tailwind classes"
  - "Rarity color maps (RARITY_BG, RARITY_TEXT, RARITY_GLOW) migrated to semantic tokens (bg-warning, text-error, etc.)"
  - "Font family declarations include non-Variable fallbacks (e.g., 'Oswald Variable', 'Oswald', sans-serif)"
  - "motion v12 vendor chunk reduced from 115.26KB to 92.52KB gzipped"

patterns-established:
  - "Color token mapping: text-gray-400/500 -> text-text-secondary, text-gray-300 -> text-text-primary, text-white -> text-text-on-primary (on colored bg) or text-text-primary (on dark bg)"
  - "Glass token mapping: hover:bg-white/10 -> hover:bg-glass-light, bg-white/5 -> bg-glass-light"
  - "Status color mapping: text-red-400 -> text-error, text-green-400 -> text-success, text-yellow-400 -> text-warning, text-blue-400 -> text-info, text-purple-400 -> text-primary"
  - "Chart-specific CSS custom properties in :root block for SVG inline colors"
  - "Fontsource variable font imports in main.tsx before index.css import"

# Metrics
duration: ~25min
completed: 2026-02-05
---

# Phase 1 Plan 2: Hardcoded Color Audit, Font Self-Hosting, Motion v12 Summary

**67+ hardcoded colors replaced with semantic tokens across 19 files, fonts self-hosted via Fontsource (zero CDN), framer-motion migrated to motion v12 across 29 files**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-02-05T16:35:00Z (approx)
- **Completed:** 2026-02-05T17:01:20Z
- **Tasks:** 2/2
- **Files modified:** 41 (19 in Task 1 + 35 in Task 2, with overlap)

## Accomplishments
- Audited and replaced all 67+ hardcoded color values (text-gray-*, bg-black, text-white, border-gray-*, inline hex, inline rgba) with semantic design token classes across 19 component/screen files
- Created chart-specific CSS custom properties (--chart-goal, --chart-line-start, --chart-line-end, etc.) for WeightChart.tsx SVG colors that cannot use Tailwind utility classes
- Self-hosted Inter Variable, Oswald Variable, and JetBrains Mono Variable fonts via Fontsource -- eliminated all Google Fonts CDN dependency (3 link tags removed from index.html)
- Migrated all 29 files from framer-motion to motion v12 (import path from 'framer-motion' to 'motion/react')
- Reduced motion vendor chunk from 115.26KB to 92.52KB gzipped
- All 138 existing tests pass after changes

## Task Commits

Each task was committed atomically:

1. **Task 1: Audit and replace all hardcoded colors with token references** - `2d611d0b` (feat) -- 19 files changed, 318 insertions, 303 deletions
2. **Task 2: Self-host fonts via Fontsource and migrate framer-motion to motion v12** - `72ce5d61` (feat) -- 35 files changed, 145 insertions, 62 deletions

## Files Created/Modified

**Token system additions (src/index.css):**
- Added chart-specific CSS custom properties in `:root` block (--chart-goal, --chart-goal-alpha, --chart-goal-text, --chart-area-start, --chart-line-start, --chart-line-end, --chart-avg-stroke)
- Updated @theme font families to include "Variable" suffix with non-Variable fallbacks

**Entry point (src/main.tsx):**
- Added Fontsource variable font imports (inter, oswald, jetbrains-mono) before index.css
- Replaced ErrorFallback hardcoded colors (bg-[#0a0a0f], bg-[#00f5d4], text-black, text-white, text-gray-400) with token classes

**HTML (index.html):**
- Removed 3 Google Fonts tags (2 preconnect + 1 stylesheet link)

**Build config (vite.config.ts):**
- Updated vendor-motion manualChunks from ['framer-motion'] to ['motion']

**Components with color token migration:**
- `WeightChart.tsx` -- 10+ inline rgba/hex SVG colors replaced with CSS custom property references
- `BadgeUnlockModal.tsx` -- Rarity maps (RARITY_GLOW, RARITY_TEXT, RARITY_BG) migrated to token classes
- `FoodSearch.tsx` -- 34 insertions/deletions, gray-* and white replaced throughout
- `MealBuilder.tsx` -- 34 insertions/deletions, same pattern
- `Settings.tsx` -- 90 changes, largest single file (~50 color replacements)
- `Achievements.tsx` -- 50 changes, rarity maps fully migrated
- `Onboarding.tsx` -- 132 changes, character/icon color maps + validation colors
- `Auth.tsx` -- 32 changes, form styling colors
- `Macros.tsx` -- 118 changes, DailyView/MacroRing/MealsView/CalculatorView
- `Avatar.tsx`, `AvatarScreen.tsx`, `Button.tsx`, `Badges.tsx`, `ClientActivityFeed.tsx`, `ClientMacroAdherence.tsx`, `CheckInModal.tsx`, `XPClaimModal.tsx` -- smaller targeted replacements

**29 files with framer-motion -> motion/react import migration** (all component and screen files)

## Decisions Made

1. **Chart SVG colors via CSS custom properties:** WeightChart.tsx uses inline SVG attributes (stroke, fill, stopColor) that cannot accept Tailwind utility classes. Created dedicated --chart-* custom properties in :root that reference existing design tokens where possible (e.g., --chart-goal: var(--color-warning)) and use direct rgba values for chart-specific opacity variations.

2. **Confetti hex arrays preserved as JS constants:** BadgeUnlockModal.tsx and XPClaimModal.tsx have confetti particle color arrays that are already theme-branched (isTrained vs GYG). These are passed as JavaScript strings to style objects, not as Tailwind classes. Left as-is since they will be simplified when theme branching is removed in Phase 2.

3. **Semantic mapping choices:** Mapped text-white to text-text-on-primary when on colored backgrounds (buttons, badges) and to text-text-primary when on dark backgrounds. This distinction ensures correct contrast ratios are maintained.

4. **text-purple-400 mapped to text-primary:** Several components used purple for accent highlights. Since the Trained theme uses blood-red as its primary color, these purple references map to text-primary (which resolves to the red accent). Phase 2 theme removal will make this the only code path.

## Deviations from Plan

None - plan executed exactly as written. The 67 hardcoded color count from research was confirmed accurate (slightly exceeded due to additional inline rgba values found in WeightChart.tsx and rarity map entries).

## Issues Encountered

1. **WeightChart.tsx SVG inline colors:** Required a different approach than Tailwind class replacement. Solved by creating chart-specific CSS custom properties in :root that SVG attributes reference via var(). This pattern is documented for future chart work.

2. **Replace-all collisions:** Some files had color values already replaced by earlier edits in the same task (e.g., replacing text-white also caught hover:text-white instances, and border-gray-700 replacement covered border-gray-800 in files that only had the former). These caused harmless "string not found" errors on subsequent targeted edits -- no manual intervention needed.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- **Foundation complete:** All 6 FOUND-* requirements are satisfied
  - FOUND-01: Tailwind v4 with @theme directive (Plan 01)
  - FOUND-02: Premium border radius tokens (Plan 01)
  - FOUND-03: All hardcoded colors replaced with tokens (Plan 02)
  - FOUND-04: framer-motion replaced with motion v12 (Plan 02)
  - FOUND-05: Fonts self-hosted via Fontsource (Plan 02)
  - FOUND-06: cn() utility and CVA installed (Plan 01)
- **Ready for Phase 2 (Theme Removal):** Token system is the single source of truth, all components reference tokens, 394 isTrained ternaries are the next target
- **Legacy color aliases still present:** bg-bg-primary, text-accent-primary etc. in @theme -- these serve backward compatibility until Phase 6 cleanup
- **Confetti hex arrays:** Will simplify in Phase 2 when isTrained branching is removed

---
*Phase: 01-foundation*
*Completed: 2026-02-05*
