import { useEffect, useState, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { withSentryReactRouterV6Routing } from '@/lib/sentry'
import { useUserStore, useAvatarStore, useAuthStore, useAccessStore, useSyncStore } from '@/stores'
import { flushPendingSync, pullCoachData } from '@/lib/sync'
import { analytics } from '@/lib/analytics'
import { Navigation, ToastContainer, ErrorBoundary, UpdatePrompt, NotFound, HomeSkeleton, WorkoutsSkeleton, MacrosSkeleton, AchievementsSkeleton, AvatarSkeleton, SettingsSkeleton, OnboardingSkeleton, SyncStatusIndicator } from '@/components'
import { AccessGate, Auth } from '@/screens'

const SentryRoutes = withSentryReactRouterV6Routing(Routes)

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

function AppContent() {
  const profile = useUserStore((state) => state.profile)
  const resetProgress = useUserStore((state) => state.resetProgress)
  const checkNeglected = useAvatarStore((state) => state.checkNeglected)
  const initializeAuth = useAuthStore((state) => state.initialize)
  const signOut = useAuthStore((state) => state.signOut)
  const authLoading = useAuthStore((state) => state.isLoading)
  const user = useAuthStore((state) => state.user)
  const hasAccess = useAccessStore((state) => state.hasAccess)
  const revokeAccess = useAccessStore((state) => state.revokeAccess)
  const [accessGranted, setAccessGranted] = useState(hasAccess)
  const location = useLocation()

  // Check for ?reset=true URL parameter to clear all data
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('reset') === 'true') {
      // Clear all app data
      resetProgress()
      revokeAccess()
      signOut()
      // Remove the ?reset=true from URL
      window.history.replaceState({}, '', window.location.pathname)
      // Force page reload to ensure clean state
      window.location.reload()
    }
  }, [resetProgress, revokeAccess, signOut])

  // Initialize auth on app load
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

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
  const isAuthRoute = location.pathname === '/auth'

  // Check access code first (before auth) — coach route, auth route, and authenticated users bypass
  if (!devBypass && !hasAccess && !accessGranted && !user && !isCoachRoute && !isAuthRoute) {
    return (
      <>
        <ToastContainer />
        <SentryRoutes>
          <Route path="*" element={<AccessGate onAccessGranted={() => setAccessGranted(true)} />} />
        </SentryRoutes>
      </>
    )
  }

  // If not authenticated, show auth screen
  if (!devBypass && !user) {
    return (
      <>
        <ToastContainer />
        <SentryRoutes>
          <Route path="/coach" element={<Auth defaultMode="login" />} />
          <Route path="/auth" element={<Auth defaultMode="login" />} />
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
          <Route path="/coach" element={<Suspense fallback={<HomeSkeleton />}><Coach /></Suspense>} />
          <Route path="/achievements" element={<Suspense fallback={<AchievementsSkeleton />}><Achievements /></Suspense>} />
          <Route path="/checkin" element={<Suspense fallback={<HomeSkeleton />}><WeeklyCheckIn /></Suspense>} />
          <Route path="/auth" element={devBypass ? <Auth /> : <Navigate to="/" replace />} />
          {devBypass && <Route path="/access" element={<AccessGate onAccessGranted={() => {}} />} />}
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
