import { PushNotifications } from '@capacitor/push-notifications'
import { isNative } from '@/lib/platform'
import { supabase } from '@/lib/supabase'
import { captureError } from '@/lib/sentry'

/**
 * Request push notification permission and register with APNs.
 * Returns true if permission was granted and registration initiated.
 */
export async function requestPushPermission(): Promise<boolean> {
  if (!isNative()) return false

  const { receive } = await PushNotifications.checkPermissions()

  if (receive === 'granted') {
    await PushNotifications.register()
    return true
  }

  if (receive === 'denied') {
    return false
  }

  // receive === 'prompt'
  const result = await PushNotifications.requestPermissions()
  if (result.receive === 'granted') {
    await PushNotifications.register()
    return true
  }

  return false
}

/**
 * Initialize push notification listeners.
 * Call once after user is authenticated and push permission is granted.
 */
export function initPushListeners(userId: string): void {
  if (!isNative()) return

  PushNotifications.addListener('registration', async (token) => {
    await storeDeviceToken(userId, token.value)
  })

  PushNotifications.addListener('registrationError', (error) => {
    captureError(new Error(`Push registration failed: ${error.error}`), {
      context: 'push.registrationError',
    })
  })

  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    const route = action.notification.data?.route as string | undefined
    if (route) {
      window.location.href = route
    }
  })
}

/**
 * Remove device token from Supabase on sign-out.
 * Non-blocking -- sign-out should never fail due to token removal.
 */
export async function removeDeviceToken(userId: string): Promise<void> {
  if (!userId || !supabase) return

  try {
    await supabase
      .from('device_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('platform', 'ios')
  } catch (error) {
    if (error instanceof Error) {
      captureError(error, { context: 'push.removeDeviceToken' })
    }
  }
}

/**
 * Upsert device token to Supabase device_tokens table.
 */
async function storeDeviceToken(userId: string, token: string): Promise<void> {
  if (!supabase) return

  try {
    const { error } = await supabase.from('device_tokens').upsert(
      {
        user_id: userId,
        token,
        platform: 'ios',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,platform' }
    )

    if (error) {
      captureError(new Error(`Failed to store device token: ${error.message}`), {
        context: 'push.storeDeviceToken',
      })
    }
  } catch (error) {
    if (error instanceof Error) {
      captureError(error, { context: 'push.storeDeviceToken' })
    }
  }
}
