import { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { ChevronLeft, ShieldAlert } from 'lucide-react'
import { useOnboardingStore } from '@/stores'
import { ProgressIndicator } from '@/components/onboarding'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/cn'

export function DisclaimerScreen() {
  const { nextStep, prevStep } = useOnboardingStore()
  const [acknowledged, setAcknowledged] = useState(false)

  const canContinue = acknowledged

  const handleContinue = () => {
    if (!canContinue) return
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

  const contentVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants: Variants = {
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
        <ProgressIndicator totalSteps={7} currentStep={6} />
        <div className="w-10" /> {/* Spacer for alignment */}
      </motion.div>

      {/* IMPORTANT label */}
      <motion.p
        className="text-[#D4A853] text-xs tracking-[0.2em] uppercase text-center mb-4"
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
      >
        IMPORTANT
      </motion.p>

      {/* Main headline */}
      <motion.h1
        className="text-3xl md:text-4xl font-black text-[#FAFAFA] text-center leading-tight mb-8"
        style={{ fontFamily: "'Oswald', sans-serif" }}
        initial="hidden"
        animate="visible"
        variants={headlineVariants}
      >
        HEALTH & SAFETY NOTICE
      </motion.h1>

      {/* Content */}
      <motion.div
        className="flex flex-col gap-6 flex-1"
        initial="hidden"
        animate="visible"
        variants={contentVariants}
      >
        {/* Icon */}
        <motion.div variants={itemVariants} className="flex justify-center">
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-[rgba(212,168,83,0.1)] border border-[#D4A853]">
            <ShieldAlert className="w-8 h-8 text-[#D4A853]" />
          </div>
        </motion.div>

        {/* Disclaimer card */}
        <motion.div variants={itemVariants}>
          <Card className="bg-[#26282B] border-[#3F3F46]">
            <CardContent className="space-y-4 text-[#D4D4D8] text-sm leading-relaxed pt-6">
              <p>
                WellTrained is a fitness tracking and discipline app designed to help you build consistent training habits.
              </p>
              <p>
                This app is <strong className="text-[#FAFAFA]">NOT</strong> a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider before starting any new fitness program, especially if you have any pre-existing medical conditions, injuries, or health concerns.
              </p>
              <p>
                The information and guidance provided in this app are for general educational purposes only and should not be considered medical advice.
              </p>
              <p>
                <strong className="text-[#FAFAFA]">Training Safety:</strong> Always use proper form when exercising. Start with appropriate weights and progress gradually. Stop immediately if you experience pain, dizziness, or unusual discomfort.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Checkbox */}
        <motion.label
          variants={itemVariants}
          className="flex items-start gap-3 cursor-pointer group"
        >
          <div className="relative flex items-center justify-center mt-0.5">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="peer sr-only"
            />
            <div className={cn(
              "w-5 h-5 rounded border-2 transition-all duration-200",
              acknowledged
                ? "bg-[#D4A853] border-[#D4A853]"
                : "bg-transparent border-[#52525B] group-hover:border-[#71717A]"
            )}>
              {acknowledged && (
                <svg
                  className="w-full h-full text-[#0A0A0A]"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 10L8 14L16 6"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </div>
          <span className="text-[#D4D4D8] text-sm select-none">
            I understand and accept these terms. I acknowledge this is not medical advice and I will consult a healthcare provider before starting any new exercise program.
          </span>
        </motion.label>
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
