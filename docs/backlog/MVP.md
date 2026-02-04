# MVP Launch Checklist

Target: Launch to ~90k followers as proof of concept

## Critical Path Items

### 1. Onboarding Polish
- [ ] Add progress indicator (step X of Y) to onboarding flow
- [ ] Implement "skip for now" options for non-essential steps
- [ ] Add input validation with clear error messages
- [ ] Test edge cases: back navigation, refresh mid-flow, network loss
- [ ] Add loading states during profile creation
- [ ] Ensure smooth transition from onboarding to home screen

### 2. Core Loop Hardening
- [ ] Workout logging: test all exercise types, custom exercises, history
- [ ] Macro tracking: verify food search API reliability, fallback for API failures
- [ ] XP claim ritual: ensure Sunday-only logic works across timezones
- [ ] Streak system: test grace period (safe word) edge cases
- [ ] Daily check-in: verify all XP calculations are accurate

### 3. PWA Installation Experience
- [ ] Test install prompts on iOS Safari, Android Chrome, desktop browsers
- [ ] Verify app icon appears correctly on home screen
- [ ] Test offline mode: full functionality without network
- [ ] Add "Add to Home Screen" nudge for first-time users
- [ ] Verify service worker caches critical assets

### 4. Performance Optimization
- [ ] Audit bundle size, code-split large components
- [ ] Lazy load non-critical screens (Achievements, Coach)
- [ ] Optimize images/assets for mobile
- [ ] Test on low-end devices (older iPhones, budget Androids)
- [ ] Verify smooth animations on 60fps target

### 5. Error Handling & Edge Cases
- [ ] Network failure states for all API calls
- [ ] Graceful degradation when Supabase is unreachable
- [ ] Handle localStorage quota exceeded
- [ ] Validate all user inputs server-side
- [ ] Add retry logic for failed syncs

### 6. Data Integrity
- [ ] Verify cloud sync doesn't overwrite newer local data
- [ ] Test data export/import functionality
- [ ] Add data backup reminder for users
- [ ] Ensure streak data persists correctly across sessions

### 7. Analytics & Monitoring
- [ ] Verify Sentry captures errors with useful context
- [ ] Add key funnel events: onboarding completion, first workout, first XP claim
- [ ] Monitor crash-free session rate
- [ ] Set up alerts for error spikes

### 8. Access & Authentication
- [ ] Test access code flow for new users
- [ ] Verify email/password auth edge cases
- [ ] Add password reset flow if missing
- [ ] Test session persistence across app restarts

## Polish Items

### Visual Consistency
- [ ] Audit all screens for theme consistency (Trained mode)
- [ ] Verify typography hierarchy is consistent
- [ ] Check color contrast for accessibility (WCAG AA)
- [ ] Test on various screen sizes (iPhone SE to iPad)

### Micro-interactions
- [ ] Add haptic feedback on key actions (if supported)
- [ ] Smooth loading skeletons for data-dependent screens
- [ ] Satisfying feedback on workout completion
- [ ] Badge unlock celebration feels rewarding

### Copy & Messaging
- [ ] Review all user-facing copy for Trained theme voice
- [ ] Ensure motivational messages feel authentic
- [ ] Error messages are helpful, not technical
- [ ] Empty states guide users to take action

## Launch Day Readiness

### Infrastructure
- [ ] Load test Supabase for expected user volume
- [ ] Verify rate limits on food search API
- [ ] Set up status page for incident communication
- [ ] Prepare rollback plan if critical issues found

### Support
- [ ] Create FAQ for common questions
- [ ] Set up feedback collection mechanism
- [ ] Prepare response templates for support requests
- [ ] Document known issues and workarounds

### Marketing Assets
- [ ] App Store-style screenshots
- [ ] Demo video showing core loop
- [ ] Social media preview cards (OG images)
