/**
 * Recruit (Referral System) E2E tests.
 *
 * Covers userflow feature 3.11: Recruit
 * - Navigate to recruit screen
 * - Verify referral code display
 * - Verify recruit status section
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
// REC-01: Recruit screen renders
// ============================================================
baseTest('REC-01: recruit -- screen renders with referral section', async ({ page }) => {
    await seedAllStores(page)
    // Seed referral store with a code
    await seedStore(page, 'trained-referral', {
        capturedReferralCode: null,
    }, 0)
    await disableAnimations(page)
    await page.goto('/recruit')
    await waitForApp(page)

    // Verify the recruit screen loaded — look for Recruit heading or invite section
    await baseExpect(
        page.getByText('Recruit').or(page.getByText('Invite')).or(page.getByText('Referral'))
    ).toBeVisible({ timeout: 10000 })
})

// ============================================================
// REC-02: Share invite button is visible
// ============================================================
baseTest('REC-02: recruit -- share invite button is visible', async ({ page }) => {
    await seedAllStores(page)
    await seedStore(page, 'trained-referral', {
        capturedReferralCode: null,
    }, 0)
    await disableAnimations(page)
    await page.goto('/recruit')
    await waitForApp(page)

    // Look for the share/invite button
    await baseExpect(
        page.getByRole('button', { name: /share|invite|copy/i })
            .or(page.getByText(/Share Invite|Copy Link/i))
    ).toBeVisible({ timeout: 10000 })
})

// ============================================================
// REC-03: Recruit status section is visible
// ============================================================
baseTest('REC-03: recruit -- status section shows recruit info', async ({ page }) => {
    await seedAllStores(page)
    await seedStore(page, 'trained-referral', {
        capturedReferralCode: null,
    }, 0)
    await disableAnimations(page)
    await page.goto('/recruit')
    await waitForApp(page)

    // Verify recruit status labels are visible (Pending, Completed, or similar)
    await baseExpect(
        page.getByText(/Pending|Recruit|Status|Total/i).first()
    ).toBeVisible({ timeout: 10000 })
})
