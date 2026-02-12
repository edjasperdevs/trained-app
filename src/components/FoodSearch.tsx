import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { searchFoods, FoodSearchResult, calculateMacrosForQuantity } from '@/lib/foodApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface FoodSearchProps {
  onSelect: (food: FoodSearchResult & { quantity: number; unit: 'g' | 'oz' | 'serving' }) => void
}

function ScrollingText({ text, className }: { text: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const textEl = textRef.current
    if (!container || !textEl) return

    const overflow = textEl.scrollWidth - container.offsetWidth
    if (overflow <= 0) return

    const duration = Math.max(3000, overflow * 40)
    const animation = textEl.animate(
      [
        { transform: 'translateX(0)', offset: 0 },
        { transform: 'translateX(0)', offset: 0.2 },
        { transform: `translateX(-${overflow}px)`, offset: 0.8 },
        { transform: `translateX(-${overflow}px)`, offset: 1 },
      ],
      { duration, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' }
    )

    return () => animation.cancel()
  }, [text])

  return (
    <div ref={containerRef} className="overflow-hidden">
      <span ref={textRef} className={`inline-block whitespace-nowrap ${className || ''}`}>
        {text}
      </span>
    </div>
  )
}

type Unit = 'g' | 'oz' | 'serving'

const selectClasses = 'h-9 w-auto rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'

