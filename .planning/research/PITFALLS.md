# Design System Refresh Pitfalls

**Research Date:** 2026-02-05
**Context:** Visual overhaul of Trained fitness PWA from "playful gamified" to "Equinox/luxury gym" aesthetic. Removing dual-theme system (trained/gyg), moving to single dark premium theme. Production app with active users.

---

## Table of Contents

1. [The 298-Ternary Extraction Problem](#1-the-298-ternary-extraction-problem)
2. [67 Hardcoded Color Values Bypassing the Token System](#2-67-hardcoded-color-values-bypassing-the-token-system)
3. [Ghost Theme Code: Dead Branches After Removal](#3-ghost-theme-code-dead-branches-after-removal)
4. [Typography Swap Layout Explosions](#4-typography-swap-layout-explosions)
5. [Dark-Mode Contrast Traps: The Luxury Paradox](#5-dark-mode-contrast-traps-the-luxury-paradox)
6. [Service Worker Caching the Old Design](#6-service-worker-caching-the-old-design)
7. [Animation Budget Mismatch: Playful Residue in Premium Skin](#7-animation-budget-mismatch-playful-residue-in-premium-skin)
8. [The "Is It Broken?" User Perception Problem](#8-the-is-it-broken-user-perception-problem)
9. [Test Suite Coupling to Theme Branching](#9-test-suite-coupling-to-theme-branching)
10. [CSS Variable Flash on Initial Load (FOUC)](#10-css-variable-flash-on-initial-load-fouc)
11. [Border Radius Personality Disorder](#11-border-radius-personality-disorder)
12. [Glassmorphism Removal Breaking Visual Hierarchy](#12-glassmorphism-removal-breaking-visual-hierarchy)
13. [localStorage Theme Preference Collision](#13-localstorage-theme-preference-collision)
14. [Tailwind Config Legacy Aliases Creating Confusion](#14-tailwind-config-legacy-aliases-creating-confusion)

---

## Critical Pitfalls

Mistakes that cause rewrites, visible breakage for users, or multi-day delays.

---

### 1. The 298-Ternary Extraction Problem

**What goes wrong:** The codebase has 298 instances of `isTrained ? ... : ...` across 21 files. Every component uses `const isTrained = themeId === 'trained'` to branch styling. Removing the theme system means touching every single one of these ternaries. If you do this as a bulk find-and-replace, you will pick the wrong branch in some cases, silently introducing broken styling that only appears on specific screens or states.

**Specific code locations (highest density):**
- `Onboarding.tsx`: 37 ternaries across 11 sub-components
- `Home.tsx`: 40 ternaries
- `XPClaimModal.tsx`: 31 ternaries
- `AvatarScreen.tsx`: 32 ternaries
- `Settings.tsx`: 29 ternaries across 2 components

**Why it happens:** When you have a clear pattern (`isTrained ? A : B`), it feels safe to always pick branch A (since we are keeping "trained" and removing "gyg"). But some ternaries have the branches reversed, some have nested ternaries, and some branches reference GYG-only CSS classes that are actually the correct visual choice for the new premium look (like `rounded-2xl` from GYG vs `rounded-md` from trained).

**Warning signs:**
- You "finish" the migration but visual QA reveals wrong border radii, wrong font weights, or wrong hover states on 3-5 screens
- Components render but look subtly off -- spacing, padding, or glow effects differ from the design
- The Onboarding flow looks different from the rest of the app because it was migrated separately

**Prevention:**
1. Do NOT bulk-replace. Migrate component-by-component, visually verifying each one
2. For each ternary, decide based on the NEW design intent, not just "pick the trained branch"
3. Create a migration checklist tracking every file with `isTrained` count:
   ```
   [ ] Button.tsx (2 ternaries) - verified
   [ ] Card.tsx (1 ternary) - verified
   [ ] Navigation.tsx (2 ternaries) - verified
   ...
   ```
4. Migrate shared components (Button, Card, ProgressBar, Toast) FIRST because every screen depends on them
5. Take before/after screenshots of every screen as you migrate

**Phase relevance:** This is the CORE work of the design refresh. Must be Phase 1 or the earliest visual migration phase. Get the shared components right first, then screens.

---

### 2. 67 Hardcoded Color Values Bypassing the Token System

**What goes wrong:** Despite having a CSS variable token system, the codebase contains 67 hardcoded color references (`text-white`, `bg-black`, `#hex`, `rgba()`) across 16 files (25 in components, 42 in screens). When you update the token system's color palette, these hardcoded values will not change, creating visual inconsistencies -- some elements use the new palette while others retain old colors.

**Specific examples found in codebase:**
- `text-white` used directly instead of `text-text-primary` or `text-text-on-primary`
- Inline `rgba()` values in `WeightChart.tsx` (10 occurrences) for chart colors
- Hardcoded hex values in `Onboarding.tsx` (7 occurrences) and `Auth.tsx` (5 occurrences)
- `BadgeUnlockModal.tsx` has 9 hardcoded color values for particle/glow effects

**Warning signs:**
- After changing the token palette, certain text appears too bright or too dim compared to surrounding elements
- Chart colors clash with the new palette
- Modal overlays, particle effects, or glow effects still reference old accent colors
- Status/feedback colors feel inconsistent with the premium aesthetic

**Prevention:**
1. Before changing any token values, audit and replace all hardcoded colors:
   ```bash
   # Find all hardcoded colors in components and screens
   grep -rn "text-white\|bg-black\|bg-white\|#[0-9a-fA-F]\{3,8\}\|rgb(" src/components/ src/screens/
   ```
2. Replace each with the appropriate token reference: `text-white` -> `text-text-on-primary`, inline `rgba()` -> `var(--color-*)` with opacity
3. For chart colors (WeightChart.tsx), create dedicated chart tokens in the design system
4. Only THEN update the token values in the theme file

**Phase relevance:** This audit MUST happen before the token palette is changed. Schedule it as the first step of the token migration phase. If done after, you will need to re-audit to find the mismatches.

---

### 3. Ghost Theme Code: Dead Branches After Removal

**What goes wrong:** After removing the GYG theme and all `isTrained` ternaries, orphaned code remains: the `gyg.ts` theme file, the `ThemeProvider` toggle logic, theme-related localStorage keys, the `toggleTheme` function, theme-specific CSS classes (`.theme-trained`, `.theme-gyg`), and the `getStandingOrder()` utility that switches on theme context. If you leave this dead code in, it confuses future developers, adds bundle size, and can cause runtime errors if any remaining code path tries to access removed theme properties.

**Specific dead code locations after migration:**
- `src/themes/gyg.ts` - entire file
- `src/themes/index.ts` - `toggleTheme`, `themes` registry, `getDefaultTheme`, `THEME_STORAGE_KEY`, body class toggling
- `src/themes/types.ts` - `ThemeId` type union, theme registry typing
- `src/index.css` - `.theme-trained` and `.theme-gyg` scoped styles
- `src/screens/Settings.tsx` - theme toggle UI (uses `toggleTheme`)
- `tailwind.config.js` - legacy color aliases (`bg.primary`, `bg.secondary`, `accent.*`, `glass.*`)

**Warning signs:**
- TypeScript errors referencing `'gyg'` in union types after partial removal
- Bundle analyzer shows `gyg.ts` still included
- Settings screen has a broken or invisible theme toggle
- `localStorage.getItem('app-theme')` returning `'gyg'` for users who previously had that theme selected

**Prevention:**
1. Create a removal checklist ordered by dependency:
   - Remove Settings toggle UI first (it references `toggleTheme`)
   - Remove `gyg.ts` and update `themes` registry
   - Simplify `ThemeProvider` to just inject tokens (no switching logic)
   - Remove `ThemeId` union type, replace with simple constant
   - Clean CSS of `.theme-trained` / `.theme-gyg` scoped rules
   - Remove legacy Tailwind aliases
2. Run TypeScript compiler (`tsc --noEmit`) after each removal step to catch broken references
3. Search for string literals `'gyg'` and `'trained'` to find all references
4. Clean up localStorage: add migration code that removes the `app-theme` key on first load of new version

**Phase relevance:** Theme system removal should be its own discrete step AFTER tokens are finalized but BEFORE component migration. Removing the infrastructure first means components can be migrated without the branching overhead.

---

### 4. Typography Swap Layout Explosions

**What goes wrong:** The current Trained theme uses Oswald (condensed, uppercase headings) + Inter (body). Changing to a new font pairing for the luxury aesthetic will alter the physical dimensions of every text element. Oswald is significantly narrower than most fonts at the same size. If you swap to a wider heading font, text that currently fits on one line will wrap. Buttons that fit their labels will overflow. Cards with tight padding will break their layouts.

**Specific risk areas in this codebase:**
- Navigation labels (`text-[10px] uppercase tracking-wider`) -- already tight, any font change risks clipping
- Button text with `tracking-widest uppercase` -- Oswald is condensed, replacement will be wider
- `XPDisplay.tsx` with `font-mono tabular-nums` -- changing mono font affects number alignment
- All headings use `font-heading` via CSS variables -- a single token change affects every heading app-wide
- Onboarding screens have long motivational text that may reflow differently

**Warning signs:**
- Text wrapping where it didn't before, especially in buttons and navigation
- Numbers in XP/streak displays misaligning after font change
- Layout shifts visible on page load (CLS score degradation)
- Mobile screens where content now extends below the fold unexpectedly

**Prevention:**
1. Before changing fonts, document current text measurements for critical UI:
   - Navigation label widths
   - Button minimum widths
   - Card title line counts
   - XP/number display column widths
2. Use `font-display: swap` in `@font-face` to prevent FOIT (Flash of Invisible Text)
3. Configure fallback font metrics to match the new font as closely as possible using `size-adjust`, `ascent-override`, and `descent-override`
4. Add `text-overflow: ellipsis` and `overflow: hidden` as safety nets on constrained text
5. Test on mobile viewport widths (375px iPhone SE) where text overflow hits hardest
6. Change fonts AFTER layout/spacing changes, not before -- this way layout can accommodate new metrics

**Phase relevance:** Typography changes must come AFTER the component architecture is simplified (ternaries removed) but should be validated early with a prototype. Do not change fonts and colors simultaneously -- the visual diff becomes impossible to QA when both change at once.

---

### 5. Dark-Mode Contrast Traps: The Luxury Paradox

**What goes wrong:** Premium/luxury dark designs tend toward low contrast for aesthetic reasons -- muted colors, subtle borders, soft text. But WCAG AA requires 4.5:1 for normal text and 3:1 for large text. The existing Trained theme already pushes boundaries: `colorTextSecondary: '#888888'` on `colorBackground: '#0A0A0A'` yields approximately 6.8:1 (passing), but a luxury redesign that dims secondary text further (e.g., `#666666`) would drop to ~4.2:1 (barely passing) or fail. The trap: the design looks beautiful in Figma on a calibrated monitor but fails contrast checks and is illegible on low-brightness phone screens.

**Specific contrast risk areas in this codebase:**
- `colorTextSecondary` on `colorBackground` -- most commonly used for helper text, timestamps, labels
- `colorBorder: '#2A2A2A'` on `colorBackground: '#0A0A0A'` -- only 1.5:1 contrast, fine for decorative borders but risky if borders convey meaning
- `colorInfo: '#3A5A7A'` on dark backgrounds -- already low contrast (~3.5:1), will fail if made more muted
- Status colors (success, warning, error) must remain distinguishable on the dark surface
- `colorPrimaryMuted: 'rgba(213,85,80,0.15)'` -- semi-transparent tints may become invisible if background darkens

**Dark-mode-specific traps:**
1. **Pure black halation:** `#000000` backgrounds cause a halation effect for users with astigmatism (~33% of population) where light text appears to bleed/glow. The current `#0A0A0A` is close to pure black. Going darker is risky; `#121212` (Material Design recommendation) or the current value is safer
2. **Saturated colors on dark backgrounds:** Highly saturated colors (like the current `#D55550` primary red) can cause visual vibration against near-black. The luxury aesthetic typically desaturates slightly -- but desaturated colors are harder to see on dark backgrounds
3. **Disabled state invisibility:** Disabled elements (opacity-50) on dark backgrounds become nearly invisible. At 50% opacity, `#888888` text on `#0A0A0A` drops to about ~3.4:1
4. **Elevation through brightness:** Dark mode establishes hierarchy through surface brightness, not shadows. If all surfaces (`background`, `surface`, `surfaceElevated`) are too close in value, cards blend into the background

**Warning signs:**
- Secondary text becomes hard to read on mobile at half brightness
- Users report "can't see" certain UI elements
- Automated accessibility audit flags fail on text contrast
- Cards appear to "float" in Figma but look flat on actual devices
- Disabled buttons are indistinguishable from the background

**Prevention:**
1. Check EVERY color pairing with a contrast checker BEFORE implementing:
   - Text on background: 4.5:1 minimum
   - Large text on background: 3:1 minimum
   - Interactive element borders: 3:1 minimum
   - Create a contrast matrix of all foreground/background combinations
2. Use dark gray backgrounds, not pure black: `#0C0C0C` to `#141414` range
3. Maintain minimum brightness steps between surface levels:
   - background -> surface: at least 4-6 brightness points (e.g., `#0C0C0C` -> `#161616`)
   - surface -> surfaceElevated: at least 4-6 brightness points
4. Test on a physical phone at 30% brightness in a lit room -- this is where dark mode contrast failures become obvious
5. Use desaturated, lighter versions of accent colors rather than dimming them
6. Set disabled states to `opacity-40` minimum, never below, and add a visual indicator beyond just opacity (strikethrough, dashed border)

**Phase relevance:** Color token definition should be the FIRST design decision, validated against WCAG before any component work begins. Build a contrast reference sheet that every subsequent phase uses as a source of truth.

---

### 6. Service Worker Caching the Old Design

**What goes wrong:** Users running the installed PWA will have the old CSS, JavaScript, and design tokens cached by the service worker. When you deploy the visual redesign, users will continue seeing the old "playful" design until the service worker updates. Worse: if HTML updates but cached CSS does not (or vice versa), users may see a hybrid state -- new layout with old colors, or old layout with new fonts.

**This app's specific risk:**
- The app uses `registerType: 'prompt'` (good -- shows update UI) but the visual redesign is a dramatic change
- CSS variables are injected at runtime by `ThemeProvider` (which reads from JS bundle), so CSS and JS must update atomically
- Users with `localStorage.getItem('app-theme')` set to `'gyg'` will trigger a theme that no longer exists in the new code, potentially causing a crash or blank screen

**Warning signs:**
- Users report the app "looks weird" -- some elements updated, others did not
- JavaScript errors in Sentry: `themes[themeId]` returning undefined (for users with `gyg` stored)
- Screenshots from users showing a mix of old and new design
- Support requests spike on deploy day with "app won't load" or "everything looks wrong"

**Prevention:**
1. Add localStorage migration as the FIRST thing the new app does on boot:
   ```typescript
   // Run before ThemeProvider initialization
   const stored = localStorage.getItem('app-theme')
   if (stored === 'gyg') {
     localStorage.removeItem('app-theme')
     // or: localStorage.setItem('app-theme', 'trained')
   }
   ```
2. Make the service worker update prompt more prominent for this release -- possibly force-update rather than prompt, given the scale of changes
3. Deploy the visual redesign as a single atomic release, not incrementally -- a half-migrated design looks broken, not "in progress"
4. Set a cache-busting version on all assets (Vite does this automatically with content hashes, but verify `sw.js` itself is not cached)
5. Consider adding a "What's New" screen that fires once after the redesign deploys, explaining the visual changes

**Phase relevance:** Service worker strategy must be planned in the FIRST phase but executed in the FINAL phase (the deploy). The localStorage migration code must ship WITH the redesign, not before or after.

---

## Moderate Pitfalls

Mistakes that cause delays, rework, or technical debt.

---

### 7. Animation Budget Mismatch: Playful Residue in Premium Skin

**What goes wrong:** The current app uses Framer Motion extensively (321 `motion` usages across 29 files) with playful animations: bounce effects (`whileTap: { scale: 0.97 }`), floating animations (`float 3s ease-in-out infinite`), XP pop effects (`xp-pop`), glow pulses (`pulse-glow`), and shimmer effects. A luxury aesthetic requires restrained, purposeful motion -- slow fades, subtle scale transitions, ease-out-cubic timing. If you change colors and typography but keep the old animation patterns, the result feels like a luxury skin on a children's toy.

**Specific animation inventory:**
- `Button.tsx`: `whileTap: { scale: 0.97 }`, `whileHover: { scale: 1.02 }` -- slightly too bouncy for premium
- `Card.tsx`: `whileHover: { scale: 1.01, y: -2 }` -- card lift is fine for premium, but scale may be too much
- `Navigation.tsx`: `layoutId="nav-indicator"` with `animate: { scale: 1.1 }` -- nav bounce feels gamified
- `tailwind.config.js`: `pulse-glow`, `float`, `xp-pop`, `shimmer`, `pulse-slow` keyframes -- all coded for playful feel
- `index.css`: `.glow-primary`, `.glow-gold`, `.glow-green`, `.glow-primary-intense`, `.text-glow-primary` -- neon glow effects

**Warning signs:**
- New premium colors feel "wrong" but you cannot pinpoint why -- it is likely the animation style conflicting with the visual style
- Reviewers describe the app as "trying too hard" or "inconsistent personality"
- Glow effects that looked exciting with gold/amber now look garish with muted luxury colors
- XP pop animation feels juvenile when paired with sophisticated typography

**Prevention:**
1. Create an animation style guide for the new aesthetic BEFORE changing individual animations:
   - Duration: 150-300ms for micro-interactions (current is fine), 400-600ms for transitions
   - Easing: `ease-out` or `cubic-bezier(0.16, 1, 0.3, 1)` -- no bounce
   - Scale range: 0.98-1.02 max (current 0.97 is fine, but 1.1 on nav is too much)
   - Glow: remove or replace with subtle box-shadows using `rgba` with low alpha
   - Shimmer: replace with subtle fade or remove entirely
2. Audit all 5 Tailwind keyframe animations and decide keep/modify/remove for each
3. Reduce motion values in Framer Motion components: `{ scale: 1.1 }` -> `{ scale: 1.03 }` on nav
4. Replace `pulse-glow` with a gentler `fade-subtle` or remove
5. Remove the `float` and `xp-pop` animations -- they do not belong in a luxury aesthetic

**Phase relevance:** Animation changes should happen in a DEDICATED phase AFTER colors and typography are settled. Animations depend on the final color palette (glow colors, shadow colors) and font metrics (text animation sizing). Changing animations simultaneously with colors makes it impossible to evaluate either in isolation.

---

### 8. The "Is It Broken?" User Perception Problem

**What goes wrong:** Users who have the current version installed will update and see a dramatically different app. Without context, a visual overhaul can feel like something went wrong rather than an intentional improvement. Research from Nielsen Norman Group confirms that frequent redesigns erode trust, and users may report the new design as a "bug." This risk is amplified for a PWA where the update happens silently -- unlike an App Store update with release notes.

**This app's specific risk:**
- The audience (fitness users, 90k follower base) expects stability from a tool they use daily
- The shift from "playful gamified" to "luxury premium" changes the emotional register dramatically
- Labels may change (e.g., "Daily Quests" -> "Daily Assignments"), compounding the disorientation
- Users on the GYG theme will experience an even more dramatic shift (gold/amber -> dark premium)

**Warning signs:**
- Spike in "is the app broken?" messages on social media within hours of deploy
- App store reviews (if applicable) mentioning "what happened to my app"
- Increased bounce rate / decreased session time in analytics
- Support requests about missing features (that are there, but look different)

**Prevention:**
1. Ship a "What's New" interstitial that shows once on first load after redesign:
   - Show side-by-side of old vs new (or key highlights)
   - Frame as intentional upgrade: "We've elevated the experience"
   - Allow dismissal but make it prominent
2. Announce the redesign BEFORE deploying via social channels (the 90k follower base)
3. Keep navigation structure and feature placement identical -- only change visual treatment
4. Do NOT change functionality, labels, AND visuals simultaneously -- visual-only makes the change legible as intentional
5. Consider a brief changelog/banner in the Settings screen documenting the update

**Phase relevance:** User communication planning should happen in Phase 1 (planning) but execute in the FINAL phase (deploy). The "What's New" screen should be built as part of the last development phase.

---

### 9. Test Suite Coupling to Theme Branching

**What goes wrong:** The test utilities (`src/test/utils.tsx`) hard-code `defaultTheme="trained"` in the custom render wrapper. Existing component tests (Button, Card, ProgressBar) render with the trained theme. After removing the dual-theme system, these tests need updating -- but more critically, the tests are coupled to theme-specific class names and behaviors. If the Card test asserts `bg-surface border border-border` (trained branch) and you change Card to use different classes, tests break even though the component works correctly.

**Specific test files affected:**
- `src/components/Button.test.tsx`
- `src/components/Card.test.tsx`
- `src/components/ProgressBar.test.tsx`
- `src/test/utils.tsx` (render wrapper)
- `src/stores/workoutStore.test.ts` (may reference theme indirectly)
- `src/stores/macroStore.test.ts`
- `src/stores/xpStore.test.ts`

**Warning signs:**
- Tests pass before the redesign but fail after, even though the app works correctly visually
- CI/CD pipeline blocks deploy because of test failures on CSS class assertions
- Developers skip or delete tests to unblock the deploy, losing coverage

**Prevention:**
1. Update `src/test/utils.tsx` FIRST -- simplify the render wrapper to not use ThemeProvider at all (since there will be only one theme, tokens can be set directly)
2. Audit test assertions: replace theme-specific class name checks with behavioral checks (does the button respond to click? is the card interactive?) rather than visual class checks
3. If visual regression testing is desired, use screenshot comparison (Storybook + Chromatic or Percy) rather than asserting CSS classes
4. Run the full test suite as part of each component migration, not just at the end

**Phase relevance:** Test infrastructure updates should happen in the SAME phase as the theme system simplification, before component-level visual changes begin.

---

### 10. CSS Variable Flash on Initial Load (FOUC)

**What goes wrong:** The current architecture injects CSS variables via JavaScript (`injectCSSVariables()` in ThemeProvider's `useEffect`). This means there is a brief moment between HTML render and React hydration where the `:root` defaults from `index.css` are active. Currently this is fine because the defaults match the trained theme. But if you change the token values in the theme file without updating the `:root` defaults in `index.css`, users will see a flash of the old colors before the new ones are injected.

**Technical detail:**
```
Timeline:
1. Browser loads index.html
2. index.css loads -> :root variables applied (OLD defaults if not updated)
3. React bundle loads and executes
4. ThemeProvider mounts
5. useEffect fires -> injectCSSVariables() overwrites :root (NEW values)
```
Between steps 2 and 5, the old colors are visible. On fast connections this is <100ms. On slow connections or cold starts, this can be 500ms+ -- very visible as a color flash.

**Warning signs:**
- Brief flash of old accent colors on page load, especially noticeable on slower devices
- Users report "the app flashes red then changes" (or whatever the old primary color was)
- Core Web Vitals: increased CLS score from the color shift

**Prevention:**
1. ALWAYS update `index.css` `:root` defaults in sync with the theme file -- they must contain the new token values
2. Consider moving away from JS-injected CSS variables entirely now that there is only one theme -- put all values directly in `index.css` `:root`
3. If keeping JS injection (for potential future theming), set the `:root` defaults to match the only theme exactly
4. Test on throttled connection (Chrome DevTools -> Network -> Slow 3G) to catch flash

**Phase relevance:** This is a step in the token migration phase. When changing token values, update BOTH `src/themes/trained.ts` AND `src/index.css` `:root` block simultaneously.

---

### 11. Border Radius Personality Disorder

**What goes wrong:** The current system has two completely different border radius philosophies: Trained uses sharp/minimal (`4px`, `6px`, `6px`) while GYG uses rounded (`8px`, `12px`, `16px`). Components like Card and Button pick between these via `isTrained`. When migrating to the premium aesthetic, you must decide on a single radius system, but if different components are migrated at different times, some will have sharp corners while others have rounded corners, creating a visually incoherent state.

**Additional complexity in this codebase:**
- Tailwind config has `borderRadius.DEFAULT: 'var(--border-radius)'` plus hardcoded `'2xl': '16px'` and `'3xl': '24px'`
- Some components use Tailwind radius classes (`rounded-md`, `rounded-2xl`), others use the CSS variable
- The GYG theme's `16px` card radius and the hardcoded Tailwind `'2xl': '16px'` are the same value but from different sources

**Warning signs:**
- Cards with sharp corners next to buttons with rounded corners (or vice versa)
- Navigation bar with one radius style while content area uses another
- "It looks like two different apps" feedback during review

**Prevention:**
1. Decide the new border radius scale FIRST as a design decision:
   - Luxury/premium typically uses moderate radii: `6px` (small), `10px` (medium), `14px` (cards/modals)
   - NOT fully rounded (too playful) and NOT fully sharp (too brutalist)
2. Update the CSS variable tokens AND the Tailwind config simultaneously
3. Remove the hardcoded `'2xl'` and `'3xl'` Tailwind values -- everything should flow from tokens
4. Migrate ALL components' border radius in a SINGLE pass, not incrementally

**Phase relevance:** Border radius is part of the token definition phase. Decide the scale, update tokens, then enforce consistency in every component migration.

---

### 12. Glassmorphism Removal Breaking Visual Hierarchy

**What goes wrong:** The GYG theme uses glassmorphism (`.glass`, `.glass-elevated`, `.glass-subtle` classes) while Trained uses solid backgrounds. The `index.css` has 3 glass utility classes with `backdrop-filter: blur()`. If the new premium design does not use glassmorphism, removing it is straightforward. But if the premium design uses a DIFFERENT kind of glass (more subtle, less blurry), partial removal creates inconsistency. More critically, glassmorphism is how GYG establishes visual hierarchy (layers of translucency). Removing it without replacing the hierarchy mechanism makes everything look flat.

**Impact on this codebase:**
- `Card.tsx` uses `.glass`, `.glass-elevated`, `.glass-subtle` in the GYG branch
- `Button.tsx` uses `.glass` in ghost variant for GYG
- `index.css` has `.glass-input`, `.glass-overlay` classes used app-wide
- `.glass-overlay` for modals is shared between themes -- removing it breaks modal dimming

**Warning signs:**
- Cards blend into background after removing glass effects
- Modal overlays become either too opaque or too transparent
- The app feels "flat" compared to the current design even with good colors
- Input fields lose their visual boundary on dark backgrounds

**Prevention:**
1. Inventory every glass class usage and its PURPOSE (hierarchy, grouping, focus, overlay)
2. For each purpose, define the premium replacement:
   - Glass card -> solid surface with subtle border and shadow
   - Glass input -> solid surface with border, focus glow
   - Glass overlay -> keep (modal backdrop needs dimming regardless of theme)
3. Do NOT remove `.glass-overlay` -- it serves a functional purpose beyond aesthetics
4. Test every modal and overlay after changes

**Phase relevance:** Glass/surface treatment changes happen during the component migration phase, AFTER tokens are set. Do not remove glass classes from `index.css` until all component references are updated.

---

## Minor Pitfalls

Mistakes that cause annoyance, cleanup work, or small visual bugs.

---

### 13. localStorage Theme Preference Collision

**What goes wrong:** The app stores theme preference in `localStorage` under key `app-theme`. Users who had selected the GYG theme have `'gyg'` stored. The new code will not have a `'gyg'` theme. The `getInitialTheme()` function falls back to default if the stored value is not in the `themes` registry -- this is safe. But the stale `'gyg'` value persists in localStorage, and if you later reintroduce any theming feature, it could resurface.

**Warning signs:**
- No immediate breakage (fallback logic works), but `localStorage` pollution
- If future code reads `app-theme` without the fallback check, it gets an invalid value
- DevTools inspection shows stale theme data confusing debugging

**Prevention:**
1. Add a one-time migration on app boot that removes the `app-theme` key
2. Or: remove the `THEME_STORAGE_KEY` logic entirely since there will be only one theme
3. Clean up in the same PR that removes the theme system

**Phase relevance:** Part of the theme system removal phase. Minor but should not be forgotten.

---

### 14. Tailwind Config Legacy Aliases Creating Confusion

**What goes wrong:** The `tailwind.config.js` has "legacy color mappings for backward compatibility" including `bg.primary`, `bg.secondary`, `bg.card`, `accent.primary`, `accent.secondary`, `accent.success`, `accent.warning`, `accent.danger`, and `glass.*` colors. These aliases duplicate the primary token colors, creating two valid ways to reference the same color in Tailwind classes. During the redesign, developers may use the wrong alias, or the aliases may fall out of sync with the primary tokens.

**Warning signs:**
- `bg-bg-primary` and `bg-background` both work but might resolve differently if aliases are not updated
- Code review confusion: "should I use `bg-accent-primary` or `bg-primary`?"
- Aliases drift from actual token values if updated independently

**Prevention:**
1. Remove ALL legacy aliases in the same phase as the theme system removal
2. Search codebase for usage of legacy aliases before removal:
   ```bash
   grep -rn "bg-bg-\|bg-accent-\|bg-glass-\|text-accent-" src/
   ```
3. Replace any found usages with the canonical token class names
4. Simplify `tailwind.config.js` to only have the primary token mappings

**Phase relevance:** Part of the Tailwind config cleanup, which should happen during token migration phase.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation | Severity |
|---|---|---|---|
| Token/palette definition | Contrast failures in dark mode (#5) | Build contrast matrix before coding | Critical |
| Theme system removal | 298 ternaries need individual decisions (#1) | Component-by-component migration checklist | Critical |
| Theme system removal | Ghost code and dead branches (#3) | TypeScript compiler as verification tool | Moderate |
| Theme system removal | localStorage collision (#13) | Add migration code on boot | Minor |
| Token migration | CSS variable FOUC (#10) | Update index.css :root in sync with theme | Moderate |
| Token migration | Hardcoded colors bypassing tokens (#2) | Audit BEFORE changing token values | Critical |
| Token migration | Legacy Tailwind aliases (#14) | Remove aliases, search for usage | Minor |
| Typography changes | Layout explosions from font swap (#4) | Measure critical UI before/after, test mobile | Critical |
| Component visual migration | Border radius inconsistency (#11) | Migrate all radii in single pass | Moderate |
| Component visual migration | Glassmorphism removal (#12) | Inventory purpose of each glass class | Moderate |
| Animation overhaul | Playful residue in premium skin (#7) | Create animation style guide first | Moderate |
| Testing | Test suite coupling (#9) | Update test infra before component changes | Moderate |
| Deploy | Service worker caching old design (#6) | Atomic deploy + localStorage migration | Critical |
| Deploy | User perception of broken app (#8) | "What's New" interstitial + social announcement | Moderate |

---

## Recommended Phase Order Based on Pitfalls

The pitfall analysis suggests this phase ordering to minimize compounding risk:

1. **Token & Contrast Definition** -- Define the new color palette, typography, border radius, and spacing tokens. Validate all against WCAG contrast. Do NOT touch any components yet.
2. **Hardcoded Color Audit** -- Replace all 67 hardcoded color values with token references. This must happen before tokens change values.
3. **Theme System Simplification** -- Remove dual-theme infrastructure, `isTrained` ternaries, GYG theme file, localStorage cleanup. Update test utilities.
4. **Component Visual Migration** -- Apply new tokens to all components, screen by screen. Take before/after screenshots.
5. **Typography & Spacing** -- Change font pairing, test layout impact, fix overflow issues.
6. **Animation Refinement** -- Adjust motion values, remove playful effects, add premium micro-interactions.
7. **Deploy Preparation** -- Service worker strategy, "What's New" screen, user communication, atomic release.

The critical insight: **Steps 1-2 must happen before Step 3**, and **Step 3 must happen before Step 4**. Violating this order causes the pitfalls to compound.

---

## Sources

### Dark Mode & Accessibility
- [Inclusive Dark Mode: Designing Accessible Dark Themes - Smashing Magazine](https://www.smashingmagazine.com/2025/04/inclusive-dark-mode-designing-accessible-dark-themes/)
- [Dark Mode: Best Practices for Accessibility - DubBot](https://dubbot.com/dubblog/2023/dark-mode-a11y.html)
- [Dark Mode: How Users Think About It and Issues to Avoid - NN/G](https://www.nngroup.com/articles/dark-mode-users-issues/)
- [Offering a Dark Mode Doesn't Satisfy WCAG Color Contrast Requirements - BOIA](https://www.boia.org/blog/offering-a-dark-mode-doesnt-satisfy-wcag-color-contrast-requirements)
- [12 Principles of Dark Mode Design - Uxcel](https://uxcel.com/blog/12-principles-of-dark-mode-design-627)
- [Dark Mode in App Design: Principles & Tips - Ramotion](https://www.ramotion.com/blog/dark-mode-in-app-design/)
- [The Principles of Dark UI Design - Toptal](https://www.toptal.com/designers/ui/dark-ui-design)

### Typography & Layout Shift
- [Fixing Layout Shifts Caused by Web Fonts - DebugBear](https://www.debugbear.com/blog/web-font-layout-shift)
- [Web Fonts and the Dreaded Cumulative Layout Shift - Sentry Blog](https://blog.sentry.io/web-fonts-and-the-dreaded-cumulative-layout-shift/)
- [Optimizing Web Fonts: FOIT vs FOUT vs Font Display Strategies](https://talent500.com/blog/optimizing-fonts-foit-fout-font-display-strategies/)

### Design System Migration
- [Building a Unified Design System with React, Tailwind CSS, and Figma](https://medium.com/@roman_fedyskyi/building-a-unified-design-system-with-react-tailwind-css-and-figma-part-1-2e6dcf2a22b4)
- [How to Build a Design Token System for Tailwind That Scales Forever](https://hexshift.medium.com/how-to-build-a-design-token-system-for-tailwind-that-scales-forever-84c4c0873e6d)
- [Good Refactoring vs Bad Refactoring - Builder.io](https://www.builder.io/blog/good-vs-bad-refactoring)

### PWA Update & User Perception
- [Service Worker Updates - web.dev](https://web.dev/learn/pwa/update)
- [Taming PWA Cache Behavior - Infinity Interactive](https://iinteractive.com/resources/blog/taming-pwa-cache-behavior)
- [Redesign or Regress? How UX Changes Can Break Trust - CMSWire](https://www.cmswire.com/customer-experience/when-ux-design-undermines-customer-experience/)
- [Common Mistakes to Avoid in PWA UX Design - MoldStud](https://moldstud.com/articles/p-common-mistakes-to-avoid-in-pwa-user-experience-design-enhance-your-progressive-web-app)

### Animation
- [Reduce Bundle Size of Framer Motion - Motion.dev](https://motion.dev/docs/react-reduce-bundle-size)
- [Framer Motion Tips for Performance in React - TillItsDone](https://tillitsdone.com/blogs/framer-motion-performance-tips/)

### Codebase Analysis
- Direct analysis of `src/themes/`, `src/components/`, `src/screens/`, `tailwind.config.js`, `src/index.css`
- grep analysis: 298 `isTrained ?` ternaries across 21 files, 67 hardcoded color values across 16 files, 321 framer-motion usages across 29 files

---

*Research compiled: 2026-02-05*
