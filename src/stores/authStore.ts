import { create } from 'zustand'
import { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { syncAllToCloud, loadAllFromCloud } from '@/lib/sync'
import { toast } from './toastStore'

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
      console.error('Auth initialization error:', error)
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
        return { error: error.message }
      }

      if (data.user) {
        set({ user: data.user, session: data.session })
        // Sync local data to cloud after signup
        get().syncData()
      }

      return { error: null }
    } catch (error) {
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
        // Supabase error codes for better UX
        // 'email_not_confirmed' - user hasn't confirmed email
        // 'invalid_credentials' - wrong email/password
        const errorCode = error.message.toLowerCase().includes('email not confirmed')
          ? 'email_not_confirmed'
          : error.message.toLowerCase().includes('invalid login credentials')
          ? 'invalid_credentials'
          : 'unknown'

        return { error: error.message, code: errorCode }
      }

      set({ user: data.user, session: data.session })

      // Sync data after successful login
      get().syncData()

      return { error: null }
    } catch (error) {
      return { error: 'An unexpected error occurred', code: 'unknown' }
    }
  },

  signOut: async () => {
    if (!supabase) return

    await supabase.auth.signOut()
    set({ user: null, session: null })
  },

  resetPassword: async (email: string) => {
    if (!supabase) {
      return { error: 'Backend not configured' }
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
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
      // Then sync local changes to cloud
      await syncAllToCloud()
    } catch (error) {
      console.error('Sync error:', error)
      // Show user-friendly error message
      if (error instanceof Error) {
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
