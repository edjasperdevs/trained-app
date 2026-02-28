# Phase 23: Avatar Evolution - Research

**Researched:** 2026-02-28
**Domain:** React SVG Components, Visual Progression Systems, Premium Feature Gating
**Confidence:** HIGH

## Summary

Phase 23 implements a 5-stage evolving silhouette avatar that visually reflects user rank progression. The avatar changes at 5 rank milestones (ranks 1, 4, 8, 12, 15), with stages 3-5 being premium-gated. The existing codebase already has the rank-to-stage mapping function (`getAvatarStage()` in AvatarScreen.tsx) and premium gating infrastructure (`PremiumGate` component, `subscriptionStore`).

The current `Avatar` component uses lucide-react icons as placeholders. Phase 23 replaces these with actual SVG silhouette illustrations. The SVG assets are an external art dependency that must be commissioned (noted in STATE.md as a pending todo). This research assumes the 5 SVG files will be provided; implementation focuses on the component architecture to consume them.

The key implementation pattern is a stage-aware SVG component that accepts a `stage` prop (1-5), renders the appropriate SVG, and integrates with the existing premium gating system. For non-premium users viewing stages 3-5, the component shows a locked preview (greyscale/blurred) with an upgrade prompt.

**Primary recommendation:** Create an `EvolvingAvatar` component that uses inline SVG React components for each stage, selected dynamically via the existing `getAvatarStage()` function. Premium gate stages 3-5 using the existing `PremiumGate` component pattern, with a custom locked-preview fallback.

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AVATAR-01 | User has an evolving silhouette avatar that reflects rank progression | EvolvingAvatar component renders stage-appropriate SVG based on `getAvatarStage(currentRank)` |
| AVATAR-02 | Avatar changes at 5 rank milestones (stages tied to specific ranks) | Existing mapping: ranks 1-3 -> stage 1, 4-7 -> stage 2, 8-11 -> stage 3, 12-14 -> stage 4, 15 -> stage 5 |
| AVATAR-03 | Avatar is displayed prominently on the home screen | Replace Home.tsx Avatar component with EvolvingAvatar in the "Avatar & Rank Section" card |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.3.1 | Component framework | Already in use |
| TypeScript | ~5.6.2 | Type safety | Already in use |
| lucide-react | 0.563.0 | Lock icon for premium gate | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zustand | 4.5.2 | State management (dpStore, subscriptionStore) | Already integrated |
| Tailwind CSS | 4.1.18 | Styling | Already in use |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline SVG components | External SVG files via `<img>` | Inline SVG required for dynamic styling (fill, filters, hover states) |
| Custom animation library | CSS transitions | CSS sufficient for simple stage-transition animations |
| SVGR build plugin | Manual SVG-to-React conversion | Not needed; 5 static SVGs can be hand-converted once |

**Installation:**
```bash
# No additional dependencies required
# All needed packages already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── EvolvingAvatar.tsx    # Main avatar component with stage selection
│   ├── AvatarStages/         # Individual stage SVG components
│   │   ├── index.ts          # Export all stages
│   │   ├── Stage1.tsx        # Initiate silhouette
│   │   ├── Stage2.tsx        # Disciplined silhouette
│   │   ├── Stage3.tsx        # Conditioned silhouette
│   │   ├── Stage4.tsx        # Tempered silhouette
│   │   └── Stage5.tsx        # Master silhouette
│   └── LockedAvatar.tsx      # Locked preview with upgrade prompt
├── screens/
│   ├── AvatarScreen.tsx      # Already has getAvatarStage() export
│   └── Home.tsx              # Will consume EvolvingAvatar
```

### Pattern 1: Stage-Aware SVG Component
**What:** A component that dynamically renders the correct SVG based on rank-derived stage.
**When to use:** When the avatar needs to change based on dpStore.currentRank.
**Example:**
```typescript
// Source: Project pattern derived from existing getAvatarStage()
import { useDPStore, useSubscriptionStore } from '@/stores'
import { getAvatarStage } from '@/screens/AvatarScreen'
import { Stage1, Stage2, Stage3, Stage4, Stage5 } from './AvatarStages'
import { LockedAvatar } from './LockedAvatar'

const STAGE_COMPONENTS = [Stage1, Stage2, Stage3, Stage4, Stage5]
const PREMIUM_STAGES = [3, 4, 5] // Stages 3-5 require premium

interface EvolvingAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showLocked?: boolean // Show locked preview for non-premium
}

export function EvolvingAvatar({ size = 'lg', showLocked = true }: EvolvingAvatarProps) {
  const currentRank = useDPStore((s) => s.currentRank)
  const isPremium = useSubscriptionStore((s) => s.isPremium)

  const stage = getAvatarStage(currentRank)
  const isPremiumStage = PREMIUM_STAGES.includes(stage)

  // Non-premium user viewing premium stage
  if (isPremiumStage && !isPremium && showLocked) {
    return <LockedAvatar stage={stage} size={size} />
  }

  const StageComponent = STAGE_COMPONENTS[stage - 1]
  return <StageComponent size={size} />
}
```

