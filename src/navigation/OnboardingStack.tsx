import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useOnboardingStore, ONBOARDING_SCREENS } from '@/stores'
import { Suspense, useEffect } from 'react'
import { OnboardingSkeleton } from '@/components'
import {
  WelcomeScreen,
  ValueScreen,
  ProfileScreen,
  PhysicalStatsScreen,
  TrainingScreen,
  GoalScreen,
  ArchetypeScreen,
  MacrosScreen,
  PaywallScreen,
  FinalScreen,
  DisclaimerScreen,
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
        <Route path="value" element={<ValueScreen />} />
        <Route path="profile" element={<ProfileScreen />} />
        <Route path="physical-stats" element={<PhysicalStatsScreen />} />
        <Route path="training" element={<TrainingScreen />} />
        <Route path="goal" element={<GoalScreen />} />
        <Route path="disclaimer" element={<DisclaimerScreen />} />
        <Route path="archetype" element={<ArchetypeScreen />} />
        <Route path="macros" element={<MacrosScreen />} />
        <Route path="paywall" element={<PaywallScreen />} />
        <Route path="final" element={<FinalScreen />} />
        <Route path="*" element={<Navigate to="welcome" replace />} />
      </Routes>
    </Suspense>
  )
}
