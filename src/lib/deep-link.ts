import { App } from '@capacitor/app'
import { supabase } from '@/lib/supabase'
import { isNative } from '@/lib/platform'

// Allowed URL schemes and hosts for deep links
const ALLOWED_SCHEMES = ['https', 'capacitor', 'welltrained']
const ALLOWED_HOSTS = [
  'app.welltrained.fitness',
  'welltrained.fitness',
  'localhost', // Capacitor
]

/**
 * Validate that a URL is from a trusted source.
 * This helps prevent malicious deep links from hijacking sessions.
 */
function isValidDeepLinkUrl(url: string): boolean {
  try {
    const parsed = new URL(url)

    // Check scheme
    if (!ALLOWED_SCHEMES.includes(parsed.protocol.replace(':', ''))) {
      console.warn('[deep-link] Rejected URL with invalid scheme:', parsed.protocol)
      return false
    }

    // For http/https URLs, check host
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
        console.warn('[deep-link] Rejected URL with invalid host:', parsed.hostname)
        return false
      }
    }

    return true
  } catch {
    return false
  }
}

/**
 * Process a deep link URL: extract auth tokens from hash fragment,
 * restore session, and navigate to the appropriate route.
 *
 * Security: Only processes URLs from trusted sources and validates
 * token type before setting session.
 */
async function handleDeepLink(url: string, navigate: (path: string) => void) {
  try {
    // Validate the URL source
    if (!isValidDeepLinkUrl(url)) {
      console.error('[deep-link] Rejected untrusted URL:', url)
      return
    }

    const parsed = new URL(url)
    const hashParams = new URLSearchParams(parsed.hash.substring(1))

    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    const type = hashParams.get('type')

    if (accessToken && refreshToken) {
      // Validate this is a known auth flow type
      const validTypes = ['recovery', 'signup', 'magiclink', 'invite']
      if (type && !validTypes.includes(type)) {
        console.warn('[deep-link] Unknown auth type:', type)
        // Still process but log for monitoring
      }

      // Verify tokens look like JWTs before using
      if (!accessToken.includes('.') || !refreshToken.includes('.')) {
        console.error('[deep-link] Invalid token format')
        return
      }

      // Set the session - Supabase will validate the tokens
      const { error } = await supabase?.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }) ?? { error: new Error('Supabase not initialized') }

      if (error) {
        console.error('[deep-link] Failed to set session:', error.message)
        // Don't navigate - invalid tokens
        return
      }

      // Navigate based on type
      if (type === 'recovery') {
        navigate('/reset-password')
      } else {
        navigate('/')
      }
    } else if (parsed.pathname && parsed.pathname !== '/') {
      // Non-auth deep link -- navigate to path (e.g., push notification taps)
      // Only allow known paths to prevent open redirect
      const allowedPaths = [
        '/',
        '/workouts',
        '/macros',
        '/avatar',
        '/settings',
        '/achievements',
        '/checkin',
        '/protocol-ai',
      ]

      if (allowedPaths.includes(parsed.pathname)) {
        navigate(parsed.pathname)
      } else {
        console.warn('[deep-link] Rejected unknown path:', parsed.pathname)
        navigate('/')
      }
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[deep-link] Failed to handle URL:', url, err)
    }
  }
}

/**
 * Initialize the deep link handler. Must be called once from App.tsx.
 * Only registers native listeners when running inside Capacitor.
 */
export function initDeepLinkHandler(navigate: (path: string) => void) {
  if (!isNative()) return

  // Handle deep links when the app is already running (warm start)
  App.addListener('appUrlOpen', (event) => {
    handleDeepLink(event.url, navigate)
  })

  // Handle deep links from a cold start (app was not running)
  App.getLaunchUrl().then((result) => {
    if (result?.url) {
      handleDeepLink(result.url, navigate)
    }
  })
}
