import { useEffect, useRef, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { withSentryReactRouterV6Routing } from '@/lib/sentry'
import { useUserStore, useAvatarStore, useAuthStore, useSyncStore } from '@/stores'
import { flushPendingSync, pullCoachData } from '@/lib/sync'
import { App as CapApp } from '@capacitor/app'
import { isNative } from '@/lib/platform'
import { initDeepLinkHandler } from '@/lib/deep-link'
import { LocalNotifications } from '@capacitor/local-notifications'
import { initPushListeners, requestPushPermission } from '@/lib/push'
import { scheduleAllNotifications } from '@/lib/notifications'
import { updateBadge } from '@/lib/badge'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useRemindersStore } from '@/stores/remindersStore'
import { analytics } from '@/lib/analytics'
import { Navigation, ToastContainer, ErrorBoundary, UpdatePrompt, NotFound, HomeSkeleton, WorkoutsSkeleton, MacrosSkeleton, AchievementsSkeleton, AvatarSkeleton, SettingsSkeleton, OnboardingSkeleton, SyncStatusIndicator } from '@/components'
import { Auth } from '@/screens'

const SentryRoutes = withSentryReactRouterV6Routing(Routes)

// Lazy-loaded route components
const Onboarding = lazy(() => import('@/screens/Onboarding').then(m => ({ default: m.Onboarding })))
const Home = lazy(() => import('@/screens/Home').then(m => ({ default: m.Home })))
const Workouts = lazy(() => import('@/screens/Workouts').then(m => ({ default: m.Workouts })))
const Macros = lazy(() => import('@/screens/Macros').then(m => ({ default: m.Macros })))
const AvatarScreen = lazy(() => import('@/screens/AvatarScreen').then(m => ({ default: m.AvatarScreen })))
const Settings = lazy(() => import('@/screens/Settings').then(m => ({ default: m.Settings })))
const Achievements = lazy(() => import('@/screens/Achievements').then(m => ({ default: m.Achievements })))
const WeeklyCheckIn = lazy(() => import('@/screens/WeeklyCheckIn').then(m => ({ default: m.WeeklyCheckIn })))
const ResetPassword = lazy(() => import('@/screens/ResetPassword').then(m => ({ default: m.ResetPassword })))
const Privacy = lazy(() => import('@/screens/Privacy').then(m => ({ default: m.Privacy })))

