import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Archetype } from '@/design/constants'

export const ONBOARDING_SCREENS = [
  'welcome',      // 0
  'value',        // 1
  'profile',      // 2
  'goal',         // 3
  'disclaimer',   // 4
  'archetype',    // 5
  'macros',       // 6
  'paywall',      // 7
  'final',        // 8
] as const

export type OnboardingScreen = typeof ONBOARDING_SCREENS[number]

export interface OnboardingData {
  name?: string
  units?: 'imperial' | 'metric'
  gender?: 'male' | 'female'
  age?: number
  weight?: number  // stored in lbs (internal format)
  height?: number  // stored in inches (internal format)
  trainingDays?: number
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced'
  goal?: 'build_muscle' | 'lose_fat' | 'get_stronger' | 'improve_fitness'
  archetype?: Archetype
  macros?: { protein: number; carbs: number; fat: number; calories: number }
}

interface OnboardingState {
  // Flow control
  currentStep: number // 0-8 for 9 screens

  // Collected data (populated as user progresses)
  data: OnboardingData

  // Actions
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  updateData: (partial: Partial<OnboardingData>) => void
  reset: () => void
}

const initialData: OnboardingData = {}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      currentStep: 0,
      data: initialData,

      setStep: (step: number) => {
        if (step >= 0 && step < ONBOARDING_SCREENS.length) {
          set({ currentStep: step })
        }
      },

      nextStep: () => {
        const { currentStep } = get()
        if (currentStep < ONBOARDING_SCREENS.length - 1) {
          set({ currentStep: currentStep + 1 })
        }
      },

      prevStep: () => {
        const { currentStep } = get()
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1 })
        }
      },

      updateData: (partial: Partial<OnboardingData>) => {
        set((state) => ({
          data: { ...state.data, ...partial }
        }))
      },

      reset: () => {
        set({ currentStep: 0, data: initialData })
      }
    }),
    {
      name: 'welltrained-onboarding-v2',
    }
  )
)
