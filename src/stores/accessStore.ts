/**
 * Access Code Store
 *
 * Manages access gating for ebook purchasers.
 * Validates license keys against Lemon Squeezy API.
 *
 * Setup:
 * 1. Create a Lemon Squeezy account: https://lemonsqueezy.com
 * 2. Create a product with "License keys" enabled
 * 3. Customers automatically receive a license key on purchase
 * 4. They enter that key here to unlock the app
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Lemon Squeezy license validation response
interface LemonSqueezyLicenseResponse {
  valid: boolean
  error?: string
  license_key?: {
    id: number
    status: string
    key: string
    activation_limit: number
    activation_usage: number
    created_at: string
    expires_at: string | null
  }
  instance?: {
    id: string
    name: string
    created_at: string
  }
  meta?: {
    store_id: number
    order_id: number
    order_item_id: number
    product_id: number
    product_name: string
    variant_id: number
    variant_name: string
    customer_id: number
    customer_name: string
    customer_email: string
  }
}

interface AccessState {
  // Whether user has validated access
  hasAccess: boolean
  // The license key that was used
  licenseKey: string | null
  // When access was granted
  accessGrantedAt: string | null
  // Customer email from Lemon Squeezy
  email: string | null
  // Instance ID for this device
  instanceId: string | null

  // Actions
  validateCode: (code: string) => Promise<{ success: boolean; error?: string }>
  revokeAccess: () => void
  checkAccess: () => boolean
}

// Generate a unique instance name for this device
function getInstanceName(): string {
  const userAgent = navigator.userAgent
  const platform = navigator.platform || 'Unknown'
  const timestamp = Date.now()
  return `${platform}-${timestamp}`
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
        const trimmedCode = code.trim()

        // Basic format validation (Lemon Squeezy keys are usually UUID-like)
        if (trimmedCode.length < 8) {
          return { success: false, error: 'Invalid license key format' }
        }

        // Check if Lemon Squeezy is configured
        const apiUrl = import.meta.env.VITE_LEMONSQUEEZY_API_URL

        if (!apiUrl) {
          // Fallback: In development or if not configured, accept any 8+ char code
          console.log('[Access] Lemon Squeezy not configured, using fallback validation')
          if (trimmedCode.length >= 8) {
            set({
              hasAccess: true,
              licenseKey: trimmedCode,
              accessGrantedAt: new Date().toISOString(),
              email: null,
              instanceId: 'dev-instance'
            })
            return { success: true }
          }
          return { success: false, error: 'Invalid license key' }
        }

        try {
          // Validate license key with Lemon Squeezy
          const response = await fetch(`${apiUrl}/v1/licenses/validate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              license_key: trimmedCode,
              instance_name: getInstanceName()
            })
          })

          const data: LemonSqueezyLicenseResponse = await response.json()

          if (!data.valid) {
            // Handle specific error cases
            if (data.error?.includes('activation limit')) {
              return {
                success: false,
                error: 'This license has reached its activation limit. Please contact support.'
              }
            }
            if (data.error?.includes('expired')) {
              return { success: false, error: 'This license has expired.' }
            }
            if (data.error?.includes('disabled') || data.error?.includes('inactive')) {
              return { success: false, error: 'This license has been deactivated.' }
            }
            return { success: false, error: data.error || 'Invalid license key' }
          }

          // License is valid!
          set({
            hasAccess: true,
            licenseKey: trimmedCode,
            accessGrantedAt: new Date().toISOString(),
            email: data.meta?.customer_email || null,
            instanceId: data.instance?.id || null
          })

          return { success: true }
        } catch (err) {
          console.error('License validation error:', err)

          // Network error - allow offline access if previously validated
          const currentState = get()
          if (currentState.licenseKey === trimmedCode && currentState.hasAccess) {
            return { success: true }
          }

          return {
            success: false,
            error: 'Unable to validate license. Please check your internet connection.'
          }
        }
      },

      revokeAccess: () => {
        // Optionally deactivate the instance on Lemon Squeezy
        const { licenseKey, instanceId } = get()
        const apiUrl = import.meta.env.VITE_LEMONSQUEEZY_API_URL

        if (apiUrl && licenseKey && instanceId) {
          // Fire and forget - don't wait for response
          fetch(`${apiUrl}/v1/licenses/deactivate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              license_key: licenseKey,
              instance_id: instanceId
            })
          }).catch(() => {
            // Ignore errors on deactivation
          })
        }

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
      version: 2 // Bump version to handle migration from old format
    }
  )
)
