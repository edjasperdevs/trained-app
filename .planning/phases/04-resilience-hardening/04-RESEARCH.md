# Phase 4: Resilience Hardening - Research

**Researched:** 2026-02-05
**Domain:** Offline-first PWA resilience, network error handling, sync reliability
**Confidence:** HIGH

## Summary

This research investigates the current state of network handling, sync logic, food API fallback, and offline capabilities in the Trained PWA. The codebase already has significant resilience infrastructure -- Zustand persist for offline data, service worker runtime caching, exponential backoff retry in sync.ts, and a food API fallback chain. However, several gaps exist: sync only triggers on login (never again during a session), there is no online/offline detection, no user-facing sync status, no "saved locally" feedback after actions, and the food API fallback only triggers on full failure (not specifically on rate limiting/429 status).

The key finding is that **much of the hard infrastructure already exists** -- the work is primarily about connecting existing pieces, adding visibility, and filling specific gaps. No new libraries are needed. The resilience hardening is achievable with modifications to existing files rather than new architectural patterns.

**Primary recommendation:** Wire up incremental sync triggers after key actions (workout complete, meal log), add navigator.onLine detection with a sync status indicator in the app shell, enhance food API error handling for rate limits specifically, and add "saved locally" toast feedback for offline writes.

## Standard Stack

No new libraries needed. Everything required is already in the project or available as browser APIs.

### Core (Already Installed)
| Library | Version | Purpose | Relevance to Phase 4 |
|---------|---------|---------|----------------------|
| zustand | ^4.5.2 | State management with persist middleware | All stores already persist to localStorage -- offline-first foundation exists |
| @supabase/supabase-js | ^2.93.3 | Backend client | All sync operations use this |
| vite-plugin-pwa | ^0.19.8 | Service worker generation | Runtime caching rules already configured |
| workbox-window | ^7.0.0 | Service worker communication | Already a devDep, used for update prompt |

### Browser APIs to Use (No Install)
| API | Purpose | Support |
|-----|---------|---------|
| `navigator.onLine` | Basic online/offline detection | All modern browsers |
| `window.addEventListener('online'/'offline')` | React to connectivity changes | All modern browsers |
| `AbortController` | Timeout network requests | All modern browsers |

### Alternatives Considered
| Instead of | Could Use | Why NOT |
|------------|-----------|---------|
| Custom online detection | `@tanstack/query` online manager | Overkill -- app uses Zustand, not React Query |
| Periodic heartbeat | `navigator.connection` (Network Information API) | Limited browser support, `navigator.onLine` sufficient |
| IndexedDB | Dexie.js for larger offline storage | localStorage via Zustand persist already handles all data; volume is small |

## Architecture Patterns

### Current Architecture (What Exists)

```
User Action (workout complete, meal log)
    |
    v
Zustand Store (set()) --> localStorage (automatic via persist middleware)
    |
    X  <-- NO sync trigger here today

Auth Events Only:
signIn/signUp --> authStore.syncData() --> loadAllFromCloud() + syncAllToCloud()
                                               |
                                               v
                                     withRetry (3 attempts, exp backoff)
```

**Critical gap:** After login, sync NEVER triggers again during a session. If a user logs a workout, it is saved to localStorage but never pushed to Supabase until next login.

### Target Architecture (What to Build)

```
User Action (workout complete, meal log, check-in)
    |
    v
Zustand Store (set()) --> localStorage (automatic)
    |
    +--> toast("Saved locally") if offline
    |
    +--> scheduleSync() if online
              |
              v
         syncStore (new) -- tracks: syncStatus, pendingSyncItems, lastSyncTime
              |
              v
         Debounced sync execution (withRetry)
              |
              +--> Success: syncStatus = 'synced', toast("Synced to cloud")
              +--> Failure: syncStatus = 'error', queue for retry on reconnect

Online/Offline Events:
    'offline' --> syncStatus = 'offline'
    'online'  --> flush pending syncs
```

