# Phase 4 Plan 2: Bottom Sheet Modals and Palette Cleanup Summary

**One-liner:** XPClaimModal converted to slide-up bottom sheet matching CheckInModal; skeleton bg-bg-primary replaced with bg-background across 7 screens

## What Was Done

### Task 1: Convert XPClaimModal to bottom sheet and refine CheckInModal
- Changed XPClaimModal outer overlay from `items-center justify-center` to `items-end sm:items-center justify-center` (bottom on mobile, center on desktop)
- Replaced scale animation (`scale: 0.8 -> 1`) with slide-up (`y: '100%' -> 0`)
- Matched CheckInModal spring parameters: `damping: 25, stiffness: 300`
- Added `rounded-t-lg sm:rounded-lg` for mobile/desktop corner treatment
- Added `max-h-[90vh] overflow-y-auto` for scroll safety
- Replaced Card wrappers with plain `<div className="p-6">` in preview, complete, and levelup phases
- Normalized all phase padding to `p-6`
- Removed unused Card import
- Harmonized overlay opacity to `bg-background/80` (was `/90`)
- CheckInModal was already correctly implemented -- no changes needed
- Commit: ed4b86a3

### Task 2: Verify and update skeleton and empty state colors to new palette
- Replaced 7 instances of legacy `bg-bg-primary` with `bg-background` in Skeleton.tsx
- Affected: HomeSkeleton, WorkoutsSkeleton, MacrosSkeleton, AchievementsSkeleton, AvatarSkeleton, SettingsSkeleton, OnboardingSkeleton
- EmptyState.tsx already used new palette tokens -- no changes needed
- All colors now use semantic tokens: bg-background, bg-surface, bg-surface-elevated, border-border
- Zero legacy aliases (bg-bg-*, text-accent-*) remain in either file
- Commit: 5beabf60

## Decisions Made

- [04-02]: Card wrappers removed from XPClaimModal phases -- bottom sheet container provides bg-surface background
- [04-02]: Overlay opacity harmonized to bg-background/80 (matching CheckInModal) instead of /90
- [04-02]: EmptyState confirmed clean -- no changes needed (already on new palette)

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

1. Both modals use `items-end sm:items-center` -- PASS
2. Both modals use `y: '100%'` slide-up animation -- PASS
3. Both modals have `rounded-t-lg sm:rounded-lg` -- PASS
4. Both modals have spring `damping: 25, stiffness: 300` -- PASS
5. Zero `bg-bg-` matches in Skeleton.tsx -- PASS
6. Zero `bg-bg-` or `text-accent-` matches in EmptyState.tsx -- PASS
7. `npx tsc --noEmit` -- PASS
8. `npx vite build` -- PASS

## Files Modified

- `src/screens/XPClaimModal.tsx` -- Bottom sheet conversion (animation, layout, padding, Card removal)
- `src/components/Skeleton.tsx` -- 7x bg-bg-primary -> bg-background replacement

## Files Not Modified (confirmed clean)

- `src/screens/CheckInModal.tsx` -- Already correct bottom sheet implementation
- `src/components/EmptyState.tsx` -- Already on new palette tokens

## Requirements Addressed

- **SCREEN-04**: CheckInModal and XPClaimModal render as bottom sheets (slide up from bottom, not centered)
- **SCREEN-05**: Skeleton loaders and empty states use colors from the new palette (no old theme colors)

## Duration

~3 minutes
