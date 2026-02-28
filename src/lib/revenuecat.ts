/**
 * RevenueCat SDK Initialization
 *
 * Handles RevenueCat SDK configuration for iOS in-app purchases.
 * All functions are guarded with isNative() to prevent errors on web.
 */

import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor'
import { isNative } from './platform'

const IOS_API_KEY = import.meta.env.VITE_REVENUECAT_IOS_API_KEY

/**
 * Initialize RevenueCat SDK with the given user ID.
 * Must be called after user authentication on native platforms.
 */
export async function initializeRevenueCat(userId: string): Promise<void> {
  if (!isNative()) return

  if (!IOS_API_KEY) {
    if (import.meta.env.DEV) {
      console.warn('[RevenueCat] VITE_REVENUECAT_IOS_API_KEY not configured')
    }
    return
  }

  try {
    await Purchases.configure({
      apiKey: IOS_API_KEY,
      appUserID: userId
    })

    // Enable debug logging in development only
    if (import.meta.env.DEV) {
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG })
    }

    if (import.meta.env.DEV) {
      console.log('[RevenueCat] Initialized with user:', userId)
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[RevenueCat] Initialization error:', error)
    }
  }
}

/**
 * Log in a user to RevenueCat (use after auth state change).
 * Returns the CustomerInfo for the logged-in user.
 */
export async function loginToRevenueCat(userId: string): Promise<void> {
  if (!isNative()) return

  try {
    await Purchases.logIn({ appUserID: userId })
    if (import.meta.env.DEV) {
      console.log('[RevenueCat] Logged in user:', userId)
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[RevenueCat] Login error:', error)
    }
  }
}

/**
 * Log out the current user from RevenueCat.
 * Call this on sign out before clearing auth state.
 */
export async function logoutFromRevenueCat(): Promise<void> {
  if (!isNative()) return

  try {
    await Purchases.logOut()
    if (import.meta.env.DEV) {
      console.log('[RevenueCat] Logged out')
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[RevenueCat] Logout error:', error)
    }
  }
}
