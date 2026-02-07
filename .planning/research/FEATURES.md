# Feature Landscape: Coach Dashboard

**Domain:** Online fitness coaching platform (single coach managing clients via PWA)
**Researched:** 2026-02-07
**Overall confidence:** HIGH (based on codebase analysis + competitive platform research across TrueCoach, TrainHeroic, Hevy Coach, Everfit, CoachRx)

---

## Existing State (Already Built)

Before detailing new features, here is what already exists in the codebase and can be leveraged:

| Existing Feature | Location | Integration Implications |
|-----------------|----------|-------------------------|
| Coach screen with client roster | `src/screens/Coach.tsx` | Basic list view with status indicators, add/remove clients, client detail modal with overview/progress/activity tabs |
| Client invitation by email | `Coach.tsx` handleInviteClient | Finds user by email in `profiles` table, creates `coach_clients` row. Client must already have an account. |
| `coach_clients` table + RLS | `supabase/schema.sql` | Coach-client relationship table with `pending/active/inactive` status. RLS policies allow coach to view client data. |
| `coach_client_summary` view | `supabase/schema.sql` | Materialized join giving coach at-a-glance stats: streak, level, XP, latest weight, workouts in last 7 days. |
| Coach can view client macro targets | RLS policy on `macro_targets` | Coach has SELECT + UPDATE on client macro targets. |
| Coach can view client workout logs | RLS policy on `workout_logs` | Coach has SELECT on client workout logs (exercises stored as JSONB). |
| Client workout system | `src/stores/workoutStore.ts` | Template-based workouts (3/4/5 day splits), exercises with sets/reps/weight, client-side Zustand with localStorage. |
| Client macro system | `src/stores/macroStore.ts` | Mifflin-St Jeor calculation, daily logging, saved meals, target tracking (protein/calories/carbs/fats). |
| Daily check-in with XP | `src/screens/CheckInModal.tsx` | Workout completion, protein target, calorie target, streak bonus. Gamification layer. |
| Bottom nav (5 tabs) | `src/components/Navigation.tsx` | Home, Workouts, Macros, Avatar, Settings. Coach screen at `/coach` route but NOT in nav. |
| Role system | `profiles.role` column | `user_role` enum: `client`, `coach`, `admin`. Not currently enforced in frontend routing. |
| `useClientDetails` hook | `src/hooks/useClientDetails.ts` | Fetches weight history, macro adherence, activity feed for a specific client. Cached for 5 minutes. |

**Key observation:** The coach dashboard foundation exists (client list, detail views, read-only data). What is MISSING is the coach's ability to **prescribe** (workouts, macros) and **collect structured feedback** (check-ins). The dashboard is currently view-only.

---

## Table Stakes

Features users expect. Missing = coach dashboard feels incomplete and unusable for actual coaching.

### 1. Client Invitation Flow (Enhancement of Existing)

**Why expected:** Every coaching platform has this. Current implementation requires clients to already have accounts. Industry standard (TrueCoach, Hevy Coach) is email invite that triggers signup.

| Sub-feature | What It Does | Complexity | Notes |
|-------------|-------------|------------|-------|
| Email invitation | Coach enters email, client receives invitation to join | Medium | Currently: client must have account first. Enhancement: send actual invite email via Supabase email or custom flow. |
| Invitation link / code | Generate shareable link or code the client can use to sign up and auto-connect to coach | Low | Alternative to email: coach copies a link, sends via DM/text. On signup, client is auto-linked to coach. |
| Pending state visibility | Coach sees "Pending" clients who have been invited but not yet signed up | Low | `coach_clients.status = 'pending'` already exists in schema. Just needs UI support. |
| Re-send / copy link | Ability to re-send or copy the invitation link | Low | TrueCoach supports resend + copy link. |

**Existing dependency:** `coach_clients` table already supports `pending` status. `profiles.email` lookup exists. Enhancement is the email delivery and signup-to-coach linking.

**Recommendation:** Skip email delivery for V1. Use a shareable invitation link/code approach. Coach generates a code, shares it however they want (DM, email, social). Client enters code during signup to auto-link to coach. Simpler, no email infrastructure needed.

**Confidence:** HIGH (pattern observed across TrueCoach, Hevy Coach, Everfit)

---

### 2. Workout Programming (New Feature)

