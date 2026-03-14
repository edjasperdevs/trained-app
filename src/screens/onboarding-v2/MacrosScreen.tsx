import { useState, useEffect, useRef } from 'react'
import { motion, type Variants } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { useOnboardingStore, useMacroStore } from '@/stores'
import { ProgressIndicator } from '@/components/onboarding'
import type { Goal } from '@/stores/userStore'

// Map onboarding goal to macroStore goal type
const GOAL_MAP: Record<string, Goal> = {
  build_muscle: 'bulk',
  lose_fat: 'cut',
  get_stronger: 'recomp',
  improve_fitness: 'maintain',
}

// Calorie adjustments by goal
const GOAL_CALORIE_ADJUSTMENTS: Record<Goal, number> = {
  cut: -500,
  recomp: -200,
  maintain: 0,
  bulk: 300,
}

// Activity level multipliers for TDEE calculation
const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
}

interface CalculatedMacros {
  protein: number
  carbs: number
  fat: number
  calories: number
}

export function MacrosScreen() {
  const { nextStep, prevStep, updateData, data } = useOnboardingStore()
  const setOnboardingTargets = useMacroStore((s) => s.setOnboardingTargets)

  const [macros, setMacros] = useState<CalculatedMacros | null>(null)
  const [chartAnimated, setChartAnimated] = useState(false)
  const [countUpStarted, setCountUpStarted] = useState(false)
  const [countUpValues, setCountUpValues] = useState({ protein: 0, carbs: 0, fat: 0 })

  // Calculate macros on mount using actual user data from onboarding
  useEffect(() => {
    // Get actual user data from onboarding, with fallback defaults
    const height = data.height || 70 // inches (internal storage)
    const weight = data.weight || 185 // lbs (internal storage)
    const age = data.age || 30
    const gender = data.gender || 'male'
    const activityLevel = data.activityLevel || 'moderately_active'

    // Get goal from onboarding data, default to maintain
    const onboardingGoal = data.goal || 'improve_fitness'
    const goal: Goal = GOAL_MAP[onboardingGoal] || 'maintain'

    // Mifflin-St Jeor formula using REAL user data
    const weightKg = weight * 0.453592
    const heightCm = height * 2.54
    const genderAdjustment = gender === 'male' ? 5 : -161
    const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + genderAdjustment

    // Apply activity multiplier based on user's selected activity level
    const activityMultiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.55
    const tdee = bmr * activityMultiplier
    const adjustedCalories = Math.round(tdee + GOAL_CALORIE_ADJUSTMENTS[goal])

    // Protein: 1g per lb
    const protein = Math.round(weight * 1)

    // Fat: 27% of calories
    const fatCalories = adjustedCalories * 0.27
    const fat = Math.round(fatCalories / 9)

    // Carbs: remaining calories
    const proteinCalories = protein * 4
    const carbCalories = adjustedCalories - proteinCalories - fatCalories
    const carbs = Math.round(carbCalories / 4)

    setMacros({ protein, carbs, fat, calories: adjustedCalories })
  }, [data.goal, data.height, data.weight, data.age, data.gender, data.activityLevel])

  // Start chart animation after 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => setChartAnimated(true), 300)
    return () => clearTimeout(timer)
  }, [])

  // Start count-up after chart completes (800ms after chartAnimated)
  useEffect(() => {
    if (!chartAnimated) return
    const timer = setTimeout(() => setCountUpStarted(true), 800)
    return () => clearTimeout(timer)
  }, [chartAnimated])

  // Count-up animation for stat cards
  const animationRef = useRef<number>()
  useEffect(() => {
    if (!countUpStarted || !macros) return

    const duration = 600
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)

      setCountUpValues({
        protein: Math.round(eased * macros.protein),
        carbs: Math.round(eased * macros.carbs),
        fat: Math.round(eased * macros.fat),
      })

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [countUpStarted, macros])

  const handleAccept = () => {
    if (!macros) return

    // Store macros in onboarding data
    updateData({ macros })

    // Set targets in macroStore
    setOnboardingTargets({
      protein: macros.protein,
      carbs: macros.carbs,
      fats: macros.fat,
      calories: macros.calories,
    })

    nextStep()
  }

  // Calculate percentages for donut chart
  const getPercentages = () => {
    if (!macros) return { protein: 33, carbs: 34, fat: 33 }
    const proteinCals = macros.protein * 4
    const carbsCals = macros.carbs * 4
    const fatCals = macros.fat * 9
    const total = proteinCals + carbsCals + fatCals
    return {
      protein: Math.round((proteinCals / total) * 100),
      carbs: Math.round((carbsCals / total) * 100),
      fat: Math.round((fatCals / total) * 100),
    }
  }

  const percentages = getPercentages()

  // Animation variants
  const fadeInVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3, ease: [0, 0, 0.2, 1] },
    },
  }

  const headlineVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0, 0, 0.2, 1] },
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
        <ProgressIndicator totalSteps={8} currentStep={8} />
        <div className="w-10" />
      </motion.div>

      {/* YOUR FUEL PROTOCOL label */}
      <motion.p
        className="text-[#D4A853] text-xs tracking-[0.2em] uppercase text-center mb-4"
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
      >
        YOUR FUEL PROTOCOL
      </motion.p>

      {/* Main headline */}
      <motion.h1
        className="text-3xl font-black text-[#FAFAFA] text-center leading-tight mb-2"
        style={{ fontFamily: "'Oswald', sans-serif" }}
        initial="hidden"
        animate="visible"
        variants={headlineVariants}
      >
        YOUR DAILY TARGETS
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="text-[#A1A1AA] text-center text-sm mb-8"
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
      >
        Based on your profile, here are your recommended macros.
      </motion.p>

      {/* Donut Chart */}
      <motion.div
        className="flex justify-center mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <DonutChart
          macros={macros}
          animated={chartAnimated}
          percentages={percentages}
        />
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        className="flex gap-3 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      >
        <StatCard
          label="PROTEIN"
          value={countUpValues.protein}
          percentage={percentages.protein}
        />
        <StatCard
          label="CARBS"
          value={countUpValues.carbs}
          percentage={percentages.carbs}
        />
        <StatCard
          label="FAT"
          value={countUpValues.fat}
          percentage={percentages.fat}
        />
      </motion.div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer text */}
      <motion.p
        className="text-[#A1A1AA] text-sm text-center mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.3 }}
      >
        These targets are calculated from your profile. Your coach may adjust them.
      </motion.p>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.3, ease: [0, 0, 0.2, 1] }}
      >
        <button
          onClick={handleAccept}
          disabled={!macros}
          className={`w-full py-4 bg-[#D4A853] text-[#0A0A0A] font-bold text-lg tracking-wider rounded-lg transition-opacity ${
            !macros ? 'opacity-50 pointer-events-none' : ''
          }`}
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          ACCEPT MY PROTOCOL
        </button>
      </motion.div>
    </div>
  )
}

