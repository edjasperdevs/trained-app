# Feature Landscape: Premium Visual Design for Fitness Apps

**Domain:** Luxury/premium fitness app visual design (Equinox+, Whoop, Peloton, Strava, PUSH)
**Researched:** 2026-02-05
**Overall confidence:** MEDIUM-HIGH (cross-referenced multiple brand guidelines, design system documentation, and design analysis sources)

---

## Table Stakes

Features users subconsciously expect from a premium fitness app. Missing any of these and the app immediately reads as "startup weekend project" rather than "Equinox-tier product."

### 1. Dark Surface Hierarchy (Not Flat Black)

**Why expected:** Every premium fitness app (Whoop, Peloton, Equinox+) uses a layered dark surface system, not a single flat dark color. Users associate surface depth with quality.

| Token | Hex | Purpose | Reference |
|-------|-----|---------|-----------|
| Background | `#0A0A0A` to `#0D0D0D` | Base layer, deepest | Whoop uses `#0B0B0B`, Peloton uses `#101113` |
| Surface | `#141414` to `#161618` | Cards, containers | Material dark theme recommends `#121212` as base, elevated surfaces lighter |
| Surface Elevated | `#1A1A1C` to `#1E1E1E` | Modals, popovers, active elements | Material 3 surface tint system |
| Surface Hover/Active | `#222224` to `#2A2A2A` | Interactive feedback states | |
| Border | `#1E1E1E` to `#262626` | Subtle separation, not heavy outlines | Premium apps use borders at ~8-12% white opacity, never harsh lines |

**Key rule:** Each elevation step should be approximately +6 to +10 lightness units apart. The jumps should be perceivable but never jarring.

**Confidence:** HIGH (verified against Whoop developer guidelines, Peloton brand colors on Mobbin, Material Design dark theme documentation)

### 2. Restrained Accent Color

**Why expected:** Premium apps use ONE accent color, sparingly. Whoop: red `#FF0100`. Peloton: cardinal `#C41F2F`. Equinox: black/white with minimal accent. Strava: orange `#FC4C02`.

| Property | Specification | Notes |
|----------|---------------|-------|
| Primary accent | Single hue, used for CTAs and active states only | Current `#D55550` is good -- blood/discipline red fits brand |
| Accent usage | Maximum 5-10% of any screen's visible color | Overuse cheapens immediately |
| Accent variations | Full (`#D55550`), muted (15% opacity overlay), hover (5% lighter) | Three variants cover all use cases |
| Status colors | Desaturated ~20% from standard values | Bright greens/yellows look gamified on dark backgrounds |
| Gold/warm accent | `#C8A96E` to `#D4A843` for achievements/rewards only | Sparingly -- not a secondary brand color |

**Key rule:** If accent color appears in more than 3 places on a single screen, you have too much. Premium means restraint.

**Current state:** The existing `#D55550` red is well-chosen. The issue is likely overuse across too many elements, not the color itself.

**Confidence:** HIGH (Whoop brand palette verified via developer.whoop.com, Peloton verified via Mobbin brand colors, Strava verified via brand color databases)

### 3. Typography That Commands

**Why expected:** Premium apps use sharp, high-contrast typography with clear hierarchy. Large headings, controlled body text, generous line-height.

| Element | Current | Recommended | Rationale |
|---------|---------|-------------|-----------|
| Heading font | Oswald (condensed, uppercase) | Keep Oswald OR switch to Inter 600-700 weight | Oswald uppercase works for discipline brand; alternatively, using one font family (Inter) at different weights is cleaner and more premium |
| Body font | Inter | Keep Inter | Inter is the premier UI font -- used by Figma, Notion, Pixar. Optimized for screen readability |
| Mono font | JetBrains Mono | Keep JetBrains Mono | Excellent for numbers/data display |
| Heading size | Unspecified | 28-32px primary, 20-24px secondary, 16-18px tertiary | Scale ratio ~1.25 (Major Third) |
| Body size | Unspecified | 15-16px base, 13-14px secondary, 11-12px caption | 16px is accessibility baseline |
| Line height | Unspecified | 1.5 for body, 1.2 for headings | Generous line-height reads as premium |
| Letter spacing | 0.05em headings, 0.08em buttons | Headings: 0.02-0.05em, Buttons: 0.06-0.1em | Current values are reasonable |
| Font weight range | Not fully controlled | 400 (body), 500 (emphasis), 600 (subheadings), 700 (headings) | Use weight for hierarchy, not size alone |

