# Technology Stack: Design System Refresh

**Project:** Trained -- Luxury Fitness PWA Design Refresh
**Researched:** 2026-02-05
**Mode:** Ecosystem (Stack dimension)
**Overall confidence:** HIGH

---

## Executive Summary

The existing Trained stack (React 18, TypeScript, Vite, Tailwind CSS 3.4, Framer Motion 11) is fundamentally sound for a luxury dark-mode design system. The refresh does NOT require a framework change -- it requires a tooling modernization (Tailwind v3 to v4, framer-motion to motion) and a design-token simplification (remove dual-theme machinery, flatten to single-brand CSS-first tokens).

The current dual-theme system (ThemeProvider, `injectCSSVariables`, `trained.ts` token objects) is over-engineered for a single-brand app. Tailwind v4's `@theme` directive replaces all of this with pure CSS -- no runtime JS, no context, no `setProperty` calls. This is the single highest-leverage change in the refresh.

---

## Recommended Stack

### Upgrade: Tailwind CSS v3.4 to v4.1

| Detail | Value |
|--------|-------|
| **Package** | `tailwindcss` ^4.1.18 |
| **Vite plugin** | `@tailwindcss/vite` (replaces postcss + autoprefixer setup) |
| **Why** | CSS-first `@theme` directive replaces entire JS token system. 5-10x faster builds. Native CSS variable generation. No more `tailwind.config.js`. |
| **Confidence** | HIGH -- verified via official docs (tailwindcss.com/docs) |

**What changes:**
- Delete `tailwind.config.js` entirely
- Delete `postcss.config.js` (if present) and uninstall `autoprefixer` + `postcss`
- Replace `@tailwind base/components/utilities` with `@import "tailwindcss"`
- Define all design tokens via `@theme { }` in CSS
- Vite plugin handles everything: `@tailwindcss/vite` in `vite.config.ts`

**Migration risk:** MODERATE. Tailwind provides an automated upgrade tool (`npx @tailwindcss/upgrade`). The main risk is utility renames (shadow, radius, blur scales now require named values) and the CSS variable syntax change (`bg-[var(--x)]` becomes `bg-(--x)`). The existing CSS variable approach maps cleanly to `@theme` -- this is actually easier than most migrations because the project already uses CSS custom properties.

**Browser support:** Chrome 111+, Safari 16.4+, Firefox 128+. This is fine for a PWA targeting modern mobile devices.

