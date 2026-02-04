# Pre-Launch PWA Audit Guide

> **Context**: React 18 + Vite + TypeScript PWA with offline-first architecture and Supabase sync
> **Goal**: Find issues before 90k users do
> **Timeline**: Launch this week

---

## Priority Order (What to Test First)

1. **Critical Path Testing** (1-2 hours) - Core user journey that MUST work
2. **PWA Installation** (30 min) - Installability on target devices
3. **Offline Mode** (1 hour) - Core offline functionality
4. **Data Persistence** (45 min) - Data survives restarts/updates
5. **Sync Integrity** (1 hour) - Cloud sync doesn't lose data
6. **Edge Cases** (1 hour) - Timezone, storage limits, network transitions

---

## 1. Critical Path Testing

### Full User Journey Checklist

Test the complete flow a new user experiences:

```
[ ] 1. Access code entry (AccessGate)
    - Enter valid code
    - Try invalid code (should fail gracefully)
    - Try used code (verify behavior)

[ ] 2. Authentication (Auth.tsx)
    - Sign up with new email
    - Sign in with existing account
    - Password reset flow
    - Test "forgot password" email delivery

[ ] 3. Onboarding (8 steps)
    - Name entry
    - Gender selection
    - Body stats (weight/height/age)
    - Fitness level selection
    - Training days + day selection
    - Goal selection
    - Avatar reveal animation

[ ] 4. Home Screen (Home.tsx)
    - Daily quests display correctly
    - Streak display accurate
    - Reminder cards show when expected
    - Motivational message appears

[ ] 5. Workout Flow (Workouts.tsx)
    - Start scheduled workout
    - Log sets with weight/reps
    - Complete workout
    - End workout early (partial completion)
    - Quick/minimal workout logging
    - Exercise customization persists

[ ] 6. Macro Tracking (Macros.tsx)
    - Quick log macros
    - Food search API works
    - Save meal flow
    - Use saved meal
    - Delete logged meal
    - Daily totals calculate correctly

[ ] 7. Check-in Flow (CheckInModal.tsx)
    - Complete daily check-in
    - XP awarded correctly
    - Streak updates

[ ] 8. Weekly XP Claim (Sunday only)
    - XP claim modal appears on Sunday
    - XP transfers to permanent total
    - Level-up celebration works

[ ] 9. Settings (Settings.tsx)
    - Weight logging
    - Weight chart displays (needs 2+ entries)
    - Data export downloads JSON
    - Data import restores state
    - Sign out works
```

### Commands to Run

```bash
# Build and preview production build
npm run build && npm run preview

# Run existing tests
npm run test:run

# Type checking
npx tsc --noEmit

# Lint check
npm run lint
```

---

## 2. Device/Browser Test Matrix

### Minimum Viable Matrix (Time-Boxed)

| Priority | Device | Browser | Reason |
|----------|--------|---------|--------|
| HIGH | iPhone 14+ | Safari | Largest PWA user segment |
| HIGH | Android (Pixel/Samsung) | Chrome | Second largest segment |
| MEDIUM | iPad | Safari | Tablet users |
| MEDIUM | MacOS | Chrome/Safari | Desktop fallback |
| LOW | Windows | Chrome/Edge | Desktop fallback |

### Specific Test Points Per Device

**iOS Safari (Critical)**
```
[ ] PWA installs via "Add to Home Screen"
[ ] App launches in standalone mode (no Safari UI)
[ ] Splash screen displays correctly
[ ] Touch targets are 44x44px minimum
[ ] No horizontal scroll on any screen
[ ] Safe area insets respected (notch devices)
[ ] Keyboard doesn't obscure input fields
[ ] Pull-to-refresh doesn't break navigation
```

**Android Chrome**
```
[ ] PWA install prompt appears
[ ] App installs to home screen
[ ] Splash screen and theme color correct
[ ] Back button behavior is correct
[ ] Notifications permission (if used)
```

### Responsive Breakpoints to Test

- 320px (iPhone SE)
- 375px (iPhone 12/13)
- 390px (iPhone 14/15)
- 428px (iPhone Pro Max)
- 768px (iPad portrait)
- 1024px (iPad landscape)

---

## 3. Offline Mode Testing

### Setup

1. Enable DevTools > Network > Offline
2. Or use airplane mode on device

### Test Scenarios

