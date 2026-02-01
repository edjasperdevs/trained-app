import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './Button'
import { useAchievementsStore, Badge, BadgeRarity, RARITY_COLORS } from '@/stores/achievementsStore'

interface BadgeUnlockModalProps {
  badgeIds: string[]
  onClose: () => void
}

const RARITY_LABELS: Record<BadgeRarity, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary'
}

const RARITY_GLOW: Record<BadgeRarity, string> = {
  common: 'shadow-gray-500/50',
  rare: 'shadow-blue-500/50',
  epic: 'shadow-purple-500/50',
  legendary: 'shadow-yellow-500/50'
}

const RARITY_TEXT: Record<BadgeRarity, string> = {
  common: 'text-gray-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400'
}

const RARITY_BG: Record<BadgeRarity, string> = {
  common: 'from-gray-500/20 to-gray-600/20',
  rare: 'from-blue-500/20 to-blue-600/20',
  epic: 'from-purple-500/20 to-purple-600/20',
  legendary: 'from-yellow-500/20 to-amber-600/20'
}

// Confetti particle component
function Confetti({ delay, color }: { delay: number; color: string }) {
  const startX = Math.random() * 100
  const endX = startX + (Math.random() - 0.5) * 60
  const rotation = Math.random() * 720 - 360
  const size = Math.random() * 8 + 4

  return (
    <motion.div
      initial={{
        opacity: 1,
        y: -20,
        x: `${startX}%`,
        rotate: 0,
        scale: 1
      }}
      animate={{
        opacity: 0,
        y: 500,
        x: `${endX}%`,
        rotate: rotation,
        scale: 0.3
      }}
      transition={{
        duration: 2.5 + Math.random(),
        delay,
        ease: 'easeOut'
      }}
      className="absolute top-0 rounded-sm"
      style={{
        backgroundColor: color,
        width: size,
        height: size
      }}
    />
  )
}

// Sparkle effect
function Sparkle({ delay }: { delay: number }) {
  const angle = Math.random() * Math.PI * 2
  const distance = 60 + Math.random() * 40

  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0,
        x: 0,
        y: 0
      }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, 1, 0],
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance
      }}
      transition={{
        duration: 0.8,
        delay,
        ease: 'easeOut'
      }}
      className="absolute text-2xl"
    >
      ✨
    </motion.div>
  )
}

function BadgeDisplay({ badge, index }: { badge: Badge; index: number }) {
  const [showSparkles, setShowSparkles] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowSparkles(true), 300 + index * 500)
    return () => clearTimeout(timer)
  }, [index])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, rotate: -180 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 15,
        delay: 0.3 + index * 0.5
      }}
      className="flex flex-col items-center"
    >
      {/* Badge container with glow */}
      <div className="relative">
        {/* Sparkles */}
        {showSparkles && (
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(8)].map((_, i) => (
              <Sparkle key={i} delay={i * 0.1} />
            ))}
          </div>
        )}

        {/* Glow ring for legendary/epic */}
        {(badge.rarity === 'legendary' || badge.rarity === 'epic') && (
          <motion.div
            className={`absolute inset-0 rounded-full blur-xl ${
              badge.rarity === 'legendary' ? 'bg-yellow-400' : 'bg-purple-500'
            }`}
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        )}

        {/* Badge icon */}
        <motion.div
          className={`
            relative w-24 h-24 rounded-full flex items-center justify-center
            bg-gradient-to-br ${RARITY_BG[badge.rarity]}
            border-4 ${RARITY_COLORS[badge.rarity]}
            shadow-lg ${RARITY_GLOW[badge.rarity]}
          `}
          animate={{
            y: [0, -5, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <span className="text-5xl">{badge.icon}</span>
        </motion.div>
      </div>

      {/* Badge info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 + index * 0.5 }}
        className="mt-4 text-center"
      >
        <p className={`text-xs font-semibold uppercase tracking-wider ${RARITY_TEXT[badge.rarity]}`}>
          {RARITY_LABELS[badge.rarity]}
        </p>
        <h3 className="text-xl font-bold mt-1">{badge.name}</h3>
        <p className="text-sm text-gray-400 mt-1">{badge.description}</p>
      </motion.div>
    </motion.div>
  )
}

export function BadgeUnlockModal({ badgeIds, onClose }: BadgeUnlockModalProps) {
  const getAllBadges = useAchievementsStore((state) => state.getAllBadges)
  const [currentIndex, setCurrentIndex] = useState(0)

  const allBadges = getAllBadges()
  const badges = badgeIds
    .map(id => allBadges.find(b => b.id === id))
    .filter((b): b is Badge => b !== null)

  if (badges.length === 0) return null

  const currentBadge = badges[currentIndex]
  const hasMore = currentIndex < badges.length - 1

  // Confetti colors based on rarity
  const confettiColors: Record<BadgeRarity, string[]> = {
    common: ['#9CA3AF', '#6B7280', '#D1D5DB', '#E5E7EB'],
    rare: ['#3B82F6', '#60A5FA', '#93C5FD', '#2563EB'],
    epic: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#7C3AED'],
    legendary: ['#F59E0B', '#FBBF24', '#FCD34D', '#D97706', '#FFD700']
  }

  const colors = confettiColors[currentBadge.rarity]

  const handleNext = () => {
    if (hasMore) {
      setCurrentIndex(prev => prev + 1)
    } else {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center overflow-hidden"
      >
        {/* Confetti */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 60 }).map((_, i) => (
            <Confetti
              key={`${currentIndex}-${i}`}
              delay={i * 0.03}
              color={colors[i % colors.length]}
            />
          ))}
        </div>

        {/* Content */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="w-full max-w-sm mx-4 text-center"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <motion.p
              className="text-sm font-semibold text-accent-primary uppercase tracking-widest"
              animate={{
                opacity: [1, 0.7, 1]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity
              }}
            >
              Achievement Unlocked!
            </motion.p>
          </motion.div>

          {/* Badge display */}
          <BadgeDisplay
            key={currentBadge.id}
            badge={currentBadge}
            index={0}
          />

          {/* Progress indicator for multiple badges */}
          {badges.length > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex justify-center gap-2 mt-6"
            >
              {badges.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentIndex ? 'bg-accent-primary' : 'bg-gray-600'
                  }`}
                />
              ))}
            </motion.div>
          )}

          {/* Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="mt-8"
          >
            <Button onClick={handleNext} fullWidth size="lg">
              {hasMore ? (
                <span className="flex items-center justify-center gap-2">
                  Next Badge
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                  >
                    →
                  </motion.span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                  >
                    🎉
                  </motion.span>
                  Awesome!
                </span>
              )}
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
