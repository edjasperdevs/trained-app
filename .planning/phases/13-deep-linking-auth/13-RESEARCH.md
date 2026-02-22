# Phase 13: Deep Linking + Auth - Research

**Researched:** 2026-02-22
**Domain:** iOS Universal Links, Supabase Auth deep linking, Capacitor URL handling
**Confidence:** HIGH

## Summary

This phase requires configuring iOS Universal Links so `app.welltrained.fitness` URLs open the native app, and wiring up Supabase's password reset flow to work end-to-end in the Capacitor context. The work spans three layers: (1) server-side AASA file hosted on Vercel, (2) Xcode project entitlements for Associated Domains, and (3) client-side URL handling that bridges Capacitor's `appUrlOpen` event with Supabase's auth session management.

The current codebase has critical gaps: no `/reset-password` route exists, the `resetPasswordForEmail` call uses `window.location.origin` (which is `capacitor://localhost` in native -- wrong), `onAuthStateChange` doesn't check for `PASSWORD_RECOVERY` events, and there is no `updateUser()` call anywhere for actually changing the password. The AppDelegate already has the Universal Links handler method (`application(_:continue:restorationHandler:)`), which is the Capacitor default -- so native-side Swift work is minimal.

**Primary recommendation:** Use the implicit auth flow (already configured with `detectSessionInUrl: true`) and manually parse tokens from `appUrlOpen` URLs. Create a dedicated `/reset-password` route with a new password form. Configure Universal Links with a specific path pattern (`/reset-password*`) rather than catching all URLs, since the PWA should remain the default web experience.

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@capacitor/app` | ^7.1.2 | `appUrlOpen` listener for deep link URLs | Only way to receive Universal Link URLs in Capacitor |
| `@supabase/supabase-js` | ^2.93.3 | `setSession()`, `updateUser()`, `onAuthStateChange` | Already the auth provider; has all needed methods |
| `react-router-dom` | ^6.22.3 | Route to `/reset-password` screen | Already the router; just needs a new route |

### No Additional Libraries Needed
The existing stack covers all requirements. No new npm packages are needed for this phase.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual token parsing from URL | `@capgo/capacitor-supabase` native plugin | Massive overhead for one flow; the JS SDK already handles everything |
| Implicit flow (current) | PKCE flow | PKCE is more secure but requires code verifier stored on same device; implicit is simpler for password reset where tokens come in hash fragment |
| Universal Links only for `/reset-password` | Catch-all `*` paths | Catch-all would hijack the PWA; scoped paths preserve web experience |

## Architecture Patterns

### How the Password Reset Deep Link Flow Works (End to End)

```
1. User taps "Forgot password" in app
2. App calls resetPasswordForEmail(email, { redirectTo: 'https://app.welltrained.fitness/reset-password' })
3. Supabase sends email with link: https://<project>.supabase.co/auth/v1/verify?token=...&type=recovery&redirect_to=https://app.welltrained.fitness/reset-password
4. User taps email link
5. Supabase server verifies token, redirects to: https://app.welltrained.fitness/reset-password#access_token=...&refresh_token=...&type=recovery
6. iOS Universal Links intercept the redirect -> opens app instead of Safari
7. Capacitor fires appUrlOpen with the full URL including hash fragment
8. App parses tokens from hash, calls supabase.auth.setSession()
9. App detects type=recovery, navigates to /reset-password route
10. User enters new password, app calls supabase.auth.updateUser({ password })
```

### Key Architectural Decisions

**Why NOT rely on `detectSessionInUrl`:** In the Capacitor WebView, the URL bar is `capacitor://localhost`. When a Universal Link opens the app, it fires the `appUrlOpen` event but does NOT change `window.location`. Since `detectSessionInUrl` only checks `window.location` on client init, it will never see the deep link tokens. We must manually extract tokens from the `appUrlOpen` URL.

**Why scoped Universal Links paths:** The AASA file should only claim `/reset-password` (and possibly `/auth/callback` for future OAuth). If we claim `*`, every link to `app.welltrained.fitness` would open the native app, breaking the PWA experience for users who haven't installed the app or who are on Android/desktop.

### Recommended File Changes

