# WellTrained — Feature Brief
## Weekly Protocol Report + Referral System ("Recruit a Sub")

**Version:** 1.0  
**Codebase:** `https://github.com/edjasperdevs/trained-app`  
**Design reference:** `screen_weekly_report.png`, `screen_referral.png`  
**Read alongside:** `CLAUDE.md`, `welltrained_design_spec.md`

---

## Part 1 — Weekly Protocol Report

### What It Is

A full-screen summary that appears every Sunday evening, triggered by a push notification. It surfaces the user's week in one glance — DP earned, compliance rate, streak, workouts completed, rank progress, and auto-generated highlights. It ends with a share button that produces a share card (see `social_sharing_brief.md`).

This is the single highest-retention feature in the app. Apps that send meaningful weekly summaries retain users at 2–3x the rate of apps that don't.

---

### Data Sources

All data already exists in the stores. No new backend required.

| Stat | Source | Store |
|---|---|---|
| DP earned this week | Sum `dailyLogs` for Mon–Sun | `dpStore` |
| Compliance rate | Days with ≥1 DP action / 7 | `dpStore.dailyLogs` |
| Obedience streak | `obedienceStreak` | `dpStore` |
| Current rank name | `getRankInfo().name` | `dpStore` |
| DP to next rank | `getRankInfo().dpForNext` | `dpStore` |
| Rank progress % | `getRankInfo().progress` | `dpStore` |
| Workouts completed | Count `workoutStore.completedWorkouts` for week | `workoutStore` |
| Week number | Count weeks since `userStore.profile.createdAt` | `userStore` |
| Highlights | Auto-generated from above data (see logic below) | Multiple |

---

### Highlights Auto-Generation Logic

Generate 2–4 highlight strings from the following priority order. Stop when you have 3.

```typescript
const highlights: string[] = []

// 1. Protein compliance
const proteinDays = weekLogs.filter(l => l.protein >= 1).length
if (proteinDays >= 5) highlights.push(`Protein goal hit ${proteinDays} of 7 days`)
else if (proteinDays >= 3) highlights.push(`Protein logged ${proteinDays} days this week`)

// 2. PR detection
const prs = workoutStore.getWeeklyPRs() // returns array of { exercise, weight }
if (prs.length > 0) highlights.push(`New PR: ${prs[0].exercise} ${prs[0].weight} lbs`)

// 3. Streak milestones
const streak = dpStore.obedienceStreak
if ([7, 14, 21, 30, 60, 100].includes(streak)) {
  highlights.push(`${streak}-day streak achieved`)
} else if (streak > 0) {
  highlights.push(`${streak}-day obedience streak active`)
}

// 4. Full compliance week
if (complianceDays === 7) highlights.push('Perfect compliance week')

// 5. Rank-up this week
if (rankedUpThisWeek) highlights.push(`Ranked up to ${currentRankName}`)

// 6. Fallback
if (highlights.length === 0) highlights.push('Protocol active. Keep going.')
```

---

### New Component: `WeeklyProtocolReport.tsx`

Create as a full-screen modal (similar to `RankUpModal.tsx` pattern) or a dedicated route at `/weekly-report`.

**Props:**
```typescript
interface WeeklyProtocolReportProps {
  isOpen: boolean
  onClose: () => void
  weekData: WeeklyReportData
}

interface WeeklyReportData {
  weekNumber: number
  weekOf: string          // e.g. 'Mar 3 – Mar 9'
  dpEarned: number
  complianceDays: number  // 0–7
  streak: number
  workoutsCompleted: number
  rankName: string
  dpForNext: number
  rankProgress: number    // 0–1
  highlights: string[]
}
```

**Key UI elements:**
- Chain crown icon + `WEEKLY PROTOCOL REPORT` label at top
- `WEEK {n}` in large bold white display font
- Rank name in gold uppercase below
- 2×2 stat card grid (DP Earned, Compliance %, Streak, Workouts)
- Gold progress bar for rank progress with DP-to-next label
- Highlights list with gold dot bullets
- `SHARE YOUR PROTOCOL` gold CTA button (triggers share card from `social_sharing_brief.md`)
- `View Full Progress` text link navigates to `/progress`

---

### Triggering the Report

**Two triggers:**

