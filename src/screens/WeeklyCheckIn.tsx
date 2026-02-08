import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Utensils,
  Dumbbell,
  Moon,
  Heart,
  MessageSquare,
  ClipboardCheck,
  Loader2,
} from 'lucide-react'
import { useWeeklyCheckins, getCurrentMonday } from '@/hooks/useWeeklyCheckins'
import { useUserStore } from '@/stores/userStore'
import { useMacroStore } from '@/stores/macroStore'
import { useWorkoutStore } from '@/stores/workoutStore'
import { getLocalDateString } from '@/lib/dateUtils'
import { toast } from '@/stores/toastStore'
import { friendlyError } from '@/lib/errors'
import { cn } from '@/lib/cn'
import type { WeeklyCheckin } from '@/lib/database.types'

// ==========================================
// Auto-populated data computation (CHECK-02)
// Computed at submission time, not render time
// ==========================================

interface CheckInAutoData {
  auto_weight_current: number | null
  auto_weight_weekly_avg: number | null
  auto_weight_change: number | null
  auto_step_avg: number | null
  auto_macro_hit_rate: number | null
  auto_cardio_sessions: number | null
  auto_workouts_completed: number | null
}

function computeAutoData(): CheckInAutoData {
  const userState = useUserStore.getState()
  const macroState = useMacroStore.getState()
  const workoutState = useWorkoutStore.getState()

  const weightHistory = userState.weightHistory
  const today = getLocalDateString()

  // --- Latest weight ---
  const sorted = [...weightHistory].sort((a, b) => a.date.localeCompare(b.date))
  const latestWeight = sorted.length > 0
    ? sorted[sorted.length - 1].weight
    : null

  // --- 7-day weight average ---
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysAgoStr = getLocalDateString(sevenDaysAgo)

  const recentWeights = sorted.filter(w => w.date >= sevenDaysAgoStr && w.date <= today)
  const weeklyAvg = recentWeights.length > 0
    ? recentWeights.reduce((sum, w) => sum + w.weight, 0) / recentWeights.length
    : null

  // --- Weight change (current week avg vs prior week avg) ---
  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
  const fourteenDaysAgoStr = getLocalDateString(fourteenDaysAgo)

  const priorWeekWeights = sorted.filter(
    w => w.date >= fourteenDaysAgoStr && w.date < sevenDaysAgoStr
  )
  const priorWeekAvg = priorWeekWeights.length > 0
    ? priorWeekWeights.reduce((sum, w) => sum + w.weight, 0) / priorWeekWeights.length
    : null

  const weightChange = (weeklyAvg !== null && priorWeekAvg !== null)
    ? Math.round((weeklyAvg - priorWeekAvg) * 10) / 10
    : null

  // --- Macro hit rate (% of last 7 days hitting protein + calories within 10%) ---
  const dailyLogs = macroState.dailyLogs
  const targets = macroState.targets
  let macroHitRate: number | null = null

  if (targets) {
    const recentLogs = dailyLogs.filter(
      l => l.date >= sevenDaysAgoStr && l.date <= today
    )
    if (recentLogs.length > 0) {
      const hitDays = recentLogs.filter(log => {
        const logTargets = log.targetSnapshot || targets
        const proteinHit = log.protein >= logTargets.protein
        const caloriesWithin10 = Math.abs(log.calories - logTargets.calories) <= logTargets.calories * 0.1
        return proteinHit && caloriesWithin10
      }).length
      macroHitRate = Math.round((hitDays / recentLogs.length) * 100)
    }
  }

  // --- Workouts completed in last 7 days ---
  const workoutLogs = workoutState.workoutLogs
  const recentWorkouts = workoutLogs.filter(
    w => w.completed && w.date >= sevenDaysAgoStr && w.date <= today
  )

  return {
    auto_weight_current: latestWeight,
    auto_weight_weekly_avg: weeklyAvg ? Math.round(weeklyAvg * 10) / 10 : null,
    auto_weight_change: weightChange,
    auto_step_avg: null, // App doesn't track steps
    auto_macro_hit_rate: macroHitRate,
    auto_cardio_sessions: null, // App doesn't distinguish cardio
    auto_workouts_completed: recentWorkouts.length,
  }
}

// ==========================================
// Section definitions
// ==========================================