```
public/
  .well-known/
    apple-app-site-association    # NEW: AASA file for Universal Links

vercel.json                       # MODIFY: Add header for AASA content-type

ios/App/App/
  App.entitlements                # NEW: Associated Domains entitlement

src/
  lib/
    deep-link.ts                  # NEW: appUrlOpen handler + token parsing
  screens/
    ResetPassword.tsx             # NEW: Password reset form screen
  stores/
    authStore.ts                  # MODIFY: Fix redirectTo, add updatePassword
  App.tsx                         # MODIFY: Add /reset-password route + deep link init
```

### Pattern 1: Deep Link URL Handler
**What:** Central handler that listens for `appUrlOpen` and routes accordingly
**When to use:** App initialization (once, in App.tsx useEffect)
**Example:**
```typescript
// Source: Capacitor docs + Supabase community patterns
import { App, URLOpenListenerEvent } from '@capacitor/app'
import { supabase } from '@/lib/supabase'

export function initDeepLinkHandler(navigate: (path: string) => void) {
  App.addListener('appUrlOpen', async (event: URLOpenListenerEvent) => {
    const url = new URL(event.url)

    // Extract hash fragment parameters (tokens from Supabase redirect)
    const hashParams = new URLSearchParams(url.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    const type = hashParams.get('type')

    if (accessToken && refreshToken) {
      // Restore session from deep link tokens
      await supabase?.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (type === 'recovery') {
        navigate('/reset-password')
        return
      }
    }

    // For non-auth deep links, extract path and navigate
    const path = url.pathname
    if (path && path !== '/') {
      navigate(path)
    }
  })
}
```

### Pattern 2: Password Reset Screen
**What:** Form that accepts new password and calls `updateUser`
**When to use:** After deep link recovery flow restores session
**Example:**
```typescript
// Must check that user has an active session (from recovery token)
// before showing the form
const { data, error } = await supabase.auth.updateUser({
  password: newPassword
})

if (!error) {
  toast.success('Password updated successfully')
  navigate('/')
}
```

### Pattern 3: Platform-Aware Redirect URL
**What:** Use the web domain for redirectTo regardless of platform
**When to use:** In `resetPasswordForEmail` call
**Example:**
```typescript
// WRONG: window.location.origin is 'capacitor://localhost' in native
redirectTo: `${window.location.origin}/reset-password`

// CORRECT: Always use the web domain
const SITE_URL = 'https://app.welltrained.fitness'
redirectTo: `${SITE_URL}/reset-password`
```

### Anti-Patterns to Avoid
- **Using `window.location.origin` for redirectTo in native context:** Returns `capacitor://localhost`, which Supabase cannot redirect to and is not a valid Universal Link
- **Catching all paths in AASA:** Would hijack all web traffic to the native app, breaking the PWA
- **Relying on `detectSessionInUrl` for deep links:** Only checks `window.location`, not `appUrlOpen` URLs
- **Using custom URL schemes (e.g., `welltrained://`):** Less reliable than Universal Links, doesn't work with Supabase's server-side redirect, and Apple discourages them

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token extraction from URL hash | Custom regex parser | `URLSearchParams(hash.substring(1))` | Standard API handles encoding, edge cases |
| Session restoration | Custom token storage + API calls | `supabase.auth.setSession()` | Handles token refresh, storage, state updates |
| Password update | Direct API call to Supabase REST | `supabase.auth.updateUser()` | Handles auth headers, error states, session update |
| AASA file validation | Manual JSON construction | Apple's AASA validator tool | Catches format errors before deployment |

**Key insight:** The Supabase JS client already has every method needed (`setSession`, `updateUser`, `onAuthStateChange`). The only custom code is the bridge between Capacitor's `appUrlOpen` event and Supabase's session management.

## Common Pitfalls

### Pitfall 1: `window.location.origin` Returns Wrong URL in Native
**What goes wrong:** `resetPasswordForEmail` sends `capacitor://localhost/reset-password` as the redirect URL. Supabase either rejects it or redirects to a URL that can't trigger Universal Links.
**Why it happens:** In Capacitor's WKWebView, `window.location.origin` is `capacitor://localhost`, not the web domain.
**How to avoid:** Hardcode or env-var the site URL: `https://app.welltrained.fitness`
**Warning signs:** Password reset emails never work from the native app; users land in Safari instead of the app.

