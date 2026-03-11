import { GoogleAuth } from '@southdevs/capacitor-google-auth'
import { supabase } from './supabase'
import { isNative } from './platform'

let isConfigured = false

// Timeout wrapper to prevent hanging
function withTimeout<T>(promise: Promise<T>, ms: number, operation: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${operation} timed out after ${ms / 1000}s`)), ms)
    )
  ])
}

export async function configureGoogleSignIn(): Promise<void> {
  if (isConfigured || !isNative()) return

  // Use iOS client ID for native iOS app
  const clientId = import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID || import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID
  console.log('[Google Auth] Initializing with client ID:', clientId?.substring(0, 20) + '...')

  await withTimeout(
    GoogleAuth.initialize({
      clientId,
      scopes: ['profile', 'email'],
      grantOfflineAccess: true,
    }),
    10000,
    'Google Auth initialization'
  )
  isConfigured = true
  console.log('[Google Auth] Initialized successfully')
}

export async function signInWithGoogle(): Promise<{ data: any; error: string | null }> {
  if (!isNative()) {
    return { data: null, error: 'Google Sign-In is only available on iOS' }
  }

  if (!supabase) {
    return { data: null, error: 'Supabase is not configured' }
  }

  try {
    console.log('[Google Auth] Starting sign-in flow...')
    await configureGoogleSignIn()

    console.log('[Google Auth] Calling GoogleAuth.signIn()...')
    const result = await withTimeout(
      GoogleAuth.signIn({
        scopes: ['profile', 'email'],
        serverClientId: import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID,
      } as any),
      30000,
      'Google Sign-In'
    )
    console.log('[Google Auth] Sign-in returned:', result ? 'success' : 'no result')

    if (!result.authentication?.idToken) {
      return { data: null, error: 'No ID token received from Google' }
    }

    console.log('[Google Auth] Got ID token, exchanging with Supabase...')
    // Pass ID token to Supabase
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: result.authentication.idToken,
    })

    if (error) {
      console.error('[Google Auth] Supabase error:', error.message)
      return { data: null, error: error.message }
    }

    console.log('[Google Auth] Sign-in complete!')
    return { data, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Google Sign-In failed'
    console.error('[Google Auth] Error:', err)
    return { data: null, error: message }
  }
}

export async function signOutGoogle(): Promise<void> {
  if (!isNative()) return
  try {
    await GoogleAuth.signOut()
  } catch (err) {
    console.error('[Google Auth] Sign out error:', err)
  }
}
