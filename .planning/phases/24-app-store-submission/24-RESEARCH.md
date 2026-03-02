# Phase 24: App Store Submission - Research

**Researched:** 2026-03-01
**Domain:** iOS App Store submission, data migration, privacy compliance
**Confidence:** HIGH

## Summary

Phase 24 involves three distinct concerns: (1) data migration from V1's XP system to V2's DP system with a "Fresh Start" experience, (2) privacy manifest compliance for HealthKit and StoreKit usage, and (3) the complete App Store submission pipeline including TestFlight, metadata, and review notes.

The existing codebase already has: dpStore (rank 1 by default), xpStore (legacy, still exported), PrivacyInfo.xcprivacy (needs HealthKit update), App.entitlements (HealthKit + IAP configured), AASA file (needs Team ID), and Settings export/import (handles V1 xp legacy import). The v1.5 Phase 16 work was partially completed (16-01 account deletion, 16-02 privacy policy) before being moved to v2.0.

**Primary recommendation:** Implement a one-time migration check on app launch that detects old xpStore data, shows a "Fresh Start" modal explaining the V2 transition, clears the legacy localStorage key, and ensures users begin at Rank 1 with preserved workout/macro/profile data.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | V2 update displays "Fresh Start" message acknowledging XP/level reset | FreshStartModal pattern + version migration hook on app mount |
| DATA-02 | All users begin at Rank 1 (Initiate) with 0 DP on V2 | dpStore defaults to rank 1; no migration needed, just clear old data |
| DATA-03 | Old xpStore localStorage data cleaned up without breaking app state | Remove `gamify-gains-xp` key safely; update devSeed.ts |
| DATA-04 | Existing workout, macro, weight, and profile data fully preserved | No migration needed; separate localStorage keys per store |
| LAUNCH-01 | App passes Apple App Review with subscription IAP products | Review notes template, sandbox account setup, demo video |
| LAUNCH-02 | PrivacyInfo.xcprivacy updated for HealthKit data types | Add NSPrivacyCollectedDataTypes for health/fitness |
| LAUNCH-03 | App Store metadata, screenshots, and description prepared | 1320x2868px screenshots, metadata copy, keyword research |
| LAUNCH-04 | AASA file updated with actual Apple Team ID | Replace XXXXXXXXXX placeholder in public/.well-known/apple-app-site-association |
</phase_requirements>

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @capacitor/ios | ^7.5.0 | Native iOS runtime | Capacitor 7 standard for hybrid apps |
| @revenuecat/purchases-capacitor | ^11.3.2 | IAP subscriptions | RevenueCat SDK for Capacitor |
| @capgo/capacitor-health | ^7.2.15 | HealthKit access | Steps/sleep tracking |
| zustand | ^4.5.2 | State with localStorage persist | Migration handled via persist middleware |

### Supporting (App Store Submission)
| Tool | Purpose | When to Use |
|------|---------|-------------|
| Xcode 15+ | Archive, sign, upload | Required for App Store Connect upload |
| App Store Connect | TestFlight, metadata, submission | Web portal for app management |
| RevenueCat Dashboard | IAP product configuration | Verify sandbox products match App Store |

### No Additional Libraries Needed
This phase is primarily configuration, metadata, and one migration component. No new npm dependencies required.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── migration.ts         # V2 migration check (NEW)
├── components/
│   └── FreshStartModal.tsx  # One-time "Fresh Start" message (NEW)
├── stores/
│   ├── dpStore.ts           # Already defaults to rank 1
│   └── xpStore.ts           # Legacy, will be orphaned after migration
ios/
└── App/App/
    ├── PrivacyInfo.xcprivacy  # Update with HealthKit data types
    └── Info.plist             # Already has NSHealthShareUsageDescription
public/
└── .well-known/
    └── apple-app-site-association  # Update Team ID placeholder
```

### Pattern 1: Version Migration Hook
**What:** Check for legacy data on app mount, show modal once, clean up
**When to use:** App upgrades that change data schemas without migration path
**Example:**
```typescript
// src/lib/migration.ts
const V2_MIGRATION_KEY = 'trained-v2-migration-complete'