### Pitfall 2: AASA File Not Served Correctly by Vercel
**What goes wrong:** iOS cannot validate the Associated Domain, so Universal Links silently fail (no error, just opens Safari).
**Why it happens:** Vercel's SPA rewrite catches `/.well-known/apple-app-site-association` and serves `index.html` instead. Or the Content-Type header is wrong.
**How to avoid:** Add the AASA path to vercel.json rewrites exclusion AND set explicit Content-Type header.
**Warning signs:** Links always open in Safari. Use Apple's AASA validator to verify: `https://app-site-association.cdn-apple.com/a/v1/app.welltrained.fitness`

### Pitfall 3: Supabase Redirect URL Not in Allowlist
**What goes wrong:** Supabase rejects the `redirectTo` parameter and falls back to the Site URL.
**Why it happens:** `https://app.welltrained.fitness/reset-password` must be explicitly added to the Redirect URLs allowlist in Supabase dashboard.
**How to avoid:** Add `https://app.welltrained.fitness/**` to Supabase Auth > URL Configuration > Redirect URLs.
**Warning signs:** Reset link redirects to wrong page or the base site URL.

### Pitfall 4: `appUrlOpen` Event Fires Before Listener is Registered
**What goes wrong:** The app is opened via a Universal Link on cold start, but the listener hasn't been registered yet because React hasn't mounted.
**Why it happens:** Universal Links can trigger app launch. If the listener is inside a useEffect, it may miss the initial URL.
**How to avoid:** Register the listener as early as possible. Capacitor's `App.getLaunchUrl()` can retrieve the URL that launched the app, as a fallback for cold starts.
**Warning signs:** Deep links work when the app is in background (warm start) but not from a killed state (cold start).

### Pitfall 5: Dual Events - SIGNED_IN Then PASSWORD_RECOVERY
**What goes wrong:** The app detects `SIGNED_IN` from `onAuthStateChange` and navigates to the home screen before `PASSWORD_RECOVERY` fires.
**Why it happens:** Supabase emits `SIGNED_IN` first when restoring a recovery session, then `PASSWORD_RECOVERY`. If your auth state handler redirects on `SIGNED_IN`, the user never sees the reset form.
**How to avoid:** In the deep link handler, navigate to `/reset-password` directly after `setSession` when `type=recovery`. Don't rely solely on `onAuthStateChange` for navigation.
**Warning signs:** User is briefly shown the home screen then the reset form, or never sees the reset form at all.

### Pitfall 6: Apple Team ID Discovery
**What goes wrong:** The AASA file has the wrong `appID` (must be `TEAMID.BUNDLEID`).
**Why it happens:** The Team ID is not in the Xcode project file -- it's in the Apple Developer account. Developers may confuse it with other identifiers.
**How to avoid:** Find the Team ID in Apple Developer Portal > Membership > Team ID. The bundle ID is `fitness.welltrained.app` (from project.pbxproj).
**Warning signs:** Universal Links never work despite correct AASA file placement.

## Code Examples

### AASA File (apple-app-site-association)
```json
{
  "applinks": {
    "details": [
      {
        "appIDs": ["TEAMID.fitness.welltrained.app"],
        "components": [
          {
            "/": "/reset-password*",
            "comment": "Password reset deep links"
          }
        ]
      }
    ]
  }
}
```
Note: Replace `TEAMID` with actual Apple Developer Team ID. The `components` format is the modern (iOS 13+) format. The `appIDs` (plural) array format is preferred over the legacy `appID` (singular) string.

### Vercel.json Updates
```json
{
  "rewrites": [
    { "source": "/.well-known/apple-app-site-association", "destination": "/.well-known/apple-app-site-association" },
    { "source": "/((?!assets|sw|workbox|manifest|\\.well-known).*)", "destination": "/" }
  ],
  "headers": [
    {
      "source": "/.well-known/apple-app-site-association",
      "headers": [
        { "key": "Content-Type", "value": "application/json" }
      ]
    }
  ]
}
```

