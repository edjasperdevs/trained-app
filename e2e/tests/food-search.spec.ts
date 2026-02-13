/**
 * E2E tests for food search in Quick Log and recent foods re-logging.
 *
 * E2E-12: Search food → select → quantity → macros logged + appears in recent list
 * E2E-13: Tap recent food → macros logged again
 * E2E-14: Recent foods persist across page refresh
 */
import { test, expect } from '../fixtures/base'

const MOCK_USDA_RESPONSE = {
  foods: [
    {
      fdcId: 171077,
      description: 'Chicken Breast, Grilled',
      brandName: '',
      brandOwner: '',
      foodNutrients: [
        { nutrientId: 1003, nutrientName: 'Protein', value: 31, unitName: 'G' },
        { nutrientId: 1004, nutrientName: 'Total lipid (fat)', value: 3.6, unitName: 'G' },
        { nutrientId: 1005, nutrientName: 'Carbohydrate', value: 0, unitName: 'G' },
        { nutrientId: 1008, nutrientName: 'Energy', value: 165, unitName: 'KCAL' },
      ],
      servingSize: 120,
      servingSizeUnit: 'g',
      householdServingFullText: '1 breast half',
    },
    {
      fdcId: 171078,
      description: 'White Rice, Cooked',
      brandName: '',
      brandOwner: '',
      foodNutrients: [
        { nutrientId: 1003, nutrientName: 'Protein', value: 2.7, unitName: 'G' },
        { nutrientId: 1004, nutrientName: 'Total lipid (fat)', value: 0.3, unitName: 'G' },
        { nutrientId: 1005, nutrientName: 'Carbohydrate', value: 28, unitName: 'G' },
        { nutrientId: 1008, nutrientName: 'Energy', value: 130, unitName: 'KCAL' },
      ],
      servingSize: 158,
      servingSizeUnit: 'g',
      householdServingFullText: '1 cup',
    },
  ],
  totalHits: 2,
}

/** Mock USDA API to return deterministic results */
async function mockFoodApi(page: import('@playwright/test').Page) {
  await page.route('**/api.nal.usda.gov/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_USDA_RESPONSE),
    })
  )
}

test.describe('Food Search & Recent Foods', () => {
  test('E2E-12: search food in Quick Log, select with quantity, macros logged and appears in recent', async ({ seededPage: page }) => {
    await mockFoodApi(page)

    // Navigate to Macros
    await page.locator('[data-testid="nav-macros"]').click()
    await expect(page.locator('[data-testid="macros-screen"]')).toBeVisible({ timeout: 10000 })

    // Type in food search
    await page.getByPlaceholder('Search foods').fill('chicken')

    // Wait for search results dropdown
    await expect(page.getByText('Chicken Breast, Grilled')).toBeVisible({ timeout: 10000 })

    // Click the chicken breast result
    await page.getByText('Chicken Breast, Grilled').click()

    // Quantity modal should appear
    await expect(page.getByText('QUANTITY')).toBeVisible({ timeout: 5000 })

    // Default should be 1 serving for foods with serving info
    // Click Add Food to confirm
    await page.getByRole('button', { name: 'Add Food' }).click()

    // Toast should confirm logging
    await expect(page.getByText('Chicken Breast, Grilled logged')).toBeVisible({ timeout: 5000 })

    // Recent section should now show the food
    await expect(page.getByText('RECENT')).toBeVisible({ timeout: 5000 })
    await expect(
      page.locator('text=Chicken Breast, Grilled').locator('xpath=ancestor::div[contains(@class, "bg-muted")]')
    ).toBeVisible()
  })

  test('E2E-13: tap recent food to re-log it', async ({ seededPage: page }) => {
    await mockFoodApi(page)

    // Navigate to Macros
    await page.locator('[data-testid="nav-macros"]').click()
    await expect(page.locator('[data-testid="macros-screen"]')).toBeVisible({ timeout: 10000 })

    // First, search and log a food to populate recent list
    await page.getByPlaceholder('Search foods').fill('chicken')
    await expect(page.getByText('Chicken Breast, Grilled')).toBeVisible({ timeout: 10000 })
    await page.getByText('Chicken Breast, Grilled').click()
    await expect(page.getByText('QUANTITY')).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: 'Add Food' }).click()
    await expect(page.getByText('RECENT')).toBeVisible({ timeout: 5000 })

    // Now tap "Log" on the recent item
    const recentItem = page.locator('text=Chicken Breast, Grilled')
      .locator('xpath=ancestor::div[contains(@class, "bg-muted")]')
    await recentItem.getByRole('button', { name: 'Log' }).click()

    // Button should show check indicator (use .first() to avoid strict mode violation)
    await expect(recentItem.locator('svg').first()).toBeVisible({ timeout: 2000 })

    // Toast should confirm
    await expect(page.getByText('Chicken Breast, Grilled logged').nth(1)).toBeVisible({ timeout: 5000 })
  })

  test('E2E-14: recent foods persist to localStorage', async ({ seededPage: page }) => {
    await mockFoodApi(page)

    // Navigate to Macros
    await page.locator('[data-testid="nav-macros"]').click()
    await expect(page.locator('[data-testid="macros-screen"]')).toBeVisible({ timeout: 10000 })

    // Search and log a food
    await page.getByPlaceholder('Search foods').fill('chicken')
    await expect(page.getByText('Chicken Breast, Grilled')).toBeVisible({ timeout: 10000 })
    await page.getByText('Chicken Breast, Grilled').click()
    await expect(page.getByText('QUANTITY')).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: 'Add Food' }).click()
    await expect(page.getByText('RECENT')).toBeVisible({ timeout: 5000 })

    // Verify recentFoods was persisted to localStorage
    // Seeded data has 2 recent foods (Oatmeal, Whey Protein), plus the one just added = 3 total
    const macroData = await page.evaluate(() => localStorage.getItem('gamify-gains-macros'))
    expect(macroData).toBeTruthy()
    const parsed = JSON.parse(macroData!)
    expect(parsed.state.recentFoods).toBeDefined()
    expect(parsed.state.recentFoods.length).toBe(3)
    // Most recently added food should be first (sorted by loggedAt)
    expect(parsed.state.recentFoods[0].name).toBe('Chicken Breast, Grilled')
  })
})
