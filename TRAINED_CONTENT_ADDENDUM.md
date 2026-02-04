# TRAINED — Content & Philosophy Addendum

> **Context:** This document supplements `TRAINED_APP_SPEC.md` with content, copy, and feature refinements informed by real BDSM education content. These insights should shape the app's tone, onboarding messaging, check-in prompts, standing orders, and feature behavior. Hand this to Claude Code alongside the main spec.

---

## 1. CORE PHILOSOPHY (Bake This Into Everything)

The app's entire UX philosophy should reflect these principles pulled from actual BDSM education. These aren't just vibes — they should inform copy, feature design, and how the app "talks" to the user.

### Principle 1: Progress, Not Perfection

The app must never punish users or make them feel like failures. The streak system, the check-ins, the assignments — all of it should reinforce that growth is the goal, not flawlessness. The "Safe Word Recovery" (Never Miss Twice) mechanic exists because rigid perfection isn't sustainable and the app knows that.

**Where this shows up:**
- Streak break messaging should be encouraging, not guilt-tripping
- Check-in screen should celebrate partial completion ("You hit 3 of 4 assignments today — that's discipline.")
- No red X marks or failure indicators anywhere in the UI
- Missed days show as neutral (empty square), not negative (red/crossed out)

### Principle 2: Self-Care IS the Discipline

Taking care of your body — sleep, hydration, nutrition, physical conditioning — is not separate from the "training." It IS the training. The app should frame macro tracking, workout completion, and daily habits as acts of self-discipline that serve a larger purpose, not just vanity metrics.

**Where this shows up:**
- Standing Orders should include self-care framing (see updated list below)
- Macro tracking copy: "Protocol Compliance" not just "did you eat right"
- The app should feel like it's helping users take ownership of themselves

### Principle 3: Reward Over Punishment

Positive reinforcement builds obedience. Punishment builds fear. The app's entire feedback loop should be reward-weighted: DP earned, ranks gained, Marks of Devotion unlocked, avatar evolution. There are no penalties, no XP loss, no rank demotion. The only "consequence" of missing a day is not earning — never losing.

**Where this shows up:**
- No negative XP mechanics ever
- No "you lost your streak" doom screen — just a neutral reset with Safe Word Recovery explanation
- Weekly Reward Ritual is the peak dopamine moment — design it to feel earned and satisfying
- Toast notifications for completions should feel like praise, not just confirmation

### Principle 4: Structure Creates Freedom

The app provides the protocol so users don't have to think about what to do. The structure (daily assignments, weekly ritual, rank progression) removes decision fatigue and lets users focus on execution. This mirrors how real D/s dynamics work — the submissive finds freedom in the structure provided.

**Where this shows up:**
- Home screen should clearly lay out "here's what you need to do today"
- Daily Assignments should feel like orders received, not a to-do list
- The system is the authority — the app speaks with quiet confidence, not cheerfulness

### Principle 5: Training Is Ongoing

There is no "done." Rank 99 is not the end — it's a milestone. The app should never frame any achievement as a finish line. Even the highest-ranked users are still following the protocol, still reporting in, still earning. This mirrors the reality that D/s training is a continuous practice, not a destination.

**Where this shows up:**
- Post-rank-99 messaging: "Unchained. The protocol continues."
- No "congratulations you completed the app" screen
- Weekly summaries should always look forward ("Next week's focus:")

---

## 2. UPDATED STANDING ORDERS (Motivational Messages)

Replace the standing orders from the main spec with this expanded set. These are informed by the actual language and philosophy from BDSM education content. They should rotate daily on the home screen.

Group them into categories so the app can contextually serve relevant ones (e.g., show self-care ones on rest days, show discipline ones on training days).

