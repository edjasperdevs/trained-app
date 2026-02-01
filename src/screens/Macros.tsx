import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Card, ProgressBar, FoodSearch } from '@/components'
import { FoodSearchResult } from '@/lib/foodApi'
import { useMacroStore, useUserStore, MacroTargets, MealPlan, SavedMeal, LoggedMeal, Gender } from '@/stores'

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
    saveMeal,
    editSavedMeal,
    deleteSavedMeal,
    getSavedMeals,
    getTodayMeals,
    deleteLoggedMeal,
    isProteinTargetHit,
    isCalorieTargetHit,
    calculateMacros,
    activityLevel
  } = useMacroStore()

  const profile = useUserStore((state) => state.profile)
  const progress = getTodayProgress()
  const savedMeals = getSavedMeals()
  const todayMeals = getTodayMeals()

  const tabs: { id: TabType; label: string }[] = [
    { id: 'daily', label: 'Daily' },
    { id: 'log', label: 'Log' },
    { id: 'meals', label: 'Plan' },
    { id: 'calculator', label: 'Calc' }
  ]

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      {/* Header */}
      <div className="bg-bg-secondary pt-8 pb-4 px-4">
        <h1 className="text-2xl font-bold mb-4">Macros</h1>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors
                ${activeTab === tab.id
                  ? 'bg-accent-primary text-bg-primary'
                  : 'bg-bg-card text-gray-400 hover:text-white'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-6">
        {activeTab === 'daily' && (
          <DailyView
            progress={progress}
            targets={targets}
            proteinHit={isProteinTargetHit()}
            caloriesHit={isCalorieTargetHit()}
            onLogMacros={logQuickMacros}
            todayMeals={todayMeals}
            onDeleteMeal={deleteLoggedMeal}
          />
        )}

        {activeTab === 'log' && (
          <LogMealView
            savedMeals={savedMeals}
            onLogMeal={logNamedMeal}
            onSaveMeal={saveMeal}
            onEditSavedMeal={editSavedMeal}
            onDeleteSavedMeal={deleteSavedMeal}
          />
        )}

        {activeTab === 'meals' && (
          <MealsView mealPlan={mealPlan} />
        )}

        {activeTab === 'calculator' && (
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
  todayMeals,
  onDeleteMeal
}: {
  progress: MacroProgress
  targets: MacroTargets | null
  proteinHit: boolean
  caloriesHit: boolean
  onLogMacros: (macros: { protein?: number; calories?: number; carbs?: number; fats?: number }) => void
  todayMeals: LoggedMeal[]
  onDeleteMeal: (id: string) => void
}) {
  const [quickLog, setQuickLog] = useState({ protein: '', calories: '' })
  const [showMeals, setShowMeals] = useState(false)

  if (!targets || !progress) {
    return (
      <Card className="text-center py-8">
        <span className="text-4xl mb-4 block">📊</span>
        <p className="text-xl font-bold mb-2">No Macro Targets Set</p>
        <p className="text-gray-400 mb-4">Go to Calculator tab to set your targets</p>
      </Card>
    )
  }

  const handleQuickLog = () => {
    onLogMacros({
      protein: quickLog.protein ? Number(quickLog.protein) : undefined,
      calories: quickLog.calories ? Number(quickLog.calories) : undefined
    })
    setQuickLog({ protein: '', calories: '' })
  }

  return (
    <div className="space-y-6">
      {/* Main Progress Rings */}
      <div className="grid grid-cols-2 gap-4">
        <MacroRing
          label="Protein"
          current={progress.protein.current}
          target={progress.protein.target}
          unit="g"
          color="cyan"
          hit={proteinHit}
        />
        <MacroRing
          label="Calories"
          current={progress.calories.current}
          target={progress.calories.target}
          unit=""
          color="purple"
          hit={caloriesHit}
        />
      </div>

      {/* Secondary Macros */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-400 mb-4">MACRONUTRIENTS</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Carbs</span>
              <span className="font-digital">
                {progress.carbs.current}g / {progress.carbs.target}g
              </span>
            </div>
            <ProgressBar progress={progress.carbs.percentage} color="cyan" size="sm" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Fats</span>
              <span className="font-digital">
                {progress.fats.current}g / {progress.fats.target}g
              </span>
            </div>
            <ProgressBar progress={progress.fats.percentage} color="purple" size="sm" />
          </div>
        </div>
      </Card>

      {/* Quick Log */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-400 mb-4">QUICK LOG</h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Protein (g)</label>
            <input
              type="number"
              value={quickLog.protein}
              onChange={(e) => setQuickLog(prev => ({ ...prev, protein: e.target.value }))}
              placeholder={String(targets.protein)}
              className="w-full bg-bg-secondary border border-gray-700 rounded-lg px-3 py-2 font-digital"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Calories</label>
            <input
              type="number"
              value={quickLog.calories}
              onChange={(e) => setQuickLog(prev => ({ ...prev, calories: e.target.value }))}
              placeholder={String(targets.calories)}
              className="w-full bg-bg-secondary border border-gray-700 rounded-lg px-3 py-2 font-digital"
            />
          </div>
        </div>
        <Button
          onClick={handleQuickLog}
          fullWidth
          disabled={!quickLog.protein && !quickLog.calories}
        >
          Log Macros
        </Button>
      </Card>

      {/* XP Indicators */}
      <div className="grid grid-cols-2 gap-3">
        <Card className={proteinHit ? 'bg-accent-success/10 border-accent-success/30' : ''} padding="sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">{proteinHit ? '✓' : '🥩'}</span>
            <div>
              <p className="text-sm font-semibold">Protein Target</p>
              <p className="text-xs text-gray-500">
                {proteinHit ? '+50 XP earned' : 'Within 10g for +50 XP'}
              </p>
            </div>
          </div>
        </Card>
        <Card className={caloriesHit ? 'bg-accent-success/10 border-accent-success/30' : ''} padding="sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">{caloriesHit ? '✓' : '🔥'}</span>
            <div>
              <p className="text-sm font-semibold">Calorie Target</p>
              <p className="text-xs text-gray-500">
                {caloriesHit ? '+50 XP earned' : 'Within 100 for +50 XP'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Today's Logged Meals */}
      {todayMeals.length > 0 && (
        <Card>
          <button
            onClick={() => setShowMeals(!showMeals)}
            className="w-full flex items-center justify-between"
          >
            <h3 className="text-sm font-semibold text-gray-400">
              TODAY'S MEALS ({todayMeals.length})
            </h3>
            <span className={`transition-transform ${showMeals ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          <AnimatePresence>
            {showMeals && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 space-y-2 overflow-hidden"
              >
                {todayMeals.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex items-center justify-between bg-bg-secondary rounded-lg p-3"
                  >
                    <div>
                      <p className="font-semibold text-sm">{meal.name}</p>
                      <p className="text-xs text-gray-500">
                        P: {meal.protein}g · C: {meal.carbs}g · F: {meal.fats}g · {meal.calories} cal
                      </p>
                    </div>
                    <button
                      onClick={() => onDeleteMeal(meal.id)}
                      className="text-gray-500 hover:text-accent-danger p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
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

  const colorClass = hit ? 'stroke-accent-success' : color === 'cyan' ? 'stroke-accent-primary' : 'stroke-accent-secondary'

  return (
    <Card className="flex flex-col items-center py-4">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-bg-secondary"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={colorClass}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            style={{ strokeDasharray: circumference }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold font-digital">{current}</span>
          <span className="text-xs text-gray-500">{unit}</span>
        </div>
      </div>
      <p className="mt-2 font-semibold">{label}</p>
      <p className="text-xs text-gray-500">of {target}{unit}</p>
      {hit && <span className="text-xs text-accent-success mt-1">Target Hit!</span>}
    </Card>
  )
}

function MealsView({ mealPlan }: { mealPlan: MealPlan[] }) {
  if (!mealPlan || mealPlan.length === 0) {
    return (
      <Card className="text-center py-8">
        <span className="text-4xl mb-4 block">🍽️</span>
        <p className="text-xl font-bold mb-2">No Meal Plan</p>
        <p className="text-gray-400">Set your macros in Calculator to generate a meal plan</p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400 mb-4">
        Suggested meal breakdown based on your targets
      </p>
      {mealPlan.map((meal, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{meal.name}</h3>
              <span className="text-sm text-accent-primary font-digital">
                {meal.calories} cal
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-bg-secondary rounded-lg p-2">
                <p className="text-xs text-gray-500">Protein</p>
                <p className="font-digital font-semibold">{meal.protein}g</p>
              </div>
              <div className="bg-bg-secondary rounded-lg p-2">
                <p className="text-xs text-gray-500">Carbs</p>
                <p className="font-digital font-semibold">{meal.carbs}g</p>
              </div>
              <div className="bg-bg-secondary rounded-lg p-2">
                <p className="text-xs text-gray-500">Fats</p>
                <p className="font-digital font-semibold">{meal.fats}g</p>
              </div>
            </div>
          </Card>
        </motion.div>
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

  const handleCalculate = () => {
    const totalHeightInches = Number(heightFeet) * 12 + Number(heightInches)
    onCalculate(Number(weight), totalHeightInches, Number(age), gender, goal, activity)
  }

  const activityLevels: { value: 'sedentary' | 'light' | 'moderate' | 'active'; label: string; description: string }[] = [
    { value: 'sedentary', label: 'Sedentary', description: 'Little to no exercise' },
    { value: 'light', label: 'Light', description: '1-3 days/week' },
    { value: 'moderate', label: 'Moderate', description: '3-5 days/week' },
    { value: 'active', label: 'Active', description: '6-7 days/week' }
  ]

  const goals: { value: 'cut' | 'recomp' | 'maintain' | 'bulk'; label: string; emoji: string }[] = [
    { value: 'cut', label: 'Cut', emoji: '🔥' },
    { value: 'recomp', label: 'Recomp', emoji: '🔄' },
    { value: 'maintain', label: 'Maintain', emoji: '⚖️' },
    { value: 'bulk', label: 'Bulk', emoji: '📈' }
  ]

  return (
    <div className="space-y-6">
      {/* Weight */}
      <Card>
        <label className="text-sm font-semibold text-gray-400 block mb-2">
          BODY WEIGHT (LBS)
        </label>
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="w-full bg-bg-secondary border border-gray-700 rounded-lg px-4 py-3 text-2xl font-digital text-center"
          min={80}
          max={400}
        />
      </Card>

      {/* Height */}
      <Card>
        <label className="text-sm font-semibold text-gray-400 block mb-2">
          HEIGHT
        </label>
        <div className="flex gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={heightFeet}
                onChange={(e) => setHeightFeet(e.target.value)}
                className="w-full bg-bg-secondary border border-gray-700 rounded-lg px-4 py-3 text-2xl font-digital text-center"
                min={4}
                max={7}
              />
              <span className="text-gray-400">ft</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={heightInches}
                onChange={(e) => setHeightInches(e.target.value)}
                className="w-full bg-bg-secondary border border-gray-700 rounded-lg px-4 py-3 text-2xl font-digital text-center"
                min={0}
                max={11}
              />
              <span className="text-gray-400">in</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Age */}
      <Card>
        <label className="text-sm font-semibold text-gray-400 block mb-2">
          AGE
        </label>
        <input
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="w-full bg-bg-secondary border border-gray-700 rounded-lg px-4 py-3 text-2xl font-digital text-center"
          min={16}
          max={80}
        />
      </Card>

      {/* Gender */}
      <Card>
        <label className="text-sm font-semibold text-gray-400 block mb-3">
          BIOLOGICAL SEX
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setGender('male')}
            className={`
              p-3 rounded-lg border-2 transition-colors
              ${gender === 'male'
                ? 'border-accent-primary bg-accent-primary/10'
                : 'border-gray-700 hover:border-gray-600'}
            `}
          >
            <span className="text-2xl block mb-1">♂️</span>
            <span className="text-sm">Male</span>
          </button>
          <button
            onClick={() => setGender('female')}
            className={`
              p-3 rounded-lg border-2 transition-colors
              ${gender === 'female'
                ? 'border-accent-primary bg-accent-primary/10'
                : 'border-gray-700 hover:border-gray-600'}
            `}
          >
            <span className="text-2xl block mb-1">♀️</span>
            <span className="text-sm">Female</span>
          </button>
        </div>
      </Card>

      {/* Goal */}
      <Card>
        <label className="text-sm font-semibold text-gray-400 block mb-3">
          GOAL
        </label>
        <div className="grid grid-cols-3 gap-2">
          {goals.map(g => (
            <button
              key={g.value}
              onClick={() => setGoal(g.value)}
              className={`
                p-3 rounded-lg border-2 transition-colors
                ${goal === g.value
                  ? 'border-accent-primary bg-accent-primary/10'
                  : 'border-gray-700 hover:border-gray-600'}
              `}
            >
              <span className="text-2xl block mb-1">{g.emoji}</span>
              <span className="text-sm">{g.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Activity Level */}
      <Card>
        <label className="text-sm font-semibold text-gray-400 block mb-3">
          ACTIVITY LEVEL
        </label>
        <div className="space-y-2">
          {activityLevels.map(level => (
            <button
              key={level.value}
              onClick={() => setActivity(level.value)}
              className={`
                w-full p-3 rounded-lg border-2 text-left transition-colors
                ${activity === level.value
                  ? 'border-accent-primary bg-accent-primary/10'
                  : 'border-gray-700 hover:border-gray-600'}
              `}
            >
              <p className="font-semibold">{level.label}</p>
              <p className="text-xs text-gray-500">{level.description}</p>
            </button>
          ))}
        </div>
      </Card>

      <Button onClick={handleCalculate} fullWidth size="lg">
        Calculate Macros
      </Button>

      {/* Current Targets Display */}
      {targets && (
        <Card className="bg-accent-primary/5 border-accent-primary/20">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">CURRENT TARGETS</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Calories</p>
              <p className="text-2xl font-bold font-digital text-accent-primary">
                {targets.calories}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Protein</p>
              <p className="text-2xl font-bold font-digital text-accent-primary">
                {targets.protein}g
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Carbs</p>
              <p className="text-lg font-digital">{targets.carbs}g</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Fats</p>
              <p className="text-lg font-digital">{targets.fats}g</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

function LogMealView({
  savedMeals,
  onLogMeal,
  onSaveMeal,
  onEditSavedMeal,
  onDeleteSavedMeal
}: {
  savedMeals: SavedMeal[]
  onLogMeal: (name: string, macros: { protein: number; carbs: number; fats: number; calories: number }) => void
  onSaveMeal: (name: string, macros: { protein: number; carbs: number; fats: number; calories: number }) => void
  onEditSavedMeal: (id: string, updates: Partial<Omit<SavedMeal, 'id' | 'createdAt'>>) => void
  onDeleteSavedMeal: (id: string) => void
}) {
  const [mealName, setMealName] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fats, setFats] = useState('')
  const [calories, setCalories] = useState('')
  const [saveForLater, setSaveForLater] = useState(false)
  const [showSaved, setShowSaved] = useState(true)
  const [editingMeal, setEditingMeal] = useState<SavedMeal | null>(null)
  const [editName, setEditName] = useState('')
  const [editProtein, setEditProtein] = useState('')
  const [editCarbs, setEditCarbs] = useState('')
  const [editFats, setEditFats] = useState('')
  const [editCalories, setEditCalories] = useState('')

  const openEditModal = (meal: SavedMeal) => {
    setEditingMeal(meal)
    setEditName(meal.name)
    setEditProtein(String(meal.protein))
    setEditCarbs(String(meal.carbs))
    setEditFats(String(meal.fats))
    setEditCalories(String(meal.calories))
  }

  const handleSaveEdit = () => {
    if (!editingMeal || !editName.trim()) return
    const editCalcCalories = (Number(editProtein) * 4) + (Number(editCarbs) * 4) + (Number(editFats) * 9)
    onEditSavedMeal(editingMeal.id, {
      name: editName,
      protein: Number(editProtein) || 0,
      carbs: Number(editCarbs) || 0,
      fats: Number(editFats) || 0,
      calories: Number(editCalories) || editCalcCalories
    })
    setEditingMeal(null)
  }

  const handleFoodSelect = (food: FoodSearchResult) => {
    setMealName(food.brand ? `${food.name} (${food.brand})` : food.name)
    setProtein(String(food.protein))
    setCarbs(String(food.carbs))
    setFats(String(food.fats))
    setCalories(String(food.calories))
  }

  // Auto-calculate calories from macros
  const calculatedCalories = (Number(protein) * 4) + (Number(carbs) * 4) + (Number(fats) * 9)

  const handleLog = () => {
    if (!mealName.trim()) return

    const macros = {
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fats: Number(fats) || 0,
      calories: Number(calories) || calculatedCalories
    }

    onLogMeal(mealName, macros)

    if (saveForLater) {
      onSaveMeal(mealName, macros)
    }

    // Reset form
    setMealName('')
    setProtein('')
    setCarbs('')
    setFats('')
    setCalories('')
    setSaveForLater(false)
  }

  const handleQuickAdd = (meal: SavedMeal) => {
    onLogMeal(meal.name, {
      protein: meal.protein,
      carbs: meal.carbs,
      fats: meal.fats,
      calories: meal.calories
    })
  }

  const hasValidMacros = Number(protein) > 0 || Number(carbs) > 0 || Number(fats) > 0 || Number(calories) > 0

  return (
    <div className="space-y-6">
      {/* Food Search */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-400 mb-3">SEARCH FOODS</h3>
        <p className="text-xs text-gray-500 mb-3">
          Search Open Food Facts database to auto-fill macros
        </p>
        <FoodSearch onSelect={handleFoodSelect} />
      </Card>

      {/* Log New Meal */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-400 mb-4">LOG A MEAL</h3>

        <div className="space-y-4">
          {/* Meal Name */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Meal Name</label>
            <input
              type="text"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              placeholder="e.g., Chicken & Rice"
              className="w-full bg-bg-secondary border border-gray-700 rounded-lg px-3 py-2"
            />
          </div>

          {/* Macros Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Protein (g)</label>
              <input
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="0"
                className="w-full bg-bg-secondary border border-gray-700 rounded-lg px-3 py-2 font-digital"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Carbs (g)</label>
              <input
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="0"
                className="w-full bg-bg-secondary border border-gray-700 rounded-lg px-3 py-2 font-digital"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Fats (g)</label>
              <input
                type="number"
                value={fats}
                onChange={(e) => setFats(e.target.value)}
                placeholder="0"
                className="w-full bg-bg-secondary border border-gray-700 rounded-lg px-3 py-2 font-digital"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Calories {calculatedCalories > 0 && `(~${calculatedCalories})`}
              </label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder={calculatedCalories > 0 ? String(calculatedCalories) : '0'}
                className="w-full bg-bg-secondary border border-gray-700 rounded-lg px-3 py-2 font-digital"
              />
            </div>
          </div>

          {/* Save for Later Toggle */}
          <button
            onClick={() => setSaveForLater(!saveForLater)}
            className={`w-full p-3 rounded-lg border-2 flex items-center justify-between transition-colors ${
              saveForLater
                ? 'border-accent-primary bg-accent-primary/10'
                : 'border-gray-700'
            }`}
          >
            <span className="text-sm">Save for quick-add later</span>
            <span className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
              saveForLater ? 'border-accent-primary bg-accent-primary' : 'border-gray-600'
            }`}>
              {saveForLater && <span className="text-xs text-white">✓</span>}
            </span>
          </button>

          <Button
            onClick={handleLog}
            fullWidth
            disabled={!mealName.trim() || !hasValidMacros}
          >
            Log Meal
          </Button>
        </div>
      </Card>

      {/* Saved Meals */}
      {savedMeals.length > 0 && (
        <Card>
          <button
            onClick={() => setShowSaved(!showSaved)}
            className="w-full flex items-center justify-between"
          >
            <h3 className="text-sm font-semibold text-gray-400">
              SAVED MEALS ({savedMeals.length})
            </h3>
            <span className={`transition-transform ${showSaved ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          <AnimatePresence>
            {showSaved && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 space-y-2 overflow-hidden"
              >
                {savedMeals.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex items-center gap-2 bg-bg-secondary rounded-lg p-3"
                  >
                    <button
                      onClick={() => handleQuickAdd(meal)}
                      className="flex-1 text-left"
                    >
                      <p className="font-semibold text-sm">{meal.name}</p>
                      <p className="text-xs text-gray-500">
                        P: {meal.protein}g · C: {meal.carbs}g · F: {meal.fats}g · {meal.calories} cal
                      </p>
                    </button>
                    <Button
                      size="sm"
                      onClick={() => handleQuickAdd(meal)}
                    >
                      + Add
                    </Button>
                    <button
                      onClick={() => openEditModal(meal)}
                      className="text-gray-500 hover:text-accent-primary p-1"
                      title="Edit meal"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDeleteSavedMeal(meal.id)}
                      className="text-gray-500 hover:text-accent-danger p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}

      {savedMeals.length === 0 && (
        <Card className="text-center py-6">
          <span className="text-3xl block mb-2">🍽️</span>
          <p className="text-gray-400 text-sm">
            No saved meals yet. Log a meal and check "Save for quick-add later" to build your library.
          </p>
        </Card>
      )}

      {/* Edit Meal Modal */}
      {editingMeal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setEditingMeal(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-bg-secondary rounded-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Edit Saved Meal</h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Meal Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-bg-card border border-gray-700 rounded-lg px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={editProtein}
                    onChange={(e) => setEditProtein(e.target.value)}
                    className="w-full bg-bg-card border border-gray-700 rounded-lg px-3 py-2 font-digital"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={editCarbs}
                    onChange={(e) => setEditCarbs(e.target.value)}
                    className="w-full bg-bg-card border border-gray-700 rounded-lg px-3 py-2 font-digital"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Fats (g)</label>
                  <input
                    type="number"
                    value={editFats}
                    onChange={(e) => setEditFats(e.target.value)}
                    className="w-full bg-bg-card border border-gray-700 rounded-lg px-3 py-2 font-digital"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Calories</label>
                  <input
                    type="number"
                    value={editCalories}
                    onChange={(e) => setEditCalories(e.target.value)}
                    placeholder={String((Number(editProtein) * 4) + (Number(editCarbs) * 4) + (Number(editFats) * 9))}
                    className="w-full bg-bg-card border border-gray-700 rounded-lg px-3 py-2 font-digital"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setEditingMeal(null)}
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  onClick={handleSaveEdit}
                  disabled={!editName.trim()}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
