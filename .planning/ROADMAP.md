# Roadmap: Trained

## Milestones

- v1.0 Launch Polish (Phases 1-5, shipped 2026-02-04)
- v1.1 Design Refresh (7 phases, shipped 2026-02-05)
- v1.2 Pre-Launch Confidence (4 phases, shipped 2026-02-07)
- v1.3 Coach Dashboard (Phases 1-6, shipped 2026-02-08)
- v1.4 Intake Dashboard (Phases 7-10, shipped 2026-02-21)
- **v1.5 Native iOS App** (Phases 11-16, in progress)

## v1.5 Native iOS App

**Milestone Goal:** Wrap the existing PWA with Capacitor and ship to the iOS App Store, adding real push notifications for coach actions and daily reminders, native haptics, native share, deep linking, and App Store compliance -- turning a web app into a credible native iOS product for 90k followers.

### Phases

- [x] **Phase 11: Capacitor Shell** - Working native iOS shell with WKWebView compatibility fixes (shipped 2026-02-22)
- [x] **Phase 12: Native Polish** - Haptics, share sheet, splash screen, app icon, status bar (shipped 2026-02-22)
- [x] **Phase 13: Deep Linking + Auth** - Universal Links and Supabase auth redirects in Capacitor (shipped 2026-02-22)
- [x] **Phase 14: Remote Push Notifications** - APNs infrastructure, coach-triggered pushes, tap navigation (shipped 2026-02-22)
- [x] **Phase 15: Local Notifications + Engagement** - Scheduled reminders, streak-at-risk, badge count (shipped 2026-02-22)
- [ ] **Phase 16: App Store Submission** - Compliance, TestFlight, App Store review and publish

## Phase Details

### Phase 11: Capacitor Shell
**Goal**: The existing React app runs inside a native iOS shell with no browser chrome, and all WKWebView-incompatible patterns are fixed
**Depends on**: Nothing (first phase of v1.5; builds on existing PWA codebase)
**Requirements**: SHELL-01, SHELL-02, SHELL-03, SHELL-04, SHELL-05
**Success Criteria** (what must be TRUE):
  1. App launches on an iOS device/simulator showing the full React app with no Safari browser chrome visible
  2. Service worker is inactive in the native build while remaining functional in the web PWA build deployed to Vercel
  3. Running `npm run build:web` produces the Vercel-deployed PWA and `npm run build:ios` (or equivalent) produces the Capacitor native build from the same codebase
  4. Every destructive confirmation dialog (delete account, clear data, etc.) uses native iOS dialog instead of browser `window.confirm()`
  5. App detects background/foreground transitions (e.g., logs or syncs on foreground resume)
**Plans:** 2 plans

Plans:
- [x] 11-01-PLAN.md -- Capacitor project setup, platform detection, service worker guard, iOS simulator build
- [x] 11-02-PLAN.md -- Dialog migration (10 window.confirm replacements) and native app lifecycle detection

### Phase 12: Native Polish
**Goal**: The app feels like a native iOS app -- real haptic feedback, native file sharing, branded launch experience, and correct status bar appearance
**Depends on**: Phase 11 (requires working Capacitor shell)
**Requirements**: NATIVE-01, NATIVE-02, NATIVE-03, NATIVE-04, NATIVE-05
**Success Criteria** (what must be TRUE):
  1. User feels Taptic Engine haptic feedback when completing a set, claiming XP, and unlocking achievements (all existing haptic trigger points)
  2. User can export data from Settings and the iOS share sheet appears with options to save, AirDrop, or send via Messages/Mail
  3. App displays a branded splash screen on cold launch with the dark theme aesthetic before the React app renders
  4. App icon appears correctly on the iOS home screen, in Settings, and in Spotlight search at all required sizes
  5. Status bar shows light text on the dark background, consistent with the app theme
**Plans:** 2 plans

Plans:
- [x] 12-01-PLAN.md -- Install Capacitor plugins, configure StatusBar + SplashScreen, replace haptics with @capacitor/haptics
- [x] 12-02-PLAN.md -- Generate branded icon + splash assets, fix storyboard background, implement native data export via share sheet

### Phase 13: Deep Linking + Auth
**Goal**: Universal Links route welltrained.fitness URLs into the app, and Supabase auth flows (password reset) work correctly in the Capacitor context
**Depends on**: Phase 11 (requires Capacitor App plugin for URL listening)
**Requirements**: DEEP-01, DEEP-03
**Success Criteria** (what must be TRUE):
  1. Tapping a welltrained.fitness link on an iOS device with the app installed opens the app instead of Safari
  2. User can complete a password reset flow initiated from within the app -- the email link returns to the app (not Safari) and the password is successfully changed
