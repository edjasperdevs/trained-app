import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useUserStore, useAvatarStore, useAuthStore, useAccessStore } from '@/stores'
import { Navigation, ToastContainer, ErrorBoundary } from '@/components'
import { ThemeProvider } from '@/themes'
import {
  Onboarding,
  Home,
  Workouts,
  Macros,
  AvatarScreen,
  Settings,
  Auth,
  Coach,
  Achievements,
  AccessGate
} from '@/screens'

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
        <Routes>
          <Route path="*" element={<Onboarding />} />
        </Routes>
      </>
    )
  }

  return (
    <>
      <ToastContainer />
      <div className="relative">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/workouts" element={<Workouts />} />
          <Route path="/macros" element={<Macros />} />
          <Route path="/avatar" element={<AvatarScreen />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/coach" element={<Coach />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="*" element={<Navigate to="/" replace />} />
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
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
