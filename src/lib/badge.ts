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
 */
export function computePendingActions(): number {
  let count = 0

  // Check if daily check-in is pending
  const todayLog = useXPStore.getState().getTodayLog()
  if (!todayLog || !todayLog.checkIn) {
    count++
  }

  return count
}
