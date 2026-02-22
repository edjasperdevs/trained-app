# Phase 14: Remote Push Notifications - Research

**Researched:** 2026-02-22
**Domain:** APNs push notifications via Capacitor + Supabase Edge Functions
**Confidence:** HIGH

## Summary

Remote push notifications for the Trained app require three coordinated subsystems: (1) client-side APNs token registration using `@capacitor/push-notifications`, (2) server-side notification delivery via a Supabase Edge Function that speaks APNs HTTP/2 directly, and (3) a database trigger mechanism that fires the Edge Function when the coach performs an action.

The `@capacitor/push-notifications` plugin (v7.0.5 for Capacitor 7.x) has **no Firebase dependency** in its iOS podspec -- it depends only on the base `Capacitor` pod. On iOS, the plugin's `registration` event returns the raw APNs device token (not an FCM token). This confirms the "direct APNs without Firebase" architecture is viable with zero additional native dependencies.

Deno's `fetch` API automatically negotiates HTTP/2 via TLS ALPN when connecting to HTTPS endpoints, meaning Supabase Edge Functions can send directly to `api.push.apple.com` without any special HTTP/2 client library. JWT signing for APNs provider authentication uses ES256 (ECDSA P-256 + SHA-256), which is supported by Deno's Web Crypto API and the `jose` library's `importPKCS8` function.

**Primary recommendation:** Use database webhooks (pg_net-based) on three tables to trigger a single `send-push` Edge Function that reads device tokens from Supabase and sends to APNs HTTP/2 directly. Store the .p8 key as a Supabase secret. Prompt for push permission after the user's first meaningful coach interaction (not on first launch).

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@capacitor/push-notifications` | ^7.0.5 | APNs token registration + notification handling | Official Capacitor plugin; returns raw APNs token on iOS, no Firebase dependency in podspec |
| `jose` (npm) | ^5.x | ES256 JWT signing in Edge Function | Deno-compatible, supports `importPKCS8` for .p8 keys, maintained by panva |
| Supabase Edge Function | Deno runtime | APNs HTTP/2 push delivery | Already used for `send-invite` and `handle-intake-complete`; Deno fetch negotiates HTTP/2 automatically |
| Supabase Database Webhooks | pg_net | Trigger notifications on coach actions | Async, non-blocking, built into Supabase -- no additional infrastructure |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `capacitor-native-settings` | ^7.x | Open iOS Settings for denied permission recovery | Only needed if user denies push permission and wants to re-enable |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Database webhooks | Client-side Edge Function invocation after mutation | Requires modifying 3 coach action hooks; webhooks are decoupled and automatic |
| Database webhooks | pg_notify + pg_cron queue | More complex, better for high-volume (1000+ simultaneous); overkill for ~90 clients |
| `jose` | `djwt` (Deno native) | djwt is Deno-specific; jose is cross-runtime and more widely maintained |
| `jose` importPKCS8 | Web Crypto `subtle.importKey` directly | Works, but jose provides cleaner API for full JWT creation + signing in one step |
| Direct APNs | Firebase Cloud Messaging | Adds Firebase SDK, GoogleService-Info.plist, third-party service -- unnecessary for iOS-only |

**Installation:**
```bash
npm install @capacitor/push-notifications
npx cap sync
```

## Architecture Patterns

### Recommended Project Structure

```
src/
  lib/
    push.ts              # Push registration, permission, listeners, token storage
    deep-link.ts         # EXISTING -- extend for push notification tap navigation
  stores/
    (no new store)       # Push state is transient, not persisted
supabase/
  functions/
    send-push/
      index.ts           # Edge Function: receives webhook, sends APNs
    _shared/
      apns.ts            # APNs JWT generation + HTTP/2 send helper
      cors.ts            # EXISTING
  migrations/
    011_device_tokens.sql # New table for device tokens
ios/
  App/App/
    App.entitlements     # MODIFY: add Push Notifications entitlement
    AppDelegate.swift    # MODIFY: add push registration delegate methods
```

### Pattern 1: Push Registration Flow

**What:** Register for push notifications, store APNs token in Supabase
**When to use:** After user grants push permission

```typescript
// src/lib/push.ts
import { PushNotifications } from '@capacitor/push-notifications'
import { isNative } from '@/lib/platform'
import { getSupabaseClient } from '@/lib/supabase'
import { captureError } from '@/lib/sentry'
import { toast } from '@/stores/toastStore'