**Sources:**
- [Tailwind CSS v4.0 announcement](https://tailwindcss.com/blog/tailwindcss-v4)
- [Tailwind CSS v4 Vite installation](https://tailwindcss.com/docs)
- [Tailwind CSS v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide)
- [Tailwind CSS @theme documentation](https://tailwindcss.com/docs/theme)

### Upgrade: framer-motion to motion

| Detail | Value |
|--------|-------|
| **Package** | `motion` ^12.31 (replaces `framer-motion` ^11.0.8) |
| **Why** | Framer Motion rebranded to Motion. New package is smaller, faster, and actively maintained under `motion` namespace. Same API, better tree-shaking. |
| **Confidence** | HIGH -- verified via motion.dev and npm |

**What changes:**
- Replace `npm install framer-motion` with `npm install motion`
- Change all imports from `framer-motion` to `motion/react`
  ```typescript
  // Before
  import { motion, AnimatePresence } from 'framer-motion'
  // After
  import { motion, AnimatePresence } from 'motion/react'
  ```
- API is identical. This is a find-and-replace migration.

**Sources:**
- [Motion upgrade guide](https://motion.dev/docs/react-upgrade-guide)
- [motion npm package](https://www.npmjs.com/package/motion)

### Add: Class Merging Utilities

| Package | Version | Purpose | Why |
|---------|---------|---------|-----|
| `tailwind-merge` | ^3.4.0 | Intelligent Tailwind class deduplication | Prevents style conflicts when composing component variants. Required for any component that accepts `className` props. Supports Tailwind v4. |
| `clsx` | ^2.1.1 | Conditional className construction | Tiny (239B), zero-dep. Handles conditional/array class composition. Stable (no updates needed -- it is feature-complete). |

**Create a `cn()` utility:**
```typescript
// src/lib/cn.ts
import { twMerge } from 'tailwind-merge'
import clsx, { type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

This is the industry-standard pattern (used by shadcn/ui, Radix, etc.) for building composable Tailwind components. Every component in the design system should use `cn()` instead of raw template literals.

**Confidence:** HIGH -- widely adopted, well-documented pattern.

**Sources:**
- [tailwind-merge npm](https://www.npmjs.com/package/tailwind-merge)
- [clsx npm](https://www.npmjs.com/package/clsx)

### Add: Component Variant Management (CVA)

| Package | Version | Purpose | Why |
|---------|---------|---------|-----|
| `class-variance-authority` | ^0.7 | Type-safe component variant definitions | Provides a structured API for defining component variants (size, intent, state) with full TypeScript inference. Pairs with `cn()`. |

**Why CVA over Tailwind Variants:** CVA is framework-agnostic and simpler. Tailwind Variants adds Tailwind-specific responsive slot features that add complexity without value for this project. CVA + `cn()` covers all needs.

**Example usage for the design system:**
```typescript
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const button = cva(
  'inline-flex items-center justify-center font-heading uppercase tracking-wider transition-all',
  {
    variants: {
      intent: {
        primary: 'bg-primary text-text-on-primary hover:bg-primary-hover',
        secondary: 'bg-surface border border-border text-text-primary hover:bg-surface-elevated',
        ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      intent: 'primary',
      size: 'md',
    },
  }
)
```

**Confidence:** HIGH -- standard approach, verified via cva.style docs.

**Sources:**
- [CVA documentation](https://cva.style/docs)
- [CVA + Tailwind CSS example](https://cva.style/docs/examples/react/tailwind-css)

### Upgrade: Self-Hosted Variable Fonts via Fontsource

| Package | Version | Purpose | Why |
|---------|---------|---------|-----|
| `@fontsource-variable/inter` | latest | Body font (variable, 100-900 weights) | Self-hosted = no Google CDN dependency. Faster TTFB, offline-capable (critical for PWA). Single file covers all weights. |
| `@fontsource-variable/oswald` | latest | Heading font (variable, 200-700 weights) | Same benefits. Oswald is already the heading font -- this just self-hosts it. |
| `@fontsource-variable/jetbrains-mono` | latest | Mono font (variable, 100-800 weights) | Used for numeric displays (DP counters, stats). Self-hosting for consistency. |

**What changes:**
- Remove Google Fonts `<link>` tags from `index.html` (if present)
- Add imports in entry file:
  ```typescript
  // src/main.tsx
  import '@fontsource-variable/inter'
  import '@fontsource-variable/oswald'
  import '@fontsource-variable/jetbrains-mono'
  ```
- Vite bundles the WOFF2 files automatically. No CDN, no FOUT, no render-blocking requests.

**Why variable fonts specifically:** A single variable font file (approx 100-120KB per family in WOFF2) replaces multiple static weight files. Inter variable = ~110KB for all weights vs ~250KB for 5 static weights. For a PWA that caches aggressively, this is a meaningful win.

**Why self-host over Google Fonts CDN:**
1. **Performance:** Eliminates render-blocking cross-origin request + DNS lookup
2. **Privacy:** No Google tracking (fonts.googleapis.com logs requests)
3. **Reliability:** Works offline (PWA requirement)
4. **Version stability:** Google silently updates font files; Fontsource is version-locked via npm

**Confidence:** HIGH -- Fontsource is the standard approach for React/Vite apps, verified via fontsource.org.

**Sources:**
- [Fontsource Inter install](https://fontsource.org/fonts/inter/install)
- [Fontsource Oswald](https://fontsource.org/fonts/oswald)
- [Fontsource JetBrains Mono](https://fontsource.org/fonts/jetbrains-mono/install)
- [2025 Web Almanac - Fonts](https://almanac.httparchive.org/en/2025/fonts)

---

## Design Token Architecture: The Core Recommendation

This is the most important section. The current system has four layers of indirection:

1. `trained.ts` defines tokens as a TypeScript object
2. `ThemeProvider` reads the object and calls `document.documentElement.style.setProperty()` for each token at runtime
3. `tailwind.config.js` maps CSS variables to Tailwind utility names
4. `index.css :root` duplicates the same values as CSS fallbacks

**This entire stack collapses into a single CSS file with Tailwind v4's `@theme`.**

### Recommended: Single-File Token System

```css
/* src/index.css -- the ONLY place tokens are defined */
@import "tailwindcss";

@theme {
  /* === Color Palette === */

  /* Backgrounds */
  --color-background: #0A0A0A;
  --color-surface: #141414;
  --color-surface-elevated: #1C1C1C;
  --color-border: #2A2A2A;

  /* Primary -- blood red accent */
  --color-primary: #D55550;
  --color-primary-hover: #E0605A;
  --color-primary-muted: rgba(213, 85, 80, 0.15);

  /* Secondary -- gunmetal */
  --color-secondary: #4A4A4A;
  --color-secondary-hover: #5C5C5C;

  /* Text */
  --color-text-primary: #E8E8E8;
  --color-text-secondary: #888888;
  --color-text-accent: #E0605A;
  --color-text-on-primary: #FFFFFF;

  /* Status */
  --color-success: #4CAF50;
  --color-warning: #D4A843;
  --color-error: #D55550;
  --color-info: #3A5A7A;

  /* XP/Gamification */
  --color-xp-bar: #D55550;
  --color-xp-bar-bg: #1C1C1C;
  --color-streak-active: #D55550;
  --color-streak-inactive: #2A2A2A;

  /* Glass layers */
  --color-glass-light: rgba(255, 255, 255, 0.05);
  --color-glass-medium: rgba(255, 255, 255, 0.08);
  --color-glass-heavy: rgba(255, 255, 255, 0.12);

  /* === Typography === */
  --font-heading: 'Oswald', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* === Border Radius === */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-2xl: 16px;
  --radius-card: 6px;

  /* === Shadows === */
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.4);
  --shadow-modal: 0 8px 32px rgba(0, 0, 0, 0.6);
  --shadow-glow: 0 0 20px rgba(213, 85, 80, 0.2);
  --shadow-glow-intense: 0 0 30px rgba(213, 85, 80, 0.4);

  /* === Animations === */
  --animate-pulse-glow: pulse-glow 2s ease-in-out infinite;
  --animate-float: float 3s ease-in-out infinite;
  --animate-shimmer: shimmer 2s linear infinite;

  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px var(--color-primary-muted); }
    50% { box-shadow: 0 0 40px var(--color-primary); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
}
```

**What this replaces:**
- `tailwind.config.js` -- DELETED
- `src/themes/trained.ts` tokens property -- tokens move to CSS
- `src/themes/types.ts` DesignTokens interface -- no TypeScript token interface needed
- `src/themes/index.ts` ThemeProvider CSS injection -- GUTTED (keep only labels/content, not tokens)
- The `injectCSSVariables()` function -- DELETED (Tailwind generates them)
- The `:root` block in `index.css` -- REPLACED by `@theme`

**What Tailwind v4 auto-generates from this:**
- Utility classes: `bg-background`, `text-text-primary`, `border-border`, `rounded-card`, `shadow-glow`, `font-heading`, `animate-shimmer`
- CSS variables: `var(--color-background)`, `var(--shadow-card)`, etc. on `:root`
- No runtime JavaScript. Pure CSS. Zero overhead.

**Confidence:** HIGH -- this is the documented, intended use of Tailwind v4's `@theme`.

### Keep Tailwind's CSS Variable Approach -- But Simplify It

**Answer to the key question: "Should we keep Tailwind's CSS variable approach or simplify?"**

Keep CSS variables, but eliminate the JavaScript middleman. The current system:

```
trained.ts (JS object) -> ThemeProvider (runtime JS) -> document.style.setProperty (DOM API) -> CSS variables -> Tailwind utilities
```

Becomes:

```
index.css @theme (CSS) -> CSS variables + Tailwind utilities (build time, zero runtime)
```

The CSS variable approach is correct. It is how Tailwind v4 works natively. What was wrong was the three-layer JS abstraction on top of it.

### OKLCH Color Space: Consider But Don't Require

OKLCH is the modern CSS color space gaining adoption in 2025-2026. Tailwind v4's built-in color palette already uses OKLCH internally. Benefits for a design system:

- **Perceptual uniformity:** Changing lightness by 10% feels visually consistent across hues
- **Better dark-mode palettes:** Adjusting L (lightness) creates natural dark/light variants
- **Future-proof:** Tailwind v4 uses OKLCH, browsers have 92%+ support

**Recommendation:** Keep the existing hex/rgba values for the initial refresh. Consider converting to OKLCH if/when the palette is redesigned from scratch. The hex values work perfectly fine in `@theme`. This is an optimization, not a requirement.

**Confidence:** MEDIUM -- OKLCH is well-supported but converting the existing palette is unnecessary work for no user-visible benefit right now.

**Sources:**
- [OKLCH guide](https://oklch.org/posts/ultimate-oklch-guide)
- [Evil Martians - OKLCH in CSS](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl)

---

## Premium Animation Strategy

Motion (v12) is the right tool. No additional animation libraries needed. For luxury feel:

### Micro-Interaction Patterns (using Motion)

| Pattern | Use Case | Implementation |
|---------|----------|----------------|
| Spring transitions | Button presses, card taps | `transition: { type: "spring", stiffness: 300, damping: 30 }` |
| Subtle scale on press | All tappable elements | `whileTap={{ scale: 0.97 }}` |
| Fade + slide on mount | Screen transitions, modal entry | `initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}` |
| Staggered children | List items, grid cards | `transition: { staggerChildren: 0.05 }` |
| Layout animations | Expanding cards, reordering | `layout` prop on motion components |
| Shared element transitions | Card to detail view | `layoutId="item-{id}"` |

### Luxury vs Playful Animation Guidelines

| Attribute | Playful (current) | Luxury (target) |
|-----------|-------------------|-----------------|
| Duration | 300-500ms | 150-250ms |
| Easing | Bouncy spring | Tight spring or ease-out |
| Scale range | 0.9 - 1.2 | 0.97 - 1.02 |
| Movement | Large (20-40px) | Subtle (4-12px) |
| Glow effects | Bright, pulsing | Dim, steady |
| Float animations | Noticeable bob | Barely perceptible drift |

The key insight: luxury feels **restrained**. Reduce every animation's intensity by 50-70% from the current values. Shorter durations, smaller movements, subtler glows.

### Reduced Motion Compliance

Motion v12 includes automatic reduced-motion fallbacks. Use `useReducedMotion()` for custom cases:

```typescript
import { useReducedMotion } from 'motion/react'

function PremiumCard() {
  const prefersReduced = useReducedMotion()
  return (
    <motion.div
      whileHover={prefersReduced ? {} : { y: -2 }}
      transition={{ duration: 0.15 }}
    />
  )
}
```

**Confidence:** HIGH -- Motion docs confirm reduced-motion support; animation guidelines based on established luxury UI design patterns.

---

## Typography System

### Font Stack (No Changes to Font Families)

The current font choices are appropriate for luxury fitness:

| Role | Font | Why It Works |
|------|------|-------------|
| Headings | Oswald | Condensed, uppercase, authoritative. Echoes Equinox/military aesthetic. |
| Body | Inter | Clean, highly legible at small sizes, excellent for data-dense UI. Variable font supports all needed weights. |
| Mono/Stats | JetBrains Mono | Clean for numeric displays, tabular nums support. |

### Typography Scale Recommendations

Define a constrained type scale in `@theme` (or via `@layer base` in the CSS):

| Level | Use | Size | Weight | Tracking |
|-------|-----|------|--------|----------|
| Display | Hero stats, XP totals | 36-48px | 700 | -0.02em |
| H1 | Screen titles | 24-28px | 700 | 0.05em |
| H2 | Section headers | 18-20px | 600 | 0.04em |
| H3 | Card titles | 16px | 600 | 0.03em |
| Body | Content text | 14-15px | 400 | 0 |
| Caption | Secondary info, timestamps | 12-13px | 400 | 0.01em |
| Overline | Labels, categories | 11-12px | 600 | 0.08em (uppercase) |

**Key luxury typography principles:**
- Headings in Oswald, always uppercase, with letter-spacing (tracking)
- Body text in Inter, normal case, comfortable line-height (1.5-1.6)
- Use font-weight contrast (400 body / 600-700 headings) instead of size contrast alone
- `font-variant-numeric: tabular-nums` on all number displays (already done via `.font-digital` class)

### Self-Hosting Setup

```typescript
// src/main.tsx -- add these imports at the top
import '@fontsource-variable/inter'
import '@fontsource-variable/oswald'
import '@fontsource-variable/jetbrains-mono'
```

Then reference in `@theme`:
```css
@theme {
  --font-heading: 'Oswald Variable', sans-serif;
  --font-body: 'Inter Variable', sans-serif;
  --font-mono: 'JetBrains Mono Variable', monospace;
}
```

Note: Fontsource variable font packages register with the "Variable" suffix by default. Verify exact registered names after installation.

**Confidence:** HIGH for self-hosting approach; MEDIUM for exact registered font names (verify after install).

---

## What to Keep (No Changes Needed)

| Technology | Version | Why Keep |
|------------|---------|----------|
| React | ^18.3.1 | Stable, no reason to upgrade to 19 for a design refresh |
| TypeScript | ~5.6 | Current, works well |
| Vite | ^5.4 | Solid build tool, Tailwind v4 Vite plugin works here |
| Zustand | ^4.5 | State management unrelated to design system |
| React Router | ^6.22 | Routing unrelated to design system |
| Lucide React | ^0.563 | Icon library -- consistent stroke-width, good for premium feel |
| Supabase | ^2.93 | Backend unrelated to design system |
| Sentry | ^10.38 | Error tracking unrelated to design system |

---

## What NOT to Use (and Why)

### Do NOT add a CSS-in-JS library (Styled Components, Emotion, Stitches)

The project uses Tailwind, which is the styling system. Adding CSS-in-JS creates two competing styling paradigms, increases bundle size, and adds runtime overhead. Tailwind v4 with `@theme` handles everything CSS-in-JS would provide (design tokens, theming, variants) with zero runtime cost.

### Do NOT add Radix Themes or shadcn/ui as a dependency

These are full component libraries with their own design opinions. The point of this refresh is to create a bespoke luxury aesthetic, not adopt someone else's component system. Use the same patterns (CVA + cn() + Tailwind) that shadcn/ui uses, but build your own components. shadcn/ui is a good architectural reference but should not be installed.

### Do NOT add Storybook (yet)

Storybook adds significant dev dependency weight and configuration complexity. For a small team working on a PWA, building and testing components directly in the app with hot reload is faster. Consider Storybook only if the component library grows beyond 20+ components or if external design collaboration is needed.

### Do NOT upgrade to Tailwind v4's OKLCH palette by default

The existing hex color palette has WCAG AA compliance baked in (noted in `trained.ts` comments). Converting to OKLCH changes the actual rendered colors. Keep the proven palette; only switch to OKLCH if redesigning colors from scratch.

### Do NOT add a separate animation library (GSAP, React Spring)

Motion (formerly Framer Motion) already handles everything needed for premium micro-interactions: spring physics, gesture detection, layout animations, AnimatePresence for mount/unmount. Adding GSAP duplicates capability and increases bundle size.

### Do NOT keep the ThemeProvider for token injection

With Tailwind v4 `@theme`, CSS variables are generated at build time. The ThemeProvider's `injectCSSVariables()` function becomes dead code. The ThemeProvider should be stripped down to only manage content data (the `labels`, `avatarStages`, `standingOrders` objects) -- NOT design tokens.

### Do NOT use Tailwind's `dark:` variant system

The app is dark-mode-only. There is no light mode. Using `dark:` prefixes everywhere is noise. Define the dark palette as the default palette in `@theme`. Every color IS the dark-mode color. No toggling, no variants, no media queries.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Styling | Tailwind v4 @theme | Stay on Tailwind v3 | v4 eliminates the entire JS config + ThemeProvider token system. Migration pays for itself. |
| Styling | Tailwind v4 @theme | CSS Modules | Loses utility-first DX, requires re-writing all component styles |
| Class merging | tailwind-merge + clsx | tailwind-variants | TV adds unnecessary complexity (responsive slots) for this project |
| Component variants | CVA | Tailwind Variants | CVA is simpler, framework-agnostic, pairs better with cn() |
| Animation | Motion (v12) | GSAP | Motion is already in the codebase, declarative React API |
| Animation | Motion (v12) | React Spring | Motion has better DX, gesture support, and layout animation |
| Font hosting | Fontsource (self-hosted) | Google Fonts CDN | PWA needs offline fonts. Self-hosted = faster, private, version-locked |
| Font hosting | Fontsource (self-hosted) | Manual WOFF2 files | Fontsource handles subsetting and provides npm-managed updates |
| Color space | Hex/RGBA (keep current) | OKLCH | No user-visible benefit for existing palette. Consider for future redesign. |

---

## Installation Plan

### Step 1: Remove old packages
```bash
npm uninstall autoprefixer postcss
```

### Step 2: Upgrade Tailwind
```bash
npm install tailwindcss@latest
npm install -D @tailwindcss/vite
```

### Step 3: Upgrade animation library
```bash
npm uninstall framer-motion
npm install motion
```

### Step 4: Add design system utilities
```bash
npm install tailwind-merge clsx class-variance-authority
```

### Step 5: Add self-hosted fonts
```bash
npm install @fontsource-variable/inter @fontsource-variable/oswald @fontsource-variable/jetbrains-mono
```

### Step 6: Run Tailwind migration tool
```bash
npx @tailwindcss/upgrade
```

Note: The migration tool handles most class renames automatically. Review the diff carefully -- particularly shadow, radius, and blur utilities that changed naming conventions in v4.

---

## Files to Delete After Migration

| File | Reason |
|------|--------|
| `tailwind.config.js` | Replaced by `@theme` in CSS |
| `postcss.config.js` (if exists) | Replaced by `@tailwindcss/vite` plugin |
| `src/themes/gyg.ts` | GYG theme being removed |

## Files to Significantly Refactor

| File | Change |
|------|--------|
| `src/index.css` | Replace `:root` + `@tailwind` directives with `@import "tailwindcss"` + `@theme { }` |
| `src/themes/index.ts` | Strip ThemeProvider to only manage labels/content, remove all CSS variable injection |
| `src/themes/trained.ts` | Keep only `labels`, `avatarStages`, `standingOrders` -- remove `tokens` property |
| `src/themes/types.ts` | Remove `DesignTokens` interface, simplify `AppTheme` type |
| `vite.config.ts` | Add `@tailwindcss/vite` plugin, remove PostCSS references |

## New Files to Create

| File | Purpose |
|------|---------|
| `src/lib/cn.ts` | The `cn()` utility (clsx + tailwind-merge) |

---

## Summary: Net Effect on Codebase

| Metric | Before | After |
|--------|--------|-------|
| Config files for styling | 3 (tailwind.config.js, postcss config, trained.ts tokens) | 1 (index.css @theme) |
| Runtime JS for theming | ThemeProvider + injectCSSVariables (~100 lines) | 0 lines (pure CSS) |
| Font loading | Google CDN (render-blocking, tracking) | Self-hosted WOFF2 (bundled, offline) |
| Animation package | framer-motion v11 (legacy name, larger) | motion v12 (modern, tree-shaken) |
| Component styling pattern | Raw Tailwind classes in template literals | CVA + cn() (type-safe variants) |
| Design token source of truth | Split across 4 files | Single CSS file |
| Class conflict resolution | None (manual) | tailwind-merge (automatic) |

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Tailwind v4 upgrade | HIGH | Official docs, widely adopted, automated migration tool |
| Motion (framer-motion) upgrade | HIGH | Official docs, same API, find-and-replace migration |
| Fontsource self-hosting | HIGH | Standard approach, npm packages verified, PWA-aligned |
| CVA + cn() pattern | HIGH | Industry standard (shadcn/ui, Radix), well-documented |
| @theme token architecture | HIGH | Core Tailwind v4 feature, officially documented |
| Typography scale values | MEDIUM | Based on established design patterns, not project-specific testing |
| Animation intensity guidelines | MEDIUM | Based on luxury UI design conventions, needs per-component tuning |
| OKLCH recommendation (defer) | MEDIUM | Well-supported technology, recommendation to defer is judgment call |

---

## Sources

### Verified (HIGH confidence)
- [Tailwind CSS v4.0 Release](https://tailwindcss.com/blog/tailwindcss-v4)
- [Tailwind CSS v4 Theme Variables](https://tailwindcss.com/docs/theme)
- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [Tailwind CSS v4 Vite Setup](https://tailwindcss.com/docs)
- [Motion (formerly Framer Motion)](https://motion.dev/)
- [Motion Upgrade Guide](https://motion.dev/docs/react-upgrade-guide)
- [Fontsource](https://fontsource.org/)
- [CVA Documentation](https://cva.style/docs)
- [tailwind-merge npm](https://www.npmjs.com/package/tailwind-merge)
- [clsx npm](https://www.npmjs.com/package/clsx)

### Cross-referenced (MEDIUM confidence)
- [OKLCH Color Space Guide](https://oklch.org/posts/ultimate-oklch-guide)
- [Evil Martians - OKLCH in CSS](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl)
- [2025 Web Almanac - Fonts](https://almanac.httparchive.org/en/2025/fonts)
- [Dark Mode UI Best Practices 2025](https://www.smashingmagazine.com/2025/04/inclusive-dark-mode-designing-accessible-dark-themes/)
- [Smashing Magazine - Accessible Dark Themes](https://www.smashingmagazine.com/2025/04/inclusive-dark-mode-designing-accessible-dark-themes/)

### Single-source (LOW confidence -- verify before acting)
- [Tailwind v4 Migration Real-World Steps](https://dev.to/mridudixit15/real-world-migration-steps-from-tailwind-css-v3-to-v4-1nn3)
- [Fontsource variable font naming conventions](https://fontsource.org/docs/getting-started/install) -- verify exact registered names after install
