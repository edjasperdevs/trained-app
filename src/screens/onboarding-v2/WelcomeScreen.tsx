import { useState, useEffect } from 'react'
import { motion, type Variants } from 'framer-motion'
import { useOnboardingStore } from '@/stores'
import heroWelcomeImg from '@/assets/hero-welcome.png'

export function WelcomeScreen() {
  const { nextStep, reset } = useOnboardingStore()
  const [hasInteracted, setHasInteracted] = useState(false)
  const [shouldPulse, setShouldPulse] = useState(false)

  // Reset onboarding store when landing on welcome screen
  useEffect(() => {
    reset()
  }, [reset])

  // Start pulse animation after 2 seconds if user hasn't interacted
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasInteracted) {
        setShouldPulse(true)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [hasInteracted])

  const handleBeginProtocol = () => {
    setHasInteracted(true)
    setShouldPulse(false)
    nextStep()
  }

  // Animation variants
  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  }

  const fadeUpVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0, 0, 0.2, 1], // easeOut cubic-bezier
      },
    },
  }

  const headlineVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.45, // After logo + wordmark
      },
    },
  }

  const lineVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0, 0, 0.2, 1], // easeOut cubic-bezier
      },
    },
  }

  const pulseAnimation = shouldPulse
    ? {
        scale: [1, 1.02, 1],
        transition: {
          duration: 1.5,
          repeat: Infinity,
          ease: [0.4, 0, 0.6, 1] as const, // easeInOut cubic-bezier
        },
      }
    : {}

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-between py-12 px-6">
      <motion.div
        className="flex flex-col items-center justify-center flex-1"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Brand Mark */}
        <motion.div variants={fadeUpVariants} className="w-32 h-32 mb-4 relative">
          <div className="absolute inset-0 bg-[#D4A853]/20 blur-2xl rounded-full scale-75" />
          <img
            src={heroWelcomeImg}
            alt="WellTrained Crown"
            className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_15px_rgba(212,168,83,0.4)]"
          />
        </motion.div>

        {/* Wordmark */}
        <motion.h1
          variants={fadeUpVariants}
          className="text-3xl font-black text-[#D4A853] tracking-[0.15em] leading-none text-center mb-8"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          WELLTRAINED
        </motion.h1>

        {/* Headline - Three Lines */}
        <motion.div
          variants={headlineVariants}
          className="text-center mb-8"
        >
          <motion.p
            variants={lineVariants}
            className="text-3xl font-black text-[#FAFAFA] tracking-wide leading-tight"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            YOUR DISCIPLINE.
          </motion.p>
          <motion.p
            variants={lineVariants}
            className="text-3xl font-black text-[#FAFAFA] tracking-wide leading-tight"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            YOUR RANK.
          </motion.p>
          <motion.p
            variants={lineVariants}
            className="text-3xl font-black text-[#FAFAFA] tracking-wide leading-tight"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            YOUR LEGEND.
          </motion.p>
        </motion.div>

        {/* Subline */}
        <motion.p
          variants={fadeUpVariants}
          className="text-[#A1A1AA] text-center text-sm leading-relaxed max-w-xs"
        >
          The Discipline System. Built for men who train with intention.
        </motion.p>

        {/* Progress dots */}
        <motion.div
          variants={fadeUpVariants}
          className="flex gap-2 mt-8"
        >
          {[0, 1, 2, 3, 4].map((dot) => (
            <div
              key={dot}
              className={`w-2 h-2 rounded-full ${
                dot === 0 ? 'bg-[#D4A853]' : 'bg-[#3A3A3A]'
              }`}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Bottom CTA Section */}
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.3, ease: [0, 0, 0.2, 1] }}
      >
        {/* Gold Lime Rule */}
        <div className="h-px bg-[#C8FF00] w-full mb-6 opacity-30" />

        {/* BEGIN PROTOCOL Button */}
        <motion.button
          onClick={handleBeginProtocol}
          animate={pulseAnimation}
          className="w-full py-4 bg-[#D4A853] text-[#0A0A0A] font-bold text-lg tracking-wider rounded-lg"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          BEGIN PROTOCOL
        </motion.button>
      </motion.div>
    </div>
  )
}
