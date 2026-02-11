/**
 * Supabase auth mock helpers for E2E tests.
 *
 * Sets up page.route() interceptors that mock Supabase auth API responses,
 * allowing auth tests to run without a real Supabase backend.
 *
 * The fake Supabase URL is http://fake-supabase.test (configured in
 * playwright.config.ts webServer env vars for port 5174).
 */
import type { Page } from '@playwright/test'

const FAKE_USER = {
  id: 'e2e-test-user-id',
  email: 'e2e@test.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: '2026-01-01T00:00:00.000Z',
}

const FAKE_SESSION = {
  access_token: 'fake-access-token-e2e',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'fake-refresh-token-e2e',
  user: FAKE_USER,
}

/**
 * Mock Supabase auth for the sign-up flow.
 *
 * After sign-up, returns a valid session so the app transitions to Onboarding.
 * Must be called BEFORE page.goto().
 */
export async function mockSupabaseSignUp(page: Page) {
  // Catch-all for auth endpoints on the fake Supabase URL
  await page.route('**/auth/v1/**', async (route) => {
    const url = route.request().url()
    const method = route.request().method()

    // POST /auth/v1/signup -- sign-up request
    if (url.includes('/auth/v1/signup') && method === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: FAKE_USER,
          session: FAKE_SESSION,
        }),
      })
      return
    }

    // POST /auth/v1/token -- token refresh or password login
    if (url.includes('/auth/v1/token') && method === 'POST') {
      // Return valid session for any token request (refresh after signup)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FAKE_SESSION),
      })
      return
    }

    // GET /auth/v1/user -- get user endpoint
    if (url.includes('/auth/v1/user') && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FAKE_USER),
      })
      return
    }

    // Any other auth endpoint -- return empty success
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{}',
    })
  })

  // Mock generic REST API calls to prevent Supabase data sync failures
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
 *
 * Initial session check returns no session (so Auth screen shows).
 * Password sign-in returns a valid session so the app transitions to Home.
 * Must be called BEFORE page.goto().
 */
export async function mockSupabaseSignIn(page: Page) {
  // Track whether a successful sign-in has occurred
  let signedIn = false

  // Catch-all for auth endpoints on the fake Supabase URL
  await page.route('**/auth/v1/**', async (route) => {
    const url = route.request().url()
    const method = route.request().method()

    // POST /auth/v1/token -- token requests
    if (url.includes('/auth/v1/token') && method === 'POST') {
      if (url.includes('grant_type=password')) {
        // Password sign-in -- return valid session
        signedIn = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(FAKE_SESSION),
        })
        return
      }

      if (signedIn) {
        // After sign-in, token refresh should succeed
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(FAKE_SESSION),
        })
        return
      }

      // Before sign-in, return error so app shows Auth screen
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'invalid_grant',
          error_description: 'No session found',
        }),
      })
      return
    }

    // GET /auth/v1/user
    if (url.includes('/auth/v1/user') && method === 'GET') {
      if (signedIn) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(FAKE_USER),
        })
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'not_authenticated' }),
        })
      }
      return
    }

    // POST /auth/v1/signup or anything else -- just succeed
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{}',
    })
  })

  // Mock generic REST API calls to prevent Supabase data sync failures
  await page.route('**/rest/v1/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '[]',
    })
  })
}

/**
 * Mock Supabase auth for the full cycle: sign-up -> sign-out -> re-sign-in.
 *
 * Tracks session state through signup, logout, and password login.
 * Must be called BEFORE page.goto().
 */
export async function mockSupabaseFullCycle(page: Page) {
  let signedIn = false

  await page.route('**/auth/v1/**', async (route) => {
    const url = route.request().url()
    const method = route.request().method()

    // POST /auth/v1/signup
    if (url.includes('/auth/v1/signup') && method === 'POST') {
      signedIn = true
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: FAKE_USER, session: FAKE_SESSION }),
      })
      return
    }

    // POST /auth/v1/logout
    if (url.includes('/auth/v1/logout') && method === 'POST') {
      signedIn = false
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{}',
      })
      return
    }

    // POST /auth/v1/token
    if (url.includes('/auth/v1/token') && method === 'POST') {
      if (url.includes('grant_type=password')) {
        signedIn = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(FAKE_SESSION),
        })
        return
      }

      if (signedIn) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(FAKE_SESSION),
        })
        return
      }

      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_grant', error_description: 'No session found' }),
      })
      return
    }

    // GET /auth/v1/user
    if (url.includes('/auth/v1/user') && method === 'GET') {
      if (signedIn) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(FAKE_USER),
        })
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'not_authenticated' }),
        })
      }
      return
    }

    // Fallback
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{}',
    })
  })

  await page.route('**/rest/v1/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '[]',
    })
  })
}
