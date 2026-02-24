# Architecture Patterns: Capacitor iOS Native App Integration

**Domain:** Native iOS wrapper for existing fitness gamification PWA
**Researched:** 2026-02-21
**Confidence:** HIGH (based on direct codebase analysis + verified Capacitor/Supabase documentation)

## Current Architecture Snapshot

Before designing the Capacitor integration, here is what exists and what each module requires:

### Existing Module Inventory

| Module | Location | Capacitor Impact | Change Required |
|--------|----------|-----------------|-----------------|
| BrowserRouter | `src/main.tsx` | Works in WKWebView | NONE |
| Zustand + localStorage persist | `src/stores/*.ts` (8 stores) | localStorage unreliable on iOS | MEDIUM - adapter needed |
| Supabase auth (email/password) | `src/lib/supabase.ts`, `src/stores/authStore.ts` | Works but needs deep link handling for password reset | LOW |
| Service worker (vite-plugin-pwa) | `vite.config.ts`, `src/components/UpdatePrompt.tsx` | WKWebView does NOT support service workers | HIGH - must disable in native |
| navigator.vibrate haptics | `src/lib/haptics.ts` | 0% iOS support (already known) | HIGH - replace with @capacitor/haptics |
| File export (Blob + `<a download>`) | `src/screens/Settings.tsx` | `<a download>` does not work in WKWebView | HIGH - replace with Filesystem + Share |
| File import (FileReader) | `src/screens/Settings.tsx` | FileReader works, native file picker triggers | NONE |
| window.confirm (10 call sites) | `Workouts.tsx`, `Settings.tsx`, `Macros.tsx`, `Coach.tsx`, `Onboarding.tsx`, `WorkoutAssigner.tsx` | Works but looks non-native | LOW - optional upgrade to @capacitor/dialog |
| Online/offline detection | `src/App.tsx` (navigator.onLine, visibilitychange) | WebView events less reliable than native | MEDIUM - supplement with @capacitor/network + @capacitor/app |
| window.location.origin (password reset) | `src/stores/authStore.ts:197` | Returns `capacitor://localhost` in native | HIGH - must detect platform |
| Plausible analytics (`<script>` tag) | `index.html`, `src/lib/analytics.ts` | Script tag works in WebView but tracks wrong domain | MEDIUM - needs Plausible Events API |
| Sentry (@sentry/react) | `src/lib/sentry.ts` | Works but misses native crashes | MEDIUM - upgrade to @sentry/capacitor |
| visibilitychange sync | `src/App.tsx:68-79` | Less reliable in native app lifecycle | MEDIUM - supplement with @capacitor/app |
| UpdatePrompt (SW update) | `src/components/UpdatePrompt.tsx` | No service worker in native, component is useless | HIGH - must hide in native |

---

## Recommended Architecture

### High-Level: Thin Native Shell + Existing Web App

```
+--------------------------------------------------+
|  iOS App (Xcode Project)                         |
|  +--------------------------------------------+  |
|  |  WKWebView (Capacitor)                     |  |
|  |  +--------------------------------------+  |  |
|  |  |  Vite dist/ (React SPA)              |  |  |
|  |  |  - All existing screens              |  |  |
|  |  |  - Zustand stores                    |  |  |
|  |  |  - React Router (BrowserRouter)      |  |  |
|  |  |  - Supabase client                   |  |  |
|  |  +--------------------------------------+  |  |
|  |                                            |  |
|  |  Capacitor Bridge (JS <-> Swift)           |  |
|  |  - @capacitor/push-notifications           |  |
|  |  - @capacitor/haptics                      |  |
|  |  - @capacitor/filesystem + @capacitor/share|  |
|  |  - @capacitor/preferences                  |  |
|  |  - @capacitor/app + @capacitor/network     |  |
|  +--------------------------------------------+  |
|                                                  |
|  Native Layer (Swift)                            |
|  - AppDelegate (push notification delegates)     |
|  - Info.plist (permissions, URL schemes)         |
|  - PrivacyInfo.xcprivacy (privacy manifest)      |
|  - LaunchScreen.storyboard                       |
+--------------------------------------------------+
```

### Principle: Platform Abstraction Layer

Create a thin abstraction layer (`src/lib/platform.ts`) that detects the runtime environment and routes calls to the appropriate implementation. Web code stays unchanged; native overrides are injected conditionally.

```
src/
  lib/
    platform.ts          # NEW: Capacitor.isNativePlatform() + getPlatform()
    haptics.ts           # MODIFY: add native haptics branch
    storage.ts           # NEW: abstract over localStorage vs Preferences
    fileExport.ts        # NEW: abstract over Blob/<a> vs Filesystem+Share
    pushNotifications.ts # NEW: registration, token storage, listener setup
    analytics.ts         # MODIFY: add Events API branch for native
    sentry.ts            # MODIFY: use @sentry/capacitor in native
    supabase.ts          # MODIFY: redirect URL platform-aware, session storage
  hooks/
    useAppLifecycle.ts       # NEW: React hook for native app state changes
  components/
    PushPermissionPrompt.tsx # NEW: deferred push permission UX
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `platform.ts` | Single source of truth for `isNative()`, `getPlatform()` | Every module that branches on platform |
| `haptics.ts` (modified) | Unified haptics API: native Taptic Engine on iOS, navigator.vibrate on Android/web | Called from UI components (~15 call sites) |
| `storage.ts` | Wraps Zustand persist storage engine; uses `@capacitor/preferences` on native, `localStorage` on web | Zustand middleware configuration in all 8 stores |
| `pushNotifications.ts` | Register for push, store device token in Supabase, handle incoming notifications | `supabase.ts`, App.tsx initialization |
| `fileExport.ts` | Platform-aware file export: Filesystem.writeFile + Share.share on native, Blob+`<a>` on web | Settings screen |
| `useAppLifecycle.ts` | Replaces visibilitychange with @capacitor/app events on native; triggers sync on resume | `App.tsx` |
| Supabase Edge Function (`push/`) | Receives notification trigger, reads device tokens from DB, sends APNs payload | Supabase DB webhook, APNs |

---

## Integration Detail: Module by Module

### 1. Service Worker -- DISABLE in Native

**What changes:** WKWebView on iOS does not support service workers at all. The `vite-plugin-pwa` generates a service worker that will fail to register silently, but the `UpdatePrompt` component (which uses `useRegisterSW` from `virtual:pwa-register/react`) will break or behave unpredictably.

**Architecture:**

```typescript
// src/lib/platform.ts (NEW)
import { Capacitor } from '@capacitor/core'

