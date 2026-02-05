# Project Research Summary

**Project:** Trained -- Luxury Fitness PWA Design Refresh
**Domain:** Design system overhaul (dual-theme removal + premium visual upgrade)
**Researched:** 2026-02-05
**Confidence:** HIGH

## Executive Summary

Trained is a production fitness PWA with ~90k followers that needs to evolve from a "playful gamified" aesthetic to an "Equinox/luxury gym" experience. The codebase carries a dual-theme system (Trained vs GYG) implemented through 394 `isTrained` ternary branches across 21 files, a ThemeProvider that injects CSS variables at runtime, and a four-layer token indirection chain (TypeScript object -> React context -> DOM API -> CSS variables -> Tailwind). The research is unambiguous: the highest-leverage move is collapsing this entire system into Tailwind v4's `@theme` directive, which replaces all four layers with a single CSS file that generates tokens at build time with zero runtime cost.

The existing stack (React 18, TypeScript, Vite, Tailwind, Framer Motion) is fundamentally sound -- no framework changes are needed. The refresh is a tooling modernization (Tailwind v3 to v4, framer-motion to motion) combined with a design-token simplification and a visual refinement pass. The core palette (`#0A0A0A` background, `#D55550` accent) is already within the premium range used by Whoop and Peloton. The problem is not the colors themselves but their application: too many glows, too-small border radii (4-6px vs the 12-16px premium standard), over-application of glass effects, bouncy animations, and excessive use of uppercase text. The visual refresh is about restraint -- reducing intensity across every dimension by 50-70%.

The primary risk is the 394-ternary extraction. Each branch must be resolved individually (not bulk-replaced), because some GYG branches actually contain the correct premium values (e.g., `rounded-2xl` from GYG vs `rounded-md` from Trained). Additionally, 67 hardcoded color values bypass the token system entirely and must be audited before any palette changes. The migration must be incremental and bottom-up: tokens first, then primitives, then composites, then screens, with theme infrastructure removed last. Deploying atomically is critical because the service worker will cache old assets, and users with `gyg` stored in localStorage will hit a nonexistent theme.

## Key Findings

### Recommended Stack

The existing stack stays. The refresh adds tooling for design system composition and modernizes two dependencies. See [STACK.md](./STACK.md) for full details.

**Upgrades:**
- **Tailwind CSS v3.4 -> v4.1**: CSS-first `@theme` directive replaces the entire JS token system (`tailwind.config.js`, `ThemeProvider.injectCSSVariables()`, `trained.ts` tokens). 5-10x faster builds. Zero runtime cost. Automated migration tool available.
- **framer-motion v11 -> motion v12**: Package rebrand. Same API, smaller bundle, better tree-shaking. Find-and-replace migration (`framer-motion` -> `motion/react`).
- **Self-hosted variable fonts via Fontsource**: Replace Google Fonts CDN links with `@fontsource-variable/inter`, `@fontsource-variable/oswald`, `@fontsource-variable/jetbrains-mono`. Eliminates render-blocking cross-origin requests, enables offline use (PWA requirement), version-locks fonts.

**New additions:**
- **tailwind-merge + clsx -> `cn()` utility**: Industry-standard pattern for composable Tailwind components. Prevents class conflicts when components accept `className` props.
- **class-variance-authority (CVA)**: Type-safe component variant definitions. Pairs with `cn()` to replace raw Tailwind template literals with structured variant APIs.

**Deletions:**
- `tailwind.config.js`, `postcss.config.js` (replaced by `@tailwindcss/vite` + `@theme`)
- `src/themes/gyg.ts` (GYG theme removed)
- Runtime CSS variable injection code

### Expected Features

The visual refresh targets a specific aesthetic: dark, restrained, Equinox-tier. See [FEATURES.md](./FEATURES.md) for the full feature landscape with brand reference colors.

**Must have (table stakes):**
- Layered dark surface hierarchy (3+ elevation levels, not flat black)
- Restrained accent color usage (max 5-10% of screen, one hue)
- Commanding typography with clear hierarchy (3-4 sizes max, weight-driven contrast)
- Generous spacing system (20-24px screen padding, 16-24px card padding)
- Subtle borders (rgba white at 6-10%, never visually prominent)
- Elevation through surface color, not heavy shadows
- Consistent icon treatment (Lucide at fixed sizes per context)

