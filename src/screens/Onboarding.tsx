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
  LucideIcon
} from 'lucide-react'
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
  UnitSystem
} from '@/stores'
import { EVOLUTION_STAGES } from '@/stores/avatarStore'
import { analytics } from '@/lib/analytics'

type Step = 'welcome' | 'name' | 'gender' | 'fitness' | 'days' | 'goal' | 'avatar' | 'tutorial' | 'evolution'

interface OnboardingData {
  username: string
  gender: Gender
  fitnessLevel: FitnessLevel
  trainingDaysPerWeek: TrainingDays
  weight: number
  height: number // in inches
  age: number
  goal: Goal
  avatarBase: AvatarBase
  units: UnitSystem
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
    weight: 150,
    height: 68, // 5'8"
    age: 25,
    goal: 'maintain',
    avatarBase: 'warrior',
    units: 'imperial'
  })

  const steps: Step[] = ['welcome', 'name', 'gender', 'fitness', 'days', 'goal', 'avatar', 'tutorial']
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
    setPlan(data.trainingDaysPerWeek)
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
                onChange={(v) => updateData('trainingDaysPerWeek', v)}
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
      <h1 className="text-3xl font-bold mb-2">Gamify Your Gains</h1>
      <p className="text-gray-400 mb-8">
        Turn your fitness journey into a game. Level up your avatar as you level up yourself.
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
        Let's Go
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
    <div>
      <h2 className="text-2xl font-bold mb-2">What should we call you?</h2>
      <p className="text-gray-400 mb-6">This is your gamer tag for your fitness journey.</p>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter your name..."
        className="w-full bg-bg-secondary border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent-primary mb-6"
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
  const options: { gender: Gender; label: string; icon: LucideIcon; color: string }[] = [
    { gender: 'male', label: 'Male', icon: TrendingUp, color: 'text-blue-400' },
    { gender: 'female', label: 'Female', icon: Sparkles, color: 'text-pink-400' }
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">What's your biological sex?</h2>
      <p className="text-gray-400 mb-6">This helps us calculate your metabolism more accurately.</p>

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
                <Icon size={28} className={opt.color} />
                <p className="font-semibold text-lg">{opt.label}</p>
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
  const options: { level: FitnessLevel; label: string; description: string; icon: LucideIcon; color: string }[] = [
    { level: 'beginner', label: 'Beginner', description: 'New to lifting or returning after a break', icon: Sprout, color: 'text-green-400' },
    { level: 'intermediate', label: 'Intermediate', description: '1-3 years of consistent training', icon: Dumbbell, color: 'text-accent-primary' },
    { level: 'advanced', label: 'Advanced', description: '3+ years, know your way around the gym', icon: Flame, color: 'text-accent-warning' }
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">What's your fitness level?</h2>
      <p className="text-gray-400 mb-6">This helps us tailor your experience.</p>

      <div className="space-y-3 mb-6">
        {options.map((opt) => {
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
  const options: { days: TrainingDays; label: string; description: string }[] = [
    { days: 3, label: '3 Days', description: 'Push/Pull/Legs - Great for beginners' },
    { days: 4, label: '4 Days', description: 'Upper/Lower Split - Balanced approach' },
    { days: 5, label: '5 Days', description: 'PPL + Upper/Lower - Maximum gains' }
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">How many days can you train?</h2>
      <p className="text-gray-400 mb-6">Be realistic - consistency beats intensity.</p>

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
                <p className="font-semibold text-lg">{opt.label}</p>
                <p className="text-sm text-gray-400">{opt.description}</p>
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
  const goals: { value: Goal; label: string; description: string; icon: LucideIcon; color: string }[] = [
    { value: 'cut', label: 'Cut', description: 'Lose fat, maintain muscle', icon: TrendingDown, color: 'text-red-400' },
    { value: 'recomp', label: 'Recomp', description: 'Build muscle while losing fat', icon: RefreshCw, color: 'text-purple-400' },
    { value: 'maintain', label: 'Maintain', description: 'Stay at current weight', icon: Scale, color: 'text-blue-400' },
    { value: 'bulk', label: 'Bulk', description: 'Build muscle, gain weight', icon: TrendingUp, color: 'text-green-400' }
  ]

  // Convert height to feet and inches for display
  const feet = Math.floor(height / 12)
  const inches = height % 12

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Your Stats & Goal</h2>
      <p className="text-gray-400 mb-6">We'll calculate your macros based on this.</p>

      {/* Height */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">Height</label>
        <div className="flex gap-3">
          <div className="flex-1">
            <div className="relative">
              <input
                type="number"
                value={feet}
                onChange={(e) => onHeightChange(Number(e.target.value) * 12 + inches)}
                className="w-full bg-bg-secondary border border-gray-700 rounded-lg px-4 py-3 text-white font-digital text-xl pr-12"
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
                className="w-full bg-bg-secondary border border-gray-700 rounded-lg px-4 py-3 text-white font-digital text-xl pr-12"
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
          <label className="block text-sm text-gray-400 mb-2">Weight (lbs)</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => onWeightChange(Number(e.target.value))}
            className="w-full bg-bg-secondary border border-gray-700 rounded-lg px-4 py-3 text-white font-digital text-xl"
            min={80}
            max={400}
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm text-gray-400 mb-2">Age</label>
          <input
            type="number"
            value={age}
            onChange={(e) => onAgeChange(Number(e.target.value))}
            className="w-full bg-bg-secondary border border-gray-700 rounded-lg px-4 py-3 text-white font-digital text-xl"
            min={16}
            max={80}
          />
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {goals.map((opt) => {
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
        })}
      </div>

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
  const options: { base: AvatarBase; label: string; icon: LucideIcon; color: string; description: string }[] = [
    { base: 'warrior', label: 'Warrior', icon: Sword, color: 'text-red-400', description: 'Strength and discipline' },
    { base: 'mage', label: 'Mage', icon: Wand2, color: 'text-purple-400', description: 'Knowledge and power' },
    { base: 'rogue', label: 'Rogue', icon: Moon, color: 'text-blue-400', description: 'Speed and agility' }
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Choose your avatar</h2>
      <p className="text-gray-400 mb-6">This character will evolve with your progress.</p>

      <div className="space-y-3 mb-6">
        {options.map((opt) => {
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

function TutorialStep({
  username,
  onFinish,
  onBack
}: {
  username: string
  onFinish: () => void
  onBack: () => void
}) {
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
      <p className="text-gray-400 mb-6">Here's how to earn XP:</p>

      <div className="space-y-4 text-left mb-8">
        <Card>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Dumbbell size={20} className="text-accent-primary" />
              <span>Complete a workout</span>
            </div>
            <span className="text-accent-primary font-digital font-bold">+100 XP</span>
          </div>
        </Card>
        <Card>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Beef size={20} className="text-accent-success" />
              <span>Hit protein target</span>
            </div>
            <span className="text-accent-primary font-digital font-bold">+50 XP</span>
          </div>
        </Card>
        <Card>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Zap size={20} className="text-accent-warning" />
              <span>Hit calorie target</span>
            </div>
            <span className="text-accent-primary font-digital font-bold">+50 XP</span>
          </div>
        </Card>
        <Card>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-accent-secondary" />
              <span>Daily check-in</span>
            </div>
            <span className="text-accent-primary font-digital font-bold">+25 XP</span>
          </div>
        </Card>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        XP accumulates all week and can be claimed every Sunday!
      </p>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onFinish} fullWidth size="lg">
          Start My Journey
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

  const avatarIcons: Record<AvatarBase, { icon: LucideIcon; color: string }> = {
    warrior: { icon: Sword, color: 'text-red-400' },
    mage: { icon: Wand2, color: 'text-purple-400' },
    rogue: { icon: Moon, color: 'text-blue-400' }
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
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)'
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <span className="text-sm font-semibold text-accent-primary uppercase tracking-wider">
          First Evolution!
        </span>
      </motion.div>

      <h2 className="text-2xl font-bold mb-8">Congratulations, {username}!</h2>

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
              <div className="text-8xl mb-2">{oldStage.emoji}</div>
              <p className="text-gray-400">{oldStage.name}</p>
            </motion.div>
          ) : (
            <motion.div
              key="new"
              initial={{
                scale: 0,
                rotate: -180,
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
                <div className="text-8xl mb-2">{newStage.emoji}</div>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-bold text-accent-primary"
              >
                {newStage.name}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sparkle effects when evolved */}
        {showNew && (
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

      {/* Level up indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: showNew ? 0.5 : 2 }}
        className="mb-6"
      >
        <Card className="inline-block px-6">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase">Level</p>
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
              <p className="text-xs text-gray-500 uppercase">Level</p>
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
        Your journey begins! Keep earning XP to evolve further.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: showNew ? 1 : 2.5 }}
      >
        <Button onClick={onContinue} fullWidth size="lg">
          Let's Go!
        </Button>
      </motion.div>
    </div>
  )
}
