---
phase: "02"
plan: "03"
subsystem: themes
tags: [theme-removal, cleanup, localStorage-migration, ThemeProvider]

dependency-graph:
  requires: ["02-01", "02-02"]
  provides:
    - "ThemeProvider removed from App.tsx"
    - "useTheme hook deleted"
    - "GYG theme file deleted"
    - "All theme infrastructure deleted (types, trained, gyg, index gutted)"
    - "localStorage migration for 'app-theme' key"
    - "Phase 2 complete: zero isTrained/useTheme/themeId in codebase"
  affects: ["03-01", "06-01"]

tech-stack:
  added: []
  patterns:
    - "localStorage migration runs in main.tsx before React mount (sync, no flash)"
    - "CSS heading/button styles are global (no .theme-* class scoping)"

file-tracking:
  key-files:
    modified:
      - src/main.tsx
      - src/App.tsx
      - src/test/utils.tsx
      - src/index.css
    deleted:
      - src/themes/gyg.ts
      - src/themes/trained.ts
      - src/themes/types.ts
    gutted:
      - src/themes/index.ts

decisions:
  - id: "02-03-01"
    decision: ".theme-trained CSS selectors converted to global selectors (h1/h2/h3, .btn-primary)"
    rationale: "Trained is the only theme -- scoping to body class is unnecessary"
  - id: "02-03-02"
    decision: "src/themes/index.ts kept as tombstone comment rather than deleted"
    rationale: "Prevents accidental re-creation; documents where constants moved to"

patterns-established:
  - "No theme context in app -- components import constants directly from @/design/constants"
  - "Test utils wrap only with BrowserRouter (no ThemeProvider)"

metrics:
  duration: "~4min"
  completed: "2026-02-05"
---

# Phase 02 Plan 03: Theme Infrastructure Deletion Summary

**Deleted ThemeProvider, useTheme, GYG theme, and all theme types; added localStorage migration for 'app-theme' key; Phase 2 complete with zero theme references remaining**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-02-05T19:10:14Z
- **Completed:** 2026-02-05T19:14:13Z
- **Tasks:** 2
- **Files modified:** 4 modified, 3 deleted, 1 gutted

## Accomplishments

- Removed ThemeProvider wrapper from App.tsx and test utilities
- Added localStorage migration in main.tsx (removes 'app-theme' key before React mount)
- Deleted 3 theme files (gyg.ts, trained.ts, types.ts) totaling ~587 lines
- Converted .theme-trained CSS selectors to global selectors
- All 4 Phase 2 ROADMAP success criteria verified passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Add localStorage migration and remove ThemeProvider from App.tsx** - `606e1439` (feat)
2. **Task 2: Delete GYG theme file and gut theme infrastructure** - `a35f6e4c` (feat)

## Files Created/Modified

- `src/main.tsx` - Added localStorage migration that removes 'app-theme' key on boot
- `src/App.tsx` - Removed ThemeProvider wrapper; App now wraps with ErrorBoundary only
- `src/test/utils.tsx` - Removed ThemeProvider wrapper; custom render wraps with BrowserRouter only
- `src/index.css` - Converted .theme-trained scoped selectors to global h1/h2/h3 and .btn-primary
- `src/themes/gyg.ts` - DELETED (GYG theme config, 144 lines)
- `src/themes/trained.ts` - DELETED (Trained theme config, 154 lines -- values already in src/design/constants.ts)
- `src/themes/types.ts` - DELETED (theme type definitions, 96 lines)
- `src/themes/index.ts` - GUTTED to 3-line tombstone comment (was 187 lines with ThemeProvider, useTheme, injectCSSVariables)

## Decisions Made

1. **`.theme-trained` CSS selectors converted to global** -- Since Trained is the only theme, the `.theme-trained` body class scoping was unnecessary. Heading and button styles now apply globally.
2. **`src/themes/index.ts` kept as tombstone** -- Rather than deleting the directory entirely, the index.ts was left as a 3-line comment pointing to where constants moved. This prevents accidental re-creation and serves as documentation. Phase 6 (Cleanup) can delete the directory entirely if desired.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Converted .theme-trained CSS selectors to global**
- **Found during:** Task 2 (theme infrastructure deletion)
- **Issue:** `src/index.css` had `.theme-trained h1,h2,h3` and `.theme-trained .btn-primary` selectors that would stop matching after ThemeProvider (which sets the body class) is removed
- **Fix:** Removed `.theme-trained` prefix, making selectors apply globally to all h1/h2/h3 and .btn-primary elements
- **Files modified:** src/index.css
- **Verification:** Build succeeds, headings and buttons still styled correctly
- **Committed in:** a35f6e4c (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Essential fix -- without it, headings and primary buttons would lose their Oswald uppercase styling after ThemeProvider removal.

## Issues Encountered

None.

## Phase 2 ROADMAP Success Criteria Verification

| Criterion | Result |
|-----------|--------|
| 1. Zero `isTrained` ternaries remain | PASS (0 matches) |
| 2. No `useTheme()` hook calls exist | PASS (0 matches) |
| 3. Settings screen has no theme toggle | PASS (0 matches for toggleTheme) |
| 4. User with 'gyg' in localStorage sees Trained on next visit | PASS (migration in main.tsx removes key) |

## Next Phase Readiness

- Phase 2 (Theme Removal) is **complete**. All 3 plans executed.
- `src/themes/` directory exists but contains only a tombstone index.ts (3 lines). Phase 6 can delete it entirely.
- Phase 3 (Component Primitives) can proceed -- the codebase has exactly one styling path with no theme branching.
- All 138 tests pass. Build succeeds. TypeScript compiles cleanly.

## Commits

| Hash | Message |
|------|---------|
| `606e1439` | feat(02-03): remove ThemeProvider and add localStorage migration |
| `a35f6e4c` | feat(02-03): delete GYG theme and gut theme infrastructure |

---
*Phase: 02-theme-removal*
*Completed: 2026-02-05*
