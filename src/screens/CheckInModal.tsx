import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Card, BadgeUnlockModal } from '@/components'
import {
  useUserStore,
  useXPStore,
  useWorkoutStore,
  useMacroStore,
  useAvatarStore,
  useAchievementsStore
} from '@/stores'
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

    // Animate
    setSubmitted(true)
    setEarnedXP(totalXP)

    // Stagger the XP animations
    animations.forEach((anim, index) => {
      setTimeout(() => {
        setXpAnimations(prev => [...prev, anim])
      }, index * 300)
    })

    // Check for new badges after animations complete
    const badgeCheckDelay = animations.length * 300 + 1000
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
        onClick={() => onClose(false)}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-bg-secondary rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {!submitted ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Daily Standup</h2>
                <button
                  onClick={() => onClose(false)}
                  className="text-gray-400 hover:text-white"
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
                  />
                ) : (
                  <Card className="opacity-60" padding="sm">
                    <div className="flex items-center gap-3">
                      <Moon size={20} className="text-gray-400" />
                      <span className="text-gray-400">Rest Day - No workout scheduled</span>
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
                />

                {/* Calories */}
                <QuestCheckbox
                  label="Hit Calorie Target"
                  xp={XP_VALUES.CALORIES}
                  checked={data.calories}
                  onChange={(v) => setData(d => ({ ...d, calories: v }))}
                  icon={Zap}
                />

                {/* Check-in (always checked) */}
                <QuestCheckbox
                  label="Daily Check-In"
                  xp={XP_VALUES.CHECK_IN}
                  checked={data.checkIn}
                  onChange={() => {}}
                  icon={CheckCircle2}
                  disabled
                />

                {/* Perfect Day Bonus */}
                {perfectDay && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Card className="bg-accent-success/10 border-accent-success/30" padding="sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Star size={20} className="text-accent-success" />
                          <span className="text-accent-success font-semibold">Perfect Day Bonus!</span>
                        </div>
                        <span className="text-accent-success font-digital font-bold">
                          +{XP_VALUES.PERFECT_DAY} XP
                        </span>
                      </div>
                    </Card>
                  </motion.div>
                )}

                {/* Streak Bonus */}
                {profile?.currentStreak !== undefined && (
                  <Card className="bg-accent-warning/10 border-accent-warning/20" padding="sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Flame size={20} className="text-accent-warning" />
                        <span>Streak Bonus ({(profile?.currentStreak || 0) + 1} days)</span>
                      </div>
                      <span className="text-accent-warning font-digital font-bold">
                        +{streakBonus} XP
                      </span>
                    </div>
                  </Card>
                )}
              </div>

              {/* Total XP Preview */}
              <div className="bg-bg-card rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total XP</span>
                  <span className="text-2xl font-bold font-digital text-accent-primary">
                    +{calculateXP()} XP
                  </span>
                </div>
              </div>

              <Button onClick={handleSubmit} fullWidth size="lg">
                Ship It
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
                <PartyPopper size={56} className="mx-auto text-accent-success" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold mb-2"
              >
                Deployed successfully.
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
                      className="flex items-center justify-between bg-bg-card rounded-lg px-4 py-2"
                    >
                      <span className="text-gray-300">{anim.label}</span>
                      <span className="text-accent-success font-digital font-bold">
                        +{anim.amount} XP
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
                className="bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 rounded-xl p-6 mb-6"
              >
                <p className="text-gray-400 mb-1">Total Earned</p>
                <p className="text-4xl font-bold font-digital text-glow-cyan">
                  +{earnedXP} XP
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Pending until Sunday release
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
  disabled = false
}: {
  label: string
  xp: number
  checked: boolean
  onChange: (v: boolean) => void
  icon: LucideIcon
  disabled?: boolean
}) {
  return (
    <Card
      onClick={disabled ? undefined : () => onChange(!checked)}
      hover={!disabled}
      className={`${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${
        checked ? 'border-accent-success/50' : ''
      }`}
      padding="sm"
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
            checked
              ? 'bg-accent-success border-accent-success'
              : 'border-gray-600'
          }`}
        >
          {checked && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <Check size={14} className="text-white" />
            </motion.div>
          )}
        </div>
        <Icon size={20} className={checked ? 'text-accent-success' : 'text-gray-400'} />
        <span className="flex-1">{label}</span>
        <span className={`font-digital font-bold ${checked ? 'text-accent-success' : 'text-gray-500'}`}>
          +{xp} XP
        </span>
      </div>
    </Card>
  )
}