**Key rule:** Premium typography is about restraint -- 3-4 sizes maximum, hierarchy through weight and opacity, not through adding more sizes. Use `text-secondary` color (`#888888` to `#999999`) for de-emphasis instead of shrinking text.

**Font pairing recommendation:** Either (A) keep Oswald headings + Inter body for strong brand personality, or (B) go all-Inter with weight variation for a cleaner, more Whoop-like feel. Option A is more distinctive. Option B is more broadly "premium."

**Confidence:** HIGH (Inter documentation verified via rsms.me/inter, typography scale best practices from multiple sources)

### 4. Generous Spacing System

**Why expected:** Cheap apps cram things together. Premium apps breathe. Equinox, Whoop, and Peloton all use generous whitespace as a design feature.

| Token | Value | Usage |
|-------|-------|-------|
| `spacing-xs` | 4px | Inline element gaps, icon-to-text |
| `spacing-sm` | 8px | Related element gaps within components |
| `spacing-md` | 16px | Component internal padding, list item gaps |
| `spacing-lg` | 24px | Between sections, card padding |
| `spacing-xl` | 32px | Major section breaks |
| `spacing-2xl` | 48px | Page-level section separation |
| `spacing-3xl` | 64px | Hero areas, breathing room |

**Key rules:**
- Card internal padding: minimum 16px, prefer 20-24px
- Between cards in a list: 12-16px
- Screen horizontal padding: 20-24px (not 16px -- too tight for premium)
- Section titles to content: 16-20px
- Bottom navigation clearance: 80-96px (nav height + safe area + breathing room)

**Current state:** `spacingUnit: '4px'` is defined but the scale may not be enforced consistently. Tailwind utilities make it easy to use arbitrary values. A disciplined scale prevents visual chaos.

**Confidence:** MEDIUM-HIGH (derived from Material Design spacing guidelines and analysis of premium app screenshots)

### 5. Subtle, Non-Decorative Borders

**Why expected:** Premium dark UIs rarely use visible borders. When they do, borders are nearly invisible separators -- not containers.

| Property | Specification | Notes |
|----------|---------------|-------|
| Border color | `rgba(255,255,255,0.06)` to `rgba(255,255,255,0.10)` | Just barely visible, implies separation without boxing |
| Border width | 1px only | Never 2px. Thick borders scream "budget design" |
| Border radius (cards) | 12-16px | Current 6px feels tight/utilitarian. 12-16px is the premium standard in 2025-2026 |
| Border radius (buttons) | 8-12px or full pill (9999px) | Primary CTAs can go pill-shaped; secondary can be 8-12px |
| Border radius (inputs) | 8-12px | Match button radius for consistency |
| Dividers | `rgba(255,255,255,0.04)` at 1px | Prefer spacing over dividers when possible |

**Key rule:** If you can clearly see the border, it's too strong. Borders should be felt, not seen.

**Current state:** `borderRadius: '4px'` and `borderRadiusCard: '6px'` are too small. `#2A2A2A` for borders is slightly too visible. Both need softening.

**Confidence:** MEDIUM-HIGH (cross-referenced dark mode design best practices from multiple design publications)

### 6. Elevation Through Subtle Shadows

**Why expected:** Dark mode UIs can't rely on drop shadows the way light UIs do. Instead, premium dark apps use surface color shifts and very subtle shadows.

| Property | Specification | Notes |
|----------|---------------|-------|
| Card shadow | `0 2px 8px rgba(0,0,0,0.3)` or lighter | Barely perceptible -- mainly prevents "floating" feel |
| Modal shadow | `0 8px 32px rgba(0,0,0,0.5)` | Modals need slightly more presence |
| Glow (accent) | `0 0 20px rgba(accent,0.15)` | Used extremely sparingly -- one element per screen max |
| No glow on cards | Remove `.glow-*` from standard cards | Glow on every card cheapens the effect |
| Inner glow (focus) | `0 0 0 2px rgba(accent,0.2)` | Focus rings should be subtle, not neon |

