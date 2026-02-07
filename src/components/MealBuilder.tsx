import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FoodSearch } from './FoodSearch'
import { MealIngredient } from '@/stores'

interface MealBuilderProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, ingredients: MealIngredient[]) => void
  editMeal?: { name: string; ingredients: MealIngredient[] } | null
}

export function MealBuilder({ isOpen, onClose, onSave, editMeal }: MealBuilderProps) {
  const [mealName, setMealName] = useState('')
  const [ingredients, setIngredients] = useState<MealIngredient[]>([])

  // Reset or load edit data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editMeal) {
        setMealName(editMeal.name)
        setIngredients(editMeal.ingredients)
      } else {
        setMealName('')
        setIngredients([])
      }
    }
  }, [isOpen, editMeal])

  const handleAddIngredient = (food: {
    id: string
    name: string
    brand?: string
    protein: number
    carbs: number
    fats: number
    calories: number
    quantity: number
    unit: 'g' | 'oz' | 'serving'
  }) => {
    const newIngredient: MealIngredient = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: food.name,
      brand: food.brand,
      quantity: food.quantity,
      unit: food.unit,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
      calories: food.calories,
    }
    setIngredients((prev) => [...prev, newIngredient])
  }

  const handleRemoveIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((ing) => ing.id !== id))
  }

  const handleSave = () => {
    if (!mealName.trim() || ingredients.length === 0) return
    onSave(mealName.trim(), ingredients)
    onClose()
  }

  // Calculate totals
  const totals = ingredients.reduce(
    (acc, ing) => ({
      protein: acc.protein + ing.protein,
      carbs: acc.carbs + ing.carbs,
      fats: acc.fats + ing.fats,
      calories: acc.calories + ing.calories,
    }),
    { protein: 0, carbs: 0, fats: 0, calories: 0 }
  )

  if (!isOpen) return null

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
      className="bg-background/95 flex flex-col animate-in fade-in duration-200"
    >
      {/* Header */}
      <div className="bg-card px-4 py-4 flex items-center justify-between border-b border-border">
        <button onClick={onClose} aria-label="Go back" className="text-muted-foreground hover:text-foreground p-1">
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-bold">{editMeal ? 'Edit Meal' : 'Create Meal'}</h2>
        <div className="w-8" /> {/* Spacer for alignment */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Meal Name */}
        <div>
          <label className="text-xs text-muted-foreground block mb-2">MEAL NAME</label>
          <Input
            type="text"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            placeholder="e.g., Post-Workout Shake"
            className="py-3 text-lg h-auto"
            autoFocus
          />
        </div>

        {/* Food Search */}
        <div>
          <label className="text-xs text-muted-foreground block mb-2">ADD INGREDIENTS</label>
          <FoodSearch onSelect={handleAddIngredient} />
        </div>

        {/* Ingredients List */}
        <div>
          <label className="text-xs text-muted-foreground block mb-2">
            INGREDIENTS ({ingredients.length})
          </label>

          {ingredients.length === 0 ? (
            <div className="bg-muted rounded-lg p-6 text-center">
              <span className="text-3xl block mb-2">🥗</span>
              <p className="text-muted-foreground text-sm">
                Search and add ingredients above
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {ingredients.map((ing) => (
                <div
                  key={ing.id}
                  className="bg-muted rounded-lg p-3 flex items-center justify-between animate-in fade-in slide-in-from-left-4 duration-200"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{ing.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ing.quantity}{ing.unit === 'serving' ? ' serving' : ing.unit}
                      {ing.brand && ` · ${ing.brand}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      P: {ing.protein}g · C: {ing.carbs}g · F: {ing.fats}g · {ing.calories} cal
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveIngredient(ing.id)}
                    className="text-muted-foreground hover:text-destructive p-2 ml-2"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer with Totals and Save */}
      <div className="bg-card border-t border-border p-4 space-y-4">
        {/* Macro Totals */}
        {ingredients.length > 0 && (
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-2">MEAL TOTALS</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-lg font-bold font-digital text-primary">{totals.protein}</p>
                <p className="text-xs text-muted-foreground">Protein</p>
              </div>
              <div>
                <p className="text-lg font-bold font-digital">{totals.carbs}</p>
                <p className="text-xs text-muted-foreground">Carbs</p>
              </div>
              <div>
                <p className="text-lg font-bold font-digital">{totals.fats}</p>
                <p className="text-xs text-muted-foreground">Fats</p>
              </div>
              <div>
                <p className="text-lg font-bold font-digital text-secondary">{totals.calories}</p>
                <p className="text-xs text-muted-foreground">Cals</p>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <Button
          onClick={handleSave}
          className="w-full"
          size="lg"
          disabled={!mealName.trim() || ingredients.length === 0}
        >
          {editMeal ? 'Update Meal' : 'Save Meal'}
        </Button>
      </div>
    </div>,
    document.body
  )
}
