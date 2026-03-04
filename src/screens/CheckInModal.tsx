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
import { Dumbbell, Beef, Flame, PartyPopper, Moon, X, Check, LucideIcon } from 'lucide-react'

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
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-200"
      onClick={() => onClose(false)}
    >
      <div
        className="w-full max-w-md bg-card max-h-[85vh] mb-20 sm:mb-0 flex flex-col rounded-t-xl sm:rounded-xl border border-border animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
        data-testid="checkin-modal"
      >
        {!submitted ? (
          <>
            <div className="overflow-y-auto flex-1 p-6 pb-0">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                  {LABELS.checkIn}
                </h2>
                <button
                  onClick={() => onClose(false)}
                  aria-label="Close check-in"
                  className="text-muted-foreground hover:text-foreground transition-colors rounded-md p-1"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3 mb-6">
                {/* Workout */}
                {todayWorkout ? (
                  <QuestCheckbox
                    label={`Completed ${todayWorkout.name}`}
                    xp={DP_VALUES.training}
                    checked={data.workout}
                    onChange={(v) => setData(d => ({ ...d, workout: v }))}
                    icon={Dumbbell}
                    disabled={workoutCompleted}
                    xpLabel={LABELS.xp}
                  />
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted text-muted-foreground opacity-60">
                    <Moon size={20} />
                    <span>Recovery Day - No training scheduled</span>
                  </div>
                )}

                {/* Protein */}
                <QuestCheckbox
                  label="Hit Protein Target"
                  xp={DP_VALUES.protein}
                  checked={data.protein}
                  onChange={(v) => setData(d => ({ ...d, protein: v }))}
                  icon={Beef}
                  xpLabel={LABELS.xp}
                />

                {/* Streak Info */}
                {obedienceStreak > 0 && (
                  <div data-testid="checkin-streak-display" className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <div className="flex items-center gap-3">
                      <Flame size={20} className="text-warning" />
                      <span>{LABELS.streak}: {obedienceStreak} days</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Total DP Preview */}
              <div className="bg-muted p-4 mb-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total {LABELS.xp}</span>
                  <span className="text-2xl font-bold font-mono text-primary">
                    +{calculateDP()} {LABELS.xp}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 pt-3 border-t border-border">
              <Button onClick={handleSubmit} className="w-full" size="lg" data-testid="checkin-confirm-button" disabled={isSubmitting || (!data.workout && !data.protein)}>
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
                    +{anim.amount} {LABELS.xp}
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
                +{earnedDP} {LABELS.xp}
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

function QuestCheckbox({
  label,
  xp,
  checked,
  onChange,
  icon: Icon,
  disabled = false,
  xpLabel = 'XP'
}: {
  label: string
  xp: number
  checked: boolean
  onChange: (v: boolean) => void
  icon: LucideIcon
  disabled?: boolean
  xpLabel?: string
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : () => onChange(!checked)}
      role="checkbox"
      aria-checked={checked}
      aria-label={`${label}: ${xp} ${xpLabel}`}
      aria-disabled={disabled}
      className={cn(
        'flex items-center gap-3 w-full p-3 rounded-lg border text-left transition-colors',
        disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-muted/50',
        checked ? 'border-success/50 bg-card' : 'border-border bg-card'
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          'w-6 h-6 border-2 flex items-center justify-center transition-all rounded',
          checked ? 'bg-success border-success scale-100' : 'border-border scale-100'
        )}
      >
        {checked && (
          <Check size={14} className="text-primary-foreground animate-in zoom-in-0 duration-150" />
        )}
      </div>
      <Icon size={20} className={checked ? 'text-success' : 'text-muted-foreground'} />
      <span className="flex-1">{label}</span>
      <span className={cn('font-mono font-bold', checked ? 'text-success' : 'text-muted-foreground')}>
        +{xp} {xpLabel}
      </span>
    </button>
  )
}