export const isNative = () => Capacitor.isNativePlatform()
export const getPlatform = () => Capacitor.getPlatform() // 'ios' | 'android' | 'web'
export const isIOS = () => getPlatform() === 'ios'
```

```typescript
// src/components/UpdatePrompt.tsx (MODIFY)
import { isNative } from '@/lib/platform'

export function UpdatePrompt() {
  // Service workers don't exist in native WebView -- skip entirely
  if (isNative()) return null

  // ... existing useRegisterSW code unchanged
}
```

**Important:** The `useRegisterSW` hook must NOT be called when native. The early return before the hook is acceptable because the platform doesn't change mid-session (always native or always web). If React strict mode causes issues with conditional hooks, extract into two separate components: `WebUpdatePrompt` and a wrapper.

No changes needed to `vite.config.ts` -- the SW file will still be generated (needed for the PWA web build), but it simply won't be registered when running inside Capacitor.

**What stays unchanged:** The entire `vite-plugin-pwa` configuration, Workbox runtime caching rules, manifest. These only affect the web build. The SW file in `dist/` is harmless.

**Why not separate builds:** Maintaining a single build output that works for both web and native is simpler. One `dist/`, two deployment targets.

### 2. BrowserRouter -- WORKS AS-IS

**What changes:** Nothing. BrowserRouter works in Capacitor's WKWebView because Capacitor serves the app from `capacitor://localhost/` and handles all routing internally. React Router's `pushState`/`popState` work correctly in WKWebView.

**One caveat:** The `window.location.origin` call in `authStore.ts:197` will return `capacitor://localhost` instead of `https://app.welltrained.fitness`. This breaks Supabase password reset redirects. See section 4.

### 3. Zustand + localStorage Persistence -- STORAGE ADAPTER

**What changes:** iOS can evict localStorage data from WKWebView under storage pressure. This is the single biggest data integrity risk. All 8 Zustand stores use `persist` middleware with `localStorage` as the default storage engine.

**Affected stores (from codebase):**

| Store | Persist Name | Data Criticality |
|-------|-------------|-----------------|
| `userStore` | `gamify-gains-user` | HIGH - profile, weight history |
| `macroStore` | `gamify-gains-macros` | HIGH - daily logs, saved meals, favorites |
| `workoutStore` | `gamify-gains-workouts` | HIGH - workout logs |
| `xpStore` | `gamify-gains-xp` | MEDIUM - XP, level, pending XP |
| `avatarStore` | `gamify-gains-avatar` | LOW - cosmetic state |
| `achievementsStore` | `gamify-gains-achievements` | MEDIUM - unlocked badges |
| `accessStore` | `gamify-gains-access` | LOW - access gate bypass |
| `remindersStore` | `gamify-gains-reminders` | LOW - UI preferences |

**Architecture:**

```typescript
// src/lib/storage.ts (NEW)
import { Preferences } from '@capacitor/preferences'
import { isNative } from './platform'
import type { StateStorage } from 'zustand/middleware'

/**
 * Capacitor-safe storage adapter for Zustand persist middleware.
 * Uses @capacitor/preferences (UserDefaults) on native iOS/Android.
 * Falls back to localStorage on web (unchanged behavior).
 */
export const createCapacitorStorage = (): StateStorage => {
  if (!isNative()) {
    // Web: use localStorage exactly as before
    return {
      getItem: (name) => localStorage.getItem(name),
      setItem: (name, value) => localStorage.setItem(name, value),
      removeItem: (name) => localStorage.removeItem(name),
    }
  }

  // Native: use @capacitor/preferences (UserDefaults on iOS)
  return {
    getItem: async (name) => {
      const { value } = await Preferences.get({ key: name })
      return value
    },
    setItem: async (name, value) => {
      await Preferences.set({ key: name, value })
    },
    removeItem: async (name) => {
      await Preferences.remove({ key: name })
    },
  }
}
```

**Integration with existing stores:** Each store's `persist` call gets the new storage:

```typescript
// Example: src/stores/userStore.ts (MODIFY persist config)
import { createJSONStorage } from 'zustand/middleware'
import { createCapacitorStorage } from '@/lib/storage'

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({ /* ... unchanged ... */ }),
    {
      name: 'gamify-gains-user',
      storage: createJSONStorage(() => createCapacitorStorage()),
    }
  )
)
```

**Important:** Zustand's persist middleware already supports async storage (returns `Promise`). The `createJSONStorage` wrapper from `zustand/middleware` handles the async/sync difference transparently. Existing code that reads synchronously from stores continues to work because initial hydration happens once on app boot and Zustand handles the async hydration automatically.

