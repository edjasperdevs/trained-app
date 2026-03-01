/**
 * EvolvingAvatar Component
 *
 * Displays an evolving avatar silhouette that changes based on user rank.
 * Integrates with dpStore for rank and subscriptionStore for premium status.
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

import { useDPStore, useSubscriptionStore } from '@/stores'
import { getAvatarStage } from '@/screens/AvatarScreen'
import { Stage1, Stage2, Stage3, Stage4, Stage5 } from './AvatarStages'
import { LockedAvatar } from './LockedAvatar'

interface EvolvingAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Whether to show locked preview for non-premium users (default: true) */
  showLocked?: boolean
}

const STAGE_COMPONENTS = [Stage1, Stage2, Stage3, Stage4, Stage5]
const PREMIUM_STAGES = [3, 4, 5]

export function EvolvingAvatar({ size = 'md', showLocked = true }: EvolvingAvatarProps) {
  const currentRank = useDPStore((s) => s.currentRank)
  const isPremium = useSubscriptionStore((s) => s.isPremium)

  const stage = getAvatarStage(currentRank)
  const isPremiumStage = PREMIUM_STAGES.includes(stage)

  // Show locked preview for non-premium users on premium stages
  if (isPremiumStage && !isPremium && showLocked) {
    return <LockedAvatar stage={stage as 3 | 4 | 5} size={size} />
  }

  // Render the appropriate stage component
  const StageComponent = STAGE_COMPONENTS[stage - 1]
  return <StageComponent size={size} />
}