**Key rule:** In dark mode, elevation is primarily communicated through surface color lightness, not shadow depth. The lighter the surface, the "higher" it is.

**Confidence:** HIGH (Material Design 3 dark theme elevation system, verified via Google Codelabs documentation)

### 7. Consistent Icon Treatment

**Why expected:** Premium apps use icons at consistent sizes, weights, and styles. Mixed icon weights or inconsistent sizing breaks premium feel instantly.

| Property | Specification | Notes |
|----------|---------------|-------|
| Icon library | Lucide React (already in use) | Good choice -- clean, consistent, 1px default stroke |
| Nav icon size | 22-24px | Current 22px is good |
| Inline icon size | 16-18px | For icons next to text in cards/lists |
| Header icon size | 20px | Section headers, action buttons |
| Stroke width | 1.5px default, 2px active/selected | Current pattern is correct |
| Icon color (default) | `text-secondary` (#888) | Icons should be quieter than text |
| Icon color (active) | `text-primary` or accent | Only when representing active state |

**Key rule:** Never mix icon sizes or weights within the same visual level. All list item icons same size. All nav icons same size. All section header icons same size.

**Current state:** Already using Lucide correctly. Ensure consistency across all screens.

**Confidence:** HIGH (Lucide documented at lucide.dev, Phosphor alternative evaluated)

---

## Differentiators

These separate a "good dark UI" from a "this feels like Equinox" experience. Table stakes get you to competent. Differentiators get you to premium.

### 1. Purposeful Motion Design

**What it is:** Every animation has a reason. Premium apps don't bounce, wobble, or celebrate unless the moment warrants it. Motion guides attention and confirms actions.

| Animation Type | Duration | Easing | Use Case |
|----------------|----------|--------|----------|
| Page transitions | 200-300ms | `ease-out` or spring(0.5, 0.8, 0) | Screen navigation |
| Card/element appear | 150-250ms | `ease-out` | Content loading, list items |
| Button press | 100-150ms | `ease-in-out` | Scale to 0.97-0.98 on press |
| Modal enter | 250-350ms | Spring with damping 25-30 | Bottom sheet slide up, fade in |
| Modal exit | 200ms | `ease-in` | Faster exit than enter (premium feel) |
| Progress fill | 600-800ms | `ease-out` | XP bars, macro progress |
| Value counter | 400-600ms | Spring | Number count-up for stats |
| Stagger delay | 50-80ms per item | - | List items appearing sequentially |

**Key rules:**
- Exit animations should be 20-30% faster than enter animations (content leaving should not linger)
- Never use `bounce` easing in a premium app -- spring physics with high damping instead
- Maximum one attention-grabbing animation visible at a time
- Reduce motion for `prefers-reduced-motion` users

**What Whoop does well:** Motion is used to guide discovery, not distract. Every animation serves the data.

**Current state:** Framer Motion is already installed. The existing `scale(0.97)` button press is correct. Focus on replacing any bouncy/playful animations with disciplined spring physics.

**Confidence:** MEDIUM-HIGH (derived from Framer Motion best practices and Whoop UX analysis)

### 2. Data-Dense But Not Cluttered Layout

**What it is:** Premium fitness apps (especially Whoop) pack significant information into screens without feeling overwhelming. The secret is progressive disclosure and clear visual hierarchy.

| Technique | Implementation | Example |
|-----------|----------------|---------|
| Card-based data grouping | Each metric gets its own card with clear boundaries | Whoop: Recovery, Strain, Sleep each in distinct cards |
| Progressive disclosure | Summary on card face, tap for detail | Show "1,850 cal" on card, full macro breakdown on tap |
| Typographic hierarchy | Large number + small label pattern | `48px` number + `12px` label beneath |
| De-emphasis via opacity | Secondary info at 60% text opacity | Timestamps, units, labels |
| Metric cards with visual indicators | Circular or linear progress paired with number | Whoop's strain/recovery dials |

**Key rule:** The hierarchy should be: (1) primary number/metric, (2) supporting context, (3) action/detail. Never give equal visual weight to all three.

**What Whoop does well:** Three dedicated dials for primary metrics. Deep-dive pages explain what contributes to scores. Information density without clutter.

**Confidence:** MEDIUM (based on Whoop UX evaluation and premium app analysis articles)

### 3. Micro-Interaction Quality

**What it is:** Small feedback moments that feel polished. Not celebrations -- confirmations.

| Interaction | Treatment | Anti-Pattern |
|-------------|-----------|-------------|
| Set completion | Brief scale pulse (1.02x, 150ms) + subtle check animation | Confetti, star burst, screen shake |
| Streak maintained | Quiet glow pulse on flame icon | Bouncing flame, celebration modal |
| Achievement unlock | Smooth reveal animation, not explosive | Confetti rain, sound effects, modal takeover |
| XP gain | Number ticks up smoothly (spring physics) | Flying XP particles, arcade-style counter |
| Toggle/switch | Snappy 150ms slide with color transition | Slow, bouncy toggle |
| Pull to refresh | Subtle rotation of a minimal spinner | Playful character animations |

**Key rule:** Premium micro-interactions are felt, not seen. The user should register "that felt good" without being able to articulate why.

**Confidence:** MEDIUM (synthesized from premium app analysis and animation best practice sources)

### 4. Refined Input and Form Design

**What it is:** Form inputs that feel intentional, not default browser-styled.

| Element | Specification | Notes |
|---------|---------------|-------|
| Input background | `#141414` to `#161618` (same as surface) | Matches card surface, darker than elevated |
| Input border | `rgba(255,255,255,0.08)` | Nearly invisible at rest |
| Input focus border | Accent color at 60% opacity | Smooth 200ms color transition |
| Input focus ring | `0 0 0 3px rgba(accent, 0.15)` | Subtle outer glow, not a hard outline |
| Input padding | 12-16px horizontal, 12-14px vertical | Generous touch targets, min 44px height |
| Input text | 16px, `#E8E8E8` | Full contrast when typing |
| Placeholder text | 14-16px, `#555555` to `#666666` | Dimmer than secondary text |
| Label text | 12-13px, `#888888`, uppercase tracking 0.05em | Small, out-of-the-way labels |
| Error state | Red accent border + inline message below | Never toast/modal for form errors |

**Confidence:** MEDIUM (derived from form design best practices and dark mode UI guidelines)

### 5. Bottom Sheet Pattern Over Modals

**What it is:** Replace center-screen modals with bottom sheets that slide up from the bottom. This is the dominant mobile pattern in premium apps (Apple, Peloton, Whoop).

| Property | Specification | Notes |
|----------|---------------|-------|
| Backdrop | `rgba(0,0,0,0.6)` + `backdrop-filter: blur(8px)` | Blur is the premium differentiator |
| Sheet background | Surface elevated (`#1A1A1C` to `#1E1E1E`) | Slightly lighter than page background |
| Sheet radius | 16-20px (top corners only) | Generous radius signals "iOS native feel" |
| Handle bar | 36px wide, 4px tall, `rgba(255,255,255,0.2)` centered | Drag indicator |
| Sheet padding | 24px horizontal, 20px top, safe-area bottom | |
| Enter animation | Slide up 300ms with spring damping | |
| Exit animation | Slide down 200ms ease-in | Faster exit |

**Current state:** `CheckInModal` and `XPClaimModal` likely use center modals. Converting to bottom sheets would be a significant premium upgrade.

**Confidence:** MEDIUM (derived from Mobbin bottom sheet patterns and premium app analysis)

### 6. Skeleton Loading That Matches Layout

**What it is:** Skeleton screens that perfectly mirror the layout they're replacing, with a subtle shimmer animation.

| Property | Specification | Notes |
|----------|---------------|-------|
| Skeleton base | `#1A1A1C` | Match surface color |
| Skeleton shimmer | Linear gradient from `#1A1A1C` through `#252528` back to `#1A1A1C` | Moving left-to-right |
| Shimmer speed | 1.5-2s loop | Not too fast (anxious), not too slow (broken) |
| Border radius | Match target element's radius | Text skeletons get 4px radius, cards get card radius |
| Element spacing | Identical to loaded state | Layout must not shift when content loads |

**Current state:** Already has skeleton loading. Verify shimmer colors match the new palette and that layouts remain stable on content load.

**Confidence:** HIGH (skeleton loading is already implemented; this is about palette alignment)

---

## Anti-Features

Things that actively scream "cheap," "gamified," or "toy app." If any of these exist in the current design, they must be removed or transformed.

### 1. Neon/Saturated Glow Effects

**What it looks like:** `box-shadow: 0 0 20px #D55550` on cards, buttons, or multiple elements. Bright colored glows radiating from UI elements.

**Why it's cheap:** Neon glows read as "gaming UI" or "hackathon project." Premium apps use glow on ONE focal element maximum (like Whoop's active strain ring), never on standard UI components.

