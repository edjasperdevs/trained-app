import { useEffect, useState, useRef, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { withSentryReactRouterV6Routing } from '@/lib/sentry'
import { useUserStore, useAvatarStore, useAuthStore, useSyncStore, useSubscriptionStore, useHealthStore } from '@/stores'
import { flushPendingSync, pullCoachData } from '@/lib/sync'
import { App as CapApp } from '@capacitor/app'
import { isNative, isIOS } from '@/lib/platform'
import { initDeepLinkHandler } from '@/lib/deep-link'
import { initializeRevenueCat } from '@/lib/revenuecat'
import { LocalNotifications } from '@capacitor/local-notifications'
import { initPushListeners, requestPushPermission } from '@/lib/push'
import { scheduleAllNotifications } from '@/lib/notifications'
import { updateBadge } from '@/lib/badge'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useRemindersStore } from '@/stores/remindersStore'
import { useReferralStore } from '@/stores/referralStore'
import { analytics } from '@/lib/analytics'
import { Navigation, ToastContainer, ErrorBoundary, UpdatePrompt, NotFound, HomeSkeleton, WorkoutsSkeleton, MacrosSkeleton, AchievementsSkeleton, AvatarSkeleton, SettingsSkeleton, SyncStatusIndicator, DPToastContainer, useDPToasts, AnimatedSplashScreen } from '@/components'
import { SafeAreaLayout } from '@/components/layout/SafeAreaLayout'
import { Auth } from '@/screens'
import { OnboardingStack, AuthStack } from '@/navigation'

const SentryRoutes = withSentryReactRouterV6Routing(Routes)

// Lazy-loaded route components
const Home = lazy(() => import('@/screens/Home').then(m => ({ default: m.Home })))
const Workouts = lazy(() => import('@/screens/Workouts').then(m => ({ default: m.Workouts })))
const Macros = lazy(() => import('@/screens/Macros').then(m => ({ default: m.Macros })))
const AvatarScreen = lazy(() => import('@/screens/AvatarScreen').then(m => ({ default: m.AvatarScreen })))
const Settings = lazy(() => import('@/screens/Settings').then(m => ({ default: m.Settings })))
const Achievements = lazy(() => import('@/screens/Achievements').then(m => ({ default: m.Achievements })))
const WeeklyCheckIn = lazy(() => import('@/screens/WeeklyCheckIn').then(m => ({ default: m.WeeklyCheckIn })))
const ResetPassword = lazy(() => import('@/screens/ResetPassword').then(m => ({ default: m.ResetPassword })))
const Privacy = lazy(() => import('@/screens/Privacy').then(m => ({ default: m.Privacy })))
const Terms = lazy(() => import('@/screens/Terms').then(m => ({ default: m.Terms })))
const Paywall = lazy(() => import('@/screens/Paywall').then(m => ({ default: m.Paywall })))
const HealthPermission = lazy(() => import('@/screens/HealthPermission').then(m => ({ default: m.HealthPermission })))
const DebugScreen = lazy(() => import('@/screens/DebugScreen').then(m => ({ default: m.DebugScreen })))
const Progress = lazy(() => import('@/screens/Progress').then(m => ({ default: m.Progress })))
const RecruitScreen = lazy(() => import('@/screens/RecruitScreen').then(m => ({ default: m.RecruitScreen })))
const LockedProtocolScreen = lazy(() => import('@/screens/LockedProtocolScreen').then(m => ({ default: m.LockedProtocolScreen })))
// TODO: Re-enable for v2 launch
// const MealPlanScreen = lazy(() => import('@/screens/MealPlanScreen').then(m => ({ default: m.MealPlanScreen })))


