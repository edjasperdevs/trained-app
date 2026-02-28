# Phase 22: Protocol Orders - Research

**Researched:** 2026-02-28
**Domain:** Gamification quest system with daily/weekly rotation
**Confidence:** HIGH

## Summary

Protocol Orders is a quest system that gives users specific, rotating objectives beyond their normal routine, with bonus DP rewards for completion. The system requires: (1) a quest definition catalog with condition evaluators, (2) deterministic rotation using date-based seeding, (3) progress tracking integrated with existing dpStore/healthStore/macroStore, and (4) premium-gating for weekly quests via subscriptionStore.

The project already has all the infrastructure needed: dpStore for DP awards, healthStore for steps/sleep data, macroStore for meal/protein tracking, workoutStore for training completion, and subscriptionStore for premium gating. The main implementation work is defining quest types, building a questStore with rotation logic, and creating UI components.

**Primary recommendation:** Create a questStore with predefined quest catalog, deterministic daily/weekly rotation using date + user_id seeding, and condition evaluators that query existing stores. Quest completion triggers automatically via store subscriptions when objectives are met.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GAME-06 | User receives daily Protocol Orders (quests) with bonus DP rewards | Quest catalog with condition evaluators, daily rotation via date-seeded selection, auto-completion detection via store subscriptions |
| GAME-07 | User receives weekly Protocol Orders with larger DP rewards (premium only) | Weekly rotation using week-start date, premium gate via subscriptionStore.isPremium, higher DP multiplier for weekly quests |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | ^5.0 | Quest state management | Already used for all stores in project (dpStore, healthStore, etc.) |
| zustand/middleware (persist) | ^5.0 | Quest progress persistence | Matches existing store patterns |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | existing | Quest icons | Already in project for all UI icons |
| @/lib/dateUtils | existing | Date-based rotation | getLocalDateString, getLocalWeekString already exist |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Client-side rotation | Server-side quest assignment | Server would enable more complex rotation but adds API calls; client-side is sufficient for MVP |
| Random seeding | Sequential catalog index | Seeding provides variety; sequential feels predictable |

**Installation:**
No new packages needed - all dependencies exist in project.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── stores/
│   └── questStore.ts          # Quest state, rotation, completion
├── lib/
│   └── questCatalog.ts        # Quest definitions and condition evaluators
├── components/
│   └── ProtocolOrders.tsx     # Quest list UI component
└── screens/
    └── Home.tsx               # Integration point (replace existing quests array)
```

### Pattern 1: Quest Definition with Condition Evaluator
**What:** Each quest has an ID, description, DP reward, and a condition function that evaluates completion
**When to use:** All quests use this pattern for uniform handling
**Example:**
```typescript
// Source: Project pattern extrapolated from existing dpStore/macroStore
interface QuestDefinition {
  id: string
  title: string
  description: string
  dpReward: number
  icon: string // lucide icon name
  type: 'daily' | 'weekly'
  category: 'training' | 'nutrition' | 'health' | 'streak'
  evaluate: () => boolean // Returns true when quest objective is met
}

const QUEST_CATALOG: QuestDefinition[] = [
  {
    id: 'daily-log-3-meals',
    title: 'Triple Threat',
    description: 'Log 3 meals today',
    dpReward: 15,
    icon: 'Utensils',
    type: 'daily',
    category: 'nutrition',
    evaluate: () => {
      const todayLog = useMacroStore.getState().getTodayLog()
      return (todayLog?.loggedMeals.length ?? 0) >= 3
    }
  },
  // ... more quests
]
```

### Pattern 2: Deterministic Date-Based Rotation
**What:** Use date string as seed for consistent quest selection across app restarts
**When to use:** Daily and weekly quest selection
**Example:**
```typescript
// Source: https://devforum.roblox.com/t/daily-quest-system/1838436
// Adapted for TypeScript
function seededShuffle<T>(array: T[], seed: string): T[] {
  // Simple hash function for seed
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash = hash & hash
  }

  // Fisher-Yates with seeded random
  const result = [...array]
  let m = result.length
  while (m) {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff
    const i = hash % m--
    ;[result[m], result[i]] = [result[i], result[m]]
  }
  return result
}

function getDailyQuests(userId: string, date: string): QuestDefinition[] {
  const dailyQuests = QUEST_CATALOG.filter(q => q.type === 'daily')
  const seed = `${date}-${userId}` // User-specific rotation
  const shuffled = seededShuffle(dailyQuests, seed)
  return shuffled.slice(0, 3) // 3 daily quests
}
```

### Pattern 3: Auto-Completion via Store Subscription
**What:** Subscribe to relevant stores and check quest completion when state changes
**When to use:** Automatic quest completion without manual user action
**Example:**
```typescript
// Source: Project pattern from existing store subscriptions
// In questStore.ts
const useQuestStore = create<QuestStore>()(
  persist(
    (set, get) => ({
      // ... state

      checkCompletion: () => {
        const { activeDailyQuests, completedToday } = get()

        activeDailyQuests.forEach(quest => {
          if (!completedToday.includes(quest.id) && quest.evaluate()) {
            // Award DP
            const result = useDPStore.getState().awardDP('training') // bonus category
            // Mark completed
            set(state => ({
              completedToday: [...state.completedToday, quest.id],
              dpEarnedToday: state.dpEarnedToday + quest.dpReward
            }))
          }
        })
      }
    }),
    { name: 'trained-quests' }
  )
)