**What to do instead:**
- Remove glow from cards entirely
- Remove glow from buttons
- Reserve glow for ONE hero element per screen (e.g., the XP progress ring, or the avatar)
- Make glow extremely subtle: `rgba(accent, 0.08-0.12)` not `rgba(accent, 0.3)`

**Current state:** The codebase has `.glow-primary`, `.glow-gold`, `.glow-green`, `.glow-primary-intense`, `.glow-gold-intense` classes. Most of these should be removed or heavily muted. The `.glow-primary-intense` at `0 0 30px` is particularly problematic.

### 2. Heavy Glassmorphism / Backdrop Blur Overuse

**What it looks like:** Every card, panel, and container has `backdrop-filter: blur(12px)` with translucent backgrounds.

**Why it's cheap:** Glass effects on every surface creates visual noise. Premium glass usage is ONE layer -- a modal backdrop, or a single overlay panel. Not every card.

**What to do instead:**
- Remove glass from standard cards -- use solid surface colors
- Keep glass ONLY for overlays: modal backdrops, bottom sheet backdrops
- If using glass on navigation bar, keep it subtle (blur 8px, low opacity)

**Current state:** `.glass`, `.glass-elevated`, `.glass-subtle` classes exist. Standard cards should use solid surfaces. Glass should be reserved for overlays only.

