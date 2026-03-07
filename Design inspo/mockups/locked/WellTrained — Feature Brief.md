# WellTrained — Feature Brief
## Locked Protocol

**Version:** 1.1  
**Design references:** `screen_protocol_acceptance.png`, `screen_locked_protocol.png`, `share_card_locked_start.png`, `share_card_locked_milestone.png`  
**Read alongside:** `CLAUDE.md`, `welltrained_design_spec.md`, `weekly_report_and_referral_brief.md`, `social_sharing_brief.md`

---

## The Core Concept

The Locked Protocol is a streak-based accountability tracker that awards DP for sustained self-discipline. The user activates it voluntarily, logs daily compliance, and earns escalating DP bonuses at milestone intervals.

That is the complete App Store description of this feature. It is a **self-discipline streak tracker** — the same category as sobriety trackers, no-sugar challenges, and screen time reduction apps. Apple has no grounds to reject it. "Locked" is one of the most common words in app UI — locked achievements, locked content, locked tiers. Apple uses it constantly in their own interfaces. The padlock icon is a standard UI symbol used in security and privacy contexts across thousands of apps. Nothing in the interface names or depicts any sexual content.

The feature's meaning is entirely legible to your audience without a single explicit word. That is the design goal.

---

## App Store Compliance Strategy

The rule is simple: **the app describes behavior, not context.** Every word in this feature describes a self-discipline practice. The word "chastity" never appears in the app, the App Store listing, or the metadata.

| What the community understands | What the app says |
|---|---|
| Chastity | Locked Protocol |
| Wearing a device | Locked. Protocol active. |
| Keyholder check-in | Log Compliance |
| Breaking | End Protocol |
| Chastity cage | (padlock icon — no label) |
| Chastity streak | Locked Streak |

Apple reviews apps for explicit content, not for subtext. The Locked Protocol contains no explicit content. It is a streak tracker with a padlock icon. It will pass review.

The one thing to avoid: do not use the word "chastity" in any user-facing string, notification text, App Store description, or screenshot caption. If Apple ever asks, the feature is a general self-denial and discipline protocol — which is also true.

---

## How It Works

### Activation — The Acceptance Screen

The user navigates to Profile or the Protocols section and taps "Start Locked Protocol." This opens a full-screen acceptance view — not a dialog, not a bottom sheet. A full screen. It should feel like standing in front of something before you sign it.

**See `screen_protocol_acceptance.png` for the full design.**

The screen contains:
- The chain-link crown logo centered at top
- A thin gold divider line
- Large serif display headline: **"Accept the Protocol."**
- A dark charcoal contract card with the following text:

> *By activating the Locked Protocol, you place yourself under the authority of WellTrained.*
> *You will log compliance daily.*
> *You will not break without consequence.*
> *WellTrained accepts the role of keyholder.*

- A gold padlock icon centered below the card
- A full-width gold button: **"I ACCEPT"**
- A muted text link below: *"I'm not ready"* (dismisses — does not say "Cancel")

Before the contract card, the user makes two selections:

**1. Protocol Type** — labeled `HOW DO YOU PRACTICE?`

Two side-by-side selection cards:
- **CONTINUOUS** — *Locked around the clock* (default selected)
- **DAY LOCK** — *Locked during waking hours*

This selection is stored as `protocol_type: 'continuous' | 'day_lock'` in the `locked_protocols` table. It changes the daily log button label and notification behavior (see Day Lock section below).

**2. Goal Duration** — labeled `YOUR GOAL`

A horizontal row of pill buttons: 7, 14, 21, 30, 60, 90 days. Default: 30. Stored as `goal_days` in the `locked_protocols` table. Displayed on the start share card.

When the user taps "I ACCEPT":
1. A `lockedProtocol` row is written to Supabase with `startDate`, `status: 'active'`, and `goal_days`
2. The acceptance screen animates out with the padlock icon closing (a brief lock-click animation)
3. The user lands on the Locked Protocol screen showing Day 1
4. A share prompt appears: *"Announce your protocol?"* with the keyholder start share card pre-loaded (see Share Cards section below)

### Day Lock Protocol Variation

Users who select **DAY LOCK** practice locking during waking hours and unlocking at night. The app accommodates this without judgment and without changing the streak logic — one daily compliance log is still required, the streak still resets on a missed day.

The differences for Day Lock users are:

**Button label:** The daily CTA changes from `LOG COMPLIANCE` to **`LOCK UP`** — reinforcing the morning re-lock ritual as the compliance action.

