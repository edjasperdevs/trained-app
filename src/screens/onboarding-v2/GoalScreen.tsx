import { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { ChevronLeft, TrendingUp, Zap, Dumbbell, Heart } from 'lucide-react'
import { useOnboardingStore } from '@/stores'
import { ProgressIndicator } from '@/components/onboarding'
import { WTLogo } from '@/components'
import { haptics } from '@/lib/haptics'

type GoalId = 'build_muscle' | 'lose_fat' | 'get_stronger' | 'improve_fitness'

const GOALS = [
  { id: 'build_muscle' as const, label: 'BUILD MUSCLE', subtitle: 'Add size and strength', icon: TrendingUp },
  { id: 'lose_fat' as const, label: 'LOSE FAT', subtitle: 'Lean out and define', icon: Zap },
  { id: 'get_stronger' as const, label: 'LEAN GAINS', subtitle: 'Build muscle, lose fat', icon: Dumbbell },
  { id: 'improve_fitness' as const, label: 'IMPROVE OVERALL FITNESS', subtitle: 'Build a complete foundation', icon: Heart },
] as const

export function GoalScreen() {
  const { nextStep, prevStep, updateData } = useOnboardingStore()
  const [selectedGoal, setSelectedGoal] = useState<GoalId | null>(null)

  const canContinue = selectedGoal !== null

  const handleGoalSelect = (goalId: GoalId) => {
    if (goalId !== selectedGoal) {
      haptics.light()
      setSelectedGoal(goalId)
    }
  }

  const handleContinue = () => {
    if (!canContinue || !selectedGoal) return
    updateData({ goal: selectedGoal })
    nextStep()
  }

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

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const cardVariants: Variants = {
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
        <ProgressIndicator totalSteps={8} currentStep={6} />
        <div className="w-10" /> {/* Spacer for alignment */}
      </motion.div>

      {/* YOUR MISSION label */}
      <motion.p
        className="text-[#D4A853] text-xs tracking-[0.2em] uppercase text-center mb-4"
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
      >
        YOUR MISSION
      </motion.p>

      {/* Main headline */}
      <motion.h1
        className="text-3xl md:text-4xl font-black text-[#FAFAFA] text-center leading-tight mb-8"
        style={{ fontFamily: "'Oswald', sans-serif" }}
        initial="hidden"
        animate="visible"
        variants={headlineVariants}
      >
        WHAT ARE YOU TRAINING FOR
      </motion.h1>

      {/* Goal cards */}
      <motion.div
        className="flex flex-col gap-4 flex-1"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {GOALS.map((goal) => {
          const Icon = goal.icon
          const isSelected = selectedGoal === goal.id

          return (
            <motion.button
              key={goal.id}
              variants={cardVariants}
              onClick={() => handleGoalSelect(goal.id)}
              className={`flex items-center gap-4 py-4 px-5 rounded-xl transition-all duration-150 ease-out ${
                isSelected
                  ? 'bg-[rgba(212,168,83,0.08)] border-2 border-[#D4A853]'
                  : 'bg-[#26282B] border border-[#3F3F46]'
              }`}
            >
              <Icon
                className={`w-6 h-6 flex-shrink-0 ${
                  isSelected ? 'text-[#D4A853]' : 'text-[#D4A853]'
                }`}
              />
              <div className="flex flex-col items-start text-left">
                <span
                  className={`font-bold text-base ${
                    isSelected ? 'text-[#FAFAFA]' : 'text-[#FAFAFA]'
                  }`}
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  {goal.label}
                </span>
                <span className="text-[#A1A1AA] text-sm">{goal.subtitle}</span>
              </div>
            </motion.button>
          )
        })}
      </motion.div>

      {/* Logo watermark - centered in remaining space */}
      <motion.div
        className="flex-1 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <WTLogo className="w-24 h-auto" />
      </motion.div>

      {/* Bottom CTA */}
      <motion.div
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
