import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { EmptyState, FoodSearch, RankUpModal, AnimatedPage, AppHeader } from '@/components'
import { useMacroStore, useUserStore, MacroTargets, SavedMeal, Gender, RecentFood, LoggedMeal, MealIngredient, toast } from '@/stores'
import { useDPStore } from '@/stores/dpStore'
import { motion, AnimatePresence } from 'framer-motion'
import { UtensilsCrossed, ChevronDown, Flame, Scale, TrendingUp, RefreshCw, ShieldCheck, ChevronLeft, Plus, Trash2, X, Heart, Bookmark, Pencil } from 'lucide-react'
import { scheduleSync } from '@/lib/sync'
import { confirmAction } from '@/lib/confirm'
import { analytics } from '@/lib/analytics'
import { cn } from '@/lib/cn'
import { springs } from '@/lib/animations'

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre-workout' | 'post-workout'

// Dual ring component - outer for calories, inner for protein
function DualRing({
  calories,
  caloriesTarget,
  protein,
  proteinTarget
}: {
  calories: number
  caloriesTarget: number
  protein: number
  proteinTarget: number
}) {
  const caloriePercentage = Math.min((calories / caloriesTarget) * 100, 100)
  const proteinPercentage = Math.min((protein / proteinTarget) * 100, 100)

  // Large rings with minimal gap
  const size = 360
  const center = size / 2

  // Outer ring (calories) - gold - thick
  const outerRadius = 165
  const outerStroke = 28
  const outerNormalizedRadius = outerRadius - outerStroke / 2
  const outerCircumference = outerNormalizedRadius * 2 * Math.PI
  const outerStrokeDashoffset = outerCircumference - (caloriePercentage / 100) * outerCircumference

  // Inner ring (protein) - teal - 5px gap from outer, also thick
  const innerRadius = 128  // outer inner edge (151) - 5px gap - half stroke
  const innerStroke = 24
  const innerNormalizedRadius = innerRadius - innerStroke / 2
  const innerCircumference = innerNormalizedRadius * 2 * Math.PI
  const innerStrokeDashoffset = innerCircumference - (proteinPercentage / 100) * innerCircumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Gradients */}
          <defs>
            <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D4A853" />
              <stop offset="100%" stopColor="#B8860B" />
            </linearGradient>
            <linearGradient id="proteinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14B8A6" />
              <stop offset="100%" stopColor="#0D9488" />
            </linearGradient>
          </defs>

          {/* Outer ring background (calories) */}
          <circle
            stroke="rgba(212, 168, 83, 0.15)"
            fill="transparent"
            strokeWidth={outerStroke}
            r={outerNormalizedRadius}
            cx={center}
            cy={center}
          />
          {/* Outer ring progress (calories) */}
          <motion.circle
            stroke="url(#calorieGradient)"
            fill="transparent"
            strokeWidth={outerStroke}
            strokeLinecap="round"
            strokeDasharray={outerCircumference}
            initial={{ strokeDashoffset: outerCircumference }}
            animate={{ strokeDashoffset: outerStrokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
            r={outerNormalizedRadius}
            cx={center}
            cy={center}
            className="drop-shadow-[0_0_8px_rgba(212,168,83,0.35)]"
          />

          {/* Inner ring background (protein) */}
          <circle
            stroke="rgba(20, 184, 166, 0.15)"
            fill="transparent"
            strokeWidth={innerStroke}
            r={innerNormalizedRadius}
            cx={center}
            cy={center}
          />
          {/* Inner ring progress (protein) */}
          <motion.circle
            stroke="url(#proteinGradient)"
            fill="transparent"
            strokeWidth={innerStroke}
            strokeLinecap="round"
            strokeDasharray={innerCircumference}
            initial={{ strokeDashoffset: innerCircumference }}
            animate={{ strokeDashoffset: innerStrokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            r={innerNormalizedRadius}
            cx={center}
            cy={center}
            className="drop-shadow-[0_0_8px_rgba(20,184,166,0.35)]"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-4xl font-bold font-mono text-foreground"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {calories.toLocaleString()}
          </motion.span>
          <span className="text-sm text-muted-foreground">
            / {caloriesTarget.toLocaleString()} kcal
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#D4A853] to-[#B8860B]" />
          <span className="text-xs text-muted-foreground">Calories</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#14B8A6] to-[#0D9488]" />
          <span className="text-xs text-muted-foreground">Protein</span>
        </div>
      </div>
    </div>
  )
}

// Mini progress ring for macro cards
function MiniRing({ percentage }: { percentage: number }) {
  const radius = 12
  const stroke = 3
  const normalizedRadius = radius - stroke / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference

  return (
    <svg width="24" height="24" className="transform -rotate-90">
      <circle
        stroke="rgba(212, 168, 83, 0.2)"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx="12"
        cy="12"
      />
      <circle
        stroke="#D4A853"
        fill="transparent"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        r={normalizedRadius}
        cx="12"
        cy="12"
        className="transition-all duration-500"
      />
    </svg>
  )
}

export function Macros() {
  const [showLogMeal, setShowLogMeal] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState<LoggedMeal | null>(null)
  const [rankUpData, setRankUpData] = useState<{ oldRank: number; newRank: number; rankName: string } | null>(null)

  // PERF-02: Use granular selectors for reactive state
  const targets = useMacroStore((state) => state.targets)
  const recentFoods = useMacroStore((state) => state.recentFoods)
  const favoriteFoods = useMacroStore((state) => state.favoriteFoods)
  const activityLevel = useMacroStore((state) => state.activityLevel)
  const setBy = useMacroStore((state) => state.setBy)
  const coachMacroUpdated = useMacroStore((state) => state.coachMacroUpdated)
  // Subscribe to dailyLogs so derived values (progress, todayMeals) re-compute on change
  useMacroStore((state) => state.dailyLogs)
  const savedMeals = useMacroStore((state) => state.savedMeals)

  // PERF-02: Access non-reactive functions via getState()
  const {
    getTodayProgress,
    logNamedMeal,
    addRecentFood,
    getTodayMeals,
    deleteLoggedMeal,
    updateLoggedMeal,
    calculateMacros,
    toggleFavoriteFood,
    saveMeal,
    updateSavedMeal,
    deleteSavedMeal,
  } = useMacroStore.getState()

  const profile = useUserStore((state) => state.profile)
  const progress = getTodayProgress()
  const todayMeals = getTodayMeals()

  const dismissCoachUpdate = () => {
    useMacroStore.getState().dismissCoachMacroUpdated()
  }

  // Format today's date
  const dateString = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleLogMeal = (name: string, macros: { protein: number; carbs: number; fats: number; calories: number }, _mealType?: MealType, fromSavedMeal?: boolean) => {
    logNamedMeal(name, macros, fromSavedMeal)
    const result = useDPStore.getState().awardDP('meal')
    if (result.rankedUp) {
      const rankInfo = useDPStore.getState().getRankInfo()
      setRankUpData({ oldRank: result.newRank - 1, newRank: result.newRank, rankName: rankInfo.name })
    }
    scheduleSync()
  }

  return (
    <AnimatedPage>
      <div data-testid="macros-screen" className="min-h-screen pb-32 bg-background">
        {/* Coach Macro Updated Modal */}
        {coachMacroUpdated && targets && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
            <Card className="py-0 w-full max-w-sm bg-surface border-border">
              <CardContent className="p-6 text-center">
                <ShieldCheck size={40} className="mx-auto mb-4 text-primary" />
                <p className="text-lg font-bold mb-2">Macros Updated by Coach</p>
                <p className="text-muted-foreground text-sm mb-4">
                  Your coach has set new macro targets for you.
                </p>
                <div className="grid grid-cols-2 gap-3 text-left mb-6">
                  <div>
                    <p className="text-xs text-muted-foreground">Calories</p>
                    <p className="text-xl font-bold font-mono text-primary">{targets.calories}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Protein</p>
                    <p className="text-xl font-bold font-mono text-primary">{targets.protein}g</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Carbs</p>
                    <p className="text-lg font-mono">{targets.carbs}g</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fats</p>
                    <p className="text-lg font-mono">{targets.fats}g</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button className="w-full" onClick={() => { dismissCoachUpdate() }}>
                    View Macros
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={dismissCoachUpdate}>
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <AppHeader />

        {/* Page Title */}
        <div className="px-6 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">Fuel</h1>
              <p className="text-sm text-muted-foreground mt-1">{dateString}</p>
            </div>
            {setBy === 'coach' && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full font-medium flex items-center gap-1">
                <ShieldCheck size={12} />
                Coach
              </span>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 py-6" data-sentry-mask>
          {!targets || !progress ? (
            <EmptyState
              icon={UtensilsCrossed}
              title="No macro targets set"
              description="Set up your daily nutrition targets to start tracking calories and protein."
              action={{ label: "Set Up Targets", onClick: () => setShowLogMeal(true) }}
            />
          ) : (
            <div className="space-y-6">
              {/* Dual Ring - Calories (outer) + Protein (inner) */}
              <motion.div
                className="flex justify-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <DualRing
                  calories={progress.calories.current}
                  caloriesTarget={progress.calories.target}
                  protein={progress.protein.current}
                  proteinTarget={progress.protein.target}
                />
              </motion.div>

              {/* Macro Cards Row */}
              <motion.div
                className="grid grid-cols-3 gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {/* Protein */}
                <div className="bg-surface border border-border rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <MiniRing percentage={progress.protein.percentage} />
                    <span className="text-xs text-muted-foreground font-medium">Protein</span>
                  </div>
                  <p className="text-lg font-bold font-mono text-primary">
                    {progress.protein.current}g
                  </p>
                  <p className="text-[10px] text-muted-foreground">/ {progress.protein.target}g</p>
                </div>

                {/* Carbs */}
                <div className="bg-surface border border-border rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <MiniRing percentage={progress.carbs.percentage} />
                    <span className="text-xs text-muted-foreground font-medium">Carbs</span>
                  </div>
                  <p className="text-lg font-bold font-mono text-primary">
                    {progress.carbs.current}g
                  </p>
                  <p className="text-[10px] text-muted-foreground">/ {progress.carbs.target}g</p>
                </div>

                {/* Fats */}
                <div className="bg-surface border border-border rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <MiniRing percentage={progress.fats.percentage} />
                    <span className="text-xs text-muted-foreground font-medium">Fat</span>
                  </div>
                  <p className="text-lg font-bold font-mono text-primary">
                    {progress.fats.current}g
                  </p>
                  <p className="text-[10px] text-muted-foreground">/ {progress.fats.target}g</p>
                </div>
              </motion.div>

              {/* Meals Today */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-sm font-heading font-bold text-foreground mb-3">
                  Meals Today
                </h2>
                {todayMeals.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
                    {[...todayMeals].reverse().map((meal) => (
                      <button
                        key={meal.id}
                        onClick={() => setSelectedMeal(meal)}
                        className={cn(
                          "flex-shrink-0 rounded-lg px-4 py-2 text-left transition-colors group",
                          meal.fromSavedMeal
                            ? "bg-primary/10 border border-primary/30 hover:border-primary/50"
                            : "bg-surface border border-border hover:border-primary/30"
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          {meal.fromSavedMeal && <Bookmark size={12} className="text-primary" />}
                          <p className="text-sm font-medium text-foreground group-hover:text-primary truncate max-w-[100px]">
                            {meal.name}
                          </p>
                        </div>
                        <p className="text-xs text-primary font-mono">{meal.calories} kcal</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Please add meals</p>
                )}
              </motion.div>

              {/* Log Fuel Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  onClick={() => setShowLogMeal(true)}
                  className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-heading uppercase tracking-widest text-base py-5 rounded-xl shadow-[0_0_20px_rgba(212,168,83,0.25)] transition-all hover:shadow-[0_0_30px_rgba(212,168,83,0.35)]"
                  size="lg"
                >
                  Log Fuel
                </Button>
              </motion.div>
            </div>
          )}
        </div>

        {/* Log Meal Sheet */}
        <AnimatePresence>
          {showLogMeal && (
            <LogMealSheet
              onClose={() => setShowLogMeal(false)}
              onLogMeal={handleLogMeal}
              onAddRecentFood={addRecentFood}
              onToggleFavorite={toggleFavoriteFood}
              onSaveMeal={saveMeal}
              onUpdateSavedMeal={updateSavedMeal}
              onDeleteSavedMeal={deleteSavedMeal}
              recentFoods={recentFoods}
              favoriteFoods={favoriteFoods}
              savedMeals={savedMeals}
              targets={targets}
              activityLevel={activityLevel}
              profile={profile}
              onCalculateMacros={calculateMacros}
              setBy={setBy}
            />
          )}
        </AnimatePresence>

        {/* Meal Detail Sheet */}
        <AnimatePresence>
          {selectedMeal && (
            <MealDetailSheet
              meal={selectedMeal}
              onClose={() => setSelectedMeal(null)}
              onDelete={(id) => {
                deleteLoggedMeal(id)
                setSelectedMeal(null)
              }}
              onUpdate={(id, updates) => {
                updateLoggedMeal(id, updates)
                setSelectedMeal(null)
              }}
            />
          )}
        </AnimatePresence>

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
    </AnimatedPage>
  )
}

// Log Meal Sheet - Full screen overlay for logging meals
function LogMealSheet({
  onClose,
  onLogMeal,
  onAddRecentFood,
  onToggleFavorite,
  onSaveMeal,
  onUpdateSavedMeal,
  onDeleteSavedMeal,
  recentFoods,
  favoriteFoods,
  savedMeals,
  targets,
  activityLevel,
  profile,
  onCalculateMacros,
  setBy,
}: {
  onClose: () => void
  onLogMeal: (name: string, macros: { protein: number; carbs: number; fats: number; calories: number }, mealType?: MealType, fromSavedMeal?: boolean) => void
  onAddRecentFood: (food: RecentFood) => void
  onToggleFavorite: (food: RecentFood) => void
  onSaveMeal: (name: string, ingredients: MealIngredient[]) => void
  onUpdateSavedMeal: (id: string, updates: Partial<Omit<SavedMeal, 'id' | 'createdAt' | 'usageCount'>>) => void
  onDeleteSavedMeal: (id: string) => void
  recentFoods: RecentFood[]
  favoriteFoods: RecentFood[]
  savedMeals: SavedMeal[]
  targets: MacroTargets | null
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active'
  profile: { weight?: number; height?: number; age?: number; gender?: Gender; goal?: 'cut' | 'recomp' | 'maintain' | 'bulk' } | null
  onCalculateMacros: (weight: number, height: number, age: number, gender: Gender, goal: 'cut' | 'recomp' | 'maintain' | 'bulk', activity: 'sedentary' | 'light' | 'moderate' | 'active') => void
  setBy: 'self' | 'coach'
}) {
  const [sessionMacros, setSessionMacros] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 })
  const [sessionFoods, setSessionFoods] = useState<MealIngredient[]>([])
  const [showCalculator, setShowCalculator] = useState(false)
  const [showSaveMeal, setShowSaveMeal] = useState(false)
  const [saveMealName, setSaveMealName] = useState('')
  const [selectedSavedMeal, setSelectedSavedMeal] = useState<SavedMeal | null>(null)

  const handleAddFood = (food: { id?: string; name: string; protein: number; carbs: number; fats: number; calories: number; quantity?: number; unit?: 'g' | 'oz' | 'serving' }) => {
    setSessionMacros(prev => ({
      calories: prev.calories + food.calories,
      protein: prev.protein + food.protein,
      carbs: prev.carbs + food.carbs,
      fats: prev.fats + food.fats,
    }))
    const ingredient: MealIngredient = {
      id: food.id || `food-${Date.now()}`,
      name: food.name,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
      calories: food.calories,
      quantity: food.quantity || 1,
      unit: food.unit || 'serving',
    }
    setSessionFoods(prev => [...prev, ingredient])
    toast.success(`${food.name} added`)
  }

  const handleDone = () => {
    // Only log if something was added this session
    if (sessionMacros.calories > 0 || sessionMacros.protein > 0) {
      // Use meal type as name, or combine food names if only 1-2 items
      const foodNames = sessionFoods.map(f => f.name)
      const mealName = foodNames.length <= 2 && foodNames.length > 0
        ? foodNames.join(' + ')
        : 'Meal'
      onLogMeal(mealName, sessionMacros)
      analytics.mealLogged('manual')
    }
    onClose()
    setSessionMacros({ calories: 0, protein: 0, carbs: 0, fats: 0 })
    setSessionFoods([])
  }

  const handleSaveMeal = () => {
    if (sessionFoods.length === 0) {
      toast.warning('Add some foods first')
      return
    }
    if (!saveMealName.trim()) {
      toast.warning('Please enter a meal name')
      return
    }
    onSaveMeal(saveMealName.trim(), sessionFoods)
    toast.success(`"${saveMealName}" saved`)
    setSaveMealName('')
    setShowSaveMeal(false)
  }

  const isFavorite = (foodId: string) => favoriteFoods.some(f => f.id === foodId)

  // If no targets set, show calculator
  if (!targets && !showCalculator) {
    return (
      <motion.div
        className="fixed inset-0 z-50 bg-background"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-border">
            <button onClick={onClose} className="p-2 -ml-2">
              <ChevronLeft size={24} className="text-foreground" />
            </button>
            <h1 className="text-lg font-heading font-bold">Set Targets</h1>
            <div className="w-10" />
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="text-center mb-8">
              <UtensilsCrossed size={48} className="mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-bold mb-2">Set Your Macro Targets</h2>
              <p className="text-muted-foreground">
                Calculate your daily nutrition targets to start tracking.
              </p>
            </div>
            <Button
              onClick={() => setShowCalculator(true)}
              className="w-full"
              size="lg"
            >
              Calculate My Macros
            </Button>
          </div>
        </div>
      </motion.div>
    )
  }

  // Show calculator view
  if (showCalculator || (!targets && setBy !== 'coach')) {
    return (
      <motion.div
        className="fixed inset-0 z-50 bg-background"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-border">
            <button onClick={() => targets ? setShowCalculator(false) : onClose()} className="p-2 -ml-2">
              <ChevronLeft size={24} className="text-foreground" />
            </button>
            <h1 className="text-lg font-heading font-bold">Calculate Macros</h1>
            <div className="w-10" />
          </div>

          <div className="flex-1 overflow-y-auto">
            <CalculatorView
              currentWeight={profile?.weight || 150}
              currentHeight={profile?.height || 70}
              currentAge={profile?.age || 30}
              currentGender={profile?.gender || 'male'}
              currentGoal={profile?.goal || 'maintain'}
              currentActivity={activityLevel}
              targets={targets}
              onCalculate={(w, h, a, g, goal, act) => {
                onCalculateMacros(w, h, a, g, goal, act)
                setShowCalculator(false)
              }}
            />
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-background"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <button onClick={onClose} className="p-2 -ml-2">
            <ChevronLeft size={24} className="text-foreground" />
          </button>
          <h1 className="text-lg font-heading font-bold">Log Fuel</h1>
          <div className="w-10" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Search */}
          <div className="mb-6">
            <FoodSearch
              onSelect={(food) => {
                handleAddFood({
                  name: food.name,
                  protein: food.protein,
                  carbs: food.carbs,
                  fats: food.fats,
                  calories: food.calories,
                })
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
              }}
            />
          </div>

          {/* Recent Foods */}
          {recentFoods.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold text-foreground mb-3">Recent Foods</h2>
              <div className="space-y-2">
                {recentFoods.slice(0, 5).map((food) => (
                  <div
                    key={`${food.id}-${food.loggedAt}`}
                    className="flex items-center justify-between py-3 border-b border-border/50"
                  >
                    <button
                      onClick={() => onToggleFavorite(food)}
                      className="p-1 mr-2"
                    >
                      <Heart
                        size={18}
                        className={isFavorite(food.id) ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}
                      />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{food.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {food.servingDescription || '1 serving'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        P: {food.protein}g  C: {food.carbs}g  F: {food.fats}g
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-primary font-mono">{food.calories} kcal</span>
                      <button
                        onClick={() => {
                          handleAddFood(food)
                          onAddRecentFood({ ...food, loggedAt: Date.now() })
                        }}
                        className="w-8 h-8 rounded-full border border-primary/50 flex items-center justify-center hover:bg-primary/10 transition-colors"
                      >
                        <Plus size={18} className="text-primary" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Favorites */}
          {favoriteFoods.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold text-foreground mb-3">Favorites</h2>
              <div className="space-y-2">
                {favoriteFoods.slice(0, 5).map((food) => (
                  <div
                    key={food.id}
                    className="flex items-center justify-between py-3 border-b border-border/50"
                  >
                    <button
                      onClick={() => onToggleFavorite(food)}
                      className="p-1 mr-2"
                    >
                      <Heart size={18} className="text-red-500 fill-red-500" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{food.name}</p>
                      <p className="text-xs text-muted-foreground">
                        P: {food.protein}g  C: {food.carbs}g  F: {food.fats}g
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-primary font-mono">{food.calories} kcal</span>
                      <button
                        onClick={() => handleAddFood(food)}
                        className="w-8 h-8 rounded-full border border-primary/50 flex items-center justify-center hover:bg-primary/10 transition-colors"
                      >
                        <Plus size={18} className="text-primary" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Saved Meals */}
          {savedMeals.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold text-foreground mb-3">Saved Meals</h2>
              <div className="space-y-2">
                {savedMeals.slice(0, 5).map((meal) => (
                  <div
                    key={meal.id}
                    className="flex items-center justify-between py-3 border-b border-border/50"
                  >
                    <button
                      onClick={() => setSelectedSavedMeal(meal)}
                      className="p-1 mr-2"
                    >
                      <Pencil size={16} className="text-muted-foreground" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{meal.name}</p>
                      <p className="text-xs text-muted-foreground">
                        P: {meal.protein}g  C: {meal.carbs}g  F: {meal.fats}g
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-primary font-mono">{meal.calories} kcal</span>
                      <button
                        onClick={() => {
                          onLogMeal(meal.name, { protein: meal.protein, carbs: meal.carbs, fats: meal.fats, calories: meal.calories }, undefined, true)
                          toast.success(`${meal.name} logged`)
                        }}
                        className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center hover:bg-primary/30 transition-colors"
                      >
                        <Plus size={18} className="text-primary" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Manual Entry */}
          <QuickLogSection onLogMeal={handleAddFood} />
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border bg-surface px-4 py-3 pb-24">
          {/* Session totals */}
          <div className="grid grid-cols-4 gap-4 mb-3">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase">Calories</p>
              <p className="text-sm font-bold font-mono">{sessionMacros.calories}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase">Protein</p>
              <p className="text-sm font-bold font-mono">{sessionMacros.protein}g</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase">Carbs</p>
              <p className="text-sm font-bold font-mono">{sessionMacros.carbs}g</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase">Fat</p>
              <p className="text-sm font-bold font-mono">{sessionMacros.fats}g</p>
            </div>
          </div>
          {/* Buttons */}
          <div className="flex gap-2">
            {sessionFoods.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowSaveMeal(true)}
                className="flex-1"
              >
                <Bookmark size={16} className="mr-2" />
                Save Meal
              </Button>
            )}
            <Button
              onClick={handleDone}
              className={cn(
                "bg-primary hover:bg-primary-hover",
                sessionFoods.length > 0 ? "flex-1" : "w-full"
              )}
            >
              Done
            </Button>
          </div>
        </div>

        {/* Save Meal Modal */}
        <AnimatePresence>
          {showSaveMeal && (
            <motion.div
              className="fixed inset-0 z-[60] flex items-center justify-center px-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-black/60" onClick={() => setShowSaveMeal(false)} />
              <motion.div
                className="relative bg-surface border border-border rounded-xl p-6 w-full max-w-sm"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <h3 className="text-lg font-heading font-bold mb-2">Save as Meal</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Save these {sessionFoods.length} items as a meal to quickly add again later.
                </p>
                <Input
                  value={saveMealName}
                  onChange={(e) => setSaveMealName(e.target.value)}
                  placeholder="Meal name (e.g., Post-Workout Shake)"
                  className="mb-4"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowSaveMeal(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-primary hover:bg-primary-hover disabled:opacity-50"
                    onClick={handleSaveMeal}
                    disabled={!saveMealName.trim()}
                  >
                    Save
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Saved Meal Detail Sheet */}
        <AnimatePresence>
          {selectedSavedMeal && (
            <SavedMealDetailSheet
              meal={selectedSavedMeal}
              onClose={() => setSelectedSavedMeal(null)}
              onUpdate={(id, updates) => {
                onUpdateSavedMeal(id, updates)
                setSelectedSavedMeal(null)
              }}
              onDelete={(id) => {
                onDeleteSavedMeal(id)
                setSelectedSavedMeal(null)
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// Quick Log Section for manual entry
function QuickLogSection({ onLogMeal }: { onLogMeal: (food: { name: string; protein: number; carbs: number; fats: number; calories: number }) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [quickLog, setQuickLog] = useState({ name: '', protein: '', calories: '', carbs: '', fats: '' })

  const handleQuickLog = () => {
    const proteinVal = Number(quickLog.protein) || 0
    const caloriesVal = Number(quickLog.calories) || 0
    const carbsVal = Number(quickLog.carbs) || 0
    const fatsVal = Number(quickLog.fats) || 0

    if (proteinVal === 0 && caloriesVal === 0 && carbsVal === 0 && fatsVal === 0) {
      toast.warning('Please enter at least one value')
      return
    }

    const name = quickLog.name.trim() || 'Quick Log'
    onLogMeal({
      name,
      protein: proteinVal,
      carbs: carbsVal,
      fats: fatsVal,
      calories: caloriesVal,
    })
    setQuickLog({ name: '', protein: '', calories: '', carbs: '', fats: '' })
    setExpanded(false)
  }

  return (
    <div className="mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full py-3"
      >
        <span className="text-sm font-bold text-foreground">Manual Entry</span>
        <ChevronDown size={18} className={cn('text-muted-foreground transition-transform', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-3 pt-2"
        >
          <Input
            type="text"
            value={quickLog.name}
            onChange={(e) => setQuickLog(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Meal name"
            className="bg-surface"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Protein (g)</label>
              <Input
                type="number"
                value={quickLog.protein}
                onChange={(e) => setQuickLog(prev => ({ ...prev, protein: e.target.value }))}
                placeholder="0"
                className="font-mono bg-surface"
                data-testid="macros-food-search-input"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Calories</label>
              <Input
                type="number"
                value={quickLog.calories}
                onChange={(e) => setQuickLog(prev => ({ ...prev, calories: e.target.value }))}
                placeholder="0"
                className="font-mono bg-surface"
                data-testid="macros-calories-input"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Carbs (g)</label>
              <Input
                type="number"
                value={quickLog.carbs}
                onChange={(e) => setQuickLog(prev => ({ ...prev, carbs: e.target.value }))}
                placeholder="0"
                className="font-mono bg-surface"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Fat (g)</label>
              <Input
                type="number"
                value={quickLog.fats}
                onChange={(e) => setQuickLog(prev => ({ ...prev, fats: e.target.value }))}
                placeholder="0"
                className="font-mono bg-surface"
              />
            </div>
          </div>
          <Button
            onClick={handleQuickLog}
            className="w-full"
            data-testid="macros-add-meal-button"
          >
            Add Entry
          </Button>
        </motion.div>
      )}
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

// Meal Detail Sheet - View/Edit/Delete a logged meal
function MealDetailSheet({
  meal,
  onClose,
  onDelete,
  onUpdate,
}: {
  meal: LoggedMeal
  onClose: () => void
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<Omit<LoggedMeal, 'id' | 'timestamp'>>) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValues, setEditValues] = useState({
    name: meal.name,
    calories: String(meal.calories),
    protein: String(meal.protein),
    carbs: String(meal.carbs),
    fats: String(meal.fats),
  })

  const handleSave = () => {
    onUpdate(meal.id, {
      name: editValues.name.trim() || meal.name,
      calories: Number(editValues.calories) || 0,
      protein: Number(editValues.protein) || 0,
      carbs: Number(editValues.carbs) || 0,
      fats: Number(editValues.fats) || 0,
    })
  }

  const handleDelete = async () => {
    if (await confirmAction('Delete this meal?', 'Delete')) {
      onDelete(meal.id)
    }
  }

  const loggedTime = new Date(meal.timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Sheet */}
      <motion.div
        className="relative w-full max-w-lg bg-surface border-t border-border rounded-t-2xl"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        <div className="px-6 pb-24">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            {isEditing ? (
              <Input
                value={editValues.name}
                onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))}
                className="text-lg font-bold bg-surface-elevated"
                autoFocus
              />
            ) : (
              <div>
                <h2 className="text-lg font-heading font-bold text-foreground">{meal.name}</h2>
                <p className="text-xs text-muted-foreground">Logged at {loggedTime}</p>
              </div>
            )}
            <button onClick={onClose} className="p-2 -mr-2">
              <X size={20} className="text-muted-foreground" />
            </button>
          </div>

          {/* Macros */}
          {isEditing ? (
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Calories</label>
                <Input
                  type="number"
                  value={editValues.calories}
                  onChange={(e) => setEditValues(prev => ({ ...prev, calories: e.target.value }))}
                  className="font-mono bg-surface-elevated"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Protein (g)</label>
                <Input
                  type="number"
                  value={editValues.protein}
                  onChange={(e) => setEditValues(prev => ({ ...prev, protein: e.target.value }))}
                  className="font-mono bg-surface-elevated"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Carbs (g)</label>
                <Input
                  type="number"
                  value={editValues.carbs}
                  onChange={(e) => setEditValues(prev => ({ ...prev, carbs: e.target.value }))}
                  className="font-mono bg-surface-elevated"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Fat (g)</label>
                <Input
                  type="number"
                  value={editValues.fats}
                  onChange={(e) => setEditValues(prev => ({ ...prev, fats: e.target.value }))}
                  className="font-mono bg-surface-elevated"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="bg-surface-elevated rounded-lg p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase mb-1">Calories</p>
                <p className="text-lg font-bold font-mono text-primary">{meal.calories}</p>
              </div>
              <div className="bg-surface-elevated rounded-lg p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase mb-1">Protein</p>
                <p className="text-lg font-bold font-mono">{meal.protein}g</p>
              </div>
              <div className="bg-surface-elevated rounded-lg p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase mb-1">Carbs</p>
                <p className="text-lg font-bold font-mono">{meal.carbs}g</p>
              </div>
              <div className="bg-surface-elevated rounded-lg p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase mb-1">Fat</p>
                <p className="text-lg font-bold font-mono">{meal.fats}g</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsEditing(false)
                    setEditValues({
                      name: meal.name,
                      calories: String(meal.calories),
                      protein: String(meal.protein),
                      carbs: String(meal.carbs),
                      fats: String(meal.fats),
                    })
                  }}
                >
                  Cancel
                </Button>
                <Button className="flex-1 bg-primary hover:bg-primary-hover" onClick={handleSave}>
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className={meal.fromSavedMeal ? "w-full border-destructive/50 text-destructive hover:bg-destructive/10" : "flex-1 border-destructive/50 text-destructive hover:bg-destructive/10"}
                  onClick={handleDelete}
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete
                </Button>
                {!meal.fromSavedMeal && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                )}
              </>
            )}
          </div>
          {meal.fromSavedMeal && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              This meal was logged from a saved meal preset
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// Saved Meal Detail Sheet - View/Edit/Delete a saved meal
function SavedMealDetailSheet({
  meal,
  onClose,
  onUpdate,
  onDelete,
}: {
  meal: SavedMeal
  onClose: () => void
  onUpdate: (id: string, updates: Partial<Omit<SavedMeal, 'id' | 'createdAt' | 'usageCount'>>) => void
  onDelete: (id: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(meal.name)
  const [editIngredients, setEditIngredients] = useState<MealIngredient[]>(meal.ingredients)
  const [showAddIngredient, setShowAddIngredient] = useState(false)
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
  })

  // Calculate totals from ingredients
  const totals = editIngredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + ing.calories,
      protein: acc.protein + ing.protein,
      carbs: acc.carbs + ing.carbs,
      fats: acc.fats + ing.fats,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  )

  const handleUpdateIngredientQuantity = (index: number, newQuantity: number) => {
    setEditIngredients(prev => prev.map((ing, i) => {
      if (i !== index) return ing
      const ratio = ing.quantity > 0 ? newQuantity / ing.quantity : 1
      return {
        ...ing,
        quantity: newQuantity,
        calories: Math.round(ing.calories * ratio),
        protein: Math.round(ing.protein * ratio),
        carbs: Math.round(ing.carbs * ratio),
        fats: Math.round(ing.fats * ratio),
      }
    }))
  }

  const handleRemoveIngredient = (index: number) => {
    setEditIngredients(prev => prev.filter((_, i) => i !== index))
  }

  const handleAddIngredient = () => {
    if (!newIngredient.name.trim()) {
      toast.warning('Please enter ingredient name')
      return
    }
    const ingredient: MealIngredient = {
      id: `ing-${Date.now()}`,
      name: newIngredient.name.trim(),
      quantity: 1,
      unit: 'serving',
      calories: Number(newIngredient.calories) || 0,
      protein: Number(newIngredient.protein) || 0,
      carbs: Number(newIngredient.carbs) || 0,
      fats: Number(newIngredient.fats) || 0,
    }
    setEditIngredients(prev => [...prev, ingredient])
    setNewIngredient({ name: '', calories: '', protein: '', carbs: '', fats: '' })
    setShowAddIngredient(false)
  }

  const handleSave = () => {
    onUpdate(meal.id, {
      name: editName.trim() || meal.name,
      ingredients: editIngredients,
      ...totals,
    })
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditName(meal.name)
    setEditIngredients(meal.ingredients)
    setShowAddIngredient(false)
  }

  const handleDelete = async () => {
    if (await confirmAction('Delete this saved meal?', 'Delete')) {
      onDelete(meal.id)
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Sheet */}
      <motion.div
        className="relative w-full max-w-lg bg-surface border-t border-border rounded-t-2xl max-h-[85vh] flex flex-col"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        <div className="px-6 pb-24 overflow-y-auto flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            {isEditing ? (
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-lg font-bold bg-surface-elevated"
              />
            ) : (
              <div>
                <h2 className="text-lg font-heading font-bold text-foreground">{meal.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {meal.ingredients.length} item{meal.ingredients.length !== 1 ? 's' : ''} · Used {meal.usageCount} time{meal.usageCount !== 1 ? 's' : ''}
                </p>
              </div>
            )}
            <button onClick={onClose} className="p-2 -mr-2">
              <X size={20} className="text-muted-foreground" />
            </button>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-surface-elevated rounded-lg p-2 text-center">
              <p className="text-[9px] text-muted-foreground uppercase">Cal</p>
              <p className="text-sm font-bold font-mono text-primary">{isEditing ? totals.calories : meal.calories}</p>
            </div>
            <div className="bg-surface-elevated rounded-lg p-2 text-center">
              <p className="text-[9px] text-muted-foreground uppercase">Protein</p>
              <p className="text-sm font-bold font-mono">{isEditing ? totals.protein : meal.protein}g</p>
            </div>
            <div className="bg-surface-elevated rounded-lg p-2 text-center">
              <p className="text-[9px] text-muted-foreground uppercase">Carbs</p>
              <p className="text-sm font-bold font-mono">{isEditing ? totals.carbs : meal.carbs}g</p>
            </div>
            <div className="bg-surface-elevated rounded-lg p-2 text-center">
              <p className="text-[9px] text-muted-foreground uppercase">Fat</p>
              <p className="text-sm font-bold font-mono">{isEditing ? totals.fats : meal.fats}g</p>
            </div>
          </div>

          {/* Ingredients list */}
          <div className="mb-4">
            <p className="text-xs text-muted-foreground uppercase mb-2">Ingredients</p>
            {isEditing ? (
              <div className="space-y-2">
                {editIngredients.map((ing, i) => (
                  <div key={ing.id} className="flex items-center gap-2 bg-surface-elevated rounded-lg p-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{ing.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ing.calories} kcal · P:{ing.protein}g
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={ing.quantity}
                        onChange={(e) => handleUpdateIngredientQuantity(i, Number(e.target.value) || 0)}
                        className="w-14 h-8 text-center font-mono text-sm p-1"
                        min={0}
                        step={0.5}
                      />
                      <span className="text-xs text-muted-foreground w-12">{ing.unit}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveIngredient(i)}
                      className="p-1 text-muted-foreground hover:text-destructive"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}

                {/* Add ingredient form */}
                {showAddIngredient ? (
                  <div className="border border-border rounded-lg p-3 space-y-2">
                    <Input
                      value={newIngredient.name}
                      onChange={(e) => setNewIngredient(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ingredient name"
                      className="bg-surface"
                      autoFocus
                    />
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-[9px] text-muted-foreground">Cal</label>
                        <Input
                          type="number"
                          value={newIngredient.calories}
                          onChange={(e) => setNewIngredient(prev => ({ ...prev, calories: e.target.value }))}
                          className="h-8 text-sm font-mono"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-muted-foreground">Protein</label>
                        <Input
                          type="number"
                          value={newIngredient.protein}
                          onChange={(e) => setNewIngredient(prev => ({ ...prev, protein: e.target.value }))}
                          className="h-8 text-sm font-mono"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-muted-foreground">Carbs</label>
                        <Input
                          type="number"
                          value={newIngredient.carbs}
                          onChange={(e) => setNewIngredient(prev => ({ ...prev, carbs: e.target.value }))}
                          className="h-8 text-sm font-mono"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-muted-foreground">Fat</label>
                        <Input
                          type="number"
                          value={newIngredient.fats}
                          onChange={(e) => setNewIngredient(prev => ({ ...prev, fats: e.target.value }))}
                          className="h-8 text-sm font-mono"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setShowAddIngredient(false)
                          setNewIngredient({ name: '', calories: '', protein: '', carbs: '', fats: '' })
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-primary hover:bg-primary-hover"
                        onClick={handleAddIngredient}
                        disabled={!newIngredient.name.trim()}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddIngredient(true)}
                    className="w-full py-2 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus size={16} />
                    Add Ingredient
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {meal.ingredients.length > 0 ? (
                  meal.ingredients.map((ing, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span className="text-foreground">{ing.quantity} {ing.unit} {ing.name}</span>
                      <span className="text-muted-foreground">{ing.calories} kcal</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No ingredients</p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <Button variant="outline" className="flex-1" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary-hover"
                  onClick={handleSave}
                  disabled={editIngredients.length === 0}
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10"
                  onClick={handleDelete}
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

