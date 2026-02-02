import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Card, ProgressBar, MealBuilder } from '@/components'
import { useMacroStore, useUserStore, MacroTargets, MealPlan, SavedMeal, LoggedMeal, Gender, MealIngredient } from '@/stores'

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
    setShowMealBuilder(false)
    setEditingMeal(null)
  }

  const handleLogSavedMeal = (meal: SavedMeal) => {
    onLogMeal(meal.name, {
      protein: meal.protein,
      carbs: meal.carbs,
      fats: meal.fats,
      calories: meal.calories
    })
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
        fullWidth
        size="lg"
      >
        <span className="mr-2">+</span> Create New Meal
      </Button>

      {/* Saved Meals */}
      {savedMeals.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-400">SAVED MEALS ({savedMeals.length})</h3>

          {savedMeals.map((meal) => (
            <Card key={meal.id} padding="none" className="overflow-hidden">
              {/* Meal Header */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <button
                    onClick={() => toggleExpandMeal(meal.id)}
                    className="flex-1 text-left"
                  >
                    <p className="font-semibold">{meal.name}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      P: {meal.protein}g · C: {meal.carbs}g · F: {meal.fats}g · {meal.calories} cal
                    </p>
                    {meal.ingredients && meal.ingredients.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {meal.ingredients.length} ingredient{meal.ingredients.length !== 1 ? 's' : ''}
                        <span className="ml-2">{expandedMealId === meal.id ? '▲' : '▼'}</span>
                      </p>
                    )}
                  </button>

                  <div className="flex items-center gap-2 ml-3">
                    <Button
                      size="sm"
                      onClick={() => handleLogSavedMeal(meal)}
                    >
                      Log
                    </Button>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-800">
                  <button
                    onClick={() => handleEditMeal(meal)}
                    className="flex-1 text-sm text-gray-400 hover:text-accent-primary py-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteSavedMeal(meal.id)}
                    className="flex-1 text-sm text-gray-400 hover:text-accent-danger py-1"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Expanded Ingredients */}
              <AnimatePresence>
                {expandedMealId === meal.id && meal.ingredients && meal.ingredients.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-bg-primary px-4 py-3 border-t border-gray-800">
                      <p className="text-xs text-gray-500 mb-2">INGREDIENTS</p>
                      <div className="space-y-2">
                        {meal.ingredients.map((ing) => (
                          <div key={ing.id} className="text-sm">
                            <p className="text-gray-300">
                              {ing.name}
                              <span className="text-gray-500 ml-2">
                                ({ing.quantity}{ing.unit === 'serving' ? ' serving' : ing.unit})
                              </span>
                            </p>
                            <p className="text-xs text-gray-500">
                              P: {ing.protein}g · C: {ing.carbs}g · F: {ing.fats}g · {ing.calories} cal
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-8">
          <span className="text-4xl block mb-3">🍽️</span>
          <p className="text-lg font-semibold mb-1">No Saved Meals</p>
          <p className="text-gray-400 text-sm">
            Create a meal with multiple ingredients to quickly log it later
          </p>
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
