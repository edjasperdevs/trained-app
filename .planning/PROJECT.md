# Trained Design Refresh

## What This Is

Full visual overhaul of the Trained fitness gamification PWA. Transforming the current "too playful" aesthetic into a premium Equinox/luxury gym vibe — darker palette, cleaner typography, refined components. Removing the dual-theme system (dropping GYG) to simplify the codebase and go all-in on one cohesive identity.

## Core Value

**The app must look and feel like it belongs next to Equinox, Whoop, and PUSH.** Every screen, component, and interaction should signal premium discipline — not gamified fun. Dark, minimal, confident.

## Requirements

### Validated

Previous milestone (Launch Polish) delivered:

- ✓ User authentication (email/password, session persistence) — existing
- ✓ Onboarding flow (10-step wizard with progress indicator) — existing
- ✓ Workout logging (exercises, sets, reps, weights, history) — existing
- ✓ Macro tracking (calories, protein, food search with fallback) — existing
- ✓ XP/leveling system (DP, ranks, weekly claim ritual) — existing
- ✓ Streak system (daily check-in, grace period/safe word) — existing
- ✓ Avatar evolution (13 stages, mood system) — existing
- ✓ Achievement badges (20+ badges, unlock animations) — existing
- ✓ Offline-first with cloud sync (Zustand + Supabase) — existing
- ✓ PWA support (prompt-based updates, runtime caching) — existing
- ✓ Skeleton loading states, empty states, haptic feedback — launch polish
- ✓ Sync status indicator, online/offline detection — launch polish
- ✓ Sentry error monitoring wired into all error paths — launch polish
- ✓ Plausible analytics (22 custom events) — existing
- ✓ WCAG AA color contrast compliance — launch polish

### Active

Design refresh work:

- [ ] Remove GYG theme and dual-theme system entirely
- [ ] New color palette — darker, premium, Equinox-inspired
- [ ] Typography refresh — sharper, more commanding
- [ ] Component library redesign — cards, buttons, inputs, modals
- [ ] Screen-by-screen visual refresh
- [ ] Animation refinement — subtle, premium motion
- [ ] Dark mode optimization — true blacks, careful contrast

### Out of Scope

- Coach dashboard redesign — still client-only
- New features — visual refresh only, no functionality changes
- Mobile app (native) — still PWA
- Light mode — dark-only, matches luxury gym aesthetic
- Marketing site redesign — app screens only

## Context

**Current State:**
- 5-phase launch polish complete (audit, performance, UX, resilience, launch prep)
- App is functionally solid — this is purely visual
- Dual-theme system adds complexity: ThemeProvider, useTheme hook, two theme configs, CSS variables mapped to theme tokens
- Theme tokens in TWO places: `src/themes/trained.ts` + `src/index.css` `:root` — removing GYG means simplifying to one source of truth
- ~11k lines of TypeScript/TSX

**Target Aesthetic:**
- Equinox / luxury gym — exclusive, disciplined, premium
- Dark backgrounds (near-black), subtle gradients
- Minimal color — accent used sparingly for emphasis
- Clean sans-serif typography with strong hierarchy
- Generous whitespace, refined spacing
- Subtle animations — no bouncy/playful motion

**Comparable Apps:**
- Equinox+ (luxury fitness)
- Whoop (performance tracking)
- PUSH (strength tracking)
- Peloton (premium fitness)

**Timeline:**
- This week — same urgency as launch polish

## Constraints

- **Timeline**: This week — move fast
- **Functionality**: Zero behavior changes — visual only
- **Data**: No store/state changes that could affect user data
- **Accessibility**: Maintain WCAG AA contrast ratios with new palette
- **PWA**: Service worker, caching, offline support must keep working

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Drop GYG theme entirely | Simplify codebase, go all-in on Trained identity | — Pending |
| Full visual overhaul | Current design too playful for target audience | — Pending |
| Equinox as north star | Premium gym aesthetic resonates with fitness enthusiasts | — Pending |
| Dark-only (no light mode) | Matches luxury gym vibe, simpler to maintain | — Pending |
| Visual-only (no features) | Don't break what launch polish just fixed | — Pending |

---
*Last updated: 2026-02-05 after design refresh milestone initialization*
