import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dumbbell,
  Sword,
  Wand2,
  Beef,
  Zap,
  Shield,
  Circle,
  Sprout,
  Footprints,
  Trophy,
  Star,
  Crown,
  Home,
  TrendingUp as ChartUp,
  LucideIcon
} from 'lucide-react'

// Map icon names to Lucide components for evolution stages
const STAGE_ICON_MAP: Record<string, LucideIcon> = {
  Circle, Zap, Sprout, Footprints, Dumbbell, Sword, Shield, Flame: Zap,
  Trophy, Bolt: Zap, Sparkles: Star, Star, Crown
}
import {
  useUserStore,
  useWorkoutStore,
  useMacroStore,
  useAvatarStore,
  useXPStore,
  FitnessLevel,
  TrainingDays,
  Goal,
  AvatarBase,
  Gender,
  UnitSystem,
  DayOfWeek
} from '@/stores'
import { EVOLUTION_STAGES } from '@/stores/avatarStore'
import { analytics } from '@/lib/analytics'
import { LABELS, AVATAR_STAGES } from '@/design/constants'
import { cn } from '@/lib/cn'

type Step = 'welcome' | 'name' | 'gender' | 'fitness' | 'days' | 'schedule' | 'goal' | 'avatar' | 'features' | 'tutorial' | 'evolution'

const ONBOARDING_STORAGE_KEY = 'onboarding-progress'

interface OnboardingProgress {
  step: Step
  data: OnboardingData
}

interface OnboardingData {
  username: string
  gender: Gender
  fitnessLevel: FitnessLevel
  trainingDaysPerWeek: TrainingDays
  selectedDays: DayOfWeek[]
  weight: number
  height: number // in inches
  age: number
  goal: Goal
  avatarBase: AvatarBase
  units: UnitSystem
}

// Default workout days for each training frequency
const getDefaultDays = (trainingDays: TrainingDays): DayOfWeek[] => {
  switch (trainingDays) {
    case 3:
      return [1, 3, 5] // Mon, Wed, Fri
    case 4:
      return [1, 2, 4, 5] // Mon, Tue, Thu, Fri
    case 5:
      return [1, 2, 3, 4, 5] // Mon-Fri
    default:
      return [1, 3, 5]
  }
}

