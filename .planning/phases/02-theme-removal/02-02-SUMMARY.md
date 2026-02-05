---
phase: "02"
plan: "02"
subsystem: screens
tags: [theme-removal, de-branching, screens, settings, onboarding]

dependency-graph:
  requires: ["02-01"]
  provides:
    - "All 9 screen files de-branched to Trained-only"
    - "Theme toggle removed from Settings"
    - "Zero useTheme/isTrained/themeId in screens or components"
  affects: ["02-03"]

tech-stack:
  added: []
  patterns:
    - "LABELS constant from @/design/constants replaces theme.labels in screens"
    - "AVATAR_STAGES from @/design/constants replaces theme.avatarStages"
    - "getStandingOrder imported from @/design/constants (single-arg signature)"

file-tracking:
  key-files:
    modified:
      - src/screens/Workouts.tsx
      - src/screens/AccessGate.tsx
      - src/screens/CheckInModal.tsx
      - src/screens/Achievements.tsx
      - src/screens/Home.tsx
      - src/screens/Settings.tsx
      - src/screens/XPClaimModal.tsx
      - src/screens/AvatarScreen.tsx
      - src/screens/Onboarding.tsx

decisions:
  - id: "02-02-01"
    decision: "getStandingOrder signature simplified from (theme, context) to (context) only"
    rationale: "Theme parameter is no longer needed since only Trained standing orders exist in constants.ts"
  - id: "02-02-02"
    decision: "Onboarding DaysStep descriptions removed (GYG had descriptions, Trained did not)"
    rationale: "Trained design uses minimal card content -- just label + frequency counter"
  - id: "02-02-03"
    decision: "GenderStep icons removed entirely (Trained path had no icons on gender cards)"
    rationale: "Trained design shows plain text cards for biological sex selection"
  - id: "02-02-04"
    decision: "EvolutionStep sparkle effects removed (only existed in GYG path)"
    rationale: "Trained theme uses restrained animations -- no particle sparkles on evolution"
  - id: "02-02-05"
    decision: "EvolutionStep background glow uses red (rgba(220,38,38)) not purple"
    rationale: "Trained accent is blood-red, not purple"
  - id: "02-02-06"
    decision: "Submissive avatar icon is Zap (Trained) not Moon (GYG) in EvolutionStep"
    rationale: "Trained theme uses Zap for submissive class throughout"

metrics:
  duration: "~8min"
  completed: "2026-02-05"
---

# Phase 02 Plan 02: Screen De-branching Summary

**One-liner:** De-branched all 9 screen files (~323 isTrained occurrences removed), removed theme toggle from Settings, zero theme references remain in screens or components.

## What Was Done

### Task 1: De-branch 4 lower-count screens
**Commit:** `f96b2905`

| File | Occurrences Removed | Key Changes |
|------|---------------------|-------------|
| Workouts.tsx | ~14 | Replaced theme.labels with LABELS; hardcoded Trained styling (rounded, font-heading, uppercase) |
| AccessGate.tsx | ~32 | Removed all GYG styling (glassmorphism, gradient text, bouncy animation); kept Shield icon, "Access Code" label, trained.fitness URLs |
| CheckInModal.tsx | ~23 | Replaced theme.labels with LABELS; removed isTrained prop from QuestCheckbox; hardcoded "Submit Report", "Report Accepted" |
| Achievements.tsx | ~8 | Replaced theme.labels with LABELS; hardcoded "Obedience"/"Training" categories |

### Task 2: De-branch 5 high-count screens + remove theme toggle
**Commit:** `0f9b4a4d`

| File | Occurrences Removed | Key Changes |
|------|---------------------|-------------|
| Home.tsx | ~45 | Changed getStandingOrder import to @/design/constants; simplified call from (theme, ctx) to (ctx); removed all GYG label/styling alternatives |
| Settings.tsx | ~38 | **Removed entire APP MODE / theme toggle section**; removed toggleTheme; replaced theme.labels with LABELS throughout |
| XPClaimModal.tsx | ~38 | Hardcoded CONFETTI_COLORS as single constant; removed GYG bouncy animations and glow effects; hardcoded "Weekly Reward Ritual", "RANK PROMOTED!" |
| AvatarScreen.tsx | ~33 | Replaced theme.avatarStages with AVATAR_STAGES from constants; replaced theme.labels with LABELS; hardcoded "Your Status", "PROGRESSION PATH" |
| Onboarding.tsx | ~63 | De-branched all 11 sub-components (WelcomeStep through EvolutionStep); removed all GYG paths, icons, copy; file shrank from 1677 to ~950 lines |

### Net Impact
- **Lines removed:** ~842 lines of dead GYG code paths
- **Lines added:** ~348 lines (Trained-only clean code)
- **Net reduction:** ~494 lines across 9 files

## Verification Results

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | Zero errors |
| `npm run build` | Success (4.86s) |
| useTheme/isTrained/themeId in src/screens/ | Zero files |
| useTheme/isTrained/themeId in src/components/ | Zero files |
| theme.labels/theme.avatarStages in screens | Zero files |
| theme.labels/theme.avatarStages in components | Zero files |
| toggleTheme in Settings.tsx | Zero matches |
| getStandingOrder from @/design/constants | Confirmed in Home.tsx |
| npm test -- --run | 138 tests pass (6 suites) |

## Deviations from Plan

None -- plan executed exactly as written.

## Next Phase Readiness

Plan 02-03 (theme infrastructure deletion) can now proceed. After this plan:
- **Zero files** in `src/screens/` or `src/components/` reference `useTheme`, `isTrained`, `themeId`, `theme.labels`, or `theme.avatarStages`
- The only remaining consumers of `src/themes/` are: barrel re-exports (index.ts), the theme provider itself, and any direct imports from non-screen files (stores, lib)
- Plan 03 can safely delete `src/themes/` directory and the ThemeProvider

## Commits

| Hash | Message |
|------|---------|
| `f96b2905` | feat(02-02): de-branch 4 lower-count screen files |
| `0f9b4a4d` | feat(02-02): de-branch 5 high-count screens and remove theme toggle |
