---
phase: 45-ios-configuration-entitlements
verified: 2026-03-07T18:00:00Z
status: gaps_found
score: 2/3 must-haves verified
gaps:
  - truth: "Password reset and referral deep links route to the app via universal links"
    status: blocked
    reason: "Apple Team ID is still a placeholder (TEAM_ID_HERE) instead of actual 10-digit alphanumeric ID - external dependency on Apple Developer account verification"
    artifacts:
      - path: "public/.well-known/apple-app-site-association"
        issue: "Contains TEAM_ID_HERE placeholder instead of actual Team ID"
    missing:
      - "Replace TEAM_ID_HERE with actual Apple Team ID from developer.apple.com/account (10-character alphanumeric)"
      - "Update ios/App/App/public/.well-known/apple-app-site-association with same Team ID"
      - "Verify universal links work for /reset-password and /join/* paths"
human_verification:
  - test: "Submit build to App Store Connect and verify privacy label auto-population"
    expected: "App Store Connect automatically populates privacy labels from PrivacyInfo.xcprivacy data types"
    why_human: "Requires App Store Connect submission workflow - can't verify programmatically"
  - test: "Install production build and send test push notification"
    expected: "Push notification arrives via APNS production servers"
    why_human: "Requires production provisioning profile and APNS certificate - can't verify in dev environment"
---

# Phase 45: iOS Configuration & Entitlements Verification Report