function AppContent() {
  const profile = useUserStore((state) => state.profile)
  const checkNeglected = useAvatarStore((state) => state.checkNeglected)
  const initializeAuth = useAuthStore((state) => state.initialize)
  const authLoading = useAuthStore((state) => state.isLoading)
  const isSyncing = useAuthStore((state) => state.isSyncing)
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const location = useLocation()
  const { showDPToast, toasts, removeToast } = useDPToasts()

  // Expose DP toast via window so dpStore can call it without circular imports
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ; (window as any).__dpToastFn = showDPToast
    return () => { (window as any).__dpToastFn = undefined }
  }, [showDPToast])
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
          // Special handling for weekly report - use sessionStorage flag
          if (route === '/weekly-report') {
            sessionStorage.setItem('showWeeklyReport', 'true')
            navigate('/')
          } else {
            navigate(route)
          }
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

  // Initialize RevenueCat subscriptions after auth (native only)
  useEffect(() => {
    const initSubscriptions = async () => {
      if (user && isNative()) {
        await initializeRevenueCat(user.id)
        await useSubscriptionStore.getState().checkEntitlements()
      }
    }
    initSubscriptions()
  }, [user])

  // Check for recruit completions after auth (fire-and-forget)
  useEffect(() => {
    if (user) {
      useReferralStore.getState().checkRecruitCompletion()
    }
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
  const subscriptionLoading = useSubscriptionStore((s) => s.isLoading)
  const healthPermissionStatus = useHealthStore((s) => s.permissionStatus)

  // Show loading while auth initializes or profile syncs (skip in dev bypass)
  if (!devBypass && (authLoading || isSyncing)) {
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

  // Show loading while subscription status initializes on native (after auth)
  if (isNative() && subscriptionLoading && user) {
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

  // If not authenticated, show AuthStack
  if (!devBypass && !user) {
    return (
      <>
        <ToastContainer />
        <SentryRoutes>
          <Route path="/auth/*" element={<AuthStack />} />
          <Route path="/reset-password" element={<Suspense fallback={<HomeSkeleton />}><ResetPassword /></Suspense>} />
          <Route path="/privacy" element={<Suspense fallback={<HomeSkeleton />}><Privacy /></Suspense>} />
          <Route path="/terms" element={<Suspense fallback={<HomeSkeleton />}><Terms /></Suspense>} />
          <Route path="*" element={<Navigate to="/auth/signup" replace />} />
        </SentryRoutes>
      </>
    )
  }

  // If authenticated but onboarding not complete, show OnboardingStack
  if (!devBypass && (!profile || !profile.onboardingComplete)) {
    return (
      <>
        <ToastContainer />
        <SentryRoutes>
          <Route path="/onboarding/*" element={<OnboardingStack />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="*" element={<Navigate to="/onboarding/welcome" replace />} />
        </SentryRoutes>
      </>
    )
  }

  // Check if iOS user needs health permission soft-ask (after onboarding complete)
  const needsHealthPermission = isIOS() && healthPermissionStatus === 'unknown'

  return (
    <>
      <ToastContainer />
      <DPToastContainer toasts={toasts} onRemove={removeToast} />
      <SafeAreaLayout>
        <div className="relative">
          <SyncStatusIndicator />
          <AnimatePresence mode="wait" initial={false}>
            <SentryRoutes location={location} key={location.pathname}>
              <Route path="/" element={
                needsHealthPermission
                  ? <Navigate to="/health-permission" replace />
                  : <Suspense fallback={<HomeSkeleton />}><Home /></Suspense>
              } />
              <Route path="/health-permission" element={<Suspense fallback={<HomeSkeleton />}><HealthPermission /></Suspense>} />
              <Route path="/workouts" element={<Suspense fallback={<WorkoutsSkeleton />}><Workouts /></Suspense>} />
              <Route path="/macros" element={<Suspense fallback={<MacrosSkeleton />}><Macros /></Suspense>} />
              {/* TODO: Re-enable for v2 launch */}
              {/* <Route path="/protocol-ai" element={<Suspense fallback={<MacrosSkeleton />}><MealPlanScreen /></Suspense>} />*/}
              <Route path="/avatar" element={<Suspense fallback={<AvatarSkeleton />}><AvatarScreen /></Suspense>} />
              <Route path="/settings" element={<Suspense fallback={<SettingsSkeleton />}><Settings /></Suspense>} />
              <Route path="/achievements" element={<Suspense fallback={<AchievementsSkeleton />}><Achievements /></Suspense>} />
              <Route path="/progress" element={<Suspense fallback={<HomeSkeleton />}><Progress /></Suspense>} />
              <Route path="/checkin" element={<Suspense fallback={<HomeSkeleton />}><WeeklyCheckIn /></Suspense>} />
              <Route path="/reset-password" element={<Suspense fallback={<HomeSkeleton />}><ResetPassword /></Suspense>} />
              <Route path="/privacy" element={<Suspense fallback={<HomeSkeleton />}><Privacy /></Suspense>} />
              <Route path="/terms" element={<Suspense fallback={<HomeSkeleton />}><Terms /></Suspense>} />
              <Route path="/paywall" element={<Suspense fallback={<HomeSkeleton />}><Paywall /></Suspense>} />
              <Route path="/debug" element={<Suspense fallback={<HomeSkeleton />}><DebugScreen /></Suspense>} />
              <Route path="/recruit" element={<Suspense fallback={<SettingsSkeleton />}><RecruitScreen /></Suspense>} />
              <Route path="/locked-protocol" element={<Suspense fallback={<SettingsSkeleton />}><LockedProtocolScreen /></Suspense>} />
              <Route path="/auth" element={devBypass ? <Auth /> : <Navigate to="/" replace />} />
              <Route path="*" element={<NotFound />} />
            </SentryRoutes>
          </AnimatePresence>
          <Navigation />
        </div>
      </SafeAreaLayout>
    </>
  )
}

function App() {
  const [showSplash, setShowSplash] = useState(true)

  return (
    <ErrorBoundary>
      <AppContent />
      <UpdatePrompt />
      {showSplash && <AnimatedSplashScreen onComplete={() => setShowSplash(false)} />}
    </ErrorBoundary>
  )
}

export default App
