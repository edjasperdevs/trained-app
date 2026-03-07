# Requirements: WellTrained

**Defined:** 2026-03-07
**Core Value:** Daily discipline earns visible rank progression — the app makes consistency feel like leveling up

## v2.4 Requirements (App Store Readiness)

Requirements for iOS App Store submission readiness. All items derived from AUDIT_REPORT.md P0 and P1 findings.

### App Store Configuration

- [x] **STORE-01**: PrivacyInfo.xcprivacy declares all collected data types (health, fitness, email, photos, usage)
- [x] **STORE-02**: App.entitlements has aps-environment set to "production" (not "development")
- [x] **STORE-03**: apple-app-site-association has actual Team ID (replace XXXXXXXXXX placeholder)
- [ ] **STORE-04**: App Store Connect metadata complete (screenshots, description, privacy label)
- [ ] **STORE-05**: Build compiles with latest Xcode and iOS 18 SDK

### Security Fixes

- [x] **SEC-01**: Remove dev fallback in access code validation that accepts any 8+ character string

### UX Improvements

- [x] **UX-01**: Add visible health/medical disclaimer during onboarding flow
- [ ] **UX-02**: Fix workout name overflow on Workouts screen Today card
- [ ] **UX-03**: Fix recovery day compliance calculation (4/4 vs 5/5 issue)

### Asset Optimization

- [ ] **ASSET-01**: Add WellTrained branding to splash screen (replace dim green glow)
- [ ] **ASSET-02**: Optimize icon-only.png and WT Logo.png (currently 3.1 MB each)
- [ ] **ASSET-03**: Remove .DS_Store files from repository and add to .gitignore

### Infrastructure

- [ ] **INFRA-01**: Host privacy policy at public URL (not just in-app /privacy route)
- [ ] **INFRA-02**: Remove legacy Onboarding.tsx file (1,017 lines of dead code)

## Future Requirements

Items from AUDIT_REPORT.md marked P2 (post-launch improvements):

### UX Enhancements
- Move weight tracking out of Settings to dedicated section
- Add prominent offline mode indicator
- Add E2E tests for subscription flow, account deletion, locked protocol

### Code Quality
- Extract hardcoded fitness constants to shared config
- Break large components (Settings) into sub-components
- Generate WebP versions of avatar illustrations for web
- Re-enable or fully remove MealPlan AI feature code

## Out of Scope

- Android / Play Store — iOS only for v2
- New features during App Store prep — focus is on submission readiness
- P2 items from audit — deferred to post-launch

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| STORE-01 | Phase 45 | Complete |
| STORE-02 | Phase 45 | Complete |
| STORE-03 | Phase 45 | Complete |
| STORE-04 | Phase 48 | Pending |
| STORE-05 | Phase 48 | Pending |
| SEC-01 | Phase 46 | Complete |
| UX-01 | Phase 46 | Complete |
| UX-02 | Phase 46 | Pending |
| UX-03 | Phase 46 | Pending |
| ASSET-01 | Phase 47 | Pending |
| ASSET-02 | Phase 47 | Pending |
| ASSET-03 | Phase 47 | Pending |
| INFRA-01 | Phase 48 | Pending |
| INFRA-02 | Phase 47 | Pending |

**Coverage:**
- v2.4 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-07*
*Last updated: 2026-03-07 after roadmap creation*
