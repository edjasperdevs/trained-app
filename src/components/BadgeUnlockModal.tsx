import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './Button'
import { useAchievementsStore, Badge, BadgeRarity, RARITY_COLORS } from '@/stores/achievementsStore'
import { useTheme } from '@/themes'
import { Award, ChevronRight, Sparkles } from 'lucide-react'

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

// Trained theme rarity styles
const TRAINED_RARITY_TEXT: Record<BadgeRarity, string> = {
  common: 'text-text-secondary',
  rare: 'text-info',
  epic: 'text-primary',
  legendary: 'text-warning'
}

const TRAINED_RARITY_BG: Record<BadgeRarity, string> = {
  common: 'bg-surface-elevated border-border',
  rare: 'bg-info/10 border-info/30',
  epic: 'bg-primary-muted border-primary/30',
  legendary: 'bg-warning/10 border-warning/30'
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
function SparkleEffect({ delay }: { delay: number }) {
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
      className="absolute"
    >
      <Sparkles size={16} className="text-primary" />
    </motion.div>
  )
}

function BadgeDisplay({ badge, index, isTrained }: { badge: Badge; index: number; isTrained: boolean }) {
  const [showSparkles, setShowSparkles] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowSparkles(true), 300 + index * 500)
    return () => clearTimeout(timer)
  }, [index])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, rotate: isTrained ? 0 : -180 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 15,
        delay: 0.3 + index * 0.5
      }}
      className="flex flex-col items-center"
    >
      {/* Badge container */}
      <div className="relative">
        {/* Sparkles */}
        {showSparkles && (
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(8)].map((_, i) => (
              <SparkleEffect key={i} delay={i * 0.1} />
            ))}
          </div>
        )}

        {/* Glow ring for legendary/epic */}
        {!isTrained && (badge.rarity === 'legendary' || badge.rarity === 'epic') && (
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
            relative w-24 h-24 flex items-center justify-center
            ${isTrained
              ? `${TRAINED_RARITY_BG[badge.rarity]} border-2 rounded-lg`
              : `bg-gradient-to-br ${RARITY_BG[badge.rarity]} border-4 ${RARITY_COLORS[badge.rarity]} rounded-full shadow-lg ${RARITY_GLOW[badge.rarity]}`
            }
          `}
          animate={isTrained ? undefined : { y: [0, -5, 0] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          {isTrained ? (
            <Award size={48} className={TRAINED_RARITY_TEXT[badge.rarity]} />
          ) : (
            <span className="text-5xl">{badge.icon}</span>
          )}
        </motion.div>
      </div>

      {/* Badge info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 + index * 0.5 }}
        className="mt-4 text-center"
      >
        <p className={`text-xs font-semibold uppercase tracking-wider ${isTrained ? TRAINED_RARITY_TEXT[badge.rarity] : RARITY_TEXT[badge.rarity]}`}>
          {RARITY_LABELS[badge.rarity]}
        </p>
        <h3 className={`text-xl font-bold mt-1 ${isTrained ? 'font-heading' : ''}`}>{badge.name}</h3>
        <p className="text-sm text-text-secondary mt-1">{badge.description}</p>
      </motion.div>
    </motion.div>
  )
}

export function BadgeUnlockModal({ badgeIds, onClose }: BadgeUnlockModalProps) {
  const getAllBadges = useAchievementsStore((state) => state.getAllBadges)
  const [currentIndex, setCurrentIndex] = useState(0)
  const { theme, themeId } = useTheme()
  const isTrained = themeId === 'trained'

  const allBadges = getAllBadges()
  const badges = badgeIds
    .map(id => allBadges.find(b => b.id === id))
    .filter((b): b is Badge => b !== null)

  if (badges.length === 0) return null

  const currentBadge = badges[currentIndex]
  const hasMore = currentIndex < badges.length - 1

  // Confetti colors based on theme and rarity
  const confettiColors: Record<BadgeRarity, string[]> = isTrained
    ? {
        common: ['#4A4A4A', '#5C5C5C', '#3A3A3A'],
        rare: ['#3A5A7A', '#4A6A8A', '#2A4A6A'],
        epic: ['#8B1A1A', '#A52222', '#6B1010'],
        legendary: ['#8B6914', '#AB8924', '#6B5004']
      }
    : {
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
        {/* Confetti - only for GYG or legendary/epic in Trained */}
        {(!isTrained || currentBadge.rarity === 'legendary' || currentBadge.rarity === 'epic') && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: isTrained ? 30 : 60 }).map((_, i) => (
              <Confetti
                key={`${currentIndex}-${i}`}
                delay={i * 0.03}
                color={colors[i % colors.length]}
              />
            ))}
          </div>
        )}

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
              className={`text-sm font-semibold text-primary uppercase tracking-widest ${isTrained ? 'font-heading' : ''}`}
              animate={isTrained ? undefined : { opacity: [1, 0.7, 1] }}
              transition={{
                duration: 1.5,
                repeat: Infinity
              }}
            >
              {theme.labels.achievements.replace('s', '')} Unlocked
            </motion.p>
          </motion.div>

          {/* Badge display */}
          <BadgeDisplay
            key={currentBadge.id}
            badge={currentBadge}
            index={0}
            isTrained={isTrained}
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
                  className={`w-2 h-2 transition-colors ${
                    isTrained ? 'rounded-sm' : 'rounded-full'
                  } ${
                    i === currentIndex ? 'bg-primary' : 'bg-border'
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
                  {isTrained ? 'NEXT' : 'Next Badge'}
                  <ChevronRight size={18} />
                </span>
              ) : (
                isTrained ? 'CONTINUE' : 'Awesome!'
              )}
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
