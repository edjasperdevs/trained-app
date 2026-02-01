import { motion, AnimatePresence } from 'framer-motion'
import { useAvatarStore, EVOLUTION_STAGES } from '@/stores'

interface AvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showMood?: boolean
  showLevel?: boolean
  level?: number
}

const sizeClasses = {
  sm: 'w-16 h-16 text-3xl',
  md: 'w-24 h-24 text-5xl',
  lg: 'w-32 h-32 text-6xl',
  xl: 'w-48 h-48 text-8xl'
}

// Character base emoji representations
const CHARACTER_BASES = {
  warrior: { base: '🗡️', accent: '⚔️' },
  mage: { base: '🔮', accent: '✨' },
  rogue: { base: '🗡️', accent: '🌙' }
}

// Mood animations
const moodAnimations = {
  happy: {
    animate: { y: [0, -5, 0] },
    transition: { duration: 0.5, repeat: Infinity, repeatDelay: 2 }
  },
  hyped: {
    animate: { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] },
    transition: { duration: 0.3, repeat: Infinity, repeatDelay: 0.5 }
  },
  sad: {
    animate: { y: [0, 2, 0] },
    transition: { duration: 1, repeat: Infinity }
  },
  neutral: {
    animate: { y: [0, -2, 0] },
    transition: { duration: 2, repeat: Infinity }
  },
  neglected: {
    animate: { opacity: [1, 0.6, 1] },
    transition: { duration: 2, repeat: Infinity }
  }
}

export function Avatar({
  size = 'lg',
  showMood = true,
  showLevel = false,
  level
}: AvatarProps) {
  const { evolutionStage, currentMood, baseCharacter, recentReaction } = useAvatarStore()

  const stageInfo = EVOLUTION_STAGES.find(s => s.stage === evolutionStage) || EVOLUTION_STAGES[0]
  const moodAnim = showMood ? moodAnimations[currentMood] : undefined

  // Build the avatar visual based on evolution stage
  const getAvatarVisual = () => {
    // For MVP, using emoji combinations that evolve
    const baseEmoji = stageInfo.emoji
    const characterAccent = CHARACTER_BASES[baseCharacter].accent

    // Add flair based on evolution
    if (evolutionStage >= 9) {
      return `${baseEmoji}${characterAccent}`;
    } else if (evolutionStage >= 6) {
      return baseEmoji
    }
    return baseEmoji
  }

  return (
    <div className="relative inline-flex flex-col items-center">
      {/* Glow effect for higher levels */}
      {evolutionStage >= 6 && (
        <div
          className={`absolute inset-0 rounded-full blur-xl opacity-30 ${
            evolutionStage >= 9 ? 'bg-yellow-400' : 'bg-accent-primary'
          }`}
        />
      )}

      {/* Main avatar container */}
      <motion.div
        className={`
          ${sizeClasses[size]}
          relative flex items-center justify-center
          bg-bg-secondary rounded-full border-2
          ${evolutionStage >= 9 ? 'border-yellow-400' : evolutionStage >= 6 ? 'border-accent-primary' : 'border-gray-700'}
        `}
        {...moodAnim}
      >
        {/* Avatar emoji */}
        <span className="select-none">{getAvatarVisual()}</span>

        {/* Evolution glow ring */}
        {evolutionStage >= 3 && (
          <div className="absolute inset-0 rounded-full border border-accent-primary/20 animate-pulse" />
        )}
      </motion.div>

      {/* Reaction bubble */}
      <AnimatePresence>
        {recentReaction && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 bg-bg-card px-3 py-1 rounded-full text-sm whitespace-nowrap border border-gray-700"
          >
            {recentReaction}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage name and level */}
      {showLevel && (
        <div className="mt-2 text-center">
          <p className="text-sm text-accent-primary font-semibold">{stageInfo.name}</p>
          {level && (
            <p className="text-xs text-gray-400">Level {level}</p>
          )}
        </div>
      )}
    </div>
  )
}
