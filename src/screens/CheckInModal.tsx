import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Button, Card, BadgeUnlockModal } from '@/components'
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

    // Animate - set all animations at once to avoid multiple state updates
    // Framer-motion handles the stagger via transition.delay
    setSubmitted(true)
    setEarnedXP(totalXP)
    setXpAnimations(animations)

    // Check for new badges after animations complete
    // Use reduced delay since framer-motion stagger (0.15s) is faster than our old JS stagger (0.3s)
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
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Daily check-in"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
        onClick={() => onClose(false)}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-surface p-6 max-h-[90vh] overflow-y-auto rounded-t-lg sm:rounded-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {!submitted ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold font-heading uppercase tracking-wide">
                  {LABELS.checkIn}
                </h2>
                <button
                  onClick={() => onClose(false)}
                  aria-label="Close check-in"
                  className="text-text-secondary hover:text-text-primary"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 mb-6">
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
                  <Card className="opacity-60" padding="sm">
                    <div className="flex items-center gap-3">
                      <Moon size={20} className="text-text-secondary" />
                      <span className="text-text-secondary">
                        Recovery Day - No training scheduled
                      </span>
                    </div>
                  </Card>
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
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Card className="bg-success/10 border-success/30" padding="sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Star size={20} className="text-success" />
                          <span className="text-success font-semibold font-heading uppercase tracking-wide text-sm">
                            Full Compliance Bonus!
                          </span>
                        </div>
                        <span className="text-success font-mono font-bold">
                          +{XP_VALUES.PERFECT_DAY} {LABELS.xp}
                        </span>
                      </div>
                    </Card>
                  </motion.div>
                )}

                {/* Streak Bonus */}
                {profile?.currentStreak !== undefined && (
                  <Card className="bg-warning/10 border-warning/20" padding="sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Flame size={20} className="text-warning" />
                        <span>Obedience Bonus ({(profile?.currentStreak || 0) + 1} days)</span>
                      </div>
                      <span className="text-warning font-mono font-bold">
                        +{streakBonus} {LABELS.xp}
                      </span>
                    </div>
                  </Card>
                )}
              </div>

              {/* Total XP Preview */}
              <div className="bg-surface-elevated p-4 mb-6 rounded">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Total {LABELS.xp}</span>
                  <span className="text-2xl font-bold font-mono text-primary">
                    +{calculateXP()} {LABELS.xp}
                  </span>
                </div>
              </div>

              <Button onClick={handleSubmit} fullWidth size="lg">
                Submit Report
              </Button>
            </>
          ) : (
            <div className="text-center py-8">
              {/* Success Animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="mb-4"
              >
                <PartyPopper size={56} className="mx-auto text-primary" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold mb-2 font-heading uppercase tracking-wide"
              >
                Report Accepted.
              </motion.h2>

              {/* XP Breakdown Animation */}
              <div className="space-y-2 my-6 relative">
                <AnimatePresence>
                  {xpAnimations.map((anim, index) => (
                    <motion.div
                      key={anim.id}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.15 }}
                      className="flex items-center justify-between bg-surface-elevated px-4 py-2 rounded"
                    >
                      <span className="text-text-primary">{anim.label}</span>
                      <span className="text-success font-mono font-bold">
                        +{anim.amount} {LABELS.xp}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Total with animation */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: xpAnimations.length * 0.15 + 0.3, type: 'spring' }}
                className="p-6 mb-6 bg-primary-muted rounded border border-primary/30"
              >
                <p className="text-text-secondary mb-1">Total Earned</p>
                <p className="text-4xl font-bold font-mono text-primary">
                  +{earnedXP} {LABELS.xp}
                </p>
                <p className="text-sm text-text-secondary mt-2">
                  Pending until Sunday ritual
                </p>
              </motion.div>

              <Button onClick={() => onClose(true)} variant="ghost" fullWidth>
                Continue
              </Button>
            </div>
          )}
        </motion.div>

        {/* Badge Unlock Modal */}
        {showBadgeModal && unlockedBadges.length > 0 && (
          <BadgeUnlockModal
            badgeIds={unlockedBadges}
            onClose={() => setShowBadgeModal(false)}
          />
        )}
      </motion.div>
    </AnimatePresence>
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
    <Card
      onClick={disabled ? undefined : () => onChange(!checked)}
      hover={!disabled}
      role="checkbox"
      aria-checked={checked}
      aria-label={`${label}: ${xp} ${xpLabel}`}
      aria-disabled={disabled}
      className={`${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${
        checked ? 'border-success/50' : ''
      }`}
      padding="sm"
    >
      <div className="flex items-center gap-3">
        <div
          aria-hidden="true"
          className={`w-6 h-6 border-2 flex items-center justify-center transition-colors rounded ${
            checked
              ? 'bg-success border-success'
              : 'border-border'
          }`}
        >
          {checked && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <Check size={14} className="text-text-on-primary" />
            </motion.div>
          )}
        </div>
        <Icon size={20} className={checked ? 'text-success' : 'text-text-secondary'} />
        <span className="flex-1">{label}</span>
        <span className={`font-mono font-bold ${checked ? 'text-success' : 'text-text-secondary'}`}>
          +{xp} {xpLabel}
        </span>
      </div>
    </Card>
  )
}