### 3. Excessive Color Variety

**What it looks like:** Green for success, gold for streaks, blue for info, red for accent, purple for achievements -- rainbow of colors across one screen.

**Why it's cheap:** Multiple bright colors on a dark background reads as "gaming dashboard" not "premium fitness." Whoop uses exactly three colors across its entire app: black, white, red (plus semantic green/yellow/red for recovery states).

**What to do instead:**
- Primary palette: Background (near-black), text (off-white), accent (red)
- Status colors: Desaturated significantly (`#4CAF50` -> `#3D8B40`, muted green)
- Achievement gold: Extremely sparing, only on achievement screens
- Info blue: Replace with neutral gray or muted accent variant
- Never more than 2 chromatic colors visible simultaneously on any screen

### 4. Bouncy/Playful Animations

**What it looks like:** Spring animations with low damping causing overshoot/bounce. Elements wobbling into place. "Fun" easing curves.

**Why it's cheap:** Bouncy motion reads as "kids app" or "mobile game." Premium motion is swift and decisive -- things move to their destination without overshooting.

**What to do instead:**
- Replace spring animations: use `damping: 25-30` and `stiffness: 300+` (critically damped or overdamped)
- Use `ease-out` for entrances, `ease-in` for exits
- No overshoot on any animation
- Duration ceiling of 350ms for UI transitions
- Button press: `scale(0.97)` with 100ms duration, no bounce back

### 5. Uppercase Everything

**What it looks like:** All headings, all buttons, all labels in UPPERCASE with wide letter-spacing.

**Why it's cheap:** Uppercase on everything is a common mistake in "edgy" dark themes. It creates visual shouting. Premium apps use uppercase sparingly for specific elements.

**What to do instead:**
- Uppercase: Section headers, primary CTA buttons, navigation labels
- Normal case: Card titles, body text, secondary buttons, list items, form labels
- Rule of thumb: If the text is a sentence or phrase, it should not be uppercase
- If the text is a label or category name (1-2 words), uppercase can work

**Current state:** `.theme-trained h1, h2, h3 { text-transform: uppercase; }` and `.btn-primary { text-transform: uppercase; }` -- the heading rule is too broad. H3-level content in cards should likely be normal case.

