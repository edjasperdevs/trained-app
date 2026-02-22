import { Capacitor } from '@capacitor/core'

/** True when running inside Capacitor native shell (iOS/Android) */
export const isNative = (): boolean => Capacitor.isNativePlatform()

/** Returns 'ios', 'android', or 'web' */
export const getPlatform = (): 'ios' | 'android' | 'web' =>
  Capacitor.getPlatform() as 'ios' | 'android' | 'web'

/** True when running on iOS (native only) */
export const isIOS = (): boolean => getPlatform() === 'ios'
