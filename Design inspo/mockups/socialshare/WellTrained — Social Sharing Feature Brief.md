# WellTrained — Social Sharing Feature Brief

**Feature:** Protocol Share Cards  
**Priority:** High — organic acquisition driver  
**Scope:** Three share card types triggered at key protocol moments  
**Target platforms:** Instagram Stories, X (Twitter), iMessage, any native share target

---

## Overview

After completing a workout, submitting full daily compliance, or achieving a new rank, the user is offered the option to share a branded share card to social media. The card is generated as a PNG image in-app using `html-to-image`, composited with the user's live avatar data, and passed to the native iOS/Android share sheet via `@capacitor/share`.

No platform-specific APIs are required. No Instagram or X SDK. The native share sheet handles all platform routing.

---

## Dependencies

Install these packages before implementing:

```bash
npm install html-to-image @capacitor/share @capacitor/camera
npx cap sync
```

Add camera and photo library permissions to `ios/App/App/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>WellTrained uses your camera to add your photo to share cards.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>WellTrained saves share cards to your photo library.</string>
```

Add to `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

---

## Architecture

### Core Utility: `src/lib/shareCard.ts`

This utility handles all card generation and sharing. It should export three functions:

```typescript
export async function shareRankUpCard(rankName: string, totalDP: number, streak: number): Promise<void>
export async function shareWorkoutCard(workoutName: string, sets: number, topLift: string, dpEarned: number, rankName: string, userPhoto?: string): Promise<void>
export async function shareComplianceCard(day: number, streak: number): Promise<void>
```

Each function:
1. Renders a hidden off-screen `<div>` containing the share card component
2. Converts it to a PNG blob using `html-to-image`'s `toPng()` function
3. Writes the PNG to a temporary file using `@capacitor/filesystem`
4. Calls `Share.share()` with the file URI

```typescript
import { toPng } from 'html-to-image'
import { Share } from '@capacitor/share'
import { Filesystem, Directory } from '@capacitor/filesystem'

async function generateAndShare(element: HTMLElement, filename: string, text: string) {
  const dataUrl = await toPng(element, { quality: 0.95, pixelRatio: 2 })
  const base64 = dataUrl.split(',')[1]
  
  const file = await Filesystem.writeFile({
    path: `share/${filename}.png`,
    data: base64,
    directory: Directory.Cache,
  })

  await Share.share({
    title: 'WellTrained',
    text,
    url: 'https://welltrained.app',
    files: [file.uri],
    dialogTitle: 'Share your protocol',
  })
}
```

---

## Card 1: Rank-Up Share Card

**Trigger:** Inside `RankUpModal.tsx`, after the user taps "Claim Your Rank"  
**Reference mock-up:** `share_card_rankup.png`

### When to show
Add a "Share Your Rank" button below the "Claim Your Rank" CTA in `RankUpModal.tsx`. It should appear after `claimed` is true — so the flow is: tap "Claim Your Rank" → button changes to "Claimed." → "Share Your Rank" button fades in below.

### Data to display
Pull from `useDPStore`:
- `rankName` — the new rank name (already passed as prop to modal)
- `oldRankName` — previous rank (already in modal)
- `totalDP` — `useDPStore(s => s.totalDP)`
- `streak` — `useDPStore(s => s.streak)`
- `avatarStage` — `useAvatarStore(s => s.stage)` for the correct avatar image

### Component: `<RankUpShareCard />`

```tsx
// src/components/share/RankUpShareCard.tsx
// Rendered off-screen, captured as PNG

interface RankUpShareCardProps {
  rankName: string
  totalDP: number
  streak: number
  avatarStage: number
}
```

**Layout (portrait, 390x844px):**
- Background: `#0A0A0A`
- Top center: Chain crown SVG mark in `#C9A84C`
- Headline: `RANK ACHIEVED` — `font-heading`, uppercase, gold, tracking-widest, ~18px
- Rank name: `{rankName}` — massive display, `font-heading`, gold, ~72px
- Center: Avatar image at current stage (`/src/assets/avatars/stage-{n}.png`), ~280px tall, with radial gold glow behind
- Stats row: Two pills — `TOTAL DP: {totalDP.toLocaleString()}` and `STREAK: {streak} DAYS` — dark surface `#1A1A1A`, gold border `#C9A84C`, monospace font, ~12px
- Thin horizontal gold divider
- Bottom: `WELLTRAINED` wordmark, `Submit to the Gains.` italic tagline, `welltrained.app` muted URL

