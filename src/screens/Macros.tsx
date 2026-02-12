import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ProgressBar, MealBuilder, EmptyState, FoodSearch } from '@/components'
import { useMacroStore, useUserStore, MacroTargets, MealPlan, SavedMeal, LoggedMeal, Gender, MealIngredient, RecentFood, toast } from '@/stores'
import { Beef, Zap, UtensilsCrossed, Check, ChevronDown, Flame, Scale, TrendingUp, RefreshCw, ShieldCheck } from 'lucide-react'
import { scheduleSync } from '@/lib/sync'
import { analytics } from '@/lib/analytics'
import { cn } from '@/lib/cn'
import { LABELS } from '@/design/constants'

type TabType = 'daily' | 'log' | 'meals' | 'calculator'

type MacroProgress = {
  protein: { current: number; target: number; percentage: number }
  calories: { current: number; target: number; percentage: number }
  carbs: { current: number; target: number; percentage: number }
  fats: { current: number; target: number; percentage: number }
} | null

export function Macros() {
  const [activeTab, setActiveTab] = useState<TabType>('daily')
  const {
    targets,
    mealPlan,
    getTodayProgress,
    logQuickMacros,
    logNamedMeal,
    addRecentFood,
    recentFoods,
    saveMeal,
    deleteSavedMeal,
    getSavedMeals,
    getTodayMeals,
    deleteLoggedMeal,
    isProteinTargetHit,
    isCalorieTargetHit,
    calculateMacros,
    activityLevel,
    setBy,
  } = useMacroStore()

  const profile = useUserStore((state) => state.profile)
  const progress = getTodayProgress()
  const savedMeals = getSavedMeals()
  const todayMeals = getTodayMeals()

  const tabs: { id: TabType; label: string }[] = [
    { id: 'daily', label: 'Daily' },
    { id: 'log', label: 'Meals' },
    { id: 'meals', label: 'Plan' },
    { id: 'calculator', label: 'Calc' }
  ]

  return (
    <div data-testid="macros-screen" className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-card pt-8 pb-4 px-5">
        <div className="flex items-center gap-2 mb-4">
          <h1 className="text-2xl font-bold">Macros</h1>
          {setBy === 'coach' && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <ShieldCheck size={12} />
              Set by {LABELS.coach}
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2" role="tablist" aria-label="Macro views">
          {tabs.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-6" data-sentry-mask>
        {activeTab === 'daily' && (
          <DailyView
            progress={progress}
            targets={targets}
            proteinHit={isProteinTargetHit()}
            caloriesHit={isCalorieTargetHit()}
            onLogMacros={(macros) => {
              logQuickMacros(macros)
              scheduleSync()
            }}
            onLogNamedMeal={(name, macros) => {
              logNamedMeal(name, macros)
              scheduleSync()
            }}
            onAddRecentFood={addRecentFood}
            recentFoods={recentFoods}
            todayMeals={todayMeals}
            onDeleteMeal={deleteLoggedMeal}
            onSetupTargets={() => setActiveTab('calculator')}
          />
        )}

        {activeTab === 'log' && (
          <LogMealView
            savedMeals={savedMeals}
            onLogMeal={(name, macros) => {
              logNamedMeal(name, macros)
              scheduleSync()
            }}
            onSaveMeal={saveMeal}
            onDeleteSavedMeal={deleteSavedMeal}
          />
        )}

        {activeTab === 'meals' && (
          <MealsView mealPlan={mealPlan} />
        )}

        {activeTab === 'calculator' && (
          setBy === 'coach' ? (
            <Card className="py-0 border-primary/20">
              <CardContent className="text-center py-8">
                <ShieldCheck size={40} className="mx-auto mb-4 text-primary" />
                <p className="text-lg font-bold mb-2">Macros Set by {LABELS.coach}</p>
                <p className="text-muted-foreground text-sm mb-6">
                  Your macro targets are managed by your {LABELS.coach.toLowerCase()}. Contact them to request changes.
                </p>
                {targets && (
                  <div className="grid grid-cols-2 gap-4 text-left max-w-xs mx-auto">
                    <div>
                      <p className="text-xs text-muted-foreground">Calories</p>
                      <p className="text-2xl font-bold font-digital text-primary">{targets.calories}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Protein</p>
                      <p className="text-2xl font-bold font-digital text-primary">{targets.protein}g</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Carbs</p>
                      <p className="text-lg font-digital">{targets.carbs}g</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Fats</p>
                      <p className="text-lg font-digital">{targets.fats}g</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <CalculatorView
              currentWeight={profile?.weight || 150}
              currentHeight={profile?.height || 70}
              currentAge={profile?.age || 30}
              currentGender={profile?.gender || 'male'}
              currentGoal={profile?.goal || 'maintain'}
              currentActivity={activityLevel}
              targets={targets}
              onCalculate={calculateMacros}
            />
          )
        )}
      </div>
    </div>
  )
}

function DailyView({
  progress,
  targets,
  proteinHit,
  caloriesHit,
  onLogMacros,
  onLogNamedMeal,
  onAddRecentFood,
  recentFoods,
  todayMeals,
  onDeleteMeal,
  onSetupTargets
}: {
  progress: MacroProgress
  targets: MacroTargets | null
  proteinHit: boolean
  caloriesHit: boolean
  onLogMacros: (macros: { protein?: number; calories?: number; carbs?: number; fats?: number }) => void
  onLogNamedMeal: (name: string, macros: { protein: number; carbs: number; fats: number; calories: number }) => void
  onAddRecentFood: (food: RecentFood) => void
  recentFoods: RecentFood[]
  todayMeals: LoggedMeal[]
  onDeleteMeal: (id: string) => void
  onSetupTargets: () => void
}) {
  const [quickLog, setQuickLog] = useState({ protein: '', calories: '' })
  const [showMeals, setShowMeals] = useState(false)
  const [loggedRecentId, setLoggedRecentId] = useState<string | null>(null)

  // Track protein/calorie target hit once per session
  const proteinTracked = useRef(false)
  const caloriesTracked = useRef(false)

  useEffect(() => {
    if (proteinHit && !proteinTracked.current) {
      analytics.proteinTargetHit()
      proteinTracked.current = true
    }
  }, [proteinHit])

  useEffect(() => {
    if (caloriesHit && !caloriesTracked.current) {
      analytics.calorieTargetHit()
      caloriesTracked.current = true
    }
  }, [caloriesHit])

  const [quickLogSuccess, setQuickLogSuccess] = useState(false)

  if (!targets || !progress) {
    return (
      <EmptyState
        icon={UtensilsCrossed}
        title="No macro targets set"
        description="Set up your daily nutrition targets to start tracking calories and protein."
        action={{ label: "Set Up Targets", onClick: onSetupTargets }}
      />
    )
  }

  const handleQuickLog = () => {
    const proteinVal = Number(quickLog.protein)
    const caloriesVal = Number(quickLog.calories)

    if ((quickLog.protein && (proteinVal <= 0 || !isFinite(proteinVal))) ||
        (quickLog.calories && (caloriesVal <= 0 || !isFinite(caloriesVal)))) {
      toast.warning('Please enter positive values')
      return
    }

    onLogMacros({
      protein: quickLog.protein ? proteinVal : undefined,
      calories: quickLog.calories ? caloriesVal : undefined
    })
    analytics.mealLogged('manual')
    setQuickLog({ protein: '', calories: '' })
    toast.success('Macros logged')
    setQuickLogSuccess(true)
    setTimeout(() => setQuickLogSuccess(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Main Progress Rings */}
      <div className="grid grid-cols-2 gap-4">
        <div data-testid="macros-protein-display">
          <MacroRing
            label="Protein"
            current={progress.protein.current}
            target={progress.protein.target}
            unit="g"
            color="cyan"
            hit={proteinHit}
          />
        </div>
        <div data-testid="macros-calories-display">
          <MacroRing
            label="Calories"
            current={progress.calories.current}
            target={progress.calories.target}
            unit=""
            color="purple"
            hit={caloriesHit}
          />
        </div>
      </div>

      {/* Secondary Macros */}
      <Card className="py-0">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4">MACRONUTRIENTS</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Carbs</span>
                <span className="font-digital">
                  {progress.carbs.current}g / {progress.carbs.target}g
                </span>
              </div>
              <ProgressBar progress={progress.carbs.percentage} color="primary" size="sm" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Fats</span>
                <span className="font-digital">
                  {progress.fats.current}g / {progress.fats.target}g
                </span>
              </div>
              <ProgressBar progress={progress.fats.percentage} color="secondary" size="sm" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Log */}
      <Card className="py-0">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4">QUICK LOG</h3>

          {/* Food Search */}
          <FoodSearch
            onSelect={(food) => {
              const macros = { protein: food.protein, carbs: food.carbs, fats: food.fats, calories: food.calories }
              onLogNamedMeal(food.name, macros)
              onAddRecentFood({
                id: food.id,
                name: food.name,
                brand: food.brand,
                protein: food.protein,
                carbs: food.carbs,
                fats: food.fats,
                calories: food.calories,
                servingSize: food.servingSize,
                servingDescription: food.servingDescription,
                quantity: food.quantity,
                unit: food.unit,
                loggedAt: Date.now(),
              })
              analytics.mealLogged('search')
              toast.success(`${food.name} logged`)
            }}
          />

          {/* Recent Foods */}
          {recentFoods.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">RECENT</p>
              <div className="space-y-2">
                {recentFoods.map((food) => (
                  <div
                    key={`${food.id}-${food.loggedAt}`}
                    className="flex items-center justify-between bg-muted rounded-lg p-2.5"
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-sm font-medium truncate">{food.name}</p>
                      <p className="text-xs text-muted-foreground">
                        P: {food.protein}g · C: {food.carbs}g · F: {food.fats}g · {food.calories} cal
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn('shrink-0 text-xs h-7 px-2', loggedRecentId === food.id && 'text-success')}
                      disabled={loggedRecentId === food.id}
                      onClick={() => {
                        const macros = { protein: food.protein, carbs: food.carbs, fats: food.fats, calories: food.calories }
                        onLogNamedMeal(food.name, macros)
                        onAddRecentFood({ ...food, loggedAt: Date.now() })
                        analytics.mealLogged('saved')
                        toast.success(`${food.name} logged`)
                        setLoggedRecentId(food.id)
                        setTimeout(() => setLoggedRecentId(null), 2000)
                      }}
                    >
                      {loggedRecentId === food.id ? <Check className="h-3.5 w-3.5" /> : 'Log'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manual Entry */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3">MANUAL ENTRY</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Protein (g)</label>
                <Input
                  type="number"
                  value={quickLog.protein}
                  onChange={(e) => setQuickLog(prev => ({ ...prev, protein: e.target.value }))}
                  placeholder={String(targets.protein)}
                  className="font-digital"
                  data-testid="macros-food-search-input"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Calories</label>
                <Input
                  type="number"
                  value={quickLog.calories}
                  onChange={(e) => setQuickLog(prev => ({ ...prev, calories: e.target.value }))}
                  placeholder={String(targets.calories)}
                  className="font-digital"
                />
              </div>
            </div>
            <Button
              onClick={handleQuickLog}
              className={cn('w-full', quickLogSuccess && 'bg-success hover:bg-success')}
              disabled={quickLogSuccess || (!quickLog.protein && !quickLog.calories)}
              data-testid="macros-add-meal-button"
            >
              {quickLogSuccess ? (
                <span className="flex items-center gap-1.5"><Check className="h-4 w-4" /> Logged!</span>
              ) : (
                'Log Macros'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* XP Indicators */}
      <div className="grid grid-cols-2 gap-3">
        <Card className={cn('py-0', proteinHit && 'bg-success/10 border-success/30')}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              {proteinHit ? (
                <Check size={20} className="text-success" />
              ) : (
                <Beef size={20} className="text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-semibold">Protein Target</p>
                <p className="text-xs text-muted-foreground">
                  {proteinHit ? '+50 XP earned' : 'Within 10g for +50 XP'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={cn('py-0', caloriesHit && 'bg-success/10 border-success/30')}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              {caloriesHit ? (
                <Check size={20} className="text-success" />
              ) : (
                <Zap size={20} className="text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-semibold">Calorie Target</p>
                <p className="text-xs text-muted-foreground">
                  {caloriesHit ? '+50 XP earned' : 'Within 100 for +50 XP'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Logged Meals */}
      {todayMeals.length > 0 && (
        <Card className="py-0">
          <CardContent className="p-4">
            <button
              onClick={() => setShowMeals(!showMeals)}
              className="w-full flex items-center justify-between"
            >
              <h3 className="text-sm font-semibold text-muted-foreground">
                TODAY'S MEALS ({todayMeals.length})
              </h3>
              <ChevronDown
                size={16}
                className={cn('text-muted-foreground transition-transform', showMeals && 'rotate-180')}
              />
            </button>

            <div className={cn(
              'overflow-hidden transition-all duration-300',
              showMeals ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
            )}>
              <div className="space-y-2">
                {todayMeals.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex items-center justify-between bg-card rounded-lg p-3"
                    data-testid="macros-meal-entry"
                  >
                    <div>
                      <p className="font-semibold text-sm">{meal.name}</p>
                      <p className="text-xs text-muted-foreground">
                        P: {meal.protein}g · C: {meal.carbs}g · F: {meal.fats}g · {meal.calories} cal
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this meal entry?')) {
                          onDeleteMeal(meal.id)
                        }
                      }}
                      aria-label={`Delete ${meal.name}`}
                      className="text-muted-foreground hover:text-destructive p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function MacroRing({
  label,
  current,
  target,
  unit,
  color,
  hit
}: {
  label: string
  current: number
  target: number
  unit: string
  color: 'cyan' | 'purple'
  hit: boolean
}) {
  const percentage = Math.min((current / target) * 100, 100)
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const colorClass = hit ? 'stroke-success' : color === 'cyan' ? 'stroke-primary' : 'stroke-secondary'

  return (
    <Card className="py-0">
      <CardContent className="flex flex-col items-center py-4">
        <div className="relative w-28 h-28">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-card"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className={colorClass}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset,
                transition: 'stroke-dashoffset 1s ease-out'
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold font-digital">{current}</span>
            <span className="text-xs text-muted-foreground">{unit}</span>
          </div>
        </div>
        <p className="mt-2 font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{target > 0 ? `of ${target}${unit}` : 'No target set'}</p>
        {hit && <span className="text-xs text-success mt-1">Target Hit!</span>}
      </CardContent>
    </Card>
  )
}

function MealsView({ mealPlan }: { mealPlan: MealPlan[] }) {
  if (!mealPlan || mealPlan.length === 0) {
    return (
      <Card className="py-0">
        <CardContent className="text-center py-8">
          <UtensilsCrossed size={40} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-xl font-bold mb-2">No Meal Plan</p>
          <p className="text-muted-foreground">Set your macros in Calculator to generate a meal plan</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-4">
        Suggested meal breakdown based on your targets
      </p>
      {mealPlan.map((meal, index) => (
        <div
          key={index}
          className="animate-in fade-in slide-in-from-bottom-2 duration-300"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <Card className="py-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{meal.name}</h3>
                <span className="text-sm text-primary font-digital">
                  {meal.calories} cal
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted rounded-lg p-2">
                  <p className="text-xs text-muted-foreground">Protein</p>
                  <p className="font-digital font-semibold">{meal.protein}g</p>
                </div>
                <div className="bg-muted rounded-lg p-2">
                  <p className="text-xs text-muted-foreground">Carbs</p>
                  <p className="font-digital font-semibold">{meal.carbs}g</p>
                </div>
                <div className="bg-muted rounded-lg p-2">
                  <p className="text-xs text-muted-foreground">Fats</p>
                  <p className="font-digital font-semibold">{meal.fats}g</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}

function CalculatorView({
  currentWeight,
  currentHeight,
  currentAge,
  currentGender,
  currentGoal,
  currentActivity,
  targets,
  onCalculate
}: {
  currentWeight: number
  currentHeight: number
  currentAge: number
  currentGender: Gender
  currentGoal: 'cut' | 'recomp' | 'maintain' | 'bulk'
  currentActivity: 'sedentary' | 'light' | 'moderate' | 'active'
  targets: MacroTargets | null
  onCalculate: (weight: number, height: number, age: number, gender: Gender, goal: 'cut' | 'recomp' | 'maintain' | 'bulk', activity: 'sedentary' | 'light' | 'moderate' | 'active') => void
}) {
  const [weight, setWeight] = useState(String(currentWeight))
  const [heightFeet, setHeightFeet] = useState(String(Math.floor(currentHeight / 12)))
  const [heightInches, setHeightInches] = useState(String(currentHeight % 12))
  const [age, setAge] = useState(String(currentAge))
  const [gender, setGender] = useState<Gender>(currentGender)
  const [goal, setGoal] = useState(currentGoal)
  const [activity, setActivity] = useState(currentActivity)
  const [isCalculating, setIsCalculating] = useState(false)

  const handleCalculate = async () => {
    setIsCalculating(true)
    // Small delay for visual feedback even though calculation is synchronous
    await new Promise(resolve => setTimeout(resolve, 300))
    const totalHeightInches = Number(heightFeet) * 12 + Number(heightInches)
    onCalculate(Number(weight), totalHeightInches, Number(age), gender, goal, activity)
    setIsCalculating(false)
  }

  const activityLevels: { value: 'sedentary' | 'light' | 'moderate' | 'active'; label: string; description: string }[] = [
    { value: 'sedentary', label: 'Sedentary', description: 'Little to no exercise' },
    { value: 'light', label: 'Light', description: '1-3 days/week' },
    { value: 'moderate', label: 'Moderate', description: '3-5 days/week' },
    { value: 'active', label: 'Active', description: '6-7 days/week' }
  ]

  const goals: { value: 'cut' | 'recomp' | 'maintain' | 'bulk'; label: string; icon: typeof Flame }[] = [
    { value: 'cut', label: 'Cut', icon: Flame },
    { value: 'recomp', label: 'Recomp', icon: RefreshCw },
    { value: 'maintain', label: 'Maintain', icon: Scale },
    { value: 'bulk', label: 'Bulk', icon: TrendingUp }
  ]

  return (
    <div className="space-y-6">
      {/* Weight */}
      <Card className="py-0">
        <CardContent className="p-4">
          <label className="text-sm font-semibold text-muted-foreground block mb-2">
            BODY WEIGHT (LBS)
          </label>
          <Input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="text-2xl font-digital text-center py-3 h-auto"
            min={80}
            max={400}
          />
        </CardContent>
      </Card>

      {/* Height */}
      <Card className="py-0">
        <CardContent className="p-4">
          <label className="text-sm font-semibold text-muted-foreground block mb-2">
            HEIGHT
          </label>
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={heightFeet}
                  onChange={(e) => setHeightFeet(e.target.value)}
                  className="text-2xl font-digital text-center py-3 h-auto"
                  min={4}
                  max={7}
                />
                <span className="text-muted-foreground">ft</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={heightInches}
                  onChange={(e) => setHeightInches(e.target.value)}
                  className="text-2xl font-digital text-center py-3 h-auto"
                  min={0}
                  max={11}
                />
                <span className="text-muted-foreground">in</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Age */}
      <Card className="py-0">
        <CardContent className="p-4">
          <label className="text-sm font-semibold text-muted-foreground block mb-2">
            AGE
          </label>
          <Input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="text-2xl font-digital text-center py-3 h-auto"
            min={16}
            max={80}
          />
        </CardContent>
      </Card>

      {/* Gender */}
      <Card className="py-0">
        <CardContent className="p-4">
          <label className="text-sm font-semibold text-muted-foreground block mb-3">
            BIOLOGICAL SEX
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setGender('male')}
              className={cn(
                'p-3 rounded-lg border-2 transition-colors',
                gender === 'male'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-border'
              )}
            >
              <span className="text-2xl block mb-1">♂️</span>
              <span className="text-sm">Male</span>
            </button>
            <button
              onClick={() => setGender('female')}
              className={cn(
                'p-3 rounded-lg border-2 transition-colors',
                gender === 'female'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-border'
              )}
            >
              <span className="text-2xl block mb-1">♀️</span>
              <span className="text-sm">Female</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Goal */}
      <Card className="py-0">
        <CardContent className="p-4">
          <label className="text-sm font-semibold text-muted-foreground block mb-3">
            GOAL
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {goals.map(g => (
              <button
                key={g.value}
                onClick={() => setGoal(g.value)}
                className={cn(
                  'p-3 rounded-lg border-2 transition-colors',
                  goal === g.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-border'
                )}
              >
                <g.icon size={24} className={cn('mb-1', goal === g.value ? 'text-primary' : 'text-muted-foreground')} />
                <span className="text-sm">{g.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Level */}
      <Card className="py-0">
        <CardContent className="p-4">
          <label className="text-sm font-semibold text-muted-foreground block mb-3">
            ACTIVITY LEVEL
          </label>
          <div className="space-y-2">
            {activityLevels.map(level => (
              <button
                key={level.value}
                onClick={() => setActivity(level.value)}
                className={cn(
                  'w-full p-3 rounded-lg border-2 text-left transition-colors',
                  activity === level.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-border'
                )}
              >
                <p className="font-semibold">{level.label}</p>
                <p className="text-xs text-muted-foreground">{level.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleCalculate} className="w-full" size="lg" disabled={isCalculating}>
        {isCalculating ? 'Calculating...' : 'Calculate Macros'}
      </Button>

      {/* Current Targets Display */}
      {targets && (
        <Card className="py-0 bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">CURRENT TARGETS</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Calories</p>
                <p className="text-2xl font-bold font-digital text-primary">
                  {targets.calories}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Protein</p>
                <p className="text-2xl font-bold font-digital text-primary">
                  {targets.protein}g
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Carbs</p>
                <p className="text-lg font-digital">{targets.carbs}g</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fats</p>
                <p className="text-lg font-digital">{targets.fats}g</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function LogMealView({
  savedMeals,
  onLogMeal,
  onSaveMeal,
  onDeleteSavedMeal
}: {
  savedMeals: SavedMeal[]
  onLogMeal: (name: string, macros: { protein: number; carbs: number; fats: number; calories: number }) => void
  onSaveMeal: (name: string, ingredients: MealIngredient[]) => void
  onDeleteSavedMeal: (id: string) => void
}) {
  const [showMealBuilder, setShowMealBuilder] = useState(false)
  const [editingMeal, setEditingMeal] = useState<SavedMeal | null>(null)
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null)

  const handleSaveMeal = (name: string, ingredients: MealIngredient[]) => {
    onSaveMeal(name, ingredients)
    analytics.mealSaved()
    setShowMealBuilder(false)
    setEditingMeal(null)
  }

  const [loggedMealId, setLoggedMealId] = useState<string | null>(null)

  const handleLogSavedMeal = (meal: SavedMeal) => {
    onLogMeal(meal.name, {
      protein: meal.protein,
      carbs: meal.carbs,
      fats: meal.fats,
      calories: meal.calories
    })
    analytics.mealLogged('saved')
    toast.success(`${meal.name} logged`)
    setLoggedMealId(meal.id)
    setTimeout(() => setLoggedMealId(null), 2000)
  }

  const handleEditMeal = (meal: SavedMeal) => {
    setEditingMeal(meal)
    setShowMealBuilder(true)
  }

  const toggleExpandMeal = (mealId: string) => {
    setExpandedMealId(expandedMealId === mealId ? null : mealId)
  }

  return (
    <div className="space-y-6">
      {/* Create New Meal Button */}
      <Button
        onClick={() => {
          setEditingMeal(null)
          setShowMealBuilder(true)
        }}
        className="w-full"
        size="lg"
      >
        <span className="mr-2">+</span> Create New Meal
      </Button>

      {/* Saved Meals */}
      {savedMeals.length > 0 ? (
        <div className="space-y-3" data-testid="macros-saved-meals">
          <h3 className="text-sm font-semibold text-muted-foreground">SAVED MEALS ({savedMeals.length})</h3>

          {savedMeals.map((meal) => (
            <Card key={meal.id} className="py-0 overflow-hidden">
              {/* Meal Header */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <button
                    onClick={() => toggleExpandMeal(meal.id)}
                    className="flex-1 text-left"
                  >
                    <p className="font-semibold">{meal.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      P: {meal.protein}g · C: {meal.carbs}g · F: {meal.fats}g · {meal.calories} cal
                    </p>
                    {meal.ingredients && meal.ingredients.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {meal.ingredients.length} ingredient{meal.ingredients.length !== 1 ? 's' : ''}
                        <span className="ml-2">{expandedMealId === meal.id ? '▲' : '▼'}</span>
                      </p>
                    )}
                  </button>

                  <div className="flex items-center gap-2 ml-3">
                    <Button
                      size="sm"
                      onClick={() => handleLogSavedMeal(meal)}
                      disabled={loggedMealId === meal.id}
                      className={cn(loggedMealId === meal.id && 'bg-success hover:bg-success')}
                    >
                      {loggedMealId === meal.id ? <Check className="h-4 w-4" /> : 'Log'}
                    </Button>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                  <button
                    onClick={() => handleEditMeal(meal)}
                    className="flex-1 text-sm text-muted-foreground hover:text-primary py-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete saved meal "${meal.name}"?`)) {
                        onDeleteSavedMeal(meal.id)
                      }
                    }}
                    className="flex-1 text-sm text-muted-foreground hover:text-destructive py-1"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Expanded Ingredients */}
              <div className={cn(
                'overflow-hidden transition-all duration-300',
                expandedMealId === meal.id && meal.ingredients && meal.ingredients.length > 0
                  ? 'max-h-[2000px] opacity-100'
                  : 'max-h-0 opacity-0'
              )}>
                <div className="px-4 py-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">INGREDIENTS</p>
                  <div className="space-y-2">
                    {meal.ingredients?.map((ing) => (
                      <div key={ing.id} className="text-sm">
                        <p className="text-foreground">
                          {ing.name}
                          <span className="text-muted-foreground ml-2">
                            ({ing.quantity}{ing.unit === 'serving' ? ' serving' : ing.unit})
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          P: {ing.protein}g · C: {ing.carbs}g · F: {ing.fats}g · {ing.calories} cal
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-0">
          <CardContent className="text-center py-8">
            <UtensilsCrossed size={40} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-lg font-semibold mb-1">No Saved Meals</p>
            <p className="text-muted-foreground text-sm">
              Create a meal with multiple ingredients to quickly log it later
            </p>
          </CardContent>
        </Card>
      )}

      {/* Meal Builder Modal */}
      <MealBuilder
        isOpen={showMealBuilder}
        onClose={() => {
          setShowMealBuilder(false)
          setEditingMeal(null)
        }}
        onSave={handleSaveMeal}
        editMeal={editingMeal ? {
          name: editingMeal.name,
          ingredients: editingMeal.ingredients || []
        } : null}
      />
    </div>
  )
}