**Why expected:** This is the core value of a coaching platform. Without it, the coach cannot do their job. Every platform (TrueCoach, TrainHeroic, Hevy Coach, Everfit, CoachRx) has this.

| Sub-feature | What It Does | Complexity | Notes |
|-------------|-------------|------------|-------|
| Exercise selection | Coach picks exercises from a library when building a workout | Medium | Existing app has hardcoded templates (3/4/5 day splits with ~5 exercises each). Coach needs to select from these + add custom exercises. |
| Sets/reps/weight prescription | Coach specifies target sets, rep range, and optional weight for each exercise | Low | Existing `Exercise` type already has `targetSets`, `targetReps`, `notes`. Coach just needs UI to set these per client. |
| Day-by-day assignment | Coach assigns workouts to specific days of the week for a client | Medium | Existing `WorkoutPlan.schedule` maps days to workout types. Coach needs to override the client's self-selected schedule. |
| Program templates | Coach saves a workout program and applies it to multiple clients | Medium | TrueCoach: "build once, copy-paste to many clients." Critical for scaling beyond 10 clients. |
| Workout sections/grouping | Organize exercises into sections (Warm-up, Strength, Finisher, Superset) | Low | TrueCoach uses custom group labels. Nice organizational UX. |
| Client sees prescribed workout | Prescribed workout appears in client's existing workout screen, replacing self-generated template | Medium | This is the bridge: coach writes it, client's `workoutStore` reads it. Key architectural challenge. |

**How competitors handle the coach-to-client flow:**
- **TrueCoach:** Drag-and-drop builder, 1200+ exercise video library, assign to client calendar. Client sees it on their app immediately.
- **Hevy Coach:** Prescribe exercises with sets, reps, weight, RPE targets. Client logs actual performance against prescribed targets.
- **TrainHeroic:** Master Calendar for programming blocks, apply to individuals or teams.

**Critical design decision for Trained:** The client currently generates workouts from templates in `workoutStore.ts` (lines 229-243, `getTemplateForDay`). Coach-prescribed workouts need to **override** this template system. Two approaches:

1. **Server-first:** Coach writes workout to a `prescribed_workouts` table in Supabase. Client fetches prescribed workout instead of generating from template. Requires client to be online for initial workout fetch.
2. **Sync-first:** Coach writes workout, it syncs to client's local store. Client works from local copy (offline-compatible). More complex but aligns with existing offline-first architecture.

**Recommendation:** Server-first for prescribed workouts. Clients need to be online at least once to get their program. Once fetched, cache locally. This is how TrueCoach and Hevy Coach work -- coach publishes, client downloads.

**Confidence:** HIGH (universal pattern across all coaching platforms)

---

### 3. Macro Target Setting (Enhancement of Existing)

**Why expected:** Setting nutrition targets is fundamental coaching. The client already has macro tracking built in -- the coach just needs to be able to set and adjust the targets remotely.

| Sub-feature | What It Does | Complexity | Notes |
|-------------|-------------|------------|-------|
| Set client macro targets | Coach sets protein, calories, carbs, fats targets for a client | Low | RLS policy already grants coach UPDATE on `macro_targets`. Just needs coach-side UI. |
| Per-day targets (training/rest) | Different macro targets for training days vs rest days | Medium | Everfit supports this natively: separate "Rest day macros goal." Not in current schema -- would need a `rest_day_targets` column or separate row. |
| Adjustment history | Log of when targets were changed and what they were changed to | Low | Useful for coach to see "I bumped protein from 180g to 200g on Jan 15." Simple audit log table. |
| Client sees coach-set targets | Coach-set targets override the client's self-calculated targets | Low | Client's `macroStore` currently uses `calculateMacros()`. If coach has set targets in Supabase `macro_targets`, client should fetch those instead. |
| TDEE calculator for coach | Coach can auto-calculate starting macros using client's stats | Low | `calculateMacros` function already exists in `macroStore.ts` (Mifflin-St Jeor). Reuse server-side or in coach UI. |

**How competitors handle this:**
- **Everfit:** Manual input OR auto-calculate from TDEE. Separate training-day and rest-day targets. Client sees targets in their tracking screen.
- **MacroFactor:** Weekly check-ins automatically adjust targets based on weight trend. Algorithm-driven.
- **Carbon Diet Coach:** Weekly target adjustments based on logged data and metabolic feedback.

