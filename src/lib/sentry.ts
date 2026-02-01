/**
 * Sentry Error Tracking
 *
 * Captures errors and performance data in production.
 *
 * Setup:
 * 1. Create a free account at https://sentry.io
 * 2. Create a new React project
 * 3. Copy your DSN and add it to .env as VITE_SENTRY_DSN
 *
 * The DSN looks like: https://xxx@xxx.ingest.sentry.io/xxx
 */

import * as Sentry from '@sentry/react'

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN

export function initSentry() {
  // Only initialize in production with a valid DSN
  if (import.meta.env.DEV || !SENTRY_DSN) {
    if (import.meta.env.DEV) {
      console.log('[Sentry] Disabled in development mode')
    }
    return
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,

    // Performance Monitoring
    tracesSampleRate: 0.1, // Capture 10% of transactions for performance

    // Session Replay - captures user sessions on errors
    replaysSessionSampleRate: 0, // Don't record normal sessions
    replaysOnErrorSampleRate: 1.0, // Record 100% of sessions with errors

    // Filter out noisy errors
    ignoreErrors: [
      // Browser extensions
      /extensions\//i,
      /^chrome-extension:\/\//i,
      // Network errors that aren't actionable
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      // User-caused errors
      'ResizeObserver loop',
    ],

    // Don't send PII
    beforeSend(event) {
      // Remove any potential PII from error messages
      if (event.message) {
        // Redact email-like strings
        event.message = event.message.replace(
          /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
          '[EMAIL]'
        )
      }
      return event
    },
  })

  console.log('[Sentry] Initialized')
}

/**
 * Capture a custom error with context
 */
export function captureError(error: Error, context?: Record<string, unknown>) {
  if (import.meta.env.DEV) {
    console.error('[Sentry] Would capture:', error, context)
    return
  }

  Sentry.captureException(error, {
    extra: context,
  })
}

/**
 * Capture a message (non-error event)
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (import.meta.env.DEV) {
    console.log(`[Sentry] Would capture message (${level}):`, message)
    return
  }

  Sentry.captureMessage(message, level)
}

/**
 * Set user context for error tracking
 * Call this after user signs in
 */
export function setUser(userId: string, email?: string) {
  Sentry.setUser({
    id: userId,
    email: email, // Optional - remove if you don't want to track emails
  })
}

/**
 * Clear user context
 * Call this after user signs out
 */
export function clearUser() {
  Sentry.setUser(null)
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  })
}

// Export Sentry's ErrorBoundary for React
export const ErrorBoundary = Sentry.ErrorBoundary