export function checkV2Migration(): { needsMigration: boolean; legacyXP: number | null } {
  // Already migrated?
  if (localStorage.getItem(V2_MIGRATION_KEY)) {
    return { needsMigration: false, legacyXP: null }
  }

  // Check for legacy xpStore data
  const legacyData = localStorage.getItem('gamify-gains-xp')
  if (!legacyData) {
    // New user or already clean, mark as done
    localStorage.setItem(V2_MIGRATION_KEY, 'true')
    return { needsMigration: false, legacyXP: null }
  }

  try {
    const parsed = JSON.parse(legacyData)
    const totalXP = parsed.state?.totalXP || 0
    return { needsMigration: true, legacyXP: totalXP }
  } catch {
    return { needsMigration: true, legacyXP: null }
  }
}

export function completeV2Migration(): void {
  // Remove legacy xpStore data
  localStorage.removeItem('gamify-gains-xp')
  // Mark migration complete
  localStorage.setItem(V2_MIGRATION_KEY, 'true')
}
```

### Pattern 2: One-Time Modal with Dismiss
**What:** Show "Fresh Start" message once after upgrade, auto-dismiss on acknowledgment
**When to use:** Major version transitions that change core mechanics
**Example:**
```typescript
// FreshStartModal component pattern
function FreshStartModal({ legacyXP, onDismiss }: Props) {
  return (
    <Dialog open onOpenChange={onDismiss}>
      <DialogContent>
        <h2>Welcome to WellTrained V2</h2>
        <p>The protocol has evolved. Your {legacyXP ? `${legacyXP} XP` : 'progress'} has been honored,
        but all trainees now begin fresh in the new Discipline Points system.</p>
        <p>Your workouts, macros, and profile are fully preserved.</p>
        <Button onClick={onDismiss}>Begin Fresh</Button>
      </DialogContent>
    </Dialog>
  )
}
```

### Anti-Patterns to Avoid
- **Don't migrate XP to DP:** The systems have different progression curves and semantics; forced conversion would feel arbitrary
- **Don't silently delete data:** Users should know their XP is being reset
- **Don't show migration on every launch:** Must be strictly one-time with persistence
- **Don't block app usage:** Modal should be dismissible, not a hard gate

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Screenshot generation | Manual screenshots per device | Single 6.9" + 13" set | Apple auto-scales since late 2024 |
| Privacy manifest generation | Custom XML builder | Direct PrivacyInfo.xcprivacy edit | Apple's format is simple plist |
| IAP product setup | Custom backend validation | RevenueCat Dashboard | Already integrated, handles sandbox |
| App Store metadata | Manual typing in ASC | Prepare in markdown, paste | Easier to review/version control |

**Key insight:** Phase 24 is mostly about completing human-action tasks (App Store Connect, Xcode signing) with minimal code changes. The migration component is the only substantive code work.

## Common Pitfalls

### Pitfall 1: xpStore Import Breaking After Cleanup
**What goes wrong:** Settings import path tries to use deleted xpStore
**Why it happens:** Settings.tsx line 334 still handles legacy V1 xp import
**How to avoid:** Either remove the V1 import path or keep xpStore.ts as a stub
**Warning signs:** Import fails silently for old backup files

### Pitfall 2: PrivacyInfo.xcprivacy Missing Data Collection Types
**What goes wrong:** Apple rejects with "incomplete privacy manifest"
**Why it happens:** HealthKit reads must be declared in NSPrivacyCollectedDataTypes
**How to avoid:** Add health/fitness data type declaration
**Warning signs:** App Store Connect warning emails about privacy

### Pitfall 3: AASA Team ID Placeholder in Production
**What goes wrong:** Universal Links (password reset) stop working
**Why it happens:** XXXXXXXXXX placeholder never replaced
**How to avoid:** Replace with actual Team ID before TestFlight
**Warning signs:** Password reset emails don't open in app

### Pitfall 4: Sandbox Purchase Failures During Review
**What goes wrong:** Apple reviewer can't complete subscription purchase
**Why it happens:** Sandbox environment is notoriously flaky; reviewer may hit timeout
**How to avoid:** Provide demo video in review notes showing successful purchase
**Warning signs:** Rejection with "unable to complete in-app purchase"

### Pitfall 5: Migration Modal Shows on New Users
**What goes wrong:** First-time users see confusing "Fresh Start" message
**Why it happens:** Migration check runs before checking if user is new
**How to avoid:** Only show modal if legacy xpStore data exists
**Warning signs:** User reports "why is it talking about my old progress?"

### Pitfall 6: Missing Review Notes for HealthKit
**What goes wrong:** Reviewer doesn't understand HealthKit usage
**Why it happens:** No demo account or video showing health data flow
**How to avoid:** Detailed review notes explaining steps/sleep integration
**Warning signs:** Rejection asking "how is HealthKit used?"

## Code Examples

### PrivacyInfo.xcprivacy with HealthKit Data Types
```xml
<!-- Source: Apple Privacy Manifest documentation -->
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
  <array>
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeHealthAndFitness</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <false/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>
  </array>
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

