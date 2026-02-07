import { useState, useEffect } from 'react'
import { BadgeUnlockModal } from '@/components'
import {
  useUserStore,
  useXPStore,
  useWorkoutStore,
  useMacroStore,
  useAvatarStore,
  useAchievementsStore
} from '@/stores'
import { LABELS } from '@/design/constants'
import { analytics } from '@/lib/analytics'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'
import { Dumbbell, Beef, Zap, CheckCircle2, Star, Flame, PartyPopper, Moon, X, Check, LucideIcon } from 'lucide-react'

interface CheckInModalProps {
  isOpen: boolean
  onClose: (didCheckIn?: boolean) => void
}

interface CheckInData {
  workout: boolean
  protein: boolean
  calories: boolean
  checkIn: boolean
}

export function CheckInModal({ isOpen, onClose }: CheckInModalProps) {
  const profile = useUserStore((state) => state.profile)
  const updateStreak = useUserStore((state) => state.updateStreak)
  const { logDailyXP, XP_VALUES } = useXPStore()
  const { getTodayWorkout, isWorkoutCompletedToday } = useWorkoutStore()
  const { isProteinTargetHit, isCalorieTargetHit } = useMacroStore()
  const { triggerReaction, updateEvolutionStage } = useAvatarStore()
  const currentLevel = useXPStore((state) => state.currentLevel)

  const [data, setData] = useState<CheckInData>({
    workout: false,
    protein: false,
    calories: false,
    checkIn: true
  })

  const [submitted, setSubmitted] = useState(false)
  const [earnedXP, setEarnedXP] = useState(0)
  const [xpAnimations, setXpAnimations] = useState<{ id: number; amount: number; label: string }[]>([])
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([])
  const [showBadgeModal, setShowBadgeModal] = useState(false)

  const checkAndAwardBadges = useAchievementsStore((state) => state.checkAndAwardBadges)

  const todayWorkout = getTodayWorkout()
  const workoutCompleted = isWorkoutCompletedToday()

  // Initialize data based on current state
  useEffect(() => {
    if (isOpen) {
      setData({
        workout: workoutCompleted,
        protein: isProteinTargetHit(),
        calories: isCalorieTargetHit(),
        checkIn: true
      })
      setSubmitted(false)
      setEarnedXP(0)
      setXpAnimations([])
      setUnlockedBadges([])
      setShowBadgeModal(false)
    }
  }, [isOpen])

  const streakBonus = ((profile?.currentStreak || 0) + 1) * XP_VALUES.STREAK_PER_DAY
  const perfectDay = data.protein && data.calories

  const calculateXP = () => {
    let total = 0
    if (todayWorkout && data.workout) total += XP_VALUES.WORKOUT
    if (data.protein) total += XP_VALUES.PROTEIN
    if (data.calories) total += XP_VALUES.CALORIES
    if (data.checkIn) total += XP_VALUES.CHECK_IN
    if (perfectDay) total += XP_VALUES.PERFECT_DAY
    total += streakBonus
    return total
  }

  const handleSubmit = () => {
    const totalXP = calculateXP()
    const animations: { id: number; amount: number; label: string }[] = []

    // Build animation sequence
    let delay = 0
    if (todayWorkout && data.workout) {
      animations.push({ id: delay++, amount: XP_VALUES.WORKOUT, label: 'Workout' })
    }
    if (data.protein) {
      animations.push({ id: delay++, amount: XP_VALUES.PROTEIN, label: 'Protein' })
    }
    if (data.calories) {
      animations.push({ id: delay++, amount: XP_VALUES.CALORIES, label: 'Calories' })
    }
    if (data.checkIn) {
      animations.push({ id: delay++, amount: XP_VALUES.CHECK_IN, label: 'Check-In' })
    }
    if (perfectDay) {
      animations.push({ id: delay++, amount: XP_VALUES.PERFECT_DAY, label: 'Perfect Day!' })
    }
    if (streakBonus > 0) {
      animations.push({ id: delay++, amount: streakBonus, label: 'Streak Bonus' })
    }

    // Log the XP
    logDailyXP({
      date: new Date().toISOString().split('T')[0],
      workout: todayWorkout ? data.workout : false,
      protein: data.protein,
      calories: data.calories,
      checkIn: data.checkIn,
      perfectDay,
      streakBonus
    })

    // Update streak
    updateStreak(true)

    // Trigger avatar reaction
    triggerReaction('checkIn')

    // Check for evolution
    updateEvolutionStage(currentLevel)

    // Track analytics
    analytics.checkInCompleted((profile?.currentStreak || 0) + 1)

    setSubmitted(true)
    setEarnedXP(totalXP)
    setXpAnimations(animations)

    // Check for new badges after a delay
    const badgeCheckDelay = animations.length * 150 + 800
    setTimeout(() => {
      const newBadges = checkAndAwardBadges()
      if (newBadges.length > 0) {
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
        className="w-full max-w-md bg-card p-6 max-h-[90vh] overflow-y-auto rounded-t-xl sm:rounded-xl border border-border animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
        data-testid="checkin-modal"
      >
        {!submitted ? (
          <>
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
                  xp={XP_VALUES.WORKOUT}
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
                xp={XP_VALUES.PROTEIN}
                checked={data.protein}
                onChange={(v) => setData(d => ({ ...d, protein: v }))}
                icon={Beef}
                xpLabel={LABELS.xp}
              />

              {/* Calories */}
              <QuestCheckbox
                label="Hit Calorie Target"
                xp={XP_VALUES.CALORIES}
                checked={data.calories}
                onChange={(v) => setData(d => ({ ...d, calories: v }))}
                icon={Zap}
                xpLabel={LABELS.xp}
              />

              {/* Check-in (always checked) */}
              <QuestCheckbox
                label={LABELS.checkIn}
                xp={XP_VALUES.CHECK_IN}
                checked={data.checkIn}
                onChange={() => {}}
                icon={CheckCircle2}
                disabled
                xpLabel={LABELS.xp}
              />

              {/* Perfect Day Bonus */}
              {perfectDay && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/30 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-3">
                    <Star size={20} className="text-success" />
                    <span className="text-success font-semibold text-sm">
                      Full Compliance Bonus!
                    </span>
                  </div>
                  <span className="text-success font-mono font-bold">
                    +{XP_VALUES.PERFECT_DAY} {LABELS.xp}
                  </span>
                </div>
              )}

              {/* Streak Bonus */}
              {profile?.currentStreak !== undefined && (
                <div data-testid="checkin-streak-display" className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <div className="flex items-center gap-3">
                    <Flame size={20} className="text-warning" />
                    <span>Obedience Bonus ({(profile?.currentStreak || 0) + 1} days)</span>
                  </div>
                  <span className="text-warning font-mono font-bold">
                    +{streakBonus} {LABELS.xp}
                  </span>
                </div>
              )}
            </div>

            {/* Total XP Preview */}
            <div className="bg-muted p-4 mb-6 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total {LABELS.xp}</span>
                <span className="text-2xl font-bold font-mono text-primary">
                  +{calculateXP()} {LABELS.xp}
                </span>
              </div>
            </div>

            <Button onClick={handleSubmit} className="w-full" size="lg" data-testid="checkin-confirm-button">
              Submit Report
            </Button>
          </>
        ) : (
          <div className="text-center py-8">
            {/* Success */}
            <div className="mb-4 animate-in zoom-in-0 duration-500">
              <PartyPopper size={56} className="mx-auto text-primary" />
            </div>

            <h2 className="text-2xl font-bold mb-2 animate-in fade-in slide-in-from-bottom-4 duration-300 delay-200">
              Report Accepted.
            </h2>

            {/* XP Breakdown */}
            <div className="space-y-2 my-6 relative">
              {xpAnimations.map((anim, index) => (
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
              style={{ animationDelay: `${xpAnimations.length * 150 + 300}ms` }}
            >
              <p className="text-muted-foreground mb-1">Total Earned</p>
              <p className="text-4xl font-bold font-mono text-primary">
                +{earnedXP} {LABELS.xp}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Pending until Sunday ritual
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
