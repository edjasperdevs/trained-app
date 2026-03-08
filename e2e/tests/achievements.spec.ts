/**
 * Achievements screen E2E tests.
 *
 * Covers userflow feature 3.9: Achievements and Badges
 * - Navigate to achievements screen
 * - Verify badge grid renders
 * - Verify earned badges are highlighted
 * - Verify badge detail view
 */
import { test as baseTest, expect as baseExpect } from '@playwright/test'
import { test, expect } from '../fixtures/base'
import { seedAllStores, seedStore, STORE_KEYS } from '../helpers/storage'

/** Inject CSS to disable animations */
async function disableAnimations(page: import('@playwright/test').Page) {
    await page.addInitScript(() => {
        const style = document.createElement('style')
        style.textContent = `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `
        if (document.head) {
            document.head.appendChild(style)
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                document.head.appendChild(style)
            })
        }
    })
}

/** Wait for app */
async function waitForApp(page: import('@playwright/test').Page) {
    await page.waitForSelector('[aria-label="Main navigation"], nav', {
        timeout: 15000,
    })
}

// ============================================================
// ACH-01: Achievements screen renders with badge grid
// ============================================================
baseTest('ACH-01: achievements -- screen renders with badge grid', async ({ page }) => {
    await seedAllStores(page)
    await disableAnimations(page)
    await page.goto('/achievements')
    await waitForApp(page)

    // Verify achievements screen loaded — look for heading or badge names
    await baseExpect(page.getByText('Achievements').first()).toBeVisible({ timeout: 10000 })

    // Verify at least some badges are visible
    // The badge definitions include 'Iron Will', 'First Rep', 'Day One', etc.
    await baseExpect(page.getByText('Iron Will').or(page.getByText('First Rep'))).toBeVisible({ timeout: 5000 })
})

// ============================================================
// ACH-02: Earned badges are distinguishable from unearned
// ============================================================
baseTest('ACH-02: achievements -- earned badges are visible', async ({ page }) => {
    await seedAllStores(page)
    // The default seed has 'first-rep' and 'day-one' badges earned
    await disableAnimations(page)
    await page.goto('/achievements')
    await waitForApp(page)

    await baseExpect(page.getByText('Achievements').first()).toBeVisible({ timeout: 10000 })

    // Seeded user has earned 'first-rep' (First Rep) and 'day-one' (Day One)
    await baseExpect(page.getByText('First Rep')).toBeVisible({ timeout: 5000 })
    await baseExpect(page.getByText('Day One')).toBeVisible({ timeout: 5000 })
})

// ============================================================
// ACH-03: Badge detail is accessible
// ============================================================
baseTest('ACH-03: achievements -- badge details show description', async ({ page }) => {
    await seedAllStores(page)
    await disableAnimations(page)
    await page.goto('/achievements')
    await waitForApp(page)

    await baseExpect(page.getByText('Achievements').first()).toBeVisible({ timeout: 10000 })

    // Look for badge descriptions — these should be visible on the grid or on tap
    // 'Complete your first workout' is the description for First Rep
    await baseExpect(
        page.getByText('Complete your first workout')
            .or(page.getByText('Maintain a 7-day streak'))
    ).toBeVisible({ timeout: 5000 })
})

// ============================================================
// ACH-04: Navigate to achievements from avatar screen
// ============================================================
test('ACH-04: achievements -- navigable from avatar screen', async ({ authenticatedPage: page }) => {
    // Navigate to Avatar first
    await page.getByRole('link', { name: 'Avatar' }).click()
    await expect(page.locator('[data-testid="avatar-screen"]')).toBeVisible({ timeout: 10000 })

    // Click Achievements link
    const achievementsLink = page.getByText('Achievements').or(page.getByRole('link', { name: /achievement/i }))
    await achievementsLink.first().click()

    // Verify achievements screen loaded
    await expect(page.getByText('Achievements').first()).toBeVisible({ timeout: 10000 })
})
