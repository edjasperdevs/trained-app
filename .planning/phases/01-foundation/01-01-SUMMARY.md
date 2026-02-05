---
phase: 01-foundation
plan: 01
subsystem: ui
tags: [tailwindcss-v4, design-tokens, css-variables, vite, cva, tailwind-merge, clsx]

# Dependency graph
requires: []
provides:
  - "Tailwind v4 with @theme directive as single source of truth for design tokens"
  - "cn() utility combining clsx + tailwind-merge at src/lib/cn.ts"
  - "CVA (class-variance-authority) installed and importable"
  - "Premium border radius tokens (12-16px per FOUND-02)"
  - "Legacy color aliases preserved for backward compatibility"
  - "@tailwindcss/vite plugin replacing PostCSS pipeline"
affects: [01-foundation-02, 02-theme-removal, 03-component-primitives, 04-visual-refresh, 05-animation, 06-hardcoded-audit, 07-deploy]

# Tech tracking
tech-stack:
  added: [tailwindcss@4.1.18, @tailwindcss/vite@4.1.18, tailwind-merge@3.4.0, clsx@2.1.1, class-variance-authority@0.7.1]
  patterns: ["@theme directive for token definition", "cn() utility for class merging", "@utility directive for custom animation classes"]

key-files:
  created:
    - src/lib/cn.ts
  modified:
    - src/index.css
    - vite.config.ts
    - package.json
    - package-lock.json
  deleted:
    - tailwind.config.js
    - postcss.config.js

key-decisions:
  - "Legacy color aliases (bg-bg-*, text-accent-*, etc.) preserved in @theme for backward compat -- 277+ usages across 20+ files"
  - "float and xp-pop keyframes kept outside @theme via @utility blocks -- still referenced by components, will be removed in Phase 5"
  - "Google Fonts runtime caching removed from workbox config -- Plan 02 will self-host fonts"
  - "Bare rounded maps to --radius: 4px -- matches existing v3 DEFAULT value"
  - "tailwindcss installed as devDependency (build-time only)"

patterns-established:
  - "Single source of truth: all design tokens in src/index.css @theme block"
  - "cn() utility at src/lib/cn.ts -- import directly, not via barrel"
  - "@utility directive for custom animation classes outside @theme"

# Metrics
duration: 7min
completed: 2026-02-05
---

# Phase 1 Plan 1: Tailwind v4 Migration Summary

**Tailwind v4 with @theme token system, cn() utility, CVA + tailwind-merge installed -- all 325+ existing utility classes resolve correctly**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-05T16:37:49Z
- **Completed:** 2026-02-05T16:44:31Z
- **Tasks:** 2/2
- **Files modified:** 8 (6 modified/deleted + 1 created + package-lock.json)

## Accomplishments
- Migrated from Tailwind v3 (PostCSS-based) to v4 (@tailwindcss/vite plugin)
- Defined all design tokens in @theme block replacing :root + tailwind.config.js
- Preserved 277+ legacy color alias usages (bg-bg-primary, text-accent-primary, etc.)
- Created cn() utility (clsx + tailwind-merge) for Phase 3 component work
- Installed CVA for variant-based component patterns
- Updated border radius tokens to premium values (12-16px per FOUND-02)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install packages, configure Vite, migrate to Tailwind v4 @theme** - `a10c90ea` (feat)
2. **Task 2: Create cn() utility and verify CVA imports** - `638117f8` (feat)

## Files Created/Modified
- `src/index.css` - Complete rewrite: @import "tailwindcss" + @theme block with all design tokens
- `vite.config.ts` - Added @tailwindcss/vite plugin, removed Google Fonts workbox caching
- `src/lib/cn.ts` - New: cn() utility combining clsx + tailwind-merge
- `src/components/Button.tsx` - Added TODO breadcrumb for Phase 3
- `package.json` - Added tailwind-merge, clsx, CVA; upgraded tailwindcss to v4; removed autoprefixer, postcss
- `tailwind.config.js` - DELETED (replaced by @theme)
- `postcss.config.js` - DELETED (replaced by @tailwindcss/vite)

## Decisions Made
1. **Legacy aliases in @theme:** The codebase has 277+ usages of legacy color aliases (bg-bg-primary, text-accent-primary, bg-accent-success, etc.) across 20+ files. Rather than touch component files (out of scope for this plan), added corresponding --color-bg-*, --color-accent-* tokens to @theme so these classes continue to resolve. These will be cleaned up during the hardcoded color audit phase.

2. **float/xp-pop keyframes via @utility:** These keyframes are not used by any current component but were defined in the old tailwind.config.js. Kept them outside @theme using @utility directives to avoid breaking anything if they get referenced. Will be formally removed in Phase 5 (Animation Refinement).

3. **Bare rounded default:** Set --radius: 4px to match the v3 DEFAULT. Many components use bare `rounded` class (50+ instances). The premium border radius (12-16px) applies to --radius-lg, --radius-xl, --radius-card -- components will pick up premium radii when migrated in Phase 3/4.

4. **shadow-glow-intense added:** New token --shadow-glow-intense for the premium aesthetic. Not in v3 config but called for in FOUND-02 design spec.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - clean migration with zero build errors.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Token system is live and working -- all subsequent phases can reference @theme tokens
- cn() utility ready for Phase 3 component primitives
- CVA installed for variant-based component patterns
- ThemeProvider still active (harmlessly overwrites identical values) -- Phase 2 will remove it
- Legacy color aliases preserved -- Phase 6 (hardcoded audit) will clean these up
- Google Fonts workbox caching removed -- Plan 02 (Typography) will self-host fonts

---
*Phase: 01-foundation*
*Completed: 2026-02-05*