// Load saved progress from localStorage
const loadSavedProgress = (): OnboardingProgress | null => {
  try {
    const saved = localStorage.getItem(ONBOARDING_STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
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
  fitnessLevel: 'beginner',
  trainingDaysPerWeek: 3,
  selectedDays: [1, 3, 5], // Mon, Wed, Fri default
  weight: 150,
  height: 68, // 5'8"
  age: 25,
  goal: 'maintain',
  avatarBase: 'dominant',
  units: 'imperial'
}

export function Onboarding() {
  const navigate = useNavigate()
  const { initProfile, completeOnboarding } = useUserStore()
  const { setPlan } = useWorkoutStore()
  const { calculateMacros } = useMacroStore()
  const { setBaseCharacter, updateEvolutionStage } = useAvatarStore()
  const { completeOnboarding: completeXPOnboarding } = useXPStore()

  // Load saved progress on mount
  const savedProgress = loadSavedProgress()

  const [step, setStep] = useState<Step>(savedProgress?.step || 'welcome')
  const [_direction, setDirection] = useState(1)
  const [data, setData] = useState<OnboardingData>(savedProgress?.data || defaultOnboardingData)

  const steps: Step[] = ['welcome', 'name', 'gender', 'fitness', 'days', 'schedule', 'goal', 'avatar', 'features', 'tutorial']
  const currentIndex = steps.indexOf(step)

  // Save progress whenever step or data changes (except for evolution step)
  useEffect(() => {
    if (step !== 'evolution') {
      saveProgress(step, data)
    }
  }, [step, data])

  const goNext = () => {
    if (currentIndex < steps.length - 1) {
      if (step === 'welcome') {
        analytics.onboardingStarted()
      }
      setDirection(1)
      setStep(steps[currentIndex + 1])
    }
  }

  const goBack = () => {
    if (currentIndex > 0) {
      setDirection(-1)
      setStep(steps[currentIndex - 1])
    }
  }

  const finishOnboarding = () => {
    // Clear saved onboarding progress since we're completing
    clearProgress()

    // Initialize all stores with the data
    initProfile(data)
    setPlan(data.trainingDaysPerWeek, data.selectedDays)
    calculateMacros(data.weight, data.height, data.age, data.gender, data.goal, 'moderate')
    setBaseCharacter(data.avatarBase)
    completeOnboarding()

    // Trigger level up from 0 to 1 and evolution from Egg to Hatchling
    completeXPOnboarding()
    updateEvolutionStage(1)

    // Track analytics
    analytics.onboardingCompleted(data.trainingDaysPerWeek)

    // Show the evolution animation
    setDirection(1)
    setStep('evolution')
  }

  const finishEvolution = () => {
    navigate('/')
  }

  const updateData = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
    setData(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div data-testid="onboarding-screen" className="min-h-screen flex flex-col px-5 pt-8 pb-24">
      {/* Progress indicator */}
      {step !== 'welcome' && (
        <div data-testid="onboarding-progress" className="mb-8">
          <p className="text-center text-xs text-muted-foreground mb-2">
            Step {currentIndex} of {steps.length - 1}
          </p>
          <div className="flex gap-1 justify-center">
            {steps.slice(1).map((s, i) => (
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
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md animate-in fade-in duration-300">
          {step === 'welcome' && <WelcomeStep onNext={goNext} />}
          {step === 'name' && (
            <NameStep
              value={data.username}
              onChange={(v) => updateData('username', v)}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 'gender' && (
            <GenderStep
              value={data.gender}
              onChange={(v) => updateData('gender', v)}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 'fitness' && (
            <FitnessStep
              value={data.fitnessLevel}
              onChange={(v) => updateData('fitnessLevel', v)}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 'days' && (
            <DaysStep
              value={data.trainingDaysPerWeek}
              onChange={(v) => {
                updateData('trainingDaysPerWeek', v)
                updateData('selectedDays', getDefaultDays(v))
              }}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 'schedule' && (
            <ScheduleStep
              trainingDays={data.trainingDaysPerWeek}
              selectedDays={data.selectedDays}
              onChange={(v) => updateData('selectedDays', v)}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 'goal' && (
            <GoalStep
              weight={data.weight}
              height={data.height}
              age={data.age}
              goal={data.goal}
              onWeightChange={(v) => updateData('weight', v)}
              onHeightChange={(v) => updateData('height', v)}
              onAgeChange={(v) => updateData('age', v)}
              onGoalChange={(v) => updateData('goal', v)}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 'avatar' && (
            <AvatarStep
              value={data.avatarBase}
              onChange={(v) => updateData('avatarBase', v)}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 'features' && (
            <FeaturesStep
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 'tutorial' && (
            <TutorialStep
              username={data.username}
              onFinish={finishOnboarding}
              onBack={goBack}
            />
          )}
          {step === 'evolution' && (
            <EvolutionStep
              username={data.username}
              avatarBase={data.avatarBase}
              onContinue={finishEvolution}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Step Components

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center">
      <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
        <h1 className="text-4xl font-bold mb-4">
          Trained
        </h1>
      </div>
      <div className="animate-in fade-in duration-500 delay-500">
        <p className="text-lg text-muted-foreground mb-6">
          The protocol for building discipline through fitness.
        </p>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          This is not a game. This is a system.<br />
          Track your workouts. Hit your macros.<br />
          Report in daily. Earn your rank.
        </p>
        <p className="text-sm text-muted-foreground mb-8 italic">
          Structure creates freedom.
        </p>
      </div>
      <Button onClick={onNext} className="w-full" size="lg">
        Start
      </Button>
    </div>
  )
}

function NameStep({
  value,
  onChange,
  onNext,
  onBack
}: {
  value: string
  onChange: (v: string) => void
  onNext: () => void
  onBack: () => void
}) {
  return (
    <div data-testid="onboarding-step-2">
      <h2 className="text-2xl font-bold mb-2">
        What should we call you?
      </h2>
      <p className="text-muted-foreground mb-6">
        This is how the protocol will address you.
      </p>

      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter your name..."
        className="h-12 mb-6"
        maxLength={20}
        autoFocus
        data-testid="onboarding-username-input"
      />

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack} data-testid="onboarding-back-button">
          Back
        </Button>
        <Button onClick={onNext} className="flex-1" disabled={!value.trim()} data-testid="onboarding-next-button">
          Continue
        </Button>
      </div>
    </div>
  )
}

function GenderStep({
  value,
  onChange,
  onNext,
  onBack
}: {
  value: Gender
  onChange: (v: Gender) => void
  onNext: () => void
  onBack: () => void
}) {
  const options: { gender: Gender; label: string }[] = [
    { gender: 'male', label: 'Male' },
    { gender: 'female', label: 'Female' }
  ]

  return (
    <div data-testid="onboarding-step-3">
      <h2 className="text-2xl font-bold mb-2">
        Biological sex
      </h2>
      <p className="text-muted-foreground mb-6">
        Used for accurate metabolic calculations only.
      </p>

      <div className="space-y-3 mb-6">
        {options.map((opt) => (
          <button
            key={opt.gender}
            onClick={() => onChange(opt.gender)}
            data-testid={`onboarding-gender-${opt.gender}`}
            className={cn(
              'w-full text-left p-4 rounded-xl border-2 bg-card transition-colors hover:bg-muted/50',
              value === opt.gender ? 'border-primary' : 'border-transparent'
            )}
          >
            <div className="flex items-center gap-4">
              <p className="font-semibold text-lg">
                {opt.label}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  )
}

function FitnessStep({
  value,
  onChange,
  onNext,
  onBack
}: {
  value: FitnessLevel
  onChange: (v: FitnessLevel) => void
  onNext: () => void
  onBack: () => void
}) {
  const options: { level: FitnessLevel; label: string; description: string }[] = [
    { level: 'beginner', label: 'Uninitiated', description: "Haven't started yet" },
    { level: 'intermediate', label: 'Trained', description: 'Consistent for 6+ months' },
    { level: 'advanced', label: 'Elite', description: '2+ years, advanced programming' }
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">
        Training experience
      </h2>
      <p className="text-muted-foreground mb-6">
        How would you describe your current relationship with the gym?
      </p>

      <div className="space-y-3 mb-6">
        {options.map((opt) => (
          <button
            key={opt.level}
            onClick={() => onChange(opt.level)}
            className={cn(
              'w-full text-left p-4 rounded-xl border-2 bg-card transition-colors hover:bg-muted/50',
              value === opt.level ? 'border-primary' : 'border-transparent'
            )}
          >
            <div>
              <p className="font-semibold">{opt.label}</p>
              <p className="text-sm text-muted-foreground">{opt.description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  )
}

function DaysStep({
  value,
  onChange,
  onNext,
  onBack
}: {
  value: TrainingDays
  onChange: (v: TrainingDays) => void
  onNext: () => void
  onBack: () => void
}) {
  const options: { days: TrainingDays; label: string }[] = [
    { days: 3, label: '3 Days' },
    { days: 4, label: '4 Days' },
    { days: 5, label: '5 Days' }
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">
        Weekly commitment
      </h2>
      <p className="text-muted-foreground mb-6">
        A commitment is a commitment. Choose what you can sustain.
      </p>

      <div className="space-y-3 mb-6">
        {options.map((opt) => (
          <button
            key={opt.days}
            onClick={() => onChange(opt.days)}
            data-testid={`onboarding-training-days-${opt.days}`}
            className={cn(
              'w-full text-left p-4 rounded-xl border-2 bg-card transition-colors hover:bg-muted/50',
              value === opt.days ? 'border-primary' : 'border-transparent'
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg">
                  {opt.label}
                </p>
              </div>
              <div className="text-2xl font-bold text-primary font-digital">
                {opt.days}x
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  )
}

function ScheduleStep({
  trainingDays,
  selectedDays,
  onChange,
  onNext,
  onBack
}: {
  trainingDays: TrainingDays
  selectedDays: DayOfWeek[]
  onChange: (v: DayOfWeek[]) => void
  onNext: () => void
  onBack: () => void
}) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const toggleDay = (day: DayOfWeek) => {
    const isSelected = selectedDays.includes(day)
    let newDays: DayOfWeek[]

    if (isSelected) {
      // Remove day if we have more than 1 selected
      if (selectedDays.length > 1) {
        newDays = selectedDays.filter(d => d !== day)
      } else {
        return // Can't deselect the last day
      }
    } else {
      // Add day if we haven't reached the limit
      if (selectedDays.length < trainingDays) {
        newDays = [...selectedDays, day].sort((a, b) => a - b)
      } else {
        return // Already at max days
      }
    }

    onChange(newDays)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">
        Select your training days
      </h2>
      <p className="text-muted-foreground mb-6">
        {`Choose ${trainingDays} days. These can be changed later in settings.`}
      </p>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {dayNames.map((day, index) => {
          const isSelected = selectedDays.includes(index as DayOfWeek)
          const canAdd = selectedDays.length < trainingDays

          return (
            <button
              key={day}
              onClick={() => toggleDay(index as DayOfWeek)}
              disabled={!isSelected && !canAdd}
              className={cn(
                'py-3 text-center text-sm font-medium transition-all rounded',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : canAdd
                    ? 'bg-card text-muted-foreground hover:bg-card hover:text-foreground'
                    : 'bg-card text-muted-foreground cursor-not-allowed'
              )}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* Selected days summary */}
      <div className="p-3 mb-6 bg-card border border-border/50 rounded">
        <p className="text-sm text-muted-foreground mb-2">
          {selectedDays.length} of {trainingDays} days selected:
        </p>
        <p className="text-sm font-medium">
          {selectedDays.map(d => fullDayNames[d]).join(', ')}
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} className="flex-1" disabled={selectedDays.length !== trainingDays}>
          Continue
        </Button>
      </div>
    </div>
  )
}

function GoalStep({
  weight,
  height,
  age,
  goal,
  onWeightChange,
  onHeightChange,
  onAgeChange,
  onGoalChange,
  onNext,
  onBack
}: {
  weight: number
  height: number
  age: number
  goal: Goal
  onWeightChange: (v: number) => void
  onHeightChange: (v: number) => void
  onAgeChange: (v: number) => void
  onGoalChange: (v: Goal) => void
  onNext: () => void
  onBack: () => void
}) {
  const goals: { value: Goal; label: string; description: string }[] = [
    { value: 'cut', label: 'Cut', description: '-500 cal deficit' },
    { value: 'recomp', label: 'Recomp', description: '-200 cal' },
    { value: 'maintain', label: 'Maintain', description: 'Hold current weight' },
    { value: 'bulk', label: 'Build', description: '+300 cal surplus' }
  ]

  // Helper text explaining each objective
  const goalHelperText: Record<Goal, string> = {
    cut: 'Prioritize fat loss while preserving muscle. Best for those carrying extra body fat who want to get leaner. Expect slower strength gains but visible changes in physique.',
    recomp: 'Simultaneously build muscle and lose fat. Ideal for beginners or those returning after a break. Progress is slower but you improve body composition without drastic diet changes.',
    maintain: 'Keep your current weight stable while improving fitness. Good for those happy with their size who want to focus on performance, strength, or establishing consistent habits.',
    bulk: 'Maximize muscle growth with a caloric surplus. Best for those who are already lean and want to add size. Expect strength gains but some fat accumulation is normal.'
  }

  // Validation ranges
  const VALIDATION = {
    weight: { min: 70, max: 500, unit: 'lbs' },  // Reasonable range for adults
    height: { min: 48, max: 96 },                 // 4'0" to 8'0" in inches
    age: { min: 13, max: 100 }
  }

  // Validate inputs and generate error messages
  const getValidationErrors = () => {
    const errors: string[] = []

    if (weight < VALIDATION.weight.min || weight > VALIDATION.weight.max) {
      errors.push(`Weight must be between ${VALIDATION.weight.min}-${VALIDATION.weight.max} ${VALIDATION.weight.unit}`)
    }
    if (height < VALIDATION.height.min || height > VALIDATION.height.max) {
      errors.push(`Height must be between 4'0" and 8'0"`)
    }
    if (age < VALIDATION.age.min || age > VALIDATION.age.max) {
      errors.push(`Age must be between ${VALIDATION.age.min}-${VALIDATION.age.max}`)
    }

    return errors
  }

  const validationErrors = getValidationErrors()
  const isValid = validationErrors.length === 0 && weight > 0 && height > 0 && age > 0

  // Handle input changes with clamping to reasonable ranges
  const handleWeightChange = (value: number) => {
    // Allow any input but validation will catch issues
    onWeightChange(Math.max(0, value))
  }

  const handleHeightChange = (newHeight: number) => {
    onHeightChange(Math.max(0, newHeight))
  }

  const handleAgeChange = (value: number) => {
    onAgeChange(Math.max(0, value))
  }

  // Convert height to feet and inches for display
  const feet = Math.floor(height / 12)
  const inches = height % 12

  return (
    <div data-testid="onboarding-step-7">
      <h2 className="text-2xl font-bold mb-2">
        Current stats
      </h2>
      <p className="text-muted-foreground mb-6">
        These numbers are where you start. Not where you stay.
      </p>

      {/* Height */}
      <div className="mb-4" data-sentry-mask>
        <label className="block text-sm text-muted-foreground mb-2 font-medium">
          Height
        </label>
        <div className="flex gap-3">
          <div className="flex-1">
            <div className="relative">
              <Input
                type="number"
                value={feet || ''}
                onChange={(e) => handleHeightChange(e.target.value === '' ? 0 : Number(e.target.value) * 12 + inches)}
                className={cn('h-12 font-mono tabular-nums text-xl pr-12', (height < VALIDATION.height.min || height > VALIDATION.height.max) && 'border-destructive')}
                min={4}
                max={8}
                data-testid="onboarding-height-input"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">ft</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="relative">
              <Input
                type="number"
                value={inches || ''}
                onChange={(e) => handleHeightChange(e.target.value === '' ? 0 : feet * 12 + Number(e.target.value))}
                className={cn('h-12 font-mono tabular-nums text-xl pr-12', (height < VALIDATION.height.min || height > VALIDATION.height.max) && 'border-destructive')}
                min={0}
                max={11}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">in</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weight and Age side by side */}
      <div className="flex gap-3 mb-4" data-sentry-mask>
        <div className="flex-1">
          <label className="block text-sm text-muted-foreground mb-2 font-medium">
            Weight (lbs)
          </label>
          <Input
            type="number"
            value={weight || ''}
            onChange={(e) => handleWeightChange(e.target.value === '' ? 0 : Number(e.target.value))}
            className={cn('h-12 font-mono tabular-nums text-xl', (weight < VALIDATION.weight.min || weight > VALIDATION.weight.max) && 'border-destructive')}
            min={VALIDATION.weight.min}
            max={VALIDATION.weight.max}
            data-testid="onboarding-weight-input"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm text-muted-foreground mb-2 font-medium">
            Age
          </label>
          <Input
            type="number"
            value={age || ''}
            onChange={(e) => handleAgeChange(e.target.value === '' ? 0 : Number(e.target.value))}
            className={cn('h-12 font-mono tabular-nums text-xl', (age < VALIDATION.age.min || age > VALIDATION.age.max) && 'border-destructive')}
            min={VALIDATION.age.min}
            max={VALIDATION.age.max}
            data-testid="onboarding-age-input"
          />
        </div>
      </div>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="p-3 mb-4 bg-destructive/10 border border-destructive/30 rounded">
          {validationErrors.map((error, index) => (
            <p key={index} className="text-sm text-destructive">{error}</p>
          ))}
        </div>
      )}

      <h3 className="text-lg font-bold mb-4">
        Current objective
      </h3>

      <div className="space-y-3 mb-4">
        {goals.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onGoalChange(opt.value)}
            data-testid={`onboarding-goal-${opt.value}`}
            className={cn(
              'w-full text-left p-4 rounded-xl border-2 bg-card transition-colors hover:bg-muted/50',
              goal === opt.value ? 'border-primary' : 'border-transparent'
            )}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold">{opt.label}</p>
              <p className="text-sm text-muted-foreground">{opt.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Helper text for selected objective */}
      {goal && (
        <div className="p-3 mb-6 bg-card border border-border/50 rounded">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {goalHelperText[goal]}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} className="flex-1" disabled={!isValid}>
          Continue
        </Button>
      </div>
    </div>
  )
}

function AvatarStep({
  value,
  onChange,
  onNext,
  onBack
}: {
  value: AvatarBase
  onChange: (v: AvatarBase) => void
  onNext: () => void
  onBack: () => void
}) {
  const options: { base: AvatarBase; label: string; description: string; icon: LucideIcon; color: string }[] = [
    {
      base: 'dominant',
      label: LABELS.avatarClasses.dominant,
      description: 'Control. Authority. Leads from the front.',
      icon: Sword,
      color: 'text-destructive'
    },
    {
      base: 'switch',
      label: LABELS.avatarClasses.switch,
      description: 'Versatile. Adapts to any situation.',
      icon: Wand2,
      color: 'text-primary'
    },
    {
      base: 'submissive',
      label: LABELS.avatarClasses.submissive,
      description: 'Obedient. Follows the protocol.',
      icon: Zap,
      color: 'text-warning'
    }
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">
        Choose your persona
      </h2>
      <p className="text-muted-foreground mb-6">
        This represents your avatar identity as you progress.
      </p>

      <div className="space-y-3 mb-6">
        {options.map((opt) => {
          const Icon = opt.icon
          return (
            <button
              key={opt.base}
              onClick={() => onChange(opt.base)}
              className={cn(
                'w-full text-left p-4 rounded-xl border-2 bg-card transition-colors hover:bg-muted/50',
                value === opt.base ? 'border-primary' : 'border-transparent'
              )}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded flex items-center justify-center flex-shrink-0">
                  <Icon size={24} className={opt.color} />
                </div>
                <div>
                  <p className="font-semibold">{opt.label}</p>
                  <p className="text-sm text-muted-foreground">{opt.description}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  )
}

function FeaturesStep({
  onNext,
  onBack
}: {
  onNext: () => void
  onBack: () => void
}) {
  const features = [
    {
      icon: Home,
      title: 'Daily Check-in',
      description: 'Report in each day to maintain your streak and build consistency.'
    },
    {
      icon: Dumbbell,
      title: 'Workouts',
      description: 'Follow your personalized program. Log sets, reps, and weights as you train.'
    },
    {
      icon: Beef,
      title: 'Nutrition Tracking',
      description: 'Log your protein and calories. Hit your targets to earn points.'
    },
    {
      icon: ChartUp,
      title: 'Progress',
      description: 'Track your weight over time and see your body composition trends.'
    }
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">
        How the protocol works
      </h2>
      <p className="text-muted-foreground mb-6">
        Four areas of focus. Master them all.
      </p>

      <div className="space-y-3 mb-6">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <div
              key={feature.title}
              className="animate-in fade-in slide-in-from-left-4 duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Card className="py-0">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="w-10 h-10 bg-muted flex items-center justify-center flex-shrink-0 rounded">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold mb-1 text-sm">
                      {feature.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  )
}

function TutorialStep({
  username,
  onFinish,
  onBack
}: {
  username: string
  onFinish: () => void
  onBack: () => void
}) {
  const xpLabel = LABELS.xp

  return (
    <div className="text-center">
      <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
        <Shield size={48} className="mx-auto text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-2">
        Protocol initialized, {username}.
      </h2>
      <p className="text-muted-foreground mb-6">Earn {LABELS.xpFull} ({xpLabel}) through:</p>

      <div className="space-y-3 text-left mb-8">
        <Card className="py-0">
          <CardContent className="p-4 flex justify-between items-center">
            <span className="text-muted-foreground">Workout completed</span>
            <span className="text-primary font-digital font-bold">+50 {xpLabel}</span>
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardContent className="p-4 flex justify-between items-center">
            <span className="text-muted-foreground">Protein target hit</span>
            <span className="text-primary font-digital font-bold">+30 {xpLabel}</span>
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardContent className="p-4 flex justify-between items-center">
            <span className="text-muted-foreground">Calorie target hit</span>
            <span className="text-primary font-digital font-bold">+20 {xpLabel}</span>
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardContent className="p-4 flex justify-between items-center">
            <span className="text-muted-foreground">Daily report submitted</span>
            <span className="text-primary font-digital font-bold">+10 {xpLabel}</span>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        {xpLabel} accumulates all week. Claim your reward every Sunday.
      </p>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onFinish} className="flex-1" size="lg">
          Begin
        </Button>
      </div>
    </div>
  )
}

function EvolutionStep({
  username,
  avatarBase,
  onContinue
}: {
  username: string
  avatarBase: AvatarBase
  onContinue: () => void
}) {
  const [showNew, setShowNew] = useState(false)

  const oldStage = EVOLUTION_STAGES[0] // Egg
  const newStage = EVOLUTION_STAGES[1] // Hatchling

  // Get stage names from constants
  const oldStageName = AVATAR_STAGES[0] || oldStage.name
  const newStageName = AVATAR_STAGES[1] || newStage.name

  const avatarIcons: Record<AvatarBase, { icon: LucideIcon; color: string }> = {
    dominant: { icon: Sword, color: 'text-destructive' },
    switch: { icon: Wand2, color: 'text-primary' },
    submissive: { icon: Zap, color: 'text-warning' }
  }

  // Trigger the evolution animation after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNew(true)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="text-center">
      {/* Background glow effect */}
      <div
        className={cn(
          'absolute inset-0 pointer-events-none transition-opacity duration-500',
          showNew ? 'opacity-30' : 'opacity-0'
        )}
        style={{
          background: 'radial-gradient(circle, rgba(220, 38, 38, 0.3) 0%, transparent 70%)'
        }}
      />

      <div className="mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <span className="text-sm font-semibold text-primary">
          First Advancement
        </span>
      </div>

      <h2 className="text-2xl font-bold mb-8">
        {`Welcome, ${username}.`}
      </h2>

      {/* Evolution animation */}
      <div className="relative h-48 flex items-center justify-center mb-8">
        {!showNew ? (
          <div className="text-center animate-pulse">
            {(() => {
              const OldIcon = STAGE_ICON_MAP[oldStage.emoji] || Circle
              return (
                <>
                  <div className="mb-2">
                    <OldIcon size={80} className="mx-auto text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">{oldStageName}</p>
                </>
              )
            })()}
          </div>
        ) : (
          <div className="text-center animate-in zoom-in-50 duration-500">
            <div className="animate-bounce">
              {(() => {
                const NewIcon = STAGE_ICON_MAP[newStage.emoji] || Zap
                return (
                  <div className="mb-2">
                    <NewIcon size={80} className="mx-auto text-primary" />
                  </div>
                )
              })()}
            </div>
            <p className="text-xl font-bold text-primary animate-in fade-in duration-300 delay-300">
              {newStageName}
            </p>
          </div>
        )}
      </div>

      {/* Level/Rank up indicator */}
      <div
        className={cn(
          'mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500',
          showNew ? 'delay-500' : 'delay-[2000ms]'
        )}
      >
        <div className="inline-block">
          <Card className="py-0">
            <CardContent className="px-6 py-4 flex items-center gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  {LABELS.level}
                </p>
                <p className="text-2xl font-bold font-digital text-muted-foreground">0</p>
              </div>
              <div className="text-primary text-xl animate-bounce">
                &rarr;
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  {LABELS.level}
                </p>
                <p className="text-2xl font-bold font-digital text-primary">1</p>
              </div>
              <div className="ml-2">
                {(() => {
                  const AvatarIcon = avatarIcons[avatarBase].icon
                  return <AvatarIcon size={28} className={avatarIcons[avatarBase].color} />
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <p
        className={cn(
          'text-muted-foreground mb-8 animate-in fade-in duration-500',
          showNew ? 'delay-700' : 'delay-[2200ms]'
        )}
      >
        The protocol begins now.
      </p>

      <div
        className={cn(
          'animate-in fade-in slide-in-from-bottom-4 duration-500',
          showNew ? 'delay-1000' : 'delay-[2500ms]'
        )}
      >
        <Button onClick={onContinue} className="w-full" size="lg">
          Begin
        </Button>
      </div>
    </div>
  )
}
