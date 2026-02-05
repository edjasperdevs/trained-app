import { motion, AnimatePresence } from 'motion/react'
import { useState, useEffect } from 'react'
import { useXPStore } from '@/stores'
import { LABELS } from '@/design/constants'
import { ProgressBar } from './ProgressBar'

interface XPDisplayProps {
  compact?: boolean
  showPending?: boolean
}

export function XPDisplay({ compact = false, showPending = true }: XPDisplayProps) {
  const { totalXP, currentLevel, pendingXP, getCurrentLevelProgress, getXPForNextLevel, MAX_LEVEL } = useXPStore()

  const [displayXP, setDisplayXP] = useState(totalXP)
  const [xpGains, setXpGains] = useState<{ id: number; amount: number }[]>([])

  const levelProgress = getCurrentLevelProgress()
  const xpToNextLevel = getXPForNextLevel()

  // Animate XP changes
  useEffect(() => {
    if (totalXP !== displayXP) {
      const diff = totalXP - displayXP
      if (diff > 0) {
        // Show floating XP gain
        setXpGains(prev => [...prev, { id: Date.now(), amount: diff }])

        // Remove after animation
        setTimeout(() => {
          setXpGains(prev => prev.filter(g => g.id !== Date.now()))
        }, 1500)
      }

      // Animate count up
      const duration = 500
      const steps = 20
      const increment = diff / steps
      let current = displayXP

      const timer = setInterval(() => {
        current += increment
        if ((increment > 0 && current >= totalXP) || (increment < 0 && current <= totalXP)) {
          setDisplayXP(totalXP)
          clearInterval(timer)
        } else {
          setDisplayXP(Math.round(current))
        }
      }, duration / steps)

      return () => clearInterval(timer)
    }
  }, [totalXP])

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-primary font-bold font-mono uppercase tracking-wide">
          {LABELS.level} {currentLevel}
        </span>
        <div className="w-20">
          <ProgressBar progress={levelProgress} size="sm" color="primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Floating XP gains */}
      <AnimatePresence>
        {xpGains.map(gain => (
          <motion.div
            key={gain.id}
            initial={{ opacity: 1, y: 0, x: '-50%' }}
            animate={{ opacity: 0, y: -40 }}
            exit={{ opacity: 0 }}
            className="absolute left-1/2 -top-2 text-success font-bold font-mono pointer-events-none z-10"
          >
            +{gain.amount} {LABELS.xp}
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="text-center">
        {/* Level display */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-2xl font-bold text-primary font-mono uppercase tracking-wider">
            {LABELS.level} {currentLevel}
          </span>
          {currentLevel >= MAX_LEVEL && (
            <span className="text-xs bg-primary-muted text-primary px-2 py-0.5 font-semibold rounded">
              MAX
            </span>
          )}
        </div>

        {/* XP Bar */}
        <div className="mb-2">
          <ProgressBar
            progress={levelProgress}
            color="gradient"
            size="lg"
          />
        </div>

        {/* XP numbers */}
        <div className="flex justify-between text-xs text-text-secondary">
          <span className="font-mono">{Math.round(levelProgress)}%</span>
          <span className="font-mono">{xpToNextLevel.toLocaleString()} {LABELS.xp} to next</span>
        </div>

        {/* Pending XP indicator */}
        {showPending && pendingXP > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-3 p-3 border bg-surface border-border rounded"
          >
            <p className="text-sm text-secondary">
              <span className="font-mono font-bold">+{pendingXP} {LABELS.xp}</span> pending
            </p>
            <p className="text-[10px] text-text-secondary mt-0.5">Claim on Sunday</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