// Subscribe to relevant stores
useMacroStore.subscribe(() => useQuestStore.getState().checkCompletion())
useWorkoutStore.subscribe(() => useQuestStore.getState().checkCompletion())
useHealthStore.subscribe(() => useQuestStore.getState().checkCompletion())
```

### Anti-Patterns to Avoid
- **Manual-only completion:** Don't require users to tap "complete quest" - detect automatically when objective is met
- **Server-dependent rotation:** Don't require API calls for quest selection - use client-side deterministic seeding
- **Unbounded quest catalog:** Don't create 100 unique quests - 15-20 well-designed quests provide sufficient variety
- **Complex multi-step quests:** Daily quests should be achievable in one action/day - save complex chains for achievements

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Random number seeding | Custom PRNG | Simple hash-based shuffle | Hash function is sufficient for daily rotation |
| Date handling | Custom date parsing | getLocalDateString/getLocalWeekString | Already exists in project, handles timezone correctly |
| Premium gating | Custom subscription check | subscriptionStore.isPremium | Already implemented and tested in Phase 19 |
| DP awarding | Custom point tracking | dpStore.awardDP() | Handles rank-up, archetype modifiers, daily logs |

**Key insight:** The existing stores (dpStore, healthStore, macroStore, subscriptionStore) handle all the hard parts. Quest system is primarily wiring up condition evaluators and UI.

## Common Pitfalls

### Pitfall 1: Quest Evaluation Race Condition
**What goes wrong:** Quest evaluates as complete before user finishes action (e.g., meal logged but store not updated yet)
**Why it happens:** Synchronous evaluation during async state update
**How to avoid:** Evaluate in store subscription callback (runs after state settled)
**Warning signs:** Quest completes but user didn't see action complete first

### Pitfall 2: Duplicate DP Awards
**What goes wrong:** Same quest awards DP multiple times
**Why it happens:** evaluate() returns true multiple times, no completion tracking
**How to avoid:** Track completedToday array, check before awarding
**Warning signs:** Users report abnormally high DP gains

### Pitfall 3: Quest Rotation Drift
**What goes wrong:** Different users see different quests on same day
**Why it happens:** Using Math.random() without seed, or timezone issues in date string
**How to avoid:** Use deterministic seeding with getLocalDateString(), include userId for user-specific rotation
**Warning signs:** Users comparing screenshots show different quest lists

### Pitfall 4: Weekly Quest on Day 7 Edge Case
**What goes wrong:** Weekly quest expires before user can complete it if they start late in week
**Why it happens:** Week rolls over Sunday midnight but quest was started Friday
**How to avoid:** Show "2 days remaining" countdown, or allow completion within 24h of expiry
**Warning signs:** User complaints about "impossible" weekly quests

### Pitfall 5: Quest Completion Not Persisting
**What goes wrong:** User completes quest, closes app, re-opens and quest shows incomplete
**Why it happens:** Missing persist middleware or completion tracked in memory only
**How to avoid:** Use persist middleware like all other stores, verify in devtools
**Warning signs:** Duplicate completion toasts after app restart

## Code Examples

Verified patterns from project codebase:

### Existing DP Award Pattern (from dpStore.ts)
```typescript
// Source: /Users/ejasper/code/trained-app/src/stores/dpStore.ts
awardDP: (action: DPAction) => {
  const state = get()
  const today = getLocalDateString()

  // Get archetype and apply modifier
  const archetype = useUserStore.getState().profile?.archetype || 'bro'
  const baseDP = DP_VALUES[action]
  const modifier = ARCHETYPE_MODIFIERS[archetype]?.[action] || 1
  const dpValue = Math.round(baseDP * modifier)

  // ... award logic with rank-up detection
  return { dpAwarded: dpValue, rankedUp, newRank }
}
```

### Existing Premium Gate Pattern (from subscriptionStore.ts)
```typescript
// Source: /Users/ejasper/code/trained-app/src/stores/subscriptionStore.ts
const isPremium = useSubscriptionStore((state) => state.isPremium)

// Gate weekly quests
const weeklyQuests = isPremium ? getWeeklyQuests(userId, weekString) : []
```

### Existing Daily Log Check Pattern (from CheckInModal.tsx)
```typescript
// Source: /Users/ejasper/code/trained-app/src/screens/CheckInModal.tsx
// Check what's already been awarded today
const todayLog = useDPStore.getState().getTodayLog()

