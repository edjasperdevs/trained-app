# Design System: WellTrained V2 — Dopamine Noir
**Stitch Project ID:** 4137572301609334881

## 1. Visual Theme & Atmosphere

**"Disciplined Darkness"** — WellTrained sits at the intersection of three reference points:

- **MacroFactor's clinical precision**: Data is king. Numbers are clean, scannable, and feel authoritative. Color is used to encode meaning, not decorate.
- **Hevy's kinetic energy**: The app feels alive during a workout. Subtle glow effects, layered depth, and micro-animations create a sense of "charging up."
- **Equinox's luxury restraint**: Visual minimalism as a status signal. The interface never shouts. Empty space is intentional. Bold typography does the heavy lifting.

The result: a near-black canvas where electric lime erupts only where it matters most. Every tap should feel like it costs something and rewards you for it.

## 2. Color Palette & Roles

| Name | Hex | Role |
|------|-----|------|
| **Void Black** | `#0A0A0A` | Primary background — the canvas |
| **Carbon Surface** | `#26282B` | Cards, inputs, modals — all elevated surfaces |
| **Carbon Border** | `#2E3035` | Subtle 1px dividers, card edges |
| **Signal Lime** | `#C8FF00` | THE accent — CTAs, active states, progress fills, rank highlights |
| **Signal Dark** | `#0A0A0A` | Text ON Signal Lime elements |
| **Ghost White** | `#FAFAFA` | Primary body text and headings |
| **Ash Gray** | `#A1A1AA` | Muted/secondary labels, metadata, inactive nav icons |
| **Ember Red** | `#B91C1C` | Destructive actions only |
| **Glow Lime** | `rgba(200,255,0,0.12)` | Subtle background glow for active cards (Hevy-inspired depth) |

## 3. Typography Rules

- **Oswald Bold/ExtraBold** — Display use: rank names, stat numbers, section headings, screen titles. Always uppercase or title case. Condensed and proud. Taken from Equinox playbook.
- **Inter Regular/Medium/SemiBold** — All interface copy: labels, descriptions, button text, form inputs. Clean and neutral.
- **JetBrains Mono** — All data: calorie counts, macro grams, DP values, set/rep numbers, weights. Fixed-width precision à la MacroFactor.

**Hierarchy Rule:** The eye should land on the Oswald stat first, comprehend it, then read the Inter label beneath. Mono data is scanned, not read.

## 4. Component Stylings

- **Primary Buttons:** Signal Lime (#C8FF00) fill, black text in Inter SemiBold, 8px corner radius. Full-width on main CTAs. No gradient.
- **Ghost Buttons:** 1px Signal Lime border, Signal Lime text, transparent fill. Used for secondary actions.
- **Cards/Containers:** Carbon Surface (#26282B) background, 1px Carbon Border stroke, 12px corner radius. No drop shadows. Active/highlighted cards get a Glow Lime background tint.
- **Progress Bars:** 4–6px height, Carbon Surface track, Signal Lime fill. Caps rounded.
- **Progress Rings (Macros):** SVG circles, Carbon Surface track, Signal Lime stroke. Hevy-style subtle glow at the fill head.
- **Inputs:** Carbon Surface background, Carbon Border stroke, Ghost White text. No label floating — label sits above.
- **Badges/Tags:** Small pill shapes, various colors per rarity (common: Ash Gray; rare: Steel Blue; epic: Signal Lime/15% opacity; legendary: Gold).

## 5. Layout Principles

- **Generous padding:** 20px horizontal margins on all screens. Cards have 16px internal padding.
- **Tight spacing within cards:** 8px between related rows, 16px between sections.
- **MacroFactor density:** Don't be afraid of data density. Rows of macros should feel like a well-designed spreadsheet.
- **Hevy scan-speed:** During workout logging, the most important action (log a set) should be immediately tapable without scrolling.
- **Equinox hierarchy:** One dominant visual element per screen (the rank card, the macro rings, the today card). Everything else supports it.
- **Section headers:** All caps, Oswald, Ash Gray, tracked out 0.1em. Quiet but present.

## 6. Design System Notes for Stitch Generation

When prompting Stitch for new screens, always include:

```
DESIGN SYSTEM — DOPAMINE NOIR V2:
- Background: Near-black void (#0A0A0A), matte
- Cards: Dark charcoal (#26282B), 1px border (#2E3035), 12px rounded corners, no shadows
- Accent: Electric lime (#C8FF00) — used ONLY for active states, progress, primary CTAs
- Text Primary: Ghost white (#FAFAFA)
- Text Secondary: Ash gray (#A1A1AA)
- Display Font: Oswald Bold — rank names, big stats, screen headers — uppercase
- Interface Font: Inter — all labels, descriptions, button copy
- Data Font: JetBrains Mono — numbers, calories, grams, DP values
- Inspiration: MacroFactor's data precision + Hevy's kinetic depth + Equinox's luxury restraint
- Philosophy: Color = signal only. Empty space = premium. Typography = hierarchy.
```