### Recommended Project Structure (Changes Only)

```
src/
  lib/
    sync.ts           # MODIFY: Already has retry logic, add granular sync triggers
    foodApi.ts         # MODIFY: Add rate-limit-specific detection + explicit fallback
    errors.ts          # MODIFY: Add rate limit error handling
    networkStatus.ts   # NEW: Online/offline detection hook + sync scheduling
  stores/
    syncStore.ts       # NEW: Sync status state (synced/syncing/offline/error)
    authStore.ts       # MODIFY: Use syncStore for status tracking
  components/
    SyncStatusIndicator.tsx  # NEW: Visual indicator in app shell
  App.tsx              # MODIFY: Mount SyncStatusIndicator + online/offline listeners
```

### Pattern 1: Sync Status Store
**What:** A dedicated Zustand store (non-persisted) tracking sync state
**When to use:** Any component needs to know current sync status
**Example:**
```typescript
// src/stores/syncStore.ts
import { create } from 'zustand'

type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error'

interface SyncStore {
  status: SyncStatus
  lastSyncedAt: string | null
  isOnline: boolean
  pendingChanges: boolean
  setStatus: (status: SyncStatus) => void
  setOnline: (online: boolean) => void
  setPendingChanges: (pending: boolean) => void
  setLastSyncedAt: (date: string) => void
}

export const useSyncStore = create<SyncStore>((set) => ({
  status: navigator.onLine ? 'synced' : 'offline',
  lastSyncedAt: null,
  isOnline: navigator.onLine,
  pendingChanges: false,
  setStatus: (status) => set({ status }),
  setOnline: (online) => set({ isOnline: online, status: online ? 'synced' : 'offline' }),
  setPendingChanges: (pending) => set({ pendingChanges: pending }),
  setLastSyncedAt: (date) => set({ lastSyncedAt: date }),
}))
```

### Pattern 2: Online/Offline Hook
**What:** A React hook that listens to browser online/offline events and triggers sync on reconnection
**When to use:** App.tsx mounts this once at the top level
**Example:**
```typescript
// Inside a useEffect in App.tsx or a dedicated hook
useEffect(() => {
  const handleOnline = () => {
    useSyncStore.getState().setOnline(true)
    // Flush pending syncs
    if (useSyncStore.getState().pendingChanges) {
      authStore.getState().syncData()
    }
  }
  const handleOffline = () => {
    useSyncStore.getState().setOnline(false)
  }
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}, [])
```

### Pattern 3: Incremental Sync After Actions
**What:** Trigger individual sync operations (not full syncAll) after specific user actions
**When to use:** After workout complete, meal log, check-in
**Example:**
```typescript
// In Workouts.tsx handleCompleteWorkout
completeWorkout(activeWorkout.id)
// ... existing XP logic ...

// Trigger sync for this specific workout (non-blocking)
if (navigator.onLine && supabase) {
  syncWorkoutLogToCloud(activeWorkout.id).catch(() => {
    useSyncStore.getState().setPendingChanges(true)
  })
} else {
  useSyncStore.getState().setPendingChanges(true)
  toast.info('Workout saved locally. Will sync when online.')
}
```

### Anti-Patterns to Avoid
- **Full sync on every action:** `syncAllToCloud()` re-syncs everything. Use granular sync functions (e.g., `syncWorkoutLogToCloud(id)`) for incremental updates after actions.
- **Blocking UI on sync:** Sync should be fire-and-forget from the user's perspective. Never block a button or navigation on sync completing.
- **Relying on navigator.onLine alone:** It reports the device's network adapter status, not actual internet connectivity. A device can be "online" but behind a captive portal. Use it as a quick check but handle fetch failures gracefully regardless.
- **Showing raw API errors:** Always use `friendlyError()` or custom messages. Never expose "PGRST..." or "FetchError" to users.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Exponential backoff retry | Custom retry loop | `withRetry()` in sync.ts | Already exists with jitter, configurable delays |
| Offline data persistence | IndexedDB abstraction | Zustand `persist` middleware | Already configured on all stores, data fits in localStorage |
| Service worker caching | Custom SW | Workbox via vite-plugin-pwa | Already configured with runtime caching rules |
| User-friendly errors | Error string parsing | `friendlyError()` in errors.ts | Already handles network, storage, JSON, permission errors |
| Toast notifications | Custom notification system | `toast` helpers from toastStore | Already has success/error/warning/info types |
| Haptic feedback | vibration API direct | `haptics` utility | Already has light/medium/success/error patterns |

