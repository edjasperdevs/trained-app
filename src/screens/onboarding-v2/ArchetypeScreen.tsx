import { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { useOnboardingStore } from '@/stores'
import { ProgressIndicator } from '@/components/onboarding'
import { haptics } from '@/lib/haptics'
import { ARCHETYPE_INFO, type Archetype } from '@/design/constants'
import { getAvatarImage } from '@/assets/avatars'

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
        return 'bg-[#3F3F46] text-[#A1A1AA]'
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

  // Use Master (stage 5) images for selection cards
  const avatarSrc = getAvatarImage(archetype, 5)

  return (
    <button
      onClick={onSelect}
      disabled={isDisabled}
      className={`relative w-full flex items-center h-[120px] rounded-2xl transition-all duration-150 ease-out overflow-visible ${
        isDisabled ? 'opacity-50 pointer-events-none' : ''
      } ${
        isSelected
          ? 'bg-[rgba(212,168,83,0.08)] border-2 border-[#D4A853]'
          : 'bg-[#1A1A1A] border border-[#2A2A2A]'
      }`}
    >
      {/* Avatar container - clips at bottom (card edge), allows overflow at top */}
      <div
        className="relative w-[130px] h-full flex-shrink-0"
        style={{ clipPath: 'inset(-100px 0 0 0)' }}
      >
        {/* Glow effect behind avatar */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 w-20 h-20 rounded-full blur-2xl opacity-70"
          style={{
            background: 'radial-gradient(circle, rgba(212,168,83,0.6) 0%, transparent 70%)',
          }}
        />
        {/* Avatar image - head extends above card, bottom clips at card edge */}
        <img
          src={avatarSrc}
          alt={info.name}
          className="absolute left-1/2 -translate-x-1/2 w-[130px] h-auto z-10"
          style={{ bottom: '-75%' }}
        />
      </div>

      {/* Text content - centered vertically */}
      <div className="flex flex-col items-start text-left pl-2 pr-4 flex-1 justify-center">
        <span
          className="font-bold text-2xl text-[#FAFAFA] tracking-wide"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          {info.name.toUpperCase()}
        </span>
        <span className="text-[#71717A] text-sm mt-0.5">{info.tagline}</span>
      </div>

      {/* Badge */}
      <span className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded font-semibold tracking-wide ${getBadgeStyles()}`}>
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
    <div className="h-screen bg-[#0A0A0A] flex flex-col overflow-hidden">
      {/* Fixed header section */}
      <div className="flex-shrink-0 px-4 pt-8">
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
          className="text-3xl md:text-4xl font-black text-[#FAFAFA] text-center leading-tight"
          style={{ fontFamily: "'Oswald', sans-serif" }}
          initial="hidden"
          animate="visible"
          variants={headlineVariants}
        >
          CHOOSE YOUR DISCIPLINE
        </motion.h1>
      </div>

      {/* Scrollable archetype cards */}
      <motion.div
        className="flex-1 overflow-y-auto px-4 pt-8 pb-24"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="flex flex-col gap-5">
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
        </div>
      </motion.div>

      {/* Fixed bottom CTA with gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 pb-safe">
        <div className="h-8 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
        <motion.div
          className="px-4 pb-6 bg-[#0A0A0A]"
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
    </div>
  )
}
