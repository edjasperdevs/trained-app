# Phase 16: App Store Submission - Research

**Researched:** 2026-02-22
**Domain:** iOS App Store submission for Capacitor-wrapped PWA
**Confidence:** MEDIUM-HIGH

## Summary

This phase covers everything needed to get the WellTrained Capacitor iOS app published on the App Store. The app already has a solid native integration layer (push notifications, haptics, local notifications, badges, splash screen, status bar, filesystem, share sheet), which satisfies Apple's Guideline 4.2 (Minimum Functionality) -- this is NOT a lazy webview wrapper. The primary work falls into three categories: (1) compliance features that must be built (account deletion, in-app privacy policy), (2) Apple Developer Program setup and App Store Connect configuration (screenshots, metadata, privacy nutrition labels, PrivacyInfo.xcprivacy), and (3) the build/archive/TestFlight/submission pipeline.

The biggest blocker is that the Apple Developer Program account has not yet been created. This is a prerequisite for everything: signing certificates, provisioning profiles, App Store Connect access, and TestFlight distribution. Enrollment costs $99/year and requires identity verification which can take 24-48 hours.

**Primary recommendation:** Split into 4-5 plans: (1) account deletion backend + UI, (2) in-app privacy policy + PrivacyInfo.xcprivacy, (3) Apple Developer enrollment + Xcode signing setup, (4) App Store Connect metadata + screenshots, (5) archive/TestFlight/submission. Plans 1-2 can be done in code now; plans 3-5 require the Apple Developer account.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Capacitor CLI | 7.5.x | Build, sync, open Xcode | Already installed, handles web-to-native bridge |
| Xcode | 16.2 | Archive, sign, upload to App Store Connect | Required for iOS submission, already installed |
| @capacitor/cli | 7.5.0 | `cap sync`, `cap open` | Project already configured |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| Xcode Organizer | Archive management, upload to App Store Connect | Archiving and uploading builds |
| App Store Connect (web) | TestFlight, metadata, screenshots, review | All App Store listing management |
| Supabase Edge Functions | Account deletion server-side logic | delete-account function using service_role |
| `@capacitor/assets` | 3.0.5 (already installed) | Generate any missing asset sizes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Xcode Organizer upload | Fastlane | Automation for CI/CD, but overkill for first submission; add later |
| Manual screenshots | Simulator screenshots + Figma frames | Figma gives polished marketing frames, but raw simulator shots pass review |
| Edge Function for deletion | PostgreSQL RPC (SECURITY DEFINER) | RPC is simpler but Edge Function allows pre-deletion cleanup (storage, tokens) |

### No Additional Installation Needed

All required tools are already in the project. No new npm packages are needed for App Store submission.

## Architecture Patterns

### Pattern 1: Account Deletion via Supabase Edge Function

**What:** A `delete-account` Edge Function that:
1. Verifies the calling user's JWT
2. Deletes user data from all tables (or relies on CASCADE)
3. Deletes files from `intake-photos` storage bucket
4. Calls `auth.admin.deleteUser(userId)` using service_role key
5. Returns success

**When to use:** Apple Guideline 5.1.1(v) requires account deletion from within the app.

**Why Edge Function over RPC:**
- `auth.admin.deleteUser()` requires service_role key (cannot run client-side)
- Need to clean up Supabase Storage objects (intake-photos bucket)
- Need to remove device_tokens
- Edge Function can orchestrate all cleanup in correct order

**Data to delete (tables with user_id foreign key):**
- `profiles` (id = user_id)
- `weight_logs` (user_id)
- `daily_macro_logs` (user_id)
- `logged_meals` (user_id)
- `saved_meals` (user_id)
- `user_foods` (user_id)
- `workout_logs` (user_id)
- `user_xp` (user_id)
- `weekly_checkins` (client_id)
- `coach_clients` (client_id or coach_id)
- `assigned_workouts` (client_id)
- `device_tokens` (user_id)
- `intake_photos` storage bucket (user folder)
- `auth.users` (id) -- via admin.deleteUser()