### Pattern 2: Inline SVG React Component
**What:** Each stage is a React component that renders inline SVG with customizable props.
**When to use:** For each of the 5 silhouette illustrations.
**Example:**
```typescript
// Source: LogRocket SVG guide best practices
import type { SVGProps } from 'react'

interface StageProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZE_MAP = {
  sm: { width: 64, height: 64 },
  md: { width: 96, height: 96 },
  lg: { width: 128, height: 128 },
  xl: { width: 192, height: 192 },
}

export function Stage1({ size = 'lg', className }: StageProps) {
  const { width, height } = SIZE_MAP[size]

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label="Initiate avatar silhouette"
    >
      {/* SVG paths here - provided by artist */}
      <path fill="currentColor" d="..." />
    </svg>
  )
}
```

### Pattern 3: Locked Preview with Premium Gate
**What:** Shows a greyscale/filtered version of the avatar with upgrade prompt overlay.
**When to use:** When non-premium users have reached stages 3-5 but cannot access premium visuals.
**Example:**
```typescript
// Source: Existing PremiumGate/UpgradePrompt patterns
import { Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Stage3, Stage4, Stage5 } from './AvatarStages'

const LOCKED_STAGES = { 3: Stage3, 4: Stage4, 5: Stage5 }

interface LockedAvatarProps {
  stage: 3 | 4 | 5
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function LockedAvatar({ stage, size = 'lg' }: LockedAvatarProps) {
  const navigate = useNavigate()
  const StageComponent = LOCKED_STAGES[stage]

  return (
    <div className="relative">
      {/* Greyscale filtered preview */}
      <div className="opacity-40 grayscale blur-[1px]">
        <StageComponent size={size} />
      </div>

      {/* Lock overlay */}
      <button
        onClick={() => navigate('/paywall')}
        className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 rounded-lg"
      >
        <Lock className="w-8 h-8 text-muted-foreground mb-2" />
        <span className="text-xs text-signal font-medium">Unlock</span>
      </button>
    </div>
  )
}
```

### Anti-Patterns to Avoid
- **Loading SVGs via `<img src>`:** Prevents dynamic styling (fill color, filters) and increases HTTP requests
- **Storing SVG strings in JSON:** Unnecessary serialization; inline React components are cleaner
- **Conditional imports with `import()`:** Adds complexity for only 5 small static SVGs; eager import is fine
- **Animating entire SVG on every render:** Use CSS transitions for stage changes, not JS-driven animation loops

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Premium gating | Custom isPremium checks | Existing `PremiumGate` component | Already handles web bypass, loading states |
| Rank-to-stage mapping | New mapping function | Existing `getAvatarStage()` from AvatarScreen | Already implemented and tested |
| Upgrade navigation | Custom paywall routing | `UpgradePrompt` component patterns | Consistent UX across premium gates |
| SVG optimization | Manual path reduction | SVGO CLI tool | Automated, handles edge cases |

**Key insight:** This phase wires together existing infrastructure (dpStore.currentRank, subscriptionStore.isPremium, getAvatarStage(), PremiumGate patterns). The only new code is the EvolvingAvatar component and the 5 SVG stage components.

## Common Pitfalls

### Pitfall 1: SVG viewBox Mismatch
**What goes wrong:** Avatar renders at wrong size or aspect ratio.
**Why it happens:** SVG assets from designer have inconsistent viewBox values.
**How to avoid:** Standardize all 5 SVGs to identical viewBox (e.g., "0 0 100 100") during asset handoff.
**Warning signs:** Avatar looks squished/stretched at different sizes.

### Pitfall 2: Premium Stage Showing Without Subscription
**What goes wrong:** Non-premium users see premium avatar stages 3-5 without lock overlay.
**Why it happens:** Missing isPremium check or race condition during subscription state hydration.
**How to avoid:** Use existing subscriptionStore hydration pattern; default to locked state during loading.
**Warning signs:** Flash of unlocked content before paywall redirect.

### Pitfall 3: SVG Fill Color Not Matching Theme
**What goes wrong:** Avatar silhouette doesn't match Dopamine Noir color system.
**Why it happens:** SVG has hardcoded fill colors instead of `currentColor`.
**How to avoid:** Ensure artist delivers SVGs with `fill="currentColor"` or convert during implementation.
**Warning signs:** Avatar is black when it should be foreground/muted color.