**What stays unchanged:** All store logic, state shapes, actions, selectors. Only the storage engine configuration changes.

**Risk mitigation:** Because the app already has cloud sync (`pushClientData`/`pullCoachData`), even if local storage were somehow lost, data can be recovered from Supabase on next login. The Preferences adapter prevents this scenario in the first place.

### 4. Supabase Auth -- REDIRECT URL FIX + SESSION STORAGE

**What changes:** Two issues:

**Issue A:** Password reset redirect URL uses `window.location.origin`:

```typescript
// src/stores/authStore.ts:196-198 (current)
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`
})
```

In Capacitor, `window.location.origin` returns `capacitor://localhost`, which Supabase will reject as an invalid redirect URL.

**Issue B:** Supabase JS client uses `localStorage` internally for session persistence (access token, refresh token). Same iOS eviction risk as Zustand stores.

**Architecture:**

```typescript
// src/stores/authStore.ts (MODIFY)
import { isNative } from '@/lib/platform'

resetPassword: async (email: string) => {
  // ...
  const redirectOrigin = isNative()
    ? 'https://app.welltrained.fitness'  // Always use web URL for auth redirects
    : window.location.origin

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${redirectOrigin}/reset-password`
  })
  // ...
}
```

```typescript
// src/lib/supabase.ts (MODIFY for native session storage)
import { Preferences } from '@capacitor/preferences'
import { isNative } from './platform'

// Custom storage adapter for Supabase auth sessions on native
const supabaseStorageAdapter = isNative() ? {
  getItem: async (key: string) => {
    const { value } = await Preferences.get({ key })
    return value
  },
  setItem: async (key: string, value: string) => {
    await Preferences.set({ key, value })
  },
  removeItem: async (key: string) => {
    await Preferences.remove({ key })
  },
} : undefined  // undefined = use default localStorage on web

const _supabase = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: supabaseStorageAdapter,  // Native: UserDefaults, Web: localStorage
  }
})
```

**Deep link handling for password reset:** When the user clicks the reset password link in email, it opens in Safari (not the app). The user resets their password on the web. This is the simplest flow and matches how most native apps handle email-based auth flows. No deep link handling needed for this use case.

**For future OAuth flows (if ever needed):** Would require `@capacitor/app`'s `appUrlOpen` listener to capture Universal Links/custom URL schemes. Not needed for the current email/password-only auth.

**What stays unchanged:** All auth flows (signIn, signUp, signOut), auth state management, Sentry user tracking, auth state change listener.

### 5. Push Notifications -- NEW MODULE (Complete Data Flow)

**What changes:** This is entirely new functionality.

#### Full Data Flow

```
COACH ACTION (Coach.tsx)
    |
    v
SUPABASE DB (e.g., assigned_workouts INSERT)
    |
    v
DATABASE WEBHOOK (configured in Supabase Dashboard)
    |
    v
EDGE FUNCTION (supabase/functions/push/index.ts)
    |-- Reads device_tokens table for target user_id
    |-- Generates APNs JWT from .p8 key (stored as env secret)
    |
    v
APNs HTTP/2 API (api.push.apple.com)
    |
    v
iOS DEVICE (receives remote notification)
    |
    +-- App in FOREGROUND:
    |   PushNotifications 'pushNotificationReceived' fires
    |   -> Show in-app toast via toast.info()
    |
    +-- App in BACKGROUND / KILLED:
        System notification banner shown
        User taps notification
        -> PushNotifications 'pushNotificationActionPerformed' fires
        -> Navigate to relevant route (data.route)
```

#### Device Registration Architecture

```typescript
// src/lib/pushNotifications.ts (NEW)
import { PushNotifications } from '@capacitor/push-notifications'
import { isNative } from './platform'
import { getSupabaseClient } from './supabase'
import { captureError } from './sentry'
import { toast } from '@/stores/toastStore'

export async function requestPushPermission(): Promise<boolean> {
  if (!isNative()) return false

  const permission = await PushNotifications.requestPermissions()
  if (permission.receive !== 'granted') return false

  await PushNotifications.register()
  return true
}

export function initPushListeners(userId: string) {
  if (!isNative()) return

  // Token received from APNs
  PushNotifications.addListener('registration', async (token) => {
    await storeDeviceToken(userId, token.value)
  })

  // Registration failed
  PushNotifications.addListener('registrationError', (error) => {
    captureError(new Error(`Push registration failed: ${error.error}`))
  })

  // Notification received while app is in foreground
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    toast.info(notification.title || notification.body || 'New notification')
  })

  // User tapped notification (app was in background or killed)
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    const data = action.notification.data
    if (data?.route) {
      window.location.href = data.route  // Navigate to relevant screen
    }
  })
}

