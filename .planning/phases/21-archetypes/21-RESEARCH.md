# Phase 21: Archetypes - Research

**Researched:** 2026-02-28
**Domain:** User archetypes, DP modifiers, premium gating, onboarding integration
**Confidence:** HIGH

## Summary

Phase 21 introduces user archetypes that modify how Discipline Points (DP) are earned. There are 5 archetypes: "Bro" (free, generalist), and 4 premium archetypes (Himbo, Brute, Pup, Bull) that boost specific actions. This phase builds directly on the existing `dpStore` (Phase 18) for modifier application and `subscriptionStore` (Phase 19) for premium gating.

The implementation requires three main components: (1) archetype data model and selection state, (2) integration with the existing onboarding flow to add an archetype selection step, and (3) modification of the `dpStore.awardDP()` function to apply archetype-specific multipliers. The existing `PremiumGate` component (Phase 19) will gate the 4 premium archetypes during selection.

The codebase already has patterns for everything needed: `Onboarding.tsx` has a step-based flow that can be extended (currently 9 steps), `dpStore` already has `DP_VALUES` constants that can be multiplied, and `PremiumGate`/`UpgradePrompt` handle premium content gating. The database schema (`profiles` table) needs a new `archetype` column, and sync logic will need to persist the selection to Supabase.

**Primary recommendation:** Add archetype selection as a new onboarding step after the "features" step, store archetype in both localStorage (userStore or new archetypeStore) and Supabase profiles table, then modify `dpStore.awardDP()` to apply archetype multipliers before returning.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GAME-03 | User selects one of 5 archetypes during onboarding (Bro is free; Himbo, Brute, Pup, Bull are premium) | Onboarding.tsx has step-based flow ready for new step. PremiumGate component handles premium locking. Archetype stored in userStore profile and synced to Supabase profiles table. |
| GAME-04 | Selected archetype applies DP bonus modifiers to specific actions | dpStore.awardDP() modified to check archetype and apply multiplier. ARCHETYPE_MODIFIERS constant defines per-archetype boosts. Modifiers applied before DP is added to totalDP. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | ^4.5.2 | State management for archetype selection | Already used for all stores |
| zustand/middleware (persist) | ^4.5.2 | localStorage persistence | All stores use persist middleware |
| react | ^18.3.1 | UI components | Existing framework |
| @supabase/supabase-js | ^2.49.0 | Database persistence for archetype | Existing Supabase integration |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^0.563.0 | Archetype icons | Icon for each archetype in selection UI |
| class-variance-authority | ^0.7.1 | Component variants | Archetype card variants (selected/locked/available) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| New archetypeStore | Add to userStore | userStore already has profile data; adding archetype there is simpler and follows existing patterns |
| Store archetype in dpStore | Keep in userStore | dpStore reads from userStore for archetype; separation of concerns is cleaner |

**Installation:**
```bash
# No new dependencies needed -- everything is already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  stores/
    userStore.ts         # ADD: archetype field to UserProfile interface
    dpStore.ts           # UPDATE: awardDP() applies archetype modifiers
  screens/
    Onboarding.tsx       # UPDATE: Add 'archetype' step after 'features'
    Settings.tsx         # UPDATE: Add archetype selection/change section
  components/
    ArchetypeSelector.tsx  # NEW: Selection UI for 5 archetypes
    ArchetypeCard.tsx      # NEW: Individual archetype card with lock state
  lib/
    sync.ts              # UPDATE: Sync archetype to profiles table
  design/
    constants.ts         # UPDATE: Add ARCHETYPE_MODIFIERS, ARCHETYPE_INFO
supabase/
  migrations/
    010_archetypes.sql   # NEW: Add archetype column to profiles table
```

### Pattern 1: Archetype Type Definition
**What:** Union type for 5 archetypes with modifier configuration
**When to use:** Anywhere archetype is referenced

