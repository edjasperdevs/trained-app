# Requirements: Trained v1.5 Native iOS App

**Defined:** 2026-02-21
**Core Value:** The coach can manage every client's training from one place -- programs, macros, check-ins -- and clients see their personalized plans without friction

## v1.5 Requirements

Wrap the existing PWA with Capacitor and ship to the iOS App Store, adding real push notifications for reminders and coach actions, native haptics, native share, and App Store compliance.

### Capacitor Shell

- [ ] **SHELL-01**: App runs in a native iOS WebView (WKWebView) via Capacitor with no browser chrome visible
- [ ] **SHELL-02**: Service worker is disabled for native builds while remaining active for web PWA builds
- [ ] **SHELL-03**: Web and native builds are produced from the same codebase via separate build commands
- [ ] **SHELL-04**: All `window.confirm()` calls are replaced with native-compatible dialog (Capacitor Dialog plugin)
- [ ] **SHELL-05**: App detects background/foreground transitions via Capacitor App plugin

### Native Polish

- [ ] **NATIVE-01**: User feels Taptic Engine haptic feedback on iOS for all existing haptic trigger points (set completion, XP claim, achievements)
- [ ] **NATIVE-02**: User can export data via the native iOS share sheet instead of browser file download
- [ ] **NATIVE-03**: App displays a branded splash screen on launch matching the dark theme
- [ ] **NATIVE-04**: App icon renders correctly at all required iOS sizes (20pt through 1024pt)
- [ ] **NATIVE-05**: Status bar shows light text on dark background matching the app theme

### Push Notifications — Remote

- [ ] **PUSH-01**: App registers for push notifications and stores the APNs device token per user in Supabase
- [ ] **PUSH-02**: Client receives push notification when coach assigns a new workout
- [ ] **PUSH-03**: Client receives push notification when coach updates their macro targets
- [ ] **PUSH-04**: Client receives push notification when coach responds to their weekly check-in
- [ ] **PUSH-05**: App requests push permission at a contextual moment (not on first launch)
- [ ] **PUSH-06**: Push notifications are delivered via direct APNs HTTP/2 from a Supabase Edge Function (no Firebase)

### Push Notifications — Local

- [ ] **LOCAL-01**: User receives a daily check-in reminder at a configurable time
- [ ] **LOCAL-02**: User receives a workout reminder on training days at a configurable time
- [ ] **LOCAL-03**: User receives an evening macro logging reminder
- [ ] **LOCAL-04**: User receives a weekly XP claim reminder on Sundays
- [ ] **LOCAL-05**: User receives a weekly check-in submission reminder on Saturdays
- [ ] **LOCAL-06**: User can configure notification times and toggle each notification type on/off in Settings

### Deep Linking

- [ ] **DEEP-01**: Universal Links are configured so welltrained.fitness URLs open the app when installed
- [ ] **DEEP-02**: Tapping a push notification navigates to the relevant screen (workouts, macros, check-in)
- [ ] **DEEP-03**: Supabase auth redirects (password reset) work correctly in the Capacitor context

### App Store Compliance

- [ ] **STORE-01**: User can delete their account from within the app (Apple Guideline 5.1.1v)
- [ ] **STORE-02**: Privacy policy is accessible from within the app
- [ ] **STORE-03**: Privacy nutrition labels are accurately declared in App Store Connect
- [ ] **STORE-04**: App Store listing includes screenshots, description, and keywords
- [ ] **STORE-05**: App is distributed via TestFlight before App Store submission
- [ ] **STORE-06**: App passes Apple App Store review and is published

### Engagement

- [ ] **ENGAGE-01**: User receives a streak-at-risk push notification in the evening if they haven't checked in that day
- [ ] **ENGAGE-02**: App icon displays a badge count for pending actions (unread coach responses, pending check-ins)

## Future Requirements

### Push Enhancements

- **PUSH-07**: Coach receives push notification when a client submits their weekly check-in
- **PUSH-08**: Coach receives push notification when a client has been inactive for 3+ days
- **ENGAGE-03**: User receives a local notification when a new badge is earned
- **ENGAGE-04**: User receives a local notification on level-up

### Native Enhancements

- **NATIVE-06**: User can lock the app with Face ID / Touch ID
- **NATIVE-07**: App checks App Store for updates and prompts user to update
- **NATIVE-08**: Coach can see which clients have push notifications enabled

## Out of Scope

| Feature | Reason |
|---------|--------|
| Android / Play Store | iOS only for v1.5 — Android in future milestone |
| In-app purchases | Access code monetization via Lemon Squeezy avoids Apple 30% commission |
| HealthKit integration | High complexity, different data model, not needed for coaching workflow |
| Widget extensions | Requires native Swift development, separate milestone |
| Native tab bar rebuild | Existing web-based bottom navigation satisfies App Store guidelines |
| Firebase SDK | iOS-only app — direct APNs avoids unnecessary dependency |
| localStorage → SQLite migration | Current data fits within localStorage limits; premature optimization |
| Light mode | Dark-only aesthetic |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SHELL-01 | Phase 11 | Pending |
| SHELL-02 | Phase 11 | Pending |
| SHELL-03 | Phase 11 | Pending |
| SHELL-04 | Phase 11 | Pending |
| SHELL-05 | Phase 11 | Pending |
| NATIVE-01 | Phase 12 | Pending |
| NATIVE-02 | Phase 12 | Pending |
| NATIVE-03 | Phase 12 | Pending |
| NATIVE-04 | Phase 12 | Pending |
| NATIVE-05 | Phase 12 | Pending |
| DEEP-01 | Phase 13 | Pending |
| DEEP-03 | Phase 13 | Pending |
| PUSH-01 | Phase 14 | Pending |
| PUSH-02 | Phase 14 | Pending |
| PUSH-03 | Phase 14 | Pending |
| PUSH-04 | Phase 14 | Pending |
| PUSH-05 | Phase 14 | Pending |
| PUSH-06 | Phase 14 | Pending |
| DEEP-02 | Phase 14 | Pending |
| LOCAL-01 | Phase 15 | Pending |
| LOCAL-02 | Phase 15 | Pending |
| LOCAL-03 | Phase 15 | Pending |
| LOCAL-04 | Phase 15 | Pending |
| LOCAL-05 | Phase 15 | Pending |
| LOCAL-06 | Phase 15 | Pending |
| ENGAGE-01 | Phase 15 | Pending |
| ENGAGE-02 | Phase 15 | Pending |
| STORE-01 | Phase 16 | Pending |
| STORE-02 | Phase 16 | Pending |
| STORE-03 | Phase 16 | Pending |
| STORE-04 | Phase 16 | Pending |
| STORE-05 | Phase 16 | Pending |
| STORE-06 | Phase 16 | Pending |

**Coverage:**
- v1.5 requirements: 33 total
- Mapped to phases: 33
- Unmapped: 0

---
*Requirements defined: 2026-02-21*
*Last updated: 2026-02-21 after roadmap creation*