### Discipline & Consistency
```typescript
const discipline = [
  "The protocol doesn't care about your feelings. Follow it anyway.",
  "Discipline is choosing between what you want now and what you want most.",
  "You earned yesterday. Now earn today.",
  "Consistency isn't glamorous. It's powerful.",
  "Show up. Report in. Get it done.",
  "The only easy day was yesterday.",
  "Your rank isn't given. It's taken.",
  "You said you would. So do it.",
  "Obedience to the process is freedom from the outcome.",
  "You don't rise to the occasion. You fall to your training.",
  "The protocol works. Trust it.",
  "Structure creates freedom. Follow the structure.",
  "Every day you show up is a day you chose this.",
  "The grind doesn't stop. Neither do you.",
  "Discipline today. Freedom tomorrow.",
]
```

### Self-Care as Service
```typescript
const selfCare = [
  "Taking care of yourself is taking care of something worth protecting.",
  "Sleep. Water. Protein. These aren't suggestions — they're standing orders.",
  "You can't serve from an empty tank. Maintain yourself first.",
  "Your body is the instrument. Keep it tuned.",
  "Dehydrated and exhausted is not a protocol. Fix it.",
  "Rest is earned, not defaulted to. But when it's earned — take it.",
  "Taking your vitamins is not optional. Neither is taking care of yourself.",
  "A well-maintained body performs better. In every context.",
  "Self-sufficiency is not the opposite of submission. It's the foundation of it.",
  "Eat. Sleep. Train. Report. Repeat.",
]
```

### Growth & Imperfection
```typescript
const growth = [
  "You don't have to be perfect. You have to be consistent.",
  "Progress over perfection. Always.",
  "You missed yesterday. That doesn't define today. Show up.",
  "Three out of four assignments completed is not failure. It's discipline.",
  "Perfection is not the goal. Growth is the goal.",
  "Weak moments pass. Regret doesn't.",
  "You're not here to be flawless. You're here to be better than yesterday.",
  "The protocol has room for mistakes. That's what Safe Words are for.",
  "Falling short is human. Getting back up is trained.",
  "Don't compare your protocol to anyone else's. Run your own.",
]
```

### Reward & Ritual
```typescript
const reward = [
  "You've been putting in the work. Sunday's coming.",
  "Delayed gratification hits different when you've earned it.",
  "The reward ritual exists because you've earned something worth claiming.",
  "Every DP earned is proof that the system works.",
  "Your avatar didn't evolve by accident. You built that.",
  "Rank is a record of every day you chose to show up.",
  "The work is the point. The reward is the proof.",
]
```

### Implementation Note
Serve these contextually:
- **Rest days:** Rotate from `selfCare` and `growth` pools
- **Training days:** Rotate from `discipline` pool
- **Day after a missed day:** Pull from `growth` pool (never guilt)
- **Sunday (claim day):** Pull from `reward` pool
- **Default/random:** Mix from all pools

---

## 3. CHECK-IN (DAILY REPORT) COPY & UX

The Daily Report is where the user "reports in" on what they completed. This should feel like submitting a status report — not filling out a form. The tone is clean, structured, and slightly formal.

### Screen Layout

**Header:** "DAILY REPORT" (Oswald, uppercase, letter-spaced)

**Subheader:** Today's date in format "TUESDAY — 04 FEB 2026"

**Assignment List:**
Each daily assignment appears as a row with a toggle/checkbox. Completed items get a subtle `colorPrimary` left border. Incomplete items stay neutral.

```
┌─────────────────────────────────────┐
│ ■ Workout completed                 │  ✓
│ ■ Protein target hit                │  ✓
│ ■ Calorie target hit                │  ─
│ ■ Daily report submitted            │  ✓
└─────────────────────────────────────┘
```

**DP Breakdown:**
Below the assignments, show what was earned:

```
DISCIPLINE POINTS EARNED
─────────────────────────
Workout completed        +50 DP
Protein target           +30 DP
Daily report             +10 DP
Obedience streak (Day 12) +20 DP
─────────────────────────
TOTAL                    +110 DP
```

