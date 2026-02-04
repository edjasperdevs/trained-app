# Codebase Concerns

**Analysis Date:** 2026-02-04

## Tech Debt

**Unsafe Type Casting in Sync:**
- Issue: Exercise data is cast as `unknown as Json` without validation, bypassing TypeScript type safety
- Files: `src/lib/sync.ts:282`
- Impact: JSON serialization errors or data corruption during cloud sync if exercise structure changes
- Fix approach: Create a proper type serializer for `Exercise[]` that validates structure before casting. Define explicit serialization/deserialization functions instead of force-casting.

**Incomplete Sync Logic:**
- Issue: `loadAllFromCloud()` only implements profile and weight logs sync, not macro logs or workouts
- Files: `src/lib/sync.ts:344-353`
- Impact: New cloud loads will miss macro history and workout data, causing data loss on reinstalls
- Fix approach: Implement `loadMacroLogsFromCloud()` and `loadWorkoutLogsFromCloud()` functions, then add them to the results object in `loadAllFromCloud()`

**Merge Strategy for Weight Data Unclear:**
- Issue: `loadWeightLogsFromCloud()` returns merged history but doesn't actually update the store
- Files: `src/lib/sync.ts:121-149`
- Comment in code: "Note: This requires adding a setWeightHistory method to userStore. For now, we'll just sync local to cloud"
- Impact: Cloud weight data is fetched but ignored, defeating cloud storage purpose
- Fix approach: Add `setWeightHistory` action to `src/stores/userStore.ts`, call it in sync flow

**Master Code Stored Insecurely:**
- Issue: Master access code (`VITE_MASTER_ACCESS_CODE`) is hardcoded in environment files
- Files: `.env.production.local` contains `VITE_MASTER_ACCESS_CODE="EARLYADOPTER\n"`
- Impact: Master code exposed in Git history and environment files (should never be committed)
- Fix approach: Remove from `.env.production.local`, use secure secret management service. Verify file not in Git history.

**Supabase Credentials Exposed:**
- Issue: Supabase anon keys and URLs are exposed in production environment file
- Files: `.env.production.local:26-27` contains full Supabase keys and URLs
- Impact: Credentials visible to anyone with repo access (though intended for public frontend)
- Fix approach: Ensure `.env.production.local` is in `.gitignore`. Use Vercel environment variables instead.

## Known Issues

**XP Calculation Not Atomic:**
- Issue: XP is calculated, logged, and awarded in separate operations without transaction
- Files: `src/screens/CheckInModal.tsx:75-80`, `src/stores/xpStore.ts`
- Problem: If sync fails after calculation but before storage, XP state gets out of sync with reality
- Workaround: No current workaround; users may need to manually claim XP again

**Streak Calculation Edge Case with Timezone:**
- Issue: Streak check uses `new Date().toISOString().split('T')[0]` for date, but user's local timezone is not considered
- Files: `src/lib/sync.ts:331`, `src/stores/userStore.ts`
- Problem: User in UTC-8 at 11 PM could check in, then at midnight it becomes next day, but streak might not count correctly
- Workaround: Check in logic should use user's local date, not UTC date

**Access Store Offline Fallback Too Permissive:**
- Issue: If Lemon Squeezy API is unreachable, app accepts any 8+ character code in fallback mode
- Files: `src/stores/accessStore.ts:109-121`
- Problem: Could allow unauthorized access if network is down or API is compromised
- Workaround: None; security depends on network availability

**Fire-and-Forget Deactivation Request:**
- Issue: License deactivation on sign-out is not awaited and errors are silently ignored
- Files: `src/stores/accessStore.ts:187-198`
- Problem: If deactivation fails, user's activation count isn't decremented on Lemon Squeezy, wasting activation slot
- Workaround: User can manually deactivate via Lemon Squeezy dashboard if needed

## Security Considerations

**Authentication not fully integrated:**
- Risk: Auth store syncs data automatically after signup/login, but logout doesn't clear sensitive local data
- Files: `src/stores/authStore.ts:111-115`
- Current mitigation: Zustand persist middleware stores to localStorage, which is cleared on logout, but this is implicit
- Recommendations:
  - Explicitly clear all user-specific stores on logout
  - Consider encrypting sensitive localStorage data at rest
  - Document that app works offline-first and local data persists even after logout

