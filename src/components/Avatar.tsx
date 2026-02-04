import { motion, AnimatePresence } from 'framer-motion'
import { useAvatarStore, EVOLUTION_STAGES } from '@/stores'
import { useTheme } from '@/themes'
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
  warrior: { icon: Sword, color: 'text-red-400' },
  mage: { icon: Wand2, color: 'text-purple-400' },
  rogue: { icon: Moon, color: 'text-blue-400' }
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

// Trained theme: more subtle animations
const trainedMoodAnimations = {
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
  const { theme, themeId } = useTheme()
  const isTrained = themeId === 'trained'

  // Use theme-specific stage names
  const stageName = theme.avatarStages[evolutionStage - 1] || theme.avatarStages[0]
  const stageInfo = EVOLUTION_STAGES.find(s => s.stage === evolutionStage) || EVOLUTION_STAGES[0]

  const animations = isTrained ? trainedMoodAnimations : moodAnimations
  const moodAnim = showMood ? animations[currentMood] : undefined
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
    if (isTrained) {
      if (evolutionStage >= 9) return 'border-warning'
      if (evolutionStage >= 6) return 'border-primary'
      return 'border-border'
    } else {
      if (evolutionStage >= 9) return 'border-yellow-400'
      if (evolutionStage >= 6) return 'border-primary'
      return 'border-border'
    }
  }

  return (
    <div className="relative inline-flex flex-col items-center">
      {/* Glow effect for higher levels */}
      {evolutionStage >= 6 && (
        <div
          className={`absolute inset-0 blur-xl opacity-20 ${
            isTrained
              ? 'rounded-lg'
              : 'rounded-full'
          } ${
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
          ${isTrained ? 'rounded-lg' : 'rounded-full'}
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

        {/* Evolution glow ring - only for GYG */}
        {!isTrained && evolutionStage >= 3 && (
          <div className="absolute inset-0 rounded-full border border-primary/20 animate-pulse" />
        )}
      </motion.div>

      {/* Reaction bubble */}
      <AnimatePresence>
        {recentReaction && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
            className={`absolute -top-8 left-1/2 -translate-x-1/2 bg-surface px-3 py-1 text-sm whitespace-nowrap border border-border ${
              isTrained ? 'rounded' : 'rounded-full'
            }`}
          >
            {recentReaction}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage name and level */}
      {showLevel && (
        <div className="mt-2 text-center">
          <p className={`text-sm text-primary font-semibold ${isTrained ? 'uppercase tracking-wider font-heading' : ''}`}>
            {stageName}
          </p>
          {level && (
            <p className="text-xs text-text-secondary">
              {theme.labels.level} {level}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
