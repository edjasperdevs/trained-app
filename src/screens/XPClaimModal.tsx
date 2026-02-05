import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Button, BadgeUnlockModal } from '@/components'
import { useXPStore, useAvatarStore, useAchievementsStore } from '@/stores'
import { LABELS } from '@/design/constants'
import { analytics } from '@/lib/analytics'
import { haptics } from '@/lib/haptics'
import { Gift, Sparkles, Zap, Trophy, Star, ChevronRight, Gamepad2 } from 'lucide-react'

interface XPClaimModalProps {
  isOpen: boolean
  onClose: () => void
}

// Confetti particle component - muted colors for Trained theme
const CONFETTI_COLORS = ['#8B1A1A', '#4A4A4A', '#2D5A27', '#8B6914', '#3A5A7A']

function Confetti({ delay }: { delay: number }) {
  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]
  const startX = Math.random() * 100
  const endX = startX + (Math.random() - 0.5) * 50
  const rotation = Math.random() * 720 - 360

  return (
    <motion.div
      initial={{
        opacity: 0.6,
        y: -20,
        x: `${startX}%`,
        rotate: 0,
        scale: 1
      }}
      animate={{
        opacity: 0,
        y: 400,
        x: `${endX}%`,
        rotate: rotation,
        scale: 0.5
      }}
      transition={{
        duration: 2 + Math.random(),
        delay,
        ease: 'easeOut'
      }}
      className="absolute top-0 w-3 h-3 rounded-sm"
      style={{ backgroundColor: color }}
    />
  )
}

export function XPClaimModal({ isOpen, onClose }: XPClaimModalProps) {
  const { claimWeeklyXP, getPendingXPBreakdown, pendingXP, currentLevel, totalXP, getCurrentLevelProgress, getXPForNextLevel } = useXPStore()
  const { triggerReaction, updateEvolutionStage } = useAvatarStore()

  const [phase, setPhase] = useState<'preview' | 'claiming' | 'complete' | 'levelup'>('preview')
  const [claimResult, setClaimResult] = useState<{ xpClaimed: number; leveledUp: boolean; newLevel: number } | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [xpCountUp, setXpCountUp] = useState(0)
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([])
  const [showBadgeModal, setShowBadgeModal] = useState(false)

  const checkAndAwardBadges = useAchievementsStore((state) => state.checkAndAwardBadges)

  const breakdown = getPendingXPBreakdown()

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPhase('preview')
      setClaimResult(null)
      setShowConfetti(false)
      setXpCountUp(0)
      setUnlockedBadges([])
      setShowBadgeModal(false)
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
  }, [phase, claimResult])

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

    // Check for evolution
    updateEvolutionStage(result.newLevel)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Claim weekly XP"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center overflow-hidden"
        onClick={phase === 'complete' || phase === 'levelup' ? handleClose : undefined}
      >
        {/* Confetti */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 25 }).map((_, i) => (
              <Confetti key={i} delay={i * 0.05} />
            ))}
          </div>
        )}

        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-surface max-h-[90vh] overflow-y-auto rounded-t-lg sm:rounded-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Preview Phase */}
          {phase === 'preview' && (
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="mb-4">
                  <Gift size={56} className="mx-auto text-warning" />
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  Weekly Reward Ritual
                </h2>
                <p className="text-text-secondary">
                  You've earned this. Claim your reward.
                </p>
              </div>

              {/* XP Breakdown */}
              <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
                {breakdown.days.map((day, index) => (
                  <motion.div
                    key={day.date}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between bg-surface-elevated px-4 py-2 rounded"
                  >
                    <span className="text-sm text-text-secondary">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="font-mono text-primary">+{day.total} {LABELS.xp}</span>
                  </motion.div>
                ))}
              </div>

              {/* Total */}
              <div className="p-4 mb-6 bg-primary-muted rounded border border-primary/30">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Ready to Claim</span>
                  <span className="text-3xl font-bold font-mono text-primary">
                    {pendingXP} {LABELS.xp}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={onClose}>
                  Later
                </Button>
                <Button onClick={handleClaim} fullWidth size="lg">
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
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
                className="mb-8"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="inline-block"
                >
                  <Zap size={56} className="text-primary" />
                </motion.div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-text-secondary mb-4"
              >
                Processing reward...
              </motion.p>

              <motion.p
                className="text-6xl font-bold font-mono text-primary"
              >
                +{xpCountUp}
              </motion.p>
            </div>
          )}

          {/* Complete Phase */}
          {phase === 'complete' && claimResult && (
            <div className="p-6 text-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="mb-6"
              >
                <Trophy size={64} className="mx-auto text-primary" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-bold mb-2"
              >
                Reward Claimed
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: 'spring' }}
                className="mb-6"
              >
                <p className="text-5xl font-bold font-mono mb-2 text-primary">
                  +{claimResult.xpClaimed} {LABELS.xp}
                </p>
                <p className="text-text-secondary">
                  Total: {totalXP.toLocaleString()} {LABELS.xp}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="bg-surface-elevated p-4 mb-6 rounded"
              >
                <div className="flex items-center justify-center gap-2">
                  <Star size={24} className="text-primary" />
                  <span className="text-xl font-bold">
                    {LABELS.level} {currentLevel}
                  </span>
                </div>
                <div className="mt-2 h-2 bg-surface overflow-hidden rounded-sm">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${getCurrentLevelProgress()}%` }}
                    transition={{ delay: 1, duration: 1 }}
                    className="h-full bg-primary"
                  />
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  {getXPForNextLevel()} {LABELS.xp} to next {LABELS.level.toLowerCase()}
                </p>
              </motion.div>

              <Button onClick={handleClose} fullWidth>
                Continue
              </Button>
            </div>
          )}

          {/* Level Up Phase */}
          {phase === 'levelup' && claimResult && (
            <div className="text-center p-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5, times: [0, 0.7, 1] }}
                className="mb-6"
              >
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ scale: { duration: 2, repeat: Infinity } }}
                  className="inline-block"
                >
                  <Star size={72} className="text-primary" fill="currentColor" />
                </motion.div>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold mb-4 text-primary"
              >
                Rank Promoted!
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="mb-8"
              >
                <div className="flex items-center justify-center gap-4">
                  <span className="text-4xl text-text-secondary">
                    Rank {claimResult.newLevel - 1}
                  </span>
                  <motion.div
                    animate={{ x: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                  >
                    <ChevronRight size={24} className="text-primary" />
                  </motion.div>
                  <span className="text-5xl font-bold font-mono text-primary">
                    Rank {claimResult.newLevel}
                  </span>
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-text-secondary mb-6"
              >
                {`You earned ${claimResult.xpClaimed} ${LABELS.xp} this week.`}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <Button onClick={handleClose} fullWidth size="lg">
                  <span className="flex items-center gap-2">
                    <Gamepad2 size={18} />
                    Continue
                  </span>
                </Button>
              </motion.div>
            </div>
          )}
        </motion.div>

        {/* Badge Unlock Modal */}
        {showBadgeModal && unlockedBadges.length > 0 && (
          <BadgeUnlockModal
            badgeIds={unlockedBadges}
            onClose={onClose}
          />
        )}
      </motion.div>
    </AnimatePresence>
  )
}
