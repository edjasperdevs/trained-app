/**
 * Subscription Store
 *
 * Manages subscription state via RevenueCat SDK.
 * isPremium is persisted locally for offline access checks.
 * All SDK calls are guarded for native-only execution.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Purchases, PURCHASES_ERROR_CODE } from '@revenuecat/purchases-capacitor'
import type { CustomerInfo, PurchasesOfferings, PurchasesPackage } from '@revenuecat/purchases-capacitor'
import { isNative } from '@/lib/platform'

/** Must match the entitlement ID configured in RevenueCat dashboard */
const ENTITLEMENT_ID = 'premium'

interface PurchaseResult {
  success: boolean
  error?: string
}

interface SubscriptionState {
  // Persisted state
  isPremium: boolean

  // Non-persisted runtime state
  isLoading: boolean
  customerInfo: CustomerInfo | null
  offerings: PurchasesOfferings | null

  // Actions
  initialize: () => Promise<void>
  checkEntitlements: () => Promise<void>
  purchase: (pkg: PurchasesPackage) => Promise<PurchaseResult>
  restorePurchases: () => Promise<PurchaseResult>
  reset: () => void
}

const INITIAL_STATE = {
  isPremium: false,
  isLoading: true,
  customerInfo: null,
  offerings: null,
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      /**
       * Initialize subscription state by fetching offerings.
       * Called after RevenueCat SDK is configured.
       */
      initialize: async () => {
        if (!isNative()) {
          set({ isLoading: false })
          return
        }

        try {
          const offerings = await Purchases.getOfferings()
          set({ offerings, isLoading: false })

          if (import.meta.env.DEV) {
            console.log('[Subscription] Offerings loaded:', offerings?.current?.identifier)
          }
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('[Subscription] Failed to load offerings:', error)
          }
          set({ isLoading: false })
        }
      },

      /**
       * Check current entitlements and update isPremium status.
       * Called after initialization and after any purchase/restore.
       */
      checkEntitlements: async () => {
        if (!isNative()) {
          set({ isLoading: false })
          return
        }

        try {
          set({ isLoading: true })
          const { customerInfo } = await Purchases.getCustomerInfo()

          const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined

          set({
            customerInfo,
            isPremium,
            isLoading: false,
          })

          if (import.meta.env.DEV) {
            console.log('[Subscription] Entitlements checked, isPremium:', isPremium)
          }
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('[Subscription] Failed to check entitlements:', error)
          }
          set({ isLoading: false })
        }
      },

      /**
       * Purchase a subscription package.
       * Returns success/error to allow UI to show appropriate feedback.
       */
      purchase: async (pkg: PurchasesPackage) => {
        if (!isNative()) {
          return { success: false, error: 'Purchases not available on web' }
        }

        try {
          const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg })

          const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined

          set({
            customerInfo,
            isPremium,
          })

          if (import.meta.env.DEV) {
            console.log('[Subscription] Purchase completed, isPremium:', isPremium)
          }

          return { success: true }
        } catch (error: unknown) {
          // Handle user cancellation silently
          if (
            error &&
            typeof error === 'object' &&
            'code' in error &&
            error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
          ) {
            if (import.meta.env.DEV) {
              console.log('[Subscription] Purchase cancelled by user')
            }
            return { success: false }
          }

          if (import.meta.env.DEV) {
            console.error('[Subscription] Purchase error:', error)
          }

          const errorMessage = error instanceof Error ? error.message : 'Purchase failed'
          return { success: false, error: errorMessage }
        }
      },

      /**
       * Restore previous purchases.
       * Updates isPremium based on restored entitlements.
       */
      restorePurchases: async () => {
        if (!isNative()) {
          return { success: false, error: 'Restore not available on web' }
        }

        try {
          const { customerInfo } = await Purchases.restorePurchases()

          const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined

          set({
            customerInfo,
            isPremium,
          })

          if (import.meta.env.DEV) {
            console.log('[Subscription] Purchases restored, isPremium:', isPremium)
          }

          return { success: true }
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('[Subscription] Restore error:', error)
          }

          const errorMessage = error instanceof Error ? error.message : 'Restore failed'
          return { success: false, error: errorMessage }
        }
      },

      /**
       * Reset subscription state on sign out.
       */
      reset: () => {
        set(INITIAL_STATE)
      },
    }),
    {
      name: 'trained-subscription',
      // Only persist isPremium - offerings/customerInfo are runtime state
      partialize: (state) => ({ isPremium: state.isPremium }),
    }
  )
)
