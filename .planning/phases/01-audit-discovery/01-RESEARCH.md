# Phase 1: Audit & Discovery - Research

**Researched:** 2026-02-04
**Domain:** PWA Launch Audit (React 18 + Vite + Zustand + Supabase)
**Confidence:** HIGH

## Summary

This research covers systematic approaches to auditing a PWA fitness app before launching to 90k users. The primary focus is on user journey testing methodology, cross-platform PWA verification (iOS Safari vs Android Chrome), offline-first testing patterns, and bug documentation/prioritization frameworks.

The audit phase is critical because the app state is currently unknown - the user hasn't tested the full journey recently. The app uses an offline-first architecture with Zustand persistence to localStorage and optional Supabase cloud sync. This creates specific testing scenarios around data persistence, sync integrity, and service worker behavior that must be verified before launch.

**Primary recommendation:** Follow a structured critical path testing approach that covers the full user journey (access code -> onboarding -> workout -> macros -> XP claim), verify PWA installability on both iOS and Android, test all offline scenarios systematically, and document bugs using a severity/priority matrix for efficient triage.

## Standard Stack

The audit phase uses tools already available in the project plus browser-based testing tools.

### Core Testing Tools
| Tool | Purpose | How to Use |
|------|---------|------------|
| Chrome DevTools | Network throttling, service worker inspection, localStorage debugging | Application tab for SW/Storage, Network tab for offline simulation |
| Lighthouse | PWA compliance, performance, accessibility audits | DevTools > Lighthouse tab or `npx lighthouse URL --view` |
| React DevTools | Component profiling, state inspection | Browser extension, Profiler tab for render analysis |
| Vitest (existing) | Existing unit tests | `npm run test:run` to verify no regressions |

### Supporting Tools
| Tool | Purpose | When to Use |
|------|---------|-------------|
| axe DevTools | Accessibility audit | After visual testing, scan each screen |
| BrowserStack/Sauce Labs | Cross-device testing | If real devices unavailable |
| Safari Web Inspector | iOS PWA debugging | Testing PWA on iOS specifically |

### Commands Reference
```bash
# Build and preview production
npm run build && npm run preview

# Run existing tests
npm run test:run

# Type checking
npx tsc --noEmit

# Lint check
npm run lint

# Lighthouse CLI (after build/preview)
npx lighthouse http://localhost:4173 --view

# Accessibility audit
npx @axe-core/cli http://localhost:4173
```

## Architecture Patterns

### Pattern 1: Critical Path Testing Methodology

**What:** Systematic walkthrough of the complete user journey as a new user would experience it.

**When to use:** First phase of any pre-launch audit.

**Testing Flow:**
```
1. Access Gate (AccessGate.tsx)
   └── Valid code entry
   └── Invalid code handling
   └── Rate limiting behavior

2. Authentication (Auth.tsx)
   └── Signup flow
   └── Signin flow
   └── Password reset

3. Onboarding (Onboarding.tsx - 8 steps)
   └── Name entry
   └── Gender selection
   └── Body stats (weight/height/age)
   └── Fitness level
   └── Training days + day selection
   └── Goal selection
   └── Avatar reveal

4. Home Screen (Home.tsx)
   └── Daily quests display
   └── Streak display
   └── Reminder cards
   └── Motivational message

5. Workout Flow (Workouts.tsx)
   └── Start scheduled workout
   └── Log sets (weight/reps)
   └── Complete workout / End early
   └── Exercise customization

6. Macro Tracking (Macros.tsx)
   └── Quick log macros
   └── Food search (USDA API)
   └── Save meal / Use saved meal
   └── Daily totals

7. Check-in & XP (CheckInModal.tsx, XPClaimModal.tsx)
   └── Daily check-in
   └── XP award
   └── Weekly XP claim (Sunday)
   └── Level-up

8. Settings (Settings.tsx)
   └── Weight logging
   └── Data export/import
   └── Sign out
```

### Pattern 2: Device/Browser Test Matrix

**What:** Prioritized device/browser combinations for testing based on target audience.

**When to use:** After critical path verified on development machine.

**Test Matrix:**
| Priority | Device | Browser | Key Tests |
|----------|--------|---------|-----------|
| HIGH | iPhone 14+ | Safari | PWA install via "Add to Home Screen", standalone mode, safe area insets, pull-to-refresh |
| HIGH | Android (Pixel/Samsung) | Chrome | Install prompt, splash screen, back button, theme color |
| MEDIUM | iPad | Safari | Tablet layout, orientation handling |
| MEDIUM | macOS | Chrome/Safari | Desktop fallback |
| LOW | Windows | Chrome/Edge | Desktop fallback |

