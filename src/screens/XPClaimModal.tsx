import { useState, useEffect, useMemo } from 'react'
import { BadgeUnlockModal } from '@/components'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useXPStore, useAvatarStore, useAchievementsStore } from '@/stores'
import { LABELS } from '@/design/constants'
import { analytics } from '@/lib/analytics'
import { haptics } from '@/lib/haptics'
import { Gift, Sparkles, Zap, Trophy, Star, ChevronRight, Gamepad2 } from 'lucide-react'

interface XPClaimModalProps {
  isOpen: boolean
  onClose: () => void
}

// Confetti particle component - Dopamine Noir V2 palette
const CONFETTI_COLORS = ['#C8FF00', '#A0CC00', '#D4FF33', '#A1A1AA', '#4488FF']

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

export function XPClaimModal({ isOpen, onClose }: XPClaimModalProps) {
  const { claimWeeklyXP, getPendingXPBreakdown, pendingXP, currentLevel, totalXP, getCurrentLevelProgress, getXPForNextLevel } = useXPStore()
  const { triggerReaction } = useAvatarStore()

  const [phase, setPhase] = useState<'preview' | 'claiming' | 'complete' | 'levelup'>('preview')
  const [claimResult, setClaimResult] = useState<{ xpClaimed: number; leveledUp: boolean; newLevel: number } | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [xpCountUp, setXpCountUp] = useState(0)
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([])
  const [showBadgeModal, setShowBadgeModal] = useState(false)
  const [progressWidth, setProgressWidth] = useState(0)

  const checkAndAwardBadges = useAchievementsStore((state) => state.checkAndAwardBadges)

  const breakdown = getPendingXPBreakdown()

  // Pre-generate confetti particles so they don't change on re-render
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
  }, [showConfetti]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPhase('preview')
      setClaimResult(null)
      setShowConfetti(false)
      setXpCountUp(0)
      setUnlockedBadges([])
      setShowBadgeModal(false)
      setProgressWidth(0)
    }
  }, [isOpen])

  // Animate XP count up
  useEffect(() => {
    if (phase === 'claiming' && claimResult) {
      const target = claimResult.xpClaimed
      const duration = 2000 // 2 seconds
      const steps = 60
      const increment = target / steps
      let current = 0

      const interval = setInterval(() => {
        current += increment
        if (current >= target) {
          setXpCountUp(target)
          clearInterval(interval)

          // Move to next phase after count up
          setTimeout(() => {
            // Check for new badges (especially level-based ones)
            const newBadges = checkAndAwardBadges()
            if (newBadges.length > 0) {
              newBadges.forEach(id => {
                const b = useAchievementsStore.getState().getAllBadges().find(badge => badge.id === id)
                if (b) analytics.badgeEarned(b.name, b.rarity)
              })
              setUnlockedBadges(newBadges)
            }

            if (claimResult.leveledUp) {
              setPhase('levelup')
            } else {
              setPhase('complete')
            }
          }, 500)
        } else {
          setXpCountUp(Math.floor(current))
        }
      }, duration / steps)

      return () => clearInterval(interval)
    }
  }, [phase, claimResult]) // eslint-disable-line react-hooks/exhaustive-deps

  // Animate progress bar after complete phase renders
  useEffect(() => {
    if (phase === 'complete') {
      const timeout = setTimeout(() => {
        setProgressWidth(getCurrentLevelProgress())
      }, 1000)
      return () => clearTimeout(timeout)
    }
  }, [phase, getCurrentLevelProgress])

  const handleClose = () => {
    if (unlockedBadges.length > 0 && !showBadgeModal) {
      setShowBadgeModal(true)
    } else {
      onClose()
    }
  }

  const handleClaim = () => {
    // Trigger avatar reaction
    triggerReaction('claim')

    // Claim the XP
    const result = claimWeeklyXP()
    setClaimResult(result)
    setPhase('claiming')
    setShowConfetti(true)
    haptics.heavy()

    // Track analytics
    analytics.xpClaimed(result.xpClaimed)
    if (result.leveledUp) {
      analytics.levelUp(result.newLevel)
    }

  }

  if (!isOpen) return null

  return (
    <>
      {/* Inject confetti keyframes */}
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
        @keyframes spin-continuous {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes bounce-x {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(10px); }
        }
      `}</style>

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Claim weekly XP"
        className="animate-in fade-in duration-200 fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center overflow-hidden"
        onClick={phase === 'complete' || phase === 'levelup' ? handleClose : undefined}
      >
        {/* Confetti */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {confettiParticles.map((particle, i) => (
              <Confetti key={i} particle={particle} />
            ))}
          </div>
        )}

        <div
          className="animate-in slide-in-from-bottom duration-300 w-full max-w-md bg-card max-h-[90vh] overflow-y-auto rounded-t-lg sm:rounded-lg"
          onClick={(e) => e.stopPropagation()}
          data-testid="xpclaim-modal"
        >
          {/* Preview Phase */}
          {phase === 'preview' && (
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="mb-4">
                  <Gift size={56} className="mx-auto text-warning" />
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  Claim Reward
                </h2>
                <p className="text-muted-foreground">
                  You've earned this. Claim your reward.
                </p>
              </div>

              {/* XP Breakdown */}
              <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
                {breakdown.days.map((day, index) => (
                  <div
                    key={day.date}
                    className="animate-in fade-in slide-in-from-left duration-300 flex items-center justify-between bg-muted px-4 py-2 rounded"
                    style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'both' }}
                  >
                    <span className="text-sm text-muted-foreground">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="font-mono text-primary">+{day.total} {LABELS.xp}</span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <Card className="mb-6 bg-primary/10 border-primary/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Ready to Claim</span>
                    <span className="text-3xl font-bold font-mono text-primary" data-testid="xpclaim-amount-display">
                      {pendingXP} {LABELS.xp}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={onClose}>
                  Later
                </Button>
                <Button onClick={handleClaim} className="w-full" size="lg" data-testid="xpclaim-claim-button">
                  <span className="flex items-center gap-2">
                    <Sparkles size={18} />
                    CLAIM REWARD
                  </span>
                </Button>
              </div>
            </div>
          )}

          {/* Claiming Phase - XP Count Up */}
          {phase === 'claiming' && (
            <div className="text-center p-6">
              <div className="animate-in zoom-in duration-500 mb-8">
                <div
                  className="inline-block"
                  style={{ animation: 'spin-continuous 1s linear infinite' }}
                >
                  <Zap size={56} className="text-primary" />
                </div>
              </div>

              <p className="animate-in fade-in duration-300 text-muted-foreground mb-4">
                Processing reward...
              </p>

              <p className="text-6xl font-bold font-mono text-primary">
                +{xpCountUp}
              </p>
            </div>
          )}

          {/* Complete Phase */}
          {phase === 'complete' && claimResult && (
            <div className="p-6 text-center">
              <div
                className="animate-in zoom-in spin-in-180 duration-500 mb-6"
                style={{ animationDelay: '200ms', animationFillMode: 'both' }}
              >
                <Trophy size={64} className="mx-auto text-primary" />
              </div>

              <h2
                className="animate-in fade-in slide-in-from-bottom-2 duration-300 text-2xl font-bold mb-2"
                style={{ animationDelay: '400ms', animationFillMode: 'both' }}
              >
                Reward Claimed
              </h2>

              <div
                className="animate-in fade-in zoom-in-50 duration-500 mb-6"
                style={{ animationDelay: '600ms', animationFillMode: 'both' }}
              >
                <p className="text-5xl font-bold font-mono mb-2 text-primary">
                  +{claimResult.xpClaimed} {LABELS.xp}
                </p>
                <p className="text-muted-foreground">
                  Total: {totalXP.toLocaleString()} {LABELS.xp}
                </p>
              </div>

              <div
                className="animate-in fade-in duration-300 bg-muted p-4 mb-6 rounded"
                style={{ animationDelay: '800ms', animationFillMode: 'both' }}
              >
                <div className="flex items-center justify-center gap-2">
                  <Star size={24} className="text-primary" />
                  <span className="text-xl font-bold">
                    {LABELS.level} {currentLevel}
                  </span>
                </div>
                <div className="mt-2 h-2 bg-card overflow-hidden rounded-sm">
                  <div
                    className="h-full bg-primary transition-all duration-1000 ease-out"
                    style={{ width: `${progressWidth}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {getXPForNextLevel()} {LABELS.xp} to next {LABELS.level.toLowerCase()}
                </p>
              </div>

              <Button onClick={handleClose} className="w-full">
                Continue
              </Button>
            </div>
          )}

          {/* Level Up Phase */}
          {phase === 'levelup' && claimResult && (
            <div className="text-center p-6">
              <div
                className="animate-in zoom-in duration-500 mb-6"
                style={{ animationFillMode: 'both' }}
              >
                <div
                  className="inline-block"
                  style={{ animation: 'pulse-scale 2s ease-in-out infinite' }}
                >
                  <Star size={72} className="text-primary" fill="currentColor" />
                </div>
              </div>

              <h2
                className="animate-in fade-in slide-in-from-bottom-2 duration-300 text-3xl font-bold mb-4 text-primary"
                style={{ animationDelay: '300ms', animationFillMode: 'both' }}
              >
                Rank Promoted!
              </h2>

              <div
                className="animate-in fade-in zoom-in-50 duration-500 mb-8"
                style={{ animationDelay: '500ms', animationFillMode: 'both' }}
              >
                <div className="flex items-center justify-center gap-4">
                  <span className="text-4xl text-muted-foreground">
                    Rank {claimResult.newLevel - 1}
                  </span>
                  <div style={{ animation: 'bounce-x 0.5s ease-in-out infinite' }}>
                    <ChevronRight size={24} className="text-primary" />
                  </div>
                  <span className="text-5xl font-bold font-mono text-primary">
                    Rank {claimResult.newLevel}
                  </span>
                </div>
              </div>

              <p
                className="animate-in fade-in duration-300 text-muted-foreground mb-6"
                style={{ animationDelay: '700ms', animationFillMode: 'both' }}
              >
                {`You earned ${claimResult.xpClaimed} ${LABELS.xp} this week.`}
              </p>

              <div
                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: '900ms', animationFillMode: 'both' }}
              >
                <Button onClick={handleClose} className="w-full" size="lg">
                  <span className="flex items-center gap-2">
                    <Gamepad2 size={18} />
                    Continue
                  </span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Badge Unlock Modal */}
        {showBadgeModal && unlockedBadges.length > 0 && (
          <BadgeUnlockModal
            badgeIds={unlockedBadges}
            onClose={onClose}
          />
        )}
      </div>
    </>
  )
}