### AASA File with Team ID
```json
{
  "applinks": {
    "details": [
      {
        "appIDs": ["TEAMID123.fitness.welltrained.app"],
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

### App Store Review Notes Template
```
## Demo Account
Email: reviewer@welltrained.fitness
Password: [provided separately]

## Testing In-App Purchases
1. Sandbox account is pre-configured
2. On Paywall screen, tap "Get Premium" (monthly or annual)
3. Sandbox purchase flow will complete with test credentials
4. After purchase, premium features unlock:
   - Premium archetypes (Himbo, Brute, Pup, Bull)
   - Weekly Protocol Orders
   - Avatar stages 3-5

## Testing HealthKit
1. App requests HealthKit permission after onboarding (soft-ask first)
2. Grant "Steps" and "Sleep" read access when prompted
3. Navigate to Home screen to see health data displayed
4. Earning 10,000+ steps awards +10 DP
5. Sleeping 7+ hours awards +10 DP

## HealthKit Data Usage
- App reads step count and sleep duration from Apple Health
- Data is used ONLY to award Discipline Points for healthy habits
- No health data is transmitted off-device or to third parties
- No advertising or analytics uses health data

## Known Behaviors
- First launch shows onboarding flow (skip for demo account)
- Premium subscription unlocks immediately after purchase
- HealthKit data requires physical device (not available on simulator)
```

### App Store Description Template
```
Name: WellTrained (30 chars max)
Subtitle: Discipline Through Fitness (30 chars max)

Promotional Text (170 chars max):
Build discipline, earn your rank. Track workouts, hit macros, get steps,
sleep well. The protocol rewards consistency with visible progression.

Description:
WellTrained is not a game. It's a system.

Earn Discipline Points (DP) through daily actions:
- Complete a workout: +50 DP
- Log your meals: +15 DP each
- Hit protein target: +25 DP
- Walk 10,000+ steps: +10 DP
- Sleep 7+ hours: +10 DP

Progress through 15 ranks from Initiate to Master. Maintain your
Obedience Streak by completing at least one action daily. Choose
your archetype to specialize your DP bonuses.

Premium subscribers unlock:
- 4 specialized archetypes with unique bonuses
- Weekly Protocol Orders with bonus DP rewards
- Advanced avatar evolution stages

Your health data stays on your device. We never sell or share your
information. Structure creates freedom.

Keywords (100 chars, comma-separated):
fitness,workout,macros,discipline,training,gym,health,tracker,progress
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Multiple screenshot sizes | Single 6.9" iPhone + 13" iPad set | Late 2024 | Apple auto-scales to older devices |
| Manual promo codes | Offer codes for all IAP types | March 2026 | Promo codes deprecated |
| iOS 17 SDK minimum | iOS 26 SDK required | April 28, 2026 | Must use latest Xcode |

**Important deadline:** Apps uploaded after April 28, 2026 must be built with iOS 26 SDK. Current project uses Capacitor 7 which requires migration to Capacitor 8 before this deadline (noted in STATE.md as pending todo).