```typescript
// src/stores/userStore.ts (or new types file)
export type Archetype = 'bro' | 'himbo' | 'brute' | 'pup' | 'bull'

// src/design/constants.ts
export const ARCHETYPE_INFO: Record<Archetype, {
  name: string
  tagline: string
  icon: string // lucide icon name
  isPremium: boolean
  description: string
  boosts: string // human-readable boost description
}> = {
  bro: {
    name: 'Bro',
    tagline: 'Balanced Discipline',
    icon: 'User',
    isPremium: false,
    description: 'The generalist. No special bonuses, no weaknesses. Solid foundation for any trainee.',
    boosts: 'No modifier bonuses',
  },
  himbo: {
    name: 'Himbo',
    tagline: 'Training Obsessed',
    icon: 'Dumbbell',
    isPremium: true,
    description: 'Lives for the gym. Training is worship. Extra DP for every workout completed.',
    boosts: '+50% training DP',
  },
  brute: {
    name: 'Brute',
    tagline: 'Nutrition Machine',
    icon: 'Beef',
    isPremium: true,
    description: 'Hits macros like clockwork. Extra DP for protein targets and tracked meals.',
    boosts: '+50% protein/meal DP',
  },
  pup: {
    name: 'Pup',
    tagline: 'Lifestyle Master',
    icon: 'Heart',
    isPremium: true,
    description: 'The complete package. Extra DP for steps and sleep tracking.',
    boosts: '+100% steps/sleep DP',
  },
  bull: {
    name: 'Bull',
    tagline: 'Consistency King',
    icon: 'TrendingUp',
    isPremium: true,
    description: 'Consistency is everything. Streak bonuses amplified. (Future: PR tracking bonuses)',
    boosts: 'Streak multiplier boost (v2.1)',
  },
}

// Modifier multipliers applied during awardDP()
export const ARCHETYPE_MODIFIERS: Record<Archetype, Partial<Record<DPAction, number>>> = {
  bro: {},  // No modifiers
  himbo: { training: 1.5 },  // +50% training DP
  brute: { meal: 1.5, protein: 1.5 },  // +50% nutrition DP
  pup: { steps: 2.0, sleep: 2.0 },  // +100% health tracking DP
  bull: {},  // Future: streak multiplier (deferred to v2.1)
}
```

### Pattern 2: UserProfile Extension
**What:** Add archetype field to existing UserProfile interface
**When to use:** Profile initialization and persistence

```typescript
// src/stores/userStore.ts
export interface UserProfile {
  // ... existing fields
  archetype: Archetype  // NEW: User's selected archetype
}

const initialProfile: UserProfile = {
  // ... existing defaults
  archetype: 'bro',  // Default to free archetype
}
```

### Pattern 3: Onboarding Archetype Step
**What:** New step in onboarding flow for archetype selection
**When to use:** During onboarding, after features step

```typescript
// Add to Step type union
type Step = 'welcome' | 'name' | 'gender' | 'fitness' | 'days' | 'schedule' | 'goal' | 'features' | 'archetype' | 'tutorial' | 'levelup'

// Update steps array
const steps: Step[] = ['welcome', 'name', 'gender', 'fitness', 'days', 'schedule', 'goal', 'features', 'archetype', 'tutorial']

// ArchetypeStep component pattern
function ArchetypeStep({
  value,
  isPremium,
  onChange,
  onNext,
  onBack
}: {
  value: Archetype
  isPremium: boolean
  onChange: (v: Archetype) => void
  onNext: () => void
  onBack: () => void
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Choose Your Archetype</h2>
      <p className="text-muted-foreground mb-6">
        Your archetype determines how you earn bonus DP.
      </p>

      <ArchetypeSelector
        selected={value}
        isPremium={isPremium}
        onSelect={onChange}
      />

      <div className="flex gap-3 mt-6">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button onClick={onNext} className="flex-1">Continue</Button>
      </div>
    </div>
  )
}
```

### Pattern 4: DP Modifier Application
**What:** Apply archetype multiplier in awardDP()
**When to use:** Every DP award

```typescript
// src/stores/dpStore.ts
import { useUserStore } from './userStore'
import { ARCHETYPE_MODIFIERS } from '@/design/constants'

// In awardDP function:
awardDP: (action: DPAction) => {
  const archetype = useUserStore.getState().profile?.archetype || 'bro'
  const baseDP = DP_VALUES[action]
  const modifier = ARCHETYPE_MODIFIERS[archetype][action] || 1
  const dpAmount = Math.round(baseDP * modifier)

  // ... rest of existing awardDP logic using dpAmount instead of dpValue
  return { dpAwarded: dpAmount, rankedUp, newRank }
}
```

### Pattern 5: Premium Gating for Archetype Selection
**What:** Lock premium archetypes for non-premium users using existing PremiumGate
**When to use:** Archetype selection UI in onboarding and settings

