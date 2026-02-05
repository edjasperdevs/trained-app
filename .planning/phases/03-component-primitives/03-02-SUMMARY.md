---
phase: 03-component-primitives
plan: 02
status: complete
started: 2026-02-05T20:11:04Z
completed: 2026-02-05
duration: 5min
subsystem: design-system
tags: [css, inputs, focus, accessibility, wcag, glass-removal]
dependency-graph:
  requires: [03-01]
  provides: [unified-input-styling, wcag-focus-rings, glow-cleanup]
  affects: [04-screen-layouts, 05-animation-refinement]
tech-stack:
  added: []
  patterns: [input-base-css-class, focus-visible-global-rule]
key-files:
  created: []
  modified:
    - src/index.css
    - src/screens/Auth.tsx
    - src/screens/Macros.tsx
    - src/screens/Settings.tsx
    - src/screens/Workouts.tsx
    - src/screens/Onboarding.tsx
    - src/screens/AccessGate.tsx
    - src/screens/Coach.tsx
    - src/components/FoodSearch.tsx
    - src/components/MealBuilder.tsx
decisions:
  - ".input-base class uses var(--color-surface) background (not bg-secondary) for consistency with Card surface"
  - "Global focus-visible uses outline (not box-shadow) for non-input elements; input-base suppresses double focus indicator"
  - ".glass-subtle removed entirely (Settings solid surfaces replace all 6 usages)"
  - "All 10 glow utility classes removed (none were referenced in TSX files)"
metrics:
  tasks-completed: 2
  tasks-total: 2
  files-modified: 10
  input-occurrences-unified: 39
---

# Phase 3 Plan 2: Unified Input Styling and Glow Cleanup Summary

**One-liner:** `.input-base` class unifies 39 input/select/textarea instances across 9 files; WCAG AA focus-visible rings on all interactive elements; 10 unused glow classes stripped.

## What Was Done

### Task 1: Create input-base class and global focus-visible ring; strip glow classes (910dd11e)

Added `.input-base` CSS class to `src/index.css` providing:
- `var(--color-surface)` background, `var(--color-border)` border, `var(--radius-md)` radius
- `0.5rem 0.75rem` padding, `0.875rem` font size, full width
- Focus state: primary border color + `2px var(--color-primary-muted)` box-shadow ring
- Placeholder color using `var(--color-text-secondary)`

Added global WCAG AA `focus-visible` rule for `button`, `a`, `input`, `select`, `textarea`, and `[role="button"]` using `2px solid var(--color-primary)` outline with `2px` offset. `.input-base:focus-visible` suppresses double outline since inputs already have box-shadow focus.

Removed from index.css:
- `.glass-input` and `.glass-input:focus` (replaced by `.input-base`)
- `.glass-subtle` (replaced by solid `bg-surface border border-border`)
- 10 glow utility classes: `.glow-primary`, `.glow-gold`, `.glow-green`, `.glow-primary-intense`, `.text-glow-primary`, `.text-glow-gold`, `.glow-cyan`, `.glow-purple`, `.glow-gold-intense`, `.text-glow-green`

Preserved:
- `shadow-glow` and `shadow-glow-intense` tokens in @theme (available for hero glow use)
- `.glass-overlay` (legitimate modal overlay per VIS-02)
- `pulse-glow` keyframe animation in @theme

### Task 2: Apply input-base across all screens; replace glass with solid surfaces (22c06707)

Migrated all 39 input/select/textarea occurrences across 9 files:

| File | Inputs | Pattern Replaced |
|------|--------|-----------------|
| Auth.tsx | 3 | `bg-bg-secondary border border-border rounded-lg px-3 py-2` |
| Macros.tsx | 6 | `bg-bg-secondary border border-border rounded-lg px-4 py-3 text-2xl font-digital text-center` |
| Settings.tsx | 5 | `glass-input rounded-xl px-4 py-2.5` + textarea |
| Workouts.tsx | 12 | `bg-bg-secondary border border-gray-700 rounded`, `bg-bg-card border border-gray-700 rounded-lg` |
| Onboarding.tsx | 5 | `bg-bg-secondary border border-border rounded px-4 py-3 font-digital text-xl` |
| AccessGate.tsx | 1 | `glass-input rounded-xl px-4 py-3` |
| Coach.tsx | 1 | `bg-bg-card border border-gray-700 rounded-lg px-3 py-2` |
| FoodSearch.tsx | 3 | `bg-bg-secondary border border-border rounded-lg`, `bg-bg-card border border-border rounded-lg` |
| MealBuilder.tsx | 1 | `bg-bg-card border border-border rounded-lg px-4 py-3` |

Settings.tsx glass-subtle replacements (6 instances):
- Imperial/Metric unit buttons: `glass-subtle border-transparent` -> `bg-surface border-border`
- Streak stats cards (2): `glass-subtle rounded-xl p-4` -> `bg-surface border border-border rounded-xl p-4`
- Current/Goal weight cards (2): `glass-subtle rounded-xl p-3` -> `bg-surface border border-border rounded-xl p-3`

## Decisions Made

1. `.input-base` uses `var(--color-surface)` background (same as Card default) for visual consistency
2. Global `focus-visible` uses CSS outline for buttons/links; `.input-base` uses box-shadow focus ring (suppresses outline to avoid doubling)
3. `.glass-subtle` fully removed from both CSS and all TSX files (solid `bg-surface border border-border` replaces all 6 usages in Settings.tsx)
4. All 10 glow utility classes removed without migration since zero TSX files referenced them

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | 0 errors |
| `npm run build` | Success |
| `glass-input` in src/ | 0 results |
| `input-base` in src/ | 39 results across 10 files |
| `focus-visible` in index.css | Global rule present |
| Glow classes in index.css | 0 (removed) |
| `.glass-overlay` in index.css | Preserved |

## Next Phase Readiness

Phase 03 (Component Primitives) is now complete. All component primitives (Button, Card, ProgressBar, Toast, EmptyState, input-base, focus-visible) are established. Ready for Phase 04 (Screen Layouts).
