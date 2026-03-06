import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useOnboardingStore, ONBOARDING_SCREENS } from '@/stores'
import { Suspense, useEffect } from 'react'
import { OnboardingSkeleton } from '@/components'
import {
  WelcomeScreen,
  OnboardingValue,
  OnboardingProfile,
  OnboardingGoal,
  OnboardingArchetype,
  OnboardingMacros,
  OnboardingPaywall,
  OnboardingFinal,
} from '@/screens/onboarding-v2'

export function OnboardingStack() {
  const currentStep = useOnboardingStore(s => s.currentStep)
  const navigate = useNavigate()

  // Sync URL to store step
  useEffect(() => {
    const path = `/onboarding/${ONBOARDING_SCREENS[currentStep]}`
    navigate(path, { replace: true })
  }, [currentStep, navigate])

  return (
    <Suspense fallback={<OnboardingSkeleton />}>
      <Routes>
        <Route path="welcome" element={<WelcomeScreen />} />
        <Route path="value" element={<OnboardingValue />} />
        <Route path="profile" element={<OnboardingProfile />} />
        <Route path="goal" element={<OnboardingGoal />} />
        <Route path="archetype" element={<OnboardingArchetype />} />
        <Route path="macros" element={<OnboardingMacros />} />
        <Route path="paywall" element={<OnboardingPaywall />} />
        <Route path="final" element={<OnboardingFinal />} />
        <Route path="*" element={<Navigate to="welcome" replace />} />
      </Routes>
    </Suspense>
  )
}
