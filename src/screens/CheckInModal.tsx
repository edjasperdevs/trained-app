import { useState, useEffect } from 'react'
import { BadgeUnlockModal, RankUpModal } from '@/components'
import {
  useUserStore,
  useDPStore,
  useWorkoutStore,
  useMacroStore,
  useAvatarStore,
  useAchievementsStore
} from '@/stores'
import { DP_VALUES, RANKS } from '@/stores/dpStore'
import { LABELS } from '@/design/constants'
import { analytics } from '@/lib/analytics'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'
import { Flame, PartyPopper, Moon, Check } from 'lucide-react'

interface CheckInModalProps {
  isOpen: boolean
  onClose: (didCheckIn?: boolean) => void
}

interface CheckInData {
  workout: boolean
  protein: boolean
}

export function CheckInModal({ isOpen, onClose }: CheckInModalProps) {
  const updateStreak = useUserStore((state) => state.updateStreak)
  const obedienceStreak = useDPStore((state) => state.obedienceStreak)
  const { getTodayWorkout, isWorkoutCompletedToday } = useWorkoutStore()
  const { isProteinTargetHit } = useMacroStore()
  const { triggerReaction } = useAvatarStore()

  const [data, setData] = useState<CheckInData>({
    workout: false,
    protein: false,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [earnedDP, setEarnedDP] = useState(0)
  const [dpAnimations, setDpAnimations] = useState<{ id: number; amount: number; label: string }[]>([])
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([])
  const [showBadgeModal, setShowBadgeModal] = useState(false)
  const [rankUpData, setRankUpData] = useState<{ oldRank: number; newRank: number; rankName: string } | null>(null)

  const checkAndAwardBadges = useAchievementsStore((state) => state.checkAndAwardBadges)

  const todayWorkout = getTodayWorkout()
  const workoutCompleted = isWorkoutCompletedToday()

  // Initialize data based on current state
  useEffect(() => {
    if (isOpen) {
      setData({
        workout: workoutCompleted,
        protein: isProteinTargetHit(),
      })
      setSubmitted(false)
      setEarnedDP(0)
      setDpAnimations([])
      setUnlockedBadges([])
      setShowBadgeModal(false)
      setRankUpData(null)
    }
  }, [isOpen])

  const calculateDP = () => {
    let total = 0
    // Only count DP for things not yet awarded today
    const todayLog = useDPStore.getState().getTodayLog()
    if (todayWorkout && data.workout && !(todayLog && todayLog.training > 0)) total += DP_VALUES.training
    if (data.protein && !(todayLog && todayLog.protein > 0)) total += DP_VALUES.protein
    return total
  }

  const handleSubmit = () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    const animations: { id: number; amount: number; label: string }[] = []
    let totalDP = 0
    let lastRankUp: { rankedUp: boolean; newRank: number } | null = null

    // Check what's already been awarded today
    const todayLog = useDPStore.getState().getTodayLog()

    // Award training DP if workout was done and not already awarded
    if (todayWorkout && data.workout && !(todayLog && todayLog.training > 0)) {
      const result = useDPStore.getState().awardDP('training')
      totalDP += result.dpAwarded
      animations.push({ id: animations.length, amount: result.dpAwarded, label: 'Training' })
      if (result.rankedUp) lastRankUp = result
    }

    // Award protein DP if protein target hit and not already awarded
    if (data.protein && !(todayLog && todayLog.protein > 0)) {
      const result = useDPStore.getState().awardDP('protein')
      totalDP += result.dpAwarded
      animations.push({ id: animations.length, amount: result.dpAwarded, label: 'Protein Target' })
      if (result.rankedUp) lastRankUp = result
    }

    // Handle rank-up
    if (lastRankUp && lastRankUp.rankedUp) {
      const rankEntry = RANKS.find(r => r.rank === lastRankUp!.newRank)
      setRankUpData({
        oldRank: lastRankUp.newRank - 1,
        newRank: lastRankUp.newRank,
        rankName: rankEntry?.name || 'Unknown'
      })
    }

    // Update streak
    updateStreak(true)

    // Trigger avatar reaction
    triggerReaction('checkIn')

    // Track analytics
    analytics.checkInCompleted(obedienceStreak + 1)

    setSubmitted(true)
    setEarnedDP(totalDP)
    setDpAnimations(animations)

    // Check for new badges after a delay
    const badgeCheckDelay = animations.length * 150 + 800
    setTimeout(() => {
      const newBadges = checkAndAwardBadges()
      if (newBadges.length > 0) {
        newBadges.forEach(id => {
          const b = useAchievementsStore.getState().getAllBadges().find(badge => badge.id === id)
          if (b) analytics.badgeEarned(b.name, b.rarity)
        })
        setUnlockedBadges(newBadges)
        setShowBadgeModal(true)
      }
    }, badgeCheckDelay)
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Daily check-in"
      className="fixed inset-0 bg-background z-50 flex flex-col animate-in fade-in duration-200"
      onClick={() => onClose(false)}
    >
      <div
        className="w-full flex-1 flex flex-col"
        onClick={(e) => e.stopPropagation()}
        data-testid="checkin-modal"
      >
        {!submitted ? (
          <>
            {/* Header */}
            <div className="pt-14 pb-6 px-6 text-center">
              <h1 className="text-lg font-heading uppercase tracking-[0.15em] text-primary mb-2">
                Daily Report
              </h1>
              <p className="text-sm text-muted-foreground">
                Log your compliance. Earn your DP.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
              <div className="space-y-3 mb-6">
                {/* Workout */}
                {todayWorkout ? (
                  <ComplianceRow
                    label="Training"
                    sublabel={workoutCompleted ? 'Workout logged' : todayWorkout.name}
                    dp={DP_VALUES.training}
                    checked={data.workout}
                    onChange={(v) => setData(d => ({ ...d, workout: v }))}
                    disabled={workoutCompleted}
                  />
                ) : (
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-border">
                    <Moon size={20} className="text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-heading uppercase tracking-wider text-sm text-muted-foreground">Training</p>
                      <p className="text-xs text-muted-foreground/60">Recovery Day</p>
                    </div>
                  </div>
                )}

                {/* Protein */}
                <ComplianceRow
                  label="Protein Goal"
                  sublabel={data.protein ? 'Target reached' : 'Hit your daily target'}
                  dp={DP_VALUES.protein}
                  checked={data.protein}
                  onChange={(v) => setData(d => ({ ...d, protein: v }))}
                />

                {/* Streak Info */}
                {obedienceStreak > 0 && (
                  <div data-testid="checkin-streak-display" className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-3">
                      <Flame size={20} className="text-primary" />
                      <span className="text-sm">Current Streak</span>
                    </div>
                    <span className="font-mono font-bold text-primary">{obedienceStreak} days</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer with total and submit */}
            <div className="px-6 pb-8 safe-bottom">
              {/* Total DP Preview */}
              <div className="text-center mb-4">
                <span className="text-muted-foreground text-sm">Today: </span>
                <span className="text-2xl font-bold font-mono text-primary">
                  +{calculateDP()} DP
                </span>
                <span className="text-muted-foreground text-sm"> earned</span>
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full h-14 text-lg font-heading uppercase tracking-wider"
                size="lg"
                data-testid="checkin-confirm-button"
                disabled={isSubmitting || (!data.workout && !data.protein)}
              >
                Submit Report
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8 p-6">
            {/* Success */}
            <div className="mb-4 animate-in zoom-in-0 duration-500">
              <PartyPopper size={56} className="mx-auto text-primary" />
            </div>

            <h2 className="text-2xl font-bold mb-2 animate-in fade-in slide-in-from-bottom-4 duration-300 delay-200">
              Report Accepted.
            </h2>

            {/* DP Breakdown */}
            <div className="space-y-2 my-6 relative">
              {dpAnimations.map((anim, index) => (
                <div
                  key={anim.id}
                  className="flex items-center justify-between bg-muted px-4 py-2 rounded-lg animate-in fade-in slide-in-from-left-8 duration-300"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <span>{anim.label}</span>
                  <span className="text-success font-mono font-bold">
                    +{anim.amount} {LABELS.dp}
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div
              className="p-6 mb-6 bg-primary/10 rounded-lg border border-primary/30 animate-in fade-in zoom-in-90 duration-500"
              style={{ animationDelay: `${dpAnimations.length * 150 + 300}ms` }}
            >
              <p className="text-muted-foreground mb-1">Total Earned</p>
              <p className="text-4xl font-bold font-mono text-primary">
                +{earnedDP} {LABELS.dp}
              </p>
            </div>

            <Button onClick={() => onClose(true)} variant="ghost" className="w-full">
              Continue
            </Button>
          </div>
        )}
      </div>

      {/* Badge Unlock Modal */}
      {showBadgeModal && unlockedBadges.length > 0 && (
        <BadgeUnlockModal
          badgeIds={unlockedBadges}
          onClose={() => setShowBadgeModal(false)}
        />
      )}

      {/* Rank Up Modal */}
      {rankUpData && (
        <RankUpModal
          oldRank={rankUpData.oldRank}
          newRank={rankUpData.newRank}
          rankName={rankUpData.rankName}
          onClose={() => setRankUpData(null)}
        />
      )}
    </div>
  )
}

function ComplianceRow({
  label,
  sublabel,
  dp,
  checked,
  onChange,
  disabled = false
}: {
  label: string
  sublabel?: string
  dp: number
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : () => onChange(!checked)}
      role="checkbox"
      aria-checked={checked}
      aria-label={`${label}: ${dp} DP`}
      aria-disabled={disabled}
      className={cn(
        'flex items-center gap-4 w-full p-4 rounded-xl border text-left transition-all',
        disabled ? 'cursor-default' : 'cursor-pointer',
        checked
          ? 'bg-surface border-primary/30'
          : 'bg-surface border-border hover:border-border/80'
      )}
    >
      <div className="flex-1">
        <p className={cn(
          'font-heading uppercase tracking-wider text-sm',
          checked ? 'text-foreground' : 'text-foreground'
        )}>
          {label}
        </p>
        {sublabel && (
          <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>
        )}
      </div>

      {/* Checkbox circle */}
      <div
        aria-hidden="true"
        className={cn(
          'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
          checked
            ? 'bg-primary border-primary'
            : 'border-muted-foreground/30 bg-transparent'
        )}
      >
        {checked && (
          <Check size={14} className="text-primary-foreground" />
        )}
      </div>

      {/* DP Badge */}
      <div className={cn(
        'px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all',
        checked
          ? 'bg-primary/20 text-primary'
          : 'bg-surface-elevated text-muted-foreground'
      )}>
        +{dp} DP
      </div>
    </button>
  )
}
