import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { haptics } from '@/lib/haptics'
import { isNative } from '@/lib/platform'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Confetti } from '@/components/Confetti'
import { EvolvingAvatar } from '@/components/EvolvingAvatar'
import { springs } from '@/lib/animations'
import { useDPStore, useUserStore } from '@/stores'
import { Button } from '@/components/ui/button'
import { RANKS } from '@/stores/dpStore'
import { ShareCardWrapper } from '@/components/share/ShareCardWrapper'
import { RankUpShareCard } from '@/components/share/RankUpShareCard'
import { shareRankUpCard } from '@/lib/shareCard'
import { getAvatarStage } from '@/lib/avatarUtils'

interface RankUpModalProps {
  oldRank: number
  newRank: number
  rankName: string
  onClose: () => void
}

export function RankUpModal({ oldRank, newRank, rankName, onClose }: RankUpModalProps) {
  const [claimed, setClaimed] = useState(false)
  const [sharing, setSharing] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const totalDP = useDPStore((s) => s.totalDP)
  const streak = useDPStore((s) => s.obedienceStreak)
  const archetype = useUserStore((s) => s.profile?.archetype) || 'bro'
  const avatarStage = getAvatarStage(newRank) as 1 | 2 | 3 | 4 | 5
  const oldRankName = RANKS[oldRank]?.name || 'Uninitiated'

  useEffect(() => {
    haptics.heavy()

    if (isNative()) {
      LocalNotifications.schedule({
        notifications: [{
          id: 100,
          title: 'Rank Achieved!',
          body: `You have achieved the rank of ${rankName}!`,
          schedule: { at: new Date(Date.now() + 100) },
        }],
      }).catch(() => { })
    }
  }, [rankName])

  const handleClaim = () => {
    setClaimed(true)
    haptics.success()
    // Don't auto-close - let user choose to share or close
  }

  const handleShare = async () => {
    if (!cardRef.current || sharing) return
    setSharing(true)
    try {
      await shareRankUpCard(cardRef.current, rankName, totalDP, streak)
    } finally {
      setSharing(false)
    }
  }

  return (
    <>
      {/* Full-screen confetti burst */}
      <Confetti trigger={true} duration={4000} />

      <AnimatePresence>
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Rank up celebration"
          className="fixed inset-0 bg-background z-50 flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Golden glow background - static for performance */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Main radial glow */}
            <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/40 blur-[120px] rounded-full" />
            {/* Secondary ember glow */}
            <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-ember/30 blur-[80px] rounded-full" />
            {/* Inner intense glow */}
            <div className="absolute top-[32%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[300px] bg-primary/50 blur-[60px] rounded-full" />
            {/* Bottom gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-primary/20 via-primary/5 to-transparent" />
          </div>

          {/* Content */}
          <div className="relative flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-8">
            {/* Header */}
            <motion.p
              className="text-sm font-heading uppercase tracking-[0.25em] text-primary/80 mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, ...springs.default }}
            >
              Rank Achieved
            </motion.p>

            {/* Avatar with celebration pose */}
            <motion.div
              className="relative mb-6"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.15, opacity: 1 }}
              transition={{ delay: 0.3, ...springs.bouncy }}
            >
              {/* Single pulse ring - limited repeats */}
              <motion.div
                className="absolute inset-[-15%] rounded-full border-2 border-primary/40"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1.5, opacity: [0, 0.5, 0] }}
                transition={{ duration: 1.5, repeat: 3 }}
              />

              <EvolvingAvatar size="xl" />
            </motion.div>

            {/* Rank Name - Big and bold with glow */}
            <motion.h1
              className="text-6xl md:text-7xl font-heading font-black text-foreground uppercase tracking-wider mb-4 drop-shadow-[0_0_30px_rgba(212,168,83,0.3)]"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.5, ...springs.bouncy }}
            >
              {rankName}
            </motion.h1>

            {/* DP earned message */}
            <motion.p
              className="text-base text-muted-foreground mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              You have earned{' '}
              <span className="text-primary font-bold font-mono">
                {totalDP.toLocaleString()}
              </span>{' '}
              Discipline Points.
            </motion.p>

            {/* Rank comparison boxes */}
            <motion.div
              className="flex items-center gap-4 w-full max-w-xs mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex-1 bg-surface border border-border rounded-xl p-4 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Previous:
                </p>
                <p className="text-sm font-heading text-muted-foreground">
                  {oldRankName}
                </p>
              </div>
              <div className="flex-1 bg-primary/10 border border-primary/30 rounded-xl p-4 text-center">
                <p className="text-[10px] uppercase tracking-wider text-primary mb-1">
                  New:
                </p>
                <p className="text-sm font-heading text-primary font-bold">
                  {rankName}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Claim/Share Buttons */}
          <motion.div
            className="px-6 pb-8 safe-bottom"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            {!claimed ? (
              <Button
                onClick={handleClaim}
                className="w-full h-14 text-lg font-heading uppercase tracking-widest shadow-[0_0_30px_rgba(212,168,83,0.4)] hover:shadow-[0_0_40px_rgba(212,168,83,0.5)]"
                size="lg"
              >
                Claim Your Rank
              </Button>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col gap-3"
              >
                <Button
                  onClick={handleShare}
                  disabled={sharing}
                  variant="outline"
                  className="w-full h-14 text-lg font-heading uppercase tracking-widest border-primary/30 text-primary"
                  size="lg"
                >
                  {sharing ? 'Creating Card...' : 'Share Your Rank'}
                </Button>
                <Button
                  onClick={onClose}
                  variant="ghost"
                  className="w-full h-12 text-sm font-heading uppercase tracking-widest text-muted-foreground"
                >
                  Continue
                </Button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Off-screen share card for PNG capture */}
      <ShareCardWrapper cardRef={cardRef}>
        <RankUpShareCard
          rankName={rankName}
          totalDP={totalDP}
          streak={streak}
          avatarStage={avatarStage}
          archetype={archetype}
        />
      </ShareCardWrapper>
    </>
  )
}