**Current status:** This submission targets pre-April deadline with Capacitor 7 / current SDK.

## Open Questions

1. **Apple Developer Account Status**
   - What we know: Enrollment submitted, awaiting approval (per STATE.md)
   - What's unclear: Exact Team ID to use
   - Recommendation: Block AASA update until Team ID confirmed; proceed with all other work

2. **RevenueCat Product IDs**
   - What we know: SDK integrated, ENTITLEMENT_ID='premium'
   - What's unclear: Exact product IDs configured in App Store Connect
   - Recommendation: Verify product IDs match between RevenueCat Dashboard and App Store Connect before TestFlight

3. **Sleep Data from HealthKit**
   - What we know: @capgo/capacitor-health doesn't support sleep aggregation (per STATE.md Phase 20 decision)
   - What's unclear: Whether to mention this limitation in review notes
   - Recommendation: Note in review notes that sleep requires manual entry; steps are auto-populated

## App Store Connect Checklist

### Before TestFlight
- [ ] Apple Developer Program enrollment active
- [ ] Team ID obtained from developer.apple.com/account
- [ ] AASA file updated with real Team ID
- [ ] Xcode signing configured with distribution profile
- [ ] Archive builds successfully
- [ ] Export Compliance questionnaire answered (HTTPS only = exempt)

### Before App Store Submission
- [ ] TestFlight build verified by internal testers
- [ ] App icon meets requirements (1024x1024 for store)
- [ ] Screenshots prepared (1320x2868px 6.9" iPhone)
- [ ] App name, subtitle, description finalized
- [ ] Keywords optimized (100 chars)
- [ ] Privacy policy URL configured
- [ ] Support URL configured
- [ ] Contact info set
- [ ] Age rating questionnaire completed
- [ ] IAP products in "Ready to Submit" status
- [ ] Review notes with demo account
- [ ] Review notes with HealthKit explanation

### Screenshot Specifications
| Device | Size (px) | Required |
|--------|-----------|----------|
| 6.9" iPhone | 1320 x 2868 | Yes (scaled to others) |
| 6.7" iPhone | Optional | Auto-scaled from 6.9" |
| 6.5" iPhone | Optional | Auto-scaled from 6.9" |
| 5.5" iPhone | Optional | Auto-scaled from 6.9" |
| 13" iPad | 2064 x 2752 | Only if iPad supported |

### Recommended Screenshots (5-10)
1. Home screen with rank progress
2. Workouts screen with logged workout
3. Macros screen with daily tracking
4. Protocol Orders (quests) display
5. Paywall showing subscription options
6. Avatar evolution preview
7. HealthKit integration (steps/sleep display)

## Sources

### Primary (HIGH confidence)
- [Apple Privacy Manifest Documentation](https://developer.apple.com/documentation/bundleresources/privacy-manifest-files) - Privacy manifest structure
- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) - Review requirements
- [Apple Screenshot Specifications](https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/) - Image sizes

### Secondary (MEDIUM confidence)
- [RevenueCat Sandbox Testing](https://www.revenuecat.com/docs/test-and-launch/sandbox/apple-app-store) - TestFlight IAP testing
- [Capacitor Deploying to App Store](https://capacitorjs.com/docs/ios/deploying-to-app-store) - Capacitor-specific guidance
- [App Store Review Guidelines 2026 Checklist](https://adapty.io/blog/how-to-pass-app-store-review/) - Common pitfalls

### Tertiary (LOW confidence)
- Community reports on sandbox environment flakiness - verified by multiple sources but timing varies

## Metadata

**Confidence breakdown:**
- Data migration: HIGH - clear localStorage patterns in existing codebase
- Privacy manifest: HIGH - Apple documentation is definitive
- App Store submission: MEDIUM - process is well-documented but timelines vary
- Review outcome: LOW - Apple review is somewhat unpredictable

**Research date:** 2026-03-01
**Valid until:** 30 days (stable Apple requirements, though SDK deadline approaching)
