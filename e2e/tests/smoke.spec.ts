/**
 * Smoke tests -- verify the E2E test infrastructure works.
 *
 * These tests prove:
 * 1. The app loads after real authentication
 * 2. Navigation works to all main screens
 * 3. User data displays correctly
 */
import { test, expect } from '../fixtures/base'

test.describe('Smoke Tests', () => {
  test('app loads after auth and shows home screen', async ({ authenticatedPage }) => {
    // The authenticated page should show the home screen with navigation
    await expect(authenticatedPage.locator('nav[aria-label="Main navigation"]')).toBeVisible()

    // Verify we see the home screen (data-testid)
    await expect(authenticatedPage.locator('[data-testid="home-screen"]')).toBeVisible()
  })

  test('can navigate to all main screens', async ({ authenticatedPage }) => {
    // Home (already there from authenticatedPage fixture)
    await expect(authenticatedPage.locator('[data-testid="home-screen"]')).toBeVisible()

    // Workouts
    await authenticatedPage.getByRole('link', { name: 'Workouts' }).click()
    await expect(authenticatedPage.locator('[data-testid="workouts-screen"]')).toBeVisible()

    // Macros
    await authenticatedPage.getByRole('link', { name: 'Macros' }).click()
    await expect(authenticatedPage.locator('[data-testid="macros-screen"]')).toBeVisible()

    // Avatar
    await authenticatedPage.getByRole('link', { name: 'Avatar' }).click()
    await expect(authenticatedPage.locator('[data-testid="avatar-screen"]')).toBeVisible()

    // Settings
    await authenticatedPage.getByRole('link', { name: 'Settings' }).click()
    await expect(authenticatedPage.locator('[data-testid="settings-screen"]')).toBeVisible()
  })

  test('user profile data is displayed', async ({ authenticatedPage }) => {
    // Verify user-specific data loads (XP, level, or streak display)
    await expect(authenticatedPage.locator('[data-testid="home-xp-display"], [data-testid="home-level-display"]').first()).toBeVisible()
  })
})
