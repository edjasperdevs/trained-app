# Phase 19: User Setup Required

**Generated:** 2026-02-28
**Phase:** 19-subscriptions
**Status:** Incomplete

Complete these items for RevenueCat subscription integration to function. Claude automated everything possible; these items require human access to external dashboards/accounts.

## Environment Variables

| Status | Variable | Source | Add to |
|--------|----------|--------|--------|
| [ ] | `VITE_REVENUECAT_IOS_API_KEY` | RevenueCat Dashboard -> Project Settings -> API Keys -> iOS app-specific API key | `.env.local` |

## Account Setup

- [ ] **Create RevenueCat account** (if needed)
  - URL: https://app.revenuecat.com/
  - Skip if: Already have RevenueCat account

- [ ] **Create App Store Connect sandbox tester** (for testing)
  - URL: App Store Connect -> Users and Access -> Sandbox
  - Create a test account with a unique email

## Dashboard Configuration

### RevenueCat Setup

- [ ] **Create RevenueCat project and connect to App Store Connect**
  - Location: RevenueCat Dashboard -> Project Settings -> App Store Connect
  - Steps:
    1. Create new project
    2. Add iOS app with your App Store Connect credentials
    3. Upload App Store Connect API key for server-to-server communication

- [ ] **Create 'premium' entitlement**
  - Location: RevenueCat Dashboard -> Entitlements
  - Entitlement identifier: `premium` (must match `ENTITLEMENT_ID` in code)
  - This entitlement unlocks premium features

- [ ] **Create monthly and annual offerings**
  - Location: RevenueCat Dashboard -> Offerings
  - Create offering with identifier (e.g., `default`)
  - Add packages: Monthly, Annual
  - Map to App Store Connect subscription products

### App Store Connect Setup

- [ ] **Create auto-renewable subscription products**
  - Location: App Store Connect -> Your App -> Monetization -> In-App Purchases
  - Create subscription group (e.g., "WellTrained Premium")
  - Add subscription products:
    - Monthly subscription
    - Annual subscription
  - Complete App Store submission requirements:
    - Review screenshot
    - Review notes
    - Pricing

- [ ] **Configure subscription group**
  - Set up subscription group localization
  - Configure upgrade/downgrade behavior

## Xcode Configuration

- [ ] **Enable In-App Purchase capability in Xcode**
  - Open Xcode project: `ios/App/App.xcworkspace`
  - Select App target -> Signing & Capabilities
  - Add "In-App Purchase" capability
  - Note: The entitlements file has been updated, but capability must also be enabled in Xcode UI

## Verification

After completing setup:

```bash
# Check env var is set
grep VITE_REVENUECAT_IOS_API_KEY .env.local

# Rebuild the app
npm run build
npx cap sync ios
npx cap open ios
```

Test on physical device:
1. Sign out of App Store on device
2. Sign in with sandbox tester account
3. Launch app and check console for "[RevenueCat] Initialized with user:" message
4. Navigate to subscription flow (Phase 19-02)
5. Attempt purchase with sandbox account

Expected results:
- RevenueCat SDK initializes without errors
- Offerings load successfully
- Sandbox purchases complete in test mode

---

**Once all items complete:** Mark status as "Complete" at top of file.