**Share text:**
```
Just achieved {rankName} rank on WellTrained. {totalDP.toLocaleString()} Discipline Points earned. Submit to the Gains. welltrained.app
```

---

## Card 2: Post-Workout Share Card

**Trigger:** `Workouts.tsx`, after a workout is marked complete  
**Reference mock-up:** `share_card_workout.png`

### When to show
After the user marks a workout as complete (the "Done!" state), add a "Share Protocol" button to the completed workout card. Tapping it opens a bottom sheet with two options:
- "Share without photo" — generates card immediately
- "Add your photo" — opens camera, composites photo, then generates card

### Data to display
Pull from `useWorkoutStore` and `useDPStore`:
- `workoutName` — name of the completed workout
- `setsCompleted` — total sets logged in the session
- `topLift` — the exercise with the highest reps or weight in the session (compute from session data)
- `dpEarned` — DP awarded for this workout (50 base, modified by archetype)
- `rankName` — current rank from `useDPStore`
- `avatarStage` — from `useAvatarStore`
- `userPhoto` — optional, from camera capture

### Camera capture flow
```typescript
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'

const photo = await Camera.getPhoto({
  quality: 90,
  allowEditing: false,
  resultType: CameraResultType.DataUrl,
  source: CameraSource.Camera,
})
// photo.dataUrl is a base64 image string — pass to card component as userPhoto prop
```

### Component: `<WorkoutShareCard />`

```tsx
// src/components/share/WorkoutShareCard.tsx

interface WorkoutShareCardProps {
  workoutName: string
  setsCompleted: number
  topLift: string
  dpEarned: number
  rankName: string
  avatarStage: number
  userPhoto?: string // base64 data URL, optional
}
```

**Layout (portrait, 390x844px) — Full-bleed photo approach:**

The user's photo is the entire canvas. The app is the frame, not the subject.

- **Background layer:** User's photo fills 100% of the card. No borders, no padding, no cropping to a circle. Full bleed.
- **Gradient overlays (CSS):**
  - Top 30%: `linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)` — ensures stats are readable
  - Bottom 20%: `linear-gradient(to top, rgba(0,0,0,0.80), transparent)` — ensures branding is readable
  - Middle 50%: fully visible photo, no overlay
- **If no photo provided:** True black `#0A0A0A` background with the avatar centered and enlarged (~300px tall) as the hero

**TOP OVERLAY — stats row (positioned ~48px from top, full width, horizontal):**
  - Left: `SETS` label (tiny gold uppercase) / `{setsCompleted}` (large bold white)
  - Center: `TOP LIFT` label (tiny gold uppercase) / `{topLift}` (large bold white)
  - Right: `DP EARNED` label (tiny gold uppercase) / `+{dpEarned} DP` (large bold gold `#C9A84C`)
  - All text has `text-shadow: 0 2px 8px rgba(0,0,0,0.8)` for readability over any photo

**BOTTOM LEFT — branding (positioned ~24px from bottom):**
  - Chain crown SVG mark in gold + `WELLTRAINED` wordmark in white, small (~14px)

**BOTTOM RIGHT — callsign (same vertical position as branding):**
  - `@{callsign}` in white, small (~14px), with drop shadow
  - Avatar badge sticker directly above: small Hades-style character in a circular dark background (~72px diameter), gold glow ring border. This is the only place the avatar appears on this card.

**VERY BOTTOM CENTER:** `welltrained.app` in muted white, tiny (~10px)

**Rounded corners:** `border-radius: 24px` on the outer card container — matches the phone screenshot aesthetic

**Share text:**
```
Protocol complete. {workoutName} — {setsCompleted} sets, +{dpEarned} DP earned. Rank: {rankName}. welltrained.app
```

---

## Card 3: Daily Compliance Share Card

**Trigger:** `CheckInModal.tsx`, after submitting a report with all 5 compliance items checked  
**Reference mock-up:** `share_card_compliance.png`

### When to show
Only offer the share option when all five compliance items are `true`. After `Report Accepted.` confirmation, show a "Share Your Protocol" button below the close button. Do not show this button on partial compliance days.

**Milestone moments** — show a special banner on the card at streak milestones:
- Day 7: `FIRST WEEK COMPLETE`
- Day 30: `30-DAY PROTOCOL`
- Day 100: `100 DAYS OF DISCIPLINE`

### Data to display
Pull from `useDPStore`:
- `streak` — current streak count
- `totalDP` — total DP earned
- `rankName` — current rank
- `avatarStage` — from `useAvatarStore`
- All five compliance values (already available in modal state)

