import { useState, useEffect } from 'react'
import { motion, type Variants } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { useOnboardingStore } from '@/stores'
import { ProgressIndicator } from '@/components/onboarding'
import { haptics } from '@/lib/haptics'
import { getWeightUnit, toInternalWeight, toInternalHeight, toDisplayWeight, toDisplayHeight } from '@/lib/units'

type Units = 'imperial' | 'metric'

export function PhysicalStatsScreen() {
  const { nextStep, prevStep, updateData, data } = useOnboardingStore()

  // Local form state - initialize from store if exists
  const [units, setUnits] = useState<Units>(data.units || 'imperial')
  const [weight, setWeight] = useState<number>(
    data.weight ? toDisplayWeight(data.weight, units) : units === 'metric' ? 75 : 165
  )

  // For imperial: separate feet and inches
  const [heightFeet, setHeightFeet] = useState<number>(() => {
    if (data.height && units === 'imperial') {
      return Math.floor(data.height / 12)
    }
    return 5
  })
  const [heightInches, setHeightInches] = useState<number>(() => {
    if (data.height && units === 'imperial') {
      return data.height % 12
    }
    return 9
  })

  // For metric: cm
  const [heightCm, setHeightCm] = useState<number>(() => {
    if (data.height && units === 'metric') {
      return toDisplayHeight(data.height, units)
    }
    return 175
  })

  const canContinue = weight > 0 && (
    units === 'imperial'
      ? heightFeet > 0 || heightInches > 0
      : heightCm > 0
  )

  const handleContinue = () => {
    if (!canContinue) return

    // Convert display values to internal storage (lbs and inches)
    const internalWeight = toInternalWeight(weight, units)
    const internalHeight = units === 'imperial'
      ? heightFeet * 12 + heightInches
      : toInternalHeight(heightCm, units)

    updateData({
      units,
      weight: internalWeight,
      height: internalHeight
    })
    nextStep()
  }

  const handleUnitsChange = (newUnits: Units) => {
    if (newUnits !== units) {
      haptics.light()
      setUnits(newUnits)
    }
  }

  // Sync weight/height display when units toggle
  useEffect(() => {
    if (data.weight) {
      setWeight(toDisplayWeight(data.weight, units))
    }
    if (data.height) {
      if (units === 'imperial') {
        setHeightFeet(Math.floor(data.height / 12))
        setHeightInches(data.height % 12)
      } else {
        setHeightCm(toDisplayHeight(data.height, units))
      }
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
        <ProgressIndicator totalSteps={5} currentStep={2} />
        <div className="w-10" /> {/* Spacer for alignment */}
      </motion.div>

      {/* YOUR STATS label */}
      <motion.p
        className="text-[#D4A853] text-xs tracking-[0.2em] uppercase text-center mb-4"
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
      >
        YOUR STATS
      </motion.p>

      {/* Main headline */}
      <motion.h1
        className="text-3xl md:text-4xl font-black text-[#FAFAFA] text-center leading-tight mb-8"
        style={{ fontFamily: "'Oswald', sans-serif" }}
        initial="hidden"
        animate="visible"
        variants={headlineVariants}
      >
        YOUR PHYSICAL STATS
      </motion.h1>

      {/* Form elements */}
      <motion.div
        className="flex flex-col gap-6 flex-1"
        initial="hidden"
        animate="visible"
        variants={formContainerVariants}
      >
        {/* Units toggle (Imperial/Metric) */}
        <motion.div variants={formItemVariants}>
          <label className="block text-[#FAFAFA] text-sm font-medium mb-2">Units</label>
          <div className="flex gap-3">
            <button
              onClick={() => handleUnitsChange('imperial')}
              className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all ${
                units === 'imperial'
                  ? 'bg-[#D4A853]/8 border-2 border-[#D4A853] text-[#D4A853]'
                  : 'bg-[#26282B] border border-[#2A2A2A] text-[#A1A1AA]'
              }`}
            >
              IMPERIAL
            </button>
            <button
              onClick={() => handleUnitsChange('metric')}
              className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all ${
                units === 'metric'
                  ? 'bg-[#D4A853]/8 border-2 border-[#D4A853] text-[#D4A853]'
                  : 'bg-[#26282B] border border-[#2A2A2A] text-[#A1A1AA]'
              }`}
            >
              METRIC
            </button>
          </div>
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
            placeholder={units === 'metric' ? 'kg' : 'lbs'}
            className="w-full px-4 py-3 bg-[#26282B] border border-[#2A2A2A] rounded-lg text-[#FAFAFA] placeholder-[#71717A] focus:border-[#D4A853] focus:outline-none transition-colors"
          />
        </motion.div>

        {/* Height input - Imperial (feet and inches) */}
        {units === 'imperial' && (
          <motion.div variants={formItemVariants}>
            <label className="block text-[#FAFAFA] text-sm font-medium mb-2">Height</label>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="number"
                  value={heightFeet}
                  onChange={(e) => setHeightFeet(Number(e.target.value))}
                  placeholder="Feet"
                  className="w-full px-4 py-3 bg-[#26282B] border border-[#2A2A2A] rounded-lg text-[#FAFAFA] placeholder-[#71717A] focus:border-[#D4A853] focus:outline-none transition-colors"
                />
                <p className="text-[#71717A] text-xs mt-1 text-center">feet</p>
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  value={heightInches}
                  onChange={(e) => setHeightInches(Number(e.target.value))}
                  placeholder="Inches"
                  className="w-full px-4 py-3 bg-[#26282B] border border-[#2A2A2A] rounded-lg text-[#FAFAFA] placeholder-[#71717A] focus:border-[#D4A853] focus:outline-none transition-colors"
                />
                <p className="text-[#71717A] text-xs mt-1 text-center">inches</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Height input - Metric (cm) */}
        {units === 'metric' && (
          <motion.div variants={formItemVariants}>
            <label className="block text-[#FAFAFA] text-sm font-medium mb-2">
              Height (cm)
            </label>
            <input
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(Number(e.target.value))}
              placeholder="cm"
              className="w-full px-4 py-3 bg-[#26282B] border border-[#2A2A2A] rounded-lg text-[#FAFAFA] placeholder-[#71717A] focus:border-[#D4A853] focus:outline-none transition-colors"
            />
          </motion.div>
        )}
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