interface SectionDef {
  id: string
  label: string
  icon: React.ElementType
}

const SECTIONS: SectionDef[] = [
  { id: 'nutrition', label: 'Nutrition', icon: Utensils },
  { id: 'training', label: 'Training', icon: Dumbbell },
  { id: 'lifestyle', label: 'Lifestyle', icon: Moon },
  { id: 'health', label: 'Health', icon: Heart },
  { id: 'feedback', label: 'Open Feedback', icon: MessageSquare },
]

// ==========================================
// Button group component for 1-5 scale
// ==========================================

function ScaleButtonGroup({
  value,
  onChange,
  labels,
}: {
  value: number | null
  onChange: (val: number) => void
  labels?: string[]
}) {
  const defaultLabels = ['1', '2', '3', '4', '5']
  const displayLabels = labels || defaultLabels
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n, i) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={cn(
            'flex-1 py-2 rounded-md text-sm font-medium transition-colors border',
            value === n
              ? 'bg-secondary text-secondary-foreground border-secondary'
              : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/80'
          )}
        >
          {displayLabels[i]}
        </button>
      ))}
    </div>
  )
}

// ==========================================
// Form state types
// ==========================================

interface NutritionFields {
  water_intake: string
  caffeine_intake: string
  hunger_level: number | null
  slip_ups: string
  refeed_date: string
  digestion: string
}

interface TrainingFields {
  training_progress: string
  training_feedback: string
  recovery_soreness: string
}

interface LifestyleFields {
  sleep_quality: number | null
  sleep_hours: string
  stress_level: number | null
  stressors: string
  mental_health: string
}

interface HealthFields {
  injuries: string
  cycle_status: string
  side_effects: string
  bloodwork_date: string
}

interface FeedbackFields {
  open_feedback: string
}

// ==========================================
// Main component
// ==========================================

