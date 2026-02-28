# Phase 20: Health Tracking - Research

**Researched:** 2026-02-27
**Domain:** HealthKit integration, Capacitor plugin usage, health data sync
**Confidence:** HIGH

## Summary

Phase 20 implements health tracking for daily steps and sleep with HealthKit auto-population on iOS and manual fallback for web/denied permissions. The dpStore already has `steps` and `sleep` DPAction types with defined values (+10 DP each), so integration is straightforward: create a healthStore to read HealthKit data, display on a Health screen or Home dashboard, and call `awardDP('steps')` / `awardDP('sleep')` when thresholds are met.

The @capgo/capacitor-health plugin (v7.2.15) is the recommended Capacitor 7 compatible plugin for unified HealthKit access. It provides `isAvailable()`, `requestAuthorization()`, `readSamples()`, and `queryAggregated()` methods. Steps use aggregation queries; sleep requires `readSamples()` with manual duration calculation since sleep samples are not aggregatable.

**Primary recommendation:** Use @capgo/capacitor-health@7 with a healthStore Zustand store pattern matching existing stores, implement soft-ask permission screen before native HealthKit prompt, and persist daily_health data to Supabase for cross-device sync.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HEALTH-01 | User can view daily step count sourced from HealthKit | @capgo/capacitor-health `queryAggregated()` with dataType: 'steps', aggregation: 'sum' |
| HEALTH-02 | User can manually enter daily step count as fallback | Manual entry UI stored in healthStore, synced to daily_health table |
| HEALTH-03 | User can view sleep duration sourced from HealthKit | `readSamples()` with dataType: 'sleep', calculate total from asleep samples |
| HEALTH-04 | User can manually enter sleep duration as fallback | Manual entry UI in hours/minutes, converted to minutes for storage |
| HEALTH-05 | Steps (10k+) and sleep (7h+) thresholds trigger DP awards | dpStore.awardDP('steps') when steps >= 10000, awardDP('sleep') when sleep >= 420 min |
| HEALTH-06 | App requests HealthKit permissions contextually (not during onboarding) | Soft-ask screen pattern: explain benefits first, then trigger native prompt |
| HEALTH-07 | App handles HealthKit permission denial gracefully with manual-only fallback | Check permission state, show manual entry UI when denied, no re-prompt |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @capgo/capacitor-health | ^7.2.15 | HealthKit/Health Connect unified API | Official Capgo plugin, Capacitor 7 compatible, unified iOS/Android API |
| zustand | 4.5.2 | healthStore state management | Already used for dpStore, macroStore, etc. |
| @supabase/supabase-js | 2.93.3 | daily_health table sync | Existing Supabase integration |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @capacitor/core | 7.5.0 | Platform detection (isNative, isIOS) | Already installed, used for conditional plugin calls |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @capgo/capacitor-health | @perfood/capacitor-healthkit | perfood is iOS-only, no unified API |
| Zustand store | React Query | Simpler for local-first pattern with sync |

**Installation:**
```bash
npm install @capgo/capacitor-health@^7.2.15
npx cap sync ios
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── health.ts            # HealthKit wrapper (isAvailable, requestAuth, readSteps, readSleep)
├── stores/
│   └── healthStore.ts       # Zustand store (permissionStatus, steps, sleep, manual entries)
├── screens/
│   └── HealthPermission.tsx # Soft-ask screen before native prompt
├── components/
│   └── HealthCard.tsx       # Steps/sleep display card for Home screen
│   └── ManualHealthEntry.tsx # Form for manual steps/sleep input
supabase/
└── migrations/
    └── 013_daily_health.sql  # daily_health table
```