**Client-side flow:**
```typescript
// Settings.tsx - Danger Zone
const handleDeleteAccount = async () => {
  if (await confirmAction(
    'This will permanently delete your account and all associated data. This cannot be undone.',
    'Delete Account'
  )) {
    // Call Edge Function
    const { error } = await supabase.functions.invoke('delete-account')
    if (error) { toast.error(...); return }
    // Clear local stores and sign out
    await signOut()
    navigate('/auth')
  }
}
```

### Pattern 2: In-App Privacy Policy Display

**What:** A `/privacy` route that renders the privacy policy text directly within the app, not via external browser.

**When to use:** Apple requires the privacy policy to be accessible without leaving the app.

**Options:**
1. **Static React component** (recommended) -- render policy text as a React screen, same dark theme. No network dependency.
2. **Inline WebView via iframe** -- load hosted URL. Has network dependency, but stays in-app.
3. **Capacitor Browser plugin** -- opens in-app browser. Technically leaves the main app UI.

**Recommendation:** Static React component. The policy rarely changes, and rendering it natively ensures it loads instantly, works offline, and matches the app's dark theme. Link to it from Settings and from the auth/signup screen.

### Pattern 3: PrivacyInfo.xcprivacy for App Target

**What:** Apple requires a privacy manifest file declaring API usage reasons.

**Current state:** The app does NOT have a `PrivacyInfo.xcprivacy` in `ios/App/App/`. The Capacitor framework itself ships one in `node_modules/@capacitor/ios/Capacitor/Capacitor/PrivacyInfo.xcprivacy`, but it's empty (no declarations).

**APIs this app uses that need declarations:**
- `NSPrivacyAccessedAPICategoryUserDefaults` -- Capacitor uses UserDefaults for plugin data storage. Reason code: `CA92.1` (access info from same app)
- `NSPrivacyAccessedAPICategoryFileTimestamp` -- @capacitor/filesystem accesses file timestamps. Reason code: `C617.1` (access timestamps of files inside app container)

**Example file to create at `ios/App/App/PrivacyInfo.xcprivacy`:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>NSPrivacyTracking</key>
  <false/>
  <key>NSPrivacyTrackingDomains</key>
  <array/>
  <key>NSPrivacyCollectedDataTypes</key>
  <array/>
  <key>NSPrivacyAccessedAPITypes</key>
  <array>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>CA92.1</string>
      </array>
    </dict>
  </array>
