# Requirements: Trained Design Refresh

**Defined:** 2026-02-05
**Core Value:** The app must look and feel like it belongs next to Equinox, Whoop, and PUSH -- premium, dark, disciplined

## Previous Milestone (Launch Polish) -- Complete

All 16 requirements delivered. See archived milestone for details.

## v1 Requirements

Requirements for design refresh -- full visual overhaul with theme system simplification.

### Foundation

- [x] **FOUND-01**: Migrate Tailwind CSS v3 to v4 with `@theme` directive replacing JS token system
- [x] **FOUND-02**: Define premium design tokens (surface hierarchy, border radius 12-16px, spacing scale, subtle borders)
- [x] **FOUND-03**: Audit and replace all hardcoded colors (67 identified) with token references
- [x] **FOUND-04**: Upgrade framer-motion to motion v12 (find-and-replace imports)
- [x] **FOUND-05**: Self-host fonts via Fontsource (replace Google Fonts CDN)
- [x] **FOUND-06**: Create `cn()` utility + install CVA, tailwind-merge, clsx

### Theme Removal

- [x] **THEME-01**: Remove all `isTrained` branching (394 ternaries across 21 files) -- resolve to Trained values
- [x] **THEME-02**: Delete GYG theme, ThemeProvider, useTheme hook, theme toggle
- [x] **THEME-03**: Add localStorage migration for `app-theme` key on boot

### Visual Refresh -- Components

- [ ] **VIS-01**: Redesign primitive components with CVA variants (Button, Card, ProgressBar, Toast, inputs)
- [ ] **VIS-02**: Replace glass effects on standard cards with solid surface colors (keep glass for overlays only)
- [ ] **VIS-03**: Remove/mute glow effects -- keep ONE hero glow per screen maximum
- [ ] **VIS-04**: Refine focus rings, input styling, and form design to premium standard

### Visual Refresh -- Screens

- [ ] **SCREEN-01**: Apply premium typography scale across all screens (3-4 sizes, weight-driven hierarchy)
- [ ] **SCREEN-02**: Fix uppercase overuse (restrict to section headers and primary CTAs only)
- [ ] **SCREEN-03**: Apply generous spacing system (20-24px screen padding, 16-24px card padding)
- [ ] **SCREEN-04**: Convert CheckInModal and XPClaimModal to bottom sheet pattern
- [ ] **SCREEN-05**: Update skeleton loading and empty state colors to match new palette

### Animation

- [ ] **ANIM-01**: Replace bouncy animations with critically damped springs (damping 25-30, stiffness 300+)
- [ ] **ANIM-02**: Remove playful keyframe animations (float, xp-pop); mute pulse-glow
- [ ] **ANIM-03**: Ensure `prefers-reduced-motion` compliance via motion v12

### Cleanup & Deploy

- [ ] **CLEAN-01**: Delete all theme infrastructure (`src/themes/` directory, tailwind.config.js, legacy CSS rules)
- [ ] **CLEAN-02**: Final `tsc --noEmit` verification + full test suite pass
- [ ] **DEPLOY-01**: Service worker strategy for atomic design refresh release (force-update consideration)
- [ ] **DEPLOY-02**: Build "What's New" interstitial or update prompt for returning users

## v2 Requirements

Deferred to post-refresh.

### Advanced Visual
- **ADV-01**: OKLCH color space conversion
- **ADV-02**: Circular progress gauges (Whoop-style strain/recovery dials)
- **ADV-03**: Icon library evaluation (Phosphor thin weight)
- **ADV-04**: Storybook for component documentation

### Extended Testing
- **TEST-01**: Device matrix testing (iOS Safari, Android Chrome, desktop)
- **TEST-02**: Comprehensive offline mode testing post-refresh
- **TEST-03**: Cross-device sync testing
- **TEST-04**: WCAG AAA contrast compliance (beyond AA)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Coach dashboard redesign | Client experience only |
| New features or functionality | Visual refresh only, no behavior changes |
| Light mode | Dark-only, matches luxury gym aesthetic |
| Native mobile app | Still PWA |
| Marketing site | App screens only |
| Data/store changes | Zero state changes that could affect user data |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1: Foundation | Complete |
| FOUND-02 | Phase 1: Foundation | Complete |
| FOUND-03 | Phase 1: Foundation | Complete |
| FOUND-04 | Phase 1: Foundation | Complete |
| FOUND-05 | Phase 1: Foundation | Complete |
| FOUND-06 | Phase 1: Foundation | Complete |
| THEME-01 | Phase 2: Theme Removal | Complete |
| THEME-02 | Phase 2: Theme Removal | Complete |
| THEME-03 | Phase 2: Theme Removal | Complete |
| VIS-01 | Phase 3: Component Primitives | Pending |
| VIS-02 | Phase 3: Component Primitives | Pending |
| VIS-03 | Phase 3: Component Primitives | Pending |
| VIS-04 | Phase 3: Component Primitives | Pending |
| SCREEN-01 | Phase 4: Screen Refresh | Pending |
| SCREEN-02 | Phase 4: Screen Refresh | Pending |
| SCREEN-03 | Phase 4: Screen Refresh | Pending |
| SCREEN-04 | Phase 4: Screen Refresh | Pending |
| SCREEN-05 | Phase 4: Screen Refresh | Pending |
| ANIM-01 | Phase 5: Animation Refinement | Pending |
| ANIM-02 | Phase 5: Animation Refinement | Pending |
| ANIM-03 | Phase 5: Animation Refinement | Pending |
| CLEAN-01 | Phase 6: Cleanup | Pending |
| CLEAN-02 | Phase 6: Cleanup | Pending |
| DEPLOY-01 | Phase 7: Deploy | Pending |
| DEPLOY-02 | Phase 7: Deploy | Pending |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0

---
*Requirements defined: 2026-02-05*
*Last updated: 2026-02-05 -- Phase 2 requirements marked complete*
