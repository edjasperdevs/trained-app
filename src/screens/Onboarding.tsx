import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button, Card } from '@/components'
import {
  Gamepad2,
  Sparkles,
  Dumbbell,
  Flame,
  Sprout,
  Sword,
  Wand2,
  Moon,
  TrendingDown,
  RefreshCw,
  Scale,
  TrendingUp,
  Beef,
  Zap,
  CheckCircle2,
  PartyPopper,
  LucideIcon,
  Shield,
  Circle,
  Footprints,
  Trophy,
  Star,
  Crown,
  Home,
  TrendingUp as ChartUp
} from 'lucide-react'

// Map icon names to Lucide components for evolution stages
const STAGE_ICON_MAP: Record<string, LucideIcon> = {
  Circle, Zap, Sprout, Footprints, Dumbbell, Sword, Shield, Flame,
  Trophy, Bolt: Zap, Sparkles, Star, Crown
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
import { useTheme } from '@/themes'

type Step = 'welcome' | 'name' | 'gender' | 'fitness' | 'days' | 'schedule' | 'goal' | 'avatar' | 'features' | 'tutorial' | 'evolution'

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

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0
  })
}

export function Onboarding() {
  const navigate = useNavigate()
  const { initProfile, completeOnboarding } = useUserStore()
  const { setPlan } = useWorkoutStore()
  const { calculateMacros } = useMacroStore()
  const { setBaseCharacter, updateEvolutionStage } = useAvatarStore()
  const { completeOnboarding: completeXPOnboarding } = useXPStore()

  const [step, setStep] = useState<Step>('welcome')
  const [direction, setDirection] = useState(1)
  const [data, setData] = useState<OnboardingData>({
    username: '',
    gender: 'male',
    fitnessLevel: 'beginner',
    trainingDaysPerWeek: 3,
    selectedDays: [1, 3, 5], // Mon, Wed, Fri default
    weight: 150,
    height: 68, // 5'8"
    age: 25,
    goal: 'maintain',
    avatarBase: 'warrior',
    units: 'imperial'
  })

  const steps: Step[] = ['welcome', 'name', 'gender', 'fitness', 'days', 'schedule', 'goal', 'avatar', 'features', 'tutorial']
  const currentIndex = steps.indexOf(step)

  const goNext = () => {
    if (currentIndex < steps.length - 1) {
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
    <div className="min-h-screen bg-bg-primary flex flex-col px-4 py-8">
      {/* Progress indicator */}
      {step !== 'welcome' && (
        <div className="flex gap-1 mb-8 justify-center">
          {steps.slice(1).map((s, i) => (
            <div
              key={s}
              className={`h-1 w-8 rounded-full transition-colors ${
                i < currentIndex ? 'bg-accent-primary' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
      )}

      {/* Step content */}
      <div className="flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-md"
          >
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
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// Step Components

function WelcomeStep({ onNext }: { onNext: () => void }) {
  const { theme, themeId } = useTheme()
  const isTrained = themeId === 'trained'

  if (isTrained) {
    return (
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-heading font-bold uppercase tracking-wider mb-4">
            {theme.name}
          </h1>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-lg text-text-secondary mb-6">
            The protocol for building discipline through fitness.
          </p>
          <p className="text-text-secondary mb-8 leading-relaxed">
            This is not a game. This is a system.<br />
            Track your workouts. Hit your macros.<br />
            Report in daily. Earn your rank.
          </p>
          <p className="text-sm text-text-secondary mb-8 italic">
            Structure creates freedom.
          </p>
        </motion.div>
        <Button onClick={onNext} fullWidth size="lg">
          Start
        </Button>
      </div>
    )
  }

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="mb-6"
      >
        <Gamepad2 size={80} className="mx-auto text-accent-primary" />
      </motion.div>
      <h1 className="text-3xl font-bold mb-2">Your Fitness Operating System</h1>
      <p className="text-gray-400 mb-8">
        Built by an engineer. Powered by game mechanics. Designed for people who think in systems.
      </p>
      <div className="space-y-3 text-left mb-8">
        <div className="flex items-center gap-3 text-sm">
          <Sparkles size={24} className="text-accent-secondary flex-shrink-0" />
          <span className="text-gray-300">Earn XP for workouts, hitting macros, and consistency</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Dumbbell size={24} className="text-accent-primary flex-shrink-0" />
          <span className="text-gray-300">Watch your avatar evolve as you progress</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Flame size={24} className="text-accent-warning flex-shrink-0" />
          <span className="text-gray-300">Build streaks and unlock achievements</span>
        </div>
      </div>
      <Button onClick={onNext} fullWidth size="lg">
        Initialize
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
  const { themeId } = useTheme()
  const isTrained = themeId === 'trained'

  return (
    <div>
      <h2 className={`text-2xl font-bold mb-2 ${isTrained ? 'font-heading uppercase tracking-wide' : ''}`}>
        What should we call you?
      </h2>
      <p className="text-gray-400 mb-6">
        {isTrained ? 'This is how the protocol will address you.' : 'Your handle for the system.'}
      </p>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter your name..."
        className={`w-full bg-bg-secondary border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent-primary mb-6 ${isTrained ? 'rounded' : 'rounded-lg'}`}
        maxLength={20}
        autoFocus
      />

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} fullWidth disabled={!value.trim()}>
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
  const { themeId } = useTheme()
  const isTrained = themeId === 'trained'

  const options: { gender: Gender; label: string; icon: LucideIcon; color: string }[] = [
    { gender: 'male', label: 'Male', icon: TrendingUp, color: 'text-blue-400' },
    { gender: 'female', label: 'Female', icon: Sparkles, color: 'text-pink-400' }
  ]

  return (
    <div>
      <h2 className={`text-2xl font-bold mb-2 ${isTrained ? 'font-heading uppercase tracking-wide' : ''}`}>
        {isTrained ? 'Biological sex' : 'Calibrating baseline metrics'}
      </h2>
      <p className="text-gray-400 mb-6">
        {isTrained ? 'Used for accurate metabolic calculations only.' : 'Biological sex affects metabolism calculations.'}
      </p>

      <div className="space-y-3 mb-6">
        {options.map((opt) => {
          const Icon = opt.icon
          return (
            <Card
              key={opt.gender}
              onClick={() => onChange(opt.gender)}
              hover
              className={`border-2 ${value === opt.gender ? 'border-accent-primary' : 'border-transparent'}`}
            >
              <div className="flex items-center gap-4">
                {!isTrained && <Icon size={28} className={opt.color} />}
                <p className={`font-semibold text-lg ${isTrained ? 'font-heading uppercase tracking-wide' : ''}`}>
                  {opt.label}
                </p>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} fullWidth>
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
  const { themeId } = useTheme()
  const isTrained = themeId === 'trained'

  const gygOptions: { level: FitnessLevel; label: string; description: string; icon: LucideIcon; color: string }[] = [
    { level: 'beginner', label: 'Beginner', description: 'New to lifting or returning after a break', icon: Sprout, color: 'text-green-400' },
    { level: 'intermediate', label: 'Intermediate', description: '1-3 years of consistent training', icon: Dumbbell, color: 'text-accent-primary' },
    { level: 'advanced', label: 'Advanced', description: '3+ years, know your way around the gym', icon: Flame, color: 'text-accent-warning' }
  ]

  const trainedOptions: { level: FitnessLevel; label: string; description: string }[] = [
    { level: 'beginner', label: 'Uninitiated', description: "Haven't started yet" },
    { level: 'intermediate', label: 'Trained', description: 'Consistent for 6+ months' },
    { level: 'advanced', label: 'Elite', description: '2+ years, advanced programming' }
  ]

  if (isTrained) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-2 font-heading uppercase tracking-wide">
          Training experience
        </h2>
        <p className="text-gray-400 mb-6">
          How would you describe your current relationship with the gym?
        </p>

        <div className="space-y-3 mb-6">
          {trainedOptions.map((opt) => (
            <Card
              key={opt.level}
              onClick={() => onChange(opt.level)}
              hover
              className={`border-2 ${value === opt.level ? 'border-accent-primary' : 'border-transparent'}`}
            >
              <div>
                <p className="font-semibold font-heading uppercase tracking-wide">{opt.label}</p>
                <p className="text-sm text-gray-400">{opt.description}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onNext} fullWidth>
            Continue
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Current system state</h2>
      <p className="text-gray-400 mb-6">Where are you starting from?</p>

      <div className="space-y-3 mb-6">
        {gygOptions.map((opt) => {
          const Icon = opt.icon
          return (
            <Card
              key={opt.level}
              onClick={() => onChange(opt.level)}
              hover
              className={`border-2 ${value === opt.level ? 'border-accent-primary' : 'border-transparent'}`}
            >
              <div className="flex items-center gap-4">
                <Icon size={28} className={opt.color} />
                <div>
                  <p className="font-semibold">{opt.label}</p>
                  <p className="text-sm text-gray-400">{opt.description}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} fullWidth>
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
  const { themeId } = useTheme()
  const isTrained = themeId === 'trained'

  const options: { days: TrainingDays; label: string; description: string }[] = [
    { days: 3, label: '3 Days', description: 'Push/Pull/Legs - Great for beginners' },
    { days: 4, label: '4 Days', description: 'Upper/Lower Split - Balanced approach' },
    { days: 5, label: '5 Days', description: 'PPL + Upper/Lower - Maximum gains' }
  ]

  return (
    <div>
      <h2 className={`text-2xl font-bold mb-2 ${isTrained ? 'font-heading uppercase tracking-wide' : ''}`}>
        {isTrained ? 'Weekly commitment' : 'Configure your training schedule'}
      </h2>
      <p className="text-gray-400 mb-6">
        {isTrained
          ? 'A commitment is a commitment. Choose what you can sustain.'
          : 'Be realistic. Consistency beats intensity.'}
      </p>

      <div className="space-y-3 mb-6">
        {options.map((opt) => (
          <Card
            key={opt.days}
            onClick={() => onChange(opt.days)}
            hover
            className={`border-2 ${value === opt.days ? 'border-accent-primary' : 'border-transparent'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`font-semibold text-lg ${isTrained ? 'font-heading uppercase tracking-wide' : ''}`}>
                  {opt.label}
                </p>
                {!isTrained && <p className="text-sm text-gray-400">{opt.description}</p>}
              </div>
              <div className="text-2xl font-bold text-accent-primary font-digital">
                {opt.days}x
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} fullWidth>
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
  const { themeId } = useTheme()
  const isTrained = themeId === 'trained'

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
      <h2 className={`text-2xl font-bold mb-2 ${isTrained ? 'font-heading uppercase tracking-wide' : ''}`}>
        {isTrained ? 'Select your training days' : 'Pick your workout days'}
      </h2>
      <p className="text-gray-400 mb-6">
        {isTrained
          ? `Choose ${trainingDays} days. These can be changed later in settings.`
          : `Select ${trainingDays} days that work best for your schedule.`}
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
              className={`
                py-3 text-center text-sm font-medium transition-all
                ${isTrained ? 'rounded' : 'rounded-lg'}
                ${isSelected
                  ? 'bg-accent-primary text-white'
                  : canAdd
                    ? 'bg-bg-secondary text-gray-400 hover:bg-bg-card hover:text-white'
                    : 'bg-bg-secondary text-gray-600 cursor-not-allowed'
                }
              `}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* Selected days summary */}
      <div className={`p-3 mb-6 bg-bg-card border border-gray-700/50 ${isTrained ? 'rounded' : 'rounded-lg'}`}>
        <p className="text-sm text-gray-400 mb-2">
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
        <Button onClick={onNext} fullWidth disabled={selectedDays.length !== trainingDays}>
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
  const { themeId } = useTheme()
  const isTrained = themeId === 'trained'

  const gygGoals: { value: Goal; label: string; description: string; icon: LucideIcon; color: string }[] = [
    { value: 'cut', label: 'Cut', description: 'Lose fat, maintain muscle', icon: TrendingDown, color: 'text-red-400' },
    { value: 'recomp', label: 'Recomp', description: 'Build muscle while losing fat', icon: RefreshCw, color: 'text-purple-400' },
    { value: 'maintain', label: 'Maintain', description: 'Stay at current weight', icon: Scale, color: 'text-blue-400' },
    { value: 'bulk', label: 'Bulk', description: 'Build muscle, gain weight', icon: TrendingUp, color: 'text-green-400' }
  ]

  const trainedGoals: { value: Goal; label: string; description: string }[] = [
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

  // Convert height to feet and inches for display
  const feet = Math.floor(height / 12)
  const inches = height % 12

  const inputClass = isTrained
    ? 'w-full bg-bg-secondary border border-gray-700 rounded px-4 py-3 text-white font-digital text-xl'
    : 'w-full bg-bg-secondary border border-gray-700 rounded-lg px-4 py-3 text-white font-digital text-xl'

  return (
    <div>
      <h2 className={`text-2xl font-bold mb-2 ${isTrained ? 'font-heading uppercase tracking-wide' : ''}`}>
        {isTrained ? 'Current stats' : 'Select your optimization target'}
      </h2>
      <p className="text-gray-400 mb-6">
        {isTrained
          ? 'These numbers are where you start. Not where you stay.'
          : "We'll calculate your macros based on these inputs."}
      </p>

      {/* Height */}
      <div className="mb-4">
        <label className={`block text-sm text-gray-400 mb-2 ${isTrained ? 'uppercase tracking-wider' : ''}`}>
          Height
        </label>
        <div className="flex gap-3">
          <div className="flex-1">
            <div className="relative">
              <input
                type="number"
                value={feet}
                onChange={(e) => onHeightChange(Number(e.target.value) * 12 + inches)}
                className={`${inputClass} pr-12`}
                min={4}
                max={7}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">ft</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="relative">
              <input
                type="number"
                value={inches}
                onChange={(e) => onHeightChange(feet * 12 + Number(e.target.value))}
                className={`${inputClass} pr-12`}
                min={0}
                max={11}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">in</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weight and Age side by side */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1">
          <label className={`block text-sm text-gray-400 mb-2 ${isTrained ? 'uppercase tracking-wider' : ''}`}>
            Weight (lbs)
          </label>
          <input
            type="number"
            value={weight}
            onChange={(e) => onWeightChange(Number(e.target.value))}
            className={inputClass}
            min={80}
            max={400}
          />
        </div>
        <div className="flex-1">
          <label className={`block text-sm text-gray-400 mb-2 ${isTrained ? 'uppercase tracking-wider' : ''}`}>
            Age
          </label>
          <input
            type="number"
            value={age}
            onChange={(e) => onAgeChange(Number(e.target.value))}
            className={inputClass}
            min={16}
            max={80}
          />
        </div>
      </div>

      {isTrained && (
        <h3 className="text-lg font-bold mb-4 font-heading uppercase tracking-wide">
          Current objective
        </h3>
      )}

      <div className="space-y-3 mb-4">
        {isTrained ? (
          trainedGoals.map((opt) => (
            <Card
              key={opt.value}
              onClick={() => onGoalChange(opt.value)}
              hover
              className={`border-2 ${goal === opt.value ? 'border-accent-primary' : 'border-transparent'}`}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold font-heading uppercase tracking-wide">{opt.label}</p>
                <p className="text-sm text-gray-400">{opt.description}</p>
              </div>
            </Card>
          ))
        ) : (
          gygGoals.map((opt) => {
            const Icon = opt.icon
            return (
              <Card
                key={opt.value}
                onClick={() => onGoalChange(opt.value)}
                hover
                className={`border-2 ${goal === opt.value ? 'border-accent-primary' : 'border-transparent'}`}
              >
                <div className="flex items-center gap-4">
                  <Icon size={28} className={opt.color} />
                  <div>
                    <p className="font-semibold">{opt.label}</p>
                    <p className="text-sm text-gray-400">{opt.description}</p>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* Helper text for selected objective */}
      {goal && (
        <div className={`p-3 mb-6 bg-bg-card border border-gray-700/50 ${isTrained ? 'rounded' : 'rounded-lg'}`}>
          <p className="text-sm text-gray-400 leading-relaxed">
            {goalHelperText[goal]}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} fullWidth disabled={!weight || !height || !age}>
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
  const { theme, themeId } = useTheme()
  const isTrained = themeId === 'trained'

  const gygOptions: { base: AvatarBase; label: string; icon: LucideIcon; color: string; description: string }[] = [
    { base: 'warrior', label: 'Warrior', icon: Sword, color: 'text-red-400', description: 'Strength and discipline' },
    { base: 'mage', label: 'Mage', icon: Wand2, color: 'text-purple-400', description: 'Knowledge and power' },
    { base: 'rogue', label: 'Rogue', icon: Moon, color: 'text-blue-400', description: 'Speed and agility' }
  ]

  const trainedOptions: { base: AvatarBase; label: string; description: string; icon: LucideIcon; color: string }[] = [
    {
      base: 'warrior',
      label: theme.labels.avatarClasses.warrior,
      description: 'Control. Authority. Leads from the front.',
      icon: Sword,
      color: 'text-red-400'
    },
    {
      base: 'mage',
      label: theme.labels.avatarClasses.mage,
      description: 'Versatile. Adapts to any situation.',
      icon: Wand2,
      color: 'text-purple-400'
    },
    {
      base: 'rogue',
      label: theme.labels.avatarClasses.rogue,
      description: 'Obedient. Follows the protocol.',
      icon: Zap,
      color: 'text-yellow-400'
    }
  ]

  if (isTrained) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-2 font-heading uppercase tracking-wide">
          Choose your persona
        </h2>
        <p className="text-gray-400 mb-6">
          This represents your avatar identity as you progress.
        </p>

        <div className="space-y-3 mb-6">
          {trainedOptions.map((opt) => {
            const Icon = opt.icon
            return (
              <Card
                key={opt.base}
                onClick={() => onChange(opt.base)}
                hover
                className={`border-2 ${value === opt.base ? 'border-accent-primary' : 'border-transparent'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-bg-secondary rounded flex items-center justify-center flex-shrink-0">
                    <Icon size={24} className={opt.color} />
                  </div>
                  <div>
                    <p className="font-semibold font-heading uppercase tracking-wide">{opt.label}</p>
                    <p className="text-sm text-gray-400">{opt.description}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onNext} fullWidth>
            Continue
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Deploy your avatar</h2>
      <p className="text-gray-400 mb-6">This character will evolve with your progress.</p>

      <div className="space-y-3 mb-6">
        {gygOptions.map((opt) => {
          const Icon = opt.icon
          return (
            <Card
              key={opt.base}
              onClick={() => onChange(opt.base)}
              hover
              className={`border-2 ${value === opt.base ? 'border-accent-primary' : 'border-transparent'}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center">
                  <Icon size={32} className={opt.color} />
                </div>
                <div>
                  <p className="font-semibold text-lg">{opt.label}</p>
                  <p className="text-sm text-gray-400">{opt.description}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} fullWidth>
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
  const { themeId } = useTheme()
  const isTrained = themeId === 'trained'

  const trainedFeatures = [
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

  const gygFeatures = [
    {
      icon: Home,
      title: 'Home',
      description: 'Daily check-in to maintain streaks. Claim your weekly XP rewards on Sundays.'
    },
    {
      icon: Dumbbell,
      title: 'Workouts',
      description: 'Your personalized program based on training days. Track sets, reps, and weights.'
    },
    {
      icon: Beef,
      title: 'Macros',
      description: 'Log your daily nutrition. Hit protein and calorie targets to earn bonus XP.'
    },
    {
      icon: ChartUp,
      title: 'Progress',
      description: 'Track weight, see trends, and watch your avatar evolve as you level up.'
    }
  ]

  const features = isTrained ? trainedFeatures : gygFeatures

  return (
    <div>
      <h2 className={`text-2xl font-bold mb-2 ${isTrained ? 'font-heading uppercase tracking-wide' : ''}`}>
        {isTrained ? 'How the protocol works' : 'How the app works'}
      </h2>
      <p className="text-gray-400 mb-6">
        {isTrained
          ? 'Four areas of focus. Master them all.'
          : 'Everything you need to level up your fitness.'}
      </p>

      <div className="space-y-3 mb-6">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 bg-bg-secondary flex items-center justify-center flex-shrink-0 ${isTrained ? 'rounded' : 'rounded-lg'}`}>
                    <Icon size={20} className="text-accent-primary" />
                  </div>
                  <div>
                    <p className={`font-semibold mb-1 ${isTrained ? 'font-heading uppercase tracking-wide text-sm' : ''}`}>
                      {feature.title}
                    </p>
                    <p className="text-sm text-gray-400">{feature.description}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} fullWidth>
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
  const { theme, themeId } = useTheme()
  const isTrained = themeId === 'trained'
  const xpLabel = theme.labels.xp

  if (isTrained) {
    return (
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Shield size={48} className="mx-auto text-accent-primary" />
        </motion.div>
        <h2 className="text-2xl font-bold mb-2 font-heading uppercase tracking-wide">
          Protocol initialized, {username}.
        </h2>
        <p className="text-gray-400 mb-6">Earn {theme.labels.xpFull} ({xpLabel}) through:</p>

        <div className="space-y-3 text-left mb-8">
          <Card>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Workout completed</span>
              <span className="text-accent-primary font-digital font-bold">+50 {xpLabel}</span>
            </div>
          </Card>
          <Card>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Protein target hit</span>
              <span className="text-accent-primary font-digital font-bold">+30 {xpLabel}</span>
            </div>
          </Card>
          <Card>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Calorie target hit</span>
              <span className="text-accent-primary font-digital font-bold">+20 {xpLabel}</span>
            </div>
          </Card>
          <Card>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Daily report submitted</span>
              <span className="text-accent-primary font-digital font-bold">+10 {xpLabel}</span>
            </div>
          </Card>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          {xpLabel} accumulates all week. Claim your reward every Sunday.
        </p>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onFinish} fullWidth size="lg">
            Begin
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="mb-4"
      >
        <PartyPopper size={56} className="mx-auto text-accent-success" />
      </motion.div>
      <h2 className="text-2xl font-bold mb-2">You're all set, {username}!</h2>
      <p className="text-gray-400 mb-6">Here's how to earn {xpLabel}:</p>

      <div className="space-y-4 text-left mb-8">
        <Card>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Dumbbell size={20} className="text-accent-primary" />
              <span>Complete a workout</span>
            </div>
            <span className="text-accent-primary font-digital font-bold">+100 {xpLabel}</span>
          </div>
        </Card>
        <Card>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Beef size={20} className="text-accent-success" />
              <span>Hit protein target</span>
            </div>
            <span className="text-accent-primary font-digital font-bold">+50 {xpLabel}</span>
          </div>
        </Card>
        <Card>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Zap size={20} className="text-accent-warning" />
              <span>Hit calorie target</span>
            </div>
            <span className="text-accent-primary font-digital font-bold">+50 {xpLabel}</span>
          </div>
        </Card>
        <Card>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-accent-secondary" />
              <span>Daily check-in</span>
            </div>
            <span className="text-accent-primary font-digital font-bold">+25 {xpLabel}</span>
          </div>
        </Card>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        {xpLabel} accumulates all week and can be claimed every Sunday!
      </p>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onFinish} fullWidth size="lg">
          Deploy
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
  const { theme, themeId } = useTheme()
  const isTrained = themeId === 'trained'
  const [showNew, setShowNew] = useState(false)

  const oldStage = EVOLUTION_STAGES[0] // Egg
  const newStage = EVOLUTION_STAGES[1] // Hatchling

  // Get theme-aware stage names
  const oldStageName = theme.avatarStages[0] || oldStage.name
  const newStageName = theme.avatarStages[1] || newStage.name

  const avatarIcons: Record<AvatarBase, { icon: LucideIcon; color: string }> = {
    warrior: { icon: Sword, color: 'text-red-400' },
    mage: { icon: Wand2, color: 'text-purple-400' },
    rogue: { icon: isTrained ? Zap : Moon, color: isTrained ? 'text-yellow-400' : 'text-blue-400' }
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
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: showNew ? 0.3 : 0 }}
        transition={{ duration: 0.5 }}
        style={{
          background: isTrained
            ? 'radial-gradient(circle, rgba(220, 38, 38, 0.3) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)'
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <span className={`text-sm font-semibold text-accent-primary uppercase tracking-wider ${isTrained ? 'font-heading' : ''}`}>
          {isTrained ? 'First Advancement' : 'First Evolution!'}
        </span>
      </motion.div>

      <h2 className={`text-2xl font-bold mb-8 ${isTrained ? 'font-heading uppercase tracking-wide' : ''}`}>
        {isTrained ? `Welcome, ${username}.` : `Congratulations, ${username}!`}
      </h2>

      {/* Evolution animation */}
      <div className="relative h-48 flex items-center justify-center mb-8">
        <AnimatePresence mode="wait">
          {!showNew ? (
            <motion.div
              key="old"
              initial={{ scale: 1 }}
              animate={{
                scale: [1, 1.1, 1, 1.1, 1],
              }}
              exit={{
                scale: 1.5,
                opacity: 0,
                filter: 'blur(10px)'
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 0.5
              }}
              className="text-center"
            >
              {(() => {
                const OldIcon = STAGE_ICON_MAP[oldStage.emoji] || Circle
                return (
                  <>
                    <div className="mb-2">
                      <OldIcon size={80} className="mx-auto text-text-secondary" />
                    </div>
                    <p className="text-gray-400">{oldStageName}</p>
                  </>
                )
              })()}
            </motion.div>
          ) : (
            <motion.div
              key="new"
              initial={{
                scale: 0,
                rotate: isTrained ? 0 : -180,
                opacity: 0
              }}
              animate={{
                scale: 1,
                rotate: 0,
                opacity: 1
              }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15
              }}
              className="text-center"
            >
              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                {(() => {
                  const NewIcon = STAGE_ICON_MAP[newStage.emoji] || Zap
                  return (
                    <div className="mb-2">
                      <NewIcon size={80} className="mx-auto text-accent-primary" />
                    </div>
                  )
                })()}
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={`text-xl font-bold text-accent-primary ${isTrained ? 'font-heading uppercase tracking-wide' : ''}`}
              >
                {newStageName}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sparkle effects when evolved - muted for Trained theme */}
        {showNew && !isTrained && (
          <>
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{
                  opacity: 0,
                  scale: 0,
                  x: 0,
                  y: 0
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: Math.cos((i / 8) * Math.PI * 2) * 80,
                  y: Math.sin((i / 8) * Math.PI * 2) * 80
                }}
                transition={{
                  duration: 1,
                  delay: 0.1 * i,
                  ease: 'easeOut'
                }}
              >
                <Sparkles size={20} className="text-accent-secondary" />
              </motion.div>
            ))}
          </>
        )}
      </div>

      {/* Level/Rank up indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: showNew ? 0.5 : 2 }}
        className="mb-6"
      >
        <Card className="inline-block px-6">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className={`text-xs text-gray-500 uppercase ${isTrained ? 'tracking-wider' : ''}`}>
                {theme.labels.level}
              </p>
              <p className="text-2xl font-bold font-digital text-gray-400">0</p>
            </div>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="text-accent-primary text-xl"
            >
              →
            </motion.div>
            <div className="text-center">
              <p className={`text-xs text-gray-500 uppercase ${isTrained ? 'tracking-wider' : ''}`}>
                {theme.labels.level}
              </p>
              <p className="text-2xl font-bold font-digital text-accent-primary">1</p>
            </div>
            <div className="ml-2">
              {(() => {
                const AvatarIcon = avatarIcons[avatarBase].icon
                return <AvatarIcon size={28} className={avatarIcons[avatarBase].color} />
              })()}
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: showNew ? 0.7 : 2.2 }}
        className="text-gray-400 mb-8"
      >
        {isTrained
          ? 'The protocol begins now.'
          : `Your journey begins! Keep earning ${theme.labels.xp} to evolve further.`}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: showNew ? 1 : 2.5 }}
      >
        <Button onClick={onContinue} fullWidth size="lg">
          {isTrained ? 'Begin' : "Let's Go!"}
        </Button>
      </motion.div>
    </div>
  )
}