**Recommendation for Trained:** Start with single daily targets (not per-day). Coach sets protein/calories/carbs/fats. The per-day (training vs rest) distinction is a differentiator, not table stakes. Most coaches start clients on flat daily targets and only periodize nutrition for advanced clients.

**Confidence:** HIGH (existing RLS and schema support this; just needs UI)

---

### 4. Client Roster & At-a-Glance Dashboard (Enhancement of Existing)

**Why expected:** The coach needs to know which clients need attention, who is falling off, and who is crushing it. Current implementation has this -- needs refinement.

| Sub-feature | What It Does | Complexity | Notes |
|-------------|-------------|------------|-------|
| Status indicators (active/stale/falling off) | Color-coded status based on last check-in | Already built | `getStatusColor` and `getStatusEmoji` in `Coach.tsx` already implement this (green <= 1 day, yellow <= 3 days, red > 3 days). |
| Quick stats (active/needs check-in/falling off) | Summary counts at top of dashboard | Already built | Three-card grid already shows Active Today, Need Check-in, Falling Off counts. |
| Sort by urgency | Clients who need attention appear first | Already built | Sort by `bDays - aDays` (descending) puts most neglected clients at top. |
| Compliance rate | 7/30/90 day compliance percentage | Low | TrueCoach: "exercises completed vs exercises assigned." Requires comparing prescribed workouts against completed workouts. Cannot implement without workout programming first. |
| Search / filter | Find specific clients, filter by status | Low | Not critical at 15-50 clients, but becomes important as roster grows. |
| Client detail expansion | Drill into a client's full data (weight chart, macro adherence, activity feed) | Already built | Modal with overview/progress/activity tabs already exists. |

**Typical roster sizes (from research):**
- Online personal trainers: 15-25 active clients is typical
- At premium pricing ($150-300/mo): 8-20 clients covers full-time income
- For Trained (~90k followers): Could see 50-200 paying clients if conversion is even 0.1-0.2%

**Implication for scale:** Current implementation uses a flat list. Fine up to ~50 clients. Beyond that, needs pagination or search. Recommend building for 50 initially, adding search/pagination in a later phase if needed.

**Recommendation:** The existing roster view is serviceable. Primary enhancement: add compliance rate once workout programming exists, and add macro adherence percentage to the client card (not just in the detail modal).

**Confidence:** HIGH (existing implementation reviewed; competitive patterns well-documented)

---

### 5. Structured Weekly Check-ins (New Feature)

**Why expected:** Check-ins are how coaches gather qualitative data and make informed adjustments. Every serious coaching platform has this. Without it, coaches must rely on external tools (Google Forms, WhatsApp messages) which fragments the experience.

| Sub-feature | What It Does | Complexity | Notes |
|-------------|-------------|------------|-------|
| Check-in form (client side) | Client fills out a structured weekly form with predefined questions | Medium | Separate from the daily XP check-in (`CheckInModal.tsx`). This is a weekly coaching check-in. |
| Coach reviews submissions | Coach sees submitted check-ins and can mark them reviewed | Medium | TrueCoach: "Needs Attention" flag. Everfit: "Pending" / "Reviewed" statuses in Check-In Review Dashboard. |
| Standard question set | Predefined questions covering the key areas | Low | See recommended questions below. |
| Bodyweight entry | Client logs current weight as part of check-in | Low | Already supported by `weight_logs` table and `logWeight()` in `userStore`. Just wire into check-in form. |
| Progress photos | Client uploads front/side photos | High | Requires image upload to Supabase Storage, storage policies, image compression. Significantly increases scope. |
| Coach response | Coach can write a response to the check-in | Low | Simple text field stored alongside the check-in submission. |

**Standard check-in questions (from research across MyPTHub, HubFit, OriGym, industry best practices):**

1. **Adherence:** "How many prescribed workouts did you complete this week?" (number)
2. **Training quality:** "Rate your training performance this week." (1-10 scale)
3. **Nutrition adherence:** "How closely did you follow your nutrition plan?" (1-10 scale)
4. **Sleep:** "Average hours of sleep per night this week." (number)
5. **Stress:** "Rate your overall stress level this week." (1-10 scale)
6. **Energy:** "Rate your overall energy level this week." (1-10 scale)
7. **Wins:** "What went well this week?" (text)
8. **Challenges:** "What challenges did you face?" (text)
9. **Questions:** "Any questions or concerns for your coach?" (text)
10. **Weight:** "Current bodyweight." (number, auto-populated from last entry)

