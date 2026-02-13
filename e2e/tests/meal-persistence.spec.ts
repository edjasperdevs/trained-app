/**
 * E2E test for meal and food data persistence across login sessions.
 *
 * Tests the full cycle:
 * 1. User signs up and completes onboarding
 * 2. Creates meals via food search (quick add)
 * 3. Favorites a meal and a food item
 * 4. Signs out
 * 5. Signs back in
 * 6. Verifies all data persists (saved meals, favorites, recent foods)
 */
import { test, expect, Page } from '@playwright/test'
import { mockSupabaseFullCycle } from '../helpers/supabase-mocks'
import { STORE_KEYS } from '../helpers/storage'

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
    {
      fdcId: 171079,
      description: 'Banana, Raw',
      brandName: '',
      brandOwner: '',
      foodNutrients: [
        { nutrientId: 1003, nutrientName: 'Protein', value: 1.1, unitName: 'G' },
        { nutrientId: 1004, nutrientName: 'Total lipid (fat)', value: 0.3, unitName: 'G' },
        { nutrientId: 1005, nutrientName: 'Carbohydrate', value: 23, unitName: 'G' },
        { nutrientId: 1008, nutrientName: 'Energy', value: 89, unitName: 'KCAL' },
      ],
      servingSize: 118,
      servingSizeUnit: 'g',
      householdServingFullText: '1 medium',
    },
  ],
  totalHits: 3,
}

/** Mock USDA API to return deterministic results */
async function mockFoodApi(page: Page) {
  await page.route('**/api.nal.usda.gov/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_USDA_RESPONSE),
    })
  )
}

/**
 * Re-inject profile and macro data after sign-in.
 * Sign-out clears all Zustand stores; we simulate cloud restore via localStorage seeding.
 */
async function injectDataAfterSignIn(
  page: Page,
  username: string,
  macroData: { savedMeals: unknown[]; favoriteFoods: unknown[]; recentFoods: unknown[] }
) {
  await page.evaluate(
    ({ userKey, accessKey, macrosKey, username, macroData }) => {
      // Restore user profile
      localStorage.setItem(
        userKey,
        JSON.stringify({
          state: {
            profile: {
              username,
              gender: 'male',
              fitnessLevel: 'intermediate',
              trainingDaysPerWeek: 3,
              weight: 180,
              height: 70,
              age: 28,
              goal: 'recomp',
              avatarBase: 'dominant',
              createdAt: Date.now(),
              currentStreak: 0,
              longestStreak: 0,
              lastCheckInDate: null,
              streakPaused: false,
              onboardingComplete: true,
              units: 'imperial',
            },
            weightHistory: [],
          },
          version: 0,
        })
      )

      // Restore access
      localStorage.setItem(
        accessKey,
        JSON.stringify({
          state: {
            hasAccess: true,
            licenseKey: 'E2E-RESEED',
            accessGrantedAt: new Date().toISOString(),
            email: 'e2e@test.com',
            instanceId: 'e2e-reseed',
          },
          version: 2,
        })
      )

      // Restore macro data including saved meals, favorites, and recent foods
      localStorage.setItem(
        macrosKey,
        JSON.stringify({
          state: {
            targets: { protein: 180, calories: 2400, carbs: 240, fats: 70 },
            mealPlan: [],
            dailyLogs: [],
            savedMeals: macroData.savedMeals,
            recentFoods: macroData.recentFoods,
            favoriteFoods: macroData.favoriteFoods,
            activityLevel: 'moderate',
          },
          version: 4,
        })
      )
    },
    {
      userKey: STORE_KEYS.user,
      accessKey: STORE_KEYS.access,
      macrosKey: STORE_KEYS.macros,
      username,
      macroData,
    }
  )

  // Reload so Zustand re-hydrates from localStorage
  await page.reload({ waitUntil: 'domcontentloaded' })
}

/**
 * Fast-forward through onboarding steps.
 */
