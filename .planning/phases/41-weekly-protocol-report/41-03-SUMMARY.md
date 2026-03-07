---
phase: 41-weekly-protocol-report
plan: 03
subsystem: engagement
tags: [weekly-report, share-cards, social-sharing, png-export]
completed: 2026-03-07
duration: 5min

dependencies:
  requires: [41-01, shareCard, ShareCardWrapper, RankUpShareCard]
  provides: [WeeklyReportShareCard, shareWeeklyReportCard]
  affects: [WeeklyReportScreen, shareCard]

tech_stack:
  added: [WeeklyReportShareCard]
  patterns: [off-screen-render, html-to-image, no-dp-award]

key_files:
  created:
    - src/components/share/WeeklyReportShareCard.tsx
  modified:
    - src/lib/shareCard.ts
    - src/screens/WeeklyReportScreen.tsx
    - src/screens/Home.tsx

decisions:
  - No DP award for weekly report share (informational, not reward action)
  - Weekly share type added to ShareType union
  - Share functionality internal to WeeklyReportScreen (no onShare prop)
  - Avatar stage derived from rank using getAvatarStage()
  - Callsign uses profile.username with fallback to 'Recruit'
  - Progress bar text shows percentage to next rank

metrics:
  tasks_completed: 2
  files_created: 1
  files_modified: 3
  commits: 2
---

# Phase 41 Plan 03: Weekly Report Share Card Summary

**One-liner:** Share card component with 2x2 stats grid, avatar, and rank progress for weekly protocol report social sharing

## Tasks Completed

| Task | Commit | Files |
|------|--------|-------|
| 1. Create WeeklyReportShareCard component | 3c57d20b | src/components/share/WeeklyReportShareCard.tsx |
| 2. Add shareWeeklyReportCard utility and integrate in WeeklyReportScreen | 12632848 | src/lib/shareCard.ts, src/screens/WeeklyReportScreen.tsx, src/screens/Home.tsx |

## Implementation Details

### WeeklyReportShareCard Component
- **Fixed dimensions:** 390x844 (iPhone viewport)
- **Inline styles:** Ensures reliable html-to-image capture (no Tailwind JIT)
- **Color scheme:** Gold (#C9A84C) and Obsidian (#0A0A0A) matching RankUpShareCard

**Layout structure:**
1. **Header** - Chain-link crown SVG mark, "WEEKLY PROTOCOL REPORT" gold headline
2. **Stats Grid** - 2x2 gold-bordered cards:
   - Top-left: DP earned (large gold number, "+X DP" label)
   - Top-right: Compliance percentage (white number, small label)
   - Bottom-left: Streak (white number, "DAY STREAK" label)
   - Bottom-right: Workouts completed (white number, "WORKOUTS" label)
3. **Avatar Section** - 150x150 avatar with radial gold glow, callsign below
4. **Rank Progress** - Current rank name in gold, thin progress bar, percentage text
5. **Branding Footer** - "WELLTRAINED" wordmark, "Submit to the Gains." tagline, "welltrained.app" URL

**Typography:** Oswald (headlines), JetBrains Mono (numbers), system fonts (body text)

### shareWeeklyReportCard Utility
Added to `src/lib/shareCard.ts`:
- **ShareType:** Extended union to include `'weekly'` (alongside workout, compliance, rankup)
- **awardDPForShare:** Added case for 'weekly' that does nothing (no DP reward for informational shares)
- **shareWeeklyReportCard():** Convenience wrapper accepting element, dpEarned, streak, rankName
  - Share text: "Weekly Protocol Report: +X DP earned, X day streak, [Rank] rank. Submit to the Gains. welltrained.app"
  - Filename: `welltrained-weekly-report-{timestamp}`
  - No DP award after share (informational content, not reward trigger)

### WeeklyReportScreen Integration
- **Imports:** Added ShareCardWrapper, WeeklyReportShareCard, shareWeeklyReportCard, getAvatarStage, useUserStore
- **Ref:** `shareCardRef` for off-screen card element
- **Off-screen render:** WeeklyReportShareCard wrapped in ShareCardWrapper with all required props:
  - `dpEarned`, `compliancePercentage`, `streak`, `workoutsCompleted` from stats
  - `rankName`, `progress` from rankInfo
  - `callsign` from profile.username (fallback: 'Recruit')
  - `avatarStage` derived via `getAvatarStage(rankInfo.rank) as 1|2|3|4|5`
  - `archetype` from profile.archetype (fallback: 'bro')
- **Handler:** `handleShare()` calls `shareWeeklyReportCard()` with ref element and stats
- **Button:** Share button onClick wired to `handleShare` (removed onShare prop)

### Home.tsx Update
- Removed `onShare={() => {}}` prop from WeeklyReportScreen usage
- Share functionality now internal to WeeklyReportScreen

## Verification Results

1. `npx tsc --noEmit` passes with zero errors ✓
2. WeeklyReportShareCard renders 390x844 card with all props displayed ✓
3. shareWeeklyReportCard function captures card and opens native share sheet ✓
4. WeeklyReportScreen share button triggers share flow ✓

## Success Criteria Met

- [x] Share button on WeeklyReportScreen generates PNG from off-screen card
- [x] Native share sheet opens with weekly report image and text
- [x] Card displays DP earned, compliance, streak, workouts, rank progress, avatar, and branding
- [x] No DP awarded for sharing weekly report (informational share only)

## Deviations from Plan

None - plan executed exactly as written.

## Next Steps

Phase 41 (Weekly Protocol Report) is now complete. All 3 plans executed:
- Plan 01: WeeklyReportScreen with stats aggregation and highlights
- Plan 02: Home screen integration with Sunday trigger logic
- Plan 03: Share card generation and native share integration

Next milestone phase: Phase 42 (Referral System) - implement referral code generation, deep linking, and invite tracking.

## Self-Check

Verifying created files exist:
- FOUND: src/components/share/WeeklyReportShareCard.tsx

Verifying commits exist:
- FOUND: 3c57d20b (Task 1)
- FOUND: 12632848 (Task 2)

## Self-Check: PASSED
