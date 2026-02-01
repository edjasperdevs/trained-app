export interface FoodSearchResult {
  id: string
  name: string
  brand?: string
  protein: number
  carbs: number
  fats: number
  calories: number
  servingSize: string
  imageUrl?: string
}

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
  image_small_url?: string
}

interface OpenFoodFactsResponse {
  count: number
  page: number
  page_count: number
  page_size: number
  products: OpenFoodFactsProduct[]
}

const API_BASE = 'https://world.openfoodfacts.org/cgi/search.pl'

export async function searchFoods(query: string): Promise<FoodSearchResult[]> {
  if (!query.trim()) return []

  const params = new URLSearchParams({
    search_terms: query,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: '20',
    fields: 'code,product_name,brands,nutriments,serving_size,image_small_url'
  })

  try {
    const response = await fetch(`${API_BASE}?${params}`)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: OpenFoodFactsResponse = await response.json()

    return data.products
      .filter((product) => {
        // Filter out products without basic info
        if (!product.product_name) return false
        // Must have at least some nutritional info
        const n = product.nutriments
        if (!n) return false
        return n.proteins_100g !== undefined ||
               n.carbohydrates_100g !== undefined ||
               n.fat_100g !== undefined ||
               n['energy-kcal_100g'] !== undefined
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
          servingSize: product.serving_size || '100g',
          imageUrl: product.image_small_url
        }
      })
  } catch (error) {
    console.error('Food search error:', error)
    throw error
  }
}
