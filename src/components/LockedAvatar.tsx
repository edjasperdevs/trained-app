/**
 * LockedAvatar Component
 *
 * Displays a locked preview of premium avatar stages (3-5) with an upgrade prompt.
 * Shows the stage SVG with reduced opacity, grayscale, and blur effect.
 * Clicking navigates to the paywall for subscription upgrade.
 */

import { Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Stage3, Stage4, Stage5 } from './AvatarStages'

interface LockedAvatarProps {
  stage: 3 | 4 | 5
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const STAGE_COMPONENTS = {
  3: Stage3,
  4: Stage4,
  5: Stage5,
}

export function LockedAvatar({ stage, size = 'md' }: LockedAvatarProps) {
  const navigate = useNavigate()
  const StageComponent = STAGE_COMPONENTS[stage]

  const handleUnlock = () => {
    navigate('/paywall')
  }

  return (
    <div className="relative inline-block">
      {/* Locked stage preview */}
      <div className="opacity-40 grayscale blur-[1px]">
        <StageComponent size={size} />
      </div>

      {/* Unlock overlay */}
      <button
        onClick={handleUnlock}
        className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 rounded-lg hover:bg-background/70 transition-colors"
        aria-label={`Unlock Stage ${stage} avatar`}
      >
        <Lock className="w-6 h-6 text-primary mb-1" />
        <span className="text-xs font-medium text-primary">Unlock</span>
      </button>
    </div>
  )
}
