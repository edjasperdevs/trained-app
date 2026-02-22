import { App } from '@capacitor/app'
import { supabase } from '@/lib/supabase'
import { isNative } from '@/lib/platform'

/**
 * Process a deep link URL: extract auth tokens from hash fragment,
 * restore session, and navigate to the appropriate route.
 */
async function handleDeepLink(url: string, navigate: (path: string) => void) {
  try {
    const parsed = new URL(url)
    const hashParams = new URLSearchParams(parsed.hash.substring(1))

    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')

    if (accessToken && refreshToken) {
      // Auth deep link -- restore session from tokens
      await supabase?.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      const type = hashParams.get('type')
      if (type === 'recovery') {
        navigate('/reset-password')
      } else {
        navigate('/')
      }
    } else if (parsed.pathname && parsed.pathname !== '/') {
      // Non-auth deep link -- navigate to path (future: push notification taps)
      navigate(parsed.pathname)
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
