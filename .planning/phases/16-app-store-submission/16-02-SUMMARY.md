---
phase: 16-app-store-submission
plan: 02
subsystem: ui
tags: [privacy-policy, xcprivacy, app-store, apple-review, react, plist]

# Dependency graph
requires:
  - phase: 16-app-store-submission
    provides: Account deletion (plan 01)
provides:
  - In-app privacy policy screen at /privacy
  - PrivacyInfo.xcprivacy Apple privacy manifest
  - Privacy links from Settings and Auth screens
affects: [16-app-store-submission]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Privacy policy as native React component (not iframe/external link)"
    - "Route registered in both auth states for unauthenticated access"

key-files:
  created:
    - src/screens/Privacy.tsx
    - ios/App/App/PrivacyInfo.xcprivacy
  modified:
    - src/App.tsx
    - src/screens/Settings.tsx
    - src/screens/Auth.tsx

key-decisions:
  - "Manual Tailwind classes instead of prose plugin (typography plugin not installed)"

patterns-established:
  - "Dual-state routing: routes needed before auth go in both unauth and auth route blocks"

# Metrics
duration: 5min
completed: 2026-02-22
---

# Phase 16 Plan 02: Privacy Policy & Apple Privacy Manifest Summary

**In-app privacy policy screen with full data disclosures and PrivacyInfo.xcprivacy declaring UserDefaults API usage for App Store submission**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-23T02:39:49Z
- **Completed:** 2026-02-23T02:45:21Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Privacy.tsx renders complete privacy policy covering all data types, third-party services, user rights, and account deletion
- /privacy route accessible from both authenticated and unauthenticated states (Apple reviewers can reach it before sign-in)
- Settings About card and Auth screen both link to the privacy policy
- PrivacyInfo.xcprivacy declares NSPrivacyAccessedAPICategoryUserDefaults with reason CA92.1

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Privacy Policy screen and route** - `ad9f823e` (feat)
2. **Task 2: Create PrivacyInfo.xcprivacy manifest** - `7f08b5c1` (feat)

## Files Created/Modified
- `src/screens/Privacy.tsx` - Full in-app privacy policy screen with back navigation
- `ios/App/App/PrivacyInfo.xcprivacy` - Apple privacy manifest declaring UserDefaults usage
- `src/App.tsx` - Added /privacy route in both auth states with lazy loading
- `src/screens/Settings.tsx` - Added Privacy Policy link in About card
- `src/screens/Auth.tsx` - Added Privacy Policy link below auth form (Apple compliance)

## Decisions Made
- Used manual Tailwind utility classes for policy text styling instead of prose plugin (tailwindcss/typography not installed in project)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Replaced prose classes with manual Tailwind utilities**
- **Found during:** Task 1 (Privacy.tsx creation)
- **Issue:** Plan specified `prose prose-invert prose-sm` classes but @tailwindcss/typography plugin is not installed
- **Fix:** Used manual text-sm, leading-relaxed, text-foreground/80, list-disc, space-y classes for equivalent formatting
- **Files modified:** src/screens/Privacy.tsx
- **Verification:** TypeScript compiles cleanly, styles follow existing dark theme patterns
- **Committed in:** ad9f823e (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Styling deviation necessary since dependency was missing. Equivalent visual result achieved with utility classes matching existing codebase patterns.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Privacy policy and Apple privacy manifest complete
- App Store submission prerequisites (account deletion + privacy) are met
- Ready for remaining 16-03 and 16-04 plans

## Self-Check: PASSED

All files verified present. All commits verified in git log.

---
*Phase: 16-app-store-submission*
*Completed: 2026-02-22*
