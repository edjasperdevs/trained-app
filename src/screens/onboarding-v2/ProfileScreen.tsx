import { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { ChevronLeft, Activity } from 'lucide-react'
import { useOnboardingStore } from '@/stores'
import { ProgressIndicator } from '@/components/onboarding'
import { haptics } from '@/lib/haptics'

type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active'

const TRAINING_DAYS = [3, 4, 5] as const

const ACTIVITY_LEVELS: {
  value: ActivityLevel
  label: string
  description: string
  iconBars: number
}[] = [
  {
    value: 'sedentary',
    label: 'Sedentary',
    description: 'Desk job, little to no exercise outside of training sessions',
    iconBars: 1
  },
  {
    value: 'lightly_active',
    label: 'Lightly Active',
    description: 'Light exercise or walking 1-3 days per week',
    iconBars: 2
  },
  {
    value: 'moderately_active',
    label: 'Moderately Active',
    description: 'Active job or regular daily movement, moderate exercise 3-5 days per week',
    iconBars: 3
  },
  {
    value: 'very_active',
    label: 'Very Active',
    description: 'Physically demanding job or intense exercise 6-7 days per week',
    iconBars: 4
  },
]

export function ProfileScreen() {
  const { nextStep, prevStep, updateData, data } = useOnboardingStore()

  // Local form state - initialize from store if exists
  const [name, setName] = useState(data.name || '')
  const [gender, setGender] = useState<'male' | 'female'>(data.gender || 'male')
  const [age, setAge] = useState<number>(data.age || 25)
  const [trainingDays, setTrainingDays] = useState<number>(data.trainingDays || 4)
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(data.activityLevel || 'moderately_active')

  const canContinue = name.trim().length > 0 && age > 0

  const handleContinue = () => {
    if (!canContinue) return

    updateData({
      name: name.trim(),
      gender,
      age,
      trainingDays,
      activityLevel
    })
    nextStep()
  }

  const handleTrainingDaysChange = (days: number) => {
    if (days !== trainingDays) {
      haptics.light()
      setTrainingDays(days)
    }
  }

  const handleActivityLevelChange = (level: ActivityLevel) => {
    if (level !== activityLevel) {
      haptics.light()
      setActivityLevel(level)
    }
  }

  const selectedActivityDescription = ACTIVITY_LEVELS.find(
    (level) => level.value === activityLevel
  )?.description || ''

  // Animation variants
  const fadeInVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: [0, 0, 0.2, 1],
      },
    },
  }

  const headlineVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0, 0, 0.2, 1],
      },
    },
  }

  const formContainerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const formItemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0, 0, 0.2, 1],
      },
    },
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col px-6 pb-8">
      {/* Header with back button and progress */}
      <motion.div
        className="flex items-center justify-between mb-8"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
      >
        <button
          onClick={prevStep}
          className="w-10 h-10 flex items-center justify-center text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <ProgressIndicator totalSteps={5} currentStep={1} />
        <div className="w-10" /> {/* Spacer for alignment */}
      </motion.div>

      {/* YOUR PROFILE label */}
      <motion.p
        className="text-[#D4A853] text-xs tracking-[0.2em] uppercase text-center mb-4"
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
      >
        YOUR PROFILE
      </motion.p>

      {/* Main headline */}
      <motion.h1
        className="text-3xl md:text-4xl font-black text-[#FAFAFA] text-center leading-tight mb-8"
        style={{ fontFamily: "'Oswald', sans-serif" }}
        initial="hidden"
        animate="visible"
        variants={headlineVariants}
      >
        TELL US ABOUT YOURSELF
      </motion.h1>

      {/* Form elements */}
      <motion.div
        className="flex flex-col gap-6 flex-1"
        initial="hidden"
        animate="visible"
        variants={formContainerVariants}
      >
        {/* Name input */}
        <motion.div variants={formItemVariants}>
          <label className="block text-[#FAFAFA] text-sm font-medium mb-2">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-3 bg-[#26282B] border border-[#2A2A2A] rounded-lg text-[#FAFAFA] placeholder-[#71717A] focus:border-[#D4A853] focus:outline-none transition-colors"
          />
        </motion.div>

        {/* Sex assigned at birth toggle */}
        <motion.div variants={formItemVariants}>
          <label className="block text-[#FAFAFA] text-sm font-medium mb-2">Sex assigned at birth</label>
          <div className="flex gap-3">
            <button
              onClick={() => setGender('male')}
              className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all ${
                gender === 'male'
                  ? 'bg-[#D4A853]/8 border-2 border-[#D4A853] text-[#D4A853]'
                  : 'bg-[#26282B] border border-[#2A2A2A] text-[#A1A1AA]'
              }`}
            >
              Male
            </button>
            <button
              onClick={() => setGender('female')}
              className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all ${
                gender === 'female'
                  ? 'bg-[#D4A853]/8 border-2 border-[#D4A853] text-[#D4A853]'
                  : 'bg-[#26282B] border border-[#2A2A2A] text-[#A1A1AA]'
              }`}
            >
              Female
            </button>
          </div>
        </motion.div>

        {/* Age input */}
        <motion.div variants={formItemVariants}>
          <label className="block text-[#FAFAFA] text-sm font-medium mb-2">Age</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            placeholder="Age"
            className="w-full px-4 py-3 bg-[#26282B] border border-[#2A2A2A] rounded-lg text-[#FAFAFA] placeholder-[#71717A] focus:border-[#D4A853] focus:outline-none transition-colors"
          />
        </motion.div>

        {/* Training days selector */}
        <motion.div variants={formItemVariants}>
          <label className="block text-[#FAFAFA] text-sm font-medium mb-3">
            Training days per week
          </label>
          <div className="flex gap-2 justify-between">
            {TRAINING_DAYS.map((days) => (
              <button
                key={days}
                onClick={() => handleTrainingDaysChange(days)}
                className={`w-12 h-12 rounded-full font-semibold text-sm transition-all ${
                  trainingDays === days
                    ? 'bg-[#D4A853]/8 border-2 border-[#D4A853] text-[#D4A853] scale-110'
                    : 'bg-[#26282B] border border-[#2A2A2A] text-[#A1A1AA]'
                }`}
              >
                {days}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Activity level cards */}
        <motion.div variants={formItemVariants}>
          <label className="block text-[#FAFAFA] text-sm font-medium mb-3">Activity level</label>
          <div className="grid grid-cols-2 gap-3">
            {ACTIVITY_LEVELS.map(({ value, label, iconBars }) => (
              <button
                key={value}
                onClick={() => handleActivityLevelChange(value)}
                className={`flex flex-col items-center py-4 rounded-lg transition-all ${
                  activityLevel === value
                    ? 'bg-[#D4A853]/8 border-2 border-[#D4A853]'
                    : 'bg-[#26282B] border border-[#2A2A2A]'
                }`}
              >
                {/* Activity icon with varying intensity */}
                <div className="mb-2 relative">
                  <Activity
                    className={`w-8 h-8 ${
                      activityLevel === value ? 'text-[#D4A853]' : 'text-[#71717A]'
                    }`}
                    strokeWidth={iconBars === 1 ? 1.5 : iconBars === 2 ? 2 : iconBars === 3 ? 2.5 : 3}
                  />
                  {/* Visual intensity indicators */}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {Array.from({ length: iconBars }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1 rounded-full ${
                          activityLevel === value ? 'bg-[#D4A853]' : 'bg-[#71717A]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span
                  className={`text-xs font-medium text-center ${
                    activityLevel === value ? 'text-[#D4A853]' : 'text-[#A1A1AA]'
                  }`}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>

          {/* Activity level description */}
          <motion.div
            className="mt-4 p-3 bg-[#26282B] border border-[#2A2A2A] rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            key={activityLevel}
          >
            <p className="text-[#A1A1AA] text-sm text-center">
              {selectedActivityDescription}
            </p>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Bottom CTA */}
      <motion.div
        className="mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.3, ease: [0, 0, 0.2, 1] }}
      >
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className={`w-full py-4 bg-[#D4A853] text-[#0A0A0A] font-bold text-lg tracking-wider rounded-lg transition-opacity ${
            !canContinue ? 'opacity-50 pointer-events-none' : ''
          }`}
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          CONTINUE
        </button>
      </motion.div>
    </div>
  )
}
