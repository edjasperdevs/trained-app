/// <reference types="@capacitor/local-notifications" />
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
      launchAutoHide: false,
      backgroundColor: '#0a0a0aff',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_notification',
      iconColor: '#D4443B',
    },
    Badge: {
      persist: true,
      autoClear: false,
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      iosClientId: '809336881982-h226g1k2qtp7nh7csq1nfk7d9crrmnvr.apps.googleusercontent.com',
      serverClientId: '809336881982-fq9scr1jlk5jqg8l3junqlj09c1p4l46.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
  server: process.env.CAPACITOR_LIVE_RELOAD ? {
    url: process.env.CAPACITOR_DEV_URL || 'http://localhost:5173',
    cleartext: true,
  } : undefined,
}

export default config
