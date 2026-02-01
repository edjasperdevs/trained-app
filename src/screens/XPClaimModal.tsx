import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Card, BadgeUnlockModal } from '@/components'
import { useXPStore, useAvatarStore, useAchievementsStore } from '@/stores'

interface XPClaimModalProps {
  isOpen: boolean
  onClose: () => void
}

// Confetti particle component
function Confetti({ delay }: { delay: number }) {
  const colors = ['#00F5D4', '#7B61FF', '#FFD700', '#FF6B6B', '#4ECDC4']
  const color = colors[Math.floor(Math.random() * colors.length)]
  const startX = Math.random() * 100
  const endX = startX + (Math.random() - 0.5) * 50
  const rotation = Math.random() * 720 - 360

  return (
    <motion.div
      initial={{
        opacity: 1,
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

    // Check for evolution
    updateEvolutionStage(result.newLevel)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center overflow-hidden"
        onClick={phase === 'complete' || phase === 'levelup' ? handleClose : undefined}
      >
        {/* Confetti */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 50 }).map((_, i) => (
              <Confetti key={i} delay={i * 0.05} />
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
            <Card className="bg-bg-secondary">
              <div className="text-center mb-6">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-6xl mb-4"
                >
                  🎁
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">Weekly XP Ready!</h2>
                <p className="text-gray-400">Your hard work has paid off</p>
              </div>

              {/* XP Breakdown */}
              <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
                {breakdown.days.map((day, index) => (
                  <motion.div
                    key={day.date}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between bg-bg-card rounded-lg px-4 py-2"
                  >
                    <span className="text-sm text-gray-400">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="font-digital text-accent-primary">+{day.total} XP</span>
                  </motion.div>
                ))}
              </div>

              {/* Total */}
              <div className="bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total to Claim</span>
                  <span className="text-3xl font-bold font-digital text-glow-cyan">
                    {pendingXP} XP
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
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                    >
                      ✨
                    </motion.span>
                    CLAIM XP
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
                  className="text-6xl inline-block"
                >
                  ⚡
                </motion.div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-gray-400 mb-4"
              >
                Claiming XP...
              </motion.p>

              <motion.p
                className="text-6xl font-bold font-digital text-glow-cyan"
                style={{ textShadow: '0 0 30px rgba(0, 245, 212, 0.5)' }}
              >
                +{xpCountUp}
              </motion.p>
            </div>
          )}

          {/* Complete Phase */}
          {phase === 'complete' && claimResult && (
            <Card className="bg-bg-secondary text-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="text-7xl mb-6"
              >
                🏆
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-bold mb-2"
              >
                XP Claimed!
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: 'spring' }}
                className="mb-6"
              >
                <p className="text-5xl font-bold font-digital text-accent-success mb-2">
                  +{claimResult.xpClaimed} XP
                </p>
                <p className="text-gray-400">
                  Total: {totalXP.toLocaleString()} XP
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="bg-bg-card rounded-lg p-4 mb-6"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl">⭐</span>
                  <span className="text-xl font-bold">Level {currentLevel}</span>
                </div>
                <div className="mt-2 h-2 bg-bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${getCurrentLevelProgress()}%` }}
                    transition={{ delay: 1, duration: 1 }}
                    className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {getXPForNextLevel()} XP to next level
                </p>
              </motion.div>

              <Button onClick={handleClose} fullWidth>
                Awesome!
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
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
                    scale: { duration: 1, repeat: Infinity }
                  }}
                  className="text-8xl inline-block"
                >
                  🌟
                </motion.div>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold mb-4 bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent"
              >
                LEVEL UP!
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="mb-8"
              >
                <div className="flex items-center justify-center gap-4">
                  <span className="text-4xl text-gray-500">Lvl {claimResult.newLevel - 1}</span>
                  <motion.span
                    animate={{ x: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="text-2xl"
                  >
                    →
                  </motion.span>
                  <span className="text-5xl font-bold font-digital text-glow-purple">
                    Lvl {claimResult.newLevel}
                  </span>
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-gray-400 mb-6"
              >
                You earned {claimResult.xpClaimed} XP this week!
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <Button onClick={handleClose} fullWidth size="lg">
                  <span className="flex items-center gap-2">
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                    >
                      🎮
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
