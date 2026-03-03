import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { haptics } from '@/lib/haptics'
import { isNative } from '@/lib/platform'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Confetti } from '@/components/Confetti'
import { springs } from '@/lib/animations'
import { Trophy } from 'lucide-react'

interface RankUpModalProps {
  oldRank: number
  newRank: number
  rankName: string
  onClose: () => void
}

export function RankUpModal({ oldRank, newRank, rankName, onClose }: RankUpModalProps) {
  useEffect(() => {
    haptics.heavy()

    if (isNative()) {
      LocalNotifications.schedule({
        notifications: [{
          id: 100,
          title: 'Rank Up!',
          body: `You reached ${rankName} (Rank ${newRank})!`,
          schedule: { at: new Date(Date.now() + 100) },
        }],
      }).catch(() => { })
    }

    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Full-screen confetti burst */}
      <Confetti trigger={true} duration={3500} />

      <AnimatePresence>
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Rank up celebration"
          className="fixed inset-0 bg-background/85 backdrop-blur-md z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          <motion.div
            className="text-center p-8 max-w-sm w-full mx-6"
            initial={{ scale: 0.7, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={springs.bouncy}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Trophy icon */}
            <motion.div
              className="mx-auto mb-6 w-20 h-20 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.6, times: [0, 0.6, 1], delay: 0.1 }}
            >
              <Trophy size={40} className="text-primary" />
            </motion.div>

            {/* RANK UP label */}
            <motion.p
              className="text-xs font-bold tracking-[0.3em] text-primary/70 uppercase mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, ...springs.default }}
            >
              Rank Up
            </motion.p>

            {/* New rank name — big headline */}
            <motion.h2
              className="text-5xl font-black text-primary font-display mb-3 leading-none"
              initial={{ opacity: 0, scale: 0.8, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.4, ...springs.bouncy }}
            >
              {rankName.toUpperCase()}
            </motion.h2>

            {/* Rank number transition */}
            <motion.div
              className="flex items-center justify-center gap-3 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <span className="text-lg text-muted-foreground font-mono">
                Rank {oldRank}
              </span>
              <motion.div
                className="h-px flex-1 bg-primary/30"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.7, duration: 0.4 }}
              />
              <span className="text-2xl font-bold font-mono text-primary">
                Rank {newRank}
              </span>
            </motion.div>

            {/* Dismiss hint */}
            <motion.p
              className="text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              Tap to dismiss
            </motion.p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  )
}
