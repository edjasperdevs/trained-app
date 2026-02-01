import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button, Card } from '@/components'
import {
  useUserStore,
  useWorkoutStore,
  useMacroStore,
  useAvatarStore,
  FitnessLevel,
  TrainingDays,
  Goal,
  AvatarBase,
  Gender
} from '@/stores'

type Step = 'welcome' | 'name' | 'gender' | 'fitness' | 'days' | 'goal' | 'avatar' | 'tutorial'

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
  const { setBaseCharacter } = useAvatarStore()

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
    avatarBase: 'warrior'
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
        className="text-8xl mb-6"
      >
        🎮
      </motion.div>
      <h1 className="text-3xl font-bold mb-2">Gamify Your Gains</h1>
      <p className="text-gray-400 mb-8">
        Turn your fitness journey into a game. Level up your avatar as you level up yourself.
      </p>
      <div className="space-y-3 text-left mb-8">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-2xl">✨</span>
          <span className="text-gray-300">Earn XP for workouts, hitting macros, and consistency</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-2xl">🦾</span>
          <span className="text-gray-300">Watch your avatar evolve as you progress</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-2xl">🔥</span>
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
  const options: { gender: Gender; label: string; emoji: string }[] = [
    { gender: 'male', label: 'Male', emoji: '♂️' },
    { gender: 'female', label: 'Female', emoji: '♀️' }
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">What's your biological sex?</h2>
      <p className="text-gray-400 mb-6">This helps us calculate your metabolism more accurately.</p>

      <div className="space-y-3 mb-6">
        {options.map((opt) => (
          <Card
            key={opt.gender}
            onClick={() => onChange(opt.gender)}
            hover
            className={`border-2 ${value === opt.gender ? 'border-accent-primary' : 'border-transparent'}`}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">{opt.emoji}</span>
              <p className="font-semibold text-lg">{opt.label}</p>
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
  const options: { level: FitnessLevel; label: string; description: string; emoji: string }[] = [
    { level: 'beginner', label: 'Beginner', description: 'New to lifting or returning after a break', emoji: '🌱' },
    { level: 'intermediate', label: 'Intermediate', description: '1-3 years of consistent training', emoji: '💪' },
    { level: 'advanced', label: 'Advanced', description: '3+ years, know your way around the gym', emoji: '🔥' }
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">What's your fitness level?</h2>
      <p className="text-gray-400 mb-6">This helps us tailor your experience.</p>

      <div className="space-y-3 mb-6">
        {options.map((opt) => (
          <Card
            key={opt.level}
            onClick={() => onChange(opt.level)}
            hover
            className={`border-2 ${value === opt.level ? 'border-accent-primary' : 'border-transparent'}`}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">{opt.emoji}</span>
              <div>
                <p className="font-semibold">{opt.label}</p>
                <p className="text-sm text-gray-400">{opt.description}</p>
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
  const goals: { value: Goal; label: string; description: string; emoji: string }[] = [
    { value: 'cut', label: 'Cut', description: 'Lose fat, maintain muscle', emoji: '🔥' },
    { value: 'recomp', label: 'Recomp', description: 'Build muscle while losing fat', emoji: '🔄' },
    { value: 'maintain', label: 'Maintain', description: 'Stay at current weight', emoji: '⚖️' },
    { value: 'bulk', label: 'Bulk', description: 'Build muscle, gain weight', emoji: '📈' }
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
        {goals.map((opt) => (
          <Card
            key={opt.value}
            onClick={() => onGoalChange(opt.value)}
            hover
            className={`border-2 ${goal === opt.value ? 'border-accent-primary' : 'border-transparent'}`}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">{opt.emoji}</span>
              <div>
                <p className="font-semibold">{opt.label}</p>
                <p className="text-sm text-gray-400">{opt.description}</p>
              </div>
            </div>
          </Card>
        ))}
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
  const options: { base: AvatarBase; label: string; emoji: string; description: string }[] = [
    { base: 'warrior', label: 'Warrior', emoji: '⚔️', description: 'Strength and discipline' },
    { base: 'mage', label: 'Mage', emoji: '🔮', description: 'Knowledge and power' },
    { base: 'rogue', label: 'Rogue', emoji: '🌙', description: 'Speed and agility' }
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Choose your avatar</h2>
      <p className="text-gray-400 mb-6">This character will evolve with your progress.</p>

      <div className="space-y-3 mb-6">
        {options.map((opt) => (
          <Card
            key={opt.base}
            onClick={() => onChange(opt.base)}
            hover
            className={`border-2 ${value === opt.base ? 'border-accent-primary' : 'border-transparent'}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center text-4xl">
                {opt.emoji}
              </div>
              <div>
                <p className="font-semibold text-lg">{opt.label}</p>
                <p className="text-sm text-gray-400">{opt.description}</p>
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
        className="text-6xl mb-4"
      >
        🎉
      </motion.div>
      <h2 className="text-2xl font-bold mb-2">You're all set, {username}!</h2>
      <p className="text-gray-400 mb-6">Here's how to earn XP:</p>

      <div className="space-y-4 text-left mb-8">
        <Card>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-xl">🏋️</span>
              <span>Complete a workout</span>
            </div>
            <span className="text-accent-primary font-digital font-bold">+100 XP</span>
          </div>
        </Card>
        <Card>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-xl">🥩</span>
              <span>Hit protein target</span>
            </div>
            <span className="text-accent-primary font-digital font-bold">+50 XP</span>
          </div>
        </Card>
        <Card>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔥</span>
              <span>Hit calorie target</span>
            </div>
            <span className="text-accent-primary font-digital font-bold">+50 XP</span>
          </div>
        </Card>
        <Card>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-xl">✅</span>
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
