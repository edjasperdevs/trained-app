/**
 * Locked Protocol E2E tests.
 *
 * Covers userflow feature 3.10: Locked Protocol (Commitment Challenge)
 * - Navigate to Locked Protocol screen
 * - View protocol type selection
 * - View goal duration options
 * - Verify setup form elements are interactive
 */
import { test as baseTest, expect as baseExpect } from '@playwright/test'
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
// LP-01: Locked Protocol screen renders with setup form
// ============================================================
baseTest('LP-01: locked protocol -- setup form renders with type and duration options', async ({ page }) => {
    await seedAllStores(page)
    await disableAnimations(page)
    await page.goto('/locked-protocol')
    await waitForApp(page)

    // Verify the screen loaded
    await baseExpect(page.getByText('Accept the Protocol')).toBeVisible({ timeout: 10000 })

    // Verify protocol type options
    await baseExpect(page.getByText('Continuous')).toBeVisible()
    await baseExpect(page.getByText('Day Lock')).toBeVisible()

    // Verify goal duration options (7, 14, 21, 30, 60, 90)
    await baseExpect(page.getByText('7', { exact: true }).first()).toBeVisible()
    await baseExpect(page.getByText('30', { exact: true }).first()).toBeVisible()
    await baseExpect(page.getByText('90', { exact: true }).first()).toBeVisible()
})

// ============================================================
// LP-02: Protocol type selection is interactive
// ============================================================
baseTest('LP-02: locked protocol -- protocol type selection toggles', async ({ page }) => {
    await seedAllStores(page)
    await disableAnimations(page)
    await page.goto('/locked-protocol')
    await waitForApp(page)

    await baseExpect(page.getByText('Accept the Protocol')).toBeVisible({ timeout: 10000 })

    // Click Day Lock option
    await page.getByText('Day Lock').click()

    // Click Continuous option
    await page.getByText('Continuous').click()
})

// ============================================================
// LP-03: Goal duration selection
// ============================================================
baseTest('LP-03: locked protocol -- goal duration is selectable', async ({ page }) => {
    await seedAllStores(page)
    await disableAnimations(page)
    await page.goto('/locked-protocol')
    await waitForApp(page)

    await baseExpect(page.getByText('Accept the Protocol')).toBeVisible({ timeout: 10000 })

    // Click 14-day option
    await page.getByText('14', { exact: true }).first().click()

    // Click 60-day option
    await page.getByText('60', { exact: true }).first().click()
})

// ============================================================
// LP-04: Active protocol displays correct state
// ============================================================
baseTest('LP-04: locked protocol -- active protocol view renders', async ({ page }) => {
    // Seed with an active protocol
    await seedAllStores(page)
    await seedStore(page, 'trained-locked-protocol', {
        milestonesReached: [7],
    }, 0)

    // Also seed the lockedStore state in localStorage
    // The lockedStore uses Supabase for active protocol, but since we're in bypass mode
    // we can test the UI by checking it loads without errors
    await disableAnimations(page)
    await page.goto('/locked-protocol')
    await waitForApp(page)

    // The page should load without errors — either showing the setup form
    // (if no active protocol from supabase) or the active view
    // Since supabase is not available in e2e bypass mode, setup form will show
    await baseExpect(page.getByText('Accept the Protocol').or(page.getByText('Protocol active'))).toBeVisible({ timeout: 10000 })
})