**PII in Error Tracking:**
- Risk: Error context passed to `captureError()` could contain user data
- Files: `src/lib/sentry.ts:71-80`
- Current mitigation: beforeSend hook removes email-like patterns, but not other PII
- Recommendations:
  - Add redaction for common PII patterns (phone, SSN, IP addresses)
  - Never log full request bodies or localStorage dumps
  - Audit all `captureError()` calls to verify context is sanitized

**Console Logging in Production:**
- Risk: Sync errors and auth issues are logged to console in production
- Files: `src/stores/authStore.ts:53,151`, `src/lib/sync.ts:340,351`, `src/stores/accessStore.ts:94,110,167`
- Current mitigation: Development checks exist for analytics and Sentry but not for general logging
- Recommendations:
  - Remove or gate console logs behind `import.meta.env.DEV` checks
  - Use structured logging instead of console.error

**License Keys in Console:**
- Risk: Master code and license key validation status logged to console
- Files: `src/stores/accessStore.ts:94,110`
- Current mitigation: None
- Recommendations:
  - Remove `console.log()` calls that log access state
  - Use Sentry to track validation attempts instead

## Performance Bottlenecks

**Large Zustand Stores with Multiple Features:**
- Problem: Each feature (workouts, macros, XP, avatar, achievements) is a separate Zustand store but they re-render dependents on any state change
- Files: `src/stores/` contains 9 stores with persist middleware
- Impact: CheckInModal imports 6 stores, WorkoutScreen imports 8 stores. Any state update causes re-renders.
- Improvement path:
  - Add selector hooks to Zustand stores to prevent unnecessary re-renders
  - Use `useShallow` or memoization for complex object comparisons
  - Consider combining related stores (achievements + badges) to reduce subscribers

**Food Search Debounce Not Cancelling:**
- Problem: Debounce cleanup only clears pending debounce, not in-flight API requests
- Files: `src/components/FoodSearch.tsx:29-61`
- Impact: Searching "carbs" quickly (c-a-r-b-s) fires 5 API requests, only last result displayed but all processed
- Improvement path: Add AbortController to cancel in-flight requests when new search starts

**Macro Calculation Called Per Component Render:**
- Problem: `calculateMacros()` in macroStore is called every time during onboarding without caching
- Files: `src/screens/Onboarding.tsx`, `src/stores/macroStore.ts`
- Impact: Complex TDEE calculation runs repeatedly as user types numbers
- Improvement path: Add `useMemo` hook to debounce calculation or cache with dependency array

**Weight History Not Indexed:**
- Problem: `getWeeklyWeightAverage()` and `getWeightTrend()` iterate entire history each time
- Files: `src/stores/userStore.ts:237,281,293`
- Impact: With 2+ years of daily weights (730+ entries), these linear scans are called frequently
- Improvement path: Build date-indexed map, pre-compute running averages, cache trend calculations

**Sync Operations Sequential:**
- Problem: `syncAllToCloud()` loops through workouts sequentially, awaiting each upsert
- Files: `src/lib/sync.ts:335-338`
- Impact: Syncing 10 workouts = 10 sequential network round-trips (~5-10 seconds on 3G)
- Improvement path: Use `Promise.all()` or batch upserts to parallel operations

## Fragile Areas

**Workout State Machine:**
- Files: `src/stores/workoutStore.ts:600-612`, `src/screens/Workouts.tsx`
- Why fragile:
  - Multiple state transitions (start → log sets → complete/end early)
  - XP awarded flag must be set before marking complete
  - Minimal workout has different XP logic
  - Missing error handling if state is inconsistent
- Safe modification:
  - Add state validation function to check invariants before transitions
  - Add tests for all state transitions and edge cases
- Test coverage: Store has some tests (`src/stores/workoutStore.test.ts`) but UI integration not tested

