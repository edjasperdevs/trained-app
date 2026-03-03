import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Utensils, RefreshCw, Settings, Check, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react'
import { useMealPlanStore, AIMeal } from '@/stores/mealPlanStore'
import { AnimatedPage, FoodPreferences } from '@/components'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/cn'

export function MealPlanScreen() {
    const { currentPlan, isGenerating, isRefining, generatePlan, fetchPlanForToday, swapMeal, rateMealPlan, logMealFromPlan } = useMealPlanStore()
    const [showSettings, setShowSettings] = useState(false)
    const [activeSwapIndex, setActiveSwapIndex] = useState<number | null>(null)
    const [swapFeedback, setSwapFeedback] = useState('')

    useEffect(() => {
        fetchPlanForToday()
    }, [fetchPlanForToday])

    const handleSwapRequest = async (index: number) => {
        if (!swapFeedback.trim()) return
        await swapMeal(index, swapFeedback)
        setActiveSwapIndex(null)
        setSwapFeedback('')
    }

    return (
        <AnimatedPage className="min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border px-4 py-4 safe-top flex items-center justify-between">
                <h1 className="text-2xl font-black italic tracking-tight text-foreground uppercase flex items-center gap-2">
                    Protocol AI <span className="text-primary"><Utensils size={20} /></span>
                </h1>
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={cn("p-2 rounded-full transition-colors", showSettings ? "bg-surface-highlight text-primary" : "text-muted-foreground hover:bg-surface")}
                >
                    <Settings size={20} />
                </button>
            </header>

            <main className="p-4 space-y-6 max-w-xl mx-auto">
                <AnimatePresence mode="wait">
                    {showSettings ? (
                        <motion.div
                            key="settings"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <div className="mb-4">
                                <h2 className="text-xl font-bold text-foreground">Dietary Strategy</h2>
                                <p className="text-muted-foreground text-sm">Tune the AI to match your exact protocol needs.</p>
                            </div>
                            <FoodPreferences onComplete={() => setShowSettings(false)} />
                        </motion.div>
                    ) : !currentPlan ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex flex-col items-center justify-center py-20 text-center space-y-6"
                        >
                            <div className="w-20 h-20 rounded-full bg-surface border border-border flex items-center justify-center">
                                <Utensils size={32} className="text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-foreground">No Protocol Generated</h2>
                                <p className="text-muted-foreground max-w-[280px]">
                                    Let the AI construct a daily meal plan that perfectly hits your macro targets.
                                </p>
                            </div>
                            <Button
                                onClick={generatePlan}
                                className="w-full text-lg font-bold shadow-glow-primary hover:shadow-glow-primary-lg h-14"
                                disabled={isGenerating}
                            >
                                {isGenerating ? (
                                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <Utensils className="mr-2 h-5 w-5" />
                                )}
                                {isGenerating ? 'Structuring Protocol...' : 'Generate Protocol'}
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="plan"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">Today's Protocol</h2>
                                    <p className="text-sm text-primary font-medium">{new Date(currentPlan.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={generatePlan}
                                    disabled={isGenerating}
                                    className="gap-2 bg-surface hover:bg-surface-highlight border-border"
                                >
                                    <RefreshCw size={14} className={cn(isGenerating && "animate-spin")} />
                                    Reroll
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {currentPlan.meals.map((meal, index) => (
                                    <MealCard
                                        key={`${currentPlan.id}-${index}`}
                                        meal={meal}
                                        index={index}
                                        isRefining={isRefining === index.toString()}
                                        activeSwapIndex={activeSwapIndex}
                                        setActiveSwapIndex={setActiveSwapIndex}
                                        swapFeedback={swapFeedback}
                                        setSwapFeedback={setSwapFeedback}
                                        handleSwapRequest={() => handleSwapRequest(index)}
                                        logMealFromPlan={() => logMealFromPlan(index)}
                                    />
                                ))}
                            </div>

                            {/* Rating Section */}
                            <div className="pt-6 border-t border-border flex flex-col items-center gap-4">
                                <p className="text-sm font-medium text-muted-foreground">How is today's protocol?</p>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => rateMealPlan(5)}
                                        className={cn(
                                            "p-4 rounded-full border transition-all",
                                            currentPlan.user_rating === 5 ? "bg-primary/20 border-primary text-primary" : "bg-surface border-border text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <ThumbsUp size={24} />
                                    </button>
                                    <button
                                        onClick={() => rateMealPlan(1)}
                                        className={cn(
                                            "p-4 rounded-full border transition-all",
                                            currentPlan.user_rating === 1 ? "bg-destructive/20 border-destructive text-destructive" : "bg-surface border-border text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <ThumbsDown size={24} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </AnimatedPage>
    )
}

function MealCard({
    meal,
    index,
    isRefining,
    activeSwapIndex,
    setActiveSwapIndex,
    swapFeedback,
    setSwapFeedback,
    handleSwapRequest,
    logMealFromPlan
}: {
    meal: AIMeal,
    index: number,
    isRefining: boolean,
    activeSwapIndex: number | null,
    setActiveSwapIndex: (i: number | null) => void,
    swapFeedback: string,
    setSwapFeedback: (s: string) => void,
    handleSwapRequest: () => void,
    logMealFromPlan: () => void
}) {
    const [isLogged, setIsLogged] = useState(false)

    const handleLog = () => {
        logMealFromPlan()
        setIsLogged(true)
    }

    return (
        <Card className="p-0 overflow-hidden relative border-border bg-card shadow-lg hover:shadow-xl transition-shadow duration-300">
            {isRefining && (
                <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
                    <RefreshCw className="h-8 w-8 text-primary animate-spin mb-2" />
                    <p className="text-sm font-semibold text-foreground">Refining Protocol...</p>
                </div>
            )}

            <div className="p-5 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-foreground leading-tight">{meal.name}</h3>
                    <div className="flex items-center gap-1 bg-surface py-1 px-2 rounded text-xs font-mono font-bold text-foreground border border-border whitespace-nowrap">
                        {meal.calories} kcal
                    </div>
                </div>

                {/* Macros */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-border/50">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Prot</span>
                        <span className="text-sm font-bold text-foreground">{meal.protein}g</span>
                    </div>
                    <div className="flex flex-col border-x border-border/50 px-2">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Carbs</span>
                        <span className="text-sm font-bold text-foreground">{meal.carbs}g</span>
                    </div>
                    <div className="flex flex-col pl-2">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Fats</span>
                        <span className="text-sm font-bold text-foreground">{meal.fats}g</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-2">
                    {activeSwapIndex === index ? (
                        <div className="flex flex-col gap-2 w-full animate-in fade-in slide-in-from-top-2">
                            <input
                                type="text"
                                autoFocus
                                placeholder="Why replace? e.g. 'No chicken', 'Too complex'"
                                value={swapFeedback}
                                onChange={(e) => setSwapFeedback(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSwapRequest()
                                    if (e.key === 'Escape') setActiveSwapIndex(null)
                                }}
                                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                            />
                            <div className="flex justify-end gap-2 text-xs">
                                <button
                                    onClick={() => setActiveSwapIndex(null)}
                                    className="px-3 py-1.5 rounded-md text-muted-foreground hover:bg-surface transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSwapRequest}
                                    disabled={!swapFeedback.trim()}
                                    className="px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground font-bold disabled:opacity-50"
                                >
                                    Swap Meal
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                className={cn("flex-1 h-10 border-border text-xs bg-surface hover:bg-surface-highlight", isLogged && "border-primary text-primary")}
                                onClick={handleLog}
                                disabled={isLogged}
                            >
                                {isLogged ? <><Check size={14} className="mr-1.5" /> Logged</> : 'Quick Log'}
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 h-10 border-border text-xs bg-surface hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                                onClick={() => setActiveSwapIndex(index)}
                            >
                                <MessageSquare size={14} className="mr-1.5" /> Swap
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Drawer Handle for details (Optional MVP feature, could just show ingredients below) */}
            <div className="bg-surface/50 border-t border-border p-3 text-xs w-full text-left">
                <details className="group cursor-pointer">
                    <summary className="font-semibold text-muted-foreground group-hover:text-foreground transition-colors list-none flex justify-between items-center">
                        View Ingredients & Prep
                        <span className="text-primary group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="mt-3 space-y-3 pt-3 border-t border-border/30">
                        <div>
                            <h4 className="font-bold text-foreground mb-1">Ingredients:</h4>
                            <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                                {meal.ingredients.map((ing, i) => (
                                    <li key={i}>{ing.amount} {ing.name}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-foreground mb-1">Instructions:</h4>
                            <p className="text-muted-foreground leading-relaxed">
                                {meal.instructions}
                            </p>
                        </div>
                    </div>
                </details>
            </div>
        </Card>
    )
}
