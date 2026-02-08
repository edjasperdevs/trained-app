# Phase 4 Plan 2: Coach Macro Editor UI & Client Indicator Summary

**One-liner:** MacroEditor in Coach client detail modal with 4-field upsert + "Set by Dom/me" badge and locked calculator on client Macros screen

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Add macro editor to Coach.tsx Client Detail modal | 520f6d0c | src/screens/Coach.tsx |
| 2 | Add "Set by Coach" indicator and calculator lock to Macros.tsx | 9a01aef3 | src/screens/Macros.tsx |

## What Was Done

### Task 1: MacroEditor in Coach Client Detail Modal
- Added `MacroEditor` inline component in Coach.tsx with 4 number inputs (calories, protein, carbs, fats)
- Save handler uses Supabase `upsert` on `macro_targets` table with `set_by: 'coach'`, `set_by_coach_id`, and `onConflict: 'user_id'`
- Revert handler updates `set_by: 'self'` and clears `set_by_coach_id` with `window.confirm()` guard
- "Currently set by dom/me" badge shown when targets are coach-owned
- "Release to Client" ghost button appears only when coach-set
- Dev bypass mode skips Supabase calls for local testing
- Added `ShieldCheck` lucide icon import, `LABELS` from design constants, `MacroTargets` type from useClientDetails
- Used `trackEvent` directly for analytics (plan specified `analytics.track` which doesn't exist on typed analytics object)
- Added null guards for `selectedClient.client_id` and `user?.id` (both nullable types)
- MacroEditor positioned in overview tab between Activity card and Weight Trend card
- Cache refresh via `refreshClientDetails()` after save/revert

### Task 2: "Set by Coach" Indicator and Calculator Lock
- Destructured `setBy` from `useMacroStore()` (field already existed from Phase 1 sync work)
- Replaced `<h1>` with wrapper div containing badge: "Set by Dom/me" with ShieldCheck icon when `setBy === 'coach'`
- Calculator tab conditionally renders locked read-only view with:
  - Large ShieldCheck icon
  - "Macros Set by Dom/me" title
  - Explanation text referencing LABELS.coach
  - 2x2 grid displaying current targets (calories, protein, carbs, fats)
- Daily, log, and meals tabs remain fully functional regardless of setBy value
- Added `ShieldCheck` to lucide-react import, `LABELS` from design constants

## Decisions Made

| ID | Decision | Reasoning |
|----|----------|-----------|
| 04-02-A | Used `trackEvent()` directly instead of `analytics.track()` | analytics object has typed methods only, no generic `track`; `trackEvent` is the underlying function |
| 04-02-B | Added null guards for clientId and coachId props | `client_id` is `string \| null` on ClientSummary, `user` is `User \| null`; guards prevent type errors |
| 04-02-C | Used `useEffect` to sync form fields with currentTargets | Ensures form updates when cache refreshes after save, preventing stale values |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] analytics.track does not exist on typed analytics object**
- **Found during:** Task 1
- **Issue:** Plan specified `analytics.track('coach_set_macros', { clientId })` but the analytics module exports a typed object without a generic `track` method
- **Fix:** Imported `trackEvent` directly and called `trackEvent('Coach Set Macros', { clientId })`
- **Files modified:** src/screens/Coach.tsx
- **Commit:** 520f6d0c

**2. [Rule 1 - Bug] Nullable types on clientId and coachId**
- **Found during:** Task 1
- **Issue:** `selectedClient.client_id` is `string | null` and `user` is `User | null`, causing TypeScript errors when passed as `string` props
- **Fix:** Wrapped MacroEditor rendering in null guards: `{selectedClient.client_id && user?.id && (...)}`
- **Files modified:** src/screens/Coach.tsx
- **Commit:** 520f6d0c

## Verification Results

1. `npx tsc --noEmit` passes with zero errors
2. Coach.tsx has MacroEditor in overview tab with 4-field form, save (upsert), and revert (release) functionality
3. Coach.tsx refreshes client details cache after save/revert via `refreshClientDetails()`
4. Macros.tsx has "Set by Dom/me" badge in header when `setBy === 'coach'`
5. Macros.tsx calculator tab shows locked read-only view when `setBy === 'coach'`
6. Macros.tsx daily/log/meals tabs remain fully functional regardless of setBy
7. Dev bypass mode works for coach editor (skips Supabase calls)
8. All three success criteria met:
   - MACRO-01: Coach can set calories, protein, carbs, fat from dashboard (MacroEditor)
   - MACRO-02: Client sees "Set by Dom/me" and cannot recalculate (badge + locked calculator)
   - MACRO-03: Client sees updated targets on next app open (existing pullCoachData -- no changes needed)

## Next Phase Readiness

All macro management requirements (MACRO-01, MACRO-02, MACRO-03) are complete. Phase 4 is finished.

---
subsystem: coach-dashboard, client-macros
tags: [macro-editor, coach-set-macros, upsert, locked-calculator, setBy-indicator]
requires: [04-01]
provides: [coach-macro-editor-ui, client-coach-indicator, calculator-lock]
affects: []
tech-stack:
  added: []
  patterns: [inline-component-for-modal-section, conditional-tab-rendering, form-sync-with-useEffect]
key-files:
  created: []
  modified:
    - src/screens/Coach.tsx
    - src/screens/Macros.tsx
metrics:
  duration: 4min 45s
  completed: 2026-02-07
---

## Self-Check: PASSED