**Key insight:** Avoid yes/no questions. Research emphasizes that "Did you stick to the plan?" oversimplifies complex situations. Use scales (1-10) for quantitative and open-ended for qualitative.

**Recommendation:** Build check-in form with the 10 questions above. Skip progress photos for V1 -- they add significant complexity (image upload, storage, compression, viewing UI) for marginal value. Photos can be added later. The coach response should be a simple text reply, not a full messaging system.

**Confidence:** HIGH (universal pattern across coaching platforms; question set derived from multiple sources)

---

### 6. Coach Navigation (Enhancement of Existing)

**Why expected:** The coach needs a different navigation structure than clients. Currently the coach screen is at `/coach` but not in the bottom nav. Coaches access it by... typing the URL manually? This is broken.

| Sub-feature | What It Does | Complexity | Notes |
|-------------|-------------|------------|-------|
| Role-based navigation | Coach sees different nav items than clients | Medium | `profiles.role` exists but is not used in frontend routing. Need to conditionally render nav based on role. |
| Coach-specific tabs | Coach nav includes: Clients, Programs, Check-ins | Low | TrueCoach uses: Dashboard, Clients, Programs. TrainHeroic: Athletes, Calendar, Programs. |
| Sub-navigation within coach views | Tabs or sections within the coach area (client list, individual client, programming) | Low | Current Coach.tsx uses a modal for client details. Could upgrade to sub-routes (e.g., `/coach/clients/:id`). |
| Preserve client nav for coach's own training | Coach may also be a trainee. They need access to their own workout/macro screens. | Low | Either: (a) separate toggle "Coach Mode / Training Mode" or (b) coach nav includes their own training as a tab. |

