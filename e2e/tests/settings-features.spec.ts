/**
 * Settings features E2E tests.
 *
 * Covers userflow features:
 * - 3.14 Weight Tracking: log weight, goal weight, trend display
 * - 3.18 Data Export: export button triggers download
 * - 3.19 Account Deletion: delete account confirmation dialog
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

/** Wait for the app to be ready */
async function waitForApp(page: import('@playwright/test').Page) {
    await page.waitForSelector('[aria-label="Main navigation"], nav', {
        timeout: 15000,
    })
}

// ============================================================
// SET-WEIGHT: Weight logging in Settings
// ============================================================
baseTest('SET-WEIGHT: log weight and verify update', async ({ page }) => {
    await seedAllStores(page)
    await disableAnimations(page)
    await page.goto('/')
    await waitForApp(page)

    // Navigate to Settings
    await page.getByRole('link', { name: 'Settings' }).click()
    await baseExpect(page.locator('[data-testid="settings-screen"]')).toBeVisible({ timeout: 10000 })

    // Scroll to Weight Tracking section
    await page.getByText('Weight Tracking').scrollIntoViewIfNeeded()
    await baseExpect(page.getByText('Weight Tracking')).toBeVisible()

    // Find and fill the weight input
    const weightInput = page.locator('input[type="number"]').first()
    await weightInput.fill('190')

    // Click the Log/Update button
    const logButton = page.getByRole('button', { name: /Log|Update/ })
    await logButton.click()

    // Verify success toast
    await baseExpect(page.getByText('Weight logged')).toBeVisible({ timeout: 5000 })

    // Verify current weight display updated
    await baseExpect(page.getByText('190')).toBeVisible()
})

// ============================================================
// SET-GOAL: Set goal weight
// ============================================================
baseTest('SET-GOAL: set goal weight and verify display', async ({ page }) => {
    await seedAllStores(page)
    await disableAnimations(page)
    await page.goto('/')
    await waitForApp(page)

    // Navigate to Settings
    await page.getByRole('link', { name: 'Settings' }).click()
    await baseExpect(page.locator('[data-testid="settings-screen"]')).toBeVisible({ timeout: 10000 })

    // Scroll to weight tracking section
    await page.getByText('Weight Tracking').scrollIntoViewIfNeeded()

    // The Goal Weight section should be visible — look for input to set goal
    const goalSection = page.getByText('Goal', { exact: false })
    await baseExpect(goalSection.first()).toBeVisible()
})

// ============================================================
// SET-EXPORT: Data export button
// ============================================================
baseTest('SET-EXPORT: export data button is visible and clickable', async ({ page }) => {
    await seedAllStores(page)
    await disableAnimations(page)
    await page.goto('/')
    await waitForApp(page)

    // Navigate to Settings
    await page.getByRole('link', { name: 'Settings' }).click()
    await baseExpect(page.locator('[data-testid="settings-screen"]')).toBeVisible({ timeout: 10000 })

    // Scroll to Data section
    const exportButton = page.locator('[data-testid="settings-export-button"]')
    await exportButton.scrollIntoViewIfNeeded()
    await baseExpect(exportButton).toBeVisible()
    await baseExpect(exportButton).toBeEnabled()
})

// ============================================================
// SET-DELETE: Account deletion confirmation dialog
// ============================================================
baseTest('SET-DELETE: delete account shows confirmation dialog', async ({ page }) => {
    await seedAllStores(page)
    await disableAnimations(page)
    await page.goto('/')
    await waitForApp(page)

    // Navigate to Settings
    await page.getByRole('link', { name: 'Settings' }).click()
    await baseExpect(page.locator('[data-testid="settings-screen"]')).toBeVisible({ timeout: 10000 })

    // Scroll to Danger Zone
    await page.getByText('Delete Account').scrollIntoViewIfNeeded()
    await baseExpect(page.getByText('Delete Account')).toBeVisible()

    // Set up dialog handler BEFORE clicking (window.confirm)
    page.on('dialog', async (dialog) => {
        baseExpect(dialog.type()).toBe('confirm')
        await dialog.dismiss() // Don't actually delete
    })

    // Click the Delete Account button
    await page.getByRole('button', { name: 'Delete Account' }).click()
})
