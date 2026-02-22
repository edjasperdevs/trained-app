---
phase: 13-deep-linking-auth
verified: 2026-02-22T19:43:30Z
status: human_needed
score: 9/10 must-haves verified
re_verification: false
human_verification:
  - test: "Visit /reset-password in browser after Vercel deploy"
    expected: "Password reset form renders with WELLTRAINED branding, two password fields, and an Update Password button"
    why_human: "Visual rendering and form interaction cannot be verified programmatically"
  - test: "Trigger password reset email and follow the link"
    expected: "Email arrives with link to https://app.welltrained.fitness/reset-password#access_token=... (not capacitor://localhost)"
    why_human: "Requires live Supabase connection and email delivery; URL in email is the critical correctness check"
  - test: "On iOS device with signed build: tap a welltrained.fitness/reset-password link"
    expected: "App opens instead of Safari and navigates to /reset-password with session restored"
    why_human: "Universal Links require: (1) real Apple Team ID replacing XXXXXXXXXX in AASA, (2) AASA deployed to production, (3) signed native build, (4) physical iOS device -- none of these are verifiable from code alone"
  - test: "Cold start deep link: kill app, tap reset link, app launches and shows reset form"
    expected: "getLaunchUrl() fallback fires, session is set, /reset-password renders"
    why_human: "Requires physical device and signed native build"
---

# Phase 13: Deep Linking + Auth Verification Report

**Phase Goal:** Universal Links route welltrained.fitness URLs into the app, and Supabase auth flows (password reset) work correctly in the Capacitor context
**Verified:** 2026-02-22T19:43:30Z
**Status:** human_needed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | AASA file is served at /.well-known/apple-app-site-association with application/json content-type on Vercel | VERIFIED | File exists at `public/.well-known/apple-app-site-association`; vercel.json has explicit rewrite + Content-Type header; rewrite [0] precedes SPA catch-all [1] |
| 2 | Xcode project has Associated Domains entitlement for applinks:app.welltrained.fitness | VERIFIED | `ios/App/App/App.entitlements` contains `applinks:app.welltrained.fitness`; `project.pbxproj` has `CODE_SIGN_ENTITLEMENTS = App/App.entitlements` in both Debug and Release build configs |
| 3 | Tapping a welltrained.fitness/reset-password link on iOS opens the app (requires AASA deployed + entitlements signed) | NEEDS HUMAN | All infrastructure code is correct; full verification requires real Team ID in AASA (currently XXXXXXXXXX placeholder), deployed AASA, signed Xcode build, and physical device |
| 4 | resetPasswordForEmail uses https://app.welltrained.fitness/reset-password as redirectTo | VERIFIED | `authStore.ts:197` hardcodes `'https://app.welltrained.fitness/reset-password'`; no `window.location.origin` present |
| 5 | Deep link handler parses access_token and refresh_token from appUrlOpen URL hash fragment | VERIFIED | `deep-link.ts:12-22` uses `new URLSearchParams(parsed.hash.substring(1))` and extracts both tokens before calling `setSession` |
| 6 | Deep link handler calls supabase.auth.setSession() with parsed tokens and navigates to /reset-password on type=recovery | VERIFIED | `deep-link.ts:19-28` calls `setSession({access_token, refresh_token})` then checks `type === 'recovery'` to navigate |
| 7 | Cold start deep links are handled via App.getLaunchUrl() fallback | VERIFIED | `deep-link.ts:54-58` calls `App.getLaunchUrl().then(result => handleDeepLink(result.url, navigate))` |
| 8 | User sees a password reset form at /reset-password route | VERIFIED (code) / NEEDS HUMAN (visual) | Route registered in both unauthenticated (line 162) and authenticated (line 197) sections of App.tsx; form renders with two password fields and submit button |
| 9 | User can enter and confirm a new password, which calls supabase.auth.updateUser({ password }) | VERIFIED | `ResetPassword.tsx:39` calls `supabase!.auth.updateUser({ password: newPassword })` with validation (>= 6 chars, passwords match) |
| 10 | After successful password update, user is shown success feedback and navigated to home | VERIFIED | `ResetPassword.tsx:44-45` calls `toast.success('Password updated successfully')` then `setTimeout(() => navigate('/'), 1000)` |

