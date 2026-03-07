import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense } from 'react'
import { HomeSkeleton } from '@/components'
import {
  SignUpScreen,
  SignInScreen,
  EmailSignUpScreen,
  EmailSignInScreen,
  ForgotPasswordScreen,
} from '@/screens/auth-screens'

export function AuthStack() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <Routes>
        <Route path="signup" element={<SignUpScreen />} />
        <Route path="signin" element={<SignInScreen />} />
        <Route path="email-signup" element={<EmailSignUpScreen />} />
        <Route path="email-signin" element={<EmailSignInScreen />} />
        <Route path="forgot-password" element={<ForgotPasswordScreen />} />
        {/* Default to signup for new users */}
        <Route path="*" element={<Navigate to="signup" replace />} />
      </Routes>
    </Suspense>
  )
}
