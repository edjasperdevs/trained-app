# WellTrained — Onboarding Flow Brief
**Version:** 1.0  
**Status:** Ready for implementation  
**Reference files:** All screen mock-ups in `/design_research/onboarding_0X_*.png`

---

## Research Foundation

This onboarding flow is built on three conversion principles drawn from top-performing fitness and subscription apps:

**1. Value before ask.** The highest-converting flows (Rise Sleep, WHOOP) lead with a strong emotional hook — a statement of transformation — before asking for any personal information. Users need to feel the app understands them before they trust it with their data or their money.

**2. Paywall placement after investment.** The paywall performs best when placed *after* the user has already personalized the experience — after they've entered their name, selected their goal, and chosen their archetype. At that point, they've invested in the app and the cost of leaving is higher. Showing the paywall at step 7 of 8 (not step 1) is intentional.

**3. The reverse trial principle.** If a user dismisses the paywall, they should not be dumped into a degraded experience. Instead, offer a 7-day free trial of Premium automatically — no credit card required. This dramatically reduces early churn and gives users time to integrate premium features into their routine before the billing decision arrives.

---

## The 8-Screen Flow

| Step | Screen | Purpose | Key Conversion Action |
|---|---|---|---|
| 1 | Welcome | Hook and brand identity | BEGIN PROTOCOL |
| 2 | Value Proposition | Explain the system before asking anything | NEXT |
| 3 | Profile Setup | Name, units, training days, fitness level | CONTINUE |
| 4 | Goal Selection | What are you training for | CONTINUE |
| 5 | Archetype Selection | Choose your discipline specialization | CHOOSE MY ARCHETYPE |
| 6 | Macro Setup | Show calculated daily targets | ACCEPT MY PROTOCOL |
| 7 | Paywall | Premium upsell with 7-day free trial | START FREE TRIAL |
| 8 | Welcome to Protocol | Cinematic entry into the app | ENTER THE DISCIPLINE |

---

## Screen-by-Screen Direction

### Screen 1 — Welcome
**File:** `onboarding_01_welcome.png`

The first screen is a brand statement, not a form. The chain-link crown mark, the WELLTRAINED wordmark, and the three-line headline ("YOUR DISCIPLINE. YOUR RANK. YOUR LEGEND.") do all the work. The subline — "The Discipline System. Built for men who train with intention." — is the only explanatory copy on this screen.

The primary CTA is "BEGIN PROTOCOL" in the full-width gold button. The secondary link "Already initiated? Sign In" is small and below the button — it should not compete with the primary action.

The 5-dot progress indicator at the bottom sets the expectation that this is a short, purposeful flow.

**Design notes for implementation:**
- The logo mark and wordmark should animate in with a subtle fade-up on load (300ms, ease-out)
- The headline should stagger in line by line (150ms delay between each line)
- The button should pulse very subtly after 2 seconds if the user hasn't tapped — a single gentle scale pulse to draw attention

---

### Screen 2 — Value Proposition
**File:** `onboarding_02_value.png`

This screen is the "Rise Sleep moment" — a bold editorial statement that explains the system before asking for anything. The headline "IMAGINE A FITNESS APP THAT TRAINS YOU LIKE A CHAMPION" takes up most of the screen. Below it, three benefit rows with Lucide icons explain the DP system, the rank system, and the avatar system in plain language.

This screen should feel like a magazine spread, not a feature list. The icon-plus-text rows are supporting evidence for the headline, not the main event.

**Design notes for implementation:**
- No form elements on this screen — it is purely informational
- The three benefit rows should animate in with a stagger (100ms delay each) after the headline appears
- Consider a very subtle background texture (noise or grain at 3-5% opacity) to add depth without competing with the text

---

### Screen 3 — Profile Setup
**File:** `onboarding_03_profile.png`

The first data collection screen. Keep it to four inputs maximum: name, units (LBS/KG toggle), training days per week (2-6 selector chips), and fitness level (Beginner/Intermediate/Advanced cards). Do not ask for age, weight, height, or email on this screen — those belong elsewhere or can be inferred.

