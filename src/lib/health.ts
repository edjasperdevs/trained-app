import { Health } from '@capgo/capacitor-health'
import { isIOS } from '@/lib/platform'
import { supabase } from '@/lib/supabase'

/**
 * Check if HealthKit is available on the device.
 * Returns false on non-iOS platforms.
 */
export async function isHealthAvailable(): Promise<boolean> {
  if (!isIOS()) return false

  try {
    const { available } = await Health.isAvailable()
    return available
  } catch {
    return false
  }
}

/**
 * Record health data consent in the database for audit compliance.
 */
async function recordHealthConsent(authorized: boolean): Promise<void> {
  try {
    if (!supabase) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const consentData = {
      user_id: user.id,
      steps_authorized: authorized,
      consent_granted_at: authorized ? new Date().toISOString() : null,
      consent_revoked_at: authorized ? null : new Date().toISOString(),
      device_model: 'iOS',
      os_version: 'iOS',
      updated_at: new Date().toISOString(),
    }

    // Use type assertion since health_data_consent table may not be in generated types yet
    await (supabase as any)
      .from('health_data_consent')
      .upsert(consentData, { onConflict: 'user_id' })
  } catch (error) {
    // Log but don't fail - consent recording is for audit, not blocking
    console.error('Failed to record health consent:', error)
  }
}

/**
 * Request read-only permission for steps data from HealthKit.
 * Returns true if permission was granted, false otherwise.
 * Returns false on non-iOS platforms.
 *
 * Note: Sleep data is not supported by @capgo/capacitor-health plugin.
 * Sleep tracking will use manual entry only.
 */
export async function requestHealthPermission(): Promise<boolean> {
  if (!isIOS()) return false

  try {
    const result = await Health.requestAuthorization({
      read: ['steps'],
      write: [],
    })
    // readAuthorized contains the data types that were authorized
    const authorized = result.readAuthorized.includes('steps')

    // Record consent for audit compliance
    await recordHealthConsent(authorized)

    return authorized
  } catch {
    // Record failed/denied consent
    await recordHealthConsent(false)
    return false
  }
}

/**
 * Revoke health data access and record the revocation.
 * Note: This doesn't actually revoke iOS permissions (user must do that in Settings),
 * but it records the user's intent and we stop reading data.
 */
export async function revokeHealthPermission(): Promise<void> {
  await recordHealthConsent(false)
}

/**
 * Read today's total step count from HealthKit.
 * Returns 0 on non-iOS platforms or if data unavailable.
 */
export async function readTodaySteps(): Promise<number> {
  if (!isIOS()) return 0

  try {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Use readSamples and sum manually since queryAggregated is not available
    const result = await Health.readSamples({
      dataType: 'steps',
      startDate: startOfDay.toISOString(),
      endDate: now.toISOString(),
      limit: 1000, // High limit to capture all samples for the day
    })

    // Sum all step samples
    let totalSteps = 0
    if (result.samples && result.samples.length > 0) {
      for (const sample of result.samples) {
        totalSteps += sample.value || 0
      }
    }
    return Math.round(totalSteps)
  } catch {
    return 0
  }
}

/**
 * Read today's total sleep duration from HealthKit.
 *
 * Note: Sleep data is NOT supported by @capgo/capacitor-health v7.
 * The plugin only supports: steps, distance, calories, heartRate, weight.
 * This function always returns 0 - sleep tracking uses manual entry only.
 *
 * Future: If plugin adds sleep support, implement via readSamples with
 * filtering for asleep states and duration calculation.
 */
export async function readTodaySleep(): Promise<number> {
  // Sleep not supported by @capgo/capacitor-health - always manual entry
  return 0
}