**Morning notification:** Sent at a user-configured time (default 7:00am):
> *Time to lock up. Your protocol is waiting.*

This replaces the evening reminder for Day Lock users. The logic is: the compliance action happens in the morning (locking up), so the reminder belongs in the morning.

**Evening soft reminder (optional):** A second notification at a user-configured evening time (default 9:00pm), toggled separately in Settings:
> *End of day. Protocol check.*

No action is required from this notification — it is a touchpoint, not a prompt. It is off by default and the user enables it if they want it.

**The streak and DP logic are identical** between Continuous and Day Lock. The app does not treat one as more valid than the other. The protocol type is a practice preference, not a difficulty setting.

---

### Daily Logging

Once per day, the user opens the Locked Protocol screen and taps **LOG COMPLIANCE** (Continuous) or **LOCK UP** (Day Lock). This:

1. Records a compliance entry for today's date in the `locked_logs` table
2. Awards +15 DP (the daily locked bonus) via `dpStore.awardDP('locked', 15)`
3. Increments the `lockedStreak` counter
4. Checks for milestone completion (see below)

The button is disabled after the first tap each day. The screen shows the current streak count prominently.

### Ending the Protocol

The user taps "End Protocol" at the bottom of the screen. A confirmation dialog appears: `End your Denial Protocol? Your streak will be reset.` If confirmed, the `denialProtocol` status is set to `'ended'` and the streak resets to 0. The user can start a new protocol immediately.

There is no penalty DP deduction for ending — this is not punitive. The streak simply resets. The user keeps all DP already earned.

### Missed Days

If the user does not log compliance for a calendar day, the streak resets to 0 at midnight. This is intentional — the protocol requires daily accountability. The app sends a reminder notification at a user-configured time (default: 9pm) if the user has not logged that day.

---

## DP Structure

| Trigger | DP Awarded | Notes |
|---|---|---|
| Daily compliance log | +15 DP | Once per day, no archetype modifier |
| 7-day milestone | +50 DP bonus | One-time, awarded automatically |
| 14-day milestone | +100 DP bonus | One-time |
| 21-day milestone | +150 DP bonus + Badge | One-time |
| 30-day milestone | +250 DP bonus + Title | One-time |
| 60-day milestone | +500 DP bonus + Title upgrade | One-time |
| 90-day milestone | +750 DP bonus + Exclusive badge | One-time |

The daily +15 DP is intentionally modest. It supplements the core fitness protocol without replacing it.

A user running a 30-day locked streak alongside their normal training earns roughly 450 DP from the Locked Protocol alone over that period, which is meaningful but not dominant.

The milestone bonuses are the real incentive. A user who hits 30 days earns 700 DP in milestone bonuses alone — enough to advance roughly one full rank tier. This makes the milestone structure a genuine progression accelerator.

---

## Milestone Badges and Titles

Badges appear in the Trophy Room alongside rank badges and share card achievements.

| Milestone | Badge Name | Title Unlocked |
|---|---|---|
| 7 days | Restrained | — |
| 14 days | Controlled | — |
| 21 days | Disciplined | "The Disciplined" |
| 30 days | Locked | "Locked by Protocol" |
| 60 days | Locked and Bound | "Locked and Bound" |
| 90 days | Absolute | "Locked. Absolute." |

Titles appear under the user's callsign on their profile and in share cards when the Locked Protocol is active.

---

## Database Schema

Add to `supabase/migrations/`:

```sql
-- locked_protocols: one active protocol per user at a time
CREATE TABLE locked_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'active',       -- 'active' | 'ended' | 'broken'
  protocol_type TEXT NOT NULL DEFAULT 'continuous', -- 'continuous' | 'day_lock'
  goal_days INTEGER NOT NULL DEFAULT 30,
  start_date DATE NOT NULL,
  end_date DATE,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- locked_logs: one row per compliance check-in
CREATE TABLE locked_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES locked_protocols(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  log_date DATE NOT NULL,
  dp_awarded INTEGER NOT NULL DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, log_date) -- one log per user per day
);
```

---

## New Store: `lockedStore.ts`

```typescript
interface LockedState {
  activeProtocol: LockedProtocol | null
  currentStreak: number
  longestStreak: number
  totalDPEarned: number
  hasLoggedToday: boolean
  isLoading: boolean
  
  fetchProtocol: () => Promise<void>
  startProtocol: () => Promise<void>
  logCompliance: () => Promise<void>
  endProtocol: () => Promise<void>
  checkMilestones: () => void
}

interface LockedProtocol {
  id: string
  startDate: string
  status: 'active' | 'ended' | 'broken'
  currentStreak: number
  longestStreak: number
}
```