**Partial Completion Messaging:**
- 4/4: "Full compliance. Well done."
- 3/4: "Solid day. Three out of four."
- 2/4: "Noted. Tomorrow's a new assignment."
- 1/4: "You showed up. That counts."
- 0/4: (Don't show a report if nothing was done — just let the day pass quietly)

**Submit Button:** "SUBMIT REPORT" (primary button, full-width)

**Post-Submit Confirmation:**
Brief toast: "Report logged. +[X] DP earned."
No confetti, no celebration — just clean confirmation.

---

## 4. WEEKLY REWARD RITUAL — EXPANDED UX

This is the single most important emotional moment in the app. It happens on Sunday. The Dom Living transcript literally describes weekly check-ins on Sunday evening as a core ritual. The app's version of this is claiming your accumulated DP.

### Flow

**1. Banner on Home Screen (Sunday only)**
A subtle but prominent banner appears at the top of the home screen:

```
┌─────────────────────────────────────┐
│  YOUR REWARD IS READY               │
│  Claim your Discipline Points       │
│                    [CLAIM NOW]       │
└─────────────────────────────────────┘
```

Dark surface, 1px `colorPrimary` border, clean typography.

**2. Claim Modal (Full-Screen Takeover)**

Background: `colorBackground` (#0A0A0A) with very subtle radial gradient from center (slightly lighter) to edges.

Center of screen:

```
         THIS WEEK YOU EARNED

              +847 DP

     ──────────────────────────

     Workouts completed       4
     Protein targets hit      5
     Reports submitted        6
     Obedience streak bonus   ✓

     ──────────────────────────

          [CLAIM YOUR REWARD]
```

- The DP number is large (48px+), JetBrains Mono, with a very subtle pulse animation (opacity 0.8 → 1.0, slow, 2s loop)
- The breakdown items appear one by one with a slight stagger (150ms each), fading in from below
- "CLAIM YOUR REWARD" button: primary, centered, full-width within modal

**3. Post-Claim Animation**

- The DP number counts into the total (brief counting animation, 1.5s)
- The rank progress bar fills smoothly
- If a rank-up occurs:
  - Brief screen flash (white at 5% opacity, 200ms)
  - New rank displayed large: "RANK 14 — COLLARED"
  - Avatar stage name updates if applicable
  - Subtle red glow pulse behind the rank number
- If no rank-up:
  - Just the bar fill and a clean confirmation: "Claimed. Rank [X] — [Stage Name]"

**4. Post-Claim State**

The banner disappears. The home screen returns to normal. A small indicator shows "Next claim: Sunday" in muted text somewhere unobtrusive.

---

## 5. ONBOARDING COPY — EXPANDED

The onboarding should set the tone immediately. It's not playful. It's not corporate. It's direct, confident, and slightly intense — like the first conversation with someone who takes this seriously.

### Step 1: Welcome

**Screen content:**
```
TRAINED

The protocol for building discipline
through fitness.

This is not a game. This is a system.
Track your workouts. Hit your macros.
Report in daily. Earn your rank.

Structure creates freedom.
Let's begin.

                [START]
```

Dark background. "TRAINED" in large Oswald. Body text in Inter. Minimal. No images. Let the words land.

### Step 2: Name

```
What should we call you?

[_______________]

This is how the protocol will address you.

                [CONTINUE]
```

### Step 3: Gender

```
Biological sex

(Used for accurate metabolic calculations only.)

    [MALE]    [FEMALE]

                [CONTINUE]
```

Keep this clinical and functional. No personality here — just data collection.

### Step 4: Body Stats

```
Current stats

Weight    [___] lbs/kg
Height    [___] ft-in/cm
Age       [___]

These numbers are where you start.
Not where you stay.

                [CONTINUE]
```

### Step 5: Fitness Level

```
Training experience

How would you describe your current
relationship with the gym?

    [UNINITIATED]     Haven't started yet
    [TRAINED]         Consistent for 6+ months
    [ELITE]           2+ years, advanced programming

                [CONTINUE]
```

### Step 6: Training Days

```
Weekly commitment

How many days per week will you train?

    [3]    [4]    [5]

Select your training days:
    M  T  W  T  F  S  S

A commitment is a commitment.
Choose what you can sustain.

                [CONTINUE]
```

That last line is important — it directly reflects the "progress not perfection" and "sustainable not rigid" philosophy from both transcripts.

### Step 7: Goal

```
Current objective

What's the primary goal right now?

    [CUT]        Lose fat (-500 cal deficit)
    [RECOMP]     Recomposition (-200 cal)
    [MAINTAIN]   Hold current weight
    [BUILD]      Add muscle (+300 cal surplus)

                [CONTINUE]
```

### Step 8: Choose Your Discipline (Class Selection)

```
Choose your discipline

How you train defines who you become.

┌─────────────────────────────────┐
│  THE DOM/ME                     │
│  Strength & Power               │
│                                 │
│  Heavy compounds. Commands the  │
│  iron. Takes control of the     │
│  weight room.                   │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  THE SWITCH                     │
│  Hybrid & Functional            │
│                                 │
│  Adapts to anything. Versatile  │
│  programming. Balanced power    │
│  and endurance.                 │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  THE BRAT                       │
│  Athletic & HIIT                │
│                                 │
│  Pushes every limit. High       │
│  intensity. Defiant energy.     │
│  Won't quit.                    │
└─────────────────────────────────┘
```

### Step 9: Avatar Reveal

After selection, the avatar appears with a brief fade-in (no bounce, no confetti):

```
        [Avatar Image]

        UNINITIATED
        Rank 1

  "The protocol begins now."

            [BEGIN]
```

Tapping BEGIN takes user to the home screen. Protocol is active.

---

## 6. FEATURE BEHAVIOR INFORMED BY TRANSCRIPTS

### Habit Formation Loop (Cue → Behavior → Reward)

Both transcripts emphasize habit formation through positive reinforcement. The app already has this loop but the copy and UX should make it explicit:

- **Cue:** Daily Assignments appear on the home screen each morning. Protocol Reminders nudge if configured.
- **Behavior:** User completes workouts, hits macros, submits daily report.
- **Reward:** DP earned immediately on each completion (micro-reward). Weekly Reward Ritual on Sunday (macro-reward). Rank advancement and avatar evolution (milestone reward).

The app should NEVER withhold rewards or introduce penalties. The only "loss" is the absence of gain. This mirrors the advice from both transcripts: reward-based systems build lasting habits; punishment-based systems build resentment.

### Streak Messaging

When a streak breaks, the messaging matters enormously. Both transcripts emphasize that missing a day is human and normal.

**Current streak active — Day X:**
"Obedience Streak: Day [X]"
(Clean, factual, no emoji, displayed prominently on home screen)

**Streak paused (grace period active — Safe Word Recovery):**
"Streak paused. Safe Word active. Check in today to continue."
(Neutral tone. Not panicked. Not guilt-inducing. Just informative.)

**Streak broken (missed 2+ days):**
"Streak reset. New protocol begins today."
(Forward-looking. No "you failed." No stats about what was lost. Just: start again.)

### Rest Day Behavior

On days the user doesn't have a workout scheduled, the app should still have value. The home screen should show:

```
REST DAY

No workout assigned.

Today's assignments:
  ■ Hit protein target
  ■ Hit calorie target
  ■ Submit daily report

"Rest is earned, not defaulted to.
 But when it's earned — take it."
```

This reflects the self-care principle: rest days are still protocol days. You still eat right, you still report in.

### Different Training Styles

The Dom Living transcript specifically discusses adapting training to different sub types (brats, service subs, littles, switches). The avatar class system already maps to different training styles. The app should subtly adjust its tone based on class selection:

**The Dom/me (Strength):**
- Standing orders lean toward authority and control language
- "Command the weight. Own the iron."
- Assignments feel direct and heavy

**The Switch (Hybrid):**
- Standing orders lean toward adaptability and balance
- "Versatility is its own kind of power."
- Assignments feel balanced and strategic

**The Brat (Athletic/HIIT):**
- Standing orders lean toward defiance and intensity
- "They said you couldn't. Prove them wrong."
- Assignments feel like challenges and dares

This is a V2 feature — not required for launch — but note it in the theme config as a `classVariant` that can modify the standing orders pool. For MVP, a single pool is fine.

---

## 7. COACH (DOM/ME DASHBOARD) — INFORMED BY TRANSCRIPTS

Both transcripts emphasize that the D/s dynamic is collaborative. The Dom Living transcript specifically describes weekly check-ins, behavior tracking, and structured review as core practices. The Coach/Dom/me Dashboard should reflect this.

### Dashboard Copy Adjustments

**Client list header:** "YOUR SUBS" (not "Your Clients")

**Per-sub card should show:**
- Name
- Current rank + stage name
- Obedience streak count
- This week's protocol compliance (% of assignments completed)
- Last report submitted (timestamp)

**Compliance chart label:** "PROTOCOL COMPLIANCE" (not "Macro Adherence")

**Activity feed label:** "BEHAVIOR LOG"

**Empty state (no subs assigned):**
```
No subs assigned yet.

Share your invite code to connect
with a sub's training protocol.

[GENERATE INVITE CODE]
```

### Weekly Review Feature (V2 Enhancement)

Add a "Weekly Review" tab to the Dom/me Dashboard that shows a summary designed to facilitate the Sunday check-in that both transcripts describe:

```
WEEKLY REVIEW — [Sub Name]
Week of Jan 27 – Feb 2

Assignments completed:  22/28 (79%)
Workouts logged:        4/4
Protein targets:        5/7
Reports submitted:      6/7
Obedience streak:       Active (Day 34)
DP earned this week:    847
Current rank:           14 — Collared

Notes: Missed Tuesday report and
Thursday protein. Strong workout
consistency.
```

This gives the Dom/coach everything they need for a structured weekly check-in without the sub having to self-report verbally.

---

## 8. LANGUAGE & TONE GUIDE

### Voice Characteristics

The app speaks in second person, present tense. It's direct, concise, and assumes competence. It does not baby the user, but it also doesn't berate them. Think of it as a firm, trusted authority figure who respects you enough to give it to you straight.

**YES:**
- "Show up. Report in. Get it done."
- "Three out of four. Solid day."
- "Streak reset. New protocol begins today."
- "Your reward is ready."

**NO:**
- "Great job! You're doing amazing! 🎉"
- "Oops! Looks like you missed a day 😢"
- "Don't worry, everyone slips up sometimes!"
- "You've unlocked a super cool new badge!"

### Specific Copy Rules

1. **Never use exclamation marks** in system messages. The app doesn't shout. It states.
2. **Never use emoji** in any system-generated text. User-facing only.
3. **Never use the word "journey."** Or "adventure." Or "fun." This is a protocol, not a vacation.
4. **Never use passive voice** in assignments or standing orders. Commands are active.
5. **Abbreviate where it serves tone:** "DP" not "Discipline Points" in UI chrome. Full name only in explanatory contexts.
6. **Numbers are always numeric:** "3 of 4" not "three of four" in data displays.
7. **Dates are formatted militarily:** "04 FEB 2026" not "February 4, 2026" — this reinforces the discipline aesthetic.
8. **Use periods to end statements.** Not ellipses. Not dashes. Periods are decisive.

---

## 9. SUMMARY: FILES THIS AFFECTS

Everything in this addendum modifies content/copy, not architecture. The main spec handles the theme system and visual design. This document informs:

| What | Where |
|---|---|
| Standing orders (motivational messages) | `src/themes/trained.ts` — `standingOrders` array, split by category |
| Check-in screen copy and behavior | `CheckInModal.tsx` — partial completion messaging, submit copy |
| Weekly Reward Ritual UX | `XPClaimModal.tsx` — expanded flow, animation, post-claim state |
| Onboarding copy (all 9 steps) | `Onboarding.tsx` — step-by-step copy per the section above |
| Streak break messaging | `Home.tsx`, `userStore.ts` — streak display states and copy |
| Rest day home screen | `Home.tsx` — conditional display when no workout scheduled |
| Coach dashboard copy | `Coach.tsx` — labels, empty states, per-sub card layout |
| Global tone and formatting rules | All components — date formats, punctuation, voice |
| Class-specific tone (V2) | `src/themes/trained.ts` — `classVariant` standing order subsets |

Hand this file to Claude Code alongside `TRAINED_APP_SPEC.md`. The spec handles architecture and design. This handles soul.