</dict>
</plist>
```

### Pattern 4: App Store Connect Privacy Nutrition Labels

**What:** Self-reported data collection declarations in App Store Connect.

**Data this app collects (mapped to Apple categories):**

| Apple Category | Data Type | Collected? | Linked to Identity? | Used for Tracking? | Purpose |
|---------------|-----------|------------|---------------------|-------------------|---------|
| Contact Info | Email Address | Yes | Yes | No | App Functionality (auth) |
| Health & Fitness | Fitness | Yes | Yes | No | App Functionality (workouts, macros, weight) |
| User Content | Photos or Videos | Yes (intake photos) | Yes | No | App Functionality (check-in photos for coach) |
| User Content | Other User Content | Yes (check-in text) | Yes | No | App Functionality |
| Identifiers | User ID | Yes | Yes | No | App Functionality (Supabase auth UUID) |
| Diagnostics | Crash Data | Yes | No | No | Analytics (Sentry) |
| Diagnostics | Performance Data | Yes | No | No | Analytics (Sentry) |
| Usage Data | Product Interaction | Yes | No | No | Analytics (Plausible - anonymous) |

**NOT collected:** Location, Financial Info, Contacts, Browsing History, Search History, Device ID, Advertising Data.

**Third-party SDKs to declare:**
- **Sentry** (@sentry/react): Crash data, performance data -- not linked to identity (PII stripped in beforeSend)
- **Plausible** (script tag): Product interaction -- anonymous, no cookies, not linked to identity
- **Supabase** (auth + database): Email address, user ID -- linked to identity for app functionality

### Pattern 5: Xcode Archive and Upload Flow

**Steps for building and submitting:**
1. `npm run build:ios` (builds web + syncs to Capacitor)
2. Open Xcode: `npx cap open ios`
3. Select "Any iOS Device" as build target
4. Product > Archive
5. In Organizer, select archive > Distribute App > App Store Connect
6. Upload (Xcode handles signing with distribution provisioning profile)
7. In App Store Connect: assign build to TestFlight group or App Store submission

**aps-environment note:** Xcode automatically overrides `aps-environment` from `development` to `production` when archiving with a distribution provisioning profile. No manual change needed in `App.entitlements`.

### Anti-Patterns to Avoid
- **Opening privacy policy in external Safari:** Apple wants it accessible without leaving the app. Use an in-app route, not `window.open()`.
- **Client-side account deletion:** The `auth.admin.deleteUser()` requires service_role key. Never expose service_role to the client.
- **Skipping TestFlight:** Always do a TestFlight round before App Store submission. Apple may reject if they find bugs that basic testing would have caught.
- **Submitting with development signing:** Archive must use a distribution provisioning profile, not development.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Account deletion orchestration | Client-side multi-table delete | Supabase Edge Function with service_role | Needs admin API for auth.users deletion, atomicity concerns |
| Screenshot framing | Custom screenshot tool | Xcode Simulator screenshots + optional Figma/Shots.so frames | Apple accepts raw simulator screenshots; fancy frames optional |
| Privacy manifest | Manual plist guessing | Xcode 15+ "App Privacy File" template + Apple's reason code docs | Easy to get wrong; Xcode validates format |
| App Store metadata | Improvised descriptions | Study competitor listings (MyFitnessPal, Strong, etc.) for keyword patterns | ASO (App Store Optimization) has established patterns |

**Key insight:** The App Store submission process is procedural, not creative. Follow Apple's documented steps exactly. The main risk is missing a compliance requirement that triggers rejection.

## Common Pitfalls

### Pitfall 1: Account Deletion Not Truly Deleting Data
**What goes wrong:** App has a "Delete Account" button but only signs the user out or deactivates the account. Apple rejects because data still exists on servers.
**Why it happens:** Supabase doesn't cascade delete auth.users by default; related tables need explicit CASCADE or manual cleanup.
**How to avoid:** Edge Function deletes from ALL tables, storage buckets, and auth.users. Verify by checking Supabase dashboard after test deletion.
**Warning signs:** Rows remaining in profiles/weight_logs/etc. after deletion.

### Pitfall 2: Missing PrivacyInfo.xcprivacy
**What goes wrong:** Build uploads but Apple sends a warning email about missing privacy manifest, or review is delayed.
**Why it happens:** The app-level privacy manifest must exist even if Capacitor's framework-level one exists.
**How to avoid:** Create `ios/App/App/PrivacyInfo.xcprivacy` with at minimum the UserDefaults API declaration.
**Warning signs:** Xcode warning about missing privacy manifest during archive.

### Pitfall 3: Privacy Nutrition Labels Don't Match Reality
**What goes wrong:** Apple compares your privacy label declarations against what your code actually does (via network traffic analysis). Discrepancies trigger rejection.
**Why it happens:** Forgetting to declare Sentry crash data or Plausible analytics.
**How to avoid:** Audit every third-party SDK and every data point synced to Supabase. Declare everything honestly.
**Warning signs:** Apple reviewer asking "Why does your app contact sentry.io but you haven't declared crash data collection?"

### Pitfall 4: Guideline 4.2 - Minimum Functionality Rejection
**What goes wrong:** App rejected as a "webview wrapper" that doesn't provide native value.
**Why it happens:** Apple reviewers see WKWebView and assume it's just loading a website.
**How to avoid:** This app already has strong native integration: push notifications (APNs), local notifications, haptics, badge count, splash screen, status bar control, filesystem access, share sheet. Mention these in the "Notes for Reviewer" field in App Store Connect.
**Warning signs:** First submission is higher risk. Highlight native features in review notes.

### Pitfall 5: Push Notification Entitlement Issues
**What goes wrong:** Push notifications work in development but not in TestFlight/production.
**Why it happens:** APNs sandbox vs production environments use different device tokens. The `aps-environment` must be `production` in distribution builds.
**How to avoid:** Xcode automatically sets this based on provisioning profile. After TestFlight install, verify push still works. The app's APNs key (from Phase 14) must be configured for production in Supabase.
**Warning signs:** Push registration succeeds but notifications never arrive in TestFlight builds.

### Pitfall 6: Forgotten Demo Account for Apple Review
**What goes wrong:** Apple reviewer can't test the app because it requires authentication, and no demo credentials were provided.
**Why it happens:** App requires sign-in but App Store Connect "Review Information" section was left blank.
**How to avoid:** Create a test account with pre-populated data (workouts, macros, XP, weight history). Provide credentials in App Store Connect.
**Warning signs:** Rejection with "We were unable to review your app as it requires a demo account."

### Pitfall 7: Incorrect Bundle Version Numbering
**What goes wrong:** Upload rejected because `MARKETING_VERSION` or `CURRENT_PROJECT_VERSION` conflicts with previous upload.
**Why it happens:** Each upload to App Store Connect must have a unique build number. Marketing version (e.g., 1.0.0) stays the same across builds, but build number must increment.
**How to avoid:** Set `MARKETING_VERSION = 1.0.0` and increment `CURRENT_PROJECT_VERSION` for each upload (1, 2, 3...).
**Warning signs:** "A build with this version already exists" error during upload.

## Code Examples

### Account Deletion Edge Function
```typescript
// supabase/functions/delete-account/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create client with user's JWT (for RLS)
    const authHeader = req.headers.get('Authorization')!
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify user
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create admin client for deletion operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Delete storage objects (intake photos)
    const { data: files } = await supabaseAdmin.storage
      .from('intake-photos')
      .list(user.id)
    if (files?.length) {
      await supabaseAdmin.storage
        .from('intake-photos')
        .remove(files.map(f => `${user.id}/${f.name}`))
    }

    // Delete user data from all tables
    // (If tables have ON DELETE CASCADE from profiles.id,
    //  deleting the profile cascades. Otherwise delete explicitly.)
    await supabaseAdmin.from('device_tokens').delete().eq('user_id', user.id)
    await supabaseAdmin.from('workout_logs').delete().eq('user_id', user.id)
    await supabaseAdmin.from('daily_macro_logs').delete().eq('user_id', user.id)
    await supabaseAdmin.from('logged_meals').delete().eq('user_id', user.id)
    await supabaseAdmin.from('saved_meals').delete().eq('user_id', user.id)
    await supabaseAdmin.from('user_foods').delete().eq('user_id', user.id)
    await supabaseAdmin.from('weight_logs').delete().eq('user_id', user.id)
    await supabaseAdmin.from('user_xp').delete().eq('user_id', user.id)
    await supabaseAdmin.from('weekly_checkins').delete().eq('client_id', user.id)
    await supabaseAdmin.from('assigned_workouts').delete().eq('client_id', user.id)
    await supabaseAdmin.from('coach_clients').delete().eq('client_id', user.id)
    await supabaseAdmin.from('profiles').delete().eq('id', user.id)

    // Delete auth user (must be last)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    if (deleteError) throw deleteError

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
```

### Client-Side Deletion (Settings.tsx addition)
```typescript
const handleDeleteAccount = async () => {
  if (!user) return

  if (await confirmAction(
    'This will permanently delete your account and all data. This cannot be undone.',
    'Delete My Account'
  )) {
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.functions.invoke('delete-account')
      if (error) throw error

      // Clear all local stores
      useUserStore.getState().resetProgress()
      useXPStore.getState().resetXP()
      useMacroStore.getState().resetMacros()
      useWorkoutStore.getState().resetWorkouts()
      useAvatarStore.getState().resetAvatar()
      useAccessStore.getState().revokeAccess()

      toast.success('Account deleted')
      navigate('/auth')
    } catch (error) {
      toast.error(friendlyError('delete your account', error))
    }
  }
}
```

### In-App Privacy Policy Route
```typescript
// src/screens/Privacy.tsx
export function Privacy() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen pb-20">
      <div className="pt-8 pb-6 px-5 bg-card flex items-center gap-3">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Privacy Policy</h1>
      </div>
      <div className="px-5 py-6 prose prose-invert prose-sm max-w-none">
        {/* Render privacy policy content as React elements */}
        <h2>What We Collect</h2>
        <p>...</p>
        {/* ... full policy text ... */}
      </div>
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| UIWebView | WKWebView (Capacitor uses this) | 2020 | UIWebView rejected since Dec 2020; Capacitor 3+ uses WKWebView |
| No privacy manifest required | PrivacyInfo.xcprivacy mandatory | May 2024 | Must declare API usage reasons |
| Account deletion optional | Account deletion required (5.1.1v) | June 2022 | Must implement in-app delete |
| No privacy labels | Privacy nutrition labels required | Dec 2020 | Must declare data collection in App Store Connect |
| Manual Xcode upload | Xcode Organizer + automatic signing | Xcode 14+ | Simplified signing and uploading |

