import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Info, Plus, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useMealPlanStore, FoodPreferences as FPType } from '@/stores/mealPlanStore'
import { Button } from '@/components/ui/button'

const COMMON_CUISINES = ['American', 'Italian', 'Mexican', 'Asian', 'Mediterranean', 'Indian', 'Vegan', 'Keto', 'Paleo']
const COMMON_RESTRICTIONS = ['None', 'Vegetarian', 'Vegan', 'Pescatarian', 'Dairy-Free', 'Gluten-Free', 'Nut-Free']

interface FoodPrefsProps {
    onComplete?: () => void
}

export function FoodPreferences({ onComplete }: FoodPrefsProps) {
    const { preferences, updatePreferences, savePreferences } = useMealPlanStore()

    // Local state for tags
    const [likedInput, setLikedInput] = useState('')
    const [dislikedInput, setDislikedInput] = useState('')
    const [allergyInput, setAllergyInput] = useState('')

    const handleToggle = (field: 'cuisines' | 'dietary_restrictions', value: string) => {
        const current = preferences[field]
        if (field === 'dietary_restrictions' && value === 'None') {
            updatePreferences({ [field]: ['None'] })
            return
        }

        let next: string[]
        if (current.includes(value)) {
            next = current.filter(item => item !== value)
        } else {
            next = field === 'dietary_restrictions'
                ? [...current.filter(item => item !== 'None'), value]
                : [...current, value]
        }
        updatePreferences({ [field]: next })
    }

    const handleAddTag = (e: React.KeyboardEvent, field: 'liked_foods' | 'disliked_foods' | 'allergies', value: string, setter: (v: string) => void) => {
        if (e.key === 'Enter' && value.trim()) {
            e.preventDefault()
            const current = preferences[field]
            if (!current.includes(value.trim())) {
                updatePreferences({ [field]: [...current, value.trim()] })
            }
            setter('')
        }
    }

    const handleRemoveTag = (field: 'liked_foods' | 'disliked_foods' | 'allergies', value: string) => {
        updatePreferences({ [field]: preferences[field].filter(item => item !== value) })
    }

    const handleSave = async () => {
        await savePreferences()
        if (onComplete) onComplete()
    }

    return (
        <div className="space-y-8 pb-8">
            {/* Cuisines & Diet */}
            <section className="space-y-4">
                <div>
                    <h3 className="text-lg font-bold text-foreground">Preferred Cuisines & Diets</h3>
                    <p className="text-sm text-muted-foreground">Select all that apply.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {COMMON_CUISINES.map(cuisine => (
                        <button
                            key={cuisine}
                            onClick={() => handleToggle('cuisines', cuisine)}
                            className={cn(
                                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
                                preferences.cuisines.includes(cuisine)
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-surface border-border text-foreground hover:bg-surface-highlight"
                            )}
                        >
                            {cuisine}
                        </button>
                    ))}
                </div>
            </section>

            {/* Restrictions */}
            <section className="space-y-4">
                <div>
                    <h3 className="text-lg font-bold text-foreground">Dietary Restrictions</h3>
                    <p className="text-sm text-muted-foreground">Tap to select.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {COMMON_RESTRICTIONS.map(restriction => (
                        <button
                            key={restriction}
                            onClick={() => handleToggle('dietary_restrictions', restriction)}
                            className={cn(
                                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
                                preferences.dietary_restrictions.includes(restriction) || (restriction === 'None' && preferences.dietary_restrictions.length === 0)
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-surface border-border text-foreground hover:bg-surface-highlight"
                            )}
                        >
                            {restriction}
                        </button>
                    ))}
                </div>
            </section>

            {/* Custom Inputs: Liked, Disliked, Allergies */}
            <section className="space-y-6">
                {/* Liked Foods */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        Foods you LOVE <Info size={14} className="text-muted-foreground" />
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={likedInput}
                            onChange={e => setLikedInput(e.target.value)}
                            onKeyDown={e => handleAddTag(e, 'liked_foods', likedInput, setLikedInput)}
                            placeholder="e.g. Salmon, Sweet Potato (Press Enter)"
                            className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {preferences.liked_foods.map(food => (
                            <span key={food} className="inline-flex items-center gap-1 bg-surface-highlight border border-border px-3 py-1 rounded-full text-sm text-foreground">
                                {food}
                                <button onClick={() => handleRemoveTag('liked_foods', food)} className="text-muted-foreground hover:text-foreground">
                                    <X size={14} />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Disliked Foods */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Foods you HATE</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={dislikedInput}
                            onChange={e => setDislikedInput(e.target.value)}
                            onKeyDown={e => handleAddTag(e, 'disliked_foods', dislikedInput, setDislikedInput)}
                            placeholder="e.g. Mushrooms, Olives (Press Enter)"
                            className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-destructive transition-all"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {preferences.disliked_foods.map(food => (
                            <span key={food} className="inline-flex items-center gap-1 bg-surface-highlight border border-border px-3 py-1 rounded-full text-sm text-foreground">
                                {food}
                                <button onClick={() => handleRemoveTag('disliked_foods', food)} className="text-muted-foreground hover:text-destructive">
                                    <X size={14} />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Allergies */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-destructive">Severe Allergies</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={allergyInput}
                            onChange={e => setAllergyInput(e.target.value)}
                            onKeyDown={e => handleAddTag(e, 'allergies', allergyInput, setAllergyInput)}
                            placeholder="e.g. Peanuts, Shellfish (Press Enter)"
                            className="w-full bg-surface border border-destructive/50 rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-destructive transition-all"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {preferences.allergies.map(allergy => (
                            <span key={allergy} className="inline-flex items-center gap-1 bg-destructive/20 border border-destructive/50 px-3 py-1 rounded-full text-sm text-destructive font-medium">
                                {allergy}
                                <button onClick={() => handleRemoveTag('allergies', allergy)} className="text-destructive hover:text-foreground">
                                    <X size={14} />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-4"
            >
                <Button
                    onClick={handleSave}
                    className="w-full h-14 text-lg font-bold shadow-glow-primary hover:shadow-glow-primary-lg transition-all"
                >
                    <Check className="mr-2 h-5 w-5" /> Save Protocol Options
                </Button>
            </motion.div>
        </div>
    )
}
