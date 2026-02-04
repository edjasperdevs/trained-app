# Launch Research Summary

**Project:** Trained App - Fitness Gamification PWA
**Domain:** PWA Launch Optimization (90k user target)
**Researched:** 2026-02-04
**Confidence:** HIGH

## Key Takeaways

1. **PWA optimization is critical** - Service worker caching strategy, runtime caching for Supabase, and custom install prompts will make or break the user experience for a PWA targeting fitness enthusiasts.

2. **Offline-first UX is table stakes** - Users expect workout logging to work in gym basements with no signal. The app must write locally first and sync later with visible sync status.

3. **Supabase scaling has known bottlenecks** - Connection pool exhaustion (200 pooler / 60 direct on Pro), RLS policy performance, and auth rate limiting are the top risks at 90k user scale.

4. **3 taps or fewer to log a set** - Friction in workout logging causes 40% abandonment. Previous workout values must be visible, rest timers auto-start, and plate calculator is expected.

5. **iOS Safari quirks will affect many users** - 50MB cache limit, 7-day storage eviction, no automatic install prompts, and storage isolation between Safari and PWA mode require specific handling.

6. **Service worker update strategy matters** - Using `autoUpdate` can trap users on broken versions. Need explicit update prompt with user control.

7. **Food API rate limiting is a real threat** - USDA API limits to 1,000/hour per IP. With 90k users searching food, must implement aggressive caching, debouncing, and fallback to Open Food Facts.

## Stack Recommendations

### PWA Infrastructure

**Service Worker Configuration:**
- Switch to `registerType: 'prompt'` instead of `autoUpdate` for safer updates
- Add runtime caching for Supabase API calls with NetworkFirst strategy
- Implement workbox-window for update notifications
- Set `cleanupOutdatedCaches: true` and `skipWaiting: true`

**Code Splitting:**
- Lazy load route components (Home, Workouts, Macros, etc.) to reduce initial bundle
- Manual vendor chunks: separate React, Zustand, Supabase, Framer Motion, and Lucide icons
- Use rollup-plugin-visualizer to analyze bundle (target <200KB gzipped main bundle)

**Performance Monitoring:**
- Add web-vitals library for LCP, FID, CLS tracking
- Target: LCP <2.5s, FID <100ms, CLS <0.1
- Use React DevTools Profiler to find unnecessary re-renders
- Send metrics to Plausible or Sentry for production monitoring

### Supabase Optimization

**Connection Management:**
- Verify using Supavisor transaction mode (port 6543) not session mode
- Set up connection pooling with appropriate pool size
- Contact Supabase support before launch for temporary limit increase if on Team/Enterprise

**RLS Policy Performance:**
- Add indexes on all columns used in RLS policies (user_id, etc.)
- Keep policies simple: `user_id = auth.uid()` not subqueries
- Run `EXPLAIN ANALYZE` on common queries to verify index usage
- Use Supabase Query Performance advisor

**Rate Limiting:**
- Enable CAPTCHA on auth endpoints to reduce abuse
- Implement client-side rate limiting with visual feedback
- Consider staggering launch announcement to spread signup load over hours

### Animation & UX

**Framer Motion Best Practices:**
- Use GPU-accelerated properties only (transform, opacity, scale) - avoid width/height
- Use `useMotionValue` and `useTransform` to prevent re-renders
- Keep exit animations under 200ms to avoid perceived slowness
- Implement `useReducedMotion` for accessibility

**Loading States:**
- Use react-loading-skeleton with shimmer placeholders matching content shape
- Apply skeleton loaders to all routes and heavy components
- Match skeleton colors to dark mode theme (baseColor="#1a1a2e")

## UX Priorities

### Critical Path (Must Work or Users Leave)