```typescript
// ArchetypeSelector component
function ArchetypeSelector({ selected, isPremium, onSelect }) {
  const archetypes: Archetype[] = ['bro', 'himbo', 'brute', 'pup', 'bull']

  return (
    <div className="space-y-3">
      {archetypes.map((archetype) => {
        const info = ARCHETYPE_INFO[archetype]
        const isLocked = info.isPremium && !isPremium

        return (
          <ArchetypeCard
            key={archetype}
            archetype={archetype}
            selected={selected === archetype}
            locked={isLocked}
            onSelect={() => {
              if (!isLocked) onSelect(archetype)
            }}
          />
        )
      })}
    </div>
  )
}
```

### Anti-Patterns to Avoid
- **Storing archetype in dpStore:** Archetype is user profile data, not gamification state. Keep in userStore.
- **Applying modifiers after DP is stored:** Apply modifier during awardDP() so totalDP reflects actual earned amount. Don't store base DP and compute modified later.
- **Blocking non-premium users from selecting any archetype:** Bro must always be available. Use PremiumGate on the 4 premium options, not the entire selector.
- **Hardcoding modifier values in dpStore:** Define modifiers in constants.ts for easy balancing and future adjustments.
- **Forgetting to sync archetype to Supabase:** Local selection is useless without server persistence. Update sync.ts to push archetype to profiles table.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Premium content gating | Custom lock logic | Existing PremiumGate/UpgradePrompt | Already handles isNative(), isPremium checks, navigation to paywall |
| Selection state | New store | Extend userStore.profile | Archetype is user profile data, fits existing pattern |
| Database migration | Manual SQL | Supabase migration file | Follows project migration pattern (001-009 already exist) |
| Icon rendering | Custom icon system | lucide-react | Already used throughout app |

**Key insight:** This phase is UI + data model, not new patterns. The hardest work (dpStore, subscriptionStore, PremiumGate) already exists from Phases 18-19.

## Common Pitfalls

### Pitfall 1: DP Modifier Displayed But Not Applied
**What goes wrong:** UI shows "+75 DP" for Himbo training but only 50 DP is actually awarded
**Why it happens:** UI reads from DP_VALUES directly without applying archetype modifier
**How to avoid:** All DP display that shows potential earnings must read archetype and apply modifier. Create helper function `getModifiedDP(action, archetype)` used by both awardDP and UI.
**Warning signs:** DPDisplay shows different total than expected after award.

### Pitfall 2: Premium User Loses Archetype on Subscription Lapse
**What goes wrong:** User with premium archetype (Himbo) lets subscription lapse, app crashes or silently switches to Bro
**Why it happens:** No handling for "what if premium archetype but no longer premium?"
**How to avoid:** On subscription status change, validate archetype. If premium archetype but isPremium=false, keep archetype stored but display it as "locked" in settings. User can switch away but can't switch back without resubscribing. Don't auto-change.
**Warning signs:** User reports "my archetype changed" after subscription expiry.

### Pitfall 3: Archetype Not Persisted to Supabase
**What goes wrong:** User sets archetype on device A, opens app on device B, sees Bro instead
**Why it happens:** Forgot to update sync.ts to push archetype to profiles table
**How to avoid:** Add archetype to pushUserProfile() and pullUserProfile() in sync.ts. Create migration 010_archetypes.sql to add column.
**Warning signs:** Cross-device users see different archetypes.

### Pitfall 4: Onboarding Data Not Including Archetype
**What goes wrong:** User completes onboarding, finishOnboarding() doesn't save archetype selection
**Why it happens:** OnboardingData interface doesn't include archetype field
**How to avoid:** Add `archetype: Archetype` to OnboardingData interface and include in initProfile() call.
**Warning signs:** Users complete onboarding but profile.archetype is undefined.

### Pitfall 5: Modifier Applied to Capped Actions
**What goes wrong:** Meal DP cap (3 meals/day) incorrectly applies to modified value
**Why it happens:** Cap check done after modifier instead of before
**How to avoid:** Cap logic in awardDP() checks `meals >= MEAL_CAP_PER_DAY` before applying modifier. The cap is on action count, not DP amount.
**Warning signs:** Brute users can only log 2 meals before cap because 15*1.5=22.5 > cap threshold.

## Code Examples

