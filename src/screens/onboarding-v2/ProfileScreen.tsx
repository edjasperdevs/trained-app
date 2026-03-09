import { useState, useEffect } from 'react'
import { motion, type Variants } from 'framer-motion'
import { ChevronLeft, Dumbbell } from 'lucide-react'
import { useOnboardingStore } from '@/stores'
import { ProgressIndicator } from '@/components/onboarding'
import { haptics } from '@/lib/haptics'
import { getWeightUnit, getHeightUnit, toInternalWeight, toInternalHeight, toDisplayWeight, toDisplayHeight } from '@/lib/units'

type Units = 'imperial' | 'metric'
type FitnessLevel = 'beginner' | 'intermediate' | 'advanced'

const TRAINING_DAYS = [3, 4, 5] as const

const FITNESS_LEVELS: { value: FitnessLevel; label: string; iconBars: number }[] = [
  { value: 'beginner', label: 'Beginner', iconBars: 1 },
  { value: 'intermediate', label: 'Intermediate', iconBars: 2 },
  { value: 'advanced', label: 'Advanced', iconBars: 3 },
]

export function ProfileScreen() {
  const { nextStep, prevStep, updateData, data } = useOnboardingStore()

  // Local form state - initialize from store if exists
  const [name, setName] = useState(data.name || '')
  const [units, setUnits] = useState<Units>(data.units || 'imperial')
  const [gender, setGender] = useState<'male' | 'female'>(data.gender || 'male')
  const [age, setAge] = useState<number>(data.age || 25)
  const [weight, setWeight] = useState<number>(data.weight ? toDisplayWeight(data.weight, units) : units === 'metric' ? 75 : 165)
  const [height, setHeight] = useState<number>(data.height ? toDisplayHeight(data.height, units) : units === 'metric' ? 175 : 69)
  const [trainingDays, setTrainingDays] = useState<number>(data.trainingDays || 4)
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>(data.fitnessLevel || 'intermediate')

  const canContinue = name.trim().length > 0 && age > 0 && weight > 0 && height > 0

  const handleContinue = () => {
    if (!canContinue) return

    // Convert display values to internal storage (lbs and inches)
    const internalWeight = toInternalWeight(weight, units)
    const internalHeight = toInternalHeight(height, units)

    updateData({
      name: name.trim(),
      units,
      gender,
      age,
      weight: internalWeight,
      height: internalHeight,
      trainingDays,
      fitnessLevel
    })
    nextStep()
  }

  const handleUnitsChange = (newUnits: Units) => {
    if (newUnits !== units) {
      haptics.light()
      setUnits(newUnits)
    }
  }

  const handleTrainingDaysChange = (days: number) => {
    if (days !== trainingDays) {
      haptics.light()
      setTrainingDays(days)
    }
  }

  const handleFitnessLevelChange = (level: FitnessLevel) => {
    if (level !== fitnessLevel) {
      haptics.light()
      setFitnessLevel(level)
    }
  }

  // Sync weight/height display when units toggle
  useEffect(() => {
    if (data.weight) {
      setWeight(toDisplayWeight(data.weight, units))
    }
    if (data.height) {
      setHeight(toDisplayHeight(data.height, units))
    }
  }, [units, data.weight, data.height])

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
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col px-6 pt-safe pb-8">
      {/* Header with back button and progress */}
      <motion.div
        className="flex items-center justify-between mb-8"
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
            min="13"
            max="120"
            placeholder="Age"
            className="w-full px-4 py-3 bg-[#26282B] border border-[#2A2A2A] rounded-lg text-[#FAFAFA] placeholder-[#71717A] focus:border-[#D4A853] focus:outline-none transition-colors"
          />
        </motion.div>

        {/* Weight input */}
        <motion.div variants={formItemVariants}>
          <label className="block text-[#FAFAFA] text-sm font-medium mb-2">
            Weight ({getWeightUnit(units)})
          </label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            min={units === 'metric' ? 20 : 50}
            max={units === 'metric' ? 225 : 500}
            placeholder={units === 'metric' ? 'kg' : 'lbs'}
            className="w-full px-4 py-3 bg-[#26282B] border border-[#2A2A2A] rounded-lg text-[#FAFAFA] placeholder-[#71717A] focus:border-[#D4A853] focus:outline-none transition-colors"
          />
        </motion.div>

        {/* Height input */}
        <motion.div variants={formItemVariants}>
          <label className="block text-[#FAFAFA] text-sm font-medium mb-2">
            Height ({getHeightUnit(units)})
          </label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            min={units === 'metric' ? 120 : 48}
            max={units === 'metric' ? 245 : 96}
            placeholder={units === 'metric' ? 'cm' : 'inches'}
            className="w-full px-4 py-3 bg-[#26282B] border border-[#2A2A2A] rounded-lg text-[#FAFAFA] placeholder-[#71717A] focus:border-[#D4A853] focus:outline-none transition-colors"
          />
        </motion.div>

        {/* Units toggle (LBS/KG) */}
        <motion.div variants={formItemVariants}>
          <div className="flex gap-3">
            <button
              onClick={() => handleUnitsChange('imperial')}
              className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all ${
                units === 'imperial'
                  ? 'bg-[#D4A853]/8 border-2 border-[#D4A853] text-[#D4A853]'
                  : 'bg-[#26282B] border border-[#2A2A2A] text-[#A1A1AA]'
              }`}
            >
              LBS
            </button>
            <button
              onClick={() => handleUnitsChange('metric')}
              className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all ${
                units === 'metric'
                  ? 'bg-[#D4A853]/8 border-2 border-[#D4A853] text-[#D4A853]'
                  : 'bg-[#26282B] border border-[#2A2A2A] text-[#A1A1AA]'
              }`}
            >
              KG
            </button>
          </div>
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

        {/* Fitness level cards */}
        <motion.div variants={formItemVariants}>
          <label className="block text-[#FAFAFA] text-sm font-medium mb-3">Fitness level</label>
          <div className="flex gap-3">
            {FITNESS_LEVELS.map(({ value, label, iconBars }) => (
              <button
                key={value}
                onClick={() => handleFitnessLevelChange(value)}
                className={`flex-1 flex flex-col items-center py-4 rounded-lg transition-all ${
                  fitnessLevel === value
                    ? 'bg-[#D4A853]/8 border-2 border-[#D4A853]'
                    : 'bg-[#26282B] border border-[#2A2A2A]'
                }`}
              >
                {/* Dumbbell icon with varying weights */}
                <div className="mb-2 relative">
                  <Dumbbell
                    className={`w-8 h-8 ${
                      fitnessLevel === value ? 'text-[#D4A853]' : 'text-[#71717A]'
                    }`}
                    strokeWidth={iconBars === 1 ? 1.5 : iconBars === 2 ? 2 : 2.5}
                  />
                  {/* Visual weight indicators */}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {Array.from({ length: iconBars }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1 rounded-full ${
                          fitnessLevel === value ? 'bg-[#D4A853]' : 'bg-[#71717A]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span
                  className={`text-xs font-medium ${
                    fitnessLevel === value ? 'text-[#D4A853]' : 'text-[#A1A1AA]'
                  }`}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
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
