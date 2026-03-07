// Helper for RevenueCat API calls
const REVENUECAT_API_URL = 'https://api.revenuecat.com/v1'

export interface GrantResult {
  success: boolean
  error?: string
}

/**
 * Grant a promotional entitlement to a user
 * Uses RevenueCat REST API v1
 * @param userId - RevenueCat subscriber ID (same as Supabase user ID)
 * @param entitlementId - The entitlement to grant (e.g., 'premium')
 * @param duration - One of: 'daily', 'three_day', 'weekly', 'monthly'
 */
export async function grantPromotionalEntitlement(
  userId: string,
  entitlementId: string,
  duration: 'daily' | 'three_day' | 'weekly' | 'monthly'
): Promise<GrantResult> {
  const secretKey = Deno.env.get('REVENUECAT_SECRET_KEY')
  if (!secretKey) {
    console.error('[RevenueCat] REVENUECAT_SECRET_KEY not configured')
    return { success: false, error: 'RevenueCat not configured' }
  }

  try {
    const response = await fetch(
      `${REVENUECAT_API_URL}/subscribers/${userId}/entitlements/${entitlementId}/promotional`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ duration }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[RevenueCat] Grant failed:', response.status, errorText)
      return { success: false, error: `RevenueCat API error: ${response.status}` }
    }

    return { success: true }
  } catch (error) {
    console.error('[RevenueCat] Grant error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