### Example 1: Archetype Type and Constants
```typescript
// src/stores/userStore.ts
export type Archetype = 'bro' | 'himbo' | 'brute' | 'pup' | 'bull'

// src/design/constants.ts
import type { Archetype } from '@/stores'
import type { DPAction } from '@/stores/dpStore'

export const ARCHETYPE_MODIFIERS: Record<Archetype, Partial<Record<DPAction, number>>> = {
  bro: {},
  himbo: { training: 1.5 },
  brute: { meal: 1.5, protein: 1.5 },
  pup: { steps: 2.0, sleep: 2.0 },
  bull: {},  // Future v2.1: streak multiplier
}

// Helper for UI display
export function getModifiedDP(action: DPAction, archetype: Archetype): number {
  const base = DP_VALUES[action]
  const modifier = ARCHETYPE_MODIFIERS[archetype][action] || 1
  return Math.round(base * modifier)
}
```

### Example 2: awardDP with Archetype Modifier
```typescript
// src/stores/dpStore.ts (updated awardDP)
awardDP: (action: DPAction) => {
  const state = get()
  const archetype = useUserStore.getState().profile?.archetype || 'bro'
  const today = getLocalDateString()

  // Get base and modified DP
  const baseDP = DP_VALUES[action]
  const modifier = ARCHETYPE_MODIFIERS[archetype][action] || 1
  const dpValue = Math.round(baseDP * modifier)

  // Find or create today's log
  let todayLog = state.dailyLogs.find(log => log.date === today)
  if (!todayLog) {
    todayLog = { date: today, training: 0, meals: 0, protein: 0, steps: 0, sleep: 0, total: 0 }
  }

  // Check meal cap (applied to action count, not DP)
  if (action === 'meal' && todayLog.meals >= MEAL_CAP_PER_DAY) {
    return { dpAwarded: 0, rankedUp: false, newRank: state.currentRank }
  }

  // ... rest of existing logic using dpValue
}
```

### Example 3: ArchetypeCard Component
```typescript
// src/components/ArchetypeCard.tsx
import { Lock } from 'lucide-react'
import { ARCHETYPE_INFO, type Archetype } from '@/design/constants'
import { cn } from '@/lib/cn'

interface ArchetypeCardProps {
  archetype: Archetype
  selected: boolean
  locked: boolean
  onSelect: () => void
}

export function ArchetypeCard({ archetype, selected, locked, onSelect }: ArchetypeCardProps) {
  const info = ARCHETYPE_INFO[archetype]

  return (
    <button
      onClick={onSelect}
      disabled={locked}
      className={cn(
        'w-full text-left p-4 rounded-xl border-2 bg-card transition-colors',
        selected ? 'border-primary' : 'border-transparent',
        locked ? 'opacity-60 cursor-not-allowed' : 'hover:bg-muted/50'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          {locked ? (
            <Lock size={20} className="text-muted-foreground" />
          ) : (
            <span className="text-xl">{/* Icon based on info.icon */}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{info.name}</p>
            {info.isPremium && (
              <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded font-medium">
                Premium
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{info.tagline}</p>
          <p className="text-xs text-primary mt-1">{info.boosts}</p>
        </div>
      </div>
    </button>
  )
}
```

### Example 4: Supabase Migration
```sql
-- supabase/migrations/010_archetypes.sql
-- Add archetype column to profiles table

-- Create archetype enum
CREATE TYPE archetype AS ENUM ('bro', 'himbo', 'brute', 'pup', 'bull');

-- Add column with default
ALTER TABLE profiles
  ADD COLUMN archetype archetype DEFAULT 'bro' NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN profiles.archetype IS 'User archetype selection - affects DP earning modifiers';
```