### 6. Visible Grid Lines and Heavy Borders

**What it looks like:** Every section and card enclosed in clearly visible borders. Grid lines on charts and progress elements. `border: 1px solid #2A2A2A` on everything.

**Why it's cheap:** Visible containment lines make the UI feel like a wireframe. Premium apps create separation through spacing and surface color differences, not borders.

**What to do instead:**
- Reduce border opacity to barely visible (`rgba(255,255,255,0.06)`)
- Replace bordered sections with spacing + surface color changes
- Charts: minimal grid lines at very low opacity, or no grid lines (just axis labels)
- Use `border-color: transparent` on cards that don't need separation from their background

### 7. Confetti / Particle / Celebration Effects

**What it looks like:** Confetti rain on achievements, flying particles on XP gain, celebratory burst effects.

**Why it's cheap:** Confetti = birthday party app. Premium apps celebrate through dignified means: a smooth reveal, a satisfying haptic, a brief glow.

**What to do instead:**
- Achievement unlock: Smooth fade-in of the badge with a brief golden shimmer border
- XP gain: Number ticks up with spring physics, no flying particles
- Streak milestone: Brief pulsing glow on the streak indicator
- Level up: Full-screen but minimal -- text reveal with fade, maybe a single radial gradient pulse
- Haptic feedback can do the emotional heavy lifting that visual celebrations try to do

### 8. Small Border Radius (Sharp Corners)

**What it looks like:** `border-radius: 4px` or `6px` on cards and containers.

**Why it's cheap:** Small radii read as utilitarian/technical. In 2025-2026, premium apps universally use 12-16px card radius. Compare: iOS settings cards (rounded), Whoop cards (rounded), Peloton cards (rounded).

**What to do instead:**
- Cards: 12-16px radius
- Buttons: 8-12px or full pill (for primary CTAs)
- Inputs: 8-12px
- Modals/sheets: 16-20px (top corners)
- Small chips/badges: 6-8px or full pill
- Progress bars: Full pill (9999px)

**Current state:** `borderRadius: '4px'`, `borderRadiusLg: '6px'`, `borderRadiusCard: '6px'` all need increasing.

---

## Feature Dependencies

```
Surface Hierarchy + Borders  -->  Card Design
                                     |
Typography Scale  -->  Content Layout  -->  Screen Refresh
                          |
Spacing System  -->  Component Spacing  -->  Screen Refresh
                                               |
Animation System  -->  Micro-interactions  -->  Modal/Sheet Pattern
                                               |
Icon Consistency  --------------------------->  Screen Refresh
```

**Order matters:**
1. Design tokens (colors, typography, spacing, radius) must be defined FIRST
2. Base components (cards, buttons, inputs) updated SECOND
3. Animation patterns established THIRD
4. Screen-by-screen refresh LAST (applies tokens + components + animations)

---

## MVP Recommendation

For the design refresh MVP, prioritize in this order:

### Must Complete (Table Stakes)
1. **Update design tokens** -- new surface hierarchy, border radius, spacing scale, border opacity
2. **Typography refinement** -- establish type scale, fix uppercase overuse
3. **Remove/mute glow effects** -- strip `.glow-*` classes or heavily reduce
4. **Remove glass from standard cards** -- solid surface colors only
5. **Increase border radius** -- 4px/6px to 12-16px across the board

### Should Complete (Key Differentiators)
6. **Refine animation timing** -- critically damped springs, faster exits
7. **Convert modals to bottom sheets** -- CheckInModal, XPClaimModal
8. **Implement data-dense card pattern** -- large number + small label hierarchy