**Onboarding (60 seconds to first workout):**
- 8-step flow is acceptable IF each step is quick
- Consider "Skip registration" option to allow trying without account
- Goal-first approach (already implemented) is correct
- Progressive information collection (don't ask everything upfront)

**Workout Logging (3 taps or fewer):**
- Previous workout values must be visible (implements progressive overload tracking)
- Auto-starting rest timer when set is logged
- Plate calculator for barbell exercises
- Inline editing - no modal dialogs during active workout
- One-tap set completion with smart defaults

**Data Integrity:**
- Local-first write, cloud sync second (already implemented with Zustand persist)
- Sync status indicator (checkmark = synced, cloud with arrow = syncing, warning = offline)
- Conflict resolution with user choice when same workout logged on two devices
- Visible "saved locally" toast when offline, not errors

### Polish Details That Signal Quality

**Micro-interactions:**
- Set completion animation (scale-up + checkmark, <400ms)
- Streak flame animation on display
- PR celebration with confetti + haptic
- Weight increment suggestions ("+5 lbs from last time?")
- Haptic feedback: light on set completion, medium on workout finish, success on PR

**Empty States:**
- Never show blank screens
- "Your first workout is waiting" with 3 popular templates
- Show locked achievements with progress bars
- Stats screens show sample chart preview when no data

**Error Handling:**
- Network failure during workout: "No worries - your workout is saved locally"
- Sync conflict: "Keep this version or the other?" with both visible
- Invalid weight entry: "That weight seems off - did you mean 135 lbs?"
- Failed load: "[Retry] [Work out offline]" with countdown to auto-retry

**Form Validation:**
- Validate on field exit, not on type
- Inline errors below field
- Green checkmark when field is valid
- Smart suggestions ("Did you mean gmail.com?")

### Typography & Accessibility

- Primary numbers (weight, reps): Large, bold, high contrast - readable at arm's length
- Touch targets: Minimum 44x44pt (Apple Watch complaint about small targets)
- Dark mode with high contrast for dim gym lighting
- Support reduced motion preferences

## Audit Approach

### Pre-Launch Testing Matrix

**Critical Path Testing (1-2 hours):**
1. Access code entry → Auth → 8-step onboarding → Home screen
2. Start workout → Log sets → Complete/end early → Verify persistence
3. Macro tracking: Quick log → Search food → Save meal → Use saved meal
4. Check-in flow → XP award → Streak update
5. Weekly XP claim (Sunday) → Level-up celebration

**Device/Browser Matrix:**
- HIGH: iPhone 14+ Safari, Android Chrome
- MEDIUM: iPad Safari, macOS Chrome/Safari
- Test responsive breakpoints: 320px, 375px, 390px, 428px, 768px, 1024px

**Offline Mode Testing:**
- Fresh offline start (app loads from cache)
- Offline data entry (workout, macros, check-in)
- Offline-to-online transition (auto-sync without duplicates)
- Mid-action network loss (start online, go offline, complete, sync)

**Data Persistence:**
- Close app, reopen - data survives
- App update simulation (clear SW cache, keep localStorage)
- Cross-device login (create on device A, login on device B)
- LocalStorage usage check (should be reasonable, not approaching quota)

**iOS Safari Specific:**
- PWA installs via "Add to Home Screen"
- Launches in standalone mode without Safari UI
- Splash screen displays correctly
- Safe area insets respected (notch devices)
- No horizontal scroll on any screen

### Automated Checks

**Lighthouse Audit:**
- Performance: Target 90+
- Accessibility: Target 90+
- Best Practices: Target 90+
- PWA: All checks must pass
- Commands: `npx lighthouse https://your-app.com --view`

**Bundle Analysis:**
```bash
npm run build
# Add rollup-plugin-visualizer to vite.config.ts
# Opens stats.html with treemap visualization
```

**Accessibility:**
```bash
npx @axe-core/cli https://your-app.com
# Or use axe DevTools Chrome extension
```

**Web Vitals:**
```bash
npm install web-vitals@4
# Add reportWebVitals() to track LCP, FID, CLS, FCP, TTFB
```

### Pre-Launch Sign-Off Checklist

**CRITICAL (Must Pass):**
- [ ] Full user journey completes without errors
- [ ] PWA installs on iOS Safari
- [ ] PWA installs on Android Chrome
- [ ] App loads when offline (after first visit)
- [ ] Data persists after app restart
- [ ] No console errors in production build
- [ ] Lighthouse PWA audit passes

**HIGH (Should Pass):**
- [ ] Lighthouse Performance > 80
- [ ] Lighthouse Accessibility > 80
- [ ] All existing tests pass
- [ ] TypeScript compiles without errors
- [ ] Can complete first workout in under 60 seconds

**UX Verification:**
- [ ] Previous workout values visible when logging
- [ ] Rest timers start automatically
- [ ] Plate calculator for barbell exercises
- [ ] Empty states are helpful, not blank
- [ ] Error messages explain how to fix the problem
- [ ] Haptic feedback on set completion
- [ ] Touch targets at least 44x44pt

## Risk Mitigation

### Critical Risks (Immediate Action Required)

**1. Supabase Connection Pool Exhaustion**
- **Risk:** 90k users exhaust connection pool within minutes, causing 500 errors
- **Warning Signs:** `FATAL: too many connections` in logs, API timeouts
- **Prevention:**
  - Check plan limits NOW (Pro: 200 pooler / 60 direct)
  - Use Supavisor transaction mode (port 6543)
  - Contact Supabase support for temporary limit increase before launch
  - Set up alerts at 70% and 90% of max connections
- **Recovery:** Restart database (brief pause), disable Realtime temporarily, reduce sync frequency

**2. Service Worker Traps Users on Broken Version**
- **Risk:** Deploy broken code, deploy fix, users still see broken version for 24+ hours
- **Warning Signs:** Bug reports for issues already fixed, "refreshed but still broken"
- **Prevention:**
  - Switch to `registerType: 'prompt'` for user-controlled updates
  - Implement update banner with "Update Now" button
  - Add "Check for Updates" in Settings for manual refresh
  - Set `Cache-Control: no-cache` on sw.js in vercel.json
- **Recovery:** Post manual cache clear instructions on social media, deploy unregister script as nuclear option

**3. Food API Rate Limiting**
- **Risk:** USDA API limits to 1,000/hour, users can't log meals
- **Warning Signs:** HTTP 429 responses, "can't find foods" reports
- **Prevention:**
  - Implement aggressive client-side caching in localStorage
  - Debounce search requests (300ms after user stops typing)
  - Verify Open Food Facts fallback actually works
  - Get real USDA API key (not DEMO_KEY)
  - Implement exponential backoff with retry logic
- **Recovery:** Switch to Open Food Facts entirely, enable offline food search from cache

### High Risks (Monitor Closely)

**4. iOS Safari Storage Eviction**
- **Risk:** iOS wipes data after 7 days of non-use
- **Warning Signs:** iOS users report "lost all my progress"
- **Prevention:**
  - Notify users to open app weekly
  - Sync aggressively to cloud while app is in foreground
  - Show iOS-specific install instructions
- **Recovery:** Restore from cloud sync if available, communicate limitation clearly

**5. RLS Policy Performance Degradation**
- **Risk:** Unoptimized policies add 100-500ms per query under load
- **Warning Signs:** Queries slow in production vs dev, CPU spikes on database
- **Prevention:**
  - Add indexes on all RLS policy columns (user_id, etc.)
  - Keep policies simple: `user_id = auth.uid()` not subqueries
  - Run `EXPLAIN ANALYZE` on common queries
- **Recovery:** Add missing indexes immediately, simplify complex policies

**6. Auth Rate Limiting**
- **Risk:** 90k simultaneous signups hit auth endpoint limits
- **Warning Signs:** `429 Too Many Requests`, users can't sign up
- **Prevention:**
  - Enable CAPTCHA on signup/signin
  - Implement client-side rate limiting with visual feedback
  - Stagger launch announcement over hours, not one tweet
  - Contact Supabase for temporary limit increase
- **Recovery:** Temporarily disable signup (signin only), add "high demand" message, implement waiting room

### Moderate Risks (Be Aware)

**7. Race Conditions in XP/Level Updates**
- **Risk:** Simultaneous XP awards cause inconsistent state
- **Prevention:** Use PostgreSQL atomic operations, create function for XP updates
- **Recovery:** Write migration script to fix data, run during low-traffic window

**8. LocalStorage Corruption**
- **Risk:** Browser storage limits or iOS behavior corrupts data
- **Prevention:** Add version/timestamp to stored data, validate on load, sync critical data immediately
- **Recovery:** Sync from cloud or prompt user to import backup

**9. PWA Install Prompt Doesn't Appear**
- **Risk:** Users don't discover PWA installation
- **Prevention:** Add manual "Install" instructions, test install flow on iOS and Android
- **Recovery:** Educate users via in-app messaging and social media

## Action Items

### Immediate (Before Launch)

**1. Service Worker Updates**
- [ ] Switch `vite.config.ts` to `registerType: 'prompt'`
- [ ] Add workbox-window update detection
- [ ] Create PWAUpdateBanner component
- [ ] Add "Check for Updates" button in Settings
- [ ] Verify vercel.json has `Cache-Control: no-cache` on sw.js

**2. Supabase Preparation**
- [ ] Run `EXPLAIN ANALYZE` on common queries (profiles, workout_logs, macro_logs)
- [ ] Add indexes on user_id columns if missing
- [ ] Verify using Supavisor transaction mode (port 6543)
- [ ] Contact Supabase support for launch day support and temp limit increase
- [ ] Set up dashboard alerts (70%/90% connections, query time >500ms, auth errors >5%)

**3. Bundle Optimization**
- [ ] Install rollup-plugin-visualizer
- [ ] Run bundle analysis, target <200KB gzipped
- [ ] Convert route imports to lazy loading (Home, Workouts, Macros, etc.)
- [ ] Add manual vendor chunks in vite.config.ts
- [ ] Verify Lucide icons use named imports (tree-shakeable)

**4. Food API Resilience**
- [ ] Get real USDA API key (not DEMO_KEY)
- [ ] Implement client-side caching for food search results
- [ ] Add 300ms debounce to search input
- [ ] Test Open Food Facts fallback works
- [ ] Add exponential backoff with retry logic

**5. Monitoring Setup**
- [ ] Install web-vitals library
- [ ] Add reportWebVitals() tracking
- [ ] Verify Sentry is capturing errors with launch-specific tags
- [ ] Set up Plausible events for critical flows (auth, onboarding, first workout)
- [ ] Create health check function for status monitoring

### High Priority (Launch Week)

**6. Performance Audit**
- [ ] Run Lighthouse audit on production build
- [ ] Target: Performance 90+, Accessibility 90+, PWA pass
- [ ] Run React DevTools Profiler to find unnecessary re-renders
- [ ] Test with slow 3G throttling

**7. Device Testing**
- [ ] Test full user journey on iPhone 14+ Safari
- [ ] Test full user journey on Android Chrome
- [ ] Test PWA installation flow on both platforms
- [ ] Test offline mode on both platforms
- [ ] Verify touch targets are 44x44pt minimum
- [ ] Test responsive breakpoints (320px, 375px, 390px, 428px)

**8. UX Polish**
- [ ] Add loading skeletons to all major screens
- [ ] Implement haptic feedback on set completion
- [ ] Add set completion animation (<400ms)
- [ ] Verify empty states are helpful
- [ ] Test error messages explain how to fix issue

**9. Data Integrity**
- [ ] Test cross-device login (create on device A, login on device B)
- [ ] Test offline data entry then sync
- [ ] Test conflict resolution when same workout on two devices
- [ ] Verify localStorage doesn't corrupt on quota pressure
- [ ] Test data export/import flow

### Launch Day Monitoring

**10. First Hour (Launch Spike)**
- [ ] Watch Supabase connection count (should not exceed 80% of limit)
- [ ] Monitor auth signup success rate (should be >95%)
- [ ] Check Sentry error rate (baseline vs spike)
- [ ] Verify service worker registration success

**11. Hours 1-4 (Peak Load)**
- [ ] Monitor database query latency (P95 should be <1s)
- [ ] Watch for food API rate limiting
- [ ] Check for localStorage quota errors
- [ ] Verify sync operations completing

**12. Hours 4-12 (Sustained Traffic)**
- [ ] Monitor Supabase memory and CPU usage
- [ ] Check service worker cache sizes
- [ ] Track user session retention
- [ ] Verify achievement/XP calculations accurate

**13. Hours 12-24 (Cool Down)**
- [ ] Check sync completion rates
- [ ] Monitor return user login success
- [ ] Verify data consistency between devices
- [ ] Ensure hot fixes reach users via service worker updates

### Post-Launch (Week 1-2)

**14. Gather User Feedback**
- [ ] Monitor social media mentions for issues
- [ ] Track Sentry errors for patterns
- [ ] Review Plausible funnel for drop-offs
- [ ] Collect user feedback on onboarding experience

**15. Iterative Improvements**
- [ ] Add image lazy loading for avatars/badges
- [ ] Implement virtualization for long workout history lists
- [ ] Add web vitals monitoring to dashboard
- [ ] Consider React Compiler (requires React 19)

### Recovery Playbook Reference

**Connection Exhaustion:** Check dashboard → Restart database → Contact support → Disable Realtime → Reduce sync frequency

**Auth Overload:** Check auth logs → Enable CAPTCHA → Add "high demand" message → Disable signup temporarily → Request rate limit increase

**PWA Update Emergency:** Deploy fix with new SW version → Post manual cache clear instructions → Send push notification → Nuclear option: deploy unregister-sw.js

**Data Integrity Crisis:** DO NOT make hasty changes → Take database snapshot → Identify scope → Write migration script → Test on staging → Deploy during low-traffic window

**Food API Down:** Verify it's API not code → Activate Open Food Facts fallback → Add message about limited search → Enable offline search from cache → Allow manual entry

---

**Sources:** Compiled from STACK.md (PWA optimization techniques), FEATURES.md (UX patterns research), ARCHITECTURE.md (audit guide), PITFALLS.md (launch day risks)

*Research completed: 2026-02-04*
*Ready for launch: pending action items*
