---
status: diagnosed
trigger: "Investigate root cause of Issue 2 from app audit."
created: 2026-03-09T00:00:00Z
updated: 2026-03-09T00:09:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED - Navigation buttons use hardcoded navigate() calls instead of onboarding store methods
test: Examined OnboardingStack.tsx disclaimer route implementation
expecting: Found direct navigate() calls that bypass store state management
next_action: Document root cause

## Symptoms

expected: After checking health disclaimer checkbox and clicking Continue, should advance to next onboarding screen. Back button should return to previous screen.
actual: Continue button does not advance to next screen. Back button does not return to previous screen. User is stuck.
errors: Unknown - need to check console
reproduction:
1. Complete profile/name entry in onboarding
2. Navigate to health disclaimer screen
3. Check the checkbox
4. Click Continue button - nothing happens
5. Click Back button - nothing happens
started: Discovered during app audit

## Eliminated

## Evidence

- timestamp: 2026-03-09T00:01:00Z
  checked: src/components/onboarding/HealthDisclaimer.tsx
  found: Component only handles checkbox state, has no navigation logic - expects parent to handle navigation
  implication: Navigation responsibility is in the parent component

- timestamp: 2026-03-09T00:02:00Z
  checked: src/navigation/OnboardingStack.tsx lines 36-65
  found: Disclaimer route (line 36) is inline JSX with hardcoded navigate() calls
  implication: Unlike other screens which are separate components, disclaimer uses direct navigation

- timestamp: 2026-03-09T00:03:00Z
  checked: OnboardingStack.tsx useEffect (lines 24-27)
  found: Effect syncs currentStep from store to URL with navigate(path, { replace: true })
  implication: Store state controls navigation, but disclaimer buttons bypass the store

- timestamp: 2026-03-09T00:04:00Z
  checked: Continue button onClick (line 50)
  found: onClick={() => navigate('/onboarding/archetype')}
  implication: Directly navigates to 'archetype' route without updating store currentStep

- timestamp: 2026-03-09T00:05:00Z
  checked: Back button onClick (line 58)
  found: onClick={() => navigate('/onboarding/goal')}
  implication: Directly navigates to 'goal' route without updating store currentStep

- timestamp: 2026-03-09T00:06:00Z
  checked: OnboardingStack useEffect sync logic (lines 24-27)
  found: When currentStep changes, it calls navigate(path, { replace: true })
  implication: The store's currentStep immediately overwrites any manual navigation

- timestamp: 2026-03-09T00:07:00Z
  checked: ONBOARDING_SCREENS array (onboardingStore.ts lines 5-15)
  found: Screens: welcome(0), value(1), profile(2), goal(3), disclaimer(4), archetype(5), macros(6), paywall(7), final(8)
  implication: Disclaimer is step 4, archetype is step 5, goal is step 3

- timestamp: 2026-03-09T00:08:00Z
  checked: GoalScreen.tsx and ArchetypeScreen.tsx navigation patterns
  found: Both use const { nextStep, prevStep } = useOnboardingStore() and call these methods directly (GoalScreen line 18, 33, 92; ArchetypeScreen line 109, 122)
  implication: The CORRECT pattern is to use store methods, not direct navigate() calls. Disclaimer screen is the ONLY screen using the wrong pattern.

## Resolution

root_cause: Navigation conflict between hardcoded navigate() calls and store-controlled routing. The disclaimer screen buttons (lines 50, 58 in OnboardingStack.tsx) use navigate() directly to change routes, but the useEffect (lines 24-27) immediately overwrites those route changes by forcing the route to match the store's currentStep. Since the buttons never update currentStep, the useEffect constantly resets the URL back to the disclaimer route, making navigation appear broken. User clicks Continue → URL briefly changes to /archetype → useEffect sees currentStep is still 4 (disclaimer) → forces URL back to /disclaimer. Same happens with Back button. All other onboarding screens (GoalScreen, ArchetypeScreen, etc.) correctly use nextStep() and prevStep() from the store.
fix: Replace direct navigate() calls with store methods (nextStep/prevStep)
verification: N/A (diagnosis only)
files_changed: [src/navigation/OnboardingStack.tsx]