**Responsive Breakpoints:**
- 320px (iPhone SE)
- 375px (iPhone 12/13)
- 390px (iPhone 14/15)
- 428px (iPhone Pro Max)
- 768px (iPad portrait)
- 1024px (iPad landscape)

### Pattern 3: Offline Testing Scenarios

**What:** Systematic offline mode verification for offline-first PWA.

**When to use:** After basic functionality verified online.

**Test Scenarios:**
```
SCENARIO 1: Fresh Offline Start
- Enable DevTools Network > Offline
- Load app (should serve from cache)
- Navigate between screens
- Verify no error states

SCENARIO 2: Offline Data Entry
- Log workout while offline
- Log macros while offline
- Complete check-in while offline
- Verify "saved locally" feedback (not errors)

SCENARIO 3: Offline-to-Online Transition
- Make changes while offline
- Return online
- Verify automatic sync
- Check for duplicates

SCENARIO 4: Mid-Action Network Loss
- Start workout online
- Go offline during workout
- Complete workout offline
- Return online, verify sync

SCENARIO 5: Food Search Offline
- Go offline
- Try food search (should show appropriate message)
- Verify saved meals still accessible
- Verify quick-log still works
```

### Pattern 4: Data Persistence Verification

**What:** Verify localStorage-based persistence survives various scenarios.

**localStorage Keys to Verify:**
```
gamify-gains-user      - Profile, weight history
gamify-gains-macros    - Targets, daily logs, saved meals
gamify-gains-workouts  - Plan, logs, customizations
gamify-gains-xp        - XP state
gamify-gains-access    - Access code validation
```

**Test Scenarios:**
```
SCENARIO 1: Basic Persistence
- Log data, close app, reopen
- Data should survive

SCENARIO 2: App Update Simulation
- Have data in app
- Clear service worker cache only (keep localStorage)
- Reload - data should survive

SCENARIO 3: Cross-Device Login
- Create account on device A, log data
- Login on device B
- Verify cloud sync restores data

SCENARIO 4: Storage Pressure
- Check current localStorage usage
- Verify no quota exceeded errors
```

**Storage Check Script:**
```javascript
// Run in console to check storage usage
const checkStorage = () => {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length * 2; // UTF-16
    }
  }
  console.log(`LocalStorage: ${(total / 1024).toFixed(2)} KB`);
};
checkStorage();
```

## Don't Hand-Roll

Problems that have existing solutions - don't build custom approaches.

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PWA compliance check | Manual checklist | Lighthouse PWA audit | Comprehensive, automated, industry standard |
| Accessibility audit | Manual review | axe-core / axe DevTools | Catches 57%+ of accessibility issues automatically |
| Performance profiling | Console.log timing | React DevTools Profiler + Lighthouse | Built-in, accurate, visual |
| Cross-browser testing | Manual device switching | BrowserStack / real device lab | Time-efficient, broader coverage |
| Service worker inspection | Network tab guessing | Application tab in DevTools | Purpose-built, shows registration status, cache contents |

**Key insight:** Browser DevTools have purpose-built panels for every PWA audit need. The Application tab is the single source of truth for service worker state, cache storage, and localStorage inspection.

## Common Pitfalls

### Pitfall 1: Testing Only Happy Path

**What goes wrong:** Audit passes because only the ideal user journey was tested. Edge cases (invalid inputs, network failures, timezone boundaries) cause crashes in production.

**Why it happens:** Time pressure leads to "it works on my machine" confidence.

**How to avoid:**
- Test invalid inputs for every field (empty, too long, special characters)
- Test error states (network down, API failures)
- Test boundary conditions (midnight streak check, Sunday XP claim)
- Test on actual devices, not just emulators

**Warning signs:** No error messages documented, no edge cases in test notes.

### Pitfall 2: iOS Safari PWA Assumptions

**What goes wrong:** PWA works perfectly in Chrome, fails silently on iOS Safari (7-day storage eviction, no install prompt, storage isolation).

**Why it happens:** Development happens in Chrome; iOS tested only briefly.

**How to avoid:**
- Test full journey on actual iPhone in Safari
- Test PWA installation flow ("Add to Home Screen")
- Test storage persistence over multiple days
- Verify safe area insets on notch devices

**Warning signs:** "We'll test iOS before launch" (too late), assuming Safari behaves like Chrome.

### Pitfall 3: Offline Mode "Works" But Actually Doesn't

**What goes wrong:** App loads offline but critical features fail silently (workout not saved, macros lost, sync never completes).

**Why it happens:** DevTools offline mode tested but not real network loss scenarios.