export function WeeklyCheckIn() {
  const navigate = useNavigate()
  const { submitCheckin } = useWeeklyCheckins()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Section expansion state (all expanded by default)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    nutrition: true,
    training: true,
    lifestyle: true,
    health: true,
    feedback: true,
  })

  // Form state grouped by section
  const [nutrition, setNutrition] = useState<NutritionFields>({
    water_intake: '',
    caffeine_intake: '',
    hunger_level: null,
    slip_ups: '',
    refeed_date: '',
    digestion: '',
  })

  const [training, setTraining] = useState<TrainingFields>({
    training_progress: '',
    training_feedback: '',
    recovery_soreness: '',
  })

  const [lifestyle, setLifestyle] = useState<LifestyleFields>({
    sleep_quality: null,
    sleep_hours: '',
    stress_level: null,
    stressors: '',
    mental_health: '',
  })

  const [health, setHealth] = useState<HealthFields>({
    injuries: '',
    cycle_status: '',
    side_effects: '',
    bloodwork_date: '',
  })

  const [feedback, setFeedback] = useState<FeedbackFields>({
    open_feedback: '',
  })

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Format the week of Monday for display
  const mondayStr = getCurrentMonday()
  const mondayDate = new Date(mondayStr + 'T00:00:00')
  const weekDisplay = mondayDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  // Validate that at least one field has content
  function hasAnyContent(): boolean {
    const allText = [
      nutrition.water_intake, nutrition.caffeine_intake, nutrition.slip_ups,
      nutrition.refeed_date, nutrition.digestion,
      training.training_progress, training.training_feedback, training.recovery_soreness,
      lifestyle.sleep_hours, lifestyle.stressors, lifestyle.mental_health,
      health.injuries, health.cycle_status, health.side_effects, health.bloodwork_date,
      feedback.open_feedback,
    ]
    const hasText = allText.some(v => v.trim().length > 0)
    const hasScale = [nutrition.hunger_level, lifestyle.sleep_quality, lifestyle.stress_level]
      .some(v => v !== null)
    return hasText || hasScale
  }

  async function handleSubmit() {
    if (!hasAnyContent()) {
      toast.warning('Please fill in at least one field before submitting.')
      return
    }

    setIsSubmitting(true)

    try {
      // Build form data (only include non-empty values)
      const formData: Partial<WeeklyCheckin> = {
        water_intake: nutrition.water_intake.trim() || null,
        caffeine_intake: nutrition.caffeine_intake.trim() || null,
        hunger_level: nutrition.hunger_level,
        slip_ups: nutrition.slip_ups.trim() || null,
        refeed_date: nutrition.refeed_date || null,
        digestion: nutrition.digestion.trim() || null,
        training_progress: training.training_progress.trim() || null,
        training_feedback: training.training_feedback.trim() || null,
        recovery_soreness: training.recovery_soreness.trim() || null,
        sleep_quality: lifestyle.sleep_quality,
        sleep_hours: lifestyle.sleep_hours ? parseFloat(lifestyle.sleep_hours) : null,
        stress_level: lifestyle.stress_level,
        stressors: lifestyle.stressors.trim() || null,
        mental_health: lifestyle.mental_health.trim() || null,
        injuries: health.injuries.trim() || null,
        cycle_status: health.cycle_status.trim() || null,
        side_effects: health.side_effects.trim() || null,
        bloodwork_date: health.bloodwork_date || null,
        open_feedback: feedback.open_feedback.trim() || null,
      }

      // Compute auto-populated data at submission time (snapshot)
      const autoData = computeAutoData()

      const { error } = await submitCheckin(formData, autoData)

      if (error) {
        toast.error(friendlyError('submit your check-in', new Error(error)))
        return
      }

      toast.success('Check-in submitted!')
      navigate('/')
    } catch (err) {
      toast.error(friendlyError('submit your check-in', err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-card pt-8 pb-6 px-5">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate('/')}
            className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-2">
            <ClipboardCheck size={24} className="text-secondary" />
            <h1 className="text-xl font-bold">Weekly Check-in</h1>
          </div>
        </div>
        <p className="text-muted-foreground text-sm ml-9">
          Week of {weekDisplay}
        </p>
      </div>

      <div className="px-5 space-y-4 mt-4">
        {SECTIONS.map((section) => {
          const isExpanded = expandedSections[section.id]
          const SectionIcon = section.icon

          return (
            <Card key={section.id} className="py-0 overflow-hidden">
              {/* Section header */}
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <SectionIcon size={20} className="text-secondary" />
                <span className="flex-1 font-semibold text-sm uppercase tracking-wide">
                  {section.label}
                </span>
                {isExpanded ? (
                  <ChevronDown size={18} className="text-muted-foreground" />
                ) : (
                  <ChevronRight size={18} className="text-muted-foreground" />
                )}
              </button>

              {/* Section content */}
              {isExpanded && (
                <CardContent className="pb-4 pt-0 space-y-4">
                  {section.id === 'nutrition' && (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="water_intake">Water Intake</Label>
                        <Textarea
                          id="water_intake"
                          placeholder="e.g. 1 gallon daily"
                          value={nutrition.water_intake}
                          onChange={e => setNutrition(p => ({ ...p, water_intake: e.target.value }))}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="caffeine_intake">Caffeine Intake</Label>
                        <Textarea
                          id="caffeine_intake"
                          placeholder="e.g. 2 cups coffee"
                          value={nutrition.caffeine_intake}
                          onChange={e => setNutrition(p => ({ ...p, caffeine_intake: e.target.value }))}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Hunger Level</Label>
                        <ScaleButtonGroup
                          value={nutrition.hunger_level}
                          onChange={val => setNutrition(p => ({ ...p, hunger_level: val }))}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground px-1">
                          <span>Not hungry</span>
                          <span>Very hungry</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="slip_ups">Slip-ups</Label>
                        <Textarea
                          id="slip_ups"
                          placeholder="Any dietary slip-ups this week?"
                          value={nutrition.slip_ups}
                          onChange={e => setNutrition(p => ({ ...p, slip_ups: e.target.value }))}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="refeed_date">Refeed / Diet Break Date</Label>
                        <Input
                          id="refeed_date"
                          type="date"
                          value={nutrition.refeed_date}
                          onChange={e => setNutrition(p => ({ ...p, refeed_date: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="digestion">Digestion</Label>
                        <Textarea
                          id="digestion"
                          placeholder="How was your digestion?"
                          value={nutrition.digestion}
                          onChange={e => setNutrition(p => ({ ...p, digestion: e.target.value }))}
                          rows={2}
                        />
                      </div>
                    </>
                  )}

                  {section.id === 'training' && (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="training_progress">Training Progress</Label>
                        <Textarea
                          id="training_progress"
                          placeholder="Strength/progress notes"
                          value={training.training_progress}
                          onChange={e => setTraining(p => ({ ...p, training_progress: e.target.value }))}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="training_feedback">Training Feedback</Label>
                        <Textarea
                          id="training_feedback"
                          placeholder="How did training feel this week?"
                          value={training.training_feedback}
                          onChange={e => setTraining(p => ({ ...p, training_feedback: e.target.value }))}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="recovery_soreness">Recovery / Soreness</Label>
                        <Textarea
                          id="recovery_soreness"
                          placeholder="Recovery status, any soreness?"
                          value={training.recovery_soreness}
                          onChange={e => setTraining(p => ({ ...p, recovery_soreness: e.target.value }))}
                          rows={2}
                        />
                      </div>
                    </>
                  )}

                  {section.id === 'lifestyle' && (
                    <>
                      <div className="space-y-1.5">
                        <Label>Sleep Quality</Label>
                        <ScaleButtonGroup
                          value={lifestyle.sleep_quality}
                          onChange={val => setLifestyle(p => ({ ...p, sleep_quality: val }))}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground px-1">
                          <span>Very poor</span>
                          <span>Excellent</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="sleep_hours">Sleep Hours</Label>
                        <Input
                          id="sleep_hours"
                          type="number"
                          step="0.5"
                          min="0"
                          max="24"
                          placeholder="7.5"
                          value={lifestyle.sleep_hours}
                          onChange={e => setLifestyle(p => ({ ...p, sleep_hours: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Stress Level</Label>
                        <ScaleButtonGroup
                          value={lifestyle.stress_level}
                          onChange={val => setLifestyle(p => ({ ...p, stress_level: val }))}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground px-1">
                          <span>Low stress</span>
                          <span>High stress</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="stressors">Stressors</Label>
                        <Textarea
                          id="stressors"
                          placeholder="What's causing stress?"
                          value={lifestyle.stressors}
                          onChange={e => setLifestyle(p => ({ ...p, stressors: e.target.value }))}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="mental_health">Mental Health</Label>
                        <Textarea
                          id="mental_health"
                          placeholder="Mood, anxiety, etc."
                          value={lifestyle.mental_health}
                          onChange={e => setLifestyle(p => ({ ...p, mental_health: e.target.value }))}
                          rows={2}
                        />
                      </div>
                    </>
                  )}

                  {section.id === 'health' && (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="injuries">Injuries</Label>
                        <Textarea
                          id="injuries"
                          placeholder="Any injuries or pain?"
                          value={health.injuries}
                          onChange={e => setHealth(p => ({ ...p, injuries: e.target.value }))}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="cycle_status">Cycle Status</Label>
                        <Textarea
                          id="cycle_status"
                          placeholder="Menstrual cycle notes (optional)"
                          value={health.cycle_status}
                          onChange={e => setHealth(p => ({ ...p, cycle_status: e.target.value }))}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="side_effects">Side Effects</Label>
                        <Textarea
                          id="side_effects"
                          placeholder="Supplement/medication side effects?"
                          value={health.side_effects}
                          onChange={e => setHealth(p => ({ ...p, side_effects: e.target.value }))}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="bloodwork_date">Bloodwork Date</Label>
                        <Input
                          id="bloodwork_date"
                          type="date"
                          value={health.bloodwork_date}
                          onChange={e => setHealth(p => ({ ...p, bloodwork_date: e.target.value }))}
                        />
                      </div>
                    </>
                  )}

                  {section.id === 'feedback' && (
                    <div className="space-y-1.5">
                      <Label htmlFor="open_feedback">Anything Else</Label>
                      <Textarea
                        id="open_feedback"
                        placeholder="Anything else you want your coach to know?"
                        value={feedback.open_feedback}
                        onChange={e => setFeedback(p => ({ ...p, open_feedback: e.target.value }))}
                        rows={4}
                      />
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}

        {/* Submit button */}
        <div className="pt-2 pb-6">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={20} className="animate-spin" />
                Submitting...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <ClipboardCheck size={20} />
                Submit Check-in
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
