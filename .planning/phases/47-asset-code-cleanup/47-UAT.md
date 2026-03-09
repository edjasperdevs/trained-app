---
status: paused
phase: 47-asset-code-cleanup
source:
  - 47-01-SUMMARY.md
  - 47-02-SUMMARY.md
  - 47-03-SUMMARY.md
  - 47-04-SUMMARY.md
started: 2026-03-09T04:30:00Z
updated: 2026-03-09T04:37:00Z
---

## Current Test

number: 4
name: Legacy onboarding is removed from codebase
expected: |
  Search for legacy Onboarding.tsx file - it should not exist. Check src/App.tsx - should have no import from '@/screens/Onboarding'. Run `npm run build` - should complete with zero errors.
awaiting: user response

## Tests

### 1. Branded splash screen displays on app launch
expected: Open the iOS app. During launch, splash screen shows WellTrained "W" logo with runner in bright lime-green on dark background, centered and clearly visible.
result: issue
reported: "This is actually the old design. Now it is the crown that says forge your protocol."
severity: major

### 2. Public directory assets are optimized
expected: Check public/ directory assets. Largest file (pwa-512x512.png) should be around 229 KB. No files exceed 500 KB. Files like apple-touch-icon.png (~39 KB), og-image.png (~29 KB) are appropriately sized.
result: pass

### 3. Repository contains no .DS_Store files
expected: Run `git ls-files | grep DS_Store` in terminal. Command should return no results (empty output). .gitignore file should contain ".DS_Store" entry.
result: pass

### 4. Legacy onboarding is removed from codebase
expected: Search for legacy Onboarding.tsx file - it should not exist. Check src/App.tsx - should have no import from '@/screens/Onboarding'. Run `npm run build` - should complete with zero errors.
result: [pending]

### 5. App builds and runs without errors
expected: Run `npm run build` in terminal. Build should complete successfully (typically in ~10s) with no TypeScript errors. Then run `npx cap sync ios` - should complete without errors. App functionality should be unaffected by cleanup.
result: [pending]

## Summary

total: 5
passed: 2
issues: 1
pending: 2
skipped: 0

## Gaps

- truth: "Splash screen shows WellTrained 'W' logo with runner in bright lime-green on dark background"
  status: failed
  reason: "User reported: This is actually the old design. Now it is the crown that says forge your protocol."
  severity: major
  test: 1
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
