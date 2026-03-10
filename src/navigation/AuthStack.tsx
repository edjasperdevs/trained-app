import { Routes, Route, Navigate } from 'react-router-dom'
import {
  SignInScreen,
  SignUpScreen,
  EmailSignInScreen,
  EmailSignUpScreen,
  ForgotPasswordScreen,
} from '@/screens/auth-screens'

/**
 * AuthStack - Handles authentication screens with social and email auth
 */
export function AuthStack() {
  return (
    <Routes>
      <Route path="/" element={<SignInScreen />} />
      <Route path="/signin" element={<SignInScreen />} />
      <Route path="/signup" element={<SignUpScreen />} />
      <Route path="/email-signin" element={<EmailSignInScreen />} />
      <Route path="/email-signup" element={<EmailSignUpScreen />} />
      <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  )
}
