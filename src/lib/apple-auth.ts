import { SignInWithApple, SignInWithAppleOptions, SignInWithAppleResponse } from '@capacitor-community/apple-sign-in'
import { supabase } from './supabase'
import { isNative } from './platform'

export async function signInWithApple(): Promise<{ data: any; error: string | null }> {
  if (!isNative()) {
    return { data: null, error: 'Apple Sign-In is only available on iOS' }
  }

  if (!supabase) {
    return { data: null, error: 'Supabase is not configured' }
  }

  try {
    const options: SignInWithAppleOptions = {
      clientId: 'fitness.welltrained.app', // Bundle ID
      redirectURI: '', // Not needed for native
      scopes: 'email name',
      state: '', // Optional
      nonce: '', // Optional, Supabase handles
    }

    const result: SignInWithAppleResponse = await SignInWithApple.authorize(options)

    if (!result.response?.identityToken) {
      return { data: null, error: 'No identity token received from Apple' }
    }

    // Pass identity token to Supabase
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: result.response.identityToken,
    })

    if (error) {
      return { data: null, error: error.message }
    }

    // Store user's name on first sign-in (Apple only provides this once)
    if (result.response.givenName || result.response.familyName) {
      const fullName = [result.response.givenName, result.response.familyName]
        .filter(Boolean)
        .join(' ')
      // Update profile with name (will be handled by downstream profile sync)
      console.log('[Apple Auth] First-time name:', fullName)
    }

    return { data, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Apple Sign-In failed'
    console.error('[Apple Auth] Error:', err)
    return { data: null, error: message }
  }
}
