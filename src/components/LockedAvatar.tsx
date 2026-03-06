/**
 * LockedAvatar Component
 *
 * Displays a locked preview of premium avatar stages (3-5) with an upgrade prompt.
 * Shows the avatar image with reduced opacity, grayscale, and blur effect.
 * Clicking navigates to the paywall for subscription upgrade.
 */

import { Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/stores'
import { getAvatarImage } from '@/assets/avatars'

interface LockedAvatarProps {
  stage: 3 | 4 | 5
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

const SIZE_MAP = {
  sm: 64,
  md: 96,
  lg: 128,
  xl: 240,
  '2xl': 320,
}

export function LockedAvatar({ stage, size = 'md' }: LockedAvatarProps) {
  const navigate = useNavigate()
  const archetype = useUserStore((s) => s.profile?.archetype) || 'bro'
  const dimension = SIZE_MAP[size]
  const avatarSrc = getAvatarImage(archetype, stage)

  const handleUnlock = () => {
    navigate('/paywall')
  }

  return (
    <div className="relative inline-block">
      {/* Locked stage preview */}
      <div className="opacity-40 grayscale blur-[1px]">
        <img
          src={avatarSrc}
          alt={`${archetype} avatar - Stage ${stage} (locked)`}
          width={dimension}
          height={dimension}
          className="object-contain"
        />
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
