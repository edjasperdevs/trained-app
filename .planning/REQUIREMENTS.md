# Requirements: WellTrained v2.4 App Store Readiness

This document defines all functional and non-functional requirements for v2.4 App Store Readiness milestone (Phases 45-48).

## Phase 47 Requirements: Asset & Code Cleanup

### ASSET-01: Splash Screen Branding
**Status:** ✅ Complete (Phase 47-01)
**Priority:** P1
**Category:** Assets
**Description:** Replace the generic dim green glow splash screen with proper WellTrained branding.

**Acceptance Criteria:**
- Splash screen (`resources/splash.png`) displays WellTrained logo or "W" mark
- Branded splash visible during native app launch (before web view loads)
- Splash screen maintains minimalist aesthetic consistent with app design
- File size remains reasonable (under 500 KB)

**Rationale:** The current splash screen lacks branding and may appear as a loading error to users. A branded splash screen provides a professional first impression during app launch.

---

### ASSET-02: Logo File Optimization
**Status:** ✅ Complete (Phase 47-02)
**Priority:** P1
**Category:** Assets
**Description:** Optimize oversized logo files that significantly impact web performance.

**Current State:**
- `public/icon-only.png`: Would be 3.1 MB if existed (mentioned in audit)
- `public/WT Logo.png`: Would be 3.1 MB if existed (mentioned in audit)
- These files serve as static assets and impact initial page load

**Acceptance Criteria:**
- Logo files optimized to under 100 KB each
- Visual quality maintained (no noticeable degradation)
- Files use appropriate compression (lossy PNG or WebP)
- Web page load time improves measurably

**Rationale:** 3.1 MB logo files significantly degrade web performance. Optimization is critical for user experience and SEO.

---

### ASSET-03: Remove .DS_Store Files
**Status:** ✅ Complete (Phase 47-03)
**Priority:** P1
**Category:** Repository Hygiene
**Description:** Remove all .DS_Store files from repository and prevent future additions.

**Current State:**
- 9 `.DS_Store` files committed to repository
- These are macOS metadata files that serve no purpose in version control
- Can leak directory structure information

**Files to Remove:**
```
/Users/ejasper/code/welltrained-platform/trained-app/node_modules/.DS_Store
/Users/ejasper/code/welltrained-platform/trained-app/src/assets/.DS_Store
/Users/ejasper/code/welltrained-platform/trained-app/src/.DS_Store
/Users/ejasper/code/welltrained-platform/trained-app/docs/.DS_Store
/Users/ejasper/code/welltrained-platform/trained-app/Design inspo/mockups/onboarding/.DS_Store
/Users/ejasper/code/welltrained-platform/trained-app/Design inspo/mockups/locked/.DS_Store
/Users/ejasper/code/welltrained-platform/trained-app/Design inspo/.DS_Store
/Users/ejasper/code/welltrained-platform/trained-app/Design inspo/mockups/.DS_Store
/Users/ejasper/code/welltrained-platform/trained-app/.DS_Store
```

**Acceptance Criteria:**
- All `.DS_Store` files removed from repository
- `.DS_Store` added to `.gitignore` to prevent future additions
- Git history cleaned (files removed from tracking)
- Future commits do not reintroduce `.DS_Store` files

**Rationale:** These files add unnecessary clutter to the repository and can leak directory structure information. Standard practice is to exclude them from version control.

---

### INFRA-02: Remove Legacy Onboarding Code
**Priority:** P1
**Category:** Code Cleanup
**Description:** Remove the legacy 1,017-line Onboarding.tsx file that is no longer used.

**Current State:**
- Original `src/screens/Onboarding.tsx` exists (1,017 lines)
- Newer `src/screens/onboarding-v2/` directory contains current onboarding (8 separate screen files)
- v2 onboarding is wired into active routing via `OnboardingStack.tsx`
- Legacy file is only accessible via dev bypass route
- Legacy file still lazy-loaded in `App.tsx` line 26

**Acceptance Criteria:**
- `src/screens/Onboarding.tsx` file deleted from repository
- Lazy-load import removed from `App.tsx` (line 26)
- Any routes pointing to legacy onboarding removed
- Application builds successfully without the legacy file
- No broken imports or references remain
- Bundle size decreases measurably

**Rationale:** The legacy onboarding adds dead code to the bundle (1,017 lines) and creates maintenance burden. Since v2 onboarding is confirmed stable and fully integrated, the legacy code should be removed.

---

## Phase 45 Requirements: iOS Configuration & Entitlements

### STORE-01: Privacy Manifest Compliance
**Status:** ✅ Complete (Phase 45-01)

### STORE-02: Production APNS Configuration
**Status:** ✅ Complete (Phase 45-01)

### STORE-03: Universal Links Team ID
**Status:** ✅ Complete (Phase 45-01, requires manual Team ID update)

---

## Phase 46 Requirements: Security & UX Fixes

### SEC-01: Remove Dev Fallback
**Status:** ✅ Complete (Phase 46-01)

### UX-01: Health Disclaimer Visibility
**Status:** ✅ Complete (Phase 46-02)

### UX-02: Workout Name Overflow Fix
**Status:** ✅ Complete (Phase 46-03)

### UX-03: Recovery Day Compliance Fix
**Status:** ✅ Complete (Phase 46-03)

---

## Phase 48 Requirements: App Store Submission

### STORE-04: App Store Connect Metadata
**Status:** Not Started

### STORE-05: Xcode Build Verification
**Status:** Not Started

### INFRA-01: Public Privacy Policy URL
**Status:** Not Started

---

## Traceability Matrix

| Requirement | Phase | Plans | Status |
|-------------|-------|-------|--------|
| ASSET-01 | 47 | 47-01 | ✅ Complete |
| ASSET-02 | 47 | 47-02 | ✅ Complete |
| ASSET-03 | 47 | 47-03 | ✅ Complete |
| INFRA-02 | 47 | 47-04 | Not Started |
| STORE-01 | 45 | 45-01 | ✅ Complete |
| STORE-02 | 45 | 45-01 | ✅ Complete |
| STORE-03 | 45 | 45-01 | ✅ Complete |
| SEC-01 | 46 | 46-01 | ✅ Complete |
| UX-01 | 46 | 46-02 | ✅ Complete |
| UX-02 | 46 | 46-03 | ✅ Complete |
| UX-03 | 46 | 46-03 | ✅ Complete |
| STORE-04 | 48 | TBD | Not Started |
| STORE-05 | 48 | TBD | Not Started |
| INFRA-01 | 48 | TBD | Not Started |
