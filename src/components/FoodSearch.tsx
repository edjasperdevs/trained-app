import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { searchFoods, FoodSearchResult } from '@/lib/foodApi'

interface FoodSearchProps {
  onSelect: (food: FoodSearchResult) => void
}

export function FoodSearch({ onSelect }: FoodSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
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
      } catch (err) {
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

  const handleSelect = (food: FoodSearchResult) => {
    onSelect(food)
    setQuery('')
    setResults([])
    setShowResults(false)
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
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

      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-20 w-full mt-2 max-h-80 overflow-y-auto bg-bg-secondary rounded-lg border border-gray-700 shadow-lg"
          >
            {error && (
              <div className="p-4 text-center text-accent-danger text-sm">
                {error}
              </div>
            )}

            {!error && results.length === 0 && !isLoading && query && (
              <div className="p-4 text-center text-gray-500 text-sm">
                No foods found for "{query}"
              </div>
            )}

            {results.map((food) => (
              <button
                key={food.id}
                onClick={() => handleSelect(food)}
                className="w-full p-3 text-left hover:bg-bg-card transition-colors border-b border-gray-800 last:border-b-0"
              >
                <div className="flex gap-3">
                  {food.imageUrl && (
                    <img
                      src={food.imageUrl}
                      alt={food.name}
                      className="w-12 h-12 rounded object-cover bg-bg-card"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{food.name}</p>
                    {food.brand && (
                      <p className="text-xs text-gray-500 truncate">{food.brand}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Per 100g: P: {food.protein}g · C: {food.carbs}g · F: {food.fats}g · {food.calories} cal
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {showResults && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  )
}
