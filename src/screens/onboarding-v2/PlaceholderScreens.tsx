import { Button } from '@/components/ui/button'
import { useOnboardingStore, ONBOARDING_SCREENS } from '@/stores'
import { useUserStore } from '@/stores'

interface PlaceholderScreenProps {
  title: string
  subtitle: string
  screenIndex: number
}

function PlaceholderScreen({ title, subtitle, screenIndex }: PlaceholderScreenProps) {
  const { nextStep, prevStep, currentStep } = useOnboardingStore()
  const isFirstScreen = screenIndex === 0
  const isLastScreen = screenIndex === ONBOARDING_SCREENS.length - 1

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
          Step {screenIndex + 1} of {ONBOARDING_SCREENS.length}
        </p>
        <h1 className="text-4xl font-black text-foreground mb-4" style={{ fontFamily: "'Oswald', sans-serif" }}>
          {title}
        </h1>
        <p className="text-muted-foreground mb-8">{subtitle}</p>

        <div className="flex gap-4 justify-center">
          {!isFirstScreen && (
            <Button variant="ghost" onClick={prevStep} className="px-8">
              Back
            </Button>
          )}
          {!isLastScreen && (
            <Button onClick={nextStep} className="px-8 bg-primary text-primary-foreground">
              Continue
            </Button>
          )}
        </div>

        <div className="mt-8 text-xs text-muted-foreground">
          Current step: {currentStep} ({ONBOARDING_SCREENS[currentStep]})
        </div>
      </div>
    </div>
  )
}

export function OnboardingWelcome() {
  return (
    <PlaceholderScreen
      title="Welcome"
      subtitle="Welcome to WellTrained. Let's get you set up."
      screenIndex={0}
    />
  )
}

export function OnboardingValue() {
  return (
    <PlaceholderScreen
      title="Value Proposition"
      subtitle="Here's what you'll get with WellTrained."
      screenIndex={1}
    />
  )
}

export function OnboardingProfile() {
  return (
    <PlaceholderScreen
      title="Your Profile"
      subtitle="Tell us about yourself to personalize your experience."
      screenIndex={2}
    />
  )
}

export function OnboardingGoal() {
  return (
    <PlaceholderScreen
      title="Your Goal"
      subtitle="What are you looking to achieve?"
      screenIndex={3}
    />
  )
}

export function OnboardingArchetype() {
  return (
    <PlaceholderScreen
      title="Choose Archetype"
      subtitle="Select your training archetype for personalized DP bonuses."
      screenIndex={4}
    />
  )
}

export function OnboardingMacros() {
  return (
    <PlaceholderScreen
      title="Your Macros"
      subtitle="We'll calculate your optimal nutrition targets."
      screenIndex={5}
    />
  )
}

export function OnboardingPaywall() {
  return (
    <PlaceholderScreen
      title="The Discipline"
      subtitle="Unlock premium features to accelerate your progress."
      screenIndex={6}
    />
  )
}

export function OnboardingFinal() {
  const completeOnboarding = useUserStore((s) => s.completeOnboarding)
  const { reset } = useOnboardingStore()

  const handleComplete = () => {
    reset() // Clear onboarding progress
    completeOnboarding() // Set flag in userStore
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
          Step 8 of 8
        </p>
        <h1 className="text-4xl font-black text-foreground mb-4" style={{ fontFamily: "'Oswald', sans-serif" }}>
          You're Ready
        </h1>
        <p className="text-muted-foreground mb-8">
          Your protocol is set. Time to begin your journey.
        </p>

        <Button onClick={handleComplete} className="px-8 bg-primary text-primary-foreground">
          Enter the Protocol
        </Button>
      </div>
    </div>
  )
}
