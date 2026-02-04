# Launch Day Pitfalls: PWA Fitness App on Supabase

**Research Date:** 2026-02-04
**Context:** Fitness gamification PWA launching to 90k followers, Supabase backend, USDA Food API dependency

---

## Table of Contents

1. [Supabase Scaling Issues](#1-supabase-scaling-issues)
2. [Service Worker Update Problems](#2-service-worker-update-problems)
3. [API Rate Limiting](#3-api-rate-limiting)
4. [Data Integrity Under Load](#4-data-integrity-under-load)
5. [Mobile Browser Quirks](#5-mobile-browser-quirks)
6. [Pre-Launch Monitoring Setup](#6-pre-launch-monitoring-setup)
7. [First 24 Hours Watchlist](#7-first-24-hours-watchlist)
8. [Recovery Playbook](#8-recovery-playbook)

---

## 1. Supabase Scaling Issues

### 1.1 Connection Pool Exhaustion

**The Pitfall:**
Supabase uses two connection limits: a high limit for pooler clients (e.g., 200 on Nano plan) and a lower limit for actual PostgreSQL backend connections (e.g., 15-20 on Nano). When 90k users hit your app simultaneously, you'll exhaust connection pools within minutes.

**Warning Signs:**
- `FATAL: too many connections for role` errors in logs
- Supabase dashboard showing connection count at max
- API requests returning 500 errors intermittently
- Requests hanging then timing out after 30s

**Prevention:**
```
1. Check your plan's connection limits NOW:
   - Free: 60 pooler / 15 direct
   - Pro: 200 pooler / 60 direct
   - Team: 1500 pooler / 200 direct

2. Use Supavisor (transaction mode) on port 6543 instead of session mode:
   - Transaction mode releases connections after each query
   - Session mode holds connections for entire user session

3. Verify your Supabase client config:
   - Set `db.poolSize` appropriately
   - Enable connection retry logic

4. Contact Supabase support BEFORE launch if on Team/Enterprise:
   - Request temporary connection limit increase
   - Get guidance on your specific traffic patterns
```

**Supabase Config Check:**
```typescript
// In your supabase.ts - verify you're using pooler
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL; // Should be your-project.supabase.co
// NOT the direct connection string
```

### 1.2 Row Level Security (RLS) Performance

**The Pitfall:**
RLS policies execute on EVERY query. A policy like `auth.uid() IN (SELECT user_id FROM team_members)` runs a subquery per row scanned. With 90k users querying profiles, macros, and workouts, unoptimized RLS can add 100-500ms per query.

**Warning Signs:**
- Queries that return quickly in development take 2-5 seconds in production
- Dashboard shows high average query time
- Users report "stuck" loading states
- CPU utilization spikes on database

**Prevention:**
```sql
-- BAD: Forces scan of entire team_members table per row
CREATE POLICY "users_own_data" ON profiles
FOR SELECT USING (auth.uid() IN (SELECT user_id FROM team_members));

-- GOOD: Index-friendly, uses equality check
CREATE POLICY "users_own_data" ON profiles
FOR SELECT USING (user_id = auth.uid());

-- Add indexes on RLS columns
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_workout_logs_user_id ON workout_logs(user_id);
CREATE INDEX idx_macro_logs_user_id ON daily_macro_logs(user_id);
```

**Pre-Launch Checklist:**
1. Run `EXPLAIN ANALYZE` on your most common queries WITH RLS enabled
2. Check that all columns used in RLS policies are indexed
3. Use Supabase Query Performance advisor in dashboard

### 1.3 Realtime Subscription Limits

**The Pitfall:**
If you're using Supabase Realtime for live updates, each concurrent connection counts toward limits. Free plan: 200 peak connections. Pro: 500. Realtime also has message throughput limits that can disconnect clients.

**Warning Signs:**
- WebSocket errors in browser console
- Realtime messages: "too many concurrent connections"
- Users see stale data despite making changes
- Realtime subscriptions silently stop receiving updates

**Prevention:**
```
1. Audit Realtime usage - do you NEED it for launch?
   - Your app uses offline-first with localStorage
   - Consider disabling Realtime entirely for launch day

2. If Realtime is required:
   - Implement exponential backoff for reconnection
   - Use channel multiplexing (one channel per user, not per feature)
   - Set up client-side connection state monitoring
```

### 1.4 Edge Functions Cold Starts

**The Pitfall:**
If using Supabase Edge Functions, cold starts can add 400-600ms latency. During traffic spikes, many functions may be cold simultaneously.

**Warning Signs:**
- First requests after idle periods are slow
- P99 latency spikes significantly higher than P50
- Users report intermittent slowness

**Prevention:**
```
1. Recent Supabase improvements reduced cold starts to ~42ms average
2. Combine multiple actions into single Edge Functions to reduce cold starts
3. If critical, implement a "warmer" that pings functions every 5 minutes
4. Monitor cold start frequency in Supabase dashboard logs
```

### 1.5 Auth Rate Limiting

**The Pitfall:**
Supabase Auth has rate limits on signup, signin, and password reset endpoints. With 90k followers potentially signing up simultaneously, you'll hit limits within minutes.

**Warning Signs:**
- `429 Too Many Requests` errors on auth endpoints
- `AuthApiError: Rate limit exceeded` in client
- Users report "can't sign up" but no errors visible

**Prevention:**
```
1. Check your plan's auth rate limits in Supabase dashboard
2. Enable CAPTCHA protection on signup/signin to reduce abuse
3. Implement client-side rate limiting with visual feedback
4. Stagger launch announcement to spread signups over hours
5. Contact Supabase support for temporary limit increase before launch
```

---

## 2. Service Worker Update Problems

### 2.1 Users Stuck on Old Version

**The Pitfall:**
Service workers cache aggressively. After deploying a critical fix, users may continue seeing the old (broken) version for 24+ hours. Unlike web apps, you can't just tell users to "refresh" - service workers intercept refreshes.

**Warning Signs:**
- Users report seeing old UI after you've deployed fixes
- Bug reports for issues you've already fixed
- Support tickets mention "I refreshed but it's still broken"

**Prevention:**
```typescript
// vite.config.ts - Use 'prompt' strategy, not 'autoUpdate'
VitePWA({
  registerType: 'prompt',  // Shows update UI to users
  workbox: {
    clientsClaim: true,
    // Don't use skipWaiting: true - let users control updates
  }
})
```

```typescript
// Implement update prompt in your app
import { useRegisterSW } from 'virtual:pwa-register/react';

function App() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  return (
    <>
      {needRefresh && (
        <UpdatePrompt
          onUpdate={() => updateServiceWorker(true)}
          onDismiss={() => setNeedRefresh(false)}
        />
      )}
    </>
  );
}
```

### 2.2 skipWaiting() Not Working

**The Pitfall:**
When using `StaleWhileRevalidate` caching strategy, `skipWaiting()` may not activate the new service worker if there are pending network requests. The new SW waits until all requests complete.

**Warning Signs:**
- Service worker shows "waiting to activate" for extended periods
- Update dialog appears but clicking "Update" does nothing
- Users have to close ALL tabs to get the update

**Prevention:**
```typescript
// Force reload after skipWaiting succeeds
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting().then(() => {
      // Notify clients to reload
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage({ type: 'RELOAD' }));
      });
    });
  }
});
```

### 2.3 Cache Serving Broken Deployment

**The Pitfall:**
You deploy broken code, realize the mistake, and deploy a fix. But users who loaded the broken version have it cached. The service worker continues serving broken assets until the SW itself updates.

**Warning Signs:**
- Different users see different versions of your app
- "Works for me" syndrome - devs see fix, users don't
- JS errors in production that don't reproduce locally

**Prevention:**
```
1. Version your service worker file to force updates
2. Use cache-busting in asset filenames (Vite does this by default)
3. Set appropriate cache headers on sw.js:
   Cache-Control: no-cache, no-store, must-revalidate

4. In vercel.json (already configured):
   {
     "headers": [
       {
         "source": "/sw.js",
         "headers": [{"key": "Cache-Control", "value": "no-cache"}]
       }
     ]
   }
```

### 2.4 Manual Recovery Option

**Critical:** Always provide a way for users to force-refresh.

```typescript
// Add a visible "Check for Updates" button in Settings
const forceUpdate = async () => {
  // Clear service worker caches
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));

  // Unregister service worker
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map(r => r.unregister()));

  // Hard reload
  window.location.reload(true);
};
```

---

## 3. API Rate Limiting

### 3.1 USDA FoodData Central API

**The Pitfall:**
USDA API limits requests to 1,000 per hour per IP address. Since your PWA runs client-side, all users share your server's IP if using Edge Functions, or each user uses their own IP. With 90k users searching food, you'll hit limits fast.

**Warning Signs:**
- Food search returns errors intermittently
- HTTP 429 responses from api.nal.usda.gov
- Users report "can't find foods" but some searches work

**Prevention:**
```
1. Implement client-side caching:
   - Cache food search results in localStorage
   - Common foods should be searchable offline

2. Debounce search requests:
   - Wait 300ms after user stops typing before searching
   - Cancel pending requests when new search starts

3. Fallback to Open Food Facts:
   - Already configured in your foodApi.ts
   - Test that fallback actually works before launch

4. Consider upgrading USDA API key:
   - DEMO_KEY has stricter limits
   - Get a real API key from https://fdc.nal.usda.gov/api-key-signup.html
```

```typescript
// Implement exponential backoff for food API
const searchFoodWithRetry = async (query: string, retries = 3): Promise<Food[]> => {
  try {
    return await searchFood(query);
  } catch (error) {
    if (error.status === 429 && retries > 0) {
      await new Promise(r => setTimeout(r, 1000 * (4 - retries)));
      return searchFoodWithRetry(query, retries - 1);
    }
    // Fallback to Open Food Facts
    return searchFoodOpenFoodFacts(query);
  }
};
```

### 3.2 Supabase API Rate Limits

**The Pitfall:**
Supabase PostgREST API has per-second rate limits. Burst traffic from 90k users can trigger 429s even if overall traffic is acceptable.

**Warning Signs:**
- Intermittent 429 errors from Supabase
- Sync operations fail unpredictably
- Spiky traffic patterns in dashboard

**Prevention:**
```
1. Implement request queuing on client:
   - Don't fire 10 requests simultaneously
   - Queue and process sequentially for non-critical operations

2. Batch operations where possible:
   - Use Supabase RPC functions for multi-table updates
   - Insert multiple rows in single request

3. Use optimistic updates:
   - Update localStorage immediately
   - Sync to cloud in background
   - Your offline-first architecture already supports this
```

### 3.3 Lemon Squeezy License Validation

**The Pitfall:**
All 90k users validating license keys at once will hammer your validation endpoint.

**Warning Signs:**
- License validation fails intermittently
- Users can't access app despite valid licenses
- Lemon Squeezy API returns errors

**Prevention:**
```
1. Cache validation result in localStorage:
   - Store validation timestamp
   - Only re-validate every 24 hours or on explicit refresh

2. Implement graceful degradation:
   - If validation fails, allow cached valid state
   - Retry validation in background

3. Consider pre-validating:
   - If you have list of valid licenses, check locally first
```

---

## 4. Data Integrity Under Load

### 4.1 Race Conditions in XP/Level Updates

**The Pitfall:**
User completes workout, claims XP, and the app updates their level. But if two requests arrive simultaneously (e.g., workout completion + achievement unlock), you can get inconsistent state.

**Warning Signs:**
- Users report XP/level not updating correctly
- Duplicate XP awards visible in logs
- Level shown doesn't match XP amount

**Prevention:**
```sql
-- Use PostgreSQL atomic operations
-- Instead of: SELECT xp, UPDATE xp = xp + 100
-- Use: UPDATE user_xp SET total_xp = total_xp + 100 RETURNING total_xp, level

-- Create a function for atomic XP updates
CREATE OR REPLACE FUNCTION add_xp(p_user_id UUID, p_amount INT)
RETURNS TABLE(new_total INT, new_level INT) AS $$
  UPDATE user_xp
  SET total_xp = total_xp + p_amount,
      level = calculate_level(total_xp + p_amount)
  WHERE user_id = p_user_id
  RETURNING total_xp, level;
$$ LANGUAGE SQL;
```

### 4.2 Leaderboard/Streak Race Conditions

**The Pitfall:**
Multiple workout completions in quick succession can corrupt streak calculations or leaderboard rankings.

**Warning Signs:**
- Streak shows wrong count
- Leaderboard positions don't match actual XP
- Users report "lost" streaks

**Prevention:**
```
1. Use SELECT FOR UPDATE for critical reads:
   SELECT * FROM profiles WHERE user_id = $1 FOR UPDATE;
   -- Then update streak

2. Or use optimistic locking with version column:
   UPDATE profiles
   SET streak = streak + 1, version = version + 1
   WHERE user_id = $1 AND version = $expected_version;

3. For leaderboards, calculate rankings in SQL:
   SELECT user_id, total_xp,
          RANK() OVER (ORDER BY total_xp DESC) as rank
   FROM user_xp;
```

### 4.3 localStorage Corruption

**The Pitfall:**
Your app uses localStorage as source of truth. Concurrent tabs, browser storage limits, or iOS 7-day eviction can corrupt or lose data.

**Warning Signs:**
- Users report "lost all my progress"
- Data appears after refresh but disappears later
- Inconsistent state between tabs

**Prevention:**
```typescript
// 1. Add version/timestamp to stored data
const STORE_VERSION = 1;

// 2. Validate data on load
const loadStore = () => {
  const data = localStorage.getItem('user-store');
  if (!data) return defaultState;

  try {
    const parsed = JSON.parse(data);
    if (parsed.version !== STORE_VERSION) {
      // Migration logic
    }
    return parsed;
  } catch {
    // Corrupted - sync from cloud or use default
    return defaultState;
  }
};

// 3. Sync critical data to cloud immediately, not just on auth events
```

### 4.4 Sync Conflicts

**The Pitfall:**
User makes changes offline on phone, then makes different changes on tablet. When both sync, which wins?

**Warning Signs:**
- Data "reverts" to old values
- Changes made on one device don't appear on another
- Duplicate entries (e.g., two workout logs for same workout)

**Prevention:**
```
1. Your current strategy (local is source of truth) is safe but may lose cloud data
2. Add timestamp to all records for conflict detection
3. For critical data, implement last-write-wins with user notification
4. For workouts/meals, use unique IDs to detect duplicates
```

---

## 5. Mobile Browser Quirks

### 5.1 iOS Safari PWA Issues

**The Pitfall:**
iOS Safari has unique PWA limitations that differ from Chrome/Android. Your 90k followers likely include many iPhone users.

**Critical iOS Limitations:**

| Issue | Impact | Workaround |
|-------|--------|------------|
| 50MB cache limit | Large apps may fail to cache | Prioritize critical assets only |
| 7-day storage eviction | Data wiped if app unused for 7 days | Notify users to open app weekly, or use iCloud if applicable |
| No Add to Home Screen prompt | Users won't discover PWA installation | Add manual "Install" instructions in app |
| Storage not shared Safari <-> PWA | Login in Safari, but PWA is logged out | Show "Open in Safari" or re-auth flow |
| No background sync | Sync only works when app is open | Sync aggressively while app is in foreground |
| Push notifications require Home Screen install | Users who don't install miss notifications | Prompt users to install for full experience |

**Prevention:**
```typescript
// Detect iOS and show installation instructions
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;

if (isIOS && !isInStandaloneMode) {
  // Show iOS-specific install instructions
  showIOSInstallPrompt();
}
```

### 5.2 iOS Safari Session/Auth Issues

**The Pitfall:**
Safari's Intelligent Tracking Prevention (ITP) can interfere with auth tokens and session storage.

**Warning Signs:**
- Users get logged out randomly on iOS
- Auth state not persisting between sessions
- "Session expired" errors on iOS only

**Prevention:**
```
1. Use Supabase's built-in session handling (already configured)
2. Store auth state in localStorage, not cookies
3. Test specifically on iOS Safari before launch
4. Handle session expiry gracefully with re-auth flow
```

### 5.3 Android Chrome PWA Issues

**The Pitfall:**
Android Chrome is generally good for PWAs, but installation prompts can fail silently.

**Warning Signs:**
- Install prompt doesn't appear on Android
- App installs but icons are wrong size
- PWA doesn't work offline on Android

**Prevention:**
```
1. Verify manifest.json:
   - Icons must include 192x192 and 512x512 sizes
   - Icons must be PNG format
   - start_url must be correct

2. Test in Android Chrome before launch:
   - chrome://flags -> Bypass user engagement checks
   - Test install flow end-to-end

3. Ensure HTTPS is working correctly:
   - Invalid certs prevent PWA installation
```

### 5.4 Cross-Browser Testing Matrix

**Must test before launch:**

| Browser | Platform | Priority | Common Issues |
|---------|----------|----------|---------------|
| Safari | iOS 16+ | HIGH | Storage limits, ITP, no install prompt |
| Chrome | Android | HIGH | Install prompt timing |
| Safari | macOS | MEDIUM | Desktop PWA quirks |
| Chrome | Windows | MEDIUM | Less common for fitness apps |
| Firefox | Any | LOW | No PWA support (web app only) |

---

## 6. Pre-Launch Monitoring Setup

### 6.1 Supabase Dashboard Monitoring

**Set up these alerts in Supabase dashboard BEFORE launch:**

```
1. Database Connections:
   - Alert at 70% of max connections
   - Alert at 90% of max connections (critical)

2. Query Performance:
   - Alert if average query time > 500ms
   - Alert if any query > 5s

3. Auth:
   - Alert on auth error rate > 5%
   - Alert on rate limit hits

4. Storage/Bandwidth:
   - Alert at 80% of plan limits

5. Realtime (if using):
   - Alert on connection count spikes
   - Alert on message throughput limits
```

### 6.2 Sentry Configuration

**Verify Sentry is capturing the right errors:**

```typescript
// In src/lib/sentry.ts - ensure these are configured
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  tracesSampleRate: 0.1,  // 10% of transactions
  replaysSessionSampleRate: 0,  // No replay overhead normally
  replaysOnErrorSampleRate: 1.0,  // Full replay on errors

  // Add launch-specific tagging
  release: 'trained-app@launch',
  environment: 'production',

  beforeSend(event) {
    // Tag high-impact errors
    if (event.exception?.values?.some(e =>
      e.type?.includes('Supabase') ||
      e.type?.includes('Network')
    )) {
      event.tags = { ...event.tags, critical: 'true' };
    }
    return event;
  }
});
```

### 6.3 Client-Side Metrics

**Add these metrics to track launch health:**

```typescript
// Track critical user flows
const trackLaunchMetrics = {
  authSuccess: () => plausible('Auth Success'),
  authFailure: (error: string) => plausible('Auth Failure', { props: { error }}),
  onboardingComplete: () => plausible('Onboarding Complete'),
  firstWorkout: () => plausible('First Workout'),
  firstMeal: () => plausible('First Meal'),
  syncFailure: (error: string) => plausible('Sync Failure', { props: { error }}),
  foodSearchFailure: () => plausible('Food Search Failure'),
};
```

### 6.4 Health Check Endpoint

**Consider adding a simple health check:**

```typescript
// Edge function or simple status check
const healthCheck = async () => {
  const checks = {
    supabase: await checkSupabase(),
    foodApi: await checkFoodApi(),
    localStorage: checkLocalStorage(),
  };

  return {
    healthy: Object.values(checks).every(Boolean),
    checks
  };
};
```

---

## 7. First 24 Hours Watchlist

### Hour 0-1: Launch Spike

**Watch for:**
- [ ] Supabase connection count (should not exceed 80% of limit)
- [ ] Auth signup success rate (should be >95%)
- [ ] Sentry error rate (baseline vs spike)
- [ ] Service worker registration success

**Red flags:**
- Connection count maxed immediately
- Auth errors > 10%
- Flood of identical Sentry errors
- Reports of "app won't load"

### Hour 1-4: Peak Load

**Watch for:**
- [ ] Database query latency (P95 should be <1s)
- [ ] Food API rate limiting
- [ ] localStorage quota errors
- [ ] Sync failures

**Red flags:**
- Query latency climbing steadily
- Multiple "can't log food" reports
- iOS users reporting data loss
- Sync stuck in pending state

### Hour 4-12: Sustained Traffic

**Watch for:**
- [ ] Memory usage on Supabase
- [ ] Service worker cache sizes
- [ ] User session retention
- [ ] Achievement/XP calculation accuracy

**Red flags:**
- Database CPU > 80% sustained
- Users reporting wrong XP/level
- Cache eviction warnings
- Duplicate data entries

### Hour 12-24: Cool Down

**Watch for:**
- [ ] Successful sync completion rates
- [ ] Return user login success
- [ ] Data consistency between devices
- [ ] Service worker updates deploying correctly

**Red flags:**
- Users can't log back in
- Data different on web vs installed PWA
- Hot fixes not reaching users
- Persistent high error rate

---

## 8. Recovery Playbook

### 8.1 Supabase Connection Exhaustion

**Symptoms:** 500 errors, database timeouts, "too many connections"

**Immediate Actions:**
```
1. Check Supabase dashboard -> Database -> Connections
2. If at max, consider restarting database (pauses app briefly)
3. Contact Supabase support for emergency limit increase

Quick mitigations:
- Temporarily disable Realtime subscriptions
- Reduce sync frequency in app
- Enable aggressive client-side caching
```

**Recovery:**
```
1. Deploy update reducing connection usage
2. Switch to transaction pooling mode if using session mode
3. Add connection retry logic with exponential backoff
```

### 8.2 Auth Service Overload

**Symptoms:** Users can't sign up/in, rate limit errors

**Immediate Actions:**
```
1. Check Supabase dashboard -> Authentication -> Logs
2. Enable CAPTCHA if not already on
3. Add prominent "We're experiencing high demand" message

Quick mitigations:
- Temporarily disable signup, allow only signin
- Implement client-side queue for auth requests
- Stagger invite codes to reduce simultaneous signups
```

**Recovery:**
```
1. Request rate limit increase from Supabase
2. Implement auth request batching
3. Add waiting room UI for peak times
```

### 8.3 PWA Update Emergency

**Symptoms:** Users stuck on broken version, can't force update

**Immediate Actions:**
```
1. Deploy fix with new service worker version
2. Post instructions for manual cache clear on social media
3. Send push notification (if available) with update instructions

Nuclear option (use only if critical):
- Deploy unregister-sw.js that clears all caches
- Update index.html to load unregister script before app
```

**Recovery Script for Users:**
```
1. Open browser settings
2. Find site data for your-app.com
3. Clear all site data
4. Close all tabs/windows
5. Reopen app
```

### 8.4 Data Integrity Crisis

**Symptoms:** Users lost data, XP incorrect, duplicates appearing

**Immediate Actions:**
```
1. DO NOT make hasty database changes
2. Take database snapshot immediately
3. Identify scope: how many users affected?

Investigation:
- Check Supabase logs for failed transactions
- Look for race condition patterns in error logs
- Compare localStorage state vs cloud state for affected users
```

**Recovery:**
```
1. Write migration script to fix data
2. Test on staging with production data copy
3. Deploy during low-traffic window
4. Communicate transparently with affected users
```

### 8.5 Food API Down

**Symptoms:** Food search returning errors, users can't log meals

**Immediate Actions:**
```
1. Verify it's the API, not your code
2. Activate Open Food Facts fallback
3. Add prominent message about limited food search

Quick mitigations:
- Enable offline food search from cached results
- Surface recently used foods more prominently
- Allow manual calorie/macro entry
```

**Recovery:**
```
1. Implement redundant API sources
2. Build local food database from common items
3. Add better fallback UX
```

### 8.6 Emergency Contact List

**Have these ready:**
- Supabase support: https://supabase.com/support (Enterprise) or GitHub Discussions
- Vercel status: https://vercel-status.com
- Your team's incident channel
- Social media accounts for user communication

---

## Summary: Top 10 Things to Do Before Launch

1. **Test at 10x expected load** - Use load testing tools to simulate traffic spike
2. **Verify Supabase plan limits** - Know your connection and auth rate limits
3. **Add indexes for RLS policies** - Run EXPLAIN ANALYZE on common queries
4. **Implement service worker update prompt** - Users need a way to get updates
5. **Test iOS Safari specifically** - Many fitness users are on iPhone
6. **Set up monitoring dashboards** - Supabase, Sentry, Plausible all visible
7. **Prepare rollback procedures** - Know how to revert a bad deploy
8. **Cache food API responses** - Don't hit rate limits on day one
9. **Document recovery playbook** - Everyone knows what to do when things break
10. **Stagger announcement** - Don't tell all 90k followers at exactly the same moment

---

## Sources

### Supabase
- [Connection Management](https://supabase.com/docs/guides/database/connection-management)
- [Supavisor FAQ](https://supabase.com/docs/guides/troubleshooting/supavisor-faq-YyP5tI)
- [RLS Performance Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)
- [Realtime Limits](https://supabase.com/docs/guides/realtime/limits)
- [Auth Rate Limits](https://supabase.com/docs/guides/auth/rate-limits)
- [Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod)
- [Edge Functions Cold Starts](https://supabase.com/blog/persistent-storage-for-faster-edge-functions)

### PWA & Service Workers
- [Handling Service Worker Updates - web.dev](https://web.dev/learn/pwa/update)
- [Handling SW Updates with Immediacy - Chrome Developers](https://developer.chrome.com/docs/workbox/handling-service-worker-updates)
- [skipWaiting with StaleWhileRevalidate](https://allanchain.github.io/blog/post/pwa-skipwaiting/)
- [Taming PWA Cache Behavior](https://iinteractive.com/resources/blog/taming-pwa-cache-behavior)

### iOS PWA
- [PWA iOS Limitations Guide - MagicBell](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [PWA on iOS 2025 - Brainhub](https://brainhub.eu/library/pwa-on-ios)
- [iOS PWA Strategies - Scandiweb](https://scandiweb.com/blog/pwa-ios-strategies/)

### APIs
- [USDA FoodData Central API Guide](https://fdc.nal.usda.gov/api-guide/)
- [FatSecret Platform API](https://platform.fatsecret.com/platform-api)

### Database
- [Preventing Race Conditions with SELECT FOR UPDATE](https://on-systems.tech/blog/128-preventing-read-committed-sql-concurrency-errors/)
- [PostgreSQL Connection Pool Exhaustion - Production Outage Lessons](https://www.c-sharpcorner.com/article/postgresql-connection-pool-exhaustion-lessons-from-a-production-outage/)

---

*Research compiled: 2026-02-04*
