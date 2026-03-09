import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useOnboardingStore, ONBOARDING_SCREENS } from '@/stores'
import { Suspense, useEffect, useState } from 'react'
import { OnboardingSkeleton } from '@/components'
import {
  WelcomeScreen,
  ValueScreen,
  ProfileScreen,
  GoalScreen,
  ArchetypeScreen,
  MacrosScreen,
  PaywallScreen,
  FinalScreen,
} from '@/screens/onboarding-v2'
import { HealthDisclaimer } from '@/components/onboarding'
import { Button } from '@/components/ui/button'

export function OnboardingStack() {
  const currentStep = useOnboardingStore(s => s.currentStep)
  const { nextStep, prevStep } = useOnboardingStore()
  const navigate = useNavigate()
  const [disclaimerAcknowledged, setDisclaimerAcknowledged] = useState(false)

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
        <Route path="goal" element={<GoalScreen />} />
        <Route path="disclaimer" element={
          <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6 py-8">
            <div className="w-full max-w-md space-y-6">
              <div className="text-center space-y-2">
                <h1
                  className="text-3xl font-bold text-[#FAFAFA]"
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  Before You Begin
                </h1>
                <p className="text-[#A1A1AA]">Important health and safety information</p>
              </div>
              <HealthDisclaimer onAcknowledge={setDisclaimerAcknowledged} />
              <Button
                onClick={nextStep}
                disabled={!disclaimerAcknowledged}
                className="w-full h-12 bg-[#D4A853] text-[#0A0A0A] font-bold text-lg tracking-wider rounded-lg hover:bg-[#D4A853]/90 disabled:opacity-50"
                style={{ fontFamily: "'Oswald', sans-serif" }}
              >
                CONTINUE
              </Button>
              <button
                onClick={prevStep}
                className="w-full text-center text-sm text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        } />
        <Route path="archetype" element={<ArchetypeScreen />} />
        <Route path="macros" element={<MacrosScreen />} />
        <Route path="paywall" element={<PaywallScreen />} />
        <Route path="final" element={<FinalScreen />} />
        <Route path="*" element={<Navigate to="welcome" replace />} />
      </Routes>
    </Suspense>
  )
}