**Phase Goal:** iOS native configuration is App Store compliant
**Verified:** 2026-03-07T18:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | App Store Connect can read declared data types from PrivacyInfo.xcprivacy | ✓ VERIFIED | NSPrivacyCollectedDataTypes array contains 6 data type declarations (HealthAndFitness, EmailAddress, OtherUserContent, ProductInteraction, PurchaseHistory, Photos) with proper linked/tracking/purposes flags. File is valid XML plist (99 lines). 39 occurrences of NSPrivacyCollectedDataType found. |
| 2 | Production builds send push notifications via APNS production environment | ✓ VERIFIED | App.entitlements line 6 has aps-environment set to "production". File is valid XML plist (24 lines). |
| 3 | Password reset and referral deep links route to the app via universal links | ✗ BLOCKED | apple-app-site-association file is structurally valid JSON (20 lines) with correct paths (/reset-password*, /join/*), but appIDs contains placeholder "TEAM_ID_HERE.fitness.welltrained.app" instead of actual Team ID. Universal links will NOT function until Team ID is replaced with actual 10-character alphanumeric ID from Apple Developer account. |

**Score:** 2/3 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `ios/App/App/PrivacyInfo.xcprivacy` | Privacy manifest declaring health, fitness, email, photos, usage data | ✓ VERIFIED | 99 lines, contains NSPrivacyCollectedDataTypes with 6 data types (HealthAndFitness, EmailAddress, OtherUserContent, ProductInteraction, PurchaseHistory, Photos). Each entry has NSPrivacyCollectedDataType, NSPrivacyCollectedDataTypeLinked, NSPrivacyCollectedDataTypeTracking, NSPrivacyCollectedDataTypePurposes keys. Valid XML plist. NSPrivacyAccessedAPITypes section preserved (UserDefaults CA92.1). |
| `ios/App/App/App.entitlements` | App Store production entitlements with aps-environment=production | ✓ VERIFIED | 24 lines, aps-environment set to "production" on line 6. Valid XML plist. All other entitlements preserved: com.apple.developer.applesignin, associated-domains, healthkit, in-app-payments. |
| `public/.well-known/apple-app-site-association` | Universal links configuration with actual Team ID | ⚠️ PARTIAL | 20 lines, valid JSON structure with correct paths (/reset-password*, /join/*). Contains TEAM_ID_HERE placeholder instead of actual Team ID. Structurally complete but NOT functional. TODO comment documents required change. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `ios/App/App/PrivacyInfo.xcprivacy` | App Store Connect privacy label | Xcode submission metadata | ✓ WIRED | NSPrivacyCollectedDataTypes array present with pattern match: 6 entries each containing NSPrivacyCollectedDataType key. App Store Connect will auto-populate privacy labels from this manifest during submission. |
| `ios/App/App/App.entitlements` | APNS production servers | aps-environment key | ✓ WIRED | Pattern match confirmed: "aps-environment.*production" found on line 6. Production builds will route push notifications through Apple's production APNS servers. |
| `public/.well-known/apple-app-site-association` | iOS universal links handler | Team ID in appIDs array | ✗ NOT_WIRED | Pattern search for "appIDs.*\d{10}\.fitness\.welltrained\.app" failed. File contains "TEAM_ID_HERE.fitness.welltrained.app" placeholder. Universal links handler will NOT recognize the app until Team ID is replaced with actual 10-character alphanumeric ID. |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| STORE-01 | 45-01-PLAN.md | PrivacyInfo.xcprivacy declares all collected data types (health, fitness, email, photos, usage) | ✓ SATISFIED | 6 data types declared: HealthAndFitness, EmailAddress, OtherUserContent, ProductInteraction, PurchaseHistory, Photos. All match AUDIT_REPORT.md Section 5.3 findings. |
| STORE-02 | 45-01-PLAN.md | App.entitlements has aps-environment set to "production" (not "development") | ✓ SATISFIED | aps-environment is "production" on line 6 of App.entitlements. Verified by grep pattern match. |
| STORE-03 | 45-01-PLAN.md | apple-app-site-association has actual Team ID (replace XXXXXXXXXX placeholder) | ✗ BLOCKED | File has TEAM_ID_HERE placeholder instead of actual Team ID. Success Criterion states "contains actual Team ID (no XXXXXXXXXX placeholder)" - replacing one placeholder with another placeholder does not satisfy the requirement. Blocker: Apple Developer account verification not complete. |

**Coverage:** 3/3 requirements mapped, 2/3 satisfied, 1/3 blocked by external dependency

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `public/.well-known/apple-app-site-association` | 5 | Placeholder value TEAM_ID_HERE | ⚠️ Warning | Universal links non-functional until Team ID replaced. Documented blocker per external dependency. |
| `public/.well-known/apple-app-site-association` | 19 | TODO comment | ℹ️ Info | Clear documentation of required change. Not a blocker for structural completion, but blocks functional completion. |

**Blocker severity:** No 🛑 blockers. The TEAM_ID_HERE placeholder is a documented external dependency (Apple Developer account verification) with clear remediation steps. This is categorized as ⚠️ Warning rather than blocker because the phase was scoped to prepare the configuration, with functional completion deferred to Phase 48.

### Human Verification Required

#### 1. App Store Connect Privacy Label Auto-Population

**Test:** Submit a build to App Store Connect and navigate to the App Privacy section
**Expected:** Privacy labels automatically populate from PrivacyInfo.xcprivacy data types - Health & Fitness, Email Address, Other User Content, Product Interaction, Purchase History, and Photos should appear with correct "linked to user" and "tracking" flags
**Why human:** Requires App Store Connect submission workflow and access to Apple's processing system - can't verify programmatically without actual submission

#### 2. Production APNS Notification Delivery

**Test:** Install a production build (not development/TestFlight internal) and send a test push notification from backend
**Expected:** Push notification arrives successfully via APNS production servers
**Why human:** Requires production provisioning profile, production APNS certificate, and actual device installation - can't verify in development environment or via static analysis

#### 3. Universal Links Deep Linking (After Team ID Update)

**Test:** After replacing TEAM_ID_HERE with actual Team ID, tap a link like https://app.welltrained.fitness/reset-password?token=xxx or https://app.welltrained.fitness/join/ABC123 from Safari
**Expected:** App opens and routes to password reset or referral screens (not web view)
**Why human:** Requires actual Team ID from Apple Developer account (currently blocked), device testing, and verification of deep link routing behavior

### Gaps Summary

**1 gap blocking full goal achievement:**

**Gap: Universal Links Not Functional**

The apple-app-site-association file is structurally complete but contains the placeholder "TEAM_ID_HERE" instead of an actual Apple Team ID. Success Criterion #3 explicitly requires "contains actual Team ID (no XXXXXXXXXX placeholder)".

**Root Cause:** External dependency - Apple Developer account enrollment verification not complete (per STATE.md pending todo).

**Impact:** Password reset and referral deep links will not route to the app. Universal links handler will fail to recognize the app because the Team ID doesn't match any registered Apple Developer Team.

**What's Missing:**
- Replace TEAM_ID_HERE with actual 10-character alphanumeric Team ID from developer.apple.com/account
- Update both `public/.well-known/apple-app-site-association` and `ios/App/App/public/.well-known/apple-app-site-association`
- Verify universal links work for /reset-password and /join/* paths
- Deploy updated AASA file to production (Vercel serves from public/ automatically)

**Status:** The SUMMARY documents this as a known blocker for Phase 48. The gap is tracked and remediation steps are clear. However, the phase goal "iOS native configuration is App Store compliant" is not fully achieved because STORE-03 requirement is not satisfied.

**Recommendation:** Mark STORE-03 as "Prepared (pending Team ID)" in requirements tracker. Plan Team ID update as first task in Phase 48 when Apple Developer account verification completes.

---

**Overall Assessment:**

Phase 45 achieved 2 of 3 must-haves. The privacy manifest and APNS configuration are production-ready and App Store compliant. The universal links configuration is structurally prepared but functionally incomplete due to an external dependency. The gap is well-documented with clear remediation steps.

**Automated verification passed:** ✓ Files exist, ✓ Valid XML/JSON syntax, ✓ Patterns present (except Team ID)
**Human verification required:** App Store Connect privacy label auto-population, production APNS delivery, universal links routing (after Team ID update)

---

_Verified: 2026-03-07T18:00:00Z_
_Verifier: Claude (gsd-verifier)_
