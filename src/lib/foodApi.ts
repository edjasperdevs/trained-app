export interface FoodSearchResult {
  id: string
  name: string
  brand?: string
  protein: number // per 100g
  carbs: number // per 100g
  fats: number // per 100g
  calories: number // per 100g
  servingSize: number // in grams
  servingDescription: string // e.g., "1 cup", "1 medium"
  imageUrl?: string
}

// USDA FoodData Central API types
interface USDAFood {
  fdcId: number
  description: string
  brandName?: string
  brandOwner?: string
  foodNutrients: USDANutrient[]
  servingSize?: number
  servingSizeUnit?: string
  householdServingFullText?: string
}

interface USDANutrient {
  nutrientId: number
  nutrientName: string
  value: number
  unitName: string
}

interface USDASearchResponse {
  foods: USDAFood[]
  totalHits: number
}

// Nutrient IDs in USDA database
const NUTRIENT_IDS = {
  PROTEIN: 1003,
  FAT: 1004,
  CARBS: 1005,
  CALORIES: 1008,
}

// USDA FoodData Central API (free, requires API key)
const USDA_API_KEY = import.meta.env.VITE_USDA_API_KEY || 'DEMO_KEY'
const USDA_API_BASE = 'https://api.nal.usda.gov/fdc/v1'

export async function searchFoods(query: string): Promise<FoodSearchResult[]> {
  if (!query.trim()) return []

  // Try USDA first, fall back to Open Food Facts
  try {
    const usdaResults = await searchUSDA(query)
    if (usdaResults.length > 0) {
      return usdaResults
    }
  } catch (error) {
    console.warn('USDA API failed, falling back to Open Food Facts:', error)
  }

  // Fallback to Open Food Facts
  return searchOpenFoodFacts(query)
}

async function searchUSDA(query: string): Promise<FoodSearchResult[]> {
  const response = await fetch(`${USDA_API_BASE}/foods/search?api_key=${USDA_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: query,
      pageSize: 15,
      dataType: ['Foundation', 'SR Legacy', 'Branded'],
    }),
  })

  if (!response.ok) {
    throw new Error(`USDA API error: ${response.status}`)
  }

  const data: USDASearchResponse = await response.json()

  return data.foods
    .filter((food) => {
      // Must have some nutritional info
      return food.foodNutrients && food.foodNutrients.length > 0
    })
    .map((food): FoodSearchResult => {
      const getNutrient = (id: number): number => {
        const nutrient = food.foodNutrients.find((n) => n.nutrientId === id)
        return nutrient ? Math.round(nutrient.value) : 0
      }

      // Parse serving size
      let servingSize = 100 // default to 100g
      let servingDescription = '100g'

      if (food.servingSize && food.servingSizeUnit) {
        servingSize = food.servingSize
        servingDescription = food.householdServingFullText || `${food.servingSize}${food.servingSizeUnit}`
      } else if (food.householdServingFullText) {
        servingDescription = food.householdServingFullText
      }

      return {
        id: String(food.fdcId),
        name: food.description,
        brand: food.brandName || food.brandOwner,
        protein: getNutrient(NUTRIENT_IDS.PROTEIN),
        carbs: getNutrient(NUTRIENT_IDS.CARBS),
        fats: getNutrient(NUTRIENT_IDS.FAT),
        calories: getNutrient(NUTRIENT_IDS.CALORIES),
        servingSize,
        servingDescription,
      }
    })
}

// Fallback: Open Food Facts API
interface OpenFoodFactsProduct {
  code: string
  product_name?: string
  brands?: string
  nutriments?: {
    proteins_100g?: number
    carbohydrates_100g?: number
    fat_100g?: number
    'energy-kcal_100g'?: number
  }
  serving_size?: string
  serving_quantity?: number
  image_small_url?: string
}

interface OpenFoodFactsResponse {
  products: OpenFoodFactsProduct[]
}

async function searchOpenFoodFacts(query: string): Promise<FoodSearchResult[]> {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: '15',
    fields: 'code,product_name,brands,nutriments,serving_size,serving_quantity,image_small_url',
  })

  const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?${params}`)

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data: OpenFoodFactsResponse = await response.json()

  return data.products
    .filter((product) => {
      if (!product.product_name) return false
      const n = product.nutriments
      if (!n) return false
      return (
        n.proteins_100g !== undefined ||
        n.carbohydrates_100g !== undefined ||
        n.fat_100g !== undefined ||
        n['energy-kcal_100g'] !== undefined
      )
    })
    .map((product): FoodSearchResult => {
      const n = product.nutriments || {}
      return {
        id: product.code,
        name: product.product_name || 'Unknown',
        brand: product.brands,
        protein: Math.round(n.proteins_100g || 0),
        carbs: Math.round(n.carbohydrates_100g || 0),
        fats: Math.round(n.fat_100g || 0),
        calories: Math.round(n['energy-kcal_100g'] || 0),
        servingSize: product.serving_quantity || 100,
        servingDescription: product.serving_size || '100g',
        imageUrl: product.image_small_url,
      }
    })
}

// Calculate macros for a specific quantity
export function calculateMacrosForQuantity(
  food: FoodSearchResult,
  quantity: number,
  unit: 'g' | 'oz' | 'serving'
): { protein: number; carbs: number; fats: number; calories: number } {
  let grams: number

  switch (unit) {
    case 'g':
      grams = quantity
      break
    case 'oz':
      grams = quantity * 28.35
      break
    case 'serving':
      grams = quantity * food.servingSize
      break
    default:
      grams = quantity
  }

  // Food macros are per 100g
  const multiplier = grams / 100

  return {
    protein: Math.round(food.protein * multiplier),
    carbs: Math.round(food.carbs * multiplier),
    fats: Math.round(food.fats * multiplier),
    calories: Math.round(food.calories * multiplier),
  }
}
