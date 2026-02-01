import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useXPStore } from '@/stores'
import { ProgressBar } from './ProgressBar'

interface XPDisplayProps {
  compact?: boolean
  showPending?: boolean
}

export function XPDisplay({ compact = false, showPending = true }: XPDisplayProps) {
  const { totalXP, currentLevel, pendingXP, XP_PER_LEVEL, getCurrentLevelProgress, MAX_LEVEL } = useXPStore()
  const [displayXP, setDisplayXP] = useState(totalXP)
  const [xpGains, setXpGains] = useState<{ id: number; amount: number }[]>([])

  const levelProgress = getCurrentLevelProgress()
  const xpInLevel = totalXP % XP_PER_LEVEL
  const xpToNextLevel = XP_PER_LEVEL - xpInLevel

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
        <span className="text-accent-primary font-bold font-digital">Lv.{currentLevel}</span>
        <div className="w-20">
          <ProgressBar progress={levelProgress} size="sm" color="gradient" />
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
            className="absolute left-1/2 -top-2 text-accent-success font-bold font-digital pointer-events-none z-10"
          >
            +{gain.amount} XP
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="text-center">
        {/* Level display */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-2xl font-bold text-accent-primary text-glow-cyan font-digital">
            Level {currentLevel}
          </span>
          {currentLevel >= MAX_LEVEL && (
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
              MAX
            </span>
          )}
        </div>

        {/* XP Bar */}
        <div className="mb-1">
          <ProgressBar
            progress={xpInLevel}
            maxProgress={XP_PER_LEVEL}
            color="gradient"
            size="lg"
          />
        </div>

        {/* XP numbers */}
        <div className="flex justify-between text-xs text-gray-400">
          <span className="font-digital">{xpInLevel.toLocaleString()} XP</span>
          <span className="font-digital">{xpToNextLevel.toLocaleString()} to next</span>
        </div>

        {/* Pending XP indicator */}
        {showPending && pendingXP > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-3 bg-accent-secondary/20 border border-accent-secondary/30 rounded-lg p-2"
          >
            <p className="text-xs text-accent-secondary">
              <span className="font-digital font-bold">+{pendingXP} XP</span> pending
            </p>
            <p className="text-[10px] text-gray-500">Claim on Sunday</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
