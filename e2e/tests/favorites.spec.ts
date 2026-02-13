/**
 * E2E tests for the Favorites feature.
 *
 * Covers:
 * - Favoriting a food from the Daily tab's recent foods (heart toggle)
 * - Favorited food appearing in the Saved tab's FAVORITES section
 * - Unfavoriting from the Saved tab moves food back to RECENT
 * - Logging a food from the Saved tab
 * - Favorites persist across page reload (localStorage)
 */
import { test, expect } from '../fixtures/base'

test.describe('Favorites Feature', () => {
  test('favorite a recent food from Daily tab, verify it appears in Saved tab', async ({ seededPage: page }) => {
    // Navigate to Macros
    await page.locator('[data-testid="nav-macros"]').click()
    await expect(page.locator('[data-testid="macros-screen"]')).toBeVisible({ timeout: 10000 })

    // Verify we're on the Daily tab and recent foods are visible
    await expect(page.getByText('RECENT')).toBeVisible()
    await expect(page.getByText('Whey Protein')).toBeVisible()

    // Click the heart on "Whey Protein" to favorite it
    await page.locator('button[aria-label="Favorite Whey Protein"]').click()

    // Heart should now be filled (primary color)
    await expect(
      page.locator('button[aria-label="Unfavorite Whey Protein"]')
    ).toBeVisible()

    // Switch to Saved tab
    await page.getByRole('tab', { name: 'Saved' }).click()

    // Whey Protein should appear in FAVORITES section with a filled heart
    await expect(page.getByText('FAVORITES')).toBeVisible()
    await expect(page.getByText('Whey Protein')).toBeVisible()
    await expect(
      page.locator('button[aria-label="Unfavorite Whey Protein"]')
    ).toBeVisible()

    // Oatmeal should appear in RECENT section (not favorited)
    await expect(page.getByText('Oatmeal')).toBeVisible()
    await expect(
      page.locator('button[aria-label="Favorite Oatmeal"]')
    ).toBeVisible()
  })

  test('unfavorite from Saved tab moves food back to RECENT', async ({ seededPage: page }) => {
    // Navigate to Macros
    await page.locator('[data-testid="nav-macros"]').click()
    await expect(page.locator('[data-testid="macros-screen"]')).toBeVisible({ timeout: 10000 })

    // Favorite Oatmeal from Daily tab
    await page.locator('button[aria-label="Favorite Oatmeal"]').click()

    // Switch to Saved tab
    await page.getByRole('tab', { name: 'Saved' }).click()

    // Oatmeal is in FAVORITES
    await expect(page.getByText('FAVORITES')).toBeVisible()
    await expect(
      page.locator('button[aria-label="Unfavorite Oatmeal"]')
    ).toBeVisible()

    // Unfavorite it
    await page.locator('button[aria-label="Unfavorite Oatmeal"]').click()

    // Oatmeal should now appear in RECENT with an outline heart
    await expect(
      page.locator('button[aria-label="Favorite Oatmeal"]')
    ).toBeVisible()
  })

  test('log a food from the Saved tab', async ({ seededPage: page }) => {
    // Navigate to Macros
    await page.locator('[data-testid="nav-macros"]').click()
    await expect(page.locator('[data-testid="macros-screen"]')).toBeVisible({ timeout: 10000 })

    // Switch to Saved tab
    await page.getByRole('tab', { name: 'Saved' }).click()

    // Click Log on Oatmeal (in RECENT section)
    const oatmealRow = page.getByText('Oatmeal').locator('..')
    await oatmealRow.locator('..').getByRole('button', { name: 'Log' }).click()

    // Should see success indicator (check icon replaces Log text)
    await expect(oatmealRow.locator('..').locator('svg.h-3\\.5').first()).toBeVisible({ timeout: 3000 })
  })

  test('favorites persist after navigation', async ({ seededPage: page }) => {
    // Navigate to Macros
    await page.locator('[data-testid="nav-macros"]').click()
    await expect(page.locator('[data-testid="macros-screen"]')).toBeVisible({ timeout: 10000 })

    // Favorite Whey Protein from Daily tab
    await page.locator('button[aria-label="Favorite Whey Protein"]').click()
    await expect(
      page.locator('button[aria-label="Unfavorite Whey Protein"]')
    ).toBeVisible()

    // Verify it's in localStorage
    const macroData = await page.evaluate(() => localStorage.getItem('gamify-gains-macros'))
    const parsed = JSON.parse(macroData!)
    expect(parsed.state.favoriteFoods.length).toBe(1)
    expect(parsed.state.favoriteFoods[0].name).toBe('Whey Protein')

    // Navigate away (to Home) and back to Macros to test state persistence
    // Note: We don't use page.reload() because the seededPage fixture's addInitScript
    // would re-run and overwrite the localStorage with original seeded data.
    await page.locator('[data-testid="nav-home"]').click()
    await expect(page.locator('[data-testid="home-screen"]')).toBeVisible({ timeout: 10000 })

    // Navigate back to Macros
    await page.locator('[data-testid="nav-macros"]').click()
    await expect(page.locator('[data-testid="macros-screen"]')).toBeVisible({ timeout: 10000 })

    // Whey Protein should still show as favorited (filled heart)
    await expect(
      page.locator('button[aria-label="Unfavorite Whey Protein"]')
    ).toBeVisible()

    // Switch to Saved tab — should still be in FAVORITES
    await page.getByRole('tab', { name: 'Saved' }).click()
    await expect(page.getByText('FAVORITES')).toBeVisible()
    await expect(page.getByText('Whey Protein')).toBeVisible()
  })

  test('saved meals appear in Saved tab with Log button', async ({ seededPage: page }) => {
    // Navigate to Macros
    await page.locator('[data-testid="nav-macros"]').click()
    await expect(page.locator('[data-testid="macros-screen"]')).toBeVisible({ timeout: 10000 })

    // Switch to Saved tab
    await page.getByRole('tab', { name: 'Saved' }).click()

    // The seeded "Post-Workout Shake" saved meal should appear
    await expect(page.getByText('SAVED MEALS')).toBeVisible()
    await expect(page.getByText('Post-Workout Shake')).toBeVisible()

    // Should have a Log button
    const mealRow = page.getByText('Post-Workout Shake').locator('..')
    await expect(mealRow.locator('..').getByRole('button', { name: 'Log' })).toBeVisible()
  })
})
