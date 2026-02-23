import { Badge } from '@capawesome/capacitor-badge'
import { isNative } from '@/lib/platform'
import { useXPStore } from '@/stores/xpStore'

/**
 * Update the app icon badge count based on pending actions.
 * Non-blocking, fire-and-forget.
 */
export async function updateBadge(): Promise<void> {
  if (!isNative()) return

  try {
    const count = computePendingActions()
    if (count <= 0) {
      await Badge.clear()
    } else {
      await Badge.set({ count })
    }
  } catch {
    // Non-blocking -- badge update should never crash the app
  }
}

/**
 * Compute the number of pending actions for badge display.
 * Sources:
 * 1. Daily check-in not completed
 * 2. Unread coach response on latest check-in
 */
export function computePendingActions(): number {
  let count = 0

  // Check if daily check-in is pending
  const todayLog = useXPStore.getState().getTodayLog()
  if (!todayLog || !todayLog.checkIn) {
    count++
  }

  // Check for unread coach response
  try {
    const latestRaw = localStorage.getItem('trained-latest-checkin')
    if (latestRaw) {
      const latest = JSON.parse(latestRaw)
      const lastSeen = localStorage.getItem('trained-last-seen-coach-response')
      if (
        latest.status === 'reviewed' &&
        latest.reviewed_at &&
        latest.reviewed_at !== lastSeen
      ) {
        count++
      }
    }
  } catch {
    // Ignore parse errors
  }

  return count
}

/**
 * Mark the current coach response as seen so it no longer contributes to badge count.
 */
export function markCoachResponseSeen(): void {
  try {
    const latestRaw = localStorage.getItem('trained-latest-checkin')
    if (latestRaw) {
      const latest = JSON.parse(latestRaw)
      if (latest.reviewed_at) {
        localStorage.setItem('trained-last-seen-coach-response', latest.reviewed_at)
      }
    }
  } catch {
    // Ignore parse errors
  }
}