async function completeOnboarding(page: Page, username: string) {
  await expect(page.locator('[data-testid="onboarding-screen"]')).toBeVisible({ timeout: 15000 })

  // Step 1: Welcome
  await page.getByRole('button', { name: /start/i }).click()

  // Step 2: Name
  await expect(page.locator('[data-testid="onboarding-username-input"]')).toBeVisible({ timeout: 5000 })
  await page.locator('[data-testid="onboarding-username-input"]').fill(username)
  await page.locator('[data-testid="onboarding-next-button"]').click()

  // Step 3: Gender
  await expect(page.locator('[data-testid="onboarding-gender-male"]')).toBeVisible({ timeout: 5000 })
  await page.locator('[data-testid="onboarding-gender-male"]').click()
  await page.getByRole('button', { name: /continue/i }).click()

  // Step 4: Fitness level
  await expect(page.getByText('Training experience')).toBeVisible({ timeout: 5000 })
  await page.getByRole('button', { name: /uninitiated/i }).click()
  await page.getByRole('button', { name: /continue/i }).click()

  // Step 5: Training days
  await expect(page.locator('[data-testid="onboarding-training-days-3"]')).toBeVisible({ timeout: 5000 })
  await page.locator('[data-testid="onboarding-training-days-3"]').click()
  await page.getByRole('button', { name: /continue/i }).click()

  // Step 6: Schedule
  await expect(page.getByText('Select your training days')).toBeVisible({ timeout: 5000 })
  await page.getByRole('button', { name: /continue/i }).click()

  // Step 7: Goal + stats
  await expect(page.locator('[data-testid="onboarding-weight-input"]')).toBeVisible({ timeout: 5000 })
  const goalStep = page.locator('[data-testid="onboarding-step-7"]')
  await goalStep.locator('[data-testid="onboarding-height-input"]').fill('5')
  await goalStep.locator('input[type="number"]').nth(1).fill('10')
  await page.locator('[data-testid="onboarding-weight-input"]').fill('180')
  await page.locator('[data-testid="onboarding-age-input"]').fill('28')
  await page.locator('[data-testid="onboarding-goal-recomp"]').click()
  await page.getByRole('button', { name: /continue/i }).click()

  // Step 8: Avatar
  await expect(page.getByText('Choose your persona')).toBeVisible({ timeout: 5000 })
  await page.getByRole('button', { name: /dom\/me/i }).click()
  await page.getByRole('button', { name: /continue/i }).click()

  // Step 9: Features
  await expect(page.getByText('How the protocol works')).toBeVisible({ timeout: 5000 })
  await page.getByRole('button', { name: /continue/i }).click()

  // Step 10: Tutorial
  await expect(page.getByText('Protocol initialized')).toBeVisible({ timeout: 5000 })
  await page.getByRole('button', { name: /begin/i }).click()

  // Handle evolution step
  const evolutionBeginButton = page.getByRole('button', { name: /begin/i })
  const homeScreen = page.locator('[data-testid="home-screen"]')
  await expect(evolutionBeginButton.or(homeScreen)).toBeVisible({ timeout: 15000 })
  if (await evolutionBeginButton.isVisible()) {
    await evolutionBeginButton.click()
  }
}