### Component: `<ComplianceShareCard />`

```tsx
// src/components/share/ComplianceShareCard.tsx

interface ComplianceShareCardProps {
  streak: number
  totalDP: number
  rankName: string
  avatarStage: number
  milestone?: string // e.g. 'FIRST WEEK COMPLETE' — only shown at milestones
}
```

**Layout (portrait, 390x844px):**
- Background: `#0A0A0A`
- Top center: Chain crown mark in gold
- Headline: `FULL COMPLIANCE` — large bold gold uppercase, tracking-widest
- Subheading: `Day {streak} of the Protocol` — white, bold number
- Optional milestone banner: Gold pill with milestone text, only shown at day 7/30/100
- Center: Avatar in calm authoritative pose, amber glow, ~220px tall
- Five compliance rows (all checked):
  ```
  ✓  Training
  ✓  Protein Goal
  ✓  Meal Compliance
  ✓  Steps Goal
  ✓  Sleep Goal
  ```
  Each row: dark surface `#1A1A1A`, gold left border accent, gold checkmark, white label
- Streak display: `OBEDIENCE STREAK: {streak} DAYS` in gold monospace uppercase
- Thin gold divider
- Bottom: `WELLTRAINED` wordmark, `Submit to the Gains.` italic, `welltrained.app` muted

**Share text:**
```
Full compliance. Day {streak} of the Protocol. {totalDP.toLocaleString()} DP earned. Rank: {rankName}. welltrained.app
```

---

## File Structure

```
src/
  components/
    share/
      RankUpShareCard.tsx       # Card 1 component
      WorkoutShareCard.tsx      # Card 2 component
      ComplianceShareCard.tsx   # Card 3 component
      ShareCardWrapper.tsx      # Off-screen render wrapper utility
  lib/
    shareCard.ts                # Core generate + share utility
```

### `ShareCardWrapper.tsx`
A utility component that renders its children off-screen (positioned absolutely outside viewport) so `html-to-image` can capture them without affecting the visible UI:

```tsx
export function ShareCardWrapper({ children, cardRef }: { children: React.ReactNode, cardRef: React.RefObject<HTMLDivElement> }) {
  return (
    <div
      ref={cardRef}
      style={{
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        width: '390px',
        height: '844px',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}
```

---

## Integration Points

### `RankUpModal.tsx`
After the existing "Claim Your Rank" button, add:
```tsx
{claimed && (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
    <Button variant="outline" onClick={handleShare} className="w-full border-primary/30 text-primary">
      Share Your Rank
    </Button>
  </motion.div>
)}
```

### `Workouts.tsx`
On the completed workout card (where "Done!" badge shows), add a share button below the DP earned line:
```tsx
{workout.completed && (
  <button onClick={() => setShowShareSheet(true)} className="text-xs text-primary font-heading uppercase tracking-widest mt-2">
    Share Protocol →
  </button>
)}
```

### `CheckInModal.tsx`
After the `Report Accepted.` state, add:
```tsx
{submitted && allCompliant && (
  <Button variant="outline" onClick={handleShare} className="w-full mt-3 border-primary/30 text-primary">
    Share Your Protocol
  </Button>
)}
```
Where `allCompliant` is `training && protein && meals && steps && sleep`.

---

## Important Notes

**Web platform:** `@capacitor/share` and `@capacitor/camera` are native-only. Wrap all share calls with `isNative()` check from `@/lib/platform`. On web, either hide the share buttons entirely or show a "Download card" option using a standard `<a download>` link.

**Avatar images:** The card components should use the same avatar PNG assets already in `src/assets/avatars/`. Use the `getAvatarImage(stage)` utility from `avatarUtils.ts` to resolve the correct image path.

**Font loading:** `html-to-image` captures the DOM as rendered, so fonts must be fully loaded before capture. Use `document.fonts.ready` to gate the capture call.

**Performance:** Generate the card only on demand (when the user taps share), not pre-emptively. The `toPng()` call is synchronous-heavy — show a brief loading state on the share button while it runs.

**Privacy:** The share card never includes the user's email, callsign, or any personally identifying information beyond what they choose to share (their photo, if added). Rank name and DP are the only user-specific data points.

---

## DP Reward Mechanic for Sharing

Sharing earns Discipline Points. This turns an optional vanity action into a protocol behavior and incentivizes organic distribution without requiring any external referral system.

### DP Values