**Plans:** 1 plan

Plans:
- [x] 13-01-PLAN.md -- Universal Links infrastructure (AASA, Vercel config, Xcode entitlements) + deep link handler + password reset screen

### Phase 14: Remote Push Notifications
**Goal**: Clients receive real-time push notifications when the coach takes actions (assigns workout, updates macros, responds to check-in), delivered via direct APNs from Supabase
**Depends on**: Phase 13 (Universal Links needed for push tap deep navigation), Phase 11 (Capacitor shell)
**Requirements**: PUSH-01, PUSH-02, PUSH-03, PUSH-04, PUSH-05, PUSH-06, DEEP-02
**Success Criteria** (what must be TRUE):
  1. App prompts for push notification permission at a contextual moment (after first meaningful action, not on first launch) and registers the APNs token in Supabase
  2. Client receives a push notification on their locked iPhone when the coach assigns a new workout, updates their macros, or responds to their check-in
  3. All push notifications are sent via direct APNs HTTP/2 from a Supabase Edge Function with no Firebase dependency
  4. Tapping a push notification opens the app and navigates to the relevant screen (Workouts for assignment, Macros for update, Home for check-in response)
  5. Push notifications display correctly when the app is in foreground, background, and terminated states
**Plans:** 3 plans

Plans:
- [x] 14-01-PLAN.md -- Client-side push infrastructure (plugin, iOS config, device_tokens migration, push.ts module, sign-out cleanup)
- [x] 14-02-PLAN.md -- Server-side APNs Edge Function (JWT helper, send-push webhook handler with coach-action filtering)
- [x] 14-03-PLAN.md -- Integration and verification (wire into App.tsx, contextual permission, end-to-end checkpoint)

### Phase 15: Local Notifications + Engagement
**Goal**: Users receive configurable daily and weekly reminder notifications, streak protection alerts, and see a badge count for pending actions
**Depends on**: Phase 14 (push permission infrastructure and notification handling already established)
**Requirements**: LOCAL-01, LOCAL-02, LOCAL-03, LOCAL-04, LOCAL-05, LOCAL-06, ENGAGE-01, ENGAGE-02
**Success Criteria** (what must be TRUE):
  1. User receives local push reminders for daily check-in, workout days, and evening macro logging at their configured times
  2. User receives weekly reminders for XP claim (Sundays) and check-in submission (Saturdays)
  3. User can configure notification times and toggle each notification type on/off from the Settings screen
  4. User receives a streak-at-risk push notification in the evening if they have not checked in that day
  5. App icon badge on the home screen shows the count of pending actions (unread coach responses, pending check-ins)
**Plans:** 2 plans (2/2 complete)

Plans:
- [x] 15-01-PLAN.md -- Install plugins, create notification scheduling + badge modules, extend reminders store with time preferences
- [x] 15-02-PLAN.md -- Settings UI for push notification configuration, App.tsx lifecycle wiring, remove badge from remote push

### Phase 16: App Store Submission
**Goal**: The app is published on the iOS App Store, having passed Apple review with all compliance requirements met
**Depends on**: Phases 11-15 (all features must be working before submission)
**Requirements**: STORE-01, STORE-02, STORE-03, STORE-04, STORE-05, STORE-06
**Success Criteria** (what must be TRUE):
  1. User can delete their account from within the app (Settings) and all associated data is removed
  2. User can access the privacy policy from within the app without leaving to a browser
  3. App is available on TestFlight for beta testing before App Store submission
  4. App Store listing includes screenshots, description, keywords, and privacy nutrition labels
  5. App is live on the iOS App Store and downloadable by any iOS user
**Plans**: TBD

Plans:
- [ ] 16-01: TBD
- [ ] 16-02: TBD

## Progress

**Execution Order:** 11 -> 12 -> 13 -> 14 -> 15 -> 16

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 11. Capacitor Shell | v1.5 | 2/2 | ✓ Complete | 2026-02-22 |
| 12. Native Polish | v1.5 | 2/2 | ✓ Complete | 2026-02-22 |
| 13. Deep Linking + Auth | v1.5 | 1/1 | ✓ Complete | 2026-02-22 |
| 14. Remote Push Notifications | v1.5 | 3/3 | ✓ Complete | 2026-02-22 |
| 15. Local Notifications + Engagement | v1.5 | 2/2 | ✓ Complete | 2026-02-22 |
| 16. App Store Submission | v1.5 | 0/TBD | Not started | - |
