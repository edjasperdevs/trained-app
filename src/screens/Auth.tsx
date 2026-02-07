import { useState } from 'react'
import { Mail } from 'lucide-react'
import { useAuthStore, toast } from '@/stores'
import { analytics } from '@/lib/analytics'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

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
          analytics.signupCompleted()
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
        } else {
          analytics.loginCompleted()
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
      <div className="min-h-screen flex flex-col items-center justify-center px-5">
        <Card className="w-full max-w-md text-center">
          <CardContent>
            <span className="text-4xl block mb-4">🔧</span>
            <h2 className="text-xl font-bold mb-2">Setup Required</h2>
            <p className="text-muted-foreground">
              Backend is not configured. Please contact your administrator or check the setup instructions.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div data-testid="auth-screen" className="min-h-screen flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold tracking-wide">TRAINED</h1>
          <p className="text-muted-foreground mt-2">
            {mode === 'login' && 'Welcome back'}
            {mode === 'signup' && 'Build discipline through fitness'}
            {mode === 'forgot' && 'Reset your password'}
          </p>
        </div>

        {/* Email Confirmation Banner */}
        {needsEmailConfirmation && mode === 'login' && (
          <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <Alert className="border-warning/30 bg-warning/10">
              <Mail className="size-4 text-warning" />
              <AlertTitle className="text-warning">Confirm Your Email</AlertTitle>
              <AlertDescription>
                We sent a confirmation link to <span className="text-foreground font-medium">{email || 'your email'}</span>.
                Click the link to activate your account, then come back here to sign in.
                <p className="text-xs mt-2 text-muted-foreground">
                  Don't see it? Check your spam folder.
                </p>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              {mode === 'login' && 'Sign In'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'forgot' && 'Reset Password'}
            </CardTitle>
            <CardDescription>
              {mode === 'login' && 'Enter your credentials to continue'}
              {mode === 'signup' && 'Enter your details to get started'}
              {mode === 'forgot' && 'Enter your email to receive a reset link'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  data-testid="auth-email-input"
                />
              </div>

              {/* Password (not shown for forgot mode) */}
              {mode !== 'forgot' && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    data-testid="auth-password-input"
                  />
                </div>
              )}

              {/* Confirm Password (only for signup) */}
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              )}

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Success Message */}
              {success && (
                <Alert className="border-success/30 bg-success/10 text-success">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isLoading} data-testid="auth-submit-button">
                {isLoading ? 'Loading...' : (
                  mode === 'login' ? 'Sign In' :
                  mode === 'signup' ? 'Create Account' :
                  'Send Reset Link'
                )}
              </Button>
            </form>

            {/* Mode Toggles */}
            <Separator className="my-6" />
            <div className="space-y-3">
              {mode === 'login' && (
                <>
                  <button
                    onClick={() => { setMode('signup'); setError(''); setSuccess('') }}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="auth-toggle-mode"
                  >
                    Don't have an account? <span className="text-primary">Sign up</span>
                  </button>
                  <button
                    onClick={() => { setMode('forgot'); setError(''); setSuccess('') }}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forgot your password?
                  </button>
                </>
              )}

              {mode === 'signup' && (
                <button
                  onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="auth-toggle-mode"
                >
                  Already have an account? <span className="text-primary">Sign in</span>
                </button>
              )}

              {mode === 'forgot' && (
                <button
                  onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back to <span className="text-primary">Sign in</span>
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
