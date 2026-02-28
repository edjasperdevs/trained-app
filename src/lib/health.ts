import { Health } from '@capgo/capacitor-health'
import { isIOS } from '@/lib/platform'

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
    return result.readAuthorized.includes('steps')
  } catch {
    return false
  }
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