async function storeDeviceToken(userId: string, token: string) {
  const client = getSupabaseClient()
  await client.from('device_tokens').upsert({
    user_id: userId,
    token: token,
    platform: 'ios',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,platform' })
}

export async function removeDeviceToken(userId: string) {
  // Call on sign out to prevent notifications to wrong user
  const client = getSupabaseClient()
  await client.from('device_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('platform', 'ios')
}
```

#### Database Schema

```sql
-- New table: device_tokens
CREATE TABLE device_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- RLS: users can only manage their own tokens
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tokens"
  ON device_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for Edge Function lookups (service_role bypasses RLS)
CREATE INDEX idx_device_tokens_user_id ON device_tokens(user_id);
```

#### Supabase Edge Function (APNs Direct -- No Firebase)

```typescript
// supabase/functions/push/index.ts (NEW)
import { serve } from 'https://deno.land/std/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

serve(async (req) => {
  const { user_id, title, body, data } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Fetch device token(s) for user
  const { data: tokens } = await supabase
    .from('device_tokens')
    .select('token, platform')
    .eq('user_id', user_id)

  if (!tokens?.length) return new Response('No tokens', { status: 200 })

  for (const device of tokens) {
    if (device.platform === 'ios') {
      await sendAPNs(device.token, { title, body, data })
    }
  }

  return new Response('OK', { status: 200 })
})

async function sendAPNs(
  deviceToken: string,
  payload: { title: string; body: string; data?: Record<string, string> }
) {
  const jwt = await generateAPNsJWT()  // JWT from .p8 key stored as env secret
  const apnsUrl = `https://api.push.apple.com/3/device/${deviceToken}`

  await fetch(apnsUrl, {
    method: 'POST',
    headers: {
      'authorization': `bearer ${jwt}`,
      'apns-topic': 'fitness.welltrained.app',  // Must match Bundle ID
      'apns-push-type': 'alert',
    },
    body: JSON.stringify({
      aps: {
        alert: { title: payload.title, body: payload.body },
        sound: 'default',
        badge: 1,
      },
      ...payload.data,
    }),
  })
}
```

#### Notification Triggers (Coach Actions)

| Event | DB Table | Trigger | Notification |
|-------|----------|---------|-------------|
| Coach sets macros | `macro_targets` UPDATE with `set_by = 'coach'` | DB webhook | "Your coach updated your macros" |
| Coach assigns workout | `assigned_workouts` INSERT | DB webhook | "New workout assigned for [date]" |
| Coach reviews check-in | `weekly_checkins` UPDATE with `coach_response` filled | DB webhook | "Coach responded to your check-in" |

#### Token Lifecycle

1. App launch -> `initPushListeners(userId)` called after auth resolves
2. Deferred permission prompt at meaningful moment (first workout complete, first coach assignment)
3. If granted, APNs returns device token via `registration` event
4. Token stored in `device_tokens` table via Supabase client (upsert)
5. Token refreshed on each app launch (upsert handles updates)
6. On sign out, `removeDeviceToken()` deletes the row

### 6. Native Haptics -- REPLACE navigator.vibrate

**What changes:** The existing `src/lib/haptics.ts` uses `navigator.vibrate()` which has 0% iOS Safari/WKWebView support. Replace with `@capacitor/haptics` on native, keep `navigator.vibrate` as web/Android fallback.

**Current API surface (from codebase):**

| Method | Duration/Pattern | Usage | Native Equivalent |
|--------|-----------------|-------|-------------------|
| `haptics.light()` | 10ms | Set completion, toggles | `ImpactStyle.Light` |
| `haptics.medium()` | 25ms | Action confirmed | `ImpactStyle.Medium` |
| `haptics.success()` | [15, 50, 30] | Workout complete, check-in, achievement | `NotificationType.Success` |
| `haptics.heavy()` | 50ms | XP claim milestone | `ImpactStyle.Heavy` |
| `haptics.error()` | [50, 30, 50] | Error feedback | `NotificationType.Error` |

**Architecture:**

```typescript
// src/lib/haptics.ts (MODIFY)
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { isNative } from './platform'

const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator

export const haptics = {
  light: () => {
    if (isNative()) return Haptics.impact({ style: ImpactStyle.Light })
    if (canVibrate) navigator.vibrate(10)
  },
  medium: () => {
    if (isNative()) return Haptics.impact({ style: ImpactStyle.Medium })
    if (canVibrate) navigator.vibrate(25)
  },
  success: () => {
    if (isNative()) return Haptics.notification({ type: NotificationType.Success })
    if (canVibrate) navigator.vibrate([15, 50, 30])
  },
  heavy: () => {
    if (isNative()) return Haptics.impact({ style: ImpactStyle.Heavy })
    if (canVibrate) navigator.vibrate(50)
  },
  error: () => {
    if (isNative()) return Haptics.notification({ type: NotificationType.Error })
    if (canVibrate) navigator.vibrate([50, 30, 50])
  },
}
```

**What stays unchanged:** All call sites (~15 locations across UI components). The haptics API surface is identical -- same method names, same semantics.

### 7. File Export -- NATIVE FILE HANDLING

**What changes:** The current export creates a Blob, generates an object URL, and simulates a click on a hidden `<a download>` element. The `download` attribute does NOT work in WKWebView. Import uses `<input type="file">` + FileReader which works fine in WKWebView.

**Current flow (from `src/screens/Settings.tsx:183-193`):**
1. Export: `JSON.stringify` -> `new Blob()` -> `URL.createObjectURL()` -> `<a download>` click
2. Import: `<input type="file">` -> `FileReader.readAsText()` -> `JSON.parse` (NO CHANGE NEEDED)

**Architecture:**

```typescript
// src/lib/fileExport.ts (NEW)
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { isNative } from './platform'
import { getLocalDateString } from './dateUtils'

export async function exportBackup(data: object): Promise<void> {
  const dataStr = JSON.stringify(data, null, 2)
  const filename = `trained-backup-${getLocalDateString()}.json`

  if (isNative()) {
    // Native: write to cache directory, then share via native share sheet
    const result = await Filesystem.writeFile({
      path: filename,
      data: dataStr,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    })

    await Share.share({
      title: 'Trained Backup',
      url: result.uri,  // Native share sheet: AirDrop, Files, email, etc.
    })
  } else {
    // Web: existing Blob + <a download> approach (unchanged)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}
```

**Settings.tsx integration:** Replace the inline export code with a call to `exportBackup(exportObj)`.

**Import stays unchanged:** `<input type="file">` + FileReader works in WKWebView and triggers the native iOS file picker automatically.

### 8. App Lifecycle Events -- NATIVE SUPPLEMENT

**What changes:** The current `App.tsx` uses three web events for sync:
- `window.addEventListener('online', ...)` -- navigator.onLine
- `window.addEventListener('offline', ...)`
- `document.addEventListener('visibilitychange', ...)`

These work in WKWebView but are less reliable than native equivalents. The native `@capacitor/app` plugin fires real iOS lifecycle events (UIApplication notifications), and `@capacitor/network` provides native connectivity status.

**Architecture:**

```typescript
// src/hooks/useAppLifecycle.ts (NEW)
import { useEffect } from 'react'
import { App } from '@capacitor/app'
import { Network } from '@capacitor/network'
import { isNative } from '@/lib/platform'
import { useSyncStore } from '@/stores/syncStore'
import { pullCoachData, flushPendingSync } from '@/lib/sync'

/**
 * Supplements web lifecycle events with native equivalents.
 * On web: existing visibilitychange + online/offline in App.tsx (unchanged).
 * On native: adds @capacitor/app state changes + @capacitor/network.
 */
export function useAppLifecycle() {
  useEffect(() => {
    if (!isNative()) return  // Web uses existing event listeners in App.tsx

    let lastBackground = 0

    // Native app state (foreground/background)
    const stateListener = App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        lastBackground = Date.now()
      } else {
        // Returning to foreground after 30+ seconds -> sync
        const elapsed = Date.now() - lastBackground
        if (elapsed > 30_000) {
          pullCoachData()
          flushPendingSync()
        }
      }
    })

    // Native network status
    const networkListener = Network.addListener('networkStatusChange', (status) => {
      const store = useSyncStore.getState()
      if (status.connected) {
        store.setOnline(true)
        store.setStatus('synced')
        pullCoachData()
        flushPendingSync()
      } else {
        store.setOnline(false)
        store.setStatus('offline')
      }
    })

    return () => {
      stateListener.then(l => l.remove())
      networkListener.then(l => l.remove())
    }
  }, [])
}
```

**Integration:** Add `useAppLifecycle()` call in `App.tsx`'s `AppContent` component alongside existing web event listeners. The web listeners remain and still fire on web. On native, the Capacitor listeners provide more reliable signals.

**What stays unchanged:** The web event listeners in `App.tsx` lines 52-90, sync logic in `sync.ts`.

### 9. window.confirm Dialogs -- OPTIONAL NATIVE UPGRADE

**What changes:** 10 `window.confirm()` calls work in WKWebView and show standard iOS alert dialogs. They are functional but can be upgraded to `@capacitor/dialog` for a slightly more polished native feel.

**Locations (from codebase grep):**

| File | Line | Dialog Text |
|------|------|-------------|
| `Workouts.tsx` | 171 | "You haven't completed any sets. End workout anyway?" |
| `Workouts.tsx` | 861 | "Reset [type] exercises to defaults?" |
| `Settings.tsx` | 281 | "Are you sure? This will delete ALL your progress..." |
| `Macros.tsx` | 595 | "Delete this meal entry?" |
| `Macros.tsx` | 1230 | "Delete saved meal [name]?" |
| `WorkoutAssigner.tsx` | 70 | Confirm assignment overwrite |
| `Coach.tsx` | 136 | "Release macro targets back to client?" |
| `Coach.tsx` | 796 | "Delete this template?" |
| `Coach.tsx` | 807 | "Remove this assigned workout?" |
| `Onboarding.tsx` | 190 | "Skip setup and use default settings?" |

**Architecture (optional -- can defer to polish phase):**

```typescript
// src/lib/confirm.ts (NEW)
import { Dialog } from '@capacitor/dialog'
import { isNative } from './platform'

export async function confirm(message: string, title = 'Confirm'): Promise<boolean> {
  if (isNative()) {
    const { value } = await Dialog.confirm({ title, message })
    return value
  }
  return window.confirm(message)
}
```

**Trade-off:** Changing synchronous `window.confirm()` to `async confirm()` requires all 10 call sites to become async. This is low priority since `window.confirm()` works fine in WKWebView -- it produces a native iOS alert automatically.

### 10. Analytics (Plausible) -- EVENTS API FOR NATIVE

**What changes:** The Plausible `<script>` tag in `index.html` loads in WKWebView but sees `capacitor://localhost` as the page URL, not `app.welltrained.fitness`. Page views will not match the configured domain. Custom events may still fire but with wrong URL context.

**Architecture:**

```typescript
// src/lib/analytics.ts (MODIFY)
import { isNative, getPlatform } from './platform'

export function trackEvent(
  event: string,
  props?: Record<string, string | number | boolean>
) {
  if (import.meta.env.DEV) {
    console.log('[Analytics]', event, props)
    return
  }

  if (isNative()) {
    // Use Plausible Events API directly (bypasses script tag domain issues)
    fetch('https://plausible.io/api/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: event,
        domain: 'app.welltrained.fitness',
        url: `app://welltrained.fitness/${event.toLowerCase().replace(/\s/g, '-')}`,
        props: { ...props, platform: getPlatform() },
      }),
    }).catch(() => {})  // Fire and forget
  } else {
    // Web: existing Plausible script tag integration (unchanged)
    if (window.plausible) {
      window.plausible(event, props ? { props } : undefined)
    }
  }
}
```

**What stays unchanged:** All event definitions (`analytics.workoutCompleted`, etc.), all call sites. Only the transport mechanism changes for native.

### 11. Sentry -- UPGRADE TO @sentry/capacitor

**What changes:** Replace `@sentry/react` with `@sentry/capacitor` + `@sentry/react` pair. `@sentry/capacitor` wraps `@sentry/react` and adds native iOS crash reporting (Objective-C/Swift crashes, out-of-memory kills, native symbolication via dSYM upload).

**Architecture:**

```typescript
// src/lib/sentry.ts (MODIFY)
import * as SentryCapacitor from '@sentry/capacitor'
import * as SentryReact from '@sentry/react'
import { isNative } from './platform'

