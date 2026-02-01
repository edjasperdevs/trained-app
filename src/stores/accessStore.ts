/**
 * Access Code Store
 *
 * Manages access gating for ebook purchasers.
 * Validates codes against Supabase and stores access locally.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'

// Type for access code record from Supabase
interface AccessCodeRecord {
  id: string
  code: string
  email?: string | null
  used_at?: string | null
  used_count?: number
  is_active?: boolean
}

interface AccessState {
  // Whether user has validated access
  hasAccess: boolean
  // The code that was used (for reference)
  accessCode: string | null
  // When access was granted
  accessGrantedAt: string | null
  // Email associated with the code (optional)
  email: string | null

  // Actions
  validateCode: (code: string) => Promise<{ success: boolean; error?: string }>
  revokeAccess: () => void
  checkAccess: () => boolean
}

export const useAccessStore = create<AccessState>()(
  persist(
    (set, get) => ({
      hasAccess: false,
      accessCode: null,
      accessGrantedAt: null,
      email: null,

      validateCode: async (code: string) => {
        const trimmedCode = code.trim().toUpperCase()

        // Check if Supabase is configured
        if (!isSupabaseConfigured) {
          // In local-only mode, accept any code that matches pattern
          // This allows testing without Supabase
          if (trimmedCode.length >= 6) {
            set({
              hasAccess: true,
              accessCode: trimmedCode,
              accessGrantedAt: new Date().toISOString(),
              email: null
            })
            return { success: true }
          }
          return { success: false, error: 'Invalid code format' }
        }

        try {
          const supabase = getSupabaseClient()

          // Check if code exists - use rpc or raw query to avoid type issues
          const { data, error } = await supabase
            .from('access_codes' as 'profiles') // Type cast to bypass strict typing
            .select('*')
            .eq('code', trimmedCode)
            .single() as { data: AccessCodeRecord | null; error: Error | null }

          if (error || !data) {
            return { success: false, error: 'Invalid access code' }
          }

          // Check if code is active
          if (data.is_active === false) {
            return { success: false, error: 'This code has been deactivated' }
          }

          // Check if already used
          if (data.used_at) {
            // Allow re-entry with same code (user might reinstall)
            // But only if it was used recently (within 1 year)
            const usedAt = new Date(data.used_at)
            const oneYearAgo = new Date()
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

            if (usedAt < oneYearAgo) {
              return { success: false, error: 'This code has expired' }
            }
          }

          // Mark code as used (if not already)
          if (!data.used_at) {
            await supabase
              .from('access_codes' as 'profiles')
              .update({
                used_at: new Date().toISOString(),
                used_count: (data.used_count || 0) + 1
              } as Record<string, unknown>)
              .eq('code', trimmedCode)
          } else {
            // Increment usage count for returning users
            await supabase
              .from('access_codes' as 'profiles')
              .update({
                used_count: (data.used_count || 0) + 1
              } as Record<string, unknown>)
              .eq('code', trimmedCode)
          }

          // Grant access
          set({
            hasAccess: true,
            accessCode: trimmedCode,
            accessGrantedAt: new Date().toISOString(),
            email: data.email || null
          })

          return { success: true }
        } catch (err) {
          console.error('Access code validation error:', err)
          return { success: false, error: 'Unable to validate code. Please try again.' }
        }
      },

      revokeAccess: () => {
        set({
          hasAccess: false,
          accessCode: null,
          accessGrantedAt: null,
          email: null
        })
      },

      checkAccess: () => {
        return get().hasAccess
      }
    }),
    {
      name: 'gamify-gains-access',
      version: 1
    }
  )
)
