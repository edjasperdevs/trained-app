import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getLocalDateString } from '../lib/dateUtils'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'

export interface FoodPreferences {
    cuisines: string[]
    dietary_restrictions: string[]
    liked_foods: string[]
    disliked_foods: string[]
    allergies: string[]
}

export interface AIMeal {
    name: string
    protein: number
    carbs: number
    fats: number
    calories: number
    ingredients: { name: string; amount: string }[]
    instructions: string
}

export interface AIMealPlan {
    id: string
    date: string
    meals: AIMeal[]
    status: 'active' | 'archived'
    user_rating?: number
}

interface MealPlanStore {
    preferences: FoodPreferences
    currentPlan: AIMealPlan | null
    isGenerating: boolean
    isRefining: string | null // meal index if currently refining

    // Actions
    updatePreferences: (updates: Partial<FoodPreferences>) => void
    savePreferences: () => Promise<void>
    fetchPlanForToday: () => Promise<void>
    generatePlan: () => Promise<void>
    swapMeal: (mealIndex: number, comments: string) => Promise<void>
    rateMealPlan: (rating: number) => Promise<void>
    logMealFromPlan: (mealIndex: number) => Promise<void>
}

const DEFAULT_PREFS: FoodPreferences = {
    cuisines: [],
    dietary_restrictions: [],
    liked_foods: [],
    disliked_foods: [],
    allergies: []
}

export const useMealPlanStore = create<MealPlanStore>()(
    persist(
        (set, get) => ({
            preferences: DEFAULT_PREFS,
            currentPlan: null,
            isGenerating: false,
            isRefining: null,

            updatePreferences: (updates) => {
                set((state) => ({
                    preferences: { ...state.preferences, ...updates }
                }))
            },

            savePreferences: async () => {
                try {
                    if (!supabase) throw new Error('Supabase not connected')
                    const { data: { user } } = await supabase.auth.getUser()
                    if (!user) throw new Error('Not logged in')

                    const prefs = get().preferences

                    const { error } = await (supabase as any).from('user_food_preferences').upsert({
                        user_id: user.id,
                        ...prefs,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id' })

                    if (error) throw error
                    toast.success('Food preferences saved')
                } catch (error: any) {
                    console.error('Error saving preferences:', error)
                    toast.error(error.message || 'Failed to save preferences')
                }
            },

            fetchPlanForToday: async () => {
                try {
                    if (!supabase) return
                    const today = getLocalDateString()
                    const { data, error } = await (supabase as any).from('ai_meal_plans')
                        .select('*')
                        .eq('date', today)
                        .maybeSingle()

                    if (error) throw error

                    if (data) {
                        set({ currentPlan: data as AIMealPlan })
                    } else {
                        set({ currentPlan: null })
                    }
                } catch (error) {
                    console.error('Failed to fetch plan:', error)
                }
            },

            generatePlan: async () => {
                set({ isGenerating: true })
                try {
                    if (!supabase) throw new Error('Supabase not connected')
                    const { data: { session } } = await supabase.auth.getSession()
                    if (!session) throw new Error('Not authenticated')

                    // Using supabase.functions.invoke doesn't always handle full custom fetch well depending on setup
                    // but we can just use functions.invoke if the edge function is deployed.
                    // For local development, assuming functions are running:
                    const { data, error } = await supabase.functions.invoke('generate-meal-plan')

                    if (error) throw new Error(error.message || 'Error generating plan')
                    if (!data || !data.meals) throw new Error('Invalid plan format received')

                    const today = getLocalDateString()
                    const { data: { user } } = await supabase.auth.getUser()

                    // Save to DB
                    const { data: savedPlan, error: saveError } = await (supabase as any).from('ai_meal_plans')
                        .upsert({
                            user_id: user?.id,
                            date: today,
                            meals: data.meals,
                            status: 'active'
                        }, { onConflict: 'user_id,date' })
                        .select()
                        .single()

                    if (saveError) throw saveError

                    set({ currentPlan: savedPlan as AIMealPlan })
                    toast.success('New meal plan generated!')
                } catch (error: any) {
                    console.error('Failed to generate plan:', error)
                    toast.error(error.message || 'Failed to generate meal plan')
                } finally {
                    set({ isGenerating: false })
                }
            },

            swapMeal: async (mealIndex, comments) => {
                const plan = get().currentPlan
                if (!plan || !supabase) return

                set({ isRefining: mealIndex.toString() })
                try {
                    const { data, error } = await supabase.functions.invoke('refine-meal-plan', {
                        body: { planId: plan.id, mealIndex, comments }
                    })

                    if (error) throw new Error(error.message || 'Error refining meal')

                    set({ currentPlan: { ...plan, meals: data.updated_meals } })
                    toast.success('Meal swapped successfully')
                } catch (error: any) {
                    console.error('Failed to swap meal:', error)
                    toast.error(error.message || 'Failed to swap meal')
                } finally {
                    set({ isRefining: null })
                }
            },

            rateMealPlan: async (rating) => {
                const plan = get().currentPlan
                if (!plan || !supabase) return

                try {
                    const { error } = await (supabase as any).from('ai_meal_plans')
                        .update({ user_rating: rating })
                        .eq('id', plan.id)

                    if (error) throw error

                    set({ currentPlan: { ...plan, user_rating: rating } })
                    toast.success('Thanks for your feedback!')
                } catch (error: any) {
                    console.error('Failed to rate plan:', error)
                    toast.error('Failed to save rating')
                }
            },

            logMealFromPlan: async (mealIndex: number) => {
                const plan = get().currentPlan
                if (!plan || !plan.meals[mealIndex] || !supabase) return

                const meal = plan.meals[mealIndex]
                const today = getLocalDateString()

                try {
                    const { data: { user } } = await supabase.auth.getUser()
                    if (!user) throw new Error('Not logged in')

                    const { error } = await supabase.from('logged_meals').insert({
                        user_id: user.id,
                        date: today,
                        name: meal.name,
                        protein: meal.protein,
                        carbs: meal.carbs,
                        fats: meal.fats,
                        calories: meal.calories
                    })

                    if (error) throw error

                    // Use macroStore to refresh daily logs (we can import it in components that trigger this)
                    toast.success(`${meal.name} added to your macros!`)
                } catch (error: any) {
                    console.error('Failed to log meal:', error)
                    toast.error(error.message || 'Failed to log meal')
                }
            }
        }),
        {
            name: 'welltrained-meal-plan',
            partialize: (state) => ({ preferences: state.preferences }),
        }
    )
)