**Key insight:** The app already has all the building blocks for resilience. The gap is wiring them together -- triggering sync at the right times, detecting online/offline, and showing status to the user.

## Common Pitfalls

### Pitfall 1: navigator.onLine False Positives
**What goes wrong:** `navigator.onLine` returns `true` but the user has no actual internet (captive portal, DNS failure, firewall).
**Why it happens:** The browser only checks if the network adapter is connected, not if the internet is reachable.
**How to avoid:** Always handle fetch failures gracefully regardless of `navigator.onLine` state. Use it for UI hints (showing "offline" banner) but never as a gate for attempting sync.
**Warning signs:** Users report "says synced but data didn't sync" -- that means code trusted onLine without handling fetch errors.

### Pitfall 2: Sync Loops on Error
**What goes wrong:** A sync error triggers a retry, which fails, which triggers another retry indefinitely.
**Why it happens:** Retry logic without maximum attempt limits or without distinguishing transient vs permanent errors.
**How to avoid:** The existing `withRetry` already has `maxRetries: 3` and distinguishes logical errors from network errors (lines 63-68 in sync.ts). When adding new sync triggers, always use `withRetryResult()` wrapper, never call sync functions directly without error handling.
**Warning signs:** Console filled with "[Sync] Retry" messages, battery drain on mobile.

### Pitfall 3: Race Conditions in Concurrent Syncs
**What goes wrong:** User completes workout + logs meal rapidly. Two syncs fire simultaneously. Both read partial state and overwrite each other's data.
**Why it happens:** Individual sync functions read from Zustand stores which are being updated concurrently.
**How to avoid:** Use a debounced sync scheduler that batches rapid changes. Or use a simple mutex/queue for sync operations. The current `syncAllToCloud()` runs operations sequentially (with `await`), which is safe -- the risk is if multiple `syncAllToCloud()` calls overlap.
**Warning signs:** Data appears to "revert" after sync, or meals disappear after completing a workout.

### Pitfall 4: USDA API Rate Limiting (429 Status)
**What goes wrong:** USDA API returns 429 Too Many Requests. Current code treats this as a generic error and falls back to Open Food Facts.
**Why it happens:** USDA DEMO_KEY has very low rate limits (30 requests/hour). Even with a real API key, heavy usage can hit limits.
**How to avoid:** Detect 429 specifically. When hit, set a cooldown flag and route directly to Open Food Facts for subsequent requests during the cooldown period, rather than trying USDA first every time.
**Warning signs:** Food search becomes slow (each search tries USDA, waits for timeout/rejection, then falls back).

### Pitfall 5: Stale Cached API Responses
**What goes wrong:** USDA food search results are cached with `CacheFirst` strategy (in vite.config.ts). If USDA returns a rate limit error (429), it could get cached, breaking all future searches for that query.
**Why it happens:** The `cacheableResponse` config caches statuses `[0, 200]` which should NOT cache 429s. But status 0 (opaque response from CORS) could mask the actual status.
**How to avoid:** Verify that the runtime caching only caches successful responses. Status 0 is the concern -- opaque responses may be errors. Consider switching food API caching to `StaleWhileRevalidate` or `NetworkFirst` instead of `CacheFirst` if issues arise.
**Warning signs:** Same food search returns empty results even after rate limit window passes.

