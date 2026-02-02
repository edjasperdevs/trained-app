import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { searchFoods, FoodSearchResult, calculateMacrosForQuantity } from '@/lib/foodApi'
import { Button } from './Button'

interface FoodSearchProps {
  onSelect: (food: FoodSearchResult & { quantity: number; unit: 'g' | 'oz' | 'serving' }) => void
}

type Unit = 'g' | 'oz' | 'serving'

export function FoodSearch({ onSelect }: FoodSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })

  // Quantity selection state
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null)
  const [quantity, setQuantity] = useState('100')
  const [unit, setUnit] = useState<Unit>('g')

  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (!query.trim()) {
      setResults([])
      setShowResults(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      setError(null)

      try {
        const foods = await searchFoods(query)
        setResults(foods)
        setShowResults(true)
      } catch {
        setError('Failed to search foods. Please try again.')
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 400)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query])

  const handleFoodClick = (food: FoodSearchResult) => {
    setSelectedFood(food)
    setShowResults(false)
    // Default quantity based on serving size
    if (food.servingSize && food.servingSize !== 100) {
      setQuantity('1')
      setUnit('serving')
    } else {
      setQuantity('100')
      setUnit('g')
    }
  }

  const handleConfirm = () => {
    if (!selectedFood) return

    const calculatedMacros = calculateMacrosForQuantity(
      selectedFood,
      Number(quantity) || 0,
      unit
    )

    onSelect({
      ...selectedFood,
      ...calculatedMacros,
      quantity: Number(quantity) || 0,
      unit,
    })

    // Reset state
    setSelectedFood(null)
    setQuery('')
    setQuantity('100')
    setUnit('g')
  }

  const handleCancel = () => {
    setSelectedFood(null)
  }

  // Update dropdown position when showing results
  useEffect(() => {
    if (showResults && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      })
    }
  }, [showResults])

  // Calculate preview macros
  const previewMacros = selectedFood
    ? calculateMacrosForQuantity(selectedFood, Number(quantity) || 0, unit)
    : null

  const dropdown =
    showResults &&
    createPortal(
      <>
        {/* Click outside to close */}
        <div className="fixed inset-0 z-[998]" onClick={() => setShowResults(false)} />
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              position: 'fixed',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              zIndex: 999,
            }}
            className="max-h-60 overflow-y-auto bg-bg-secondary rounded-lg border border-gray-700 shadow-xl"
          >
            {error && <div className="p-4 text-center text-accent-danger text-sm">{error}</div>}

            {!error && results.length === 0 && !isLoading && query && (
              <div className="p-4 text-center text-gray-500 text-sm">No foods found for "{query}"</div>
            )}

            {results.map((food) => (
              <button
                key={food.id}
                onClick={(e) => {
                  e.stopPropagation()
                  handleFoodClick(food)
                }}
                className="w-full p-3 text-left hover:bg-bg-card active:bg-bg-card transition-colors border-b border-gray-800 last:border-b-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{food.name}</p>
                  {food.brand && <p className="text-xs text-gray-500 truncate">{food.brand}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    Per 100g: P: {food.protein}g · C: {food.carbs}g · F: {food.fats}g · {food.calories} cal
                  </p>
                  {food.servingDescription && food.servingDescription !== '100g' && (
                    <p className="text-xs text-accent-primary mt-0.5">
                      Serving: {food.servingDescription}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </motion.div>
        </AnimatePresence>
      </>,
      document.body
    )

  // Quantity selection modal
  const quantityModal = selectedFood && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
      onClick={handleCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-bg-secondary rounded-xl p-5 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-lg mb-1 truncate">{selectedFood.name}</h3>
        {selectedFood.brand && (
          <p className="text-sm text-gray-500 mb-4 truncate">{selectedFood.brand}</p>
        )}

        {/* Quantity Input */}
        <div className="mb-4">
          <label className="text-xs text-gray-400 block mb-2">QUANTITY</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="flex-1 bg-bg-card border border-gray-700 rounded-lg px-3 py-2 text-xl font-digital text-center"
              min="0"
              step="1"
              autoFocus
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as Unit)}
              className="bg-bg-card border border-gray-700 rounded-lg px-3 py-2 text-sm"
            >
              <option value="g">grams</option>
              <option value="oz">oz</option>
              {selectedFood.servingDescription && (
                <option value="serving">
                  serving ({selectedFood.servingDescription})
                </option>
              )}
            </select>
          </div>
        </div>

        {/* Quick quantity buttons */}
        <div className="flex gap-2 mb-4">
          {unit === 'g' && (
            <>
              <button
                onClick={() => setQuantity('50')}
                className="flex-1 py-1.5 text-sm bg-bg-card rounded-lg hover:bg-bg-primary transition-colors"
              >
                50g
              </button>
              <button
                onClick={() => setQuantity('100')}
                className="flex-1 py-1.5 text-sm bg-bg-card rounded-lg hover:bg-bg-primary transition-colors"
              >
                100g
              </button>
              <button
                onClick={() => setQuantity('150')}
                className="flex-1 py-1.5 text-sm bg-bg-card rounded-lg hover:bg-bg-primary transition-colors"
              >
                150g
              </button>
              <button
                onClick={() => setQuantity('200')}
                className="flex-1 py-1.5 text-sm bg-bg-card rounded-lg hover:bg-bg-primary transition-colors"
              >
                200g
              </button>
            </>
          )}
          {unit === 'oz' && (
            <>
              <button
                onClick={() => setQuantity('2')}
                className="flex-1 py-1.5 text-sm bg-bg-card rounded-lg hover:bg-bg-primary transition-colors"
              >
                2oz
              </button>
              <button
                onClick={() => setQuantity('4')}
                className="flex-1 py-1.5 text-sm bg-bg-card rounded-lg hover:bg-bg-primary transition-colors"
              >
                4oz
              </button>
              <button
                onClick={() => setQuantity('6')}
                className="flex-1 py-1.5 text-sm bg-bg-card rounded-lg hover:bg-bg-primary transition-colors"
              >
                6oz
              </button>
              <button
                onClick={() => setQuantity('8')}
                className="flex-1 py-1.5 text-sm bg-bg-card rounded-lg hover:bg-bg-primary transition-colors"
              >
                8oz
              </button>
            </>
          )}
          {unit === 'serving' && (
            <>
              <button
                onClick={() => setQuantity('0.5')}
                className="flex-1 py-1.5 text-sm bg-bg-card rounded-lg hover:bg-bg-primary transition-colors"
              >
                ½
              </button>
              <button
                onClick={() => setQuantity('1')}
                className="flex-1 py-1.5 text-sm bg-bg-card rounded-lg hover:bg-bg-primary transition-colors"
              >
                1
              </button>
              <button
                onClick={() => setQuantity('1.5')}
                className="flex-1 py-1.5 text-sm bg-bg-card rounded-lg hover:bg-bg-primary transition-colors"
              >
                1½
              </button>
              <button
                onClick={() => setQuantity('2')}
                className="flex-1 py-1.5 text-sm bg-bg-card rounded-lg hover:bg-bg-primary transition-colors"
              >
                2
              </button>
            </>
          )}
        </div>

        {/* Macro Preview */}
        {previewMacros && (
          <div className="bg-bg-card rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-400 mb-2">NUTRITION FOR THIS AMOUNT</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-lg font-bold font-digital text-accent-primary">{previewMacros.protein}</p>
                <p className="text-xs text-gray-500">Protein</p>
              </div>
              <div>
                <p className="text-lg font-bold font-digital">{previewMacros.carbs}</p>
                <p className="text-xs text-gray-500">Carbs</p>
              </div>
              <div>
                <p className="text-lg font-bold font-digital">{previewMacros.fats}</p>
                <p className="text-xs text-gray-500">Fats</p>
              </div>
              <div>
                <p className="text-lg font-bold font-digital text-accent-secondary">{previewMacros.calories}</p>
                <p className="text-xs text-gray-500">Cals</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="ghost" onClick={handleCancel} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="flex-1" disabled={!quantity || Number(quantity) <= 0}>
            Add Food
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search foods (e.g., chicken breast, rice)"
          className="w-full bg-bg-secondary border border-gray-700 rounded-lg px-3 py-2 pr-10"
          onFocus={() => results.length > 0 && setShowResults(true)}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-4 h-4 border-2 border-accent-primary border-t-transparent rounded-full"
            />
          </div>
        )}
        {!isLoading && query && (
          <button
            onClick={() => {
              setQuery('')
              setResults([])
              setShowResults(false)
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            ✕
          </button>
        )}
      </div>
      {dropdown}
      {quantityModal}
    </div>
  )
}