// Award training DP if not already awarded
if (todayWorkout && data.workout && !(todayLog && todayLog.training > 0)) {
  const result = useDPStore.getState().awardDP('training')
  // ...
}
```

### Existing Week String Pattern (from dateUtils.ts)
```typescript
// Source: /Users/ejasper/code/trained-app/src/lib/dateUtils.ts
export function getLocalWeekString(date: Date = new Date()): string {
  return getLocalDateString(getStartOfLocalWeek(date))
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server-assigned quests | Client-side deterministic rotation | 2024+ | Eliminates API dependency, works offline |
| Manual quest completion | Auto-completion via store subscription | Standard | Better UX, no extra taps required |
| Fixed daily quests | Rotating quests with seeded shuffle | Standard | Keeps content fresh, increases engagement |

**Deprecated/outdated:**
- Manual "claim" buttons for quest rewards: Modern apps auto-award on completion
- Single daily quest: Research shows 3 daily quests optimal for engagement

## Open Questions

1. **Quest DP Bonus vs Base DP**
   - What we know: GAME-06 mentions "bonus DP rewards"
   - What's unclear: Should quest DP stack with base action DP, or replace it?
   - Recommendation: Stack - quest is BONUS on top of regular DP. Quest for "complete workout" gives +15 bonus, user still gets +50 training DP from the action itself.

2. **Quest Variety Count**
   - What we know: Need 3 daily, 2 weekly premium quests
   - What's unclear: How many total quest definitions needed for good rotation?
   - Recommendation: Start with 12-15 daily quest definitions, 6-8 weekly quest definitions. This provides ~2 weeks before repeat for daily.

3. **Quest Difficulty Scaling**
   - What we know: Requirements mention "specific objectives"
   - What's unclear: Should quests scale based on user profile (e.g., "hit YOUR protein target" vs "eat 150g protein")?
   - Recommendation: Use relative targets where possible ("hit protein target") to accommodate different user profiles.

## Quest Catalog Design

### Recommended Daily Quest Pool (12-15 quests, 3 shown per day)

| ID | Title | Objective | Bonus DP | Category |
|----|-------|-----------|----------|----------|
| d-log-3-meals | Triple Threat | Log 3 meals today | 15 | nutrition |
| d-hit-protein | Protein Protocol | Hit your protein target | 20 | nutrition |
| d-complete-workout | Training Day | Complete today's workout | 25 | training |
| d-10k-steps | Mile Marker | Hit 10,000 steps | 15 | health |
| d-sleep-7h | Lights Out | Log 7+ hours of sleep | 10 | health |
| d-log-weight | Scale Check | Log your weight today | 10 | health |
| d-hit-calories | Fuel Check | Hit your calorie target | 15 | nutrition |
| d-2-meals | Double Down | Log 2 meals before noon | 10 | nutrition |
| d-any-action | Show Up | Complete any DP action | 5 | streak |
| d-all-sets | Full Send | Complete all sets in workout | 20 | training |
| d-perfect-day | Perfect Protocol | Hit protein AND calories | 30 | nutrition |
| d-early-workout | Morning Discipline | Complete workout before noon | 15 | training |

### Recommended Weekly Quest Pool (6-8 quests, 2 shown per week, premium only)

| ID | Title | Objective | Bonus DP | Category |
|----|-------|-----------|----------|----------|
| w-5-workouts | Iron Week | Complete 5 workouts this week | 100 | training |
| w-7-protein | Protein Streak | Hit protein target 7 days | 75 | nutrition |
| w-50k-steps | Marathon Week | Total 50,000 steps this week | 60 | health |
| w-perfect-3 | Triple Crown | 3 perfect nutrition days | 80 | nutrition |
| w-7-day-streak | Unbroken | Maintain obedience streak all week | 100 | streak |
| w-log-21-meals | Meal Master | Log 21 meals this week | 50 | nutrition |

## Sources

### Primary (HIGH confidence)
- Project codebase: dpStore.ts, healthStore.ts, macroStore.ts, subscriptionStore.ts - existing patterns verified
- Project codebase: dateUtils.ts - getLocalDateString/getLocalWeekString functions
- Project codebase: CheckInModal.tsx - DP award pattern with duplicate prevention

### Secondary (MEDIUM confidence)
- [NerdExp - Game Design: The Daily Quest](https://nerdexp.com/game-design-the-daily-quest/) - Quest design principles
- [Roblox DevForum - Daily Quest System](https://devforum.roblox.com/t/how-would-i-go-about-a-daily-quest-system-that-is-the-same-for-everyone/1838436) - Deterministic rotation seeding

### Tertiary (LOW confidence)
- General game design wisdom on 3-quest optimal engagement - needs validation with actual user data

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - uses existing project libraries only
- Architecture: HIGH - patterns extrapolated from verified project code
- Pitfalls: MEDIUM - based on general software patterns, not project-specific bugs
- Quest catalog: MEDIUM - needs balance testing with real users

**Research date:** 2026-02-28
**Valid until:** 2026-03-28 (30 days - stable domain)
