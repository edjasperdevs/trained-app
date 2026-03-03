import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'
import {
  useUserStore,
  useWorkoutStore,
  useMacroStore,
  useAvatarStore,
  useSubscriptionStore,
  FitnessLevel,
  TrainingDays,
  Goal,
  AvatarBase,
  Gender,
  UnitSystem
} from '@/stores'
import type { Archetype } from '@/design/constants'
import { getDefaultDays } from '@/stores/workoutStore'
import { analytics } from '@/lib/analytics'
import { confirmAction } from '@/lib/confirm'
import { cn } from '@/lib/cn'
import { MacroCalculator } from '@/lib'
import { Activity, ShieldHalf, Zap, Dumbbell } from 'lucide-react'
import { toDisplayWeight, toInternalWeight, toDisplayHeight, toInternalHeight, getWeightUnit } from '@/lib/units'

type Step = 'welcome' | 'profile' | 'archetype' | 'macros' | 'initiate'

const ONBOARDING_STORAGE_KEY = 'onboarding-progress'

interface OnboardingProgress {
  step: Step
  data: OnboardingData
}

interface OnboardingData {
  username: string
  gender: Gender
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active'
  fitnessLevel: FitnessLevel
  trainingDaysPerWeek: TrainingDays
  weight: number
  height: number // in inches
  age: number
  goal: Goal
  avatarBase: AvatarBase
  archetype: Archetype
  units: UnitSystem
}

const ONBOARDING_STEPS: Step[] = ['welcome', 'profile', 'archetype', 'macros', 'initiate']

// Load saved progress from localStorage
const loadSavedProgress = (): OnboardingProgress | null => {
  try {
    const saved = localStorage.getItem(ONBOARDING_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // Validate that the saved step is valid in the new flow, otherwise discard
      if (ONBOARDING_STEPS.includes(parsed.step)) {
        return parsed
      }
    }
  } catch {
    // Ignore parse errors
  }
  return null
}

// Save progress to localStorage
const saveProgress = (step: Step, data: OnboardingData) => {
  try {
    const progress: OnboardingProgress = { step, data }
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Ignore storage errors
  }
}

// Clear saved progress
const clearProgress = () => {
  try {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY)
  } catch {
    // Ignore errors
  }
}

const defaultOnboardingData: OnboardingData = {
  username: '',
  gender: 'male',
  activityLevel: 'moderate',
  fitnessLevel: 'beginner',
  trainingDaysPerWeek: 3,
  weight: 150,
  height: 68,
  age: 25,
  goal: 'maintain',
  avatarBase: 'dominant',
  archetype: 'bro',
  units: 'imperial'
}

