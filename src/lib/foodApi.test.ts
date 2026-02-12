import { describe, it, expect } from 'vitest'
import { rankResults, FoodSearchResult } from './foodApi'

function makeFoodResult(overrides: Partial<FoodSearchResult> & { name: string }): FoodSearchResult {
  return {
    id: overrides.name,
    protein: 20,
    carbs: 0,
    fats: 5,
    calories: 165,
    servingSize: 100,
    servingDescription: '100g',
    ...overrides,
  }
}

describe('rankResults', () => {
  const chickenBreast = makeFoodResult({ name: 'Chicken Breast' })
  const grilledChickenBreast = makeFoodResult({ name: 'Grilled Chicken Breast, Skinless' })
  const chickenThigh = makeFoodResult({ name: 'Chicken Thigh' })
  const breastOfDuck = makeFoodResult({ name: 'Breast of Duck' })
  const turkeyBreast = makeFoodResult({ name: 'Turkey Breast' })

  it('returns original order for single-word queries', () => {
    const results = [chickenThigh, chickenBreast, grilledChickenBreast]
    const ranked = rankResults(results, 'chicken')
    expect(ranked.map(r => r.name)).toEqual(['Chicken Thigh', 'Chicken Breast', 'Grilled Chicken Breast, Skinless'])
  })

  it('ranks results matching all terms above partial matches', () => {
    const results = [breastOfDuck, turkeyBreast, chickenThigh, chickenBreast]
    const ranked = rankResults(results, 'chicken breast')
    expect(ranked[0].name).toBe('Chicken Breast')
  })

  it('handles reversed word order', () => {
    const results = [breastOfDuck, turkeyBreast, chickenThigh, chickenBreast]
    const ranked = rankResults(results, 'breast chicken')
    // Both "Chicken Breast" and "Grilled Chicken Breast" match all terms
    // "Chicken Breast" should still be top since it's shorter
    expect(ranked[0].name).toBe('Chicken Breast')
  })

  it('gives bonus for exact phrase match in name', () => {
    // Both match all terms, but "Chicken Breast" contains the exact phrase "chicken breast"
    const results = [grilledChickenBreast, chickenBreast]
    const ranked = rankResults(results, 'chicken breast')
    expect(ranked[0].name).toBe('Chicken Breast')
  })

  it('prefers shorter/more specific names when scores are equal', () => {
    const short = makeFoodResult({ name: 'Rice' })
    const long = makeFoodResult({ name: 'Rice, White, Long-Grain, Enriched, Cooked' })
    const results = [long, short]
    const ranked = rankResults(results, 'rice stuff')
    // Both match "rice" once; shorter name should rank higher
    expect(ranked[0].name).toBe('Rice')
  })

  it('scores brand matches lower than name matches', () => {
    const nameMatch = makeFoodResult({ name: 'Protein Bar Chicken Flavor', brand: 'Generic' })
    const brandMatch = makeFoodResult({ name: 'Protein Bar', brand: 'Chicken Co' })
    const results = [brandMatch, nameMatch]
    const ranked = rankResults(results, 'protein chicken')
    // nameMatch has "protein" + "chicken" both in name (2+2=4)
    // brandMatch has "protein" in name + "chicken" in brand (2+1=3)
    expect(ranked[0].name).toBe('Protein Bar Chicken Flavor')
  })

  it('returns empty array for empty input', () => {
    expect(rankResults([], 'chicken')).toEqual([])
  })

  it('handles empty query gracefully', () => {
    const results = [chickenBreast, chickenThigh]
    const ranked = rankResults(results, '')
    expect(ranked).toHaveLength(2)
  })
})