| Share Action | DP Awarded | Limit |
|---|---|---|
| Share workout card | +5 DP | Once per calendar day |
| Share compliance card | +5 DP | Once per calendar day (full compliance days only) |
| Share rank-up card | +10 DP | Once per rank (not daily) |

The rank-up share awards 10 DP because it is a milestone event, not a repeatable daily action. It fires once per rank achieved and cannot be farmed. The daily share actions each have a one-per-day gate using the same date-check pattern already used for training, protein, and sleep DP.

### Store Changes — `dpStore.ts`

Add three new reason keys to the existing `awardDP` reason union type:

```typescript
type DPReason =
  | 'training'
  | 'protein'
  | 'meals'
  | 'steps'
  | 'sleep'
  | 'share_workout'      // NEW — +5 DP, daily gate
  | 'share_compliance'   // NEW — +5 DP, daily gate
  | 'share_rankup'       // NEW — +10 DP, per-rank gate
```

Add two new date fields to the store state for daily gating:

```typescript
lastShareWorkoutDate: string | null   // ISO date string 'YYYY-MM-DD'
lastShareComplianceDate: string | null
```

Add a `lastRankUpShareClaimed` field (store the rank name string) to prevent re-claiming the same rank-up share:

```typescript
lastRankUpShareClaimed: string | null  // rank name, e.g. 'Enforcer'
```

Add three new actions to the store:

```typescript
awardShareWorkoutDP: () => void
awardShareComplianceDP: () => void
awardShareRankUpDP: (rankName: string) => void
```

### Implementation

```typescript
// Inside dpStore.ts — add to the actions object:

awardShareWorkoutDP: () => {
  const today = new Date().toISOString().split('T')[0]
  const { lastShareWorkoutDate } = get()
  if (lastShareWorkoutDate === today) return // already claimed today
  set(state => ({
    totalDP: state.totalDP + 5,
    lastShareWorkoutDate: today,
  }))
  get().checkRankUp()
},

awardShareComplianceDP: () => {
  const today = new Date().toISOString().split('T')[0]
  const { lastShareComplianceDate } = get()
  if (lastShareComplianceDate === today) return
  set(state => ({
    totalDP: state.totalDP + 5,
    lastShareComplianceDate: today,
  }))
  get().checkRankUp()
},

awardShareRankUpDP: (rankName: string) => {
  const { lastRankUpShareClaimed } = get()
  if (lastRankUpShareClaimed === rankName) return // already claimed for this rank
  set(state => ({
    totalDP: state.totalDP + 10,
    lastRankUpShareClaimed: rankName,
  }))
  get().checkRankUp()
},
```

### Calling the Actions from `shareCard.ts`

DP is awarded **after** `Share.share()` resolves successfully — not when the button is tapped. This ensures DP is only granted if the share sheet actually opened.

```typescript
// In shareWorkoutCard():
const result = await Share.share({ ... })
if (result) {
  useDPStore.getState().awardShareWorkoutDP()
}

// In shareComplianceCard():
const result = await Share.share({ ... })
if (result) {
  useDPStore.getState().awardShareComplianceDP()
}

// In shareRankUpCard():
const result = await Share.share({ ... })
if (result) {
  useDPStore.getState().awardShareRankUpDP(rankName)
}
```

### UI Feedback

After a successful share that awards DP, show a brief toast notification:
- Workout share: `+5 DP — Protocol shared.`
- Compliance share: `+5 DP — Protocol shared.`
- Rank-up share: `+10 DP — Rank broadcast.`

Use the existing toast/notification pattern already in the app. If the daily limit has already been hit, the share still works but no DP toast appears — do not show an error or "already claimed" message, as that would feel punitive.

### Daily Report Integration

The share DP actions do **not** appear as checkboxes in the Daily Report modal — they are bonus actions, not compliance requirements. They contribute to total DP and can trigger a rank-up, but they do not affect the compliance score or the compliance share card eligibility.

---

## Implementation Order

1. Install dependencies and configure permissions
2. Add DP share actions to `dpStore.ts` — confirm gating logic works before building any UI
3. Build `shareCard.ts` utility with mock data first — confirm `toPng` + `Share.share()` + `awardDP` pipeline works end to end
4. Build `RankUpShareCard` component and integrate into `RankUpModal` — this is the simplest (no camera, no workout data)
5. Build `ComplianceShareCard` and integrate into `CheckInModal`
6. Build `WorkoutShareCard` without photo first, integrate into `Workouts`
7. Add camera compositing to `WorkoutShareCard` as final step