### App.entitlements
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.developer.associated-domains</key>
    <array>
        <string>applinks:app.welltrained.fitness</string>
    </array>
</dict>
</plist>
```

### Cold Start URL Check
```typescript
// Handle the case where the app was launched via deep link (cold start)
import { App } from '@capacitor/app'

const launchUrl = await App.getLaunchUrl()
if (launchUrl?.url) {
  handleDeepLink(launchUrl.url)
}
```

### Supabase Dashboard Configuration
- **Site URL:** `https://app.welltrained.fitness`
- **Redirect URLs (allowlist):** Add `https://app.welltrained.fitness/**`

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom URL schemes (`myapp://`) | Universal Links (`https://domain.com/path`) | iOS 9+ (standard since iOS 14) | More reliable, works with HTTPS, fallback to web |
| `appID` (singular) in AASA | `appIDs` (plural array) + `components` format | iOS 13+ | Supports multiple apps, path exclusions, comments |
| AASA at root `/apple-app-site-association` | AASA at `/.well-known/apple-app-site-association` | iOS 9+ (both work, `.well-known` preferred) | Standard location, less likely to conflict |
| Supabase implicit flow token in URL fragment | PKCE flow with code exchange | supabase-js v2+ | More secure, but implicit still works and is simpler for SPA |

**Deprecated/outdated:**
- Custom URL schemes for deep linking: Still supported but Apple recommends Universal Links
- Legacy AASA `details` format with `appID` (singular) and `paths` array: Still supported but `appIDs`+`components` is the current format

## Open Questions

1. **Apple Developer Team ID**
   - What we know: Bundle ID is `fitness.welltrained.app`, signing is set to Automatic
   - What's unclear: The actual Team ID needed for the AASA file
   - Recommendation: Look up in Apple Developer Portal > Membership > Team ID. This is required before the AASA file can be created.

2. **Supabase Dashboard Redirect URLs**
   - What we know: The allowlist needs `https://app.welltrained.fitness/**` added
   - What's unclear: Whether this has already been configured
   - Recommendation: Verify in Supabase Dashboard > Auth > URL Configuration before implementation

3. **PWA Web Flow for Password Reset**
   - What we know: The web version also needs a `/reset-password` route (currently missing for both web and native)
   - What's unclear: Whether this should use `detectSessionInUrl` on web (it should -- this is what it's designed for)
   - Recommendation: The `/reset-password` route and `updateUser` form benefit both web and native users. On web, `detectSessionInUrl: true` automatically picks up the hash fragment tokens. On native, the deep link handler does it manually.

## Sources

### Primary (HIGH confidence)
- Capacitor Deep Links guide: https://capacitorjs.com/docs/guides/deep-links - iOS Universal Links setup
- Supabase Native Mobile Deep Linking: https://supabase.com/docs/guides/auth/native-mobile-deep-linking - Auth redirect handling
- Supabase resetPasswordForEmail API: https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail - Password reset method
- Supabase Redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls - Allowlist configuration
- Supabase Email Templates: https://supabase.com/docs/guides/auth/auth-email-templates - Template variable format
- Supabase verifyOtp API: https://supabase.com/docs/reference/javascript/auth-verifyotp - Token verification
- Supabase Implicit Flow: https://supabase.com/docs/guides/auth/sessions/implicit-flow - Token delivery via hash fragment

### Secondary (MEDIUM confidence)
- Capacitor + Supabase + Social Auth (community guide): https://cjweed.com/capacitor-supabase-social-auth-react/ - Token extraction from appUrlOpen
- Supabase Discussion #3360 (Password Reset Flow): https://github.com/orgs/supabase/discussions/3360 - Dual event behavior (SIGNED_IN + PASSWORD_RECOVERY)

### Tertiary (LOW confidence)
- None -- all critical claims verified against official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed; APIs verified in official docs
- Architecture: HIGH - Flow verified against Supabase docs, Capacitor docs, and community implementations; each step has official documentation
- Pitfalls: HIGH - Multiple community reports confirm each pitfall; dual event issue documented in official Supabase discussions
- AASA/Vercel: MEDIUM - Standard pattern but Vercel-specific rewrite exclusion needs testing

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (stable domain -- Universal Links and Supabase auth APIs are mature)
