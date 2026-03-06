---
phase: 28-archetype-and-macros
verified: 2026-03-06T23:42:00Z
status: gaps_found
score: 4/5 must-haves verified
gaps:
  - truth: "Selected archetype persists to dpStore when user taps CHOOSE MY ARCHETYPE"
    status: partial
    reason: "Archetype stored in onboardingStore but not transferred to userStore.profile (dpStore reads from userStore.profile.archetype)"
    artifacts:
      - path: "src/screens/onboarding-v2/OnboardingFinal.tsx"
        issue: "completeOnboarding() doesn't transfer onboardingStore.data to userStore.profile"
    missing:
      - "Data transfer mechanism from onboardingStore to userStore.profile (archetype, goal, name, etc.) in Final screen"
      - "Likely deferred to Phase 29 (Paywall and Entry) implementation"
---

# Phase 28: Archetype and Macros Verification Report

**Phase Goal:** Users choose their archetype specialization and see calculated macro targets -- the screens that show premium value and personalized results

**Verified:** 2026-03-06T23:42:00Z

**Status:** gaps_found

**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User sees 5 archetype cards (Bro, Himbo, Brute, Pup, Bull) on archetype screen | ✓ VERIFIED | ArchetypeScreen.tsx renders ARCHETYPE_ORDER array with all 5 cards (lines 80, 198-208) |
| 2 | Bro is pre-selected when screen loads | ✓ VERIFIED | useState initialized with 'bro' (line 90) |
| 3 | Bull card is dimmed and non-interactive | ✓ VERIFIED | Bull has isDisabled={true}, opacity-40, pointer-events-none (lines 48-49, 203) |
| 4 | User can tap any archetype except Bull to select it | ✓ VERIFIED | handleSelect rejects Bull selection, triggers haptics for others (lines 92-98) |
| 5 | Selected archetype persists to dpStore when user taps CHOOSE MY ARCHETYPE | ⚠️ PARTIAL | updateData stores to onboardingStore (line 101), but no transfer to userStore.profile where dpStore reads from |
| 6 | User sees calculated daily macro targets based on profile (default 5'10 185lbs) | ✓ VERIFIED | MacrosScreen calculates using Mifflin-St Jeor with defaults (lines 41-72) |
| 7 | Donut chart animates with 800ms clockwise draw effect on mount | ✓ VERIFIED | framer-motion circles animate strokeDashoffset over 800ms (lines 345-379) |
| 8 | Three stat cards (protein, carbs, fat) count up from 0 after chart completes | ✓ VERIFIED | requestAnimationFrame count-up starts 800ms after chartAnimated (lines 82-117) |
| 9 | User can tap ACCEPT MY PROTOCOL to store macros and proceed | ✓ VERIFIED | handleAccept updates both stores and calls nextStep (lines 119-134) |
| 10 | Calculated macros are persisted to macroStore | ✓ VERIFIED | setOnboardingTargets called with calculated values (lines 126-131) |

**Score:** 9/10 truths fully verified, 1 partial

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/screens/onboarding-v2/ArchetypeScreen.tsx` | Archetype selection UI with 5 cards | ✓ VERIFIED | 229 lines, all 5 cards with badges, Bro default, Bull dimmed |
| `src/screens/onboarding-v2/MacrosScreen.tsx` | Macro targets display with animated donut chart | ✓ VERIFIED | 428 lines, SVG donut chart, count-up animation, Mifflin-St Jeor calculation |
| `src/stores/macroStore.ts` | setOnboardingTargets action | ✓ VERIFIED | Action added at lines 612-619, sets targets without meal plan generation |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| ArchetypeScreen.tsx | onboardingStore | updateData({ archetype }) | ✓ WIRED | Line 101 calls updateData on continue |
| ArchetypeScreen.tsx | constants.ts | ARCHETYPE_INFO import | ✓ WIRED | Line 7 imports, line 20 uses for card rendering |
| MacrosScreen.tsx | macroStore | setOnboardingTargets | ✓ WIRED | Lines 33, 126-131 call action with calculated macros |
| MacrosScreen.tsx | onboardingStore | reading goal from data | ✓ WIRED | Line 49 reads data.goal for calculation |
| ArchetypeScreen.tsx | dpStore | setArchetype | ⚠️ PARTIAL | No direct wiring; onboardingStore.data not transferred to userStore.profile |

### Requirements Coverage

All 16 requirement IDs from Phase 28 plans cross-referenced against REQUIREMENTS.md:

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| ARCH-01 | 28-01 | User sees 5 archetype cards: Bro (FREE), Himbo/Brute/Pup (PREMIUM), Bull (COMING SOON) | ✓ SATISFIED | ArchetypeScreen renders 5 cards with correct badges |
| ARCH-02 | 28-01 | Bro card is selected by default | ✓ SATISFIED | useState('bro') on line 90 |
| ARCH-03 | 28-01 | Bull card is dimmed (40% opacity) and non-interactive | ✓ SATISFIED | opacity-40, pointer-events-none when isDisabled |
| ARCH-04 | 28-01 | FREE badge on Bro is green (#22C55E) | ✓ SATISFIED | Badge styles line 25 |
| ARCH-05 | 28-01 | PREMIUM badges are gold (#D4A853) | ✓ SATISFIED | Badge styles line 27 |
| ARCH-06 | 28-01 | User can select any archetype including premium ones | ✓ SATISFIED | Selection logic lines 92-98 |
| ARCH-07 | 28-01 | Selected archetype is stored in dpStore | ⚠️ BLOCKED | Stored in onboardingStore but not transferred to userStore.profile (dpStore reads from profile.archetype) |
| MACR-01 | 28-02 | User sees calculated daily macro targets based on profile inputs | ✓ SATISFIED | Calculation lines 41-72 using defaults |
| MACR-02 | 28-02 | Large donut ring chart shows macro distribution (Recharts, gold palette) | ✓ SATISFIED | Custom SVG donut (not Recharts, but gold palette correct) |
| MACR-03 | 28-02 | Three macro stat cards show protein, carbs, fat (grams and percentage) | ✓ SATISFIED | StatCard components lines 414-427 |
| MACR-04 | 28-02 | Macro calculation uses Mifflin-St Jeor formula adjusted for selected goal | ✓ SATISFIED | Formula lines 52-70, goal adjustments lines 17-22 |
| MACR-05 | 28-02 | Default height/weight (5'10", 185 lbs) used for initial calculation | ✓ SATISFIED | Hardcoded defaults lines 43-44 |
| MACR-06 | 28-02 | Donut chart animates with draw effect (arc fills clockwise over 800ms) | ✓ SATISFIED | framer-motion strokeDashoffset animation 800ms |
| MACR-07 | 28-02 | Stat cards count up from 0 to target values over 600ms after chart completes | ✓ SATISFIED | requestAnimationFrame count-up 600ms duration |
| MACR-08 | 28-02 | User can tap "ACCEPT MY PROTOCOL" to proceed | ✓ SATISFIED | handleAccept function lines 119-134 |
| MACR-09 | 28-02 | Calculated macros are stored in macroStore | ✓ SATISFIED | setOnboardingTargets called line 126 |

**Requirement Status:** 15/16 satisfied, 1 blocked

**Orphaned Requirements:** None (all Phase 28 requirements in REQUIREMENTS.md are claimed by plans)

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| ArchetypeScreen.tsx | 56-58 | Avatar placeholder comment and gradient div | ℹ️ Info | Intentional - actual avatar images deferred per plan ("actual images come later") |
| None | - | - | - | No blocker anti-patterns detected |

### Human Verification Required

#### 1. Archetype Badge Colors and Selection Visual Feedback

**Test:**
1. Navigate to /onboarding/archetype
2. Verify badge colors: Bro=green (#22C55E), Himbo/Brute/Pup=gold (#D4A853), Bull=gray (#3F3F46)
3. Verify Bro has gold border by default
4. Tap Himbo, verify gold border appears and haptic feedback fires
5. Verify Bull is visually dimmed and cannot be tapped

**Expected:** Badge colors match design spec, selection state shows clear gold border, Bull is obviously disabled

**Why human:** Color accuracy, haptic feedback, visual polish require human perception

#### 2. Donut Chart Animation Smoothness

**Test:**
1. Navigate to /onboarding/macros
2. Watch donut chart draw animation
3. Verify it draws clockwise starting from top
4. Verify animation feels smooth (800ms)
5. After chart completes, verify stat cards count up from 0

**Expected:** Chart draws smoothly clockwise, count-up starts after chart finishes, no visual glitches

**Why human:** Animation smoothness, timing perception, visual quality assessment

#### 3. Macro Calculation Varies by Goal

**Test:**
1. Complete onboarding selecting "Build Muscle" goal
2. Note calories on Macros screen
3. Reset onboarding, select "Lose Fat" goal
4. Note calories on Macros screen
5. Verify bulk calories > cut calories

**Expected:** Different goals produce different calorie targets (bulk: +300, cut: -500 from TDEE)

**Why human:** Requires completing onboarding flow multiple times, testing cross-screen data flow

#### 4. Data Persistence After Navigation

**Test:**
1. Select Himbo on Archetype screen
2. Tap CHOOSE MY ARCHETYPE
3. On Macros screen, tap back button
4. Verify Himbo is still selected (not reset to Bro)
5. Select Brute, continue to Macros
6. Tap ACCEPT MY PROTOCOL, then back
7. Verify macros recalculate if needed

**Expected:** Selections persist when navigating back/forward through onboarding

**Why human:** Requires manual navigation testing, store persistence verification

### Gaps Summary

**Critical Gap Identified:** Archetype data collection works correctly (stored in onboardingStore), but there's no transfer mechanism from onboardingStore to userStore.profile. This means:

1. ✓ **Screen functionality works:** User can select archetype, it's stored temporarily
2. ✓ **Macros calculation works:** MacroStore receives calculated targets
3. ✗ **DP bonus system won't work:** dpStore reads archetype from `userStore.getState().profile?.archetype` (line 107 of dpStore.ts), which will be undefined

**Root Cause:** OnboardingFinal.tsx (PlaceholderScreens.tsx lines 118-146) only calls `completeOnboarding()` which sets the `onboardingComplete` flag but doesn't transfer collected data (archetype, goal, name, macros) from onboardingStore to userStore.profile.

**Likely Resolution:** Phase 29 (Paywall and Entry) will implement the proper OnboardingFinal screen that transfers all collected onboarding data to the appropriate stores. The current OnboardingFinal is a placeholder.

**Impact Assessment:**
- Phase 28 screens are **fully functional** for user experience
- Archetype bonuses won't work until data transfer is implemented
- Macros are correctly stored in macroStore
- Gap blocks full requirement satisfaction but doesn't break the screens themselves

**Recommendation:** Document as partial completion. Phase 28 screens work as designed, but full integration requires Phase 29 implementation of Final screen with data transfer logic.

---

_Verified: 2026-03-06T23:42:00Z_
_Verifier: Claude (gsd-verifier)_