### Pattern 1: Soft-Ask Permission Screen
**What:** Display explanatory UI before triggering HealthKit native permission dialog
**When to use:** Before first HealthKit request (HEALTH-06 requirement)
**Example:**
```typescript
// Source: Apple HIG / project pattern from push.ts
// HealthPermission.tsx
function HealthPermission({ onComplete }: { onComplete: (granted: boolean) => void }) {
  const handleEnable = async () => {
    const granted = await requestHealthPermission()
    onComplete(granted)
  }

  return (
    <div>
      <h2>Track Your Health</h2>
      <p>Connect Apple Health to automatically track steps and sleep.</p>
      <ul>
        <li>+10 DP for 10,000+ daily steps</li>
        <li>+10 DP for 7+ hours sleep</li>
      </ul>
      <Button onClick={handleEnable}>Enable Apple Health</Button>
      <Button variant="ghost" onClick={() => onComplete(false)}>Enter Manually</Button>
    </div>
  )
}
```

### Pattern 2: HealthKit Wrapper with Platform Guard
**What:** Wrapper functions that check isIOS() before calling plugin
**When to use:** All health.ts functions
**Example:**
```typescript
// Source: project pattern from haptics.ts, push.ts
import { Health } from '@capgo/capacitor-health'
import { isIOS } from '@/lib/platform'

export async function isHealthAvailable(): Promise<boolean> {
  if (!isIOS()) return false
  try {
    const { available } = await Health.isAvailable()
    return available
  } catch {
    return false
  }
}

export async function requestHealthPermission(): Promise<boolean> {
  if (!isIOS()) return false
  try {
    const result = await Health.requestAuthorization({
      read: ['steps', 'sleep'],
      write: []
    })
    return result.granted
  } catch {
    return false
  }
}
```

### Pattern 3: Sleep Duration Calculation
**What:** Sum asleep sample durations from HealthKit readSamples
**When to use:** Reading sleep data (HEALTH-03)
**Example:**
```typescript
// Source: Apple HealthKit docs + @capgo/capacitor-health GitHub
export async function readTodaySleep(): Promise<number> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  // Sleep for "today" is previous night - check past 24 hours
  const sleepWindowStart = new Date(startOfDay.getTime() - 12 * 60 * 60 * 1000) // noon yesterday

  const { samples } = await Health.readSamples({
    dataType: 'sleep',
    startDate: sleepWindowStart.toISOString(),
    endDate: startOfDay.toISOString(),
    limit: 100
  })

  // Sum asleep samples only (exclude 'awake', 'inBed')
  // Sleep states: 'asleep', 'asleepCore', 'asleepDeep', 'asleepREM', 'asleepUnspecified'
  const asleepStates = ['asleep', 'asleepCore', 'asleepDeep', 'asleepREM', 'asleepUnspecified']
  let totalMinutes = 0

  for (const sample of samples) {
    if (asleepStates.includes(sample.value)) {
      const start = new Date(sample.startDate).getTime()
      const end = new Date(sample.endDate).getTime()
      totalMinutes += (end - start) / (1000 * 60)
    }
  }

  return Math.round(totalMinutes)
}
```

### Pattern 4: DP Award with Double-Count Prevention
**What:** Check todayLog before awarding steps/sleep DP
**When to use:** When health data meets threshold
**Example:**
```typescript
// Source: project pattern from CheckInModal.tsx
function checkAndAwardHealthDP(steps: number, sleepMinutes: number) {
  const todayLog = useDPStore.getState().getTodayLog()

  if (steps >= 10000 && (!todayLog || todayLog.steps === 0)) {
    useDPStore.getState().awardDP('steps')
  }

  if (sleepMinutes >= 420 && (!todayLog || todayLog.sleep === 0)) {
    useDPStore.getState().awardDP('sleep')
  }
}
```

### Anti-Patterns to Avoid
- **Calling HealthKit on web:** Always guard with isIOS() check - plugin crashes on web
- **Re-prompting after denial:** HealthKit prompt shows once per app install; after denial, send user to Settings
- **Aggregating sleep data:** Sleep samples are not aggregatable - must use readSamples + manual sum
- **Ignoring multiple sources:** Multiple devices can contribute sleep data; accept HealthKit's deduplication

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HealthKit native bridge | Custom Cordova/native code | @capgo/capacitor-health | Handles iOS/Android differences, maintained |
| Date range calculations | Manual date math | getLocalDateString from dateUtils.ts | Already handles timezone edge cases |
| Permission flow | Single prompt | Soft-ask pattern | Apple requires explanation before sensitive permissions |
| Sleep deduplication | Manual source filtering | Accept all asleep samples | HealthKit handles multi-source deduplication |

