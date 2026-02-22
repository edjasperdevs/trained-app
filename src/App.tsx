import { useEffect, useState, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { withSentryReactRouterV6Routing } from '@/lib/sentry'
import { useUserStore, useAvatarStore, useAuthStore, useSyncStore } from '@/stores'
import { flushPendingSync, pullCoachData } from '@/lib/sync'
import { App as CapApp } from '@capacitor/app'
import { isNative } from '@/lib/platform'
import { initDeepLinkHandler } from '@/lib/deep-link'
import { isCoach } from '@/lib/supabase'
import { analytics } from '@/lib/analytics'
import { Navigation, ToastContainer, ErrorBoundary, UpdatePrompt, NotFound, HomeSkeleton, WorkoutsSkeleton, MacrosSkeleton, AchievementsSkeleton, AvatarSkeleton, SettingsSkeleton, OnboardingSkeleton, SyncStatusIndicator } from '@/components'
import { Auth } from '@/screens'

const SentryRoutes = withSentryReactRouterV6Routing(Routes)

// Coach route guard — eagerly imported, checks role before loading Coach chunk
function CoachGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'authorized' | 'denied'>('loading')

  useEffect(() => {
    isCoach().then(result => setStatus(result ? 'authorized' : 'denied'))
  }, [])

  if (status === 'loading') return <HomeSkeleton />
  if (status === 'denied') return <Navigate to="/" replace />
  return <>{children}</>
}

// Lazy-loaded route components
const Onboarding = lazy(() => import('@/screens/Onboarding').then(m => ({ default: m.Onboarding })))
const Home = lazy(() => import('@/screens/Home').then(m => ({ default: m.Home })))
const Workouts = lazy(() => import('@/screens/Workouts').then(m => ({ default: m.Workouts })))
const Macros = lazy(() => import('@/screens/Macros').then(m => ({ default: m.Macros })))
const AvatarScreen = lazy(() => import('@/screens/AvatarScreen').then(m => ({ default: m.AvatarScreen })))
const Settings = lazy(() => import('@/screens/Settings').then(m => ({ default: m.Settings })))
const Coach = lazy(() => import('@/screens/Coach').then(m => ({ default: m.Coach })))
const Achievements = lazy(() => import('@/screens/Achievements').then(m => ({ default: m.Achievements })))
const WeeklyCheckIn = lazy(() => import('@/screens/WeeklyCheckIn').then(m => ({ default: m.WeeklyCheckIn })))
const ResetPassword = lazy(() => import('@/screens/ResetPassword').then(m => ({ default: m.ResetPassword })))

function AppContent() {
  const profile = useUserStore((state) => state.profile)
  const checkNeglected = useAvatarStore((state) => state.checkNeglected)
  const initializeAuth = useAuthStore((state) => state.initialize)
  const authLoading = useAuthStore((state) => state.isLoading)
  const user = useAuthStore((state) => state.user)
  const location = useLocation()
  const navigate = useNavigate()

  // Initialize auth on app load
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  // Initialize deep link handler (native only -- no-op on web)
  useEffect(() => {
    initDeepLinkHandler(navigate)
  }, [navigate])

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

  const isCoachRoute = location.pathname === '/coach'

  // If not authenticated, show auth screen
  if (!devBypass && !user) {
    return (
      <>
        <ToastContainer />
        <SentryRoutes>
          <Route path="/coach" element={<Auth defaultMode="login" />} />
          <Route path="/auth" element={<Auth defaultMode="login" />} />
          <Route path="/reset-password" element={<Suspense fallback={<HomeSkeleton />}><ResetPassword /></Suspense>} />
          <Route path="*" element={<Auth />} />
        </SentryRoutes>
      </>
    )
  }

  // If authenticated but onboarding not complete, show onboarding (coach route bypasses)
  if (!devBypass && (!profile || !profile.onboardingComplete) && !isCoachRoute) {
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
          <Route path="/coach" element={<CoachGuard><Suspense fallback={<HomeSkeleton />}><Coach /></Suspense></CoachGuard>} />
          <Route path="/achievements" element={<Suspense fallback={<AchievementsSkeleton />}><Achievements /></Suspense>} />
          <Route path="/checkin" element={<Suspense fallback={<HomeSkeleton />}><WeeklyCheckIn /></Suspense>} />
          <Route path="/reset-password" element={<Suspense fallback={<HomeSkeleton />}><ResetPassword /></Suspense>} />
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
