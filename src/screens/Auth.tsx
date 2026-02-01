import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button, Card } from '@/components'
import { useAuthStore, toast } from '@/stores'

type AuthMode = 'login' | 'signup' | 'forgot'

export function Auth() {
  const { signIn, signUp, resetPassword, isConfigured } = useAuthStore()

  const [mode, setMode] = useState<AuthMode>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      setIsLoading(false)
      return
    }

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('Passwords do not match')
          setIsLoading(false)
          return
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters')
          setIsLoading(false)
          return
        }

        const { error } = await signUp(email, password)
        if (error) {
          setError(error)
        } else {
          setSuccess('Check your email to confirm your account!')
          toast.success('Account created! Check your email to confirm.')
        }
      } else if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) {
          // Provide more user-friendly error messages
          if (error.includes('Invalid login credentials')) {
            setError('Invalid email or password')
          } else if (error.includes('Email not confirmed')) {
            setError('Please check your email and confirm your account first')
          } else {
            setError(error)
          }
        }
        // Navigation happens automatically via auth state change
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email)
        if (error) {
          setError(error)
        } else {
          setSuccess('Check your email for a password reset link')
          toast.info('Password reset email sent')
        }
      }
    } catch (err) {
      // Check for network errors
      if (err instanceof Error && (err.message.includes('network') || err.message.includes('fetch'))) {
        setError('Network error - check your internet connection')
        toast.error('No internet connection')
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <span className="text-4xl block mb-4">🔧</span>
          <h2 className="text-xl font-bold mb-2">Setup Required</h2>
          <p className="text-gray-400">
            Backend is not configured. Please contact your administrator or check the setup instructions.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-6xl block mb-4">🎮</span>
          <h1 className="text-2xl font-bold">Gamify Your Gains</h1>
          <p className="text-gray-400 mt-2">
            {mode === 'login' && 'Welcome back!'}
            {mode === 'signup' && 'Level up your fitness journey'}
            {mode === 'forgot' && 'Reset your password'}
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-xs text-gray-500 block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-bg-secondary border border-gray-700 rounded-lg px-3 py-2"
                required
              />
            </div>

            {/* Password (not shown for forgot mode) */}
            {mode !== 'forgot' && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-bg-secondary border border-gray-700 rounded-lg px-3 py-2"
                  required
                />
              </div>
            )}

            {/* Confirm Password (only for signup) */}
            {mode === 'signup' && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-bg-secondary border border-gray-700 rounded-lg px-3 py-2"
                  required
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <p className="text-accent-danger text-sm text-center">{error}</p>
            )}

            {/* Success Message */}
            {success && (
              <p className="text-accent-success text-sm text-center">{success}</p>
            )}

            {/* Submit Button */}
            <Button type="submit" fullWidth disabled={isLoading}>
              {isLoading ? 'Loading...' : (
                mode === 'login' ? 'Sign In' :
                mode === 'signup' ? 'Create Account' :
                'Send Reset Link'
              )}
            </Button>
          </form>

          {/* Mode Toggles */}
          <div className="mt-6 pt-6 border-t border-gray-800 space-y-3">
            {mode === 'login' && (
              <>
                <button
                  onClick={() => { setMode('signup'); setError(''); setSuccess('') }}
                  className="w-full text-sm text-gray-400 hover:text-white"
                >
                  Don't have an account? <span className="text-accent-primary">Sign up</span>
                </button>
                <button
                  onClick={() => { setMode('forgot'); setError(''); setSuccess('') }}
                  className="w-full text-sm text-gray-400 hover:text-white"
                >
                  Forgot your password?
                </button>
              </>
            )}

            {mode === 'signup' && (
              <button
                onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                className="w-full text-sm text-gray-400 hover:text-white"
              >
                Already have an account? <span className="text-accent-primary">Sign in</span>
              </button>
            )}

            {mode === 'forgot' && (
              <button
                onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                className="w-full text-sm text-gray-400 hover:text-white"
              >
                Back to <span className="text-accent-primary">Sign in</span>
              </button>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