**How competitors structure coach navigation:**
- **TrueCoach (web):** Top sidebar with: Dashboard (today's clients), Clients (full list), Programs (template library), Messages. Each client click opens their calendar/detail view.
- **Hevy Coach (web):** Left sidebar: Clients, Programs, Exercises. Click client to see their assigned program + progress.
- **Everfit (web):** Left sidebar: Clients, Autoflow, Calendar, Library. Mobile: bottom tabs.

**Critical design decision for Trained (PWA/mobile-first):**

The app is a mobile-first PWA with a 5-tab bottom nav. Coach navigation needs to work within this constraint. Two options:

1. **Replace nav tabs for coaches:** When user has `role: 'coach'`, show coach-specific bottom nav: Home (coach dashboard), Clients, Programs, Training (their own), Settings. 5 tabs, clean.
2. **Add coach tab to existing nav:** Add a 6th "Coach" tab to the existing 5. Apple recommends max 6 tabs, but it is crowded and the coach sees client-specific screens they do not need day-to-day.

**Recommendation:** Option 1 -- role-based navigation. When `profiles.role === 'coach'`, render a different `Navigation` component with coach-specific tabs. The coach can access their own training from a "My Training" tab. This is cleaner than cramming coaching into the client nav.

**Confidence:** HIGH (standard pattern; single-role navigation is the norm in TrueCoach, Hevy Coach, Everfit)

---

## Differentiators

Features that set the product apart. Not expected in V1 but add competitive value.

### 1. Gamification Visibility for Coach

**Value proposition:** No competitor shows XP, levels, streaks, and avatar evolution to the coach. Trained already has this gamification system -- surfacing it to the coach is unique. Coach can see which clients are "leveling up" vs "stagnating" in gamification terms, adding a motivational layer to coaching.

| Feature | What It Does | Complexity | Notes |
|---------|-------------|------------|-------|
| Level + XP on client card | Show client's current level and XP next to their name | Already built | `Coach.tsx` already shows `Lvl {current_level}` and streak on client cards. |
| Achievement badges visible to coach | Coach can see which badges a client has earned | Low | Achievements are in `achievementsStore`. Would need Supabase table for synced achievements. |
| Avatar evolution stage | Coach can see client's avatar evolution | Low | Fun coaching tool: "Your client just evolved their avatar!" |
| Streak leaderboard | Coach sees clients ranked by current streak | Low | Simple sort of existing data. Motivational tool. |

**Confidence:** MEDIUM (unique to Trained; no competitive validation, but logical extension of existing system)

---

### 2. Training-Day vs Rest-Day Macro Targets

**Value proposition:** Most coaching apps offer only flat daily targets. Everfit is the main competitor offering training/rest day differentiation. This is a genuine coaching best practice (higher carbs on training days, lower on rest days) that most apps do not support.

| Feature | What It Does | Complexity | Notes |
|---------|-------------|------------|-------|
| Dual target sets | Coach sets separate macros for training and rest days | Medium | Requires schema change: either separate columns or a second `macro_targets` row per user. Client needs to know which days are training days (already in `workoutStore.selectedDays`). |
| Auto-detection | Client's app automatically applies correct targets based on whether today is a training day | Low | `workoutStore.getTodayWorkout()` already returns null on rest days. Use this to pick the right target set. |

**Confidence:** MEDIUM (validated by Everfit's approach; adds real coaching value but not required for V1)

---

### 3. Prescribed vs Actual Reporting

**Value proposition:** Coach prescribes 4 sets of 8 reps at 185 lbs. Client actually does 4 sets of 6, 7, 8, 5 reps at 175 lbs. The coach sees both side-by-side. TrainHeroic and Hevy Coach highlight this as a core feature.

| Feature | What It Does | Complexity | Notes |
|---------|-------------|------------|-------|
| Side-by-side comparison | Shows prescribed targets vs what client actually logged | Medium | Requires storing prescribed workout separately from logged workout. Current `WorkoutLog` stores the final logged data. |
| Completion percentage | "Client completed 85% of prescribed volume" | Low | Calculate from prescribed vs actual sets/reps/weight. |
| Progressive overload tracking | "Client has increased squat weight by 10 lbs over 4 weeks" | Medium | Requires exercise-level history aggregation across workout logs. |

**Confidence:** HIGH (well-documented pattern in TrainHeroic and Hevy Coach)

---

### 4. Program Templates and Library

**Value proposition:** Coach builds a "12-Week Hypertrophy Program" once and assigns it to many clients with minor modifications. Critical for scaling beyond 20 clients. TrueCoach's entire business model is built around this efficiency.

| Feature | What It Does | Complexity | Notes |
|---------|-------------|------------|-------|
| Save program as template | Coach saves a multi-week program that can be reused | Medium | Requires a `program_templates` table with week/day/exercise structure. |
| Assign template to client | One-click assignment with optional customization | Low | Copy template data into client's prescribed workouts. |
| Template marketplace | Coach sells programs to other coaches | High | Out of scope. TrainHeroic has this, but it is a platform feature, not a single-coach feature. |

**Confidence:** MEDIUM (clear competitive pattern; complexity depends on program structure)

---

### 5. In-App Messaging

**Value proposition:** Direct communication between coach and client without leaving the app. TrueCoach and Everfit both have this. However, for a single coach with ~90k followers, messaging could become overwhelming.

| Feature | What It Does | Complexity | Notes |
|---------|-------------|------------|-------|
| 1:1 text messaging | Coach and client can exchange text messages | High | Requires real-time infrastructure (Supabase Realtime or polling). Chat UI is deceptively complex. |
| Workout-attached comments | Client can comment on specific workouts, coach responds | Medium | Lighter than full messaging. Contextual communication. |
| Notification on new message | Push or in-app notification when new message arrives | High | Requires push notification infrastructure (web push, service worker). |

**Confidence:** HIGH (pattern is universal, but messaging is a high-complexity feature with real-time infrastructure needs)

---

## Anti-Features

Things to deliberately NOT build. Common mistakes when building a coach dashboard.

### 1. Do NOT Build Full Messaging / Chat

**Why avoid:** Messaging is a deceptively complex feature. It requires real-time sync (Supabase Realtime channels), read receipts, typing indicators, notification infrastructure, message history pagination, and a full chat UI. For a single coach managing 50+ clients, an inbox quickly becomes unmanageable. Every coaching platform eventually regrets how they built messaging.

**What to do instead:** Use the weekly check-in system as the primary structured communication channel. Coach responds to check-ins with a text reply. For ad-hoc communication, the coach already has DMs on the social platform where their ~90k followers are. The check-in response covers 80% of coach-client communication needs without the infrastructure burden.

---

### 2. Do NOT Build Progress Photo Comparison (V1)

**Why avoid:** Progress photos require: image upload to storage, image compression/resizing, storage bucket policies, a photo viewer with comparison overlay (Kahunas-style), and privacy controls. It is a full sub-feature that touches storage infrastructure the app does not currently use. The coaching value is real but the complexity is disproportionate.

**What to do instead:** Defer to a later phase. Clients can share progress photos via their existing social/messaging channels with the coach. Add photo support to check-ins in a future milestone once the check-in system is stable.

---

### 3. Do NOT Build an Exercise Video Library

**Why avoid:** TrueCoach has 1,200+ exercise videos. Building or licensing an exercise video library is a content project, not a software project. It requires video hosting, CDN costs, and ongoing content maintenance. The coach (app owner with 90k followers) likely already creates exercise demonstration content.

**What to do instead:** Use exercise names with text notes (the existing `Exercise.notes` field: "Barbell or dumbbell", "Seat back, slow eccentric"). If the coach wants to link a video, allow a URL field on the exercise. Do not host video content.

---

### 4. Do NOT Build Multi-Coach / Team Features

**Why avoid:** This is a single-coach app for the app owner's coaching business. Multi-coach features (assistant coaches, team management, permission hierarchies) add significant complexity with zero value for the use case. TrainHeroic supports this because they serve university athletic programs. Trained does not need it.

**What to do instead:** Hardcode for single coach. `profiles.role === 'coach'` applies to exactly one user. If multi-coach is ever needed, it is a separate milestone.

---

### 5. Do NOT Build Payment / Subscription Management

**Why avoid:** Billing, invoicing, subscription management, and payment processing are entire product categories. Platforms like TrueCoach integrate with Stripe; this is weeks of development. The coach already has a payment flow (Lemon Squeezy license keys for access codes).

**What to do instead:** Continue using the existing Lemon Squeezy access code system for client onboarding. Clients pay through whatever external system the coach already uses and receive their access code.

---

### 6. Do NOT Build AI Workout Generation

**Why avoid:** TrueCoach recently added an AI Workout Builder. Building an AI-powered program generator requires LLM integration, prompt engineering, exercise safety validation, and testing across client profiles. It is a feature that sounds impressive but adds little value for a single coach who already knows how to program workouts. The coach's expertise IS the product.

**What to do instead:** Make the manual workout builder fast and efficient. Program templates (build once, assign to many) solve the efficiency problem without AI.

---

### 7. Do NOT Build Custom Check-in Form Builder

**Why avoid:** Everfit has a full form builder where coaches can create custom questionnaires. For a single coach, the question set is fixed -- they ask the same 10 questions every week. A form builder adds UI complexity (drag-and-drop, question types, conditional logic) that serves platform products, not single-coach products.

**What to do instead:** Hardcode the 10 standard check-in questions (listed in Table Stakes #5). If the coach needs to change a question, it is a code change, not a feature.

---

## Feature Dependencies

```
[Existing] coach_clients table + RLS policies
    |
    +--> [Enhance] Client invitation flow (shareable code/link)
    |
    +--> [Existing] Client roster (Coach.tsx)
            |
            +--> [Enhance] Role-based navigation
            |       |
            |       +--> Coach sees coach nav (Clients, Programs, Check-ins, Training, Settings)
            |       |
            |       +--> Client sees client nav (Home, Workouts, Macros, Avatar, Settings)
            |
            +--> [New] Workout programming
            |       |
            |       +--> [New] prescribed_workouts table (Supabase)
            |       |       |
            |       |       +--> [New] Client fetches prescribed workout (replaces template)
            |       |       |
            |       |       +--> [Differentiator] Prescribed vs Actual reporting
            |       |
            |       +--> [Differentiator] Program templates (build once, assign many)
            |
            +--> [Enhance] Macro target setting (coach UI for existing macro_targets table)
            |       |
            |       +--> [Differentiator] Training-day vs rest-day targets
            |
            +--> [New] Weekly check-ins
                    |
                    +--> [New] check_in_submissions table (Supabase)
                    |
                    +--> [New] Check-in form (client side)
                    |
                    +--> [New] Check-in review (coach side)
                    |
                    +--> Coach response to check-in
```

**Key dependency chain:**
1. Role-based navigation must come first (coach needs to access coach features)
2. Workout programming is independent of macro setting and check-ins
3. Macro setting is the simplest new feature (existing schema + RLS support it)
4. Check-ins are independent but inform macro/workout adjustments
5. Compliance rate (in roster) depends on workout programming existing first

---

## MVP Recommendation

For the coach dashboard milestone, prioritize in this order:

### Phase 1: Foundation (Role-Based Navigation + Client Invitation Enhancement)
1. Role-based navigation (coach vs client bottom nav)
2. Improve client invitation flow (shareable link/code)
3. Pending client visibility in roster

**Rationale:** Cannot build coach features if the coach cannot navigate to them. Must be first.

### Phase 2: Macro Target Setting
4. Coach UI to set/update client macro targets
5. Client fetches coach-set targets (overrides self-calculated)
6. Target change history/audit log

**Rationale:** Lowest complexity coach feature. Existing schema and RLS policies already support it. Quick win that delivers real coaching value.

### Phase 3: Workout Programming
7. Prescribed workout data model (Supabase table)
8. Coach workout builder UI (exercise selection, sets/reps/weight)
9. Day-by-day assignment to client calendar
10. Client fetches and displays prescribed workouts

**Rationale:** Core coaching feature. Higher complexity but essential. Depends on nothing from Phase 2, so could run in parallel, but sequencing after macros allows the coach to set up nutrition first (common coaching workflow).

### Phase 4: Weekly Check-ins
11. Check-in data model (Supabase table)
12. Client check-in form (10 standard questions)
13. Coach check-in review dashboard
14. Coach response to check-in

**Rationale:** Structured feedback loop. Depends on nothing from Phase 3, but logically comes after workouts and macros are in place (check-in questions reference workout adherence and nutrition).

### Defer to Later Milestone
- Progress photos (storage infrastructure)
- Training-day vs rest-day macro targets (schema change)
- Prescribed vs actual reporting (requires workout programming data)
- Program templates (requires workout programming first)
- In-app messaging (infrastructure heavy)
- Compliance rate on client cards (requires workout programming data)

---

## Sources

### HIGH Confidence
- Codebase analysis: `src/screens/Coach.tsx` (existing coach dashboard implementation)
- Codebase analysis: `src/stores/workoutStore.ts` (workout template system, exercise types)
- Codebase analysis: `src/stores/macroStore.ts` (macro calculation and tracking)
- Codebase analysis: `src/screens/CheckInModal.tsx` (existing daily check-in, distinct from weekly coaching check-in)
- Codebase analysis: `supabase/schema.sql` (existing tables, RLS policies, coach_client_summary view)
- Codebase analysis: `src/components/Navigation.tsx` (5-tab bottom nav structure)
- Codebase analysis: `src/App.tsx` (routing, role not enforced)
- [TrueCoach Dashboard Features](https://truecoach.co/features/dashboard/)
- [TrueCoach Program & Workout Builder](https://truecoach.co/features/program-workout-builder/)
- [TrueCoach Client Invitation Email](https://help.truecoach.co/en/articles/2403930-client-invitation-email)
- [TrueCoach Compliance Tracking](https://truecoach.co/features/compliance-tracking/)
- [Hevy Coach Workout Builder](https://hevycoach.com/features/workout-builder/)
- [Everfit Nutrition Coaching Macros](https://help.everfit.io/en/articles/4578482-nutrition-coaching-macros)
- [Everfit Forms & Questionnaires](https://help.everfit.io/en/articles/6633667-how-to-create-forms-questionnaires)

### MEDIUM Confidence
- [ISSA: How Many Clients Should a Personal Trainer Have](https://www.issaonline.com/blog/post/how-many-clients-should-a-personal-trainer-have) (15-25 typical)
- [MyPTHub: Essential Client Check-In Questions](https://www.mypthub.net/blog/essential-client-check-in-questions/)
- [HubFit: 10 Must-Ask Check-In Questions](https://hubfit.io/blog/10-questions-for-weekly-checkins)
- [Trainerize: Ultimate Guide to Onboarding New Fitness Clients](https://www.trainerize.com/blog/the-ultimate-guide-to-onboarding-new-fitness-clients/)
- [TrainHeroic Coach Features](https://www.trainheroic.com/coach/)
- [CoachRx Competitive Comparison](https://www.coachrx.app/coachrx-comparison)

### LOW Confidence
- Client roster scaling beyond 50 clients (no direct benchmark for creator-coach apps with 90k follower base; sizing is extrapolated)
