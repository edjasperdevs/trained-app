import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Card, BadgeUnlockModal } from '@/components'
import { useXPStore, useAvatarStore, useAchievementsStore } from '@/stores'
import { useTheme } from '@/themes'
import { analytics } from '@/lib/analytics'
import { haptics } from '@/lib/haptics'
import { Gift, Sparkles, Zap, Trophy, Star, ChevronRight, Gamepad2 } from 'lucide-react'

interface XPClaimModalProps {
  isOpen: boolean
  onClose: () => void
}

// Confetti particle component - muted colors for Trained theme
function Confetti({ delay, isTrained }: { delay: number; isTrained: boolean }) {
  const gygColors = ['#00F5D4', '#7B61FF', '#FFD700', '#FF6B6B', '#4ECDC4']
  const trainedColors = ['#8B1A1A', '#4A4A4A', '#2D5A27', '#8B6914', '#3A5A7A']
  const colors = isTrained ? trainedColors : gygColors
  const color = colors[Math.floor(Math.random() * colors.length)]
  const startX = Math.random() * 100
  const endX = startX + (Math.random() - 0.5) * 50
  const rotation = Math.random() * 720 - 360

  return (
    <motion.div
      initial={{
        opacity: isTrained ? 0.6 : 1,
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
  const { theme, themeId } = useTheme()
  const isTrained = themeId === 'trained'

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
        className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center overflow-hidden"
        onClick={phase === 'complete' || phase === 'levelup' ? handleClose : undefined}
      >
        {/* Confetti */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: isTrained ? 25 : 50 }).map((_, i) => (
              <Confetti key={i} delay={i * 0.05} isTrained={isTrained} />
            ))}
          </div>
        )}

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="w-full max-w-md mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Preview Phase */}
          {phase === 'preview' && (
            <Card className="bg-surface">
              <div className="text-center mb-6">
                <motion.div
                  animate={isTrained ? undefined : {
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="mb-4"
                >
                  <Gift size={56} className={`mx-auto ${isTrained ? 'text-warning' : 'text-accent-secondary'}`} />
                </motion.div>
                <h2 className={`text-2xl font-bold mb-2 ${isTrained ? 'font-heading uppercase tracking-wide' : ''}`}>
                  {isTrained ? 'Weekly Reward Ritual' : 'Weekly Release Ready'}
                </h2>
                <p className="text-text-secondary">
                  {isTrained ? "You've earned this. Claim your reward." : 'Your sprint is complete. Time to ship.'}
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
                    className={`flex items-center justify-between bg-surface-elevated px-4 py-2 ${isTrained ? 'rounded' : 'rounded-lg'}`}
                  >
                    <span className="text-sm text-text-secondary">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="font-mono text-primary">+{day.total} {theme.labels.xp}</span>
                  </motion.div>
                ))}
              </div>

              {/* Total */}
              <div className={`p-4 mb-6 ${
                isTrained
                  ? 'bg-primary-muted rounded border border-primary/30'
                  : 'bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 rounded-xl'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">{isTrained ? 'Ready to Claim' : 'Ready to Deploy'}</span>
                  <span className={`text-3xl font-bold font-mono ${isTrained ? 'text-primary' : 'text-glow-cyan'}`}>
                    {pendingXP} {theme.labels.xp}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={onClose}>
                  Later
                </Button>
                <Button onClick={handleClaim} fullWidth size="lg">
                  <span className="flex items-center gap-2">
                    <motion.span
                      animate={isTrained ? undefined : { rotate: [0, 15, -15, 0] }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                    >
                      <Sparkles size={18} />
                    </motion.span>
                    {isTrained ? 'CLAIM REWARD' : 'DEPLOY'}
                  </span>
                </Button>
              </div>
            </Card>
          )}

          {/* Claiming Phase - XP Count Up */}
          {phase === 'claiming' && (
            <div className="text-center py-12">
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
                {isTrained ? 'Processing reward...' : 'Deploying to production...'}
              </motion.p>

              <motion.p
                className={`text-6xl font-bold font-mono ${isTrained ? 'text-primary' : 'text-glow-cyan'}`}
                style={isTrained ? undefined : { textShadow: '0 0 30px rgba(0, 245, 212, 0.5)' }}
              >
                +{xpCountUp}
              </motion.p>
            </div>
          )}

          {/* Complete Phase */}
          {phase === 'complete' && claimResult && (
            <Card className="bg-surface text-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="mb-6"
              >
                <Trophy size={64} className={`mx-auto ${isTrained ? 'text-primary' : 'text-success'}`} />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className={`text-2xl font-bold mb-2 ${isTrained ? 'font-heading uppercase tracking-wide' : ''}`}
              >
                {isTrained ? 'Reward Claimed' : 'Deployed to Production'}
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: 'spring' }}
                className="mb-6"
              >
                <p className={`text-5xl font-bold font-mono mb-2 ${isTrained ? 'text-primary' : 'text-success'}`}>
                  +{claimResult.xpClaimed} {theme.labels.xp}
                </p>
                <p className="text-text-secondary">
                  Total: {totalXP.toLocaleString()} {theme.labels.xp}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className={`bg-surface-elevated p-4 mb-6 ${isTrained ? 'rounded' : 'rounded-lg'}`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Star size={24} className="text-primary" />
                  <span className={`text-xl font-bold ${isTrained ? 'font-heading uppercase tracking-wide' : ''}`}>
                    {theme.labels.level} {currentLevel}
                  </span>
                </div>
                <div className={`mt-2 h-2 bg-surface overflow-hidden ${isTrained ? 'rounded-sm' : 'rounded-full'}`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${getCurrentLevelProgress()}%` }}
                    transition={{ delay: 1, duration: 1 }}
                    className={`h-full ${isTrained ? 'bg-primary' : 'bg-gradient-to-r from-accent-primary to-accent-secondary'}`}
                  />
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  {getXPForNextLevel()} {theme.labels.xp} to next {theme.labels.level.toLowerCase()}
                </p>
              </motion.div>

              <Button onClick={handleClose} fullWidth>
                {isTrained ? 'Continue' : 'Nice.'}
              </Button>
            </Card>
          )}

          {/* Level Up Phase */}
          {phase === 'levelup' && claimResult && (
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5, times: [0, 0.7, 1] }}
                className="mb-6"
              >
                <motion.div
                  animate={isTrained ? { scale: [1, 1.05, 1] } : {
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={isTrained
                    ? { scale: { duration: 2, repeat: Infinity } }
                    : {
                      rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
                      scale: { duration: 1, repeat: Infinity }
                    }
                  }
                  className="inline-block"
                >
                  <Star size={72} className="text-primary" fill="currentColor" />
                </motion.div>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`text-3xl font-bold mb-4 ${
                  isTrained
                    ? 'text-primary font-heading uppercase tracking-wide'
                    : 'bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent'
                }`}
              >
                {isTrained ? 'RANK PROMOTED!' : 'VERSION BUMP!'}
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="mb-8"
              >
                <div className="flex items-center justify-center gap-4">
                  <span className="text-4xl text-text-secondary">
                    {isTrained ? 'Rank' : 'Lvl'} {claimResult.newLevel - 1}
                  </span>
                  <motion.div
                    animate={{ x: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                  >
                    <ChevronRight size={24} className="text-primary" />
                  </motion.div>
                  <span className={`text-5xl font-bold font-mono ${isTrained ? 'text-primary' : 'text-glow-purple'}`}>
                    {isTrained ? 'Rank' : 'Lvl'} {claimResult.newLevel}
                  </span>
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-text-secondary mb-6"
              >
                {isTrained
                  ? `You earned ${claimResult.xpClaimed} ${theme.labels.xp} this week.`
                  : `You shipped ${claimResult.xpClaimed} ${theme.labels.xp} this sprint.`}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <Button onClick={handleClose} fullWidth size="lg">
                  <span className="flex items-center gap-2">
                    <motion.span
                      animate={isTrained ? undefined : { scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                    >
                      <Gamepad2 size={18} />
                    </motion.span>
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