export function FoodSearch({ onSelect }: FoodSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)

  // Quantity selection state
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null)
  const [quantity, setQuantity] = useState('100')
  const [unit, setUnit] = useState<Unit>('g')

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const requestIdRef = useRef(0)

  // Close dropdown on click outside
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (!query.trim()) {
      setResults([])
      setShowResults(false)
      return
    }

    const currentRequestId = ++requestIdRef.current
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      setError(null)

      try {
        const foods = await searchFoods(query)
        // Discard stale results if a newer search was initiated
        if (currentRequestId !== requestIdRef.current) return
        setResults(foods)
        setShowResults(true)
      } catch {
        if (currentRequestId !== requestIdRef.current) return
        setError('Failed to search foods. Please try again.')
        setResults([])
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsLoading(false)
        }
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

  // Calculate preview macros
  const previewMacros = selectedFood
    ? calculateMacrosForQuantity(selectedFood, Number(quantity) || 0, unit)
    : null

  const dropdown = showResults && (
    <div className="mt-2 max-h-60 overflow-y-auto bg-card rounded-lg border border-border shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
      {error && <div className="p-4 text-center text-destructive text-sm">{error}</div>}

      {!error && results.length === 0 && !isLoading && query && (
        <div className="p-4 text-center text-muted-foreground text-sm">No foods found for "{query}"</div>
      )}

      {results.map((food) => (
        <button
          key={food.id}
          onClick={(e) => {
            e.stopPropagation()
            handleFoodClick(food)
          }}
          className="w-full p-3 text-left hover:bg-muted active:bg-muted transition-colors border-b border-border last:border-b-0"
        >
          <div className="flex-1 min-w-0">
            <ScrollingText text={food.name} className="font-semibold text-sm" />
            {food.brand && <p className="text-xs text-muted-foreground truncate">{food.brand}</p>}
            <p className="text-xs text-muted-foreground mt-1">
              Per 100g: P: {food.protein}g · C: {food.carbs}g · F: {food.fats}g · {food.calories} cal
            </p>
            {food.servingDescription && food.servingDescription !== '100g' && (
              <p className="text-xs text-primary mt-0.5">
                Serving: {food.servingDescription}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  )

  // Quantity selection modal - rendered via portal to escape any stacking contexts
  const quantityModal = selectedFood && createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 10002 }}
      className="bg-background/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={handleCancel}
    >
      <div
        className="bg-card rounded-xl p-5 w-full max-w-sm shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <ScrollingText text={selectedFood.name} className="font-bold text-lg mb-1" />
        {selectedFood.brand && (
          <p className="text-sm text-muted-foreground mb-4 truncate">{selectedFood.brand}</p>
        )}

        {/* Quantity Input */}
        <div className="mb-4">
          <label className="text-xs text-muted-foreground block mb-2">QUANTITY</label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="flex-1 text-xl font-digital text-center h-auto"
              min="0"
              step="1"
              autoFocus
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as Unit)}
              className={selectClasses}
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
                className="flex-1 py-1.5 text-sm bg-muted rounded-lg hover:bg-accent transition-colors"
              >
                50g
              </button>
              <button
                onClick={() => setQuantity('100')}
                className="flex-1 py-1.5 text-sm bg-muted rounded-lg hover:bg-accent transition-colors"
              >
                100g
              </button>
              <button
                onClick={() => setQuantity('150')}
                className="flex-1 py-1.5 text-sm bg-muted rounded-lg hover:bg-accent transition-colors"
              >
                150g
              </button>
              <button
                onClick={() => setQuantity('200')}
                className="flex-1 py-1.5 text-sm bg-muted rounded-lg hover:bg-accent transition-colors"
              >
                200g
              </button>
            </>
          )}
          {unit === 'oz' && (
            <>
              <button
                onClick={() => setQuantity('2')}
                className="flex-1 py-1.5 text-sm bg-muted rounded-lg hover:bg-accent transition-colors"
              >
                2oz
              </button>
              <button
                onClick={() => setQuantity('4')}
                className="flex-1 py-1.5 text-sm bg-muted rounded-lg hover:bg-accent transition-colors"
              >
                4oz
              </button>
              <button
                onClick={() => setQuantity('6')}
                className="flex-1 py-1.5 text-sm bg-muted rounded-lg hover:bg-accent transition-colors"
              >
                6oz
              </button>
              <button
                onClick={() => setQuantity('8')}
                className="flex-1 py-1.5 text-sm bg-muted rounded-lg hover:bg-accent transition-colors"
              >
                8oz
              </button>
            </>
          )}
          {unit === 'serving' && (
            <>
              <button
                onClick={() => setQuantity('0.5')}
                className="flex-1 py-1.5 text-sm bg-muted rounded-lg hover:bg-accent transition-colors"
              >
                ½
              </button>
              <button
                onClick={() => setQuantity('1')}
                className="flex-1 py-1.5 text-sm bg-muted rounded-lg hover:bg-accent transition-colors"
              >
                1
              </button>
              <button
                onClick={() => setQuantity('1.5')}
                className="flex-1 py-1.5 text-sm bg-muted rounded-lg hover:bg-accent transition-colors"
              >
                1½
              </button>
              <button
                onClick={() => setQuantity('2')}
                className="flex-1 py-1.5 text-sm bg-muted rounded-lg hover:bg-accent transition-colors"
              >
                2
              </button>
            </>
          )}
        </div>

        {/* Macro Preview */}
        {previewMacros && (
          <div className="bg-muted rounded-lg p-3 mb-4">
            <p className="text-xs text-muted-foreground mb-2">NUTRITION FOR THIS AMOUNT</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-lg font-bold font-digital text-primary">{previewMacros.protein}</p>
                <p className="text-xs text-muted-foreground">Protein</p>
              </div>
              <div>
                <p className="text-lg font-bold font-digital">{previewMacros.carbs}</p>
                <p className="text-xs text-muted-foreground">Carbs</p>
              </div>
              <div>
                <p className="text-lg font-bold font-digital">{previewMacros.fats}</p>
                <p className="text-xs text-muted-foreground">Fats</p>
              </div>
              <div>
                <p className="text-lg font-bold font-digital text-secondary">{previewMacros.calories}</p>
                <p className="text-xs text-muted-foreground">Cals</p>
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
      </div>
    </div>,
    document.body
  )

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search foods (e.g., chicken breast, rice)"
          className="pr-10"
          onFocus={() => results.length > 0 && setShowResults(true)}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div
              className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
