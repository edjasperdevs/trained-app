import { GoogleAuth } from '@southdevs/capacitor-google-auth'
import { supabase } from './supabase'
import { isNative } from './platform'

let isConfigured = false

export async function configureGoogleSignIn(): Promise<void> {
  if (isConfigured || !isNative()) return

  await GoogleAuth.initialize({
    clientId: import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
    grantOfflineAccess: true,
  })
  isConfigured = true
}

export async function signInWithGoogle(): Promise<{ data: any; error: string | null }> {
  if (!isNative()) {
    return { data: null, error: 'Google Sign-In is only available on iOS' }
  }

  if (!supabase) {
    return { data: null, error: 'Supabase is not configured' }
  }

  try {
    await configureGoogleSignIn()

    const result = await GoogleAuth.signIn({
      scopes: ['profile', 'email'],
    })

    if (!result.authentication?.idToken) {
      return { data: null, error: 'No ID token received from Google' }
    }

    // Pass ID token to Supabase
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: result.authentication.idToken,
    })

    if (error) {
      return { data: null, error: error.message }
    }

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