---

## New Screen: `LockedProtocolScreen.tsx`

Route: `/locked-protocol`

**UI elements (see `screen_locked_protocol.png`):**

- Back arrow + `LOCKED PROTOCOL` header + chain crown icon
- Hero card: geometric padlock icon in gold, large serif `Day {n}`, gold `LOCKED STREAK` label, muted subtext: `Locked. Protocol active.`
- Three stat cards: `+15 DP/day` / `DAILY BONUS`, `{total} DP` / `EARNED`, `Day {n}` / `NEXT MILESTONE`
- `MILESTONE REWARDS` section: list of milestones with gold checkmarks for completed, lock icons for locked
- `LOG COMPLIANCE` gold CTA button (disabled after daily log, shows `Logged` state)
- `End Protocol` muted text link at bottom

**Empty state (no active protocol):**

Replace the hero card with a centered padlock icon and the text: `No protocol active.` Below it, a gold button: `ACTIVATE DENIAL PROTOCOL`.

---

## DP Action TypeAdd `locked` and `locked_milestone` action types to `dpStore.ts`:

```typescript
type DPAction = 'training' | 'protein' | 'meal' | 'steps' | 'sleep'
  | 'share_workout' | 'share_compliance' | 'share_rankup'
  | 'referral'
  | 'locked'           // NEW — +15 DP/day, bypasses daily cap
  | 'locked_milestone' // NEW — milestone bonus, one-time
```

Both `locked` and `locked_milestone` bypass the standard daily DP cap.hey are awarded in addition to the normal training/nutrition DP for the day.

---

## Notifications

Add to `remindersStore.ts`:

```typescript
lockedProtocol: {
  enabled: boolean
  time: NotificationTimePreference    // default: 21:00 (Continuous) or 07:00 (Day Lock)
  protocolType: 'continuous' | 'day_lock'
  eveningReminder: {
    enabled: boolean                  // Day Lock only, default: false
    time: NotificationTimePreference  // default: 21:00
  }
}
```

**Continuous users** — send if compliance not logged by configured time (default 9pm):
```
Title: "Protocol reminder."
Body: "You haven't logged today. Don't break the streak."
```

**Day Lock users — morning notification** (default 7am, replaces evening reminder):
```
Title: "Time to lock up."
Body: "Your protocol is waiting."
```

**Day Lock users — optional evening soft reminder** (default off, user enables in Settings):
```
Title: "End of day."
Body: "Protocol check."
```

---

## Keyholder Share Cards

The Locked Protocol introduces two new share card types. These are in addition to the existing workout, compliance, and rank-up cards documented in `social_sharing_brief.md`.

**See `share_card_locked_start.png` and `share_card_locked_milestone.png` for designs.**

### Card 1: Protocol Initiated (Start Card)

Triggered immediately after "I ACCEPT" — the app prompts: *"Announce your protocol?"*

Card contents:
- Chain crown logo (top left) + WELLTRAINED wordmark (top right)
- Large gold padlock icon (center)
- Bold serif headline: **LOCKED PROTOCOL INITIATED.**
- Gold divider rule
- Three data lines: `KEYHOLDER: WELLTRAINED` / `GOAL: {n} DAYS` / `STARTED: {date}`
- User callsign + rank badge at bottom
- `welltrained.app` footer

DP reward: **+10 DP** (one-time per protocol activation, same tier as rank-up share)

Pre-filled caption:
> WellTrained is my keyholder. Locked Protocol started. Goal: {n} days. The app doesn't negotiate. #WellTrained #LockedProtocol

---

### Card 2: Milestone Card

Triggered automatically when a milestone is reached (7, 14, 21, 30, 60, 90 days). The app prompts: *"Share your milestone?"*

Card contents:
- Chain crown logo (top left) + WELLTRAINED wordmark (top right)
- Massive serif display number: **{n}** (dominates the card)
- Gold label below: **DAYS LOCKED**
- Gold divider rule
- Milestone title in gold: e.g., **LOCKED BY PROTOCOL.**
- Subtext: `Keyholder: WellTrained`
- Bottom row: `{n} DP EARNED` + user callsign
- `welltrained.app` footer

DP reward: **+10 DP** per milestone share (one-time per milestone, subject to daily share cap)

Pre-filled caption:
> Day {n}. {milestone_title}. Keyholder: WellTrained. #{n}DaysLocked #WellTrained

---