**Key insight:** HealthKit itself handles the complexity of merging data from multiple sources (iPhone, Apple Watch, third-party apps). Don't try to deduplicate - just read the aggregated samples.

## Common Pitfalls

### Pitfall 1: Steps Aggregation Returns 0
**What goes wrong:** queryAggregated returns 0 despite Health app showing steps
**Why it happens:** Permission not granted for steps read, or date range excludes today
**How to avoid:** Check authorization result before reading; use startOfDay to endOfNow
**Warning signs:** Works in simulator but fails on device

### Pitfall 2: Sleep Shows Wrong Duration
**What goes wrong:** Sleep duration much higher or lower than Health app
**Why it happens:** Including 'inBed' and 'awake' samples, or wrong date range
**How to avoid:** Filter for asleepStates only; query previous night (noon-to-noon)
**Warning signs:** Duration > 12 hours or < 2 hours for normal nights

### Pitfall 3: Permission Denied State Unknown
**What goes wrong:** Cannot distinguish "never asked" from "denied"
**Why it happens:** HealthKit does not reveal prior denial to protect privacy
**How to avoid:** Store permission state in healthStore after first request attempt
**Warning signs:** User can't enable Health even after granting in Settings

### Pitfall 4: Web Build Crashes
**What goes wrong:** App crashes on web when health code executes
**Why it happens:** Capacitor plugin throws when native layer unavailable
**How to avoid:** Guard ALL health functions with isIOS() check
**Warning signs:** Works on iOS simulator, crashes on `npm run dev`

### Pitfall 5: DP Awarded Multiple Times
**What goes wrong:** User gets +10 DP for steps multiple times per day
**Why it happens:** Background sync or component remount calls awardDP again
**How to avoid:** Check todayLog.steps > 0 before awarding
**Warning signs:** DP count higher than expected

## Code Examples

Verified patterns from official sources:

### Steps Query (Aggregated)
```typescript
// Source: @capgo/capacitor-health GitHub README
import { Health } from '@capgo/capacitor-health'

export async function readTodaySteps(): Promise<number> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const { value } = await Health.queryAggregated({
    dataType: 'steps',
    startDate: startOfDay.toISOString(),
    endDate: new Date().toISOString(),
    aggregation: 'sum',
    bucket: 'day'
  })

  return value || 0
}
```

### Health Store Pattern
```typescript
// Source: project pattern from dpStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface HealthStore {
  permissionStatus: 'unknown' | 'granted' | 'denied'
  todaySteps: number
  todaySleepMinutes: number
  manualSteps: number | null      // null = use HealthKit
  manualSleepMinutes: number | null
  lastFetchDate: string | null

  setPermissionStatus: (status: 'granted' | 'denied') => void
  setTodayHealth: (steps: number, sleepMinutes: number) => void
  setManualSteps: (steps: number) => void
  setManualSleep: (minutes: number) => void
  clearManualEntry: () => void
  getEffectiveSteps: () => number
  getEffectiveSleep: () => number
}

export const useHealthStore = create<HealthStore>()(
  persist(
    (set, get) => ({
      permissionStatus: 'unknown',
      todaySteps: 0,
      todaySleepMinutes: 0,
      manualSteps: null,
      manualSleepMinutes: null,
      lastFetchDate: null,

      setPermissionStatus: (status) => set({ permissionStatus: status }),
      setTodayHealth: (steps, sleepMinutes) => set({
        todaySteps: steps,
        todaySleepMinutes: sleepMinutes,
        lastFetchDate: new Date().toISOString()
      }),
      setManualSteps: (steps) => set({ manualSteps: steps }),
      setManualSleep: (minutes) => set({ manualSleepMinutes: minutes }),
      clearManualEntry: () => set({ manualSteps: null, manualSleepMinutes: null }),

      getEffectiveSteps: () => {
        const { manualSteps, todaySteps } = get()
        return manualSteps ?? todaySteps
      },
      getEffectiveSleep: () => {
        const { manualSleepMinutes, todaySleepMinutes } = get()
        return manualSleepMinutes ?? todaySleepMinutes
      }
    }),
    { name: 'trained-health' }
  )
)
```