function AppContent() {
  const profile = useUserStore((state) => state.profile)
  const checkNeglected = useAvatarStore((state) => state.checkNeglected)
  const initializeAuth = useAuthStore((state) => state.initialize)
  const authLoading = useAuthStore((state) => state.isLoading)
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const pushPermissionRequested = useRef(false)

  // Initialize auth on app load
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  // Initialize deep link handler (native only -- no-op on web)
  useEffect(() => {
    initDeepLinkHandler(navigate)
  }, [navigate])

  // Initialize push notification listeners (native only)
  useEffect(() => {
    if (!user) return
    initPushListeners(user.id)
  }, [user])

  // Local notification tap navigation (native only)
  useEffect(() => {
    if (!isNative()) return

    const listener = LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (action) => {
        const route = action.notification.extra?.route as string | undefined
        if (route) {
          navigate(route)
        }
      }
    )

    return () => { listener.then(l => l.remove()) }
  }, [navigate])

  // Request push permission after first sync completes (contextual, not on launch)
  useEffect(() => {
    if (!user || pushPermissionRequested.current) return
    if (!isNative()) return

    // Wait for sync to complete, then request permission
    // This ensures user has context about coach interaction before seeing the prompt
    const unsubscribe = useAuthStore.subscribe((state) => {
      if (!state.isSyncing && state.user && !pushPermissionRequested.current) {
        pushPermissionRequested.current = true
        // Small delay to let the UI settle after sync
        setTimeout(() => {
          requestPushPermission()
        }, 2000)
        unsubscribe()
      }
    })

    // Also check immediately if sync already completed
    const current = useAuthStore.getState()
    if (!current.isSyncing && current.user) {
      pushPermissionRequested.current = true
      setTimeout(() => {
        requestPushPermission()
      }, 2000)
      unsubscribe()
    }

    return () => unsubscribe()
  }, [user])

  // Schedule local notifications on app launch and update badge (native only)
  useEffect(() => {
    if (!user || !isNative()) return

    const prefs = useRemindersStore.getState().notificationPreferences
    const workoutDays = useWorkoutStore.getState().currentPlan?.selectedDays || []
    scheduleAllNotifications(prefs, workoutDays)
    updateBadge()
  }, [user])

  // Online/offline detection and background sync
  useEffect(() => {
    let lastHidden = 0

    const handleOnline = () => {
      useSyncStore.getState().setOnline(true)
      useSyncStore.getState().setStatus('synced')
      pullCoachData()
      flushPendingSync()
    }

    const handleOffline = () => {
      useSyncStore.getState().setOnline(false)
      useSyncStore.getState().setStatus('offline')
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        lastHidden = Date.now()
      } else {
        // If returning after 30+ seconds AND online, trigger sync
        const elapsed = Date.now() - lastHidden
        if (elapsed > 30_000 && navigator.onLine) {
          pullCoachData() // Pull any coach updates
          flushPendingSync() // Push any pending client changes
        }
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Native app lifecycle: background/foreground detection (SHELL-05)
  useEffect(() => {
    if (!isNative()) return

    let lastBackground = 0

    const listener = CapApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        lastBackground = Date.now()
        console.log('[Capacitor] App went to background')
      } else {
        console.log('[Capacitor] App resumed to foreground')
        // Always update badge on foreground
        updateBadge()
        const elapsed = Date.now() - lastBackground
        if (elapsed > 30_000 && navigator.onLine) {
          pullCoachData()
          flushPendingSync()
        }
      }
    })

    return () => { listener.then(l => l.remove()) }
  }, [])

  // Track app opened once per session
  useEffect(() => {
    analytics.appOpened()
  }, [])

  // Check for neglected avatar on app load
  useEffect(() => {
    if (profile?.onboardingComplete) {
      checkNeglected()
    }
  }, [profile?.onboardingComplete, checkNeglected])

  const devBypass = import.meta.env.VITE_DEV_BYPASS === 'true'

  // Show loading while auth initializes (skip in dev bypass)
  if (!devBypass && authLoading) {
    return (
      <>
        <ToastContainer />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </>
    )
  }

  // If not authenticated, show auth screen
  if (!devBypass && !user) {
    return (
      <>
        <ToastContainer />
        <SentryRoutes>
          <Route path="/auth" element={<Auth defaultMode="login" />} />
          <Route path="/reset-password" element={<Suspense fallback={<HomeSkeleton />}><ResetPassword /></Suspense>} />
          <Route path="/privacy" element={<Suspense fallback={<HomeSkeleton />}><Privacy /></Suspense>} />
          <Route path="*" element={<Auth />} />
        </SentryRoutes>
      </>
    )
  }

  // If authenticated but onboarding not complete, show onboarding
  if (!devBypass && (!profile || !profile.onboardingComplete)) {
    return (
      <>
        <ToastContainer />
        <Suspense fallback={<OnboardingSkeleton />}>
          <SentryRoutes>
            <Route path="*" element={<Onboarding />} />
          </SentryRoutes>
        </Suspense>
      </>
    )
  }

  return (
    <>
      <ToastContainer />
      <div className="relative">
        <SyncStatusIndicator />
        <SentryRoutes>
          <Route path="/" element={<Suspense fallback={<HomeSkeleton />}><Home /></Suspense>} />
          <Route path="/workouts" element={<Suspense fallback={<WorkoutsSkeleton />}><Workouts /></Suspense>} />
          <Route path="/macros" element={<Suspense fallback={<MacrosSkeleton />}><Macros /></Suspense>} />
          <Route path="/avatar" element={<Suspense fallback={<AvatarSkeleton />}><AvatarScreen /></Suspense>} />
          <Route path="/settings" element={<Suspense fallback={<SettingsSkeleton />}><Settings /></Suspense>} />
          <Route path="/achievements" element={<Suspense fallback={<AchievementsSkeleton />}><Achievements /></Suspense>} />
          <Route path="/checkin" element={<Suspense fallback={<HomeSkeleton />}><WeeklyCheckIn /></Suspense>} />
          <Route path="/reset-password" element={<Suspense fallback={<HomeSkeleton />}><ResetPassword /></Suspense>} />
          <Route path="/privacy" element={<Suspense fallback={<HomeSkeleton />}><Privacy /></Suspense>} />
          <Route path="/auth" element={devBypass ? <Auth /> : <Navigate to="/" replace />} />
          {devBypass && <Route path="/onboarding" element={<Suspense fallback={<OnboardingSkeleton />}><Onboarding /></Suspense>} />}
          <Route path="*" element={<NotFound />} />
        </SentryRoutes>
        <Navigation />
      </div>
    </>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
      <UpdatePrompt />
    </ErrorBoundary>
  )
}

export default App
