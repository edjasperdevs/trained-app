import { Navigate } from 'react-router-dom'

/**
 * AuthStack - Redirects to onboarding flow
 * The new onboarding flow handles both auth and onboarding
 */
export function AuthStack() {
  return <Navigate to="/onboarding/welcome" replace />
}