export function initSentry() {
  if (import.meta.env.DEV || !SENTRY_DSN) return

  if (isNative()) {
    // Native: Capacitor SDK wraps React SDK + adds native crash reporting
    SentryCapacitor.init({
      dsn: SENTRY_DSN,
      release: `fitness.welltrained.app@${APP_VERSION}`,
      dist: BUILD_NUMBER,
      integrations: [
        SentryReact.reactRouterV6BrowserTracingIntegration({
          useEffect, useLocation, useNavigationType,
          createRoutesFromChildren, matchRoutes,
        }),
      ],
      tracesSampleRate: 0.1,
    })
  } else {
    // Web: existing @sentry/react initialization (unchanged)
    SentryReact.init({ /* ... existing config exactly as-is ... */ })
  }
}

// All other exports remain the same (captureError, captureMessage, etc.)
// @sentry/capacitor re-exports all @sentry/react functions
```

**What stays unchanged:** All `captureError`, `captureMessage`, `setUser`, `clearUser` call sites. The `ErrorBoundary` component. The Sentry Vite plugin for source maps.

### 12. Capacitor Configuration

```typescript
// capacitor.config.ts (NEW)
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'fitness.welltrained.app',
  appName: 'WellTrained',
  webDir: 'dist',
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Keyboard: {
      resize: 'body',     // Resize body, not viewport (preserves vh units)
      style: 'dark',       // Match dark theme
    },
    StatusBar: {
      style: 'dark',            // Light text for dark background
      backgroundColor: '#0a0a0a',  // Match theme-color from index.html
    },
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#0a0a0a',
    },
  },
  ios: {
    scheme: 'WellTrained',
    contentInset: 'always',
  },
}