**Should have (differentiators):**
- Purposeful motion design (critically damped springs, 150-300ms, no bounce)
- Data-dense but uncluttered layouts (large number + small label pattern)
- Premium micro-interactions (felt, not seen -- brief scale pulses, smooth counters)
- Refined input/form design (subtle focus rings, generous touch targets)
- Bottom sheet pattern replacing center modals
- Skeleton loading aligned to new palette

**Defer to post-refresh:**
- OKLCH color space conversion (no user-visible benefit for existing palette)
- Circular progress gauges like Whoop (significant effort)
- Icon library swap to Phosphor (Lucide is fine)
- Storybook (premature for current team/component count)

**Anti-features to actively remove:**
- Neon/saturated glow effects on cards and buttons (keep for ONE hero element max)
- Glass effects on standard cards (solid surfaces only; keep glass for overlays)
- Excessive color variety (max 2 chromatic colors per screen)
- Bouncy/playful animations (replace with critically damped springs)
- Blanket uppercase on all headings (restrict to section headers and primary CTAs)
- Small border radii (4-6px -> 12-16px for cards)

### Architecture Approach

The migration is incremental and bottom-up, not big-bang. The dual-theme system has three consumption patterns (CSS variables, theme object properties, `isTrained` conditional branching) each requiring a different migration strategy. The ThemeProvider stays as a compatibility layer until the very end, then gets deleted in a clean sweep. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full file-by-file impact assessment.

**Major architectural layers (target state):**
1. **Design Tokens (CSS)** -- Single source of truth in `src/index.css` via Tailwind v4 `@theme`. No runtime injection. Pure CSS variables generated at build time.
2. **Design Constants (TypeScript)** -- Plain TS exports for Trained-specific labels, avatar stages, standing orders. No React context needed. `export const LABELS = { xp: 'DP', ... }`.
3. **Primitive Components** -- Button, Card, ProgressBar, Toast with no theme branching. Single styling path using CVA + `cn()`.
4. **Composite Components** -- Avatar, Navigation, XPDisplay, etc. Import constants directly.
5. **Screens** -- Use primitives + composites. No conditional branching.

**Key architectural decisions:**
- No new abstraction layer (no `DesignSystemProvider`, no `useDesignSystem()` hook)
- No "old design / new design" feature flag (recreates the dual-theme problem)
- De-branching and visual refresh are separate concerns, separate commits
- Theme files deleted last, not first

### Critical Pitfalls

See [PITFALLS.md](./PITFALLS.md) for the complete 14-pitfall analysis with code-level details.

1. **394-ternary extraction** -- Cannot bulk-replace. Some GYG branches contain the correct premium values. Must resolve component-by-component with visual verification. **Prevent by:** migration checklist per file, before/after screenshots, shared components first.
2. **67 hardcoded colors bypassing tokens** -- `text-white`, inline `rgba()`, hex values in 16 files. These will not update when the palette changes. **Prevent by:** audit and replace ALL hardcoded colors BEFORE changing any token values.
3. **Dark-mode contrast traps** -- Luxury aesthetics push toward low contrast. `#888888` secondary text on `#0A0A0A` is 6.8:1 (passing), but further dimming fails WCAG. **Prevent by:** build a contrast matrix for all foreground/background pairs before any implementation.
4. **Service worker caching old design** -- PWA users will see old CSS until SW updates. Users with `gyg` in localStorage will hit a nonexistent theme. **Prevent by:** atomic deploy, localStorage migration on boot, prominent update prompt.
5. **Typography swap layout explosions** -- Oswald is condensed. Any font change alters every text element's physical dimensions. Navigation labels and buttons are already tight. **Prevent by:** change fonts AFTER layout/spacing changes, test on 375px viewport, add text-overflow safety nets.

## Implications for Roadmap

Based on combined research, the refresh should be structured in 7 phases. The ordering is driven by dependency chains identified across all four research files. Violating the order causes pitfalls to compound.

