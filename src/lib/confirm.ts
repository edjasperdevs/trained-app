import { Dialog } from '@capacitor/dialog'
import { isNative } from './platform'

/**
 * Cross-platform confirmation dialog.
 * Native: uses iOS UIAlertController via @capacitor/dialog
 * Web: uses window.confirm()
 *
 * Always async -- all call sites must use `await`.
 */
export async function confirmAction(
  message: string,
  title = 'Confirm'
): Promise<boolean> {
  if (isNative()) {
    const { value } = await Dialog.confirm({ title, message })
    return value
  }
  return window.confirm(message)
}