```
SCENARIO 1: Fresh Offline Start
[ ] App loads from cache when offline
[ ] Service worker serves all routes
[ ] No network error screens

SCENARIO 2: Offline Data Entry
[ ] Can log workout while offline
[ ] Can log macros while offline
[ ] Can complete check-in while offline
[ ] Toast shows "saved locally" (not error)

SCENARIO 3: Offline-to-Online Transition
[ ] App detects network return
[ ] Data syncs automatically
[ ] No duplicate entries created
[ ] User notified of sync completion

SCENARIO 4: Mid-Action Network Loss
[ ] Start workout online
[ ] Go offline during workout
[ ] Complete workout offline
[ ] Return online - workout syncs

SCENARIO 5: Food Search Offline
[ ] Food search shows appropriate message
[ ] Can still use saved meals
[ ] Can still quick-log macros
```

### Service Worker Verification

```bash
# Check service worker is registered
# In Chrome DevTools > Application > Service Workers

# Verify cached assets
# In Chrome DevTools > Application > Cache Storage
```

### Workbox Configuration Check

From `vite.config.ts`, the app uses:
- `registerType: 'autoUpdate'`
- Cached patterns: `**/*.{js,css,html,ico,png,svg,woff2}`

---

## 4. Data Persistence Testing

### LocalStorage Keys to Verify

The app uses Zustand persist with these storage keys:
- `gamify-gains-user` (profile, weight history)
- `gamify-gains-macros` (targets, daily logs, saved meals)
- `gamify-gains-workouts` (plan, logs, customizations)
- `gamify-gains-xp` (XP state)
- `gamify-gains-access` (access code validation)

### Persistence Test Scenarios

```
SCENARIO 1: Basic Persistence
[ ] Log workout, close app, reopen - workout still there
[ ] Log macros, force close app, reopen - macros still there
[ ] Complete onboarding, clear browser tab, reopen - still onboarded

SCENARIO 2: App Update Simulation
[ ] Have data in app
[ ] Clear service worker cache (DevTools > Application > Clear Storage, keep localStorage)
[ ] Reload - data should survive

SCENARIO 3: Browser Storage Pressure
[ ] Fill localStorage to 4.5MB+ with other sites
[ ] App should still work
[ ] Check for "quota exceeded" errors in console

SCENARIO 4: Cross-Device Login
[ ] Create account on device A
[ ] Log data on device A
[ ] Login on device B
[ ] Verify data synced from cloud
```

### Storage Size Check

```javascript
// Run in console to check current storage usage
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

---

## 5. Data Sync Testing

### Known Sync Limitations

From `sync.ts` analysis:

1. **Weight history merge incomplete** - Line 145 notes `setWeightHistory` method missing
2. **One-way sync dominant** - Cloud overwrites local on login
3. **No offline queue** - Failed syncs aren't retried automatically

### Safe Sync Testing (Without Losing Data)

**Option A: Test Account**
```
1. Create a fresh test account (test+[timestamp]@yourdomain.com)
2. Complete onboarding with test data
3. Log workout/macros
4. Test sync scenarios
5. Delete test account when done
```

**Option B: Data Export First**
```
1. Export data via Settings > Data Management > Export
2. Save JSON file safely
3. Run sync tests
4. If needed, restore via Import
```

### Sync Test Scenarios

```
SCENARIO 1: Initial Sync After Signup
[ ] Complete onboarding
[ ] Data syncs to Supabase
[ ] Verify in Supabase dashboard

SCENARIO 2: Login From Fresh Device
[ ] Clear localStorage (use ?reset=true URL param)
[ ] Login with existing account
[ ] Profile data loads from cloud
[ ] Workout history loads from cloud

SCENARIO 3: Conflict Resolution
[ ] Log data on Device A (offline)
[ ] Log different data on Device B (online)
[ ] Bring Device A online
[ ] Verify no data loss

SCENARIO 4: Partial Network Failure
[ ] Start sync
[ ] Kill network mid-sync
[ ] Restore network
[ ] Verify data integrity
```

---

## 6. Edge Case Testing

### Timezone Issues

```
SCENARIO 1: Date Boundary
[ ] Log workout at 11:55 PM
[ ] Verify it's recorded on correct date
[ ] Check "today's workout" logic at midnight

SCENARIO 2: Timezone Change (travel)
[ ] Set device to PST, log workout
[ ] Change device to EST
[ ] Verify workout still appears on correct date
[ ] Verify streak not broken incorrectly