**Streak Calculation Logic:**
- Files: `src/stores/userStore.ts:320-380`, `src/screens/CheckInModal.tsx:1-450`
- Why fragile:
  - Depends on exact date matching (timezone issues noted above)
  - Updates in multiple places (userStore, checkInModal, sync)
  - Streak pause feature adds edge case logic
  - Last check-in date comparison is vulnerable to time zone bugs
- Safe modification:
  - Consolidate streak logic into single function in userStore
  - Add comprehensive test suite for timezone edge cases
  - Document the date format and timezone assumptions
- Test coverage: No dedicated streak tests

**Avatar Evolution Logic:**
- Files: `src/stores/avatarStore.ts:140-160`, `src/screens/AvatarScreen.tsx`
- Why fragile:
  - XP thresholds hardcoded in multiple places
  - Stage progression tied to specific XP values
  - Evolution triggered from multiple screens (CheckInModal, XPClaimModal)
  - No validation that stage is within bounds (0-10)
- Safe modification:
  - Move XP thresholds to constants at top of file
  - Add state validation in updateEvolutionStage()
  - Create test suite for evolution progression
- Test coverage: Limited; no evolution progression tests

**License Validation Fallback:**
- Files: `src/stores/accessStore.ts:83-179`
- Why fragile:
  - Offline fallback allows any 8+ char code without validation
  - Network error handling silently succeeds if user previously validated
  - No mechanism to re-validate after network recovery
  - Test scenarios: offline validation, network recovery, expired keys
- Safe modification:
  - Add explicit "offline mode" state vs "failed validation" state
  - Store validation timestamp to know when to re-attempt
  - Add integration tests for network failure scenarios
- Test coverage: No tests for accessStore validation logic

## Scaling Limits

**localStorage Not Suitable for Large Datasets:**
- Current capacity: ~5-10MB per domain (varies by browser)
- Current usage: Each Zustand store persists to localStorage via persist middleware
- At scale with 2+ years of data:
  - Workout logs: 365+ entries × ~5KB = ~1.8MB
  - Macro logs: 365+ entries × ~2KB = ~0.7MB
  - Weight history: 730+ entries × ~0.1KB = ~0.07MB
  - Total with other stores: ~3-4MB (approaching limits)
- Scaling path:
  - Move historical data to IndexedDB for better capacity
  - Keep recent data (last 90 days) in localStorage for speed
  - Implement data archival strategy to cloud
  - Use data compression (e.g., delta encoding for daily weights)

**Supabase Realtime Not Implemented:**
- Current: Manual sync on login/signup only
- Problem: If user has account on two devices, changes on device A don't sync to device B until explicit action
- Scaling path:
  - Implement Supabase realtime subscriptions for profiles and daily data
  - Consider conflict resolution for concurrent edits
  - Add sync queue to handle offline changes

**No Pagination or Virtual Lists:**
- Problem: Workout history loads all logs into memory, no pagination
- Files: `src/screens/Workouts.tsx:50` loads last 10 via `getWorkoutHistory(10)` but this is hardcoded
- Impact: With 2+ years of daily workouts, loading more history could freeze UI
- Scaling path:
  - Implement pagination with lazy loading
  - Use virtual scrolling for long lists
  - Add filtering/search to reduce dataset

## Dependencies at Risk

**Framer Motion Bundle Size:**
- Package: `framer-motion` ^11.0.8
- Risk: Animation library is large (~40KB gzipped), used extensively in modals/transitions
- Impact: Every page transition and modal uses motion components
- Migration plan:
  - Audit which animations provide value vs. which are nice-to-have
  - Consider lightweight alternative (e.g., CSS transitions for simple fades)
  - Lazy-load Framer Motion only when modals are opened

**Lucide React Icon Dependency:**
- Package: `lucide-react` ^0.563.0
- Risk: Icon set is imported with specific icons scattered throughout codebase
- Impact: Icon selection is inconsistent, some icons imported but not used
- Maintenance path:
  - Consolidate icon imports to a central icon registry
  - Audit for unused icons
  - Consider sprite-based approach if icon count grows