**1. Push notification (Sunday 7pm, user's local time)**

Use the existing `notifications.ts` infrastructure. Schedule a local notification every Sunday at 19:00.

```typescript
// In notifications.ts — add to scheduleWeeklyNotifications():
await LocalNotifications.schedule({
  notifications: [{
    id: NOTIFICATION_IDS.WEEKLY_REPORT,
    title: 'Your Protocol Report is ready.',
    body: 'See how your week measured up.',
    schedule: {
      on: { weekday: 1, hour: 19, minute: 0 }, // Sunday = 1 in Capacitor
      repeats: true,
    },
  }]
})
```

Tapping the notification deep-links to `/weekly-report` via the existing `deep-link.ts` handler. Add `/weekly-report` to the `allowedPaths` array in `deep-link.ts`.

**2. In-app trigger (Sunday after first DP action)**

When the user opens the app on Sunday and has earned at least 1 DP this week, show the report automatically once per week. Gate with a `lastWeeklyReportShown` date field in `dpStore` or a new lightweight `reportStore`.

```typescript
// Check on app load (in App.tsx or Home.tsx useEffect):
const lastShown = localStorage.getItem('lastWeeklyReportShown')
const thisWeekMonday = getCurrentMonday() // already exists in useWeeklyCheckins
if (isSunday() && lastShown !== thisWeekMonday && weeklyDP > 0) {
  setShowWeeklyReport(true)
  localStorage.setItem('lastWeeklyReportShown', thisWeekMonday)
}
```

---

### Store Changes

Add one field to `dpStore` state (or use `localStorage` as shown above — either is acceptable):

```typescript
lastWeeklyReportDate: string | null  // ISO date of last Monday shown
```

No other store changes required. All data is computed at render time from existing stores.

---

### Reminders Store Update

Add `weeklyReport` to the `NotificationPreferences` type in `remindersStore.ts`:

```typescript
weeklyReport: { enabled: boolean; time: NotificationTimePreference }
```

Default: enabled, Sunday 19:00. Expose in Settings under Notifications.

---

## Part 2 — Referral System ("Recruit a Sub")

### What It Is

A referral link system where each user gets a unique shareable URL. When someone signs up through that link, they receive 7 days of Premium free. When the referred user completes their first full week (7 days with at least 1 DP action), the referrer earns 100 DP.

The screen is accessible from Profile or Settings. The page name is **"Recruit a Sub"** — this is the correct WellTrained vocabulary.

---

### How the Link Works

Each user's referral link is:
```
https://welltrained.app/join/{CALLSIGN}-{SHORT_CODE}
```

Where `SHORT_CODE` is a 4-character alphanumeric hash of the user's Supabase `user_id`. This makes links human-readable and memorable while remaining unique.

```typescript
// In a new lib/referral.ts:
export function generateReferralCode(userId: string): string {
  // Simple deterministic hash — not cryptographic, just unique enough
  const hash = userId.replace(/-/g, '').slice(0, 4).toUpperCase()
  return hash
}

export function getReferralLink(callsign: string, userId: string): string {
  const code = generateReferralCode(userId)
  return `https://welltrained.app/join/${callsign}-${code}`
}
```

---

### Database Schema

Add two new tables to Supabase. Add these to `database.types.ts` and create the migration in `supabase/migrations/`.

**`referrals` table:**
```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id),
  referred_id UUID REFERENCES auth.users(id),
  referral_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'signed_up' | 'completed'
  dp_awarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
```

**No new table needed for the referred user's free trial** — this is handled entirely by RevenueCat promotional entitlements (see below).

---

### Referral Flow — Step by Step

**Step 1: User A shares their link**
- User A opens "Recruit a Sub" screen
- Taps "Copy" or a share button
- Link is copied / shared via native share sheet
- A row is inserted into `referrals` with `referrer_id = User A`, `status = 'pending'`

**Step 2: User B taps the link**
- Deep link opens the app (or App Store if not installed)
- `referral_code` is extracted from the URL path
- Stored in `localStorage` as `pendingReferralCode` before auth
- User B completes onboarding normally

**Step 3: User B signs up**
- After `supabase.auth.signUp()` resolves, check `localStorage` for `pendingReferralCode`
- If found, update the `referrals` row: `referred_id = User B.id`, `status = 'signed_up'`
- Grant User B 7 days of Premium via RevenueCat promotional entitlement:
  ```typescript
  await Purchases.grantPromotionalEntitlement({
    entitlementIdentifier: 'premium',
    duration: INTRO_ELIGIBILITY_STATUS.INTRODUCTORY_PRICE, // 7 days
  })
  ```
- Clear `pendingReferralCode` from `localStorage`

**Step 4: User B completes their first week**
- A Supabase Edge Function (or client-side check) monitors User B's activity
- When User B has logged DP on 7 distinct calendar days, trigger completion:
  ```typescript
  // Supabase Edge Function: check-referral-completion
  // Runs daily via pg_cron or on each DP action via database trigger
  // If referred user has 7+ distinct DP log dates AND referral.status = 'signed_up':
  UPDATE referrals SET status = 'completed', completed_at = now() WHERE referred_id = $1
  ```
- Award 100 DP to the referrer:
  ```typescript
  // Client-side: on app load, check for completed referrals not yet DP-awarded
  const { data } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', userId)
    .eq('status', 'completed')
    .eq('dp_awarded', false)
  
  for (const referral of data) {
    useDPStore.getState().awardDP('training', 100) // or add 'referral' action type
    await supabase.from('referrals').update({ dp_awarded: true }).eq('id', referral.id)
  }
  ```
- Show a toast: `+100 DP — Your recruit completed their first week.`

---

### New Store: `referralStore.ts`

```typescript
interface ReferralState {
  recruits: Recruit[]
  totalDPEarned: number
  referralCode: string | null
  isLoading: boolean
  fetchRecruits: () => Promise<void>
  getReferralLink: () => string
}

