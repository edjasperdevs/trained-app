import { useState } from 'react'
import { motion } from 'motion/react'
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
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false)

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
          setNeedsEmailConfirmation(true)
          setSuccess('Account created! Check your email to confirm before signing in.')
          toast.success('Account created! Check your email to confirm.')
          // Switch to login mode so they can sign in after confirming
          setMode('login')
        }
      } else if (mode === 'login') {
        const { error, code } = await signIn(email, password)
        if (error) {
          // Use error code for clearer messaging
          if (code === 'email_not_confirmed') {
            setNeedsEmailConfirmation(true)
            setError('Please confirm your email before signing in. Check your inbox (and spam folder) for the confirmation link.')
          } else if (code === 'invalid_credentials') {
            // Could be wrong password OR unconfirmed email (Supabase combines these)
            if (needsEmailConfirmation) {
              setError('Please confirm your email first. Check your inbox (and spam folder) for the confirmation link.')
            } else {
              setError('Invalid email or password. If you recently signed up, please confirm your email first.')
            }
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
        toast.error('No internet connection. Check your WiFi or cellular data and try again.')
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-5">
        <Card className="w-full max-w-md text-center">
          <span className="text-4xl block mb-4">🔧</span>
          <h2 className="text-xl font-bold mb-2">Setup Required</h2>
          <p className="text-text-secondary">
            Backend is not configured. Please contact your administrator or check the setup instructions.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold tracking-wide">TRAINED</h1>
          <p className="text-text-secondary mt-2">
            {mode === 'login' && 'Welcome back'}
            {mode === 'signup' && 'Build discipline through fitness'}
            {mode === 'forgot' && 'Reset your password'}
          </p>
        </div>

        {/* Email Confirmation Banner */}
        {needsEmailConfirmation && mode === 'login' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-accent-warning/10 border border-accent-warning/30 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">📧</span>
              <div>
                <p className="font-semibold text-accent-warning">Confirm Your Email</p>
                <p className="text-sm text-text-secondary mt-1">
                  We sent a confirmation link to <span className="text-text-primary">{email || 'your email'}</span>.
                  Click the link to activate your account, then come back here to sign in.
                </p>
                <p className="text-xs text-text-secondary mt-2">
                  Don't see it? Check your spam folder.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-xs text-text-secondary block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-base"
                required
              />
            </div>

            {/* Password (not shown for forgot mode) */}
            {mode !== 'forgot' && (
              <div>
                <label className="text-xs text-text-secondary block mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-base"
                  required
                />
              </div>
            )}

            {/* Confirm Password (only for signup) */}
            {mode === 'signup' && (
              <div>
                <label className="text-xs text-text-secondary block mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-base"
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
          <div className="mt-6 pt-6 border-t border-border space-y-3">
            {mode === 'login' && (
              <>
                <button
                  onClick={() => { setMode('signup'); setError(''); setSuccess('') }}
                  className="w-full text-sm text-text-secondary hover:text-text-primary"
                >
                  Don't have an account? <span className="text-accent-primary">Sign up</span>
                </button>
                <button
                  onClick={() => { setMode('forgot'); setError(''); setSuccess('') }}
                  className="w-full text-sm text-text-secondary hover:text-text-primary"
                >
                  Forgot your password?
                </button>
              </>
            )}

            {mode === 'signup' && (
              <button
                onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                className="w-full text-sm text-text-secondary hover:text-text-primary"
              >
                Already have an account? <span className="text-accent-primary">Sign in</span>
              </button>
            )}

            {mode === 'forgot' && (
              <button
                onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                className="w-full text-sm text-text-secondary hover:text-text-primary"
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