The gold border on the active/focused input field is the key visual feedback. The selected state on chips and cards should use a gold border with a very subtle gold background tint (#D4A853 at 8% opacity).

**Design notes for implementation:**
- The keyboard should push the form up smoothly — test this carefully on both iPhone SE and iPhone 15 Pro Max sizes
- Training days and fitness level selections should trigger a subtle haptic feedback (light impact)
- The CONTINUE button should be disabled (50% opacity) until the name field has at least one character

---

### Screen 4 — Goal Selection
**File:** `onboarding_04_goal.png`

Four goal cards: BUILD MUSCLE, LOSE FAT, GET STRONGER, IMPROVE OVERALL FITNESS. Each is a full-width charcoal card with a gold Lucide icon on the left and a two-line label on the right. Only one can be selected at a time. The selected card gets a gold border.

The goal selected here should be stored and used to personalize the dashboard greeting and the macro calculation on Screen 6.

**Design notes for implementation:**
- Tapping a card should trigger a light haptic and animate the gold border in (150ms ease-out)
- The CONTINUE button should be disabled until a goal is selected
- The goal value should be stored in the user profile store alongside name and fitness level

---

### Screen 5 — Archetype Selection
**File:** `onboarding_05_archetype.png`

Five archetype cards: BRO (FREE), HIMBO (PREMIUM), BRUTE (PREMIUM), PUP (PREMIUM), BULL (COMING SOON). The BRO card is selected by default. The BULL card is dimmed and non-interactive.

This screen is also a soft introduction to the premium offering — users see what they're missing before the paywall appears. The PREMIUM badge on three of the five cards plants the seed.

**Design notes for implementation:**
- Tapping a PREMIUM archetype card when the user is not yet premium should not block selection — let them select it, then handle the gate at the paywall screen. This creates desire before friction.
- The BULL card should have `pointer-events: none` and reduced opacity (40%)
- The FREE badge on BRO should be green (`#22C55E`) to signal accessibility
- The PREMIUM badges should be gold (`#D4A853`) to signal aspiration, not restriction
- Store the selected archetype in the user profile store — it will be applied after paywall resolution

---

### Screen 6 — Macro Setup
**File:** `onboarding_06_macros.png`

This screen shows the user their calculated daily macro targets based on their profile inputs. The large donut ring chart is the hero element — it should be rendered with Recharts (already in the codebase) using the gold palette. The three macro stat cards below (PROTEIN, CARBS, FAT) show grams and percentage.

The macro calculation should use the standard Mifflin-St Jeor formula adjusted for the user's selected goal:
- BUILD MUSCLE: +300 calorie surplus, 35% protein / 40% carbs / 25% fat
- LOSE FAT: -300 calorie deficit, 40% protein / 35% carbs / 25% fat
- GET STRONGER: maintenance calories, 30% protein / 40% carbs / 30% fat
- IMPROVE OVERALL FITNESS: maintenance calories, 30% protein / 40% carbs / 30% fat

Since height and weight have not been collected yet, use reasonable defaults (5'10", 185 lbs) for the calculation at this stage. The user can update their measurements in Profile settings after onboarding.

**Design notes for implementation:**
- The donut chart should animate in with a draw effect (the arc fills clockwise over 800ms)
- The three stat cards should count up from 0 to their target values over 600ms after the chart completes
- The note "These targets are calculated from your profile. Your coach may adjust them." is important — it sets the expectation that the coach (you) can override these values

---

### Screen 7 — Paywall
**File:** `onboarding_07_paywall.png`

The paywall appears after the user has completed their full profile setup. At this point they have named themselves, set their goal, chosen their archetype, and seen their macro targets. The investment is real. The paywall should feel like a natural next step, not a wall.

**Pricing structure to display:**
- Monthly: $9.99/month (7-day free trial, no charge today)
- Annual: $59.99/year (save 50%, equivalent to $5/month)

The monthly option with the free trial should be the visually prominent choice (gold border, MOST POPULAR label). The annual option is the secondary card below it.

**The reverse trial:** If the user taps the X or "Not now" (add a small skip link below the CTA), they should receive a 7-day free Premium trial automatically — no credit card required. This is handled via RevenueCat's promotional entitlement system. The skip link copy should read: "Continue with free access" — not "Skip" or "No thanks."

**Design notes for implementation:**
- RevenueCat is already integrated — use `Purchases.purchasePackage()` for the trial flow
- The paywall screen should not show the back arrow — this is a decision point, not a navigation step
- If the user is already premium (returning user), skip this screen entirely
- Apple App Store guidelines prohibit toggle-style free trial UI — the current card design is compliant

---

### Screen 8 — Welcome to Protocol
**File:** `onboarding_08_welcome.png`

The final screen is a cinematic reward. The avatar appears for the first time, the rank card shows "UNINITIATED" with the DP progress bar at zero, and the CTA is "ENTER THE DISCIPLINE." This screen should feel earned — the user has completed the protocol and is now ready to begin.

The rank card showing "0 of 250 DP to Initiate" is important — it immediately teaches the user what they're working toward and makes the first workout feel urgent.

**Design notes for implementation:**
- The avatar should fade in with a subtle scale-up (from 0.95 to 1.0 over 400ms)
- The rank card should slide up from below (translateY 20px to 0 over 400ms, 200ms delay)
- The CTA button should pulse once after 1 second to draw attention
- Tapping ENTER THE DISCIPLINE should navigate to the Home tab and clear the onboarding stack from navigation history

---

## Data Collected During Onboarding

By the end of the flow, the following data should be stored in the user profile store:

| Field | Source Screen | Store Location |
|---|---|---|
| `name` | Screen 3 | `userStore.name` |
| `units` | Screen 3 | `userStore.units` |
| `trainingDaysPerWeek` | Screen 3 | `userStore.trainingDaysPerWeek` |
| `fitnessLevel` | Screen 3 | `userStore.fitnessLevel` |
| `primaryGoal` | Screen 4 | `userStore.primaryGoal` |
| `archetype` | Screen 5 | `dpStore.archetype` |
| `calorieTarget` | Screen 6 (calculated) | `macroStore.calorieTarget` |
| `proteinTarget` | Screen 6 (calculated) | `macroStore.proteinTarget` |
| `carbTarget` | Screen 6 (calculated) | `macroStore.carbTarget` |
| `fatTarget` | Screen 6 (calculated) | `macroStore.fatTarget` |
| `isPremium` | Screen 7 (RevenueCat) | `userStore.isPremium` |
| `onboardingComplete` | Screen 8 | `userStore.onboardingComplete` |

---

## Navigation Architecture

The onboarding flow should be a separate navigation stack from the main app. When `onboardingComplete` is `false`, the app should render the onboarding stack. When `true`, it renders the main tab navigator.

```
App.tsx
├── OnboardingStack (when !onboardingComplete)
│   ├── Welcome
│   ├── ValueProposition
│   ├── ProfileSetup
│   ├── GoalSelection
│   ├── ArchetypeSelection
│   ├── MacroSetup
│   ├── Paywall
│   └── WelcomeToProtocol
└── MainTabNavigator (when onboardingComplete)
    ├── Home
    ├── Workout
    ├── Fuel
    └── Profile
```

---

## Conversion Optimization Notes

**Progress indicator:** The 5-dot progress indicator at the top of screens 2-6 is critical. It sets the expectation that the flow is short and finite. Research consistently shows that users are more likely to complete onboarding when they can see how far they are from the end.

**Button copy:** Every CTA in this flow uses active, protocol-language copy ("BEGIN PROTOCOL," "CHOOSE MY ARCHETYPE," "ACCEPT MY PROTOCOL," "ENTER THE DISCIPLINE"). This is not generic ("Next," "Continue," "Get Started"). The copy reinforces the WellTrained identity at every tap.

**No email wall:** The user is not asked for an email address during onboarding. Email collection happens in Profile settings after the user is already engaged. Requiring email before showing value is one of the most common causes of onboarding abandonment.

**Archetype desire before paywall:** Showing the PREMIUM archetype cards on Screen 5 before the paywall on Screen 7 creates desire before friction. The user has already "chosen" their premium archetype in their mind before they see the price.

**The reverse trial:** If implemented, this single tactic is documented to increase trial conversion by 30-50% in comparable apps. The key is that the user gets full access immediately — no credit card, no friction — and the billing decision arrives after they've already integrated the premium features into their routine.
