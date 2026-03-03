import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail } from 'lucide-react'
import { useAuthStore, toast } from '@/stores'
import { analytics } from '@/lib/analytics'
import { cn } from '@/lib/cn'

type AuthMode = 'splash' | 'login' | 'signup' | 'forgot'

// Geometric athlete silhouette SVG
function AthleteSilhouette() {
  return (
    <svg viewBox="0 0 200 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Subtle lime glow beneath */}
      <ellipse cx="100" cy="295" rx="55" ry="10" fill="#C8FF00" fillOpacity="0.15" />
      {/* Legs */}
      <path d="M78 220 L68 295 L80 295 L92 245 L92 220Z" fill="#26282B" stroke="#C8FF00" strokeWidth="1" strokeOpacity="0.6" />
      <path d="M122 220 L132 295 L120 295 L108 245 L108 220Z" fill="#26282B" stroke="#C8FF00" strokeWidth="1" strokeOpacity="0.6" />
      {/* Feet glow */}
      <rect x="66" y="292" width="16" height="5" rx="2" fill="#C8FF00" fillOpacity="0.4" />
      <rect x="118" y="292" width="16" height="5" rx="2" fill="#C8FF00" fillOpacity="0.4" />
      {/* Torso */}
      <path d="M72 140 L68 220 L132 220 L128 140 L120 130 L80 130Z" fill="#26282B" stroke="#1A1A1A" strokeWidth="0.5" />
      {/* Torso edge highlights */}
      <path d="M72 140 L68 220" stroke="#C8FF00" strokeWidth="1.5" strokeOpacity="0.5" />
      <path d="M128 140 L132 220" stroke="#C8FF00" strokeWidth="1.5" strokeOpacity="0.5" />
      {/* Arms */}
      <path d="M72 140 L48 195 L58 200 L80 155 L80 135Z" fill="#26282B" stroke="#C8FF00" strokeWidth="1" strokeOpacity="0.6" />
      <path d="M128 140 L152 195 L142 200 L120 155 L120 135Z" fill="#26282B" stroke="#C8FF00" strokeWidth="1" strokeOpacity="0.6" />
      {/* Forearm glow lines */}
      <path d="M48 195 L58 200" stroke="#C8FF00" strokeWidth="2" strokeOpacity="0.8" />
      <path d="M152 195 L142 200" stroke="#C8FF00" strokeWidth="2" strokeOpacity="0.8" />
      {/* Shoulder caps */}
      <ellipse cx="76" cy="138" rx="10" ry="6" fill="#C8FF00" fillOpacity="0.25" />
      <ellipse cx="124" cy="138" rx="10" ry="6" fill="#C8FF00" fillOpacity="0.25" />
      <path d="M66 138 Q76 130 86 138" stroke="#C8FF00" strokeWidth="1.5" strokeOpacity="0.9" />
      <path d="M114 138 Q124 130 134 138" stroke="#C8FF00" strokeWidth="1.5" strokeOpacity="0.9" />
      {/* Neck */}
      <rect x="91" y="108" width="18" height="24" rx="4" fill="#26282B" stroke="#1A1A1A" strokeWidth="0.5" />
      {/* Head */}
      <ellipse cx="100" cy="96" rx="22" ry="26" fill="#26282B" stroke="#1A1A1A" strokeWidth="0.5" />
      {/* Head top glow */}
      <path d="M82 84 Q100 68 118 84" stroke="#C8FF00" strokeWidth="1.5" strokeOpacity="0.7" />
      {/* Chest lines */}
      <path d="M88 155 L88 185 M112 155 L112 185 M88 170 L112 170" stroke="#C8FF00" strokeWidth="0.5" strokeOpacity="0.2" />
    </svg>
  )
}

function NoirInput({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoFocus = false,
  required = false,
  suffix,
}: {
  label: string
  id: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
  required?: boolean
  suffix?: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-[#A1A1AA] uppercase tracking-wider mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          required={required}
          className={cn(
            'w-full bg-[#26282B] border border-[#2E3035] rounded-xl px-4 py-3.5',
            'text-[#FAFAFA] placeholder:text-[#A1A1AA]/50 text-sm',
            'focus:outline-none focus:border-[#C8FF00] focus:ring-1 focus:ring-[#C8FF00]/30',
            'transition-all duration-200',
            suffix && 'pr-12'
          )}
        />
        {suffix && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {suffix}
          </div>
        )}
      </div>
    </div>
  )
}

