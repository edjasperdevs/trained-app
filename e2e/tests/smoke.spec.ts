/**
 * Smoke tests -- verify the E2E test infrastructure works.
 *
 * These tests prove:
 * 1. The app loads with seeded state (pre-authenticated)
 * 2. Navigation works to all main screens
 * 3. Each test gets a fresh browser context (no state leakage)
 */
import { test, expect } from '../fixtures/base'
import { test as baseTest, expect as baseExpect } from '@playwright/test'

test.describe('Smoke Tests', () => {
  test('app loads with seeded state and shows home screen', async ({ seededPage }) => {
    // The seeded page should show the home screen with user data
    await expect(seededPage.locator('nav[aria-label="Main navigation"]')).toBeVisible()

    // Verify we see the username from seeded data
    await expect(seededPage.getByText('E2ETestUser')).toBeVisible()
  })

  test('can navigate to all main screens', async ({ seededPage }) => {
    // Home (already there from seededPage fixture)
    await expect(seededPage.getByText('E2ETestUser')).toBeVisible()

    // Workouts
    await seededPage.getByRole('link', { name: 'Workouts' }).click()
    await expect(seededPage.getByText('Training')).toBeVisible()

    // Macros
    await seededPage.getByRole('link', { name: 'Macros' }).click()
    await expect(seededPage.getByRole('heading', { name: 'Macros' })).toBeVisible()

    // Avatar
    await seededPage.getByRole('link', { name: 'Avatar' }).click()
    await expect(seededPage.getByRole('heading', { name: 'Your Status' })).toBeVisible()

    // Settings
    await seededPage.getByRole('link', { name: 'Settings' }).click()
    await expect(seededPage.getByRole('heading', { name: 'Settings' })).toBeVisible()
  })
})

// Test isolation -- uses a regular (non-seeded) page
baseTest('test isolation -- fresh context has no seeded data', async ({ page }) => {
  // With VITE_DEV_BYPASS=true and NO seeded data, the app should still load
  // (dev bypass skips auth gates). This proves test contexts are isolated.
  await page.goto('/')

  // The app should render (dev bypass lets us through)
  // We should NOT see the seeded username
  await baseExpect(page.getByText('E2ETestUser')).not.toBeVisible({ timeout: 5000 })
})
