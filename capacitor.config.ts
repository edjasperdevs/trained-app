/// <reference types="@capacitor/push-notifications" />
/// <reference types="@capacitor/status-bar" />
/// <reference types="@capacitor/splash-screen" />
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'fitness.welltrained.app',
  appName: 'WellTrained',
  webDir: 'dist',
  ios: {
    backgroundColor: '#0a0a0a',
    allowsBackForwardNavigationGestures: false,
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      overlaysWebView: true,
    },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 500,
      backgroundColor: '#0a0a0aff',
      launchFadeOutDuration: 200,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  server: process.env.CAPACITOR_LIVE_RELOAD ? {
    url: process.env.CAPACITOR_DEV_URL || 'http://localhost:5173',
    cleartext: true,
  } : undefined,
}

export default config