### Pitfall 6: No Sync After Zustand Persist Rehydration
**What goes wrong:** User opens app (stores rehydrate from localStorage) but sync never fires because auth events already happened in a previous session.
**Why it happens:** `authStore.syncData()` only fires on `signIn`/`signUp` events, not on app open with an existing session.
**How to avoid:** Add a sync trigger in the auth initialization flow -- when `getSession()` returns an existing valid session, also trigger a background sync.
**Warning signs:** User has data on device A, logs in on device B, opens device A later and doesn't see device B's data until they manually sign out and sign in again.

## Code Examples

### Example 1: Current Food API Fallback (Already Working)
```typescript
// src/lib/foodApi.ts lines 50-65
export async function searchFoods(query: string): Promise<FoodSearchResult[]> {
  if (!query.trim()) return []
  try {
    const usdaResults = await searchUSDA(query)
    if (usdaResults.length > 0) return usdaResults
  } catch (error) {
    console.warn('USDA API failed, falling back to Open Food Facts:', error)
  }
  return searchOpenFoodFacts(query)
}
```
**Note:** This already falls back on ANY USDA failure. The gap is: (1) no rate-limit-specific detection, (2) no cooldown to skip USDA temporarily after rate limiting, (3) no user feedback about which source is being used.

### Example 2: Current Retry Logic (Already Working)
```typescript
// src/lib/sync.ts lines 24-53
async function withRetry<T>(fn, options = {}): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 500, maxDelayMs = 5000 } = options
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxRetries) break
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt) + Math.random() * 100, maxDelayMs)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw lastError
}
```

### Example 3: Current Sync Trigger Points (Only on Auth)
```typescript
// src/stores/authStore.ts -- the ONLY places sync fires today
signIn: async (email, password) => {
  // ... auth logic ...
  get().syncData()   // <-- Sync triggered
}
signUp: async (email, password) => {
  // ... auth logic ...
  get().syncData()   // <-- Sync triggered
}
// syncData calls loadAllFromCloud() then syncAllToCloud()
```
**Gap:** No sync after: workout complete, meal logged, check-in, app resume, or reconnection.

### Example 4: Current Error Handling Pattern
```typescript
// src/lib/errors.ts -- friendlyError()
// Translates: 'fetch'/'network'/'NetworkError'/'Failed to fetch'
//   --> "Couldn't {context}. Check your internet connection and try again."
// Also handles: storage quota, JSON parse, permission errors
```
**Gap:** No handling for 429 rate limits or specific HTTP status codes.

### Example 5: Where Sync Status Indicator Would Go
```typescript
// src/App.tsx lines 108-126 -- authenticated app shell
return (
  <>
    <ToastContainer />
    <div className="relative">
      {/* SyncStatusIndicator would go HERE */}
      <Routes>...</Routes>
      <Navigation />
    </div>
  </>
)
```

## State of the Art

| What Exists | What's Missing | Impact |
|-------------|----------------|--------|
| Zustand persist on ALL stores | No "saved locally" feedback | Users don't know data is safe offline |
| withRetry + exponential backoff | Only used in syncAllToCloud | Individual sync calls from screens don't retry |
| Food API fallback (USDA -> OFF) | No rate-limit detection (429) | Slow fallback on every request during rate limit window |
| Service worker caches Supabase REST | No user visibility of cache status | Users don't know if viewing cached data |
| Toast notification system | No sync-specific toasts | No feedback on sync success/failure |
| `navigator.onLine` browser API | Not used anywhere in the app | No online/offline detection at all |
| `isSyncing` in authStore | Only used internally, never shown in UI | User has no sync status visibility |

## Specific Gap Analysis by Success Criterion