export function Onboarding() {
  const navigate = useNavigate()
  const { initProfile, completeOnboarding } = useUserStore()
  const { setPlan } = useWorkoutStore()
  const { calculateMacros } = useMacroStore()
  const { setBaseCharacter } = useAvatarStore()

  // Load saved progress on mount
  const savedProgress = loadSavedProgress()

  const [step, setStep] = useState<Step>(savedProgress?.step || 'welcome')
  const [_direction, setDirection] = useState(1)
  const [data, setData] = useState<OnboardingData>(savedProgress?.data || defaultOnboardingData)

  const currentIndex = ONBOARDING_STEPS.indexOf(step)

  // Save progress whenever step or data changes (except for evolution step)
  useEffect(() => {
    if (step !== 'initiate') {
      saveProgress(step, data)
    }
  }, [step, data])

  const goNext = () => {
    if (currentIndex < ONBOARDING_STEPS.length - 1) {
      if (step === 'welcome') {
        analytics.onboardingStarted()
      }
      setDirection(1)
      setStep(ONBOARDING_STEPS[currentIndex + 1])
    }
  }

  const goBack = () => {
    if (currentIndex > 0) {
      setDirection(-1)
      setStep(ONBOARDING_STEPS[currentIndex - 1])
    }
  }

  const finishOnboarding = () => {
    clearProgress()

    let days: 3 | 4 | 5 = 3
    if (data.activityLevel === 'moderate') days = 4
    if (data.activityLevel === 'active') days = 5

    const selectedDays = getDefaultDays(days)

    data.trainingDaysPerWeek = days;
    data.fitnessLevel = days === 5 ? 'advanced' : days === 4 ? 'intermediate' : 'beginner';

    initProfile(data)
    setPlan(days, selectedDays)
    calculateMacros(data.weight, data.height, data.age, data.gender, data.goal, data.activityLevel)
    setBaseCharacter(data.avatarBase)
    completeOnboarding()

    analytics.onboardingCompleted(days)

    setDirection(1)
    setStep('initiate')
  }

  const finishInitiation = () => {
    navigate('/')
  }

  // Emergency skip - completes onboarding with current/default data
  const handleSkip = async () => {
    if (!await confirmAction('Skip setup and use default settings?', 'Skip Setup')) {
      return
    }
    clearProgress()

    const finalData = {
      ...defaultOnboardingData,
      ...data,
      username: data.username || 'Trainee'
    }

    initProfile(finalData)
    setPlan(4, getDefaultDays(4)) // Default to 4 days if skipped
    calculateMacros(finalData.weight, finalData.height, finalData.age, finalData.gender, finalData.goal, finalData.activityLevel)
    setBaseCharacter(finalData.avatarBase)
    completeOnboarding()

    navigate('/')
  }

  const updateData = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
    setData(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div data-testid="onboarding-screen" className="min-h-screen flex flex-col px-5 pt-8 pb-24 relative">
      {/* Skip/Close button - appears after welcome, hidden during level up */}
      {step !== 'welcome' && step !== 'initiate' && (
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 py-2 px-3 flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors z-10"
          aria-label="Skip setup"
          title="Skip setup"
        >
          Skip <X size={16} className="mb-[1px]" />
        </button>
      )}

      {/* Progress indicator */}
      {step !== 'welcome' && (
        <div data-testid="onboarding-progress" className="mb-8">
          <p className="text-center text-xs text-muted-foreground mb-2">
            Step {currentIndex} of {ONBOARDING_STEPS.length - 1}
          </p>
          <div className="flex gap-1 justify-center">
            {ONBOARDING_STEPS.slice(1).map((s, i) => (
              <div
                key={s}
                className={cn(
                  'h-1 w-8 rounded-full transition-colors',
                  i < currentIndex ? 'bg-primary' : 'bg-secondary'
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="flex-1 flex items-start justify-center overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait" custom={_direction}>
          <motion.div
            key={step}
            custom={_direction}
            initial={{ opacity: 0, x: _direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: _direction * -40 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-md my-auto"
          >
            {step === 'welcome' && <WelcomeStep onNext={goNext} />}
            {step === 'profile' && (
              <ProfileStep
                data={data}
                onChange={updateData}
                onNext={goNext}
                onBack={goBack}
              />
            )}
            {step === 'archetype' && (
              <ArchetypeStep
                value={data.archetype}
                onChange={(v) => updateData('archetype', v)}
                onNext={goNext}
                onBack={goBack}
              />
            )}
            {step === 'macros' && (
              <MacrosStep
                data={data}
                onChange={updateData}
                onNext={finishOnboarding}
                onBack={goBack}
              />
            )}
            {step === 'initiate' && (
              <InitiationStep
                username={data.username}
                avatarBase={data.avatarBase}
                onContinue={finishInitiation}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// Step Components

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="-mx-5 -mt-8 min-h-screen flex flex-col bg-[#0A0A0A] relative overflow-hidden">
      {/* Bottom lime glow */}
      <div className="absolute bottom-0 left-0 right-0 h-[35%] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(200,255,0,0.09) 0%, transparent 70%)' }}
      />

      {/* Avatar hero */}
      <div className="flex-1 flex items-end justify-center px-16 pb-0" style={{ maxHeight: '52vh' }}>
        <div className="w-full max-w-[180px]">
          {/* Minimal SVG athlete silhouette */}
          <svg viewBox="0 0 200 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <ellipse cx="100" cy="296" rx="52" ry="9" fill="#C8FF00" fillOpacity="0.12" />
            <path d="M78 220 L68 295 L80 295 L92 245 L92 220Z" fill="#26282B" stroke="#C8FF00" strokeWidth="1" strokeOpacity="0.55" />
            <path d="M122 220 L132 295 L120 295 L108 245 L108 220Z" fill="#26282B" stroke="#C8FF00" strokeWidth="1" strokeOpacity="0.55" />
            <rect x="66" y="292" width="16" height="5" rx="2" fill="#C8FF00" fillOpacity="0.35" />
            <rect x="118" y="292" width="16" height="5" rx="2" fill="#C8FF00" fillOpacity="0.35" />
            <path d="M72 140 L68 220 L132 220 L128 140 L120 130 L80 130Z" fill="#26282B" stroke="#1A1A1A" strokeWidth="0.5" />
            <path d="M72 140 L68 220" stroke="#C8FF00" strokeWidth="1.5" strokeOpacity="0.45" />
            <path d="M128 140 L132 220" stroke="#C8FF00" strokeWidth="1.5" strokeOpacity="0.45" />
            <path d="M72 140 L48 195 L58 200 L80 155 L80 135Z" fill="#26282B" stroke="#C8FF00" strokeWidth="1" strokeOpacity="0.55" />
            <path d="M128 140 L152 195 L142 200 L120 155 L120 135Z" fill="#26282B" stroke="#C8FF00" strokeWidth="1" strokeOpacity="0.55" />
            <path d="M48 195 L58 200" stroke="#C8FF00" strokeWidth="2" strokeOpacity="0.8" />
            <path d="M152 195 L142 200" stroke="#C8FF00" strokeWidth="2" strokeOpacity="0.8" />
            <path d="M66 138 Q76 130 86 138" stroke="#C8FF00" strokeWidth="1.5" strokeOpacity="0.9" />
            <path d="M114 138 Q124 130 134 138" stroke="#C8FF00" strokeWidth="1.5" strokeOpacity="0.9" />
            <rect x="91" y="108" width="18" height="24" rx="4" fill="#26282B" />
            <ellipse cx="100" cy="96" rx="22" ry="26" fill="#26282B" stroke="#1A1A1A" strokeWidth="0.5" />
            <path d="M82 84 Q100 68 118 84" stroke="#C8FF00" strokeWidth="1.5" strokeOpacity="0.7" />
          </svg>
        </div>
      </div>

      {/* Brand + CTA */}
      <div className="px-6 pb-10 pt-4">
        <h1
          className="text-5xl font-black text-[#FAFAFA] tracking-tight leading-none"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          WELLTRAINED
        </h1>
        <div className="h-px bg-[#C8FF00] my-4 w-full" />
        <p className="text-[#A1A1AA] text-xs tracking-[0.2em] uppercase mb-8">
          The Protocol. The Discipline. The Rank.
        </p>
        <button
          onClick={onNext}
          className="w-full py-4 rounded-xl font-black text-[#0A0A0A] text-sm tracking-widest uppercase bg-[#C8FF00] hover:bg-[#D4FF33] active:bg-[#B6E800] transition-all duration-150"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          START SETUP
        </button>
      </div>
    </div>
  )
}

export function ProfileStep({
  data,
  onChange,
  onNext,
  onBack
}: {
  data: OnboardingData
  onChange: <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => void
  onNext: () => void
  onBack: () => void
}) {
  const isMetric = data.units === 'metric'
  const displayWeight = isMetric ? toDisplayWeight(data.weight, 'metric') : data.weight
  const displayHeight = isMetric ? toDisplayHeight(data.height, 'metric') : data.height

  const handleWeightChange = (val: number) => {
    const internal = isMetric ? toInternalWeight(val, 'metric') : val
    onChange('weight', Math.max(0, internal))
  }
  const handleHeightChangeMetric = (val: number) => {
    const internal = toInternalHeight(val, 'metric')
    onChange('height', Math.max(0, internal))
  }
  const handleHeightImperial = (newInches: number) => onChange('height', Math.max(0, newInches))

  const feet = Math.floor(data.height / 12)
  const inches = data.height % 12

  const isValid = data.username.trim().length > 0 && data.weight > 0 && data.height > 0 && data.age > 0

  return (
    <div className="flex flex-col h-full relative animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="mb-6">
        <h1 className="text-4xl font-bold uppercase tracking-tight text-[#FAFAFA] mb-2" style={{ fontFamily: "'Oswald', sans-serif" }}>
          Build Your Profile
        </h1>
        <p className="text-[#A1A1AA] text-sm leading-relaxed">
          Your stats help us calculate your baseline macros and personalize your workout plan.
        </p>
      </div>

      <div className="flex flex-col gap-5 flex-1">
        {/* Name */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider ml-1">Callsign (Name)</label>
          <Input
            className="w-full bg-[#222222] border-0 rounded-xl px-4 py-4 text-white text-lg focus:ring-2 focus:ring-[#C8FF00] h-12"
            value={data.username}
            onChange={(e) => onChange('username', e.target.value)}
            placeholder="Enter your name"
          />
        </div>

        {/* Gender Selection */}
        <div className="grid grid-cols-2 gap-3 p-1 bg-[#222222] rounded-full mt-1">
          {[{ v: 'male', l: 'MALE' }, { v: 'female', l: 'FEMALE' }].map(opt => (
            <label key={opt.v} className="cursor-pointer relative flex items-center justify-center py-2.5 rounded-full transition-all duration-300">
              <input
                type="radio"
                name="gender"
                value={opt.v}
                checked={data.gender === opt.v}
                onChange={() => onChange('gender', opt.v as Gender)}
                className="peer sr-only"
              />
              <div className="absolute inset-0 bg-transparent peer-checked:bg-[#C8FF00] rounded-full transition-all shadow-none peer-checked:shadow-lg" />
              <span className="relative z-10 text-[#A1A1AA] peer-checked:text-black font-bold text-sm tracking-wide">
                {opt.l}
              </span>
            </label>
          ))}
        </div>

        {/* Units Toggle */}
        <div className="flex justify-end gap-2 mt-2">
          <button onClick={() => onChange('units', 'imperial')} className={cn('text-xs font-bold uppercase px-3 py-1 rounded-full border', !isMetric ? 'border-[#C8FF00] text-[#C8FF00] bg-[#C8FF00]/10' : 'border-transparent text-[#A1A1AA] hover:bg-[#222222]')}>Imperial</button>
          <button onClick={() => onChange('units', 'metric')} className={cn('text-xs font-bold uppercase px-3 py-1 rounded-full border', isMetric ? 'border-[#C8FF00] text-[#C8FF00] bg-[#C8FF00]/10' : 'border-transparent text-[#A1A1AA] hover:bg-[#222222]')}>Metric</button>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider ml-1">Age</label>
            <Input
              type="number"
              className="w-full bg-[#222222] border-0 rounded-xl px-4 py-4 text-white text-lg h-12 font-mono tabular-nums"
              value={data.age || ''}
              onChange={(e) => onChange('age', Number(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider ml-1">Weight</label>
            <div className="relative group">
              <Input
                type="number"
                className="w-full bg-[#222222] border-0 rounded-xl px-4 py-4 text-white text-lg h-12 font-mono tabular-nums pr-12"
                value={displayWeight || ''}
                onChange={(e) => handleWeightChange(Number(e.target.value))}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A1AA] font-mono text-sm">{getWeightUnit(data.units)}</span>
            </div>
          </div>
        </div>

        {/* Height */}
        <div className="flex flex-col gap-2 mb-2">
          <label className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider ml-1">Height</label>
          {isMetric ? (
            <div className="relative group">
              <Input
                type="number"
                className="w-full bg-[#222222] border-0 rounded-xl px-4 py-4 text-white text-lg h-12 font-mono tabular-nums pr-12"
                value={displayHeight || ''}
                onChange={(e) => handleHeightChangeMetric(Number(e.target.value))}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A1AA] font-mono text-sm">cm</span>
            </div>
          ) : (
            <div className="flex gap-4">
              <div className="relative flex-1 group">
                <Input type="number" value={feet || ''} onChange={(e) => handleHeightImperial(Number(e.target.value) * 12 + inches)} className="w-full bg-[#222222] border-0 rounded-xl px-4 py-4 text-white text-lg h-12 font-mono tabular-nums pr-12" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A1AA] font-mono text-sm">ft</span>
              </div>
              <div className="relative flex-1 group">
                <Input type="number" value={inches || ''} onChange={(e) => handleHeightImperial(feet * 12 + Number(e.target.value))} className="w-full bg-[#222222] border-0 rounded-xl px-4 py-4 text-white text-lg h-12 font-mono tabular-nums pr-12" max={11} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A1AA] font-mono text-sm">in</span>
              </div>
            </div>
          )}
        </div>

        {/* Goal */}
        <div className="flex flex-col gap-2 mb-4">
          <label className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider ml-1">Primary Goal</label>
          <div className="flex p-1 bg-[#222222] rounded-xl h-14">
            {[{ v: 'cut', l: 'Cut' }, { v: 'maintain', l: 'Maintain' }, { v: 'bulk', l: 'Build' }].map(opt => (
              <label key={opt.v} className="flex-1 cursor-pointer relative flex items-center justify-center rounded-lg transition-all duration-200">
                <input
                  type="radio"
                  name="goal"
                  value={opt.v}
                  checked={data.goal === opt.v}
                  onChange={() => onChange('goal', opt.v as Goal)}
                  className="peer sr-only"
                />
                <div className="absolute inset-0 bg-transparent peer-checked:bg-[#C8FF00] rounded-lg transition-all m-1 shadow-none peer-checked:shadow-sm" />
                <span className="relative z-10 text-[#A1A1AA] peer-checked:text-black font-semibold text-sm">
                  {opt.l}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <Button variant="ghost" onClick={onBack} size="lg">Back</Button>
        <Button
          onClick={onNext}
          disabled={!isValid}
          className="flex-1 font-bold text-[#0A0A0A] bg-[#C8FF00] hover:bg-[#D4FF33]"
          size="lg"
        >
          CONTINUE →
        </Button>
      </div>
    </div>
  )
}


export function MacrosStep({
  data,
  onChange,
  onNext,
  onBack
}: {
  data: OnboardingData
  onChange: <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => void
  onNext: () => void
  onBack: () => void
}) {
  const levels = [
    { id: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise', icon: ShieldHalf },
    { id: 'light', label: 'Light', desc: '1-2 days/week', icon: Activity },
    { id: 'moderate', label: 'Moderate', desc: '3-5 days/week', icon: Dumbbell },
    { id: 'active', label: 'Active', desc: '6-7 days/week', icon: Zap },
  ] as const

  // Automatically calculate macros based on current profile details
  const macros = useMemo(() => {
    return MacroCalculator.calculateDailyMacros(
      data.weight,
      data.height,
      data.age,
      data.gender,
      data.goal,
      data.activityLevel || 'moderate'
    )
  }, [data.weight, data.height, data.age, data.gender, data.goal, data.activityLevel])

  return (
    <div className="flex flex-col h-full relative animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="mb-6 mt-2">
        <h1 className="text-4xl font-bold uppercase text-[#FAFAFA] mb-1" style={{ fontFamily: "'Oswald', sans-serif" }}>
          Your Protocol
        </h1>
        <p className="text-[#A1A1AA] text-sm leading-relaxed">
          Targets calculated for your body and goal.
        </p>
      </div>

      <div className="flex mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C8FF00] rounded text-[#0A0A0A] font-bold text-[10px] uppercase tracking-widest shadow-[0_0_15px_rgba(200,255,0,0.15)]">
          {data.archetype} Archetype Applied
        </div>
      </div>

      {/* Hero Results Card */}
      <div className="relative w-full bg-[#26282B] border border-[#2E3035] rounded-xl p-6 mb-6 shadow-xl">
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#C8FF00] rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#C8FF00] rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#C8FF00] rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#C8FF00] rounded-br-lg" />

        <div className="text-center mb-6">
          <div className="text-6xl font-black text-[#C8FF00] leading-none tracking-tighter" style={{ fontFamily: "'Oswald', sans-serif" }}>
            {Math.round(macros.calories)}
          </div>
          <div className="text-[#A1A1AA] font-bold uppercase tracking-widest text-[10px] mt-2">kcal / day</div>
        </div>

        <div className="grid grid-cols-3 gap-4 border-t border-[#2E3035] pt-5">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-black text-[#FAFAFA]" style={{ fontFamily: "'Oswald', sans-serif" }}>{Math.round(macros.protein)}g</span>
            <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wider mt-1">Protein</span>
          </div>
          <div className="flex flex-col items-center border-x border-[#2E3035] px-2">
            <span className="text-2xl font-black text-[#FAFAFA]" style={{ fontFamily: "'Oswald', sans-serif" }}>{Math.round(macros.carbs)}g</span>
            <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wider mt-1">Carbs</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-black text-[#FAFAFA]" style={{ fontFamily: "'Oswald', sans-serif" }}>{Math.round(macros.fats)}g</span>
            <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wider mt-1">Fats</span>
          </div>
        </div>
      </div>

      {/* Activity Level Selection */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-widest mb-3">Activity Level</h3>
        <div className="grid grid-cols-2 gap-3">
          {levels.map(level => {
            const isSelected = data.activityLevel === level.id
            const Icon = level.icon
            return (
              <button
                key={level.id}
                onClick={() => onChange('activityLevel', level.id)}
                className={cn(
                  'text-left p-4 rounded-lg border-2 transition-all relative',
                  isSelected
                    ? 'bg-[#C8FF00]/10 border-[#C8FF00]'
                    : 'bg-[#1A1A1A] border-transparent opacity-70 hover:opacity-100'
                )}
              >
                {isSelected && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#C8FF00] shadow-[0_0_8px_rgba(200,255,0,0.8)]" />}
                <Icon className={cn("mb-2", isSelected ? "text-[#C8FF00]" : "text-[#A1A1AA]")} size={20} />
                <h4 className="text-[#FAFAFA] font-bold text-sm">{level.label}</h4>
                <p className={cn("text-xs mt-1 leading-tight", isSelected ? "text-[#C8FF00]/80" : "text-[#A1A1AA]")}>{level.desc}</p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex gap-3 mt-auto pt-6">
        <Button variant="ghost" onClick={onBack} size="lg">Back</Button>
        <Button
          onClick={onNext}
          className="flex-1 font-bold text-[#0A0A0A] bg-[#C8FF00] hover:bg-[#D4FF33]"
          size="lg"
        >
          LOCK IN TARGETS →
        </Button>
      </div>
    </div>
  )
}

const ARCHETYPES: { id: Archetype; name: string; focus: string; tagline: string; bonuses: string[]; isPro: boolean; imageUrl: string }[] = [
  { id: 'himbo', name: 'HIMBO', focus: 'Aesthetics', tagline: 'Built for the mirror. Training and nutrition are your pillars.', bonuses: ['+DP Training', '+DP Tracked Meals'], isPro: true, imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChCtwaZPuiEfWZmbdScpctOUlcbBWHObO3Ye5v1xaJnNQ9bfKrwRmrorXy8hL-WCaidQJfraL8sbwL5r-JyXtAb0HJThnYVXQJZZLp5ZpMpU6rxxZUIPV0_XDVVBpe26Ou2cAu9Ii-N4tl0V0Q2f2mb7IJ5MWeKVC8SkEj3HEJArk653mO_Y6lQWXKGmqG4cdIkE9kObu1fAIVG_retuYruqEg-zBnKFi2Uahtf80Xr30uR4hWTDnre_nzfFi8kklFlk4UhYu_B0o' },
  { id: 'brute', name: 'BRUTE', focus: 'Strength', tagline: 'Raw force. Lift heavy, sleep harder, grow stronger.', bonuses: ['+DP Training', '+DP 7h+ Sleep'], isPro: true, imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBa-IKEU70sHMug3nK47qLfeFitnROHB7QA1LMYQSCrwH3DmHTFWKkJ6w5JjanwFPWzH2TyDcORvaZOhPRqQT72hPgVhSMdo8zp-cx3sSwRkjXO9I4LkpdJRKhOsBg4w7NpjlpKx0AMt21U3jMRJcvJLQeuHR3r901Exd4Bqvh0qrH3pVnzt7IGeqOxZL1K3Y6k4hYP00n3USnUun5Q4yJXXwg5sn5Dm9pr3t1ApChBb-dRZlLrHUh2Z-bMMnsYzlKsHUOMPH5MxZQ' },
  { id: 'pup', name: 'PUP', focus: 'Endurance', tagline: 'You move. Distance and protein fuel your engine.', bonuses: ['+DP 10k+ Steps', '+DP Protein Target'], isPro: true, imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLtOmXFCI0w89T0JPnVqq3FuW3pAYG2Y2rD_7wPZZ-AvmYV2HnpDi3oegaEXnSTdVHAn0kUVRYOhV8RSZQvDC0SwZdMt4kp4S5vY3FDcBVxSdkOYXyTyyHVG2Asr4EW1DA-cFISjyvNYXr4ivcPruJkuZwXcV_qqdI7OLGjbbmcEh1GYcPNPUGXcFA_UvoaBzLTVfB5ZmfvyKLK7DKT3g-C9rST06_lPKDH_sMUPqY5n7iFQBHvxd0lokKT6ZCxtYrwZxXQQpFI9k' },
  { id: 'bull', name: 'BULL', focus: 'Performance', tagline: 'Peak output. Every metric matters — including your PRs.', bonuses: ['+DP Training', '+DP Protein', '+DP Sleep', '+50 DP New PR'], isPro: true, imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLtOmXFCI0w89T0JPnVqq3FuW3pAYG2Y2rD_7wPZZ-AvmYV2HnpDi3oegaEXnSTdVHAn0kUVRYOhV8RSZQvDC0SwZdMt4kp4S5vY3FDcBVxSdkOYXyTyyHVG2Asr4EW1DA-cFISjyvNYXr4ivcPruJkuZwXcV_qqdI7OLGjbbmcEh1GYcPNPUGXcFA_UvoaBzLTVfB5ZmfvyKLK7DKT3g-C9rST06_lPKDH_sMUPqY5n7iFQBHvxd0lokKT6ZCxtYrwZxXQQpFI9k' },
  { id: 'bro', name: 'BRO', focus: 'Generalist', tagline: 'Balanced approach across all actions. Always free.', bonuses: ['Balanced DP across all'], isPro: false, imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBa-IKEU70sHMug3nK47qLfeFitnROHB7QA1LMYQSCrwH3DmHTFWKkJ6w5JjanwFPWzH2TyDcORvaZOhPRqQT72hPgVhSMdo8zp-cx3sSwRkjXO9I4LkpdJRKhOsBg4w7NpjlpKx0AMt21U3jMRJcvJLQeuHR3r901Exd4Bqvh0qrH3pVnzt7IGeqOxZL1K3Y6k4hYP00n3USnUun5Q4yJXXwg5sn5Dm9pr3t1ApChBb-dRZlLrHUh2Z-bMMnsYzlKsHUOMPH5MxZQ' },
]

function ArchetypeStep({
  value,
  onChange,
  onNext,
  onBack
}: {
  value: Archetype
  onChange: (v: Archetype) => void
  onNext: () => void
  onBack: () => void
}) {
  const isPremium = useSubscriptionStore((s) => s.isPremium)
  const navigate = useNavigate()
  const [lockedArchetype, setLockedArchetype] = useState<typeof ARCHETYPES[0] | null>(null)

  return (
    <div>
      <p className="text-xs text-[#A1A1AA] uppercase tracking-widest mb-1">Choose Your Path</p>
      <h2
        className="text-3xl font-black text-[#FAFAFA] mb-1"
        style={{ fontFamily: "'Oswald', sans-serif" }}
      >
        ARCHETYPE
      </h2>
      <p className="text-[#A1A1AA] text-sm mb-5">
        Your archetype shapes how you earn Discipline Points.
      </p>

      {/* Pro badge note */}
      {!isPremium && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-[#26282B] border border-[#2E3035]">
          <span className="text-xs text-[#C8FF00]">💎</span>
          <p className="text-xs text-[#A1A1AA]">Specialized archetypes unlock with <span className="text-[#FAFAFA] font-medium">The Discipline</span> subscription</p>
        </div>
      )}

      <div className="space-y-3 mb-6">
        {ARCHETYPES.map((arch) => {
          const isSelected = value === arch.id
          const isLocked = arch.isPro && !isPremium
          return (
            <button
              key={arch.id}
              onClick={() => {
                if (isLocked) {
                  setLockedArchetype(arch)
                } else {
                  onChange(arch.id)
                }
              }}
              className={cn(
                'w-full text-left rounded-xl border transition-all duration-200 overflow-hidden relative group',
                isSelected
                  ? 'border-[#C8FF00] bg-[#26282B] shadow-[0_0_15px_rgba(200,255,0,0.15)]'
                  : 'border-[#2E3035] bg-[#26282B] hover:border-[#A1A1AA]/40',
                isLocked && 'opacity-60'
              )}
            >
              <div className="flex flex-row items-stretch">
                <div
                  className={cn(
                    'w-1/3 min-h-[140px] bg-cover bg-top bg-no-repeat transition-all duration-300',
                    isSelected ? 'grayscale-0 opacity-100' : 'grayscale opacity-60 group-hover:opacity-80'
                  )}
                  style={{ backgroundImage: `url('${arch.imageUrl}')` }}
                />
                <div className="flex-1 p-4 flex flex-col justify-center">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn('text-xl font-black tracking-wider leading-none', isSelected ? 'text-[#C8FF00]' : 'text-[#FAFAFA]')}
                          style={{ fontFamily: "'Oswald', sans-serif" }}
                        >
                          {arch.name}
                        </span>
                        {arch.isPro && (
                          <span className="text-[9px] font-bold bg-[#C8FF00] text-[#0A0A0A] px-1.5 py-0.5 rounded">PRO</span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#A1A1AA] mb-2 leading-snug">{arch.tagline}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {arch.bonuses.map(b => (
                          <span
                            key={b}
                            className={cn(
                              'text-[9px] px-1.5 py-0.5 rounded font-medium',
                              b.includes('+50') ? 'bg-amber-900/40 text-amber-400 border border-amber-700/40' :
                                isSelected ? 'bg-[#C8FF00]/15 text-[#C8FF00]' : 'bg-[#0A0A0A] text-[#A1A1AA]'
                            )}
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#C8FF00] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="#0A0A0A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button onClick={onNext} className="flex-1">Continue</Button>
      </div>

      {/* Locked Archetype Upsell Modal */}
      {/* Locked Archetype Upsell Modal */}
      <AnimatePresence>
        {lockedArchetype && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/70"
            onClick={() => setLockedArchetype(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lockedArchetype && (
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-50 w-full bg-[#26282B] rounded-t-2xl border-t border-x border-[#2E3035] p-6 pb-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="w-10 h-1 rounded-full bg-[#2E3035] mx-auto mb-5" />

            {/* PRO badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold bg-[#C8FF00] text-[#0A0A0A] px-2 py-0.5 rounded">PRO</span>
              <span className="text-xs text-[#A1A1AA] uppercase tracking-widest">Exclusive Archetype</span>
            </div>

            {/* Archetype name */}
            <h3
              className="text-4xl font-black text-[#FAFAFA] mb-1"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              {lockedArchetype.name}
            </h3>
            <p className="text-sm text-[#A1A1AA] mb-4">{lockedArchetype.tagline}</p>

            {/* Bonuses */}
            <div className="flex flex-wrap gap-2 mb-5">
              {lockedArchetype.bonuses.map(b => (
                <span
                  key={b}
                  className={cn(
                    'text-xs px-3 py-1 rounded-full font-medium',
                    b.includes('+50')
                      ? 'bg-amber-900/40 text-amber-400 border border-amber-700/40'
                      : 'bg-[#C8FF00]/10 text-[#C8FF00] border border-[#C8FF00]/20'
                  )}
                >
                  {b}
                </span>
              ))}
            </div>

            {/* Upgrade CTA */}
            <button
              onClick={() => navigate('/paywall')}
              className="w-full py-4 rounded-xl font-black text-[#0A0A0A] text-sm tracking-widest uppercase bg-[#C8FF00] hover:bg-[#D4FF33] transition-all duration-150 mb-3"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              UPGRADE TO THE DISCIPLINE
            </button>

            <button
              onClick={() => setLockedArchetype(null)}
              className="w-full py-2 text-sm text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
            >
              Continue as Bro (Free)
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}



function InitiationStep({
  username,
  onContinue
}: {
  username: string
  avatarBase: AvatarBase
  onContinue: () => void
}) {
  return (
    <div className="-mx-5 -mt-8 min-h-screen flex flex-col bg-[#0A0A0A] relative overflow-hidden">
      {/* Dramatic lime glow from center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(200,255,0,0.07) 0%, transparent 65%)' }}
      />
      {/* Floor glow */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[30%] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 100%, rgba(200,255,0,0.12) 0%, transparent 70%)' }}
      />

      {/* Rank label above avatar */}
      <div className="flex items-end justify-center pt-10 pb-2">
        <p
          className="text-xs text-[#A1A1AA] tracking-[0.3em] uppercase"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          RANK 1
        </p>
      </div>

      {/* Avatar */}
      <div className="flex justify-center px-16" style={{ height: '40vh' }}>
        <div className="w-full max-w-[170px]">
          <svg viewBox="0 0 200 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <ellipse cx="100" cy="296" rx="52" ry="9" fill="#C8FF00" fillOpacity="0.2" />
            <path d="M78 220 L68 295 L80 295 L92 245 L92 220Z" fill="#26282B" stroke="#C8FF00" strokeWidth="1.2" strokeOpacity="0.7" />
            <path d="M122 220 L132 295 L120 295 L108 245 L108 220Z" fill="#26282B" stroke="#C8FF00" strokeWidth="1.2" strokeOpacity="0.7" />
            <rect x="66" y="292" width="16" height="5" rx="2" fill="#C8FF00" fillOpacity="0.5" />
            <rect x="118" y="292" width="16" height="5" rx="2" fill="#C8FF00" fillOpacity="0.5" />
            <path d="M72 140 L68 220 L132 220 L128 140 L120 130 L80 130Z" fill="#26282B" stroke="#1A1A1A" strokeWidth="0.5" />
            <path d="M72 140 L68 220" stroke="#C8FF00" strokeWidth="2" strokeOpacity="0.6" />
            <path d="M128 140 L132 220" stroke="#C8FF00" strokeWidth="2" strokeOpacity="0.6" />
            <path d="M72 140 L48 195 L58 200 L80 155 L80 135Z" fill="#26282B" stroke="#C8FF00" strokeWidth="1.2" strokeOpacity="0.7" />
            <path d="M128 140 L152 195 L142 200 L120 155 L120 135Z" fill="#26282B" stroke="#C8FF00" strokeWidth="1.2" strokeOpacity="0.7" />
            <path d="M48 195 L58 200" stroke="#C8FF00" strokeWidth="2.5" strokeOpacity="0.9" />
            <path d="M152 195 L142 200" stroke="#C8FF00" strokeWidth="2.5" strokeOpacity="0.9" />
            <path d="M66 138 Q76 130 86 138" stroke="#C8FF00" strokeWidth="2" strokeOpacity="0.95" />
            <path d="M114 138 Q124 130 134 138" stroke="#C8FF00" strokeWidth="2" strokeOpacity="0.95" />
            <rect x="91" y="108" width="18" height="24" rx="4" fill="#26282B" />
            <ellipse cx="100" cy="96" rx="22" ry="26" fill="#26282B" stroke="#C8FF00" strokeWidth="0.5" strokeOpacity="0.3" />
            <path d="M82 84 Q100 68 118 84" stroke="#C8FF00" strokeWidth="2" strokeOpacity="0.85" />
          </svg>
        </div>
      </div>

      {/* INITIATE — massive lime */}
      <div className="px-6 text-center mt-2">
        <h1
          className="text-6xl font-black text-[#C8FF00] leading-none tracking-tight"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          INITIATE
        </h1>
        <div className="h-px bg-[#C8FF00] my-4 mx-auto w-full" />
      </div>

      {/* Stats row */}
      <div className="px-6 flex justify-around mb-4">
        {[['RANK', '1'], ['TOTAL DP', '0'], ['STATUS', 'ACTIVE']].map(([label, val]) => (
          <div key={label} className="text-center">
            <p
              className="text-lg font-bold text-[#FAFAFA]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {val}
            </p>
            <p className="text-[9px] text-[#A1A1AA] uppercase tracking-widest mt-0.5"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Message */}
      <div className="px-6">
        <p
          className="text-base font-bold text-[#FAFAFA] mb-1"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          THE PROTOCOL BEGINS NOW.
        </p>
        <p className="text-sm text-[#A1A1AA] leading-relaxed">
          {username ? `${username}, your` : 'Your'} rank, avatar, and targets are set. Every action from here builds toward mastery.
        </p>
      </div>

      {/* Achievement toast */}
      <div className="px-6 mt-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#26282B] border-l-2 border-l-[#C8FF00] border border-[#2E3035]">
          <span className="text-lg">🏅</span>
          <div>
            <p className="text-xs font-semibold text-[#FAFAFA]">First achievement unlocked</p>
            <p className="text-xs text-[#A1A1AA]">INITIATED</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-10 mt-auto pt-5">
        <button
          onClick={onContinue}
          className="w-full py-4 rounded-xl font-black text-[#0A0A0A] text-sm tracking-widest uppercase bg-[#C8FF00] hover:bg-[#D4FF33] transition-all duration-150"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          ENTER THE PROTOCOL →
        </button>
      </div>
    </div>
  )
}