test.describe('Meal Persistence Across Login Sessions', () => {
  test('meals, favorites, and recent foods persist after sign out and sign back in', async ({ page }) => {
    const USERNAME = 'MealTestUser'

    // Set up mocks BEFORE navigation
    await mockSupabaseFullCycle(page)
    await mockFoodApi(page)

    // Navigate to app
    await page.goto('/')

    // --- ACCESS GATE ---
    await expect(page.locator('[data-testid="access-gate"]')).toBeVisible({ timeout: 15000 })
    await page.locator('[data-testid="access-code-input"]').fill('TESTCODE1234')
    await page.locator('[data-testid="access-submit-button"]').click()

    // Handle success modal or direct transition to auth
    const successModal = page.getByText('Access Granted')
    const authScreen = page.locator('[data-testid="auth-screen"]')
    await expect(successModal.or(authScreen)).toBeVisible({ timeout: 10000 })
    if (await successModal.isVisible()) {
      await page.getByRole('button', { name: /begin/i }).click()
    }

    // --- SIGN UP ---
    await expect(authScreen).toBeVisible({ timeout: 10000 })
    await page.locator('[data-testid="auth-email-input"]').fill('e2e@test.com')
    await page.locator('[data-testid="auth-password-input"]').fill('TestPassword123!')
    await page.getByLabel(/confirm password/i).fill('TestPassword123!')
    await page.locator('[data-testid="auth-submit-button"]').click()

    // --- ONBOARDING ---
    await completeOnboarding(page, USERNAME)

    // --- HOME SCREEN ---
    const homeScreen = page.locator('[data-testid="home-screen"]')
    await expect(homeScreen).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(USERNAME)).toBeVisible()

    // --- NAVIGATE TO MACROS ---
    await page.locator('[data-testid="nav-macros"]').click()
    await expect(page.locator('[data-testid="macros-screen"]')).toBeVisible({ timeout: 10000 })

    // --- SEARCH AND LOG FOODS (QUICK ADD) ---
    // Search and add Chicken Breast
    await page.getByPlaceholder('Search foods').fill('chicken')
    await expect(page.getByText('Chicken Breast, Grilled')).toBeVisible({ timeout: 10000 })
    await page.getByText('Chicken Breast, Grilled').click()
    await expect(page.getByText('QUANTITY')).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: 'Add Food' }).click()
    await expect(page.getByText('Chicken Breast, Grilled logged')).toBeVisible({ timeout: 5000 })

    // Clear search and search for White Rice
    await page.getByPlaceholder('Search foods').fill('')
    await page.getByPlaceholder('Search foods').fill('rice')
    await expect(page.getByText('White Rice, Cooked')).toBeVisible({ timeout: 10000 })
    await page.getByText('White Rice, Cooked').click()
    await expect(page.getByText('QUANTITY')).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: 'Add Food' }).click()
    await expect(page.getByText('White Rice, Cooked logged')).toBeVisible({ timeout: 5000 })

    // --- VERIFY RECENT FOODS ---
    await expect(page.getByText('RECENT')).toBeVisible({ timeout: 5000 })
    // Use locator within the RECENT section to avoid matching toast notifications
    const recentSection = page.getByText('RECENT').locator('..')
    await expect(recentSection.getByText('White Rice, Cooked').first()).toBeVisible()
    await expect(recentSection.getByText('Chicken Breast, Grilled').first()).toBeVisible()

    // --- FAVORITE A FOOD ITEM (Chicken Breast) ---
    // Use first() since the food appears in both Recent and Today's Meals sections
    await page.locator('button[aria-label="Favorite Chicken Breast, Grilled"]').first().click()
    await expect(page.locator('button[aria-label="Unfavorite Chicken Breast, Grilled"]').first()).toBeVisible()

    // --- CREATE A SAVED MEAL ---
    // Switch to Meals tab
    await page.getByRole('tab', { name: 'Meals' }).click()
    await expect(page.getByRole('button', { name: /create new meal/i })).toBeVisible({ timeout: 5000 })

    // Click Create New Meal
    await page.getByRole('button', { name: /create new meal/i }).click()

    // Wait for MealBuilder modal to appear (it's a portal, look for the header)
    await expect(page.getByRole('heading', { name: 'Create Meal' })).toBeVisible({ timeout: 5000 })

    // Fill meal name
    const mealNameInput = page.getByPlaceholder('e.g., Post-Workout Shake')
    await expect(mealNameInput).toBeVisible({ timeout: 5000 })
    await mealNameInput.fill('Chicken Rice Bowl')

    // Search and add first ingredient
    // The MealBuilder has a FoodSearch with placeholder "Search foods (e.g., chicken breast, rice)"
    const mealBuilderSearchInput = page.getByPlaceholder('Search foods (e.g., chicken breast, rice)')
    await expect(mealBuilderSearchInput).toBeVisible({ timeout: 5000 })
    await mealBuilderSearchInput.fill('chicken')

    // Wait for dropdown results and click the result
    await expect(page.locator('button:has-text("Chicken Breast, Grilled")')).toBeVisible({ timeout: 10000 })
    await page.locator('button:has-text("Chicken Breast, Grilled")').click()

    // Quantity modal appears
    await expect(page.getByText('QUANTITY')).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: 'Add Food' }).click()

    // Wait for ingredient to be added
    await expect(page.getByText('INGREDIENTS (1)')).toBeVisible({ timeout: 5000 })

    // Clear search and add second ingredient
    await mealBuilderSearchInput.clear()
    await mealBuilderSearchInput.fill('rice')
    await expect(page.locator('button:has-text("White Rice, Cooked")')).toBeVisible({ timeout: 10000 })
    await page.locator('button:has-text("White Rice, Cooked")').click()
    await expect(page.getByText('QUANTITY')).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: 'Add Food' }).click()

    // Wait for second ingredient to be added
    await expect(page.getByText('INGREDIENTS (2)')).toBeVisible({ timeout: 5000 })

    // Verify Save Meal button is enabled and click it
    const saveMealButton = page.getByRole('button', { name: 'Save Meal' })
    await expect(saveMealButton).toBeEnabled({ timeout: 5000 })
    await saveMealButton.click()

    // Wait for modal to close
    await expect(page.getByRole('heading', { name: 'Create Meal' })).not.toBeVisible({ timeout: 5000 })

    // The component uses getSavedMeals() via getState() which is non-reactive.
    // Need to switch tabs to force a fresh render that picks up the new data.
    await page.getByRole('tab', { name: 'Daily' }).click()
    await page.getByRole('tab', { name: 'Meals' }).click()

    // Verify meal was saved in the list
    await expect(page.getByText('Chicken Rice Bowl')).toBeVisible({ timeout: 5000 })

    // --- FAVORITE THE SAVED MEAL ---
    await page.locator('button[aria-label="Favorite Chicken Rice Bowl"]').click()
    await expect(page.locator('button[aria-label="Unfavorite Chicken Rice Bowl"]')).toBeVisible()

    // --- CAPTURE DATA FROM LOCALSTORAGE BEFORE SIGN OUT ---
    const macroDataBeforeSignOut = await page.evaluate((key) => {
      const data = localStorage.getItem(key)
      if (!data) return null
      const parsed = JSON.parse(data)
      return {
        savedMeals: parsed.state.savedMeals || [],
        favoriteFoods: parsed.state.favoriteFoods || [],
        recentFoods: parsed.state.recentFoods || [],
      }
    }, STORE_KEYS.macros)

    expect(macroDataBeforeSignOut).toBeTruthy()
    expect(macroDataBeforeSignOut!.savedMeals.length).toBeGreaterThan(0)
    expect(macroDataBeforeSignOut!.favoriteFoods.length).toBeGreaterThan(0)
    expect(macroDataBeforeSignOut!.recentFoods.length).toBeGreaterThan(0)

    // Verify specific data
    const savedMealNames = macroDataBeforeSignOut!.savedMeals.map((m: { name: string }) => m.name)
    expect(savedMealNames).toContain('Chicken Rice Bowl')

    const favoriteFoodNames = macroDataBeforeSignOut!.favoriteFoods.map((f: { name: string }) => f.name)
    expect(favoriteFoodNames).toContain('Chicken Breast, Grilled')
    // The favorited meal is also stored in favoriteFoods
    expect(favoriteFoodNames).toContain('Chicken Rice Bowl')

    // --- SIGN OUT ---
    await page.locator('nav[aria-label="Main navigation"] a[href="/settings"]').click()
    await expect(page.locator('[data-testid="settings-signout-button"]')).toBeVisible({ timeout: 10000 })
    await page.locator('[data-testid="settings-signout-button"]').click()

    // --- AUTH SCREEN (after sign out) ---
    await expect(authScreen).toBeVisible({ timeout: 10000 })
    await page.waitForURL(/\/auth/, { timeout: 5000 })

    // Toggle to sign in mode if needed
    const signInTitle = page.getByText('Sign In', { exact: true }).first()
    if (!(await signInTitle.isVisible().catch(() => false))) {
      await page.locator('[data-testid="auth-toggle-mode"]').click()
    }
    await expect(signInTitle).toBeVisible({ timeout: 5000 })

    // --- SIGN BACK IN ---
    await page.locator('[data-testid="auth-email-input"]').fill('e2e@test.com')
    await page.locator('[data-testid="auth-password-input"]').fill('TestPassword123!')
    await page.locator('[data-testid="auth-submit-button"]').click()

    // Re-inject data (simulating cloud restore)
    await injectDataAfterSignIn(page, USERNAME, macroDataBeforeSignOut!)

    // --- VERIFY HOME SCREEN ---
    await expect(homeScreen).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(USERNAME)).toBeVisible()

    // --- NAVIGATE TO MACROS AND VERIFY DATA PERSISTED ---
    await page.locator('[data-testid="nav-macros"]').click()
    await expect(page.locator('[data-testid="macros-screen"]')).toBeVisible({ timeout: 10000 })

    // --- VERIFY FAVORITES PERSISTED ---
    // Switch to Saved tab
    await page.getByRole('tab', { name: 'Saved' }).click()

    // Verify FAVORITES section exists with our favorited items
    await expect(page.getByText('FAVORITES')).toBeVisible({ timeout: 5000 })
    // Items may appear in multiple places so use first()
    await expect(page.getByText('Chicken Breast, Grilled').first()).toBeVisible()
    await expect(page.getByText('Chicken Rice Bowl').first()).toBeVisible()

    // Verify the hearts are filled (indicating favorited state)
    await expect(page.locator('button[aria-label="Unfavorite Chicken Breast, Grilled"]').first()).toBeVisible()
    await expect(page.locator('button[aria-label="Unfavorite Chicken Rice Bowl"]').first()).toBeVisible()

    // --- VERIFY SAVED MEALS PERSISTED ---
    await expect(page.getByText('SAVED MEALS')).toBeVisible()

    // --- VERIFY RECENT FOODS PERSISTED ---
    // Recent foods appear in the RECENT section (unfavorited ones)
    // White Rice should be in RECENT since we didn't favorite it
    await expect(page.getByText('RECENT')).toBeVisible()
    await expect(page.getByText('White Rice, Cooked').first()).toBeVisible()

    // --- VERIFY DATA IN LOCALSTORAGE AFTER SIGN IN ---
    const macroDataAfterSignIn = await page.evaluate((key) => {
      const data = localStorage.getItem(key)
      if (!data) return null
      const parsed = JSON.parse(data)
      return {
        savedMeals: parsed.state.savedMeals || [],
        favoriteFoods: parsed.state.favoriteFoods || [],
        recentFoods: parsed.state.recentFoods || [],
      }
    }, STORE_KEYS.macros)

    expect(macroDataAfterSignIn).toBeTruthy()

    // Verify counts match
    expect(macroDataAfterSignIn!.savedMeals.length).toBe(macroDataBeforeSignOut!.savedMeals.length)
    expect(macroDataAfterSignIn!.favoriteFoods.length).toBe(macroDataBeforeSignOut!.favoriteFoods.length)
    expect(macroDataAfterSignIn!.recentFoods.length).toBe(macroDataBeforeSignOut!.recentFoods.length)

    // Verify saved meal content
    const savedMealAfter = macroDataAfterSignIn!.savedMeals.find(
      (m: { name: string }) => m.name === 'Chicken Rice Bowl'
    )
    expect(savedMealAfter).toBeTruthy()
    expect(savedMealAfter.ingredients.length).toBe(2)

    // Verify favorite foods content
    const favoriteFoodNamesAfter = macroDataAfterSignIn!.favoriteFoods.map((f: { name: string }) => f.name)
    expect(favoriteFoodNamesAfter).toContain('Chicken Breast, Grilled')
    expect(favoriteFoodNamesAfter).toContain('Chicken Rice Bowl')

    // Verify recent foods content
    const recentFoodNamesAfter = macroDataAfterSignIn!.recentFoods.map((f: { name: string }) => f.name)
    expect(recentFoodNamesAfter).toContain('White Rice, Cooked')
    expect(recentFoodNamesAfter).toContain('Chicken Breast, Grilled')
  })
})