### Pitfall 4: Stale Stage on Rank-Up
**What goes wrong:** Avatar doesn't update immediately when user ranks up and crosses a stage boundary.
**Why it happens:** Component not subscribed to dpStore.currentRank reactively.
**How to avoid:** Use Zustand selector pattern: `useDPStore((s) => s.currentRank)` instead of `useDPStore.getState()`.
**Warning signs:** Avatar updates only after page refresh.

### Pitfall 5: Large SVG Bundle Size
**What goes wrong:** Initial bundle grows significantly due to SVG paths.
**Why it happens:** Complex silhouette illustrations with many paths.
**How to avoid:** Optimize SVGs with SVGO before converting to components; target < 5KB per stage.
**Warning signs:** Lighthouse performance score drops; bundle analyzer shows large avatar chunk.

## Code Examples

Verified patterns from official sources:

### Zustand Reactive Selector (Project Pattern)
```typescript
// Source: Existing dpStore usage in Home.tsx
const currentRank = useDPStore((state) => state.currentRank)
```

### Premium Gate with Custom Fallback (Project Pattern)
```typescript
// Source: PremiumGate.tsx existing implementation
<PremiumGate fallback={<LockedAvatar stage={stage} />}>
  <EvolvingAvatar stage={stage} />
</PremiumGate>
```

### SVG Props Interface (TypeScript Best Practice)
```typescript
// Source: LogRocket React SVG guide
interface SvgStageProps extends React.SVGProps<SVGSVGElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}
```

### CSS Transition for Stage Change
```typescript
// CSS class for smooth avatar transitions
// Add to EvolvingAvatar wrapper div
<div className="transition-all duration-500 ease-out">
  <StageComponent />
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Icon-based avatar (lucide-react) | SVG silhouette illustrations | Phase 23 | Visual progression becomes meaningful |
| Mood-based avatar states | Rank-based evolution stages | V2 design | Simpler, cleaner progression model |
| `<img src="avatar.svg">` | Inline SVG React components | 2024+ | Full styling/animation control |

**Deprecated/outdated:**
- `avatarStore.currentMood`: Kept for potential future use, but avatar display no longer uses mood states
- `baseCharacter` (dominant/switch/submissive): V1 concept; V2 avatar is archetype-agnostic silhouette

## Open Questions

1. **SVG Asset Status**
   - What we know: STATE.md notes "Commission avatar SVG assets (5 stages) before Phase 23"
   - What's unclear: Whether assets have been commissioned/delivered
   - Recommendation: Implementation can proceed with placeholder SVGs; swap in final assets when ready

2. **Stage Transition Animation**
   - What we know: Spec says "evolving" but doesn't specify animation style
   - What's unclear: Should avatar morph smoothly between stages or simply swap?
   - Recommendation: Start with CSS crossfade transition; add morph animation as v2.1 polish

3. **Avatar on AvatarScreen vs Home**
   - What we know: AVATAR-03 requires "prominently displayed on the home screen"
   - What's unclear: Should AvatarScreen also use EvolvingAvatar or keep current icon-based display?
   - Recommendation: Update both Home.tsx and AvatarScreen.tsx for consistency

## Sources

### Primary (HIGH confidence)
- `/Users/ejasper/code/trained-app/src/screens/AvatarScreen.tsx` - Existing getAvatarStage() implementation
- `/Users/ejasper/code/trained-app/src/components/PremiumGate.tsx` - Premium gating pattern
- `/Users/ejasper/code/trained-app/src/stores/dpStore.ts` - Rank system implementation
- `/Users/ejasper/code/trained-app/src/stores/subscriptionStore.ts` - Premium entitlement state

### Secondary (MEDIUM confidence)
- [LogRocket SVG Guide](https://blog.logrocket.com/guide-svgs-react/) - React inline SVG best practices
- [Vite SVG handling](https://www.freecodecamp.org/news/how-to-import-svgs-in-react-and-vite/) - Build configuration patterns

### Tertiary (LOW confidence)
- WellTrained V2 Master Specification (lines 52-58) - Avatar design intent; may not reflect final implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies; uses existing project libraries
- Architecture: HIGH - Follows established project patterns (PremiumGate, Zustand selectors)
- Pitfalls: MEDIUM - Based on general React SVG experience; some project-specific issues may emerge

**Research date:** 2026-02-28
**Valid until:** 2026-03-30 (stable; only invalidated if SVG asset requirements change)
