import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { isNative } from './platform'

const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator

export const haptics = {
  /** Light tap - set completion, toggles */
  light: () => {
    if (isNative()) {
      Haptics.impact({ style: ImpactStyle.Light })
    } else if (canVibrate) {
      navigator.vibrate(10)
    }
  },

  /** Medium tap - action confirmed */
  medium: () => {
    if (isNative()) {
      Haptics.impact({ style: ImpactStyle.Medium })
    } else if (canVibrate) {
      navigator.vibrate(25)
    }
  },

  /** Success pattern - workout complete, check-in, achievement unlock */
  success: () => {
    if (isNative()) {
      Haptics.notification({ type: NotificationType.Success })
    } else if (canVibrate) {
      navigator.vibrate([15, 50, 30])
    }
  },

  /** Heavy tap - important milestone like XP claim */
  heavy: () => {
    if (isNative()) {
      Haptics.impact({ style: ImpactStyle.Heavy })
    } else if (canVibrate) {
      navigator.vibrate(50)
    }
  },

  /** Error buzz - something went wrong */
  error: () => {
    if (isNative()) {
      Haptics.notification({ type: NotificationType.Error })
    } else if (canVibrate) {
      navigator.vibrate([50, 30, 50])
    }
  },
}