**How to avoid:**
- Test airplane mode on real device
- Test intermittent connectivity (toggle WiFi rapidly)
- Verify data survives offline -> online transition
- Check for duplicate entries after reconnection

**Warning signs:** "Offline mode works" without specifying which features were tested.

### Pitfall 4: Undocumented Bugs

**What goes wrong:** Issues found during audit but not properly recorded. Same bugs rediscovered later, or fixes prioritized incorrectly.

**Why it happens:** Rushing through audit, "I'll remember this," informal notes.

**How to avoid:**
- Use consistent bug report template (see below)
- Document immediately when found
- Include reproduction steps, expected vs actual
- Assign severity and priority

**Warning signs:** Bug list is a random collection of notes, no severity levels.

### Pitfall 5: Ignoring Service Worker Update Behavior

**What goes wrong:** Fix deployed but users stuck on cached broken version for 24+ hours.

**Why it happens:** `registerType: 'autoUpdate'` assumed to handle everything. skipWaiting behavior not tested.

**How to avoid:**
- Test service worker update flow explicitly
- Verify update prompt appears (if using prompt strategy)
- Test that deployed fixes actually reach users
- Have manual "Check for Updates" option

**Warning signs:** "We deployed the fix" but user reports persist.

## Code Examples

### Bug Report Template

```markdown
## Bug: [Short Description]

**Severity**: Critical / High / Medium / Low
**Priority**: P1 / P2 / P3 / P4
**Device**: [Device + OS version]
**Browser**: [Browser + version]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happens]

**Console Errors**:
[Any JS errors]

**Screenshot/Recording**:
[If applicable]

**Notes**:
[Additional context]
```

### Severity/Priority Matrix

**Severity (Impact on User):**
| Level | Definition | Examples |
|-------|------------|----------|
| Critical | App unusable, data loss | Workout data lost, can't log in, crash on launch |
| High | Major feature broken | Can't complete workout, macros don't save |
| Medium | Feature partially broken | Weight chart doesn't display, achievement animation missing |
| Low | Minor issue, cosmetic | Typo, slight misalignment, color inconsistency |

**Priority (Business Urgency):**
| Level | Definition | Timeline |
|-------|------------|----------|
| P1 | Launch blocker | Fix before launch |
| P2 | High priority | Fix in first week |
| P3 | Normal priority | Fix when able |
| P4 | Low priority | Backlog |

**Combined Matrix:**
```
                Priority
             P1    P2    P3    P4
        ┌─────┬─────┬─────┬─────┐
Crit    │ NOW │ NOW │ DAY1│ WEEK│
        ├─────┼─────┼─────┼─────┤
High    │ NOW │ DAY1│ WEEK│ BKLOG│
Severity├─────┼─────┼─────┼─────┤
Med     │ DAY1│ WEEK│ BKLOG│BKLOG│
        ├─────┼─────┼─────┼─────┤
Low     │ WEEK│BKLOG│BKLOG│BKLOG│
        └─────┴─────┴─────┴─────┘

NOW = Fix immediately, launch blocked
DAY1 = Fix within first day
WEEK = Fix within first week
BKLOG = Add to backlog, fix later
```

### Lighthouse PWA Requirements Checklist

```markdown
## PWA Installation Requirements

- [ ] Serves over HTTPS (or localhost)
- [ ] Registers a service worker
- [ ] Has a web app manifest
- [ ] Manifest has name/short_name
- [ ] Manifest has icons (192x192 and 512x512)
- [ ] Manifest has start_url
- [ ] Manifest has display: standalone

## PWA Offline Requirements

- [ ] Service worker responds with 200 when offline
- [ ] start_url responds with 200 when offline
- [ ] Page has enough content when offline

## PWA Installability (Lighthouse)

- [ ] No browser errors logged to console
- [ ] Custom icon loads correctly
- [ ] Splash screen displays correctly
- [ ] Theme color for address bar set
- [ ] Content sized correctly for viewport
```

### Console Commands for Audit