### iOS Configuration (Info.plist)
```xml
<!-- Source: Apple Developer docs + @capgo/capacitor-health README -->
<key>NSHealthShareUsageDescription</key>
<string>WellTrained reads your steps and sleep data to reward you with Discipline Points for healthy habits.</string>
```

### iOS Entitlements
```xml
<!-- Add to App.entitlements -->
<key>com.apple.developer.healthkit</key>
<true/>
<key>com.apple.developer.healthkit.access</key>
<array/>
```

### Supabase Migration
```sql
-- 013_daily_health.sql
CREATE TABLE daily_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  steps INTEGER,
  sleep_minutes INTEGER,
  steps_source TEXT NOT NULL DEFAULT 'manual', -- 'healthkit' or 'manual'
  sleep_source TEXT NOT NULL DEFAULT 'manual',
  dp_awarded_steps BOOLEAN NOT NULL DEFAULT false,
  dp_awarded_sleep BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE daily_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own health data"
  ON daily_health FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_daily_health_user_date ON daily_health(user_id, date);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| cordova-plugin-health | @capgo/capacitor-health | 2024 | Capacitor-native, better TypeScript |
| Google Fit API | Health Connect | Android 14 | Google Fit deprecated |
| Custom sleep aggregation | readSamples + filter | Always | Sleep not aggregatable in HealthKit |

**Deprecated/outdated:**
- cordova-plugin-health: Cordova deprecated, use Capacitor plugins
- Google Fit: Replaced by Health Connect on Android 14+

## Open Questions

1. **Sleep window for "today"**
   - What we know: Sleep for today is typically previous night's sleep
   - What's unclear: Exact window (midnight-to-midnight vs noon-to-noon)
   - Recommendation: Use 6pm previous day to 12pm today for "last night's sleep"

2. **Background sync frequency**
   - What we know: HealthKit can provide data on-demand
   - What's unclear: Whether to poll periodically or only on app foreground
   - Recommendation: Fetch on app foreground (AppState listener), no background polling

3. **Multiple HealthKit sources deduplication**
   - What we know: STATE.md flags "Sleep data aggregation from multiple HealthKit sources needs device validation"
   - What's unclear: Whether plugin handles this or if manual deduplication needed
   - Recommendation: Trust HealthKit's built-in deduplication; validate on real device with Watch + iPhone

## Sources

### Primary (HIGH confidence)
- [@capgo/capacitor-health GitHub](https://github.com/Cap-go/capacitor-health) - API methods, version compatibility
- [Capgo Health Plugin Docs](https://capgo.app/docs/plugins/health/) - Installation, configuration
- [Apple HKCategoryValueSleepAnalysis](https://developer.apple.com/documentation/healthkit/hkcategoryvaluesleepanalysis) - Sleep enum values
- npm registry `@capgo/capacitor-health@7` - Version 7.2.15 confirmed compatible with Capacitor 7

### Secondary (MEDIUM confidence)
- [Apple Authorizing HealthKit Access](https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data) - Permission patterns
- [Medium: Retrieving Sleep Data with HealthKit](https://medium.com/@nathan.woolmore/retrieving-sleep-data-with-healthkit-in-swift-e81829f4a726) - Sleep calculation approach
- Project codebase patterns - dpStore.ts, push.ts, haptics.ts for existing patterns

### Tertiary (LOW confidence)
- None - all key claims verified with official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - npm version verified, Capacitor 7 peer dependency confirmed
- Architecture: HIGH - follows existing project patterns (dpStore, push.ts)
- Pitfalls: MEDIUM - based on documentation; device validation recommended per STATE.md

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (30 days - stable plugin ecosystem)