**Lemon Squeezy API Coupling:**
- Risk: License validation tightly coupled to Lemon Squeezy API format and availability
- Impact: If Lemon Squeezy API breaks or is replaced, entire access system fails
- Migration plan:
  - Create abstract license validation interface
  - Implement adapters for different licensing providers
  - Add fallback to offline validation with server-side audit

**@sentry/react Production Dependency:**
- Risk: Sentry is included in production bundle even if unused
- Impact: ~20KB added to main bundle
- Maintenance path:
  - Lazy-load Sentry only if SENTRY_DSN is configured
  - Consider moving to dynamic import

## Test Coverage Gaps

**Store Integration Tests Missing:**
- Untested: Interactions between stores (e.g., CheckIn updating XP, Avatar, Achievements simultaneously)
- Files: `src/stores/` - only 3 stores have test files out of 9
- Risk: State inconsistency between stores could go unnoticed (e.g., XP logged but avatar not evolved)
- Priority: High
- Coverage: 67% of store files have tests (6 test files for 9 stores)

**UI Component Integration Tests Missing:**
- Untested: CheckInModal interaction with multiple stores
- Untested: Onboarding form validation and state transitions
- Untested: Workout session state machine (start → log → complete)
- Files: `src/screens/`, `src/components/` - minimal test files
- Risk: UI could submit invalid data to stores, UI could crash on unexpected state
- Priority: High
- Coverage: ~5 test files for 40+ component files

**Cloud Sync Edge Cases Not Tested:**
- Untested: Network failures during sync
- Untested: Conflict resolution when cloud data differs from local
- Untested: Sync recovery after connection restored
- Untested: Concurrent sync from multiple tabs
- Files: `src/lib/sync.ts` - no tests
- Risk: Silent data loss or corruption during sync
- Priority: High
- Coverage: 0% of sync.ts tested

**Error Path Testing:**
- Untested: API failures (food search, license validation)
- Untested: Invalid user input (negative weights, future dates)
- Untested: Store initialization without Supabase configured
- Files: Throughout stores and components
- Risk: App could crash or behave unexpectedly in error scenarios
- Priority: Medium
- Coverage: Basic happy-path tests exist, error paths mostly unhandled

**Timezone Edge Cases Not Tested:**
- Untested: User checking in near midnight
- Untested: User in UTC+12 vs UTC-12
- Untested: Daylight saving time transitions
- Files: `src/stores/userStore.ts:320-380`, `src/screens/CheckInModal.tsx`
- Risk: Streak breaks unexpectedly for users in certain timezones
- Priority: High
- Coverage: 0% of timezone logic tested

**Offline Mode Not Tested:**
- Untested: App behavior when Supabase is unreachable
- Untested: Access code validation without network
- Untested: Sync queue behavior
- Files: `src/stores/authStore.ts:138-165`, `src/stores/accessStore.ts`
- Risk: App could appear frozen or show confusing error states
- Priority: Medium

## Missing Critical Features

**Conflict Resolution for Multi-Device Sync:**
- Problem: No mechanism to resolve conflicts when same field is edited on two devices
- Example: User updates weight on phone, then on tablet with different value
- Blocks: Cloud sync reliability, multi-device support
- Suggestion: Implement last-write-wins or show merge dialog

**Data Deletion / Privacy:**
- Problem: No way for user to delete their account and associated data
- Blocks: GDPR compliance, user privacy
- Suggestion: Add account deletion flow that removes all Supabase records

**Data Export:**
- Problem: Analytics object has `dataExported()` event but no actual export functionality
- Blocks: Data portability, GDPR compliance
- Suggestion: Implement JSON export of all user data

**Offline Sync Queue:**
- Problem: Changes made while offline are synced on next connection, but no queue or retry logic
- Blocks: Reliable offline support
- Suggestion: Implement IndexedDB-backed sync queue with exponential backoff

**Weight Goal Tracking:**
- Problem: Code references `profile.goalWeight` but no UI to set or track progress to weight goal
- Blocks: Weight management feature completion
- Suggestion: Add goal weight input in settings, show progress bar

---

*Concerns audit: 2026-02-04*