**Deprecated/outdated:**
- UIWebView: Fully rejected, Capacitor 7 uses WKWebView -- no issue here
- Xcode manual provisioning: Use automatic signing for simplicity

## Existing State Audit

### Already Done (from previous phases)
- App icon: `AppIcon-512@2x.png` in `ios/App/App/Assets.xcassets/AppIcon.appiconset/` (Phase 12)
- Splash screen: configured with dark theme variants (Phase 12)
- Status bar: dark style with overlay (Phase 12)
- Push notifications: APNs integration, device token management (Phase 14)
- Local notifications: configured with presentation options (Phase 13)
- Badge management: @capawesome/capacitor-badge configured (Phase 13)
- Service worker: disabled for native builds (Phase 11)
- Capacitor config: `appId: 'fitness.welltrained.app'`, `appName: 'WellTrained'` (Phase 11)
- Entitlements: associated-domains (`applinks:app.welltrained.fitness`), aps-environment

### Must Be Built
- **Account deletion**: No implementation exists. Settings has "Reset All Progress" (local only) but NO Supabase account deletion. Need Edge Function + Settings UI.
- **Privacy policy page**: Does NOT exist at `welltrained.fitness/privacy` or `app.welltrained.fitness/privacy`. Need both in-app route AND hosted URL for App Store Connect metadata.
- **PrivacyInfo.xcprivacy**: Does NOT exist in `ios/App/App/`. Must create.
- **Apple Developer account**: Not yet enrolled. Blocker for all signing/submission work.
- **App Store Connect listing**: Not created. Need screenshots, description, keywords, privacy nutrition labels, demo account.