**Score:** 9/10 truths verified (1 truth requires human/device verification)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `public/.well-known/apple-app-site-association` | iOS Universal Links configuration | VERIFIED | Valid JSON; `applinks.details[0].components` scoped to `/reset-password*`; Team ID is XXXXXXXXXX placeholder (known, accepted per checkpoint) |
| `vercel.json` | AASA rewrite exclusion and Content-Type header | VERIFIED | Explicit AASA rewrite at index [0], SPA catch-all excludes `.well-known`, `Content-Type: application/json` header present |
| `ios/App/App/App.entitlements` | Associated Domains entitlement | VERIFIED | `com.apple.developer.associated-domains` key with `applinks:app.welltrained.fitness` value |
| `src/lib/deep-link.ts` | appUrlOpen listener and token parsing | VERIFIED | Exports `initDeepLinkHandler`; contains `handleDeepLink` shared function for warm/cold start; `isNative()` guard at line 46 |
| `src/screens/ResetPassword.tsx` | Password reset form screen | VERIFIED | Exports `ResetPassword`; full form with validation, `updateUser` call, loading state, error Alert, and success navigation |
| `src/stores/authStore.ts` | Fixed redirectTo, updatePassword action | VERIFIED | Line 197: hardcoded `https://app.welltrained.fitness/reset-password`; no `window.location.origin` |
| `src/App.tsx` | Deep link init and /reset-password route | VERIFIED | `initDeepLinkHandler(navigate)` in useEffect (lines 56-58); `/reset-password` route in unauthenticated section (162) and authenticated section (197); lazy import at line 39 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/lib/deep-link.ts` | `@capacitor/app` | `App.addListener('appUrlOpen')` | WIRED | Line 49: `App.addListener('appUrlOpen', (event) => {...})` |
| `src/lib/deep-link.ts` | `src/lib/supabase.ts` | `supabase.auth.setSession()` | WIRED | Line 19: `await supabase?.auth.setSession({access_token, refresh_token})` |
| `src/App.tsx` | `src/lib/deep-link.ts` | `initDeepLinkHandler()` in useEffect | WIRED | Line 8 import, lines 56-58 useEffect call with `navigate` |
| `src/screens/ResetPassword.tsx` | `src/lib/supabase.ts` | `supabase.auth.updateUser({ password })` | WIRED | Line 39: `supabase!.auth.updateUser({ password: newPassword })` |
| `src/stores/authStore.ts` | Supabase `resetPasswordForEmail` | hardcoded SITE_URL | WIRED | Line 197: `redirectTo: 'https://app.welltrained.fitness/reset-password'`; confirmed no `window.location.origin` anywhere in resetPassword method |

### Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| DEEP-01: Universal Links infrastructure (AASA, entitlements, Vercel config) | SATISFIED | All infrastructure files present and correctly configured |
| DEEP-03: Password reset flow works in Capacitor context | SATISFIED (code) | redirectTo hardcoded to web domain; full e2e needs human verification on device |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `public/.well-known/apple-app-site-association` | 5 | `XXXXXXXXXX` Team ID placeholder | Info | Known and accepted at checkpoint -- Apple Developer account not yet created; must be updated before Universal Links work on device |

Notes on anti-patterns:
- The `placeholder="••••••••"` matches in `ResetPassword.tsx` are HTML input placeholder text (correct usage), not code stubs.
- No empty implementations, TODO comments, or stub handlers found in any phase 13 files.

### Human Verification Required

#### 1. Password Reset Form Rendering

**Test:** Deploy to Vercel, navigate to `https://app.welltrained.fitness/reset-password` in a browser (without being authenticated)
**Expected:** WELLTRAINED logo header, "Reset Password" card, "New Password" and "Confirm Password" fields with show/hide toggles, "Update Password" submit button
**Why human:** Visual layout and interactive behavior cannot be verified statically

#### 2. Password Reset Email URL Correctness

**Test:** Go to login screen, tap "Forgot Password", enter email, check received email
**Expected:** Email link points to `https://app.welltrained.fitness/reset-password#access_token=...&type=recovery` (not `capacitor://localhost`)
**Why human:** Requires live Supabase connection and email delivery to verify the redirectTo fix actually routes correctly

#### 3. iOS Universal Links -- Warm Start

**Test:** On physical iOS device with signed build (containing real Team ID in AASA): tap a `https://app.welltrained.fitness/reset-password` link from Notes/Messages while app is running
**Expected:** App comes to foreground and navigates to /reset-password; session is restored from URL hash tokens
**Why human:** Requires real Team ID (replace XXXXXXXXXX), deployed AASA at production domain, signed Xcode build, and physical iOS device -- none verifiable from code

**Prerequisite:** Replace `XXXXXXXXXX` in `public/.well-known/apple-app-site-association` with actual Apple Developer Team ID from Apple Developer Portal > Membership > Team ID

#### 4. iOS Universal Links -- Cold Start

**Test:** Kill app, tap a `https://app.welltrained.fitness/reset-password` reset link
**Expected:** App launches, `getLaunchUrl()` fires with the URL, session is set, /reset-password renders
**Why human:** Same prerequisites as warm start test above

#### 5. Supabase Redirect URL Allowlist

**Test:** Verify Supabase Dashboard > Auth > URL Configuration > Redirect URLs includes `https://app.welltrained.fitness/**`
**Expected:** Entry exists; without it, Supabase will reject the redirectTo and the email link won't work
**Why human:** Dashboard configuration cannot be verified from the codebase

### Gaps Summary

No code gaps found. All artifacts are substantive and wired. The phase goal is blocked only by external setup prerequisites (no code changes needed):

1. **Apple Team ID (required for Universal Links):** Replace `XXXXXXXXXX` in `public/.well-known/apple-app-site-association` with the real Team ID before Universal Links will function on device
2. **Supabase redirect allowlist (required for password reset emails):** Add `https://app.welltrained.fitness/**` to Supabase Auth URL Configuration
3. **AASA deployment:** The AASA file must be live at the production domain for Apple to cache it

These are pre-noted in the SUMMARY as user setup items and are not code deficiencies.

---

_Verified: 2026-02-22T19:43:30Z_
_Verifier: Claude (gsd-verifier)_
