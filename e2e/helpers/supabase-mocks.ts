/**
 * Supabase auth mock helpers for E2E tests.
 *
 * Sets up page.route() interceptors that mock Supabase auth API responses,
 * allowing auth tests to run without a real Supabase backend.
 */
import type { Page } from '@playwright/test'

const FAKE_USER = {
  id: 'e2e-test-user-id',
  email: 'e2e@test.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: new Date().toISOString(),
}

const FAKE_SESSION = {
  access_token: 'fake-access-token-e2e',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'fake-refresh-token-e2e',
  user: FAKE_USER,
}

/**
 * Mock Supabase auth for the sign-up flow.
 * Intercepts: signup, token refresh, user endpoint, and REST API calls.
 * Must be called BEFORE page.goto().
 */
export async function mockSupabaseSignUp(page: Page) {
  // Mock signup endpoint
  await page.route('**/auth/v1/signup', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: FAKE_USER,
        session: FAKE_SESSION,
      }),
    })
  })

  // Mock token refresh endpoint
  await page.route('**/auth/v1/token?grant_type=refresh_token', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(FAKE_SESSION),
    })
  })

  // Mock user endpoint (GET)
  await page.route('**/auth/v1/user', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(FAKE_USER),
    })
  })

  // Mock initial session check (getSession calls token endpoint)
  await page.route('**/auth/v1/token?grant_type=*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(FAKE_SESSION),
    })
  })

  // Mock generic REST API calls to prevent failures
  await page.route('**/rest/v1/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '[]',
    })
  })
}

/**
 * Mock Supabase auth for the sign-in flow.
 * Intercepts: password login, token refresh, user endpoint, and REST API calls.
 * Must be called BEFORE page.goto().
 */
export async function mockSupabaseSignIn(page: Page) {
  // Mock password login endpoint
  await page.route('**/auth/v1/token?grant_type=password', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(FAKE_SESSION),
    })
  })

  // Mock token refresh endpoint
  await page.route('**/auth/v1/token?grant_type=refresh_token', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(FAKE_SESSION),
    })
  })

  // Mock user endpoint (GET)
  await page.route('**/auth/v1/user', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(FAKE_USER),
    })
  })

  // Mock initial session check -- return 401 so app shows Auth screen initially
  // (no existing session before sign-in)
  await page.route('**/auth/v1/token?grant_type=*', async (route) => {
    // Check if this is the password grant (sign-in) or refresh (initial check)
    const url = route.request().url()
    if (url.includes('grant_type=password')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FAKE_SESSION),
      })
    } else {
      // For refresh token or other grant types during init, return error
      // so the app shows auth screen
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_grant', error_description: 'No session' }),
      })
    }
  })

  // Mock generic REST API calls to prevent failures
  await page.route('**/rest/v1/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '[]',
    })
  })
}
