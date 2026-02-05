import { motion, AnimatePresence } from 'motion/react'
import { useAvatarStore, EVOLUTION_STAGES } from '@/stores'
import { AVATAR_STAGES, LABELS } from '@/design/constants'
import {
  Circle, Zap, Sprout, Footprints, Dumbbell, Sword, Shield, Flame,
  Trophy, Sparkles, Star, Crown, Wand2, Moon, LucideIcon
} from 'lucide-react'

interface AvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showMood?: boolean
  showLevel?: boolean
  level?: number
}

const sizeClasses = {
  sm: { container: 'w-16 h-16', icon: 24 },
  md: { container: 'w-24 h-24', icon: 40 },
  lg: { container: 'w-32 h-32', icon: 56 },
  xl: { container: 'w-48 h-48', icon: 80 }
}

// Map icon names to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  Circle, Zap, Sprout, Footprints, Dumbbell, Sword, Shield, Flame,
  Trophy, Bolt: Zap, Sparkles, Star, Crown, Wand2, Moon
}

// Character base icon representations
const CHARACTER_BASES = {
  dominant: { icon: Sword, color: 'text-error' },
  switch: { icon: Wand2, color: 'text-primary' },
  submissive: { icon: Moon, color: 'text-info' }
}

// Mood animations (subtle, restrained for premium feel)
const moodAnimations = {
  happy: {
    animate: { y: [0, -2, 0] },
    transition: { duration: 1, repeat: Infinity, repeatDelay: 3 }
  },
  hyped: {
    animate: { scale: [1, 1.05, 1] },
    transition: { duration: 0.5, repeat: Infinity, repeatDelay: 1 }
  },
  sad: {
    animate: { y: [0, 1, 0] },
    transition: { duration: 2, repeat: Infinity }
  },
  neutral: {
    animate: {},
    transition: {}
  },
  neglected: {
    animate: { opacity: [1, 0.7, 1] },
    transition: { duration: 3, repeat: Infinity }
  }
}

export function Avatar({
  size = 'lg',
  showMood = true,
  showLevel = false,
  level
}: AvatarProps) {
  const { evolutionStage, currentMood, baseCharacter, recentReaction } = useAvatarStore()

  const stageName = AVATAR_STAGES[evolutionStage - 1] || AVATAR_STAGES[0]
  const stageInfo = EVOLUTION_STAGES.find(s => s.stage === evolutionStage) || EVOLUTION_STAGES[0]

  const moodAnim = showMood ? moodAnimations[currentMood] : undefined
  const iconSize = sizeClasses[size].icon

  // Get the icon component for the current evolution stage
  const getAvatarIcon = () => {
    const iconName = stageInfo.emoji
    const IconComponent = ICON_MAP[iconName] || Circle
    return IconComponent
  }

  const AvatarIcon = getAvatarIcon()
  const CharacterIcon = CHARACTER_BASES[baseCharacter].icon

  // Border color based on stage
  const getBorderClass = () => {
    if (evolutionStage >= 9) return 'border-warning'
    if (evolutionStage >= 6) return 'border-primary'
    return 'border-border'
  }

  return (
    <div className="relative inline-flex flex-col items-center">
      {/* Glow effect for higher levels */}
      {evolutionStage >= 6 && (
        <div
          className={`absolute inset-0 blur-xl opacity-20 rounded-lg ${
            evolutionStage >= 9 ? 'bg-warning' : 'bg-primary'
          }`}
        />
      )}

      {/* Main avatar container */}
      <motion.div
        className={`
          ${sizeClasses[size].container}
          relative flex items-center justify-center
          bg-surface border-2
          ${getBorderClass()}
          rounded-lg
        `}
        {...moodAnim}
      >
        {/* Avatar icon */}
        <div className="relative">
          <AvatarIcon
            size={iconSize}
            className={`${evolutionStage >= 9 ? 'text-warning' : evolutionStage >= 6 ? 'text-primary' : 'text-text-secondary'}`}
          />
          {/* Character accent for higher evolutions */}
          {evolutionStage >= 9 && (
            <CharacterIcon
              size={iconSize * 0.35}
              className={`absolute -bottom-1 -right-1 ${CHARACTER_BASES[baseCharacter].color}`}
            />
          )}
        </div>
      </motion.div>

      {/* Reaction bubble */}
      <AnimatePresence>
        {recentReaction && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface px-3 py-1 text-sm whitespace-nowrap border border-border rounded"
          >
            {recentReaction}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage name and level */}
      {showLevel && (
        <div className="mt-2 text-center">
          <p className="text-sm text-primary font-semibold">
            {stageName}
          </p>
          {level && (
            <p className="text-xs text-text-secondary">
              {LABELS.level} {level}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
