import { useEffect, useMemo } from 'react'
import { haptics } from '@/lib/haptics'
import { isNative } from '@/lib/platform'
import { LocalNotifications } from '@capacitor/local-notifications'
import { ChevronRight } from 'lucide-react'

interface RankUpModalProps {
  oldRank: number
  newRank: number
  rankName: string
  onClose: () => void
}

// Dopamine Noir V2 palette
const CONFETTI_COLORS = ['#C8FF00', '#D4FF33', '#A0CC00', '#86B300']

interface ConfettiParticle {
  color: string
  startX: number
  endX: number
  rotation: number
  duration: number
  delay: number
}

function Confetti({ particle }: { particle: ConfettiParticle }) {
  return (
    <div
      className="absolute top-0 w-3 h-3 rounded-sm"
      style={{
        backgroundColor: particle.color,
        left: `${particle.startX}%`,
        animation: `confetti-fall ${particle.duration}s ${particle.delay}s ease-out forwards`,
        ['--confetti-end-x' as string]: `${particle.endX - particle.startX}vw`,
        ['--confetti-rotation' as string]: `${particle.rotation}deg`,
      }}
    />
  )
}

export function RankUpModal({ oldRank, newRank, rankName, onClose }: RankUpModalProps) {
  // Generate confetti particles
  const confettiParticles = useMemo<ConfettiParticle[]>(() => {
    return Array.from({ length: 25 }).map((_, i) => {
      const startX = Math.random() * 100
      return {
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        startX,
        endX: startX + (Math.random() - 0.5) * 50,
        rotation: Math.random() * 720 - 360,
        duration: 2 + Math.random(),
        delay: i * 0.05,
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Haptic feedback + local notification on mount
  useEffect(() => {
    haptics.heavy()

    // Schedule local notification for rank-up (progressive enhancement)
    if (isNative()) {
      LocalNotifications.schedule({
        notifications: [{
          id: 100,
          title: 'Rank Up!',
          body: `You reached ${rankName} (Rank ${newRank})!`,
          schedule: { at: new Date(Date.now() + 100) },
        }],
      }).catch(() => {
        // Silent fail - progressive enhancement
      })
    }

    // Auto-close after 3 seconds
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Inject confetti keyframes (same as XPClaimModal) */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            opacity: 0.6;
            transform: translateY(-20px) translateX(0) rotate(0deg) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(400px) translateX(var(--confetti-end-x)) rotate(var(--confetti-rotation)) scale(0.5);
          }
        }
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Rank up celebration"
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200"
        onClick={onClose}
      >
        {/* Confetti */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {confettiParticles.map((particle, i) => (
            <Confetti key={i} particle={particle} />
          ))}
        </div>

        <div
          className="text-center p-8 max-w-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {/* RANK UP header */}
          <h2
            className="text-4xl font-bold text-primary font-display mb-4 animate-in zoom-in-50 duration-500"
            style={{ animation: 'pulse-scale 2s ease-in-out infinite' }}
          >
            RANK UP
          </h2>

          {/* Rank name */}
          <p className="text-3xl font-bold text-primary font-display mb-6 animate-in fade-in slide-in-from-bottom-4 duration-300 delay-200">
            {rankName}
          </p>

          {/* Rank transition */}
          <div className="flex items-center justify-center gap-4 animate-in fade-in zoom-in-50 duration-500 delay-300">
            <span className="text-2xl text-muted-foreground font-mono">
              Rank {oldRank}
            </span>
            <ChevronRight size={24} className="text-primary" />
            <span className="text-3xl font-bold font-mono text-primary">
              Rank {newRank}
            </span>
          </div>

          {/* Dismiss hint */}
          <p className="text-xs text-muted-foreground mt-8 animate-in fade-in duration-300 delay-500">
            Tap to dismiss
          </p>
        </div>
      </div>
    </>
  )
}