```javascript
// Check all localStorage keys and sizes
Object.entries(localStorage).forEach(([key, val]) => {
  console.log(`${key}: ${(val.length * 2 / 1024).toFixed(2)} KB`);
});

// Check service worker status
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('SW Status:', reg ? reg.active?.state : 'Not registered');
});

// Check if running as installed PWA
const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
console.log('Running as PWA:', isStandalone);

// Check cache storage usage
caches.keys().then(names => {
  names.forEach(name => {
    caches.open(name).then(cache => {
      cache.keys().then(keys => {
        console.log(`Cache ${name}: ${keys.length} items`);
      });
    });
  });
});

// Force clear all caches (use with caution)
// caches.keys().then(names => names.forEach(n => caches.delete(n)));
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual PWA checklist | Lighthouse PWA audit | 2020+ | Automated, comprehensive |
| Console.log debugging | Browser DevTools Application tab | Always better | Purpose-built for SW/cache |
| Screenshot documentation | Video recording + detailed steps | Modern tooling | Better reproduction |
| Single device testing | Real device matrix | Modern practice | Catches platform-specific bugs |
| Ad-hoc bug tracking | Severity/Priority matrix | Best practice | Efficient triage |

**Deprecated/outdated:**
- Testing PWA only in Chrome (iOS Safari differences are significant)
- Assuming localStorage is reliable on iOS (7-day eviction rule)
- Relying solely on automated tests (manual UX testing still essential)

## Open Questions

1. **Sunday XP Claim Timing**
   - What we know: XP claim only available on Sunday
   - What's unclear: Timezone handling for users in different zones
   - Recommendation: Test claim flow, document current behavior, verify with timezone changes

2. **Streak Calculation at Midnight**
   - What we know: Streak logic exists in userStore with "Never Miss Twice" grace period
   - What's unclear: Exact timezone handling for midnight boundary
   - Recommendation: Test streak behavior at 11:59 PM and 12:01 AM

3. **Cloud Sync Conflict Resolution**
   - What we know: sync.ts shows cloud overwrites local on login
   - What's unclear: Behavior when same data modified on two devices
   - Recommendation: Test multi-device scenario, document current behavior

4. **Food API Fallback**
   - What we know: USDA API primary, Open Food Facts as fallback
   - What's unclear: Whether fallback actually triggers on rate limit
   - Recommendation: Force rate limit scenario, verify fallback works

## iOS Safari Specific Testing

iOS Safari has unique PWA limitations that require explicit testing:

### Critical iOS Differences

| Issue | Impact | Test Method |
|-------|--------|-------------|
| 50MB cache limit | App may fail to cache fully | Check cache sizes, test with DevTools |
| 7-day storage eviction | Data wiped if app unused 7 days | Document as limitation, can't fully test |
| No install prompt | Users won't discover PWA | Add manual install instructions UI |
| Storage isolation Safari <-> PWA | Different state in browser vs installed | Test both modes explicitly |
| No background sync | Sync only while app open | Aggressive foreground sync |
| Safe area insets | Content cut off by notch | Visual inspection on notch devices |

### iOS Detection and Handling

```typescript
// Detect iOS
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

// Show iOS-specific install prompt if not installed
if (isIOS && !isStandalone) {
  // Show "Add to Home Screen" instructions
}
```

## Sources

### Primary (HIGH confidence)
- Existing research files: `/Users/ejasper/code/trained-app/.planning/research/ARCHITECTURE.md` - comprehensive audit guide
- Existing research files: `/Users/ejasper/code/trained-app/.planning/research/PITFALLS.md` - launch day risks
- Codebase inspection: `vite.config.ts`, `App.tsx`, stores (`userStore.ts`, `workoutStore.ts`, `sync.ts`)
- [web.dev PWA Checklist](https://web.dev/articles/pwa-checklist) - official PWA requirements

### Secondary (MEDIUM confidence)
- [PWA iOS Limitations Guide - MagicBell](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) - iOS Safari specifics
- [PWA on iOS - Brainhub](https://brainhub.eu/library/pwa-on-ios) - iOS current status
- [Bug Severity and Priority Matrix - TestGrid](https://testgrid.io/blog/bug-severity-and-priority-in-testing/) - prioritization framework
- [BrowserStack Bug Priority Guide](https://www.browserstack.com/guide/bug-severity-vs-priority) - severity vs priority
- [How to Test PWA - Medium](https://medium.com/effective-developers/how-to-test-pwa-daa1a6eaf7bf) - PWA testing methodology

### Tertiary (LOW confidence - community sources)
- [Offline-first apps in 2025 - LogRocket](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/) - offline testing approaches
- [PWA Local Storage Strategies - SimiCart](https://simicart.com/blog/pwa-local-storage/) - storage patterns

## Metadata

**Confidence breakdown:**
- Audit methodology: HIGH - Based on codebase inspection and existing research files
- iOS/Android differences: HIGH - Well-documented in official sources and existing research
- Bug prioritization: HIGH - Industry standard frameworks, verified with multiple sources
- Offline testing: MEDIUM - Methodology clear, but edge cases app-specific

**Research date:** 2026-02-04
**Valid until:** 2026-03-04 (30 days - audit methodology is stable)
