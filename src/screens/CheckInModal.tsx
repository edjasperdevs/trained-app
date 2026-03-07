import { useState, useEffect, useRef } from 'react'
import { BadgeUnlockModal, RankUpModal } from '@/components'
import {
  useUserStore,
  useDPStore,
  useWorkoutStore,
  useMacroStore,
  useAvatarStore,
  useAchievementsStore,
  useHealthStore
} from '@/stores'
import { DP_VALUES, RANKS } from '@/stores/dpStore'
import { LABELS } from '@/design/constants'
import type { Archetype } from '@/design/constants'
import { analytics } from '@/lib/analytics'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'
import { Flame, PartyPopper, Moon, Check, X } from 'lucide-react'
import { ShareCardWrapper } from '@/components/share/ShareCardWrapper'
import { ComplianceShareCard } from '@/components/share/ComplianceShareCard'
import { shareComplianceCard } from '@/lib/shareCard'
import { getAvatarStage } from '@/lib/avatarUtils'

interface CheckInModalProps {
  isOpen: boolean
  onClose: (didCheckIn?: boolean) => void
}

interface CheckInData {
  workout: boolean
  protein: boolean
  meal: boolean
  steps: boolean
  sleep: boolean
}

const STEPS_GOAL = 10000
const SLEEP_GOAL_MINUTES = 420 // 7 hours