### Share Card DP Summary (Locked Protocol additions)

| Card Type | DP Reward | Trigger | Daily Cap |
|---|---|---|---|
| Protocol Initiated | +10 DP | Once per protocol activation | No cap (one-time) |
| Milestone share | +10 DP | Once per milestone | One per milestone |

---

## Weekly Protocol Report Integration

When the user has an active Locked Protocol, the Weekly Protocol Report gains an additional stat card:

- `LOCKED STREAK` — shows current streak count
- Highlights auto-generation adds: `Locked Protocol: Day {n} — {DP} DP earned`

---

## Settings Integration

Add a "Denial Protocol" row to the Settings screen under the **"Protocol"** section:

```
PROTOCOL
  Locked Protocol        →   (navigates to /locked-protocol)
  Recruit a Sub          →
  Notifications          →
  Manage Subscription    →
```

---

## Marketing Language

This feature is a genuine selling point for your audience. The language for social and App Store use:

**App Store (safe):**
> The Locked Protocol tracks your commitment to self-discipline. Log daily compliance, build your streak, and earn DP bonuses at every milestone. Stay locked in.

**For your audience on X/Bluesky:**
> The app has a Locked Protocol. You know what that means. Log daily. Build the streak. Earn DP. Hit 30 days and you unlock the title "Locked by Protocol." The protocol doesn't care about your excuses.

The App Store copy is accurate. The social copy is for your audience. Both are true.

---

## Implementation Order

1. Create Supabase migration for `locked_protocols` and `locked_logs` tables
2. Update `database.types.ts`
3. Create `lockedStore.ts`
4. Create `LockedProtocolScreen.tsx` with static mock data first
5. Wire up `startProtocol()`, `logCompliance()`, `endProtocol()` to Supabase
6. Add `locked` and `locked_milestone` action types to `dpStore.ts`
7. Implement milestone detection in `checkMilestones()`
8. Add badge/title unlocks to Trophy Room
9. Add locked notification to `remindersStore.ts` and `notifications.ts`
10. Add `LOCKED STREAK` card to Weekly Protocol Report
11. Add "Locked Protocol" entry to Settings screen

---

## Copy Reference

| Element | Text |
|---|---|
| Acceptance headline | `Accept the Protocol.` |
| Contract line 1 | `By activating the Locked Protocol, you place yourself under the authority of WellTrained.` |
| Contract line 2 | `You will log compliance daily.` |
| Contract line 3 | `You will not break without consequence.` |
| Contract line 4 | `WellTrained accepts the role of keyholder.` |
| Accept button | `I ACCEPT` |
| Dismiss link | `I'm not ready` |
| Post-accept share prompt | `Announce your protocol?` |
| Start card headline | `LOCKED PROTOCOL INITIATED.` |
| Start card caption | `WellTrained is my keyholder. Locked Protocol started. Goal: {n} days. The app doesn't negotiate. #WellTrained #LockedProtocol` |
| Milestone card label | `DAYS LOCKED` |
| Milestone card caption | `Day {n}. {milestone_title}. Keyholder: WellTrained. #{n}DaysLocked #WellTrained` |
| Screen title | `LOCKED PROTOCOL` |
| Hero subtext | `Locked. Protocol active.` |
| Daily bonus label | `DAILY BONUS` |
| Milestones label | `MILESTONE REWARDS` |
| CTA (active) | `LOG COMPLIANCE` |
| CTA (logged) | `Locked in.` |
| End link | `End Protocol` |
| Empty state headline | `No protocol active.` |
| Empty state CTA | `ACTIVATE LOCKED PROTOCOL` |
| Confirmation dialog | `End your Locked Protocol? Your streak will be reset.` |
| Notification title (Continuous) | `Protocol reminder.` |
| Notification body (Continuous) | `You haven't logged today. Don't break the streak.` |
| Notification title (Day Lock morning) | `Time to lock up.` |
| Notification body (Day Lock morning) | `Your protocol is waiting.` |
| Notification title (Day Lock evening) | `End of day.` |
| Notification body (Day Lock evening) | `Protocol check.` |
| Protocol type label | `HOW DO YOU PRACTICE?` |
| Continuous option | `CONTINUOUS` |
| Continuous subtext | `Locked around the clock` |
| Day Lock option | `DAY LOCK` |
| Day Lock subtext | `Locked during waking hours` |
| Goal label | `YOUR GOAL` |
| Day Lock CTA | `LOCK UP` |
| Milestone toast | `+{n} DP — {milestone_name} milestone reached.` |