### Example 5: Settings Archetype Section
```typescript
// In Settings.tsx, add after Subscription section
{/* Archetype */}
<Card className="py-0">
  <CardContent className="p-4">
    <h3 className="text-sm font-semibold text-muted-foreground mb-4">ARCHETYPE</h3>

    <ArchetypeSelector
      selected={profile?.archetype || 'bro'}
      isPremium={isPremium}
      onSelect={(archetype) => {
        setProfile({ archetype })
        toast.success(`Archetype changed to ${ARCHETYPE_INFO[archetype].name}`)
      }}
    />

    {/* Show current bonus */}
    {profile?.archetype && profile.archetype !== 'bro' && (
      <div className="mt-4 p-3 bg-primary/10 rounded-lg">
        <p className="text-sm text-primary font-medium">
          Active Bonus: {ARCHETYPE_INFO[profile.archetype].boosts}
        </p>
      </div>
    )}
  </CardContent>
</Card>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single XP rate for all users | Archetype-based DP modifiers | V2 redesign | Personalization drives engagement; premium archetypes drive conversion |
| No user class system | 5 archetypes with distinct bonuses | V2 redesign | Adds identity and strategy to gamification |

**Deprecated/outdated:**
- Bull archetype streak multiplier deferred to v2.1 (per STATE.md pending todos)
- Bull PR tracking bonus deferred to v2.1 (per REQUIREMENTS.md GAME-11)

## DP Modifier Balance Analysis

### Current DP Values (base)
| Action | Base DP | Daily Max |
|--------|---------|-----------|
| Training | 50 | 50 (1/day) |
| Meal | 15 | 45 (3/day) |
| Protein | 25 | 25 (1/day) |
| Steps | 10 | 10 (1/day) |
| Sleep | 10 | 10 (1/day) |
| **Total** | - | **140** |

### Modified DP by Archetype
| Archetype | Training | Meal | Protein | Steps | Sleep | Daily Max |
|-----------|----------|------|---------|-------|-------|-----------|
| Bro | 50 | 45 | 25 | 10 | 10 | 140 |
| Himbo | **75** | 45 | 25 | 10 | 10 | **165** (+18%) |
| Brute | 50 | **67.5** | **37.5** | 10 | 10 | **175** (+25%) |
| Pup | 50 | 45 | 25 | **20** | **20** | **160** (+14%) |
| Bull | 50 | 45 | 25 | 10 | 10 | 140 (v2.1: streak bonus) |

**Balance notes:**
- Himbo rewards consistent training (gym-focused users)
- Brute rewards nutrition discipline (macro-tracking users)
- Pup rewards lifestyle tracking (health-conscious users)
- Bull deferred to v2.1 for streak multiplier implementation

The +14-25% daily max range ensures premium archetypes feel meaningful without being overpowered.

## Open Questions

1. **Bull archetype implementation**
   - What we know: Bull is for "consistency" with streak bonuses and future PR tracking
   - What's unclear: No streak multiplier system exists yet (deferred to v2.1 per STATE.md)
   - Recommendation: Implement Bull now with no modifiers (same as Bro). Update description to say "Streak bonuses coming soon." Phase 21 ships without Bull's full mechanics.

2. **Archetype visualization in DPDisplay**
   - What we know: DPDisplay shows rank, DP, progress bar
   - What's unclear: Should archetype icon/name appear in DPDisplay or only on Avatar/Profile?
   - Recommendation: Keep DPDisplay focused on rank progression. Show archetype icon in header next to username, or on AvatarScreen. Don't clutter DPDisplay.

3. **Archetype change cooldown**
   - What we know: Settings allows archetype change
   - What's unclear: Should users be able to change archetype freely, or is there a cooldown?
   - Recommendation: No cooldown for v2.0. Free switching encourages experimentation. Consider weekly cooldown in v2.1 if users game the system.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/stores/dpStore.ts` (222 lines, awardDP implementation)
- Codebase analysis: `src/stores/userStore.ts` (428 lines, UserProfile interface)
- Codebase analysis: `src/stores/subscriptionStore.ts` (205 lines, isPremium state)
- Codebase analysis: `src/components/PremiumGate.tsx` (72 lines, premium gating pattern)
- Codebase analysis: `src/screens/Onboarding.tsx` (1167 lines, step-based flow)
- Codebase analysis: `src/screens/Settings.tsx` (1234 lines, profile editing UI)
- Codebase analysis: `supabase/schema.sql` (646 lines, profiles table definition)

### Secondary (MEDIUM confidence)
- REQUIREMENTS.md: GAME-03, GAME-04 requirement definitions
- STATE.md: Project decisions including archetype balance simulation pending
- ROADMAP.md: Phase 21 success criteria and plan descriptions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries, all patterns exist
- Architecture: HIGH - Direct extension of existing stores and UI patterns
- Pitfalls: HIGH - Based on concrete analysis of awardDP, sync, and onboarding flows

**Research date:** 2026-02-28
**Valid until:** 2026-03-28 (stable -- internal patterns, no external dependencies)
