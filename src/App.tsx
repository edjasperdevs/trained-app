import { useEffect, useState, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useUserStore, useAvatarStore, useAuthStore, useAccessStore } from '@/stores'
import { Navigation, ToastContainer, ErrorBoundary, UpdatePrompt, NotFound, HomeSkeleton, WorkoutsSkeleton, MacrosSkeleton, AchievementsSkeleton, AvatarSkeleton, SettingsSkeleton, OnboardingSkeleton } from '@/components'
import { ThemeProvider } from '@/themes'
import { AccessGate, Auth } from '@/screens'

// Lazy-loaded route components
const Onboarding = lazy(() => import('@/screens/Onboarding').then(m => ({ default: m.Onboarding })))
const Home = lazy(() => import('@/screens/Home').then(m => ({ default: m.Home })))
const Workouts = lazy(() => import('@/screens/Workouts').then(m => ({ default: m.Workouts })))
const Macros = lazy(() => import('@/screens/Macros').then(m => ({ default: m.Macros })))
const AvatarScreen = lazy(() => import('@/screens/AvatarScreen').then(m => ({ default: m.AvatarScreen })))
const Settings = lazy(() => import('@/screens/Settings').then(m => ({ default: m.Settings })))
// const Coach = lazy(() => import('@/screens/Coach').then(m => ({ default: m.Coach }))) // Disabled for client-only launch
const Achievements = lazy(() => import('@/screens/Achievements').then(m => ({ default: m.Achievements })))

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

  // Check for neglected avatar on app load
  useEffect(() => {
    if (profile?.onboardingComplete) {
      checkNeglected()
    }
  }, [profile?.onboardingComplete, checkNeglected])

  // Show loading while auth initializes
  if (authLoading) {
    return (
      <>
        <ToastContainer />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Loading...</p>
          </div>
        </div>
      </>
    )
  }

  // Check access code first (before auth)
  if (!hasAccess && !accessGranted) {
    return (
      <>
        <ToastContainer />
        <AccessGate onAccessGranted={() => setAccessGranted(true)} />
      </>
    )
  }

  // If not authenticated, show auth screen
  if (!user) {
    return (
      <>
        <ToastContainer />
        <Routes>
          <Route path="*" element={<Auth />} />
        </Routes>
      </>
    )
  }

  // If authenticated but onboarding not complete, show onboarding
  if (!profile || !profile.onboardingComplete) {
    return (
      <>
        <ToastContainer />
        <Suspense fallback={<OnboardingSkeleton />}>
          <Routes>
            <Route path="*" element={<Onboarding />} />
          </Routes>
        </Suspense>
      </>
    )
  }

  return (
    <>
      <ToastContainer />
      <div className="relative">
        <Routes>
          <Route path="/" element={<Suspense fallback={<HomeSkeleton />}><Home /></Suspense>} />
          <Route path="/workouts" element={<Suspense fallback={<WorkoutsSkeleton />}><Workouts /></Suspense>} />
          <Route path="/macros" element={<Suspense fallback={<MacrosSkeleton />}><Macros /></Suspense>} />
          <Route path="/avatar" element={<Suspense fallback={<AvatarSkeleton />}><AvatarScreen /></Suspense>} />
          <Route path="/settings" element={<Suspense fallback={<SettingsSkeleton />}><Settings /></Suspense>} />
          <Route path="/coach" element={<Navigate to="/" replace />} />
          <Route path="/achievements" element={<Suspense fallback={<AchievementsSkeleton />}><Achievements /></Suspense>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Navigation />
      </div>
    </>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent />
        <UpdatePrompt />
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
