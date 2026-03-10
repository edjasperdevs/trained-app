import { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { useOnboardingStore } from '@/stores'
import { ProgressIndicator } from '@/components/onboarding'

export function ProfileScreen() {
  const { nextStep, prevStep, updateData, data } = useOnboardingStore()

  // Local form state - initialize from store if exists
  const [name, setName] = useState(data.name || '')
  const [gender, setGender] = useState<'male' | 'female'>(data.gender || 'male')
  const [age, setAge] = useState<string>(data.age ? String(data.age) : '')

  const ageNum = age === '' ? 0 : Number(age)
  const canContinue = name.trim().length > 0 && ageNum > 0 && ageNum < 120

  const handleContinue = () => {
    if (!canContinue) return

    updateData({
      name: name.trim(),
      gender,
      age: ageNum
    })
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
        <ProgressIndicator totalSteps={7} currentStep={2} />
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
            onChange={(e) => setAge(e.target.value)}
            placeholder="Enter your age"
            min="13"
            max="120"
            className="w-full px-4 py-3 bg-[#26282B] border border-[#2A2A2A] rounded-lg text-[#FAFAFA] placeholder-[#71717A] focus:border-[#D4A853] focus:outline-none transition-colors"
          />
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