SCENARIO 3: Streak at Midnight
[ ] Test streak calculation at 11:59 PM
[ ] Test streak calculation at 12:01 AM
[ ] Verify "Never Miss Twice" grace period works
```

### Network Edge Cases

```
[ ] Slow 3G network (DevTools throttling)
[ ] Intermittent connection (toggle WiFi rapidly)
[ ] VPN connection
[ ] Network change during use (WiFi to cellular)
```

### Storage Edge Cases

```
[ ] User with 1 year of data (heavy localStorage)
[ ] Import corrupt/malformed JSON
[ ] Import JSON from older app version
[ ] Export on one device, import on another
```

### Input Validation Edge Cases

```
[ ] Weight: 0 lbs (should reject)
[ ] Weight: 9999 lbs (should reject)
[ ] Age: 0 (should reject)
[ ] Age: 150 (should reject)
[ ] Negative values for macros
[ ] Special characters in meal names
[ ] Very long meal names (100+ chars)
[ ] Empty required fields
```

### Day-of-Week Edge Cases

```
[ ] Sunday XP claim timing
[ ] Mid-week signup (workout sequence)
[ ] Changing workout days mid-week
[ ] Skip days in workout schedule
```

---

## 7. Automated Checks

### Lighthouse Audit

```bash
# Run Lighthouse CLI
npx lighthouse https://your-app.vercel.app --view

# Or run via Chrome DevTools > Lighthouse tab
# Check these scores:
# - Performance: Target 90+
# - Accessibility: Target 90+
# - Best Practices: Target 90+
# - SEO: Target 90+
# - PWA: All checks pass
```

### Lighthouse PWA Checklist

```
[ ] Registers a service worker
[ ] Responds with 200 when offline
[ ] Has a `<meta name="viewport">` tag
[ ] Contains installability criteria
[ ] Configured for custom splash screen
[ ] Sets a theme color for address bar
[ ] Content sized correctly for viewport
[ ] Has a manifest with proper icons
```

### Bundle Analysis

```bash
# Check bundle size
npm run build
npx vite-bundle-analyzer dist/stats.html

# Target: Main bundle < 200KB gzipped
```

### Accessibility Audit

```bash
# Using axe-core
npx @axe-core/cli https://your-app.vercel.app

# Or use browser extension:
# - axe DevTools (Chrome)
# - WAVE (Chrome/Firefox)
```

### Security Headers Check

```bash
# Check security headers
curl -I https://your-app.vercel.app

# Should have:
# - Content-Security-Policy
# - X-Frame-Options
# - X-Content-Type-Options
# - Referrer-Policy
```

---

## 8. Quick Reference Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Production build
npm run preview                # Preview production build

# Testing
npm run test                   # Run tests in watch mode
npm run test:run               # Run tests once
npm run test:coverage          # Run with coverage

# Quality
npm run lint                   # ESLint check
npx tsc --noEmit              # TypeScript check

# PWA Testing
# Chrome DevTools > Application > Service Workers
# Chrome DevTools > Application > Manifest
# Chrome DevTools > Network > Offline checkbox

# Data Reset (USE CAREFULLY)
# Navigate to: https://your-app.vercel.app?reset=true
```

---

## 9. Known Issues to Verify Fixed

From `AUDIT.md` analysis:

| Issue | Status | Verify |
|-------|--------|--------|
| PWA icons missing | Fixed | Check `/public/pwa-*.png` files exist |
| Weight history merge incomplete | Known | Document as limitation |
| No input validation | Known | Add to tech debt backlog |
| No offline queue | Known | Document as limitation |

---

## 10. Pre-Launch Sign-Off Checklist

```
CRITICAL (Must Pass)
[ ] Full user journey completes without errors
[ ] PWA installs on iOS Safari
[ ] PWA installs on Android Chrome
[ ] App loads when offline (after first visit)
[ ] Data persists after app restart
[ ] No console errors in production build
[ ] Lighthouse PWA audit passes

HIGH (Should Pass)
[ ] Lighthouse Performance > 80
[ ] Lighthouse Accessibility > 80
[ ] All existing tests pass
[ ] TypeScript compiles without errors
[ ] ESLint passes

MEDIUM (Nice to Have)
[ ] Lighthouse Performance > 90
[ ] Lighthouse Accessibility > 90
[ ] Bundle size < 200KB gzipped
[ ] All edge cases documented
```

---

## Appendix: Quick Bug Report Template

When you find an issue, document it with:

```markdown
## Bug: [Short Description]

**Severity**: Critical / High / Medium / Low
**Device**: [Device + OS version]
**Browser**: [Browser + version]

**Steps to Reproduce**:
1.
2.
3.

**Expected**:
**Actual**:

**Console Errors**:
**Screenshot**:
```

---

*Generated: February 2026*
*App Version: 1.6.0*