// Donut Chart Component
interface DonutChartProps {
  macros: CalculatedMacros | null
  animated: boolean
  percentages: { protein: number; carbs: number; fat: number }
}

function DonutChart({ macros, animated, percentages }: DonutChartProps) {
  const size = 240
  const strokeWidth = 28
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  // Calculate segment lengths based on percentages
  const proteinLength = (percentages.protein / 100) * circumference
  const carbsLength = (percentages.carbs / 100) * circumference
  const fatLength = (percentages.fat / 100) * circumference

  // Calculate offsets for each segment (starting from top, going clockwise)
  // SVG circles start at 3 o'clock, so we rotate -90deg to start at 12 o'clock
  const proteinOffset = 0
  const carbsOffset = proteinLength
  const fatOffset = proteinLength + carbsLength

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#26282B"
          strokeWidth={strokeWidth}
        />

        {/* Fat segment (muted gold) */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#8B7355"
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          strokeDasharray={`${fatLength} ${circumference}`}
          strokeDashoffset={animated ? -fatOffset : circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: animated ? -fatOffset : circumference }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        />

        {/* Carbs segment (lighter gold) */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5C98A"
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          strokeDasharray={`${carbsLength} ${circumference}`}
          strokeDashoffset={animated ? -carbsOffset : circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: animated ? -carbsOffset : circumference }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        />

        {/* Protein segment (gold) */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#D4A853"
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          strokeDasharray={`${proteinLength} ${circumference}`}
          strokeDashoffset={animated ? -proteinOffset : circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: animated ? -proteinOffset : circumference }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-black text-[#FAFAFA]"
          style={{ fontFamily: "'Oswald', sans-serif" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          {macros?.calories.toLocaleString() ?? '---'}
        </motion.span>
        <motion.span
          className="text-xs text-[#A1A1AA] tracking-[0.15em] uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        >
          CALORIES
        </motion.span>
      </div>
    </div>
  )
}

// Stat Card Component
interface StatCardProps {
  label: string
  value: number
  percentage: number
}

function StatCard({ label, value, percentage }: StatCardProps) {
  return (
    <div className="flex-1 bg-[#26282B] rounded-xl py-4 text-center">
      <p className="text-[#A1A1AA] text-xs uppercase tracking-wide mb-1">{label}</p>
      <p
        className="text-2xl font-bold text-[#FAFAFA]"
        style={{ fontFamily: "'Oswald', sans-serif" }}
      >
        {value}g
      </p>
      <p className="text-[#A1A1AA] text-sm">{percentage}%</p>
    </div>
  )
}