### Defer to Post-Refresh
- Custom skeleton shimmer matching new palette (existing skeletons work fine, just update colors)
- Advanced progress indicator redesign (circular gauges like Whoop -- significant effort)
- Icon library swap (Lucide is fine; Phosphor's thin weight would be premium but not worth the migration cost)

---

## Brand-Specific Color Reference

Verified colors from premium fitness brands for comparison:

| Brand | Background | Text | Primary Accent | Source |
|-------|-----------|------|---------------|--------|
| Whoop | `#0B0B0B` | `#FFFFFF` | `#FF0100` (red) | developer.whoop.com design guidelines |
| Peloton | `#101113` | `#CED0CF` | `#C41F2F` (cardinal) | Mobbin brand palette |
| Strava | Dark gray (new) | White | `#FC4C02` (tangelo) | Brand color databases |
| Equinox | Black | White | Monochrome (B&W only) | Brand identity analysis |
| Trained (current) | `#0A0A0A` | `#E8E8E8` | `#D55550` (blood red) | src/themes/trained.ts |

**Assessment:** Trained's current background and accent are well within premium range. The issue is NOT the core palette -- it's the application: too many glows, too-small radii, too-tight spacing, border heaviness, and overuse of accent color.

---

## Recommended Token Updates (Summary)

Quick reference for what should change in `trained.ts` and `index.css`:

| Token | Current | Recommended | Rationale |
|-------|---------|-------------|-----------|
| `colorBorder` | `#2A2A2A` | `rgba(255,255,255,0.07)` | Less visible, more premium |
| `borderRadius` | `4px` | `8px` | Base radius increase |
| `borderRadiusLg` | `6px` | `12px` | Larger elements |
| `borderRadiusCard` | `6px` | `14px` | Cards need visible softness |
| `shadowGlow` | `0 0 20px rgba(213,85,80,0.2)` | `0 0 16px rgba(213,85,80,0.08)` | Much more subtle |
| `colorSuccess` | `#4CAF50` | `#3D8B40` | Desaturated for dark mode |
| `colorWarning` | `#D4A843` | `#B89638` | Slightly muted |
| `colorInfo` | `#3A5A7A` | `#4A6A8A` | Slightly more visible but still muted |
| `colorTextSecondary` | `#888888` | `#777777` to `#888888` | Fine as-is, maybe slightly dimmer |
| New: `borderRadiusButton` | N/A | `10px` | Buttons specifically |
| New: `borderRadiusPill` | N/A | `9999px` | Full pill for CTAs, badges, progress bars |

---

## Sources

### HIGH Confidence (Official/Authoritative)
- [WHOOP Developer Design Guidelines](https://developer.whoop.com/docs/developing/design-guidelines/)
- [WHOOP Brand Color Palette (Mobbin)](https://mobbin.com/colors/brand/whoop)
- [Peloton Brand Color Palette (Mobbin)](https://mobbin.com/colors/brand/peloton)
- [Strava Brand Colors (BrandColors)](https://brandcolors.net/b/strava)
- [Material Design Dark Theme](https://m2.material.io/design/color/dark-theme.html)
- [Material Design 3 Dark Theme Tutorial](https://m3.material.io/blog/dark-theme-design-tutorial-video)
- [Inter Font Family (Official)](https://rsms.me/inter/)
- [Lucide Icons](https://lucide.dev/)

### MEDIUM Confidence (Verified Analysis)
- [Peloton Design Handoff with Figma](https://www.figma.com/customers/peloton-speeds-up-design-handoff-by-5x-with-figma/)
- [Peloton App Design Analysis (DesignRush)](https://www.designrush.com/best-designs/apps/peloton-app-design)
- [Equinox Brand Identity (Brand New / UnderConsideration)](https://www.underconsideration.com/brandnew/archives/new_logo_and_identity_for_equinox_by_the_partners.php)
- [Whoop UX Evaluation (Everyday Industries)](https://everydayindustries.com/whoop-wearable-health-fitness-user-experience-evaluation/)
- [Dark Mode UI Best Practices (LogRocket)](https://blog.logrocket.com/ux-design/dark-mode-ui-design-best-practices-and-examples/)
- [7 Tiny UI Fixes for Premium Feel (Medium)](https://medium.com/@ryan.almeida86/7-tiny-ui-fixes-that-can-make-any-product-look-premium-94a7c71c2aae)
- [Dark Mode Best Practices 2026 (Design Studio)](https://www.designstudiouiux.com/blog/dark-mode-ui-design-best-practices/)

### LOW Confidence (Single Source / Unverified)
- [Phosphor Icons](https://phosphoricons.com/) -- evaluated as alternative to Lucide
- [Fitness App Dark Mode Minimalism (Figma Community)](https://www.figma.com/community/file/1328586164766653621/fitness-app-darkmode-minimalism) -- design template reference