### Phase 1: Foundation -- Token System + Tailwind v4 Migration
**Rationale:** Everything downstream depends on the token values and the build tooling. Tailwind v4 migration is the enabler for the entire `@theme` token architecture. This must come first.
**Delivers:** New CSS-first token system, Tailwind v4 + Vite plugin, `cn()` utility, CVA installed, self-hosted fonts, `motion` package upgrade.
**Addresses:** Surface hierarchy (FEATURES table stakes #1), border radius scale (FEATURES table stakes #5, anti-feature #8), spacing system (FEATURES table stakes #4), shadow definitions (FEATURES table stakes #6).
**Avoids:** FOUC from mismatched token sources (PITFALLS #10), hardcoded color drift (PITFALLS #2), legacy alias confusion (PITFALLS #14).
**Key tasks:**
- Run `npx @tailwindcss/upgrade` automated migration
- Define complete `@theme` block in `index.css` with new premium tokens
- Audit and replace 67 hardcoded color values with token references
- Build WCAG contrast matrix for all color pairings
- Create `src/lib/cn.ts` utility
- Install CVA, tailwind-merge, clsx, fontsource packages
- Upgrade framer-motion to motion (find-and-replace imports)

### Phase 2: Theme System Removal -- De-branch + Simplify
**Rationale:** The 394 `isTrained` ternaries are the core migration work. They block all visual refresh work because every component has two code paths. This must be completed before any visual design changes to keep concerns separated.
**Delivers:** Single-path codebase with no theme branching, GYG theme deleted, ThemeProvider stripped to compatibility shim, test utilities updated.
**Addresses:** Architecture target state (all 5 layers from ARCHITECTURE.md).
**Avoids:** 394-ternary extraction errors (PITFALLS #1), ghost theme code (PITFALLS #3), test suite coupling (PITFALLS #9), localStorage collision (PITFALLS #13).
**Key tasks:**
- Lock theme to "trained" (remove toggle from Settings)
- De-branch primitives: Button (4), Card (3), ProgressBar (3), Toast (6)
- De-branch composites: Navigation (3), Avatar (8), StreakDisplay (13), XPDisplay (6), Badges (21), BadgeUnlockModal (18)
- De-branch screens in complexity order: Workouts (14) -> AccessGate (32) -> CheckInModal (23) -> XPClaimModal (38) -> Settings (38) -> AvatarScreen (33) -> Home (45) -> Onboarding (63)
- Replace `useTheme()` with direct constant imports
- Remove ThemeProvider from App.tsx
- Delete `src/themes/gyg.ts`, simplify types
- Add localStorage migration for `app-theme` key
- Update `src/test/utils.tsx`

### Phase 3: Visual Refresh -- Component Primitives
**Rationale:** With tokens set and branching removed, primitives can be redesigned with CVA variants. These are the building blocks every screen depends on.
**Delivers:** Premium-styled Button, Card, ProgressBar, Toast, input components with CVA variant APIs.
**Addresses:** Restrained accent usage (FEATURES table stakes #2), subtle borders (FEATURES table stakes #5), elevation through surface color (FEATURES table stakes #6), refined inputs (FEATURES differentiator #4).
**Avoids:** Border radius inconsistency (PITFALLS #11), glassmorphism removal breaking hierarchy (PITFALLS #12).
**Key tasks:**
- Implement CVA variants for each primitive
- Increase border radii to premium scale (12-16px cards, 8-12px buttons, pill progress bars)
- Replace glass effects on cards with solid surfaces + subtle borders
- Refine focus rings and input styling
- Strip/mute glow classes (keep ONE hero glow utility)

### Phase 4: Visual Refresh -- Screens
**Rationale:** With clean primitives, screens can be refreshed to apply the premium aesthetic. Order by complexity, low to high.
**Delivers:** All screens updated with premium typography, spacing, layout, and data density patterns.
**Addresses:** Typography hierarchy (FEATURES table stakes #3), generous spacing (FEATURES table stakes #4), data-dense layouts (FEATURES differentiator #2), bottom sheet pattern (FEATURES differentiator #5).
**Avoids:** Typography layout explosions (PITFALLS #4) by testing on constrained viewports as each screen is updated.
**Key tasks:**
- Establish type scale and apply across all screens
- Fix uppercase overuse (restrict to section headers and primary CTAs)
- Convert CheckInModal and XPClaimModal to bottom sheets
- Apply large-number + small-label pattern for metric displays
- Ensure 20-24px screen padding, generous card padding
- Verify skeleton loading colors match new palette

### Phase 5: Animation Refinement
**Rationale:** Animations depend on the final color palette (glow colors, shadow colors) and font metrics. They must come after visual changes are settled.
**Delivers:** Premium motion system -- critically damped springs, restrained micro-interactions, no playful residue.
**Addresses:** Purposeful motion design (FEATURES differentiator #1), micro-interaction quality (FEATURES differentiator #3).
**Avoids:** Animation budget mismatch (PITFALLS #7) by having an animation style guide before touching individual components.
**Key tasks:**
- Create animation style guide (duration: 150-300ms, easing: ease-out/tight spring, scale: 0.97-1.02)
- Audit all 5 Tailwind keyframe animations (pulse-glow, float, xp-pop, shimmer, pulse-slow)
- Remove float and xp-pop animations
- Replace pulse-glow with subtle fade
- Reduce nav indicator scale from 1.1 to 1.03
- Ensure `prefers-reduced-motion` compliance via motion v12

### Phase 6: Infrastructure Cleanup
**Rationale:** Final sweep to remove all dead code, legacy files, and compatibility shims. Doing this as a discrete phase prevents premature deletion that causes cascading import errors.
**Delivers:** Clean codebase with no theme remnants, minimal config surface area.
**Key tasks:**
- Delete `src/themes/` directory entirely (move retained constants to `src/design/constants.ts`)
- Delete `tailwind.config.js` (if not already removed by v4 migration)
- Remove legacy Tailwind color aliases
- Remove `.theme-trained` / `.theme-gyg` CSS scoped rules
- Remove `injectCSSVariables()` and all runtime token injection
- Final `tsc --noEmit` verification
- Run full test suite

### Phase 7: Deploy Preparation
**Rationale:** The redesign is dramatic enough to require user communication and PWA-specific deployment strategy.
**Delivers:** Atomic release with service worker strategy, user communication, and rollback plan.
**Addresses:** User perception concerns (PITFALLS #8).
**Avoids:** Service worker caching old design (PITFALLS #6).
**Key tasks:**
- Build "What's New" interstitial screen
- Verify service worker update flow (consider force-update for this release)
- Verify Vite content hashes on all assets
- Announce redesign via social channels before deploy
- Deploy as single atomic release
- Monitor Sentry for theme-related errors post-deploy

### Phase Ordering Rationale

- **Tokens before de-branching**: Token audit catches hardcoded colors that would silently drift. The `@theme` migration establishes the single source of truth that all subsequent work builds on.
- **De-branching before visual refresh**: Separating "remove old code paths" from "apply new design" makes regressions attributable. If something looks wrong after de-branching, it is a bug. If something looks wrong after visual refresh, it is a design decision to evaluate.
- **Primitives before screens**: Bottom-up ensures that when you refresh a screen, every component it uses is already clean and styled correctly.
- **Animation last (before deploy)**: Animations depend on final colors, typography metrics, and component structure. Changing them alongside other dimensions makes evaluation impossible.
- **Infrastructure cleanup as its own phase**: Avoids the temptation to delete files prematurely, which causes cascading import errors.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (Tailwind v4 migration):** The automated migration tool handles most renames, but shadow/radius/blur utility changes in v4 need manual review. Tailwind v4's `@theme` `@keyframes` nesting behavior should be verified.
- **Phase 4 (Screen refresh):** Bottom sheet implementation pattern needs research -- whether to use a library (e.g., vaul) or build with motion. Data-dense layout patterns need screen-specific design decisions.
- **Phase 5 (Animation refinement):** Spring physics tuning values (stiffness, damping) need per-component experimentation. No research can prescribe exact values.

Phases with standard patterns (skip research-phase):
- **Phase 2 (Theme removal):** Purely mechanical -- resolve ternaries, delete dead code. No external patterns needed.
- **Phase 3 (Primitive visual refresh):** CVA + cn() pattern is well-documented (shadcn/ui reference).
- **Phase 6 (Cleanup):** Straightforward file deletion and import cleanup.
- **Phase 7 (Deploy):** Standard PWA deployment with service worker considerations already documented in PITFALLS.md.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All recommendations verified against official docs (Tailwind v4, Motion, Fontsource, CVA). Automated migration tools exist. |
| Features | MEDIUM-HIGH | Cross-referenced against Whoop, Peloton, Equinox brand palettes and Material Design dark theme docs. Feature priorities are well-grounded but specific token values (radius, spacing) need per-component tuning. |
| Architecture | HIGH | Based on direct codebase analysis -- file-by-file `isTrained` counts, consumption pattern inventory, dependency ordering. No external assumptions. |
| Pitfalls | HIGH | 14 pitfalls identified from codebase analysis + dark mode accessibility research + PWA deployment patterns. Phase-specific warnings are actionable. |

**Overall confidence:** HIGH

### Gaps to Address

- **Exact Fontsource variable font registered names**: Fontsource packages register with a "Variable" suffix (e.g., `'Inter Variable'`). Verify exact names after `npm install` before updating `@theme` font references.
- **Typography scale validation**: The recommended type scale (36-48px display, 24-28px H1, etc.) is based on design conventions, not project-specific testing. Needs validation on actual screens, especially on 375px mobile viewport.
- **Animation spring values**: Stiffness/damping recommendations (300/30) are starting points. Per-component tuning required during Phase 5.
- **Bottom sheet implementation**: Whether to use a library like vaul or build custom with motion needs a decision during Phase 4 planning.
- **Copy review**: Many `isTrained` branches contain Trained-specific copy that references the discipline/BDSM metaphor. A copy review pass should happen during Phase 2 to flag language that may not fit the new premium positioning.
- **WCAG contrast matrix**: Must be built as the first task of Phase 1 before any token values are committed. Not yet created.

## Sources

### Primary (HIGH confidence)
- [Tailwind CSS v4 Official Docs](https://tailwindcss.com/docs) -- `@theme`, upgrade guide, Vite plugin
- [Motion (formerly Framer Motion)](https://motion.dev/) -- upgrade guide, React API, reduced motion
- [Fontsource](https://fontsource.org/) -- Inter, Oswald, JetBrains Mono variable font packages
- [CVA Documentation](https://cva.style/docs) -- variant API, Tailwind integration
- [WHOOP Developer Design Guidelines](https://developer.whoop.com/docs/developing/design-guidelines/) -- premium fitness design reference
- [Material Design Dark Theme](https://m2.material.io/design/color/dark-theme.html) -- surface elevation system
- Direct codebase analysis -- 394 `isTrained` ternaries, 67 hardcoded colors, 321 motion usages

### Secondary (MEDIUM confidence)
- [Peloton Brand Colors (Mobbin)](https://mobbin.com/colors/brand/peloton) -- premium fitness color reference
- [Smashing Magazine - Inclusive Dark Mode](https://www.smashingmagazine.com/2025/04/inclusive-dark-mode-designing-accessible-dark-themes/) -- contrast and accessibility
- [NN/G - Dark Mode Users and Issues](https://www.nngroup.com/articles/dark-mode-users-issues/) -- user perception of redesigns
- [DebugBear - Web Font Layout Shift](https://www.debugbear.com/blog/web-font-layout-shift/) -- typography swap risks

### Tertiary (LOW confidence -- verify before acting)
- [Tailwind v4 Real-World Migration Steps (dev.to)](https://dev.to/mridudixit15/real-world-migration-steps-from-tailwind-css-v3-to-v4-1nn3) -- single community source
- Fontsource variable font naming conventions -- verify exact registered names after install
- Animation spring tuning values -- starting points only, need per-component validation

---
*Research completed: 2026-02-05*
*Ready for roadmap: yes*
