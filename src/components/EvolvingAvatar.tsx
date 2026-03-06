/**
 * EvolvingAvatar Component
 *
 * Displays an evolving avatar image that changes based on user rank and archetype.
 * Integrates with dpStore for rank, userStore for archetype, and subscriptionStore for premium status.
 *
 * Stage progression:
 * - Stage 1: Ranks 1-3 (free)
 * - Stage 2: Ranks 4-7 (free)
 * - Stage 3: Ranks 8-11 (premium)
 * - Stage 4: Ranks 12-14 (premium)
 * - Stage 5: Rank 15 (premium)
 *
 * Non-premium users see a locked preview for stages 3-5.
 */

import { useDPStore, useSubscriptionStore, useUserStore } from '@/stores'
import { getAvatarStage } from '@/lib/avatarUtils'
import { LockedAvatar } from './LockedAvatar'
import { getAvatarImage } from '@/assets/avatars'

interface EvolvingAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  /** Whether to show locked preview for non-premium users (default: true) */
  showLocked?: boolean
}

const SIZE_MAP = {
  sm: 64,
  md: 96,
  lg: 128,
  xl: 240,
  '2xl': 320,
}

const PREMIUM_STAGES = [3, 4, 5]

export function EvolvingAvatar({ size = 'md', showLocked = true }: EvolvingAvatarProps) {
  const currentRank = useDPStore((s) => s.currentRank)
  const isPremium = useSubscriptionStore((s) => s.isPremium)
  const archetype = useUserStore((s) => s.profile?.archetype) || 'bro'

  const stage = getAvatarStage(currentRank) as 1 | 2 | 3 | 4 | 5
  const isPremiumStage = PREMIUM_STAGES.includes(stage)

  // Show locked preview for non-premium users on premium stages
  if (isPremiumStage && !isPremium && showLocked) {
    return <LockedAvatar stage={stage as 3 | 4 | 5} size={size} />
  }

  const dimension = SIZE_MAP[size]
  const avatarSrc = getAvatarImage(archetype, stage)

  return (
    <img
      src={avatarSrc}
      alt={`${archetype} avatar - Stage ${stage}`}
      width={dimension}
      height={dimension}
      className="object-contain"
    />
  )
}
