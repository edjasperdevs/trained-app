/**
 * Access Code Store
 *
 * Manages access gating for ebook purchasers.
 * Validates codes via the validate_access_code RPC (SECURITY DEFINER),
 * which checks clients.access_code first, then access_codes.code as fallback.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

interface AccessState {
  // Whether user has validated access
  hasAccess: boolean
  // The access code that was used
  licenseKey: string | null
  // When access was granted
  accessGrantedAt: string | null
  // Customer email from access_codes table
  email: string | null
  // Instance ID for this device
  instanceId: string | null

  // Actions
  validateCode: (code: string) => Promise<{ success: boolean; error?: string }>
  revokeAccess: () => void
  checkAccess: () => boolean
}

export const useAccessStore = create<AccessState>()(
  persist(
    (set, get) => ({
      hasAccess: false,
      licenseKey: null,
      accessGrantedAt: null,
      email: null,
      instanceId: null,

      validateCode: async (code: string) => {
        // Access codes are 8-char uppercase alphanumeric
        const trimmedCode = code.trim().toUpperCase()

        if (trimmedCode.length < 8) {
          return { success: false, error: 'Invalid access code format' }
        }

        // Check for master code (set via environment variable)
        const masterCode = import.meta.env.VITE_MASTER_ACCESS_CODE
        if (masterCode && trimmedCode === masterCode.toUpperCase()) {
          if (import.meta.env.DEV) console.log('[Access] Master code used')
          set({
            hasAccess: true,
            licenseKey: 'MASTER',
            accessGrantedAt: new Date().toISOString(),
            email: null,
            instanceId: 'master-access'
          })
          return { success: true }
        }

        // Validate against Supabase access_codes table
        if (!supabase) {
          if (import.meta.env.DEV) {
            // DEV only: accept any 8+ char code when Supabase not configured
            console.log('[Access] Supabase not configured, using dev fallback')
            set({
              hasAccess: true,
              licenseKey: trimmedCode,
              accessGrantedAt: new Date().toISOString(),
              email: null,
              instanceId: 'dev-instance'
            })
            return { success: true }
          }
          return { success: false, error: 'Validation unavailable. Please try again later.' }
        }

        try {
          const { data, error } = await (supabase as any)
            .rpc('validate_access_code', { input_code: trimmedCode })

          if (error || !data || !(data as any).valid) {
            return { success: false, error: 'Invalid access code' }
          }

          // Valid code — grant access
          set({
            hasAccess: true,
            licenseKey: trimmedCode,
            accessGrantedAt: new Date().toISOString(),
            email: (data as any).email || null,
            instanceId: null
          })

          return { success: true }
        } catch (err) {
          console.error('Access code validation error:', err)

          // Network error — allow offline access if same code was previously validated
          const currentState = get()
          if (currentState.hasAccess &&
              currentState.licenseKey === trimmedCode &&
              currentState.accessGrantedAt) {
            const accessDate = new Date(currentState.accessGrantedAt)
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

            if (accessDate > thirtyDaysAgo) {
              return { success: true }
            }
            return {
              success: false,
              error: 'Access code needs to be revalidated. Please check your internet connection.'
            }
          }

          return {
            success: false,
            error: 'Unable to validate code. Please check your internet connection.'
          }
        }
      },

      revokeAccess: () => {
        set({
          hasAccess: false,
          licenseKey: null,
          accessGrantedAt: null,
          email: null,
          instanceId: null
        })
      },

      checkAccess: () => {
        return get().hasAccess
      }
    }),
    {
      name: 'gamify-gains-access',
      version: 2
    }
  )
)