export default config
```

### 13. Xcode Project Configuration

Required capabilities and settings for the iOS project:

| Setting | Location | Value |
|---------|----------|-------|
| Push Notifications capability | Signing & Capabilities | Enable |
| Background Modes > Remote notifications | Signing & Capabilities | Enable |
| Bundle ID | General | `fitness.welltrained.app` |
| Deployment Target | General | iOS 16.0 (minimum for good WKWebView support) |
| UIFileSharingEnabled | Info.plist | YES (for file export to Files app) |
| LSSupportsOpeningDocumentsInPlace | Info.plist | YES |
| NSAppTransportSecurity (if needed) | Info.plist | Allow Supabase, Plausible domains |

---

## Patterns to Follow

### Pattern 1: Platform-Conditional at Module Boundary

**What:** Use `isNative()` checks at the module boundary (in `src/lib/`), not deep in component logic.

**When:** Every Capacitor plugin integration.

**Example:**

```typescript
// GOOD: Branch at the module boundary
// src/lib/haptics.ts
export const haptics = {
  light: () => isNative() ? nativeImpact(ImpactStyle.Light) : webVibrate(10),
}

// BAD: Branch deep in component
// src/screens/Workouts.tsx
const handleComplete = () => {
  if (Capacitor.isNativePlatform()) {
    Haptics.impact({ style: ImpactStyle.Heavy })
  } else {
    navigator.vibrate(50)
  }
}
```

**Why:** Keeps components platform-agnostic. All platform branching is isolated to `src/lib/` modules. Components never import from `@capacitor/*` directly.

### Pattern 2: Additive, Not Replacement

**What:** Capacitor native features supplement web features rather than replacing them entirely. Web code continues to work as-is.

**When:** Network detection, app lifecycle, storage.

**Example:** The web `online`/`offline`/`visibilitychange` event listeners stay in `App.tsx`. The native `@capacitor/app` and `@capacitor/network` listeners are added alongside via `useAppLifecycle()`.

**Why:** Single codebase serves both web (PWA) and native (Capacitor). Web users are completely unaffected.

### Pattern 3: Storage Abstraction for Data Safety

**What:** Never rely on `localStorage` directly for persistent data on native. Always go through the storage adapter.

**When:** All Zustand persist configurations, Supabase session storage.

**Why:** iOS WKWebView can evict localStorage under storage pressure. The adapter routes to UserDefaults (via `@capacitor/preferences`) on native, which is not subject to WebView storage eviction.

### Pattern 4: Deferred Push Permission

**What:** Don't request push permission on first launch. Wait until a meaningful moment.

**When:** After user completes first workout, or receives first coach assignment.

**Why:** iOS users who see a permission prompt before understanding the app's value will deny it. Once denied, re-prompting requires the user to navigate to iOS Settings. A pre-permission screen explaining the value dramatically improves opt-in rates.

### Pattern 5: Single Codebase, Dual Deployment

**What:** One `vite build` output serves both Vercel (PWA) and Capacitor (native). No separate build configurations or environment variables for platform differences.

**Why:** Runtime detection via `Capacitor.isNativePlatform()` keeps the codebase simple. Two build pipelines means two sets of bugs, version drift, and double the testing surface.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Separate Build Configs for Web vs Native

**What:** Creating different Vite configs or environment variables for web vs. native builds.
**Why bad:** Two build paths means two test surfaces, divergence over time, and bugs that only appear in one build.
**Instead:** One build, runtime detection.

### Anti-Pattern 2: Letting Service Worker Register in Native

**What:** Not guarding `useRegisterSW()` call in `UpdatePrompt.tsx`.
**Why bad:** WKWebView on iOS does not support service workers. Silent failure at best, bridge interference at worst.
**Instead:** Guard with `isNative()` check, return null.

### Anti-Pattern 3: Using Firebase for Push (Unnecessary Complexity)

**What:** Adding Firebase Cloud Messaging as an intermediary for iOS push notifications.
**Why bad:** Adds another service, another SDK, another config layer. APNs can be called directly from Edge Functions via HTTP/2.
**Instead:** Send directly to APNs from Supabase Edge Function using the .p8 key. Simpler, fewer moving parts, no Google dependency.

### Anti-Pattern 4: Replacing BrowserRouter with HashRouter

**What:** Switching to `#/` routes because "Capacitor needs it."
**Why bad:** This is a misconception from old Cordova days. Capacitor's WKWebView supports the History API. HashRouter breaks existing bookmarks and link sharing.
**Instead:** Keep BrowserRouter. It works.

### Anti-Pattern 5: Storing Push Tokens in localStorage / Zustand

**What:** Saving the APNs device token in Zustand or localStorage.
**Why bad:** Token can change (Apple rotates tokens). Token must be associated with user ID on the server for sending. Local storage is device-local -- useless for server-side push delivery.
**Instead:** Store tokens in Supabase `device_tokens` table. Upsert on every registration event.

### Anti-Pattern 6: Requesting Push Permission at Launch

**What:** Calling `PushNotifications.requestPermissions()` immediately on app start.
**Why bad:** iOS users who see a prompt before understanding the value will deny it. Once denied, it requires navigating to iOS Settings to re-enable.
**Instead:** Defer to meaningful moment with pre-permission explanation screen.

---

## New Capacitor Plugins Required

| Plugin | npm Package | Purpose | Phase |
|--------|------------|---------|-------|
| Core | `@capacitor/core` | Platform detection, plugin bridge | 1 |
| CLI | `@capacitor/cli` (devDep) | Build tooling, `npx cap sync` | 1 |
| iOS platform | `@capacitor/ios` | iOS native shell | 1 |
| Preferences | `@capacitor/preferences` | Persistent key-value (UserDefaults) | 1 |
| App | `@capacitor/app` | Lifecycle events, URL open | 2 |
| Network | `@capacitor/network` | Native online/offline detection | 2 |
| Haptics | `@capacitor/haptics` | Native Taptic Engine feedback | 2 |
| Keyboard | `@capacitor/keyboard` | Keyboard resize behavior | 2 |
| Status Bar | `@capacitor/status-bar` | Status bar styling | 2 |
| Splash Screen | `@capacitor/splash-screen` | Launch screen | 2 |
| Push Notifications | `@capacitor/push-notifications` | APNs registration + handling | 3 |
| Filesystem | `@capacitor/filesystem` | Write files to device storage | 4 |
| Share | `@capacitor/share` | Native share sheet | 4 |
| Dialog | `@capacitor/dialog` | Native confirm/alert (optional) | 4 |
| Sentry Capacitor | `@sentry/capacitor` | Native crash reporting | 4 |

**Installation:**

```bash
# Core Capacitor
npm install @capacitor/core
npm install -D @capacitor/cli
npm install @capacitor/ios

# Phase 1 plugins
npm install @capacitor/preferences

# Phase 2 plugins
npm install @capacitor/app @capacitor/network @capacitor/haptics \
  @capacitor/keyboard @capacitor/status-bar @capacitor/splash-screen

# Phase 3 plugins
npm install @capacitor/push-notifications

# Phase 4 plugins
npm install @capacitor/filesystem @capacitor/share @capacitor/dialog @sentry/capacitor

# Initialize iOS project
npx cap init WellTrained fitness.welltrained.app --web-dir dist
npx cap add ios
npm run build && npx cap sync ios
```

---

## Build Pipeline Changes

### Current (Web Only)

```
npm run build  -->  dist/  -->  Vercel deploy
```

### With Capacitor (Web + iOS)

```
npm run build  -->  dist/  -->  Vercel deploy (web, unchanged)
                       |
                       v
                 npx cap sync ios  -->  ios/ (Xcode project updated)
                       |
                       v
                 Xcode archive  -->  App Store Connect
```

**Key insight:** ONE Vite build, TWO deployment targets. No separate "native build" of the web app.

### Development Workflow

```bash
# Web development (unchanged)
npm run dev

# iOS development (with live reload from Vite dev server)
npm run dev &
# In capacitor.config.ts, temporarily set:
#   server: { url: 'http://YOUR_LOCAL_IP:5173' }
npx cap open ios
# Run from Xcode on simulator/device
# Remember to remove server.url before production build
```

---

## What Stays Completely Unchanged

These modules require ZERO changes for Capacitor integration:

| Module | Why No Change |
|--------|--------------|
| React 18 + JSX | Renders in WKWebView identically to browser |
| React Router v6 (BrowserRouter) | History API works in WKWebView |
| Zustand store logic (all actions, selectors, state) | Only storage engine config changes |
| Tailwind CSS styling | CSS renders identically in WKWebView |
| All Supabase queries (sync.ts, hooks) | HTTP requests work identically |
| Lucide icons (SVG) | SVG renders in WKWebView |
| Radix UI, CVA, clsx, tailwind-merge | DOM-based, platform-agnostic |
| All screen components (Home, Workouts, Macros, etc.) | No platform-specific code |
| Coach.tsx (all 1700+ lines) | No platform-specific code |
| Toast system (sonner) | DOM-based notifications |
| Theme tokens and CSS custom properties | Pure CSS |
| Lazy loading with React.lazy + Suspense | Standard JS dynamic imports |
| Manual chunks in Vite rollup config | Build optimization, not runtime |
| Import path alias (`@/`) | Vite resolve config, not runtime |
| ESLint config | Development tooling only |
| Vitest + Playwright | Testing tooling only |

---

## Suggested Build Order (Dependency-Aware)

```
Phase 1: Foundation (must come first -- everything depends on this)
  1. capacitor.config.ts + npx cap add ios
  2. platform.ts (isNative, getPlatform)
  3. storage.ts adapter (Preferences on native)
  4. Wire storage adapter into all 8 Zustand stores
  5. Wire storage adapter into Supabase auth config
     => At this point: app runs in Capacitor with reliable persistence

Phase 2: Core Native Features (independent of each other)
  6. haptics.ts native branch
  7. useAppLifecycle.ts (App + Network plugins)
  8. UpdatePrompt.tsx native guard
  9. authStore.ts redirect URL fix
  10. Keyboard, StatusBar, SplashScreen config
      => At this point: fully functional native app (minus push + export)

Phase 3: Push Notifications (requires Apple Developer setup)
  11. Apple Developer: create App ID, enable Push, generate .p8 key
  12. Xcode: add Push Notifications + Background Modes capabilities
  13. device_tokens migration
  14. pushNotifications.ts (registration, listeners)
  15. Edge Function: push/ (APNs integration)
  16. Database webhooks for notification triggers
  17. PushPermissionPrompt.tsx (deferred permission UX)
      => Push notifications fully operational

Phase 4: Polish + Distribution
  18. fileExport.ts (Filesystem + Share)
  19. analytics.ts (Plausible Events API for native)
  20. sentry.ts (@sentry/capacitor upgrade)
  21. confirm.ts (optional Dialog replacement)
  22. App icons, splash screens, PrivacyInfo.xcprivacy
  23. TestFlight beta testing
  24. App Store Connect submission
```

---

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 100K users |
|---------|------------|------------|-------------|
| Device token storage | Single table, trivial | Index on user_id sufficient | Add cleanup cron for stale tokens |
| Push notification delivery | Sequential APNs calls OK | Batch Edge Function calls | Queue system or third-party service |
| APNs rate limits | No concern | No concern | 100K+ per second per key |
| Edge Function invocations | Well within free tier | Supabase Pro plan | Consider dedicated push service |
| App Store review | Standard review (~24-48h) | No change | No change |
| TestFlight distribution | Manual Xcode builds | Fastlane automation | CI/CD (GitHub Actions + Fastlane) |

---

## Sources

- [Capacitor Push Notifications Plugin API](https://capacitorjs.com/docs/apis/push-notifications) -- HIGH confidence
- [Capacitor Haptics Plugin API](https://capacitorjs.com/docs/apis/haptics) -- HIGH confidence
- [Capacitor App Plugin API](https://capacitorjs.com/docs/apis/app) -- HIGH confidence
- [Capacitor Preferences Plugin API](https://capacitorjs.com/docs/apis/preferences) -- HIGH confidence
- [Capacitor Filesystem Plugin API](https://capacitorjs.com/docs/apis/filesystem) -- HIGH confidence
- [Capacitor Share Plugin API](https://capacitorjs.com/docs/apis/share) -- HIGH confidence
- [Capacitor Network Plugin API](https://capacitorjs.com/docs/apis/network) -- HIGH confidence
- [Capacitor Dialog Plugin API](https://capacitorjs.com/docs/apis/dialog) -- HIGH confidence
- [Capacitor Configuration Docs](https://capacitorjs.com/docs/config) -- HIGH confidence
- [Capacitor JavaScript Utilities](https://capacitorjs.com/docs/basics/utilities) -- HIGH confidence
- [Sentry Capacitor SDK](https://docs.sentry.io/platforms/javascript/guides/capacitor/) -- HIGH confidence
- [Supabase Push Notifications Guide](https://supabase.com/docs/guides/functions/examples/push-notifications) -- HIGH confidence
- [Supabase Native Mobile Deep Linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking) -- HIGH confidence
- [Supabase Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls) -- HIGH confidence
- [Capacitor Service Worker iOS Issue #7069](https://github.com/ionic-team/capacitor/issues/7069) -- HIGH confidence (confirms no SW in WKWebView)
- [Capacitor localStorage Persistence Discussion #3321](https://github.com/ionic-team/capacitor/discussions/3321) -- HIGH confidence (confirms eviction risk)
- [WKWebView localStorage lost - Apple Developer Forums](https://developer.apple.com/forums/thread/742037) -- HIGH confidence
- [Capawesome Push Notifications Guide](https://capawesome.io/blog/the-push-notifications-guide-for-capacitor/) -- MEDIUM confidence
- [Plausible Mobile App Tracking Discussion](https://github.com/plausible/analytics/discussions/677) -- MEDIUM confidence
