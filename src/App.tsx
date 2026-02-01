import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useUserStore, useAvatarStore, useAuthStore } from '@/stores'
import { Navigation, ToastContainer } from '@/components'
import {
  Onboarding,
  Home,
  Workouts,
  Macros,
  AvatarScreen,
  Settings,
  Auth,
  Coach,
  Achievements
} from '@/screens'

function App() {
  const profile = useUserStore((state) => state.profile)
  const checkNeglected = useAvatarStore((state) => state.checkNeglected)
  const initializeAuth = useAuthStore((state) => state.initialize)
  const authLoading = useAuthStore((state) => state.isLoading)
  const user = useAuthStore((state) => state.user)

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
        <div className="min-h-screen bg-bg-primary flex items-center justify-center">
          <div className="text-center">
            <span className="text-4xl block mb-4 animate-pulse">🎮</span>
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
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

export default App