### Current Xcode Project State
- Bundle ID: `fitness.welltrained.app`
- Display name: `WellTrained`
- Marketing version: `1.0`
- Build number: `1`
- Deployment target: iOS 14.0
- Xcode version: 16.2
- Signing: provisioning profiles not yet configured (need Apple Developer account)

## Open Questions

1. **CASCADE constraints on existing tables?**
   - What we know: Tables reference `user_id` but unclear if ON DELETE CASCADE is set
   - What's unclear: Whether deleting from `auth.users` or `profiles` would cascade to child tables
   - Recommendation: Check existing migration SQL. If no CASCADE, the Edge Function must delete explicitly from each table (shown in code example above). Adding CASCADE via migration is cleaner but riskier if done wrong.

2. **Privacy policy content**
   - What we know: The phase context says "Privacy policy already hosted at welltrained.fitness/privacy" but the URL returns no policy content
   - What's unclear: Whether the policy exists but wasn't accessible, or needs to be written from scratch
   - Recommendation: Plan should include writing the privacy policy. Cover: data collected (email, fitness data, photos, analytics), how it's used, third parties (Supabase, Sentry, Plausible), deletion rights, contact info.

3. **App Store category selection**
   - What we know: This is a fitness/gamification app
   - What's unclear: Whether "Health & Fitness" is the right primary category, or "Lifestyle"
   - Recommendation: Use "Health & Fitness" as primary category. It matches the app's core purpose and will be found by the target audience.