export function CheckInModal({ isOpen, onClose }: CheckInModalProps) {
  const updateStreak = useUserStore((state) => state.updateStreak)
  const obedienceStreak = useDPStore((state) => state.obedienceStreak)
  const { getTodayWorkout, isWorkoutCompletedToday } = useWorkoutStore()
  const { isProteinTargetHit, isCalorieTargetHit } = useMacroStore()
  const { getEffectiveSteps, getEffectiveSleep } = useHealthStore()
  const { triggerReaction } = useAvatarStore()

  const [data, setData] = useState<CheckInData>({
    workout: false,
    protein: false,
    meal: false,
    steps: false,
    sleep: false,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [earnedDP, setEarnedDP] = useState(0)
  const [dpAnimations, setDpAnimations] = useState<{ id: number; amount: number; label: string }[]>([])
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([])
  const [showBadgeModal, setShowBadgeModal] = useState(false)
  const [rankUpData, setRankUpData] = useState<{ oldRank: number; newRank: number; rankName: string } | null>(null)
  const [sharing, setSharing] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)
  const totalDP = useDPStore((s) => s.totalDP)
  const archetype = (useUserStore((s) => s.profile?.archetype) || 'bro') as Archetype
  const currentRank = useDPStore((s) => s.currentRank)
  const rankInfo = useDPStore((s) => s.getRankInfo())
  const avatarStage = getAvatarStage(currentRank) as 1 | 2 | 3 | 4 | 5

  const checkAndAwardBadges = useAchievementsStore((state) => state.checkAndAwardBadges)

  const todayWorkout = getTodayWorkout()
  const workoutCompleted = isWorkoutCompletedToday()

  // Full compliance logic:
  // - Training day (workout scheduled): 5/5 required (workout + protein + meal + steps + sleep)
  // - Recovery day (no workout): 4/4 required (protein + meal + steps + sleep)
  // This allows users on rest days to achieve shareable compliance
  const hasWorkoutScheduled = todayWorkout !== null
  const isFullCompliance = hasWorkoutScheduled
    ? (data.workout && data.protein && data.meal && data.steps && data.sleep)
    : (data.protein && data.meal && data.steps && data.sleep)

  // Milestone detection for share card
  function getMilestone(streak: number): string | undefined {
    if (streak === 7) return 'FIRST WEEK COMPLETE'
    if (streak === 30) return '30-DAY PROTOCOL'
    if (streak === 100) return '100 DAYS OF DISCIPLINE'
    return undefined
  }

  // Share handler for compliance card
  const handleShare = async () => {
    if (!cardRef.current || sharing) return
    setSharing(true)
    try {
      await shareComplianceCard(cardRef.current, obedienceStreak, totalDP, rankInfo.name)
    } finally {
      setSharing(false)
    }
  }

  // Initialize data based on current state
  useEffect(() => {
    if (isOpen) {
      const steps = getEffectiveSteps()
      const sleepMins = getEffectiveSleep()
      setData({
        workout: workoutCompleted,
        protein: isProteinTargetHit(),
        meal: isCalorieTargetHit(),
        steps: steps >= STEPS_GOAL,
        sleep: sleepMins >= SLEEP_GOAL_MINUTES,
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
    if (data.workout) total += DP_VALUES.training
    if (data.protein) total += DP_VALUES.protein
    if (data.meal) total += DP_VALUES.meal
    if (data.steps) total += DP_VALUES.steps
    if (data.sleep) total += DP_VALUES.sleep
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
      animations.push({ id: animations.length, amount: result.dpAwarded, label: 'Protein Goal' })
      if (result.rankedUp) lastRankUp = result
    }

    // Award meal compliance DP
    if (data.meal && !(todayLog && todayLog.meals > 0)) {
      const result = useDPStore.getState().awardDP('meal')
      totalDP += result.dpAwarded
      animations.push({ id: animations.length, amount: result.dpAwarded, label: 'Meal Compliance' })
      if (result.rankedUp) lastRankUp = result
    }

    // Award steps DP
    if (data.steps && !(todayLog && todayLog.steps > 0)) {
      const result = useDPStore.getState().awardDP('steps')
      totalDP += result.dpAwarded
      animations.push({ id: animations.length, amount: result.dpAwarded, label: 'Steps Goal' })
      if (result.rankedUp) lastRankUp = result
    }

    // Award sleep DP
    if (data.sleep && !(todayLog && todayLog.sleep > 0)) {
      const result = useDPStore.getState().awardDP('sleep')
      totalDP += result.dpAwarded
      animations.push({ id: animations.length, amount: result.dpAwarded, label: 'Sleep Goal' })
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
            <div className="pt-14 pb-8 px-6 text-center relative">
              <button
                onClick={() => onClose(false)}
                className="absolute right-4 top-12 p-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X size={24} />
              </button>
              <h1 className="text-2xl font-heading font-bold uppercase tracking-[0.15em] text-foreground mb-2">
                Daily Report
              </h1>
              <p className="text-[15px] text-muted-foreground">
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
                  <div
                    className="relative flex items-center gap-3 p-4 pl-5 rounded-xl border border-border overflow-hidden"
                    style={{ backgroundColor: '#161616' }}
                  >
                    {/* Muted left accent bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-muted-foreground/50" />
                    <div className="flex-1">
                      <p className="font-heading font-bold uppercase tracking-wider text-[17px] text-muted-foreground">Training</p>
                      <p className="text-[14px] text-muted-foreground/60">Recovery Day</p>
                    </div>
                    <Moon size={20} className="text-muted-foreground" />
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

                {/* Meal Compliance */}
                <ComplianceRow
                  label="Meal Compliance"
                  sublabel={data.meal ? 'Calories on target' : 'Stay within calorie goal'}
                  dp={DP_VALUES.meal}
                  checked={data.meal}
                  onChange={(v) => setData(d => ({ ...d, meal: v }))}
                />

                {/* Steps */}
                <ComplianceRow
                  label="Steps Goal"
                  sublabel={`${getEffectiveSteps().toLocaleString()} / ${STEPS_GOAL.toLocaleString()} steps`}
                  dp={DP_VALUES.steps}
                  checked={data.steps}
                  onChange={(v) => setData(d => ({ ...d, steps: v }))}
                />

                {/* Sleep */}
                <ComplianceRow
                  label="Sleep Goal"
                  sublabel={`${Math.round(getEffectiveSleep() / 60 * 10) / 10}h / 7h sleep`}
                  dp={DP_VALUES.sleep}
                  checked={data.sleep}
                  onChange={(v) => setData(d => ({ ...d, sleep: v }))}
                />

                {/* Streak Info */}
                {obedienceStreak > 0 && (
                  <div
                    data-testid="checkin-streak-display"
                    className="flex items-center justify-between p-4 rounded-xl border border-primary/30"
                    style={{ backgroundColor: '#161616' }}
                  >
                    <div className="flex items-center gap-3">
                      <Flame size={20} className="text-primary" />
                      <span className="text-[15px] text-foreground">Current Streak</span>
                    </div>
                    <span className="font-mono font-bold text-primary text-lg">{obedienceStreak} days</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer with total and submit */}
            <div className="px-6 pb-24 pt-4">
              {/* Total DP Preview */}
              <div className="text-center mb-6">
                <span className="text-foreground text-xl">Today: </span>
                <span className="text-3xl font-bold font-mono text-primary">
                  +{calculateDP()} DP
                </span>
                <span className="text-foreground text-xl"> earned</span>
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full h-14 text-lg font-heading font-bold uppercase tracking-wider"
                size="lg"
                data-testid="checkin-confirm-button"
                disabled={isSubmitting || (!data.workout && !data.protein && !data.meal && !data.steps && !data.sleep)}
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

            {/* Share button - only on full 5/5 compliance */}
            {isFullCompliance && (
              <Button
                onClick={handleShare}
                disabled={sharing}
                variant="outline"
                className="w-full mt-3 mb-3 border-primary/30 text-primary font-heading uppercase tracking-widest"
              >
                {sharing ? 'Creating Card...' : 'Share Your Protocol'}
              </Button>
            )}

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

      {/* Off-screen share card for PNG capture */}
      <ShareCardWrapper cardRef={cardRef}>
        <ComplianceShareCard
          streak={obedienceStreak}
          totalDP={totalDP}
          rankName={rankInfo.name}
          avatarStage={avatarStage}
          archetype={archetype}
          milestone={getMilestone(obedienceStreak)}
        />
      </ShareCardWrapper>
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
        'relative flex items-center gap-3 w-full p-4 pl-5 rounded-xl border text-left transition-all overflow-hidden',
        disabled ? 'cursor-default' : 'cursor-pointer',
        checked
          ? 'border-primary'
          : 'border-primary/50 hover:border-primary/70'
      )}
      style={{ backgroundColor: '#161616' }}
    >
      {/* Gold left accent bar */}
      <div className={cn(
        'absolute left-0 top-0 bottom-0 w-[3px] transition-colors',
        checked ? 'bg-primary' : 'bg-primary/50'
      )} />

      {/* Label and sublabel */}
      <div className="flex-1 min-w-0">
        <p className="font-heading font-bold uppercase tracking-wider text-[17px] text-foreground">
          {label}
        </p>
        {sublabel && (
          <p className="text-[14px] text-muted-foreground mt-0.5">{sublabel}</p>
        )}
      </div>

      {/* Checkbox circle */}
      <div
        aria-hidden="true"
        className={cn(
          'w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0',
          checked
            ? 'bg-primary border-primary shadow-[0_0_8px_rgba(212,168,83,0.4)]'
            : 'border-muted-foreground/40 bg-transparent'
        )}
      >
        {checked && (
          <Check size={16} className="text-background" strokeWidth={3} />
        )}
      </div>

      {/* DP Badge */}
      <div className={cn(
        'px-3 py-1.5 rounded-full text-[13px] font-mono font-bold transition-all flex-shrink-0',
        checked
          ? 'bg-primary/20 text-primary border border-primary/40'
          : 'bg-transparent text-muted-foreground border border-border/60'
      )}>
        +{dp} DP
      </div>
    </button>
  )
}