function LimeButton({
  onClick,
  children,
  type = 'button',
  disabled = false,
  loading = false,
  className,
}: {
  onClick?: () => void
  children: React.ReactNode
  type?: 'button' | 'submit'
  disabled?: boolean
  loading?: boolean
  className?: string
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'w-full py-4 rounded-xl font-semibold text-[#0A0A0A] text-sm tracking-wide uppercase',
        'bg-[#C8FF00] hover:bg-[#D4FF33] active:bg-[#B6E800]',
        'transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {loading ? 'Loading...' : children}
    </button>
  )
}

export function Auth({ defaultMode = 'splash' }: { defaultMode?: AuthMode }) {
  const navigate = useNavigate()
  const { signIn, signUp, resetPassword, resendConfirmation, isConfigured } = useAuthStore()

  const [mode, setMode] = useState<AuthMode>(defaultMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

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
          setMode('login')
        }
      } else if (mode === 'login') {
        const { error, code } = await signIn(email, password)
        if (error) {
          if (code === 'email_not_confirmed') {
            setNeedsEmailConfirmation(true)
            setError('Please confirm your email before signing in.')
          } else if (code === 'invalid_credentials') {
            setError(needsEmailConfirmation
              ? 'Please confirm your email first. Check your inbox for the link.'
              : 'Invalid email or password.')
          } else {
            setError(error)
          }
        } else {
          analytics.loginCompleted()
        }
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
      if (err instanceof Error && (err.message.includes('network') || err.message.includes('fetch'))) {
        setError('Network error — check your connection')
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!email || isResending) return
    setIsResending(true)
    const { error } = await resendConfirmation(email)
    setIsResending(false)
    if (error) {
      toast.error('Failed to resend confirmation email')
    } else {
      toast.success('Confirmation email resent. Check your inbox.')
      setSuccess('Confirmation email resent.')
      setError('')
    }
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 bg-[#0A0A0A]">
        <div className="text-center">
          <span className="text-4xl block mb-4">🔧</span>
          <h2 className="text-xl font-bold text-[#FAFAFA] mb-2">Setup Required</h2>
          <p className="text-[#A1A1AA]">Backend not configured. Check setup instructions.</p>
        </div>
      </div>
    )
  }

  // ── SPLASH SCREEN ─────────────────────────────────────────────────────────
  if (mode === 'splash') {
    return (
      <div
        data-testid="auth-screen"
        className="min-h-screen flex flex-col bg-[#0A0A0A] relative overflow-hidden"
      >
        {/* Bottom lime glow atmosphere */}
        <div className="absolute bottom-0 left-0 right-0 h-[40%] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(200,255,0,0.08) 0%, transparent 70%)' }}
        />

        {/* Avatar — upper 55% of screen */}
        <div className="flex-1 flex items-end justify-center px-12 pb-0" style={{ maxHeight: '58vh' }}>
          <div className="w-full max-w-[200px]">
            <AthleteSilhouette />
          </div>
        </div>

        {/* Brand + CTAs — lower section */}
        <div className="px-6 pb-10 pt-4">
          {/* Wordmark */}
          <h1
            className="text-5xl font-black text-[#FAFAFA] tracking-tight leading-none mb-0"
            style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: '-0.01em' }}
          >
            WELLTRAINED
          </h1>

          {/* Lime rule */}
          <div className="h-px bg-[#C8FF00] my-4 w-full" />

          {/* Tagline */}
          <p className="text-[#A1A1AA] text-xs tracking-[0.25em] uppercase mb-8">
            The Protocol. The Discipline. The Rank.
          </p>

          {/* CTAs */}
          <div className="space-y-3">
            <LimeButton onClick={() => setMode('signup')}>
              Begin
            </LimeButton>

            <button
              onClick={() => setMode('login')}
              className="w-full py-3 text-[#A1A1AA] text-sm hover:text-[#FAFAFA] transition-colors"
            >
              Already a member? <span className="text-[#C8FF00]">Sign In</span>
            </button>
          </div>

          {/* Legal */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/privacy')}
              className="text-[10px] text-[#A1A1AA]/60"
            >
              Terms &amp; Privacy
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SIGN UP / LOGIN / FORGOT SCREENS ──────────────────────────────────────
  const isSignUp = mode === 'signup'

  return (
    <div data-testid="auth-screen" className="min-h-screen flex flex-col bg-[#0A0A0A] px-6 pt-12 pb-10">
      {/* Back to splash */}
      <button
        onClick={() => { setMode('splash'); setError(''); setSuccess('') }}
        className="text-[#A1A1AA] text-sm mb-8 text-left hover:text-[#FAFAFA] transition-colors"
      >
        ← Back
      </button>

      {/* Header */}
      <div className="mb-8">
        <p className="text-xs text-[#A1A1AA] uppercase tracking-widest mb-2">
          {mode === 'login' ? 'Welcome Back' : mode === 'forgot' ? 'Password Reset' : 'Create Account'}
        </p>
        <h1
          className="text-4xl font-black text-[#FAFAFA] leading-tight"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          {mode === 'login' && 'SIGN IN'}
          {mode === 'signup' && 'JOIN THE\nPROTOCOL'}
          {mode === 'forgot' && 'RESET\nPASSWORD'}
        </h1>
        {isSignUp && (
          <p className="text-[#A1A1AA] text-sm mt-2">
            Create your account to begin your rank journey.
          </p>
        )}
      </div>

      {/* Email confirmation banner */}
      {needsEmailConfirmation && mode === 'login' && (
        <div className="mb-6 p-4 bg-[#26282B] border border-[#C8FF00]/30 rounded-xl">
          <div className="flex items-start gap-3">
            <Mail size={16} className="text-[#C8FF00] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[#FAFAFA] text-sm font-medium mb-1">Confirm Your Email</p>
              <p className="text-[#A1A1AA] text-xs">
                We sent a link to <span className="text-[#FAFAFA]">{email || 'your email'}</span>.
              </p>
              <button
                onClick={handleResendConfirmation}
                disabled={isResending || !email}
                className="text-[#C8FF00] text-xs mt-2 hover:underline disabled:opacity-50"
              >
                {isResending ? 'Sending...' : 'Resend confirmation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
        <NoirInput
          label="Email Address"
          id="email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoFocus
          required
        />

        {mode !== 'forgot' && (
          <NoirInput
            label="Password"
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            required
            suffix={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
        )}

        {isSignUp && (
          <NoirInput
            label="Confirm Password"
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="••••••••"
            required
            suffix={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
                aria-label="Toggle confirm password"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
        )}

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="p-3 bg-[#C8FF00]/10 border border-[#C8FF00]/30 rounded-xl">
            <p className="text-[#C8FF00] text-sm">{success}</p>
          </div>
        )}

        {/* Forgot password link (login mode) */}
        {mode === 'login' && (
          <div className="text-right">
            <button
              type="button"
              onClick={() => { setMode('forgot'); setError('') }}
              className="text-xs text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
            >
              Forgot password?
            </button>
          </div>
        )}

        <div className="pt-2">
          <LimeButton type="submit" loading={isLoading} data-testid="auth-submit-button">
            {mode === 'login' && 'Sign In'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'forgot' && 'Send Reset Link'}
          </LimeButton>
        </div>
      </form>

      {/* Mode toggle */}
      <div className="mt-6 text-center">
        {mode === 'login' && (
          <button
            onClick={() => { setMode('signup'); setError(''); setSuccess('') }}
            className="text-sm text-[#A1A1AA]"
            data-testid="auth-toggle-mode"
          >
            Don't have an account?{' '}
            <span className="text-[#C8FF00] font-medium">Sign Up</span>
          </button>
        )}
        {mode === 'signup' && (
          <button
            onClick={() => { setMode('login'); setError(''); setSuccess('') }}
            className="text-sm text-[#A1A1AA]"
            data-testid="auth-toggle-mode"
          >
            Already have an account?{' '}
            <span className="text-[#C8FF00] font-medium">Sign In</span>
          </button>
        )}
        {mode === 'forgot' && (
          <button
            onClick={() => { setMode('login'); setError(''); setSuccess('') }}
            className="text-sm text-[#A1A1AA]"
          >
            Back to <span className="text-[#C8FF00] font-medium">Sign In</span>
          </button>
        )}
      </div>

      {/* Privacy */}
      <div className="text-center mt-4">
        <button onClick={() => navigate('/privacy')} className="text-[10px] text-[#A1A1AA]/50">
          Privacy Policy
        </button>
      </div>
    </div>
  )
}
