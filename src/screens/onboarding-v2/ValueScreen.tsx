import { motion, type Variants } from 'framer-motion'
import { Zap, Crown, Shield, ChevronLeft } from 'lucide-react'
import { useOnboardingStore } from '@/stores'
import { ProgressIndicator } from '@/components/onboarding'

const benefits = [
  {
    icon: Zap,
    title: 'Earn Discipline Points for every workout, meal, and habit.',
    description: 'Build consistency and track your dedication with our unique point system.',
  },
  {
    icon: Crown,
    title: 'Rank up through 16 tiers from Uninitiated to Master.',
    description: 'Compete against yourself and others as you climb the ranks.',
  },
  {
    icon: Shield,
    title: 'Your avatar evolves as you level up.',
    description: 'Visualize your progress with an avatar that grows stronger with you.',
  },
]

export function ValueScreen() {
  const { nextStep, prevStep } = useOnboardingStore()

  // Animation variants
  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.4, // After headline
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

  const benefitVariants: Variants = {
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
        <ProgressIndicator totalSteps={7} currentStep={1} />
        <div className="w-10" /> {/* Spacer for alignment */}
      </motion.div>

      {/* THE PROTOCOL label */}
      <motion.p
        className="text-[#D4A853] text-xs tracking-[0.2em] uppercase text-center mb-4"
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
      >
        THE PROTOCOL
      </motion.p>

      {/* Main headline */}
      <motion.h1
        className="text-3xl md:text-4xl font-black text-[#FAFAFA] text-center leading-tight mb-12"
        style={{ fontFamily: "'Oswald', sans-serif" }}
        initial="hidden"
        animate="visible"
        variants={headlineVariants}
      >
        IMAGINE A FITNESS APP THAT TRAINS YOU LIKE A CHAMPION
      </motion.h1>

      {/* Benefit rows */}
      <motion.div
        className="flex flex-col gap-6 flex-1"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon
          return (
            <motion.div
              key={index}
              variants={benefitVariants}
              className="flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-[#D4A853]/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-6 h-6 text-[#D4A853]" />
              </div>
              <div className="flex-1">
                <p className="text-[#FAFAFA] font-semibold text-base leading-snug mb-1">
                  {benefit.title}
                </p>
                <p className="text-[#A1A1AA] text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Bottom CTA */}
      <motion.div
        className="mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.3, ease: [0, 0, 0.2, 1] }}
      >
        <button
          onClick={nextStep}
          className="w-full py-4 bg-[#D4A853] text-[#0A0A0A] font-bold text-lg tracking-wider rounded-lg"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          NEXT
        </button>
      </motion.div>
    </div>
  )
}