export async function requestPushPermission(): Promise<boolean> {
  if (!isNative()) return false

  const status = await PushNotifications.checkPermissions()
  if (status.receive === 'granted') {
    // Already granted, just register
    await PushNotifications.register()
    return true
  }
  if (status.receive === 'denied') {
    // Permanently denied -- must go to Settings
    return false
  }

  // status.receive === 'prompt' -- show system dialog
  const result = await PushNotifications.requestPermissions()
  if (result.receive !== 'granted') return false

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
    // Show in-app toast instead of native banner (or configure presentationOptions)
    toast.info(notification.title || notification.body || 'New notification')
  })

  // User tapped notification (from background or terminated)
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    const data = action.notification.data
    if (data?.route) {
      // Use React Router navigation -- window.location.href works but loses state
      window.location.href = data.route
    }
  })
}

async function storeDeviceToken(userId: string, token: string) {
  const client = getSupabaseClient()
  await client.from('device_tokens').upsert({
    user_id: userId,
    token,
    platform: 'ios',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,platform' })
}

export async function removeDeviceToken(userId: string) {
  const client = getSupabaseClient()
  await client.from('device_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('platform', 'ios')
}
```

### Pattern 2: APNs JWT + HTTP/2 in Edge Function

**What:** Generate ES256 JWT and send push via APNs HTTP/2
**When to use:** In the `send-push` Edge Function

```typescript
// supabase/functions/_shared/apns.ts
import { SignJWT, importPKCS8 } from 'https://esm.sh/jose@5'

const APNS_PROD = 'https://api.push.apple.com'
const APNS_DEV = 'https://api.development.push.apple.com'

let cachedJWT: { token: string; expiresAt: number } | null = null

async function getAPNsJWT(): Promise<string> {
  // Reuse JWT for up to 50 minutes (valid for 60)
  if (cachedJWT && Date.now() < cachedJWT.expiresAt) {
    return cachedJWT.token
  }

  const keyId = Deno.env.get('APNS_KEY_ID')!
  const teamId = Deno.env.get('APNS_TEAM_ID')!
  const p8Key = Deno.env.get('APNS_P8_KEY')!.replace(/\\n/g, '\n')

  const privateKey = await importPKCS8(p8Key, 'ES256')
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt()
    .sign(privateKey)

  cachedJWT = { token: jwt, expiresAt: Date.now() + 50 * 60 * 1000 }
  return jwt
}

export async function sendAPNs(
  deviceToken: string,
  payload: { title: string; body: string; data?: Record<string, string> }
): Promise<{ success: boolean; status: number }> {
  const jwt = await getAPNsJWT()
  const bundleId = Deno.env.get('APNS_BUNDLE_ID') || 'fitness.welltrained.app'
  const apnsHost = Deno.env.get('APNS_ENV') === 'development' ? APNS_DEV : APNS_PROD

  const response = await fetch(`${apnsHost}/3/device/${deviceToken}`, {
    method: 'POST',
    headers: {
      'authorization': `bearer ${jwt}`,
      'apns-topic': bundleId,
      'apns-push-type': 'alert',
      'apns-priority': '10',
      'apns-expiration': '0',
    },
    body: JSON.stringify({
      aps: {
        alert: { title: payload.title, body: payload.body },
        sound: 'default',
        badge: 1,
      },
      ...(payload.data || {}),
    }),
  })

  return { success: response.ok, status: response.status }
}
```

### Pattern 3: Database Webhook Trigger

**What:** Supabase DB webhook fires on coach actions, invoking the send-push Edge Function
**When to use:** For each of the 3 coach action types

```sql
-- Database webhook via pg_net (set up in Supabase Dashboard)
-- Table: assigned_workouts, Event: INSERT
-- Table: macro_targets, Event: UPDATE
-- Table: weekly_checkins, Event: UPDATE

-- The webhook sends the row payload to the Edge Function URL:
-- POST https://<project>.supabase.co/functions/v1/send-push
-- Headers: Authorization: Bearer <service_role_key>
-- Body: { type: "insert" | "update", table: "...", record: {...}, old_record: {...} }
```

### Pattern 4: Contextual Permission Prompt (Pre-Permission UI)

**What:** Show a custom UI explaining push value before the one-shot iOS system prompt
**When to use:** After user's first meaningful coach interaction

```
Trigger moments (ranked by contextual relevance):
1. First time user sees an assigned workout (after pullCoachData returns assignment)
2. After completing onboarding (profile setup complete, coach relationship exists)
3. When user opens Settings and sees a "Notifications" toggle in 'off' state

Flow:
  Check permission status (checkPermissions)
  -> If 'prompt': show custom pre-permission bottom sheet explaining value
    -> User taps "Enable": call requestPermissions() -> register()
    -> User taps "Not Now": dismiss, show again later (max 3 times)
  -> If 'denied': show Settings guidance UI
  -> If 'granted': silently register (token refresh)
```

### Anti-Patterns to Avoid

- **Prompting on first launch:** iOS permission is one-shot. Prompting before the user understands the value wastes the only chance. Median opt-in for coached fitness apps is ~51%.
- **Storing APNs token in localStorage/Zustand:** Tokens belong server-side in `device_tokens` table for the Edge Function to read.
- **Generating a new JWT per push request:** APNs JWTs are valid for 60 minutes. Cache and reuse to avoid `TooManyProviderTokenUpdates` (429).
- **Using `window.location.href` for push tap navigation:** Loses React state. Better to integrate with React Router's `navigate()` via the existing deep-link handler pattern.
- **Adding Firebase:** No Firebase dependency exists in the plugin podspec. Adding Firebase for iOS-only push is unnecessary complexity.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| APNs JWT signing | Custom crypto implementation | `jose` importPKCS8 + SignJWT | ES256 P-256 key handling has subtle PEM format requirements |
| HTTP/2 client | Custom HTTP/2 library | Deno's built-in `fetch` | Deno fetch auto-negotiates HTTP/2 via TLS ALPN |
| Push token registration | Manual APNs registration | `@capacitor/push-notifications` | Handles iOS delegate wiring, permission state machine |
| Database change detection | Polling or Realtime subscriptions | Supabase Database Webhooks (pg_net) | Async, non-blocking, zero application code for trigger |
| APNs token refresh | Manual refresh timer | Plugin's `registration` event on each `register()` call | Token upserted on every app launch handles rotation |

**Key insight:** The entire push pipeline has zero custom infrastructure. Capacitor handles native registration, Supabase handles webhook triggering, Deno handles HTTP/2 + JWT, and APNs handles delivery. The only custom code is the Edge Function glue and the client-side permission UX.

## Common Pitfalls

### Pitfall 1: iOS Push Permission Is One-Shot

**What goes wrong:** `requestPermissions()` shows the system dialog exactly once. If denied, it permanently returns `denied` with no dialog.
**Why it happens:** iOS design -- Apple prevents apps from nagging users.
**How to avoid:** Show a custom pre-permission UI first. Only call the system API after the user explicitly opts in on your screen. Check status with `checkPermissions()` before calling `requestPermissions()`.
**Warning signs:** Users report "I never get notifications." Check if permission was denied early.

### Pitfall 2: APNs Token vs FCM Token Confusion

**What goes wrong:** On iOS, `@capacitor/push-notifications` returns the raw APNs device token. Developers sometimes assume it's an FCM token and try sending via Firebase.
**Why it happens:** Android returns FCM tokens from the same plugin. Documentation doesn't always make the distinction clear.
**How to avoid:** For this project, we only target iOS and use direct APNs. Store the token as-is in `device_tokens` table. Send via APNs HTTP/2, not FCM.
**Warning signs:** 400/403 errors from APNs with reason `BadDeviceToken`.

### Pitfall 3: Missing AppDelegate Methods

**What goes wrong:** Push registration events never fire in the Capacitor plugin.
**Why it happens:** The Capacitor push plugin requires two AppDelegate methods to forward iOS registration callbacks to the JS layer. Without them, the native `didRegisterForRemoteNotificationsWithDeviceToken` never reaches the plugin.
**How to avoid:** Add both delegate methods to `AppDelegate.swift`:
```swift
func application(_ application: UIApplication,
  didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
  NotificationCenter.default.post(
    name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
}

func application(_ application: UIApplication,
  didFailToRegisterForRemoteNotificationsWithError error: Error) {
  NotificationCenter.default.post(
    name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
}
```
**Warning signs:** `registration` event listener never fires; `registrationError` fires with vague error.

### Pitfall 4: APNs JWT Token Expiry

**What goes wrong:** After one hour, APNs rejects all pushes with `ExpiredProviderToken` (403).
**Why it happens:** APNs JWT validity is strictly 60 minutes from `iat` claim.
**How to avoid:** Cache the JWT with an expiry timestamp. Regenerate before the hour mark (e.g., 50 minutes). In Edge Functions (serverless), cache is per-invocation in cold start, but warm instances reuse the module-level variable.
**Warning signs:** Pushes work for a while then fail with 403.

### Pitfall 5: Missing Xcode Capabilities

**What goes wrong:** App registers for push but never receives tokens.
**Why it happens:** Push Notifications capability and Background Modes (Remote notifications) not enabled in Xcode project.
**How to avoid:** In Xcode: Target > Signing & Capabilities > + Capability > Push Notifications. Also add Background Modes with "Remote notifications" checked.
**Warning signs:** Token registration silently fails; no `registration` or `registrationError` events.

### Pitfall 6: Webhook Payload Mismatch

**What goes wrong:** Edge Function receives the webhook but can't determine which client to notify.
**Why it happens:** Database webhook sends the raw row, but the target user (client) is in different columns for each table: `client_id` on `assigned_workouts` and `weekly_checkins`, but `user_id` on `macro_targets`.
**How to avoid:** The Edge Function must map table name to the correct column for looking up device tokens. Use a switch/map on the webhook's `table` field.
**Warning signs:** Edge Function succeeds but no push is sent (wrong user_id lookup).

### Pitfall 7: Webhook on UPDATE Fires for All Columns

**What goes wrong:** `macro_targets` UPDATE webhook fires when the CLIENT updates their own macros (set_by='self'), not just coach updates.
**Why it happens:** Database webhooks fire on all UPDATE events for the table, not filtered by column values.
**How to avoid:** The Edge Function must check `record.set_by === 'coach'` for macro_targets, and `record.coach_response IS NOT NULL AND old_record.coach_response IS NULL` for weekly_checkins, to only send pushes for actual coach actions.
**Warning signs:** Client receives spurious notifications when they edit their own macros.

### Pitfall 8: Device Token Cleanup on Sign Out

**What goes wrong:** User A signs out, user B signs in on the same device. Coach sends notification to user A, but it arrives on user B's device.
**Why it happens:** APNs device token is tied to the device, not the user. If the token row isn't deleted on sign out, it still points to the old user.
**How to avoid:** Call `removeDeviceToken(userId)` during `signOut()` in authStore, before clearing user state.
**Warning signs:** Wrong user receives notifications.

## Code Examples

### AppDelegate.swift Push Registration

```swift
// ios/App/App/AppDelegate.swift -- ADD these two methods
func application(_ application: UIApplication,
  didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
  NotificationCenter.default.post(
    name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
}

func application(_ application: UIApplication,
  didFailToRegisterForRemoteNotificationsWithError error: Error) {
  NotificationCenter.default.post(
    name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
}
```

### App.entitlements Addition

```xml
<!-- Add to existing App.entitlements -->
<key>aps-environment</key>
<string>development</string>
<!-- Change to "production" for App Store builds -->
```

### Capacitor Config Push Settings

```typescript
// capacitor.config.ts -- ADD to plugins section
PushNotifications: {
  presentationOptions: ['badge', 'sound', 'alert'],
},
```

### Database Migration: device_tokens

```sql
-- supabase/migrations/011_device_tokens.sql
CREATE TABLE device_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, platform)
);

ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tokens"
  ON device_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_device_tokens_user_id ON device_tokens(user_id);
```

### Edge Function: send-push

```typescript
// supabase/functions/send-push/index.ts
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendAPNs } from '../_shared/apns.ts'

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  schema: string
  record: Record<string, unknown>
  old_record: Record<string, unknown> | null
}

// Map table -> client user ID field + notification content
function getNotificationDetails(payload: WebhookPayload): {
  clientId: string
  title: string
  body: string
  route: string
} | null {
  const { table, record, old_record } = payload

  switch (table) {
    case 'assigned_workouts':
      return {
        clientId: record.client_id as string,
        title: 'New Workout Assigned',
        body: `Your coach assigned a workout for ${record.date}`,
        route: '/workouts',
      }
    case 'macro_targets':
      // Only notify on coach-set changes
      if (record.set_by !== 'coach') return null
      return {
        clientId: record.user_id as string,
        title: 'Macros Updated',
        body: 'Your coach updated your macro targets',
        route: '/macros',
      }
    case 'weekly_checkins':
      // Only notify when coach_response is newly set
      if (!record.coach_response || old_record?.coach_response) return null
      return {
        clientId: record.client_id as string,
        title: 'Check-in Reviewed',
        body: 'Your coach responded to your weekly check-in',
        route: '/',
      }
    default:
      return null
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload: WebhookPayload = await req.json()
    const details = getNotificationDetails(payload)
    if (!details) {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Admin client to read device tokens (bypasses RLS)
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: tokens } = await admin
      .from('device_tokens')
      .select('token')
      .eq('user_id', details.clientId)

    if (!tokens?.length) {
      return new Response(JSON.stringify({ sent: 0, reason: 'no_tokens' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let sent = 0
    for (const device of tokens) {
      const result = await sendAPNs(device.token, {
        title: details.title,
        body: details.body,
        data: { route: details.route },
      })
      if (result.success) sent++
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

### Push Tap Navigation (Extend Existing Deep Link Handler)

```typescript
// In src/lib/deep-link.ts -- the existing non-auth deep link branch
// already handles push notification tap navigation:
} else if (parsed.pathname && parsed.pathname !== '/') {
  // Non-auth deep link -- navigate to path (push notification taps)
  navigate(parsed.pathname)
}

// For pushNotificationActionPerformed, route data comes as:
// action.notification.data.route = '/workouts' | '/macros' | '/'
// Navigate directly using React Router navigate function
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Firebase Cloud Messaging for all platforms | Direct APNs for iOS-only apps | Always available, Firebase was convenience | Removes entire Firebase SDK dependency |
| Certificate-based APNs auth (.p12) | Token-based APNs auth (.p8 JWT) | 2016 (WWDC16) | .p8 keys don't expire, one key for all apps |
| pg_net HTTP/1.1 webhook | Supabase Dashboard webhook UI + pg_net | 2024 | Easier configuration, same underlying mechanism |
| `Deno.serve(req => ...)` | Same pattern (stable) | Deno 1.25+ | Standard Edge Function pattern |
| Capacitor 6 push plugin | `@capacitor/push-notifications` 7.0.5 | Capacitor 7.0 GA | Compatible with iOS 15.0+, same API surface |

**Deprecated/outdated:**
- Certificate-based APNs (.p12): Still supported but .p8 token auth is preferred. Certificates expire yearly; .p8 keys don't.
- `Deno.serve` from `std/http/server.ts`: Modern Supabase Edge Functions use the global `Deno.serve` directly.

## Open Questions

1. **Apple Developer Account Status**
   - What we know: The AASA file uses placeholder Team ID `XXXXXXXXXX`. Prior decisions note "Apple Developer account not yet created."
   - What's unclear: Whether the account has been created since Phase 13.
   - Recommendation: This MUST be resolved before push implementation. The .p8 key, Team ID, Key ID, and Push Notification capability all require an active Apple Developer account ($99/year).

2. **Push Notification Tap Navigation Approach**
   - What we know: The `pushNotificationActionPerformed` event provides `action.notification.data`. The existing `deep-link.ts` handles URL-based navigation via `navigate()`.
   - What's unclear: Whether `pushNotificationActionPerformed` fires for cold-start taps (app was killed) or only warm starts. Capacitor docs are not explicit.
   - Recommendation: Test both paths. For cold start, the notification data may need to be checked via `PushNotifications.getDeliveredNotifications()` on app launch, or the launch URL approach may need extension.

3. **Database Webhook vs Client-Side Edge Function Invocation**
   - What we know: Database webhooks (pg_net) are async, non-blocking, and require no code changes to coach action hooks. Client-side invocation gives more control but couples notification logic to the UI.
   - What's unclear: Whether database webhooks can reliably deliver within seconds for real-time coach UX.
   - Recommendation: Use database webhooks. pg_net fires immediately after the transaction commits. Latency is typically < 2 seconds. If reliability becomes an issue, switch to client-side invocation as fallback.

4. **Foreground Notification Display Strategy**
   - What we know: `presentationOptions: ['badge', 'sound', 'alert']` shows native iOS banners even when app is open. The `pushNotificationReceived` listener fires for in-app handling.
   - What's unclear: Whether showing both a native banner AND an in-app toast is desirable or confusing.
   - Recommendation: Use `presentationOptions: ['badge', 'sound', 'alert']` for native display, and DO NOT show a duplicate toast in the `pushNotificationReceived` handler. The native banner is sufficient and expected.

5. **APNs Environment (Development vs Production)**
   - What we know: Development endpoint is `api.development.push.apple.com`, production is `api.push.apple.com`. The app built for TestFlight/App Store uses production APNs.
   - What's unclear: How to handle the environment toggle during development.
   - Recommendation: Use an `APNS_ENV` secret in Supabase (default: 'production'). During local development, set to 'development'. For production deployment, set to 'production'.

## Sources

### Primary (HIGH confidence)
- [Capacitor Push Notifications API docs](https://capacitorjs.com/docs/apis/push-notifications) -- Full API surface, iOS setup, presentationOptions
- [Apple APNs HTTP/2 protocol reference](https://developer.apple.com/library/archive/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/CommunicatingwithAPNs.html) -- JWT format, endpoints, headers, status codes
- [Apple token-based connection docs](https://developer.apple.com/documentation/usernotifications/establishing-a-token-based-connection-to-apns) -- ES256 signing requirements, token validity
- [CapacitorPushNotifications.podspec](https://github.com/ionic-team/capacitor-plugins/blob/main/push-notifications/CapacitorPushNotifications.podspec) -- Confirmed: only dependency is `Capacitor`, NO Firebase
- [Supabase Database Webhooks docs](https://supabase.com/docs/guides/database/webhooks) -- pg_net-based, async, non-blocking
- [Supabase Edge Functions examples: push notifications](https://supabase.com/docs/guides/functions/examples/push-notifications) -- Official patterns for webhook-triggered push
- npm: `@capacitor/push-notifications@7.0.5` -- latest 7.x, peer dependency `@capacitor/core >=7.0.0`

### Secondary (MEDIUM confidence)
- [Capacitor Push Notifications Guide (Capawesome)](https://capawesome.io/blog/the-push-notifications-guide-for-capacitor/) -- AppDelegate methods, Xcode capability setup
- [jose library (panva/jose)](https://github.com/panva/jose) -- ES256 JWT signing, importPKCS8, Deno-compatible
- [Deno HTTP/2 client](https://deno.com/blog/v1.9) -- fetch auto-negotiates HTTP/2 via TLS ALPN
- [Capacitor GitHub Issue #1749](https://github.com/ionic-team/capacitor/issues/1749) -- APNs token vs FCM token on iOS confirmed
- [launchtodayhq/expo-push-notifications](https://github.com/launchtodayhq/expo-push-notifications) -- Working APNs + Supabase Edge Function example using crypto.subtle.importKey

### Tertiary (LOW confidence)
- [jose discussion #423](https://github.com/panva/jose/discussions/423) -- .p8 import may fail in Safari (not relevant for Deno Edge Function, but worth noting)
- [Supabase discussion #13930](https://github.com/orgs/supabase/discussions/13930) -- Community patterns for push notification strategies

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Plugin podspec verified (no Firebase), npm versions confirmed, Deno HTTP/2 confirmed
- Architecture: HIGH -- Follows established patterns from existing Edge Functions (send-invite), existing deep-link handler, and existing Supabase schema
- Pitfalls: HIGH -- All critical pitfalls (one-shot permission, AppDelegate methods, token confusion) verified via official Apple and Capacitor documentation

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (30 days -- stable domain, no fast-moving changes expected)
