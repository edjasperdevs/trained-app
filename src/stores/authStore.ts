import { create } from 'zustand'
import { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { pushClientData, pullCoachData, loadAllFromCloud } from '@/lib/sync'
import { toast } from './toastStore'
import { captureError, setUser as sentrySetUser, clearUser as sentryClearUser } from '@/lib/sentry'
import { removeDeviceToken } from '@/lib/push'
import { logoutFromRevenueCat } from '@/lib/revenuecat'
import { useUserStore } from './userStore'
import { useDPStore } from './dpStore'
import { useMacroStore } from './macroStore'
import { useWorkoutStore } from './workoutStore'
import { useAvatarStore } from './avatarStore'
import { useAccessStore } from './accessStore'
import { useSubscriptionStore } from './subscriptionStore'

type AuthErrorCode = 'email_not_confirmed' | 'invalid_credentials' | 'not_configured' | 'unknown' | null

interface AuthResult {
  error: string | null
  code?: AuthErrorCode
}

interface AuthStore {
  user: User | null
  session: Session | null
  isLoading: boolean
  isSyncing: boolean
  isConfigured: boolean

  // Actions
  initialize: () => Promise<void>
  signUp: (email: string, password: string) => Promise<AuthResult>
  signIn: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<AuthResult>
  resendConfirmation: (email: string) => Promise<AuthResult>
  syncData: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isSyncing: false,
  isConfigured: isSupabaseConfigured,

  initialize: async () => {
    if (!supabase) {
      set({ isLoading: false })
      return
    }

    try {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession()
      set({
        session,
        user: session?.user ?? null,
        isLoading: false
      })

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null
        })
      })
    } catch (error) {
      if (import.meta.env.DEV) console.error('Auth initialization error:', error)
      if (error instanceof Error) {
        captureError(error, { context: 'auth.initialize' })
      }
      set({ isLoading: false })
    }
  },

  signUp: async (email: string, password: string) => {
    if (!supabase) {
      return { error: 'Backend not configured' }
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })

      if (error) {
        return { error: 'Could not create account. Please try again.' }
      }

      if (data.user) {
        set({ user: data.user, session: data.session })
        sentrySetUser(data.user.id, data.user.email)
        // Sync local data to cloud after signup
        get().syncData()
      }

      return { error: null }
    } catch (error) {
      if (error instanceof Error) {
        captureError(error, { context: 'auth.signUp' })
      }
      return { error: 'An unexpected error occurred' }
    }
  },

  signIn: async (email: string, password: string) => {
    if (!supabase) {
      return { error: 'Backend not configured', code: 'not_configured' }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        const errorCode = error.message.toLowerCase().includes('email not confirmed')
          ? 'email_not_confirmed'
          : error.message.toLowerCase().includes('invalid login credentials')
          ? 'invalid_credentials'
          : 'unknown'

        // Map to user-friendly messages instead of raw Supabase errors
        const userMessage = errorCode === 'email_not_confirmed'
          ? 'Please confirm your email before signing in.'
          : errorCode === 'invalid_credentials'
          ? 'Invalid email or password.'
          : 'Something went wrong. Please try again.'

        return { error: userMessage, code: errorCode }
      }

      set({ user: data.user, session: data.session })
      sentrySetUser(data.user.id, data.user.email)

      // Sync data after successful login
      get().syncData()

      return { error: null }
    } catch (error) {
      if (error instanceof Error) {
        captureError(error, { context: 'auth.signIn' })
      }
      return { error: 'An unexpected error occurred', code: 'unknown' }
    }
  },

  signOut: async () => {
    if (!supabase) return

    // Remove push device token before session is cleared (needs auth context)
    try {
      const userId = get().user?.id
      if (userId) await removeDeviceToken(userId)
    } catch {
      // Non-blocking -- sign-out should never fail due to token removal
    }

    // Log out from RevenueCat before clearing session
    await logoutFromRevenueCat()

    await supabase.auth.signOut()
    set({ user: null, session: null })
    sentryClearUser()

    // Clear all persisted stores to prevent data leakage on shared devices
    useUserStore.getState().resetProgress()
    useDPStore.getState().resetDP()
    useMacroStore.getState().resetMacros()
    useWorkoutStore.getState().resetWorkouts()
    useAvatarStore.getState().resetAvatar()
    useAccessStore.getState().revokeAccess()
    useSubscriptionStore.getState().reset()
  },

  resendConfirmation: async (email: string) => {
    if (!supabase) {
      return { error: 'Backend not configured' }
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email
      })

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      if (error instanceof Error) {
        captureError(error, { context: 'auth.resendConfirmation' })
      }
      return { error: 'An unexpected error occurred' }
    }
  },

  resetPassword: async (email: string) => {
    if (!supabase) {
      return { error: 'Backend not configured' }
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://app.welltrained.fitness/reset-password'
      })

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      if (error instanceof Error) {
        captureError(error, { context: 'auth.resetPassword' })
      }
      return { error: 'An unexpected error occurred' }
    }
  },

  syncData: async () => {
    if (!supabase) return

    const { user } = get()
    if (!user) return

    set({ isSyncing: true })
    try {
      // First load any existing cloud data
      await loadAllFromCloud()
      // Pull coach-set data (macros, future: workouts)
      await pullCoachData()
      // Then push client-owned changes to cloud
      await pushClientData()
    } catch (error) {
      if (import.meta.env.DEV) console.error('Sync error:', error)
      // Show user-friendly error message
      if (error instanceof Error) {
        captureError(error, { context: 'auth.syncData' })
        if (error.message.includes('network') || error.message.includes('fetch')) {
          toast.warning('Unable to sync - check your internet connection')
        } else {
          toast.error('Failed to sync data. Changes saved locally.')
        }
      } else {
        toast.error('Failed to sync data. Changes saved locally.')
      }
    } finally {
      set({ isSyncing: false })
    }
  }
}))