4. **Screenshots: raw vs framed**
   - What we know: Apple requires 6.5" or 6.9" iPhone screenshots minimum. 1-10 per set.
   - What's unclear: Whether marketing-quality framed screenshots are needed for initial launch
   - Recommendation: For v1.0 launch, Xcode Simulator screenshots (dark theme, populated with demo data) are sufficient. Can polish later. Need at least 3-5 showing key screens: Home, Workouts, Macros, Check-in, Settings.

5. **Plausible analytics in native builds**
   - What we know: Plausible is loaded via script tag in `index.html` pointing to `plausible.io`
   - What's unclear: Whether Plausible's script correctly fires in WKWebView (it should, since it's a standard JS script)
   - Recommendation: Verify during TestFlight that analytics events appear in Plausible dashboard. If not, consider using Plausible's Events API directly for native builds.

## Sources

### Primary (HIGH confidence)
- Capacitor iOS config: `capacitor.config.ts`, `ios/App/App/Info.plist`, `ios/App/Podfile` -- direct codebase inspection
- Apple Developer Documentation: [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) -- official guidelines
- Apple Developer Documentation: [App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/) -- privacy nutrition label categories and requirements
- Apple Developer Documentation: [Screenshot Specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/) -- required sizes and formats
- Apple Developer Documentation: [Privacy Manifest Files](https://developer.apple.com/documentation/bundleresources/privacy-manifest-files) -- PrivacyInfo.xcprivacy requirements
- Apple Developer Documentation: [APS Environment Entitlement](https://developer.apple.com/documentation/bundleresources/entitlements/aps-environment) -- auto-set by provisioning profile

### Secondary (MEDIUM confidence)
- [Capacitor Privacy Manifest Guide](https://capacitorjs.com/docs/v5/ios/privacy-manifest) -- Capacitor-specific privacy manifest setup, reason codes
- [Capacitor Deploying to App Store](https://capacitorjs.com/docs/ios/deploying-to-app-store) -- official Capacitor deployment docs
- [Supabase Discussion #1066](https://github.com/orgs/supabase/discussions/1066) -- community patterns for user self-deletion
- [Capgo Privacy Manifest Guide](https://capgo.app/blog/privacy-manifest-for-ios-apps/) -- Capacitor privacy manifest examples
- [Apple Developer Program Enrollment](https://developer.apple.com/programs/enroll/) -- $99/year, identity verification
- [App Store Review Guidelines Checklist](https://nextnative.dev/blog/app-store-review-guidelines) -- common rejection reasons

### Tertiary (LOW confidence)
- [MobiLoud WebView App Guidelines](https://www.mobiloud.com/blog/app-store-review-guidelines-webview-wrapper) -- Guideline 4.2 avoidance strategies for webview apps
- [Capgo Apple Policy Updates](https://capgo.app/blog/apple-policy-updates-for-capacitor-apps-2025/) -- 2025 Apple policy changes for Capacitor
- [Webvify Guideline 4.2 Fix](https://medium.com/@webvify.app/how-to-solve-apple-4-2-minimum-functionality-rejection-for-webview-apps-d8fce020c0f3) -- strategies for passing minimum functionality

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries needed, all tools already in project
- Architecture (account deletion): MEDIUM-HIGH - Edge Function pattern well-documented, but CASCADE state of existing tables needs verification
- Architecture (privacy policy): HIGH - straightforward React route
- Architecture (App Store Connect): HIGH - well-documented Apple processes
- Pitfalls: HIGH - common rejection reasons well-documented across many sources
- PrivacyInfo.xcprivacy: MEDIUM - API reason codes confirmed for UserDefaults; may need additional declarations found during Xcode archive validation

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (Apple guidelines stable; check for new Xcode requirements if delayed)
