# Roadmap: Trained Design Refresh

## Overview

Full visual overhaul across 7 phases transforming Trained from playful gamified to premium Equinox-tier. The phases follow a strict dependency chain: foundation tokens enable theme removal, which enables visual refresh of components, then screens, then animation tuning, with cleanup and deploy as the final sweep. 25 requirements, standard depth, targeting completion this week.

**Phases:** 7
**Requirements:** 25 mapped
**Depth:** Standard
**Timeline:** This week

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Foundation** - Token system, Tailwind v4, tooling upgrades
- [x] **Phase 2: Theme Removal** - De-branch 394 ternaries, delete GYG, simplify codebase
- [ ] **Phase 3: Component Primitives** - Redesign Button, Card, ProgressBar, Toast, inputs with CVA
- [ ] **Phase 4: Screen Refresh** - Typography, spacing, bottom sheets, skeleton colors
- [ ] **Phase 5: Animation Refinement** - Critically damped springs, remove playful motion
- [ ] **Phase 6: Cleanup** - Delete dead code, legacy files, final verification
- [ ] **Phase 7: Deploy** - Service worker strategy, "What's New" interstitial

## Phase Details

### Phase 1: Foundation
**Goal**: Every color, font, spacing, and radius token flows from a single CSS source of truth with zero runtime cost
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06
**Success Criteria** (what must be TRUE):
  1. App builds and runs on Tailwind v4 with `@theme` directive -- no `tailwind.config.js` token definitions remain active
  2. All 67 previously-hardcoded color values reference design tokens (no raw hex/rgba in component files)
  3. `cn()` utility and CVA are importable and used in at least one component as proof of concept
  4. Fonts load from local bundles (no Google Fonts CDN requests visible in Network tab)
  5. All `framer-motion` imports replaced with `motion/react` -- app animations still function
**Plans**: 2 plans

Plans:
- [x] 01-01: Tailwind v4 migration, @theme token system, cn() utility, CVA + tailwind-merge install
- [x] 01-02: Hardcoded color audit + replacement, font self-hosting, motion v12 upgrade

---

### Phase 2: Theme Removal
**Goal**: The codebase has exactly one styling path -- no conditional branching, no theme selection, no GYG remnants
**Depends on**: Phase 1
**Requirements**: THEME-01, THEME-02, THEME-03
**Success Criteria** (what must be TRUE):
  1. Zero `isTrained` ternaries remain in the codebase (was 394 across 21 files)
  2. No `useTheme()` hook calls exist -- components import constants directly
  3. Settings screen has no theme toggle -- the option is gone
  4. A user with `gyg` stored in localStorage sees the Trained theme on next visit (migration works)
**Plans**: 3 plans

Plans:
- [x] 02-01: De-branch primitive and composite components (Button, Card, Navigation, Avatar, etc.)
- [x] 02-02: De-branch screens (Workouts, AccessGate, CheckIn, XPClaim, Settings, Avatar, Home, Onboarding)
- [x] 02-03: Delete GYG theme, ThemeProvider, useTheme hook; add localStorage migration

---

### Phase 3: Component Primitives
**Goal**: Core UI components look premium -- solid surfaces, restrained accents, refined inputs -- and expose typed variant APIs
**Depends on**: Phase 2
**Requirements**: VIS-01, VIS-02, VIS-03, VIS-04
**Success Criteria** (what must be TRUE):
  1. Button, Card, ProgressBar, Toast, and input components use CVA variant definitions (not raw conditional classes)
  2. Standard cards use solid surface colors with subtle borders -- glass effects only appear on overlays/modals
  3. No screen has more than one glow effect (hero glow maximum)
  4. Focus rings and input fields have consistent, refined styling that meets WCAG AA focus indicator requirements
**Plans**: 2 plans

Plans:
- [ ] 03-01: Redesign Button, Card, ProgressBar, Toast with CVA variants; replace glass with solid surfaces
- [ ] 03-02: Refine inputs, focus rings, form styling; strip/mute glow effects to one-per-screen max

---

### Phase 4: Screen Refresh
**Goal**: Every screen communicates premium discipline through typography hierarchy, generous spacing, and purposeful layout
**Depends on**: Phase 3
**Requirements**: SCREEN-01, SCREEN-02, SCREEN-03, SCREEN-04, SCREEN-05
**Success Criteria** (what must be TRUE):
  1. Typography uses 3-4 size stops with weight-driven hierarchy -- no more than 2 uppercase elements per screen (section headers and primary CTAs only)
  2. Screen padding is 20-24px and card padding is 16-24px consistently across all screens
  3. CheckInModal and XPClaimModal render as bottom sheets (slide up from bottom, not centered modals)
  4. Skeleton loaders and empty states use colors from the new palette (no old theme colors visible during loading)
**Plans**: 2 plans

Plans:
- [ ] 04-01: Apply typography scale, fix uppercase overuse, apply spacing system across all screens
- [ ] 04-02: Convert CheckInModal and XPClaimModal to bottom sheets; update skeleton and empty state colors

---

### Phase 5: Animation Refinement
**Goal**: All motion feels purposeful and premium -- fast, critically damped, never bouncy or playful
**Depends on**: Phase 4
**Requirements**: ANIM-01, ANIM-02, ANIM-03
**Success Criteria** (what must be TRUE):
  1. All spring animations use critically damped parameters (damping 25-30, stiffness 300+) -- no overshoot/bounce visible
  2. `float` and `xp-pop` keyframe animations are removed; `pulse-glow` is muted to a subtle fade
  3. With `prefers-reduced-motion: reduce` enabled in OS settings, no animations play (motion v12 compliance)
**Plans**: 1 plan

Plans:
- [ ] 05-01: Replace bouncy springs with critically damped; remove playful keyframes; verify reduced-motion compliance

---

### Phase 6: Cleanup
**Goal**: Zero dead code from the old theme system remains -- the codebase is clean and the build is verified
**Depends on**: Phase 5
**Requirements**: CLEAN-01, CLEAN-02
**Success Criteria** (what must be TRUE):
  1. `src/themes/` directory does not exist (retained constants moved to `src/design/constants.ts` or equivalent)
  2. No legacy CSS rules (`.theme-trained`, `.theme-gyg`, `injectCSSVariables`) exist in any file
  3. `tsc --noEmit` passes with zero errors and the full test suite passes
**Plans**: 1 plan

Plans:
- [ ] 06-01: Delete theme infrastructure, remove legacy CSS rules, run tsc + test suite verification

---

### Phase 7: Deploy
**Goal**: Returning users get the new design atomically with clear communication about what changed
**Depends on**: Phase 6
**Requirements**: DEPLOY-01, DEPLOY-02
**Success Criteria** (what must be TRUE):
  1. Service worker serves new assets atomically -- no partial old/new design mashup possible
  2. A returning user sees a "What's New" interstitial or update prompt on first visit after deploy
  3. All Vite-generated assets have content hashes (cache-busting confirmed)
**Plans**: 1 plan

Plans:
- [ ] 07-01: Service worker atomic deploy strategy, "What's New" interstitial, asset hash verification

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 1. Foundation | 2/2 | Complete | 2026-02-05 |
| 2. Theme Removal | 3/3 | Complete | 2026-02-05 |
| 3. Component Primitives | 0/2 | Not started | - |
| 4. Screen Refresh | 0/2 | Not started | - |
| 5. Animation Refinement | 0/1 | Not started | - |
| 6. Cleanup | 0/1 | Not started | - |
| 7. Deploy | 0/1 | Not started | - |

---
*Roadmap created: 2026-02-05*
*Total: 7 phases, 12 plans, 25 requirements*
