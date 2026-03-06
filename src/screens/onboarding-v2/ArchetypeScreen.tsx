import { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { useOnboardingStore } from '@/stores'
import { ProgressIndicator } from '@/components/onboarding'
import { haptics } from '@/lib/haptics'
import { ARCHETYPE_INFO, type Archetype } from '@/design/constants'

type BadgeType = 'free' | 'premium' | 'coming-soon'

interface ArchetypeCardProps {
  archetype: Archetype
  isSelected: boolean
  isDisabled: boolean
  badge: BadgeType
  onSelect: () => void
}

function ArchetypeCard({ archetype, isSelected, isDisabled, badge, onSelect }: ArchetypeCardProps) {
  const info = ARCHETYPE_INFO[archetype]

  const getBadgeStyles = () => {
    switch (badge) {
      case 'free':
        return 'bg-[#22C55E] text-black'
      case 'premium':
        return 'bg-[#D4A853] text-black'
      case 'coming-soon':
        return 'bg-[#3F3F46] text-white'
    }
  }

  const getBadgeLabel = () => {
    switch (badge) {
      case 'free':
        return 'FREE'
      case 'premium':
        return 'PREMIUM'
      case 'coming-soon':
        return 'COMING SOON'
    }
  }

  return (
    <button
      onClick={onSelect}
      disabled={isDisabled}
      className={`relative flex items-center h-20 rounded-xl transition-all duration-150 ease-out overflow-hidden ${
        isDisabled ? 'opacity-40 pointer-events-none' : ''
      } ${
        isSelected
          ? 'bg-[rgba(212,168,83,0.08)] border-2 border-[#D4A853]'
          : 'bg-[#26282B] border border-[#3F3F46]'
      }`}
    >
      {/* Avatar placeholder with gradient */}
      <div className="w-20 h-full flex-shrink-0 bg-gradient-to-br from-[#3F3F46] to-[#26282B] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-[#1A1A1A] opacity-50" />
      </div>

      {/* Text content */}
      <div className="flex flex-col items-start text-left px-4 flex-1">
        <span
          className="font-bold text-lg text-[#FAFAFA]"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          {info.name.toUpperCase()}
        </span>
        <span className="text-[#A1A1AA] text-sm">{info.tagline}</span>
      </div>

      {/* Badge */}
      <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded font-medium ${getBadgeStyles()}`}>
        {getBadgeLabel()}
      </span>
    </button>
  )
}

const ARCHETYPE_ORDER: Archetype[] = ['bro', 'himbo', 'brute', 'pup', 'bull']

function getBadgeType(archetype: Archetype): BadgeType {
  if (archetype === 'bro') return 'free'
  if (archetype === 'bull') return 'coming-soon'
  return 'premium'
}

export function ArchetypeScreen() {
  const { nextStep, prevStep, updateData } = useOnboardingStore()
  const [selectedArchetype, setSelectedArchetype] = useState<Archetype>('bro')

  const handleSelect = (archetype: Archetype) => {
    if (archetype === 'bull') return // Bull is not selectable
    if (archetype !== selectedArchetype) {
      haptics.light()
      setSelectedArchetype(archetype)
    }
  }

  const handleContinue = () => {
    updateData({ archetype: selectedArchetype })
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
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col px-6 py-8 pb-safe">
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
        <ProgressIndicator totalSteps={5} currentStep={3} />
        <div className="w-10" /> {/* Spacer for alignment */}
      </motion.div>

      {/* YOUR ARCHETYPE label */}
      <motion.p
        className="text-[#D4A853] text-xs tracking-[0.2em] uppercase text-center mb-4"
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
      >
        YOUR ARCHETYPE
      </motion.p>

      {/* Main headline */}
      <motion.h1
        className="text-3xl md:text-4xl font-black text-[#FAFAFA] text-center leading-tight mb-8"
        style={{ fontFamily: "'Oswald', sans-serif" }}
        initial="hidden"
        animate="visible"
        variants={headlineVariants}
      >
        CHOOSE YOUR DISCIPLINE
      </motion.h1>

      {/* Archetype cards */}
      <motion.div
        className="flex flex-col gap-3 flex-1"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {ARCHETYPE_ORDER.map((archetype) => (
          <motion.div key={archetype} variants={cardVariants}>
            <ArchetypeCard
              archetype={archetype}
              isSelected={selectedArchetype === archetype}
              isDisabled={archetype === 'bull'}
              badge={getBadgeType(archetype)}
              onSelect={() => handleSelect(archetype)}
            />
          </motion.div>
        ))}
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
          className="w-full py-4 bg-[#D4A853] text-[#0A0A0A] font-bold text-lg tracking-wider rounded-lg"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          CHOOSE MY ARCHETYPE
        </button>
      </motion.div>
    </div>
  )
}