interface Recruit {
  callsign: string
  rankName: string
  status: 'pending' | 'signed_up' | 'completed'
  dpAwarded: boolean
}
```

---

### New Screen: `RecruitASubScreen.tsx`

Route: `/recruit` (add to `allowedPaths` in `deep-link.ts`)

**UI elements (see `screen_referral.png`):**
- Back arrow + `RECRUIT A SUB` header + chain crown icon
- Hero card: chain crown icon, headline, subtext explaining the deal
- `YOUR PROTOCOL LINK` label + input field showing full URL + gold `COPY` button
- Three share buttons: Instagram, X (Twitter), Messages — each calls `Share.share()` with the referral link as the URL
- `YOUR RECRUITS` section — list of referred users with callsign, rank, and status badge
- `200 DP earned from recruits` total at bottom
- `SHARE YOUR PROTOCOL LINK` gold CTA button

**Callsign display:** Recruits are shown by callsign only — no real names, no photos. Privacy-first.

**Status badges:**
- `ACTIVE +100 DP` — gold badge, status = 'completed', dp_awarded = true
- `PENDING` — muted gray badge, status = 'pending' or 'signed_up'

---

### Deep Link Handling for Referral URLs

Add referral URL handling to `deep-link.ts`:

```typescript
// In handleDeepLink(), add before the allowedPaths check:
if (parsed.pathname.startsWith('/join/')) {
  const code = parsed.pathname.replace('/join/', '')
  if (code && /^[A-Z0-9-]+$/.test(code)) {
    localStorage.setItem('pendingReferralCode', code)
    navigate('/auth') // Send to sign-up
  }
  return
}
```

---

### Settings Integration

Add a "Recruit a Sub" row to the Settings screen under a new **"Protocol"** section:

```
PROTOCOL
  Recruit a Sub          →   (navigates to /recruit)
  Notifications          →
  Manage Subscription    →
```

---

### DP Action Type Addition

Add `referral` to the DP action types in `dpStore.ts` for clean logging:

```typescript
type DPAction = 'training' | 'protein' | 'meal' | 'steps' | 'sleep' 
  | 'share_workout' | 'share_compliance' | 'share_rankup'
  | 'referral'  // NEW — +100 DP, one per completed recruit
```

The `referral` action bypasses the standard daily cap and modifier system — it awards exactly 100 DP regardless of archetype.

---

## Implementation Order

### Weekly Protocol Report
1. Create `WeeklyProtocolReport.tsx` component with static mock data first — confirm layout renders correctly
2. Wire up live data from `dpStore`, `workoutStore`, `userStore`
3. Implement highlights auto-generation logic
4. Add Sunday in-app trigger in `Home.tsx` or `App.tsx`
5. Add push notification scheduling in `notifications.ts`
6. Add `/weekly-report` to `deep-link.ts` allowed paths
7. Add `weeklyReport` notification preference to `remindersStore.ts` and expose in Settings

### Referral System
1. Create `lib/referral.ts` with `generateReferralCode` and `getReferralLink`
2. Create Supabase migration for `referrals` table
3. Update `database.types.ts` with new table types
4. Create `referralStore.ts`
5. Create `RecruitASubScreen.tsx` with static mock data first
6. Wire up live `fetchRecruits()` from Supabase
7. Add referral deep link handling to `deep-link.ts`
8. Add pending referral code capture in `Auth.tsx` post-signup flow
9. Add RevenueCat promotional entitlement grant for referred users
10. Add `referral` DP action type to `dpStore.ts`
11. Add completion check on app load in `App.tsx`
12. Add "Recruit a Sub" entry to Settings screen

---

## Copy Reference

| Element | Text |
|---|---|
| Screen title | `RECRUIT A SUB` |
| Hero headline | `Bring someone into the Protocol.` |
| Hero subtext | `They get 7 days of Premium free. You get 100 DP when they complete their first week.` |
| Link label | `YOUR PROTOCOL LINK` |
| Recruits label | `YOUR RECRUITS` |
| DP total | `{n} DP earned from recruits` |
| CTA button | `SHARE YOUR PROTOCOL LINK` |
| Completion toast | `+100 DP — Your recruit completed their first week.` |
| Weekly report title | `WEEKLY PROTOCOL REPORT` |
| Report share button | `SHARE YOUR PROTOCOL` |
| Push notification title | `Your Protocol Report is ready.` |
| Push notification body | `See how your week measured up.` |