### SC1: "Workout logging works completely offline with saved locally feedback"
**Already works:** Workout data saves to localStorage via Zustand persist. User CAN log workouts offline.
**Missing:** No "saved locally" feedback. No sync trigger after workout completion. User gets no indication that data needs to sync.
**Work needed:** Add toast feedback when offline. Add sync trigger after `completeWorkout()` and `endWorkoutEarly()` when online.

### SC2: "Food search falls back to Open Food Facts when USDA rate limits"
**Already works:** `searchFoods()` in foodApi.ts catches USDA errors and falls back to Open Food Facts.
**Partially missing:** The fallback triggers on any USDA failure, but doesn't specifically detect 429 rate limit responses. After a 429, subsequent searches still try USDA first (adding latency). No user feedback about which source was used.
**Work needed:** Add 429 detection in searchUSDA. Add temporary cooldown to skip USDA. Add friendlyError handling for rate limits. Optionally show "Results from Open Food Facts" indicator.

### SC3: "Failed cloud syncs retry automatically with exponential backoff"
**Already works:** `withRetry()` and `withRetryResult()` provide exponential backoff with jitter, used by `syncAllToCloud()`.
**Missing:** Sync only triggers on login. No retry on reconnection. No background retry for individual operations.
**Work needed:** Add online/offline event listeners. On reconnect, flush pending syncs. Add incremental sync triggers after key actions. Track pending changes for retry on reconnect.

### SC4: "User sees clear sync status indicator (synced/syncing/offline)"
**Partially exists:** `authStore.isSyncing` tracks syncing state but is never shown in UI.
**Missing:** No sync status UI. No "offline" indicator. No "last synced at" display.
**Work needed:** Create syncStore for status tracking. Create SyncStatusIndicator component. Mount in App.tsx app shell. Wire up online/offline events and sync completion to update status.

## Open Questions

1. **Where exactly should sync status indicator render?**
   - What we know: The Navigation bar is fixed at the bottom. ToastContainer is at bottom-20 or top-4. The header area varies per screen.
   - Recommendation: A small dot/badge on the Navigation bar (perhaps near Settings icon), or a thin status bar just above Navigation. Could also be a persistent small indicator in the app header area. The simplest approach is a small icon in the nav bar that changes color based on sync status.

2. **Should sync be triggered on app visibility change (tab focus)?**
   - What we know: The `visibilitychange` event fires when users switch back to the app. This is a natural sync trigger point.
   - Recommendation: Yes, add a visibility change listener that triggers sync when the app becomes visible after being hidden for >30 seconds. This catches the common pattern of users switching between apps.

3. **How aggressively should "saved locally" toasts fire?**
   - What we know: The toast system auto-dismisses after 4 seconds. Too many toasts are annoying.
   - Recommendation: Only show "saved locally" toast when OFFLINE. When online, sync silently. Only show sync error toasts on actual failures. This avoids notification fatigue.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of all files listed above
- `src/lib/sync.ts` -- Full sync implementation with retry logic
- `src/lib/foodApi.ts` -- USDA + Open Food Facts fallback chain
- `src/stores/authStore.ts` -- Only sync trigger points (signIn/signUp)
- `vite.config.ts` -- Service worker runtime caching configuration

### Secondary (MEDIUM confidence)
- Navigator.onLine API is well-documented in MDN and works in all modern browsers
- USDA FoodData Central API rate limits: DEMO_KEY is limited to 30 requests/hour per IP, real keys have higher limits
- Workbox CacheFirst strategy behavior with `cacheableResponse` configuration

### Tertiary (LOW confidence)
- Specific USDA rate limit response format (429 status vs other error handling) -- needs validation during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use, no new dependencies needed
- Architecture: HIGH - Patterns derived directly from existing codebase analysis
- Pitfalls: HIGH - Based on observed code gaps and known browser API limitations
- Gap analysis: HIGH - Verified against actual code line by line

**Research date:** 2026-02-05
**Valid until:** 2026-03-05 (stable -- no fast-moving dependencies)
