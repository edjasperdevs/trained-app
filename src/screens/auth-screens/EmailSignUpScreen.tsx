import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useReferralStore } from '@/stores'

// Chain-link crown logo component matching v2.2 branding
function ChainLinkCrownLogo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      fill="none"
      className={className}
    >
      {/* Chain Link Circle */}
      <g stroke="#D4A853" strokeWidth="6" strokeLinecap="round" fill="none">
        <ellipse cx="100" cy="20" rx="12" ry="8" transform="rotate(0 100 100)" />
        <ellipse cx="100" cy="20" rx="12" ry="8" transform="rotate(30 100 100)" />
        <ellipse cx="100" cy="20" rx="12" ry="8" transform="rotate(60 100 100)" />
        <ellipse cx="100" cy="20" rx="12" ry="8" transform="rotate(90 100 100)" />
        <ellipse cx="100" cy="20" rx="12" ry="8" transform="rotate(120 100 100)" />
        <ellipse cx="100" cy="20" rx="12" ry="8" transform="rotate(150 100 100)" />
        <ellipse cx="100" cy="20" rx="12" ry="8" transform="rotate(180 100 100)" />
        <ellipse cx="100" cy="20" rx="12" ry="8" transform="rotate(210 100 100)" />
        <ellipse cx="100" cy="20" rx="12" ry="8" transform="rotate(240 100 100)" />
        <ellipse cx="100" cy="20" rx="12" ry="8" transform="rotate(270 100 100)" />
        <ellipse cx="100" cy="20" rx="12" ry="8" transform="rotate(300 100 100)" />
        <ellipse cx="100" cy="20" rx="12" ry="8" transform="rotate(330 100 100)" />
      </g>

      {/* Crown */}
      <g fill="#D4A853" stroke="#D4A853" strokeWidth="2">
        {/* Crown base band */}
        <rect x="55" y="115" width="90" height="20" rx="3" />

        {/* Center prong (tallest) */}
        <path d="M100 50 L90 90 L100 80 L110 90 Z" />

        {/* Left prong */}
        <path d="M72 70 L62 100 L72 92 L82 100 Z" />

        {/* Right prong */}
        <path d="M128 70 L118 100 L128 92 L138 100 Z" />

        {/* Crown body connecting prongs to base */}
        <path d="M55 115 L62 100 L72 92 L82 100 L90 90 L100 80 L110 90 L118 100 L128 92 L138 100 L145 115 Z" />
      </g>
    </svg>
  )
}

// Password strength calculation
function getPasswordStrength(password: string): number {
  let strength = 0
  if (password.length >= 8) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++
  return strength
}

// Password strength indicator component
function PasswordStrengthIndicator({ strength }: { strength: number }) {
  return (
    <div className="flex gap-1 mt-2">
      {[1, 2, 3, 4].map((segment) => (
        <div
          key={segment}
          className={`h-1 flex-1 rounded-full transition-colors ${
            segment <= strength ? 'bg-[#D4A853]' : 'bg-[#3A3A3A]'
          }`}
        />
      ))}
    </div>
  )
}

// Email validation
const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function EmailSignUpScreen() {
  const navigate = useNavigate()

  // Form field states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form validation
  const passwordStrength = getPasswordStrength(password)
  const passwordsMatch = password === confirmPassword && confirmPassword !== ''

  const isFormValid =
    isValidEmail(email) &&
    password.length >= 8 &&
    passwordsMatch

  // Success state for email confirmation
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Handlers
  const handleCreateAccount = async () => {
    if (!isFormValid || isLoading) return

    setIsLoading(true)
    setError(null)

    const { data, error } = await supabase!.auth.signUp({
      email,
      password,
    })

    setIsLoading(false)

    if (error) {
      // Handle specific Supabase auth errors
      if (error.message.includes('already registered')) {
        setError('An account with this email already exists.')
      } else {
        setError(error.message)
      }
      return
    }

    // Check if email confirmation is required (user exists but no session)
    if (data.user && !data.session) {
      // Email confirmation is required
      setShowConfirmation(true)
      return
    }

    // Attribute referral if code was captured (fire-and-forget)
    useReferralStore.getState().attributeReferral()

    // Grant promotional premium if referred (fire-and-forget)
    useReferralStore.getState().grantReferralPremium()

    // Session created - App.tsx routing will handle navigation to onboarding
  }

  const handleBack = () => {
    navigate(-1)
  }

  const handleSignIn = () => {
    navigate('/auth/signin')
  }

  // Show email confirmation screen
  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6 pt-safe pb-safe">
        {/* Chain-link crown logo */}
        <ChainLinkCrownLogo className="w-20 h-20" />

        {/* Headline */}
        <h1
          className="text-2xl font-bold text-[#F5F0E8] tracking-wide mt-6 text-center"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          CHECK YOUR EMAIL
        </h1>

        {/* Subline */}
        <p className="text-sm text-[#8A8A8A] text-center mt-4 max-w-xs">
          We sent a confirmation link to <span className="text-[#D4A853]">{email}</span>.
          Click the link to activate your account.
        </p>

        {/* Icon */}
        <div className="mt-8 w-16 h-16 rounded-full bg-[#141414] border border-[#D4A853] flex items-center justify-center">
          <Mail className="w-8 h-8 text-[#D4A853]" />
        </div>

        {/* Note */}
        <p className="text-xs text-[#8A8A8A] text-center mt-8 max-w-xs">
          Didn't receive it? Check your spam folder or try again.
        </p>

        {/* Back to Sign In */}
        <button
          onClick={handleSignIn}
          className="mt-6 text-[#D4A853] text-sm underline hover:no-underline"
        >
          Back to Sign In
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center px-6 pt-safe pb-safe relative">
      {/* Back arrow - top-left absolute */}
      <button
        onClick={handleBack}
        className="absolute left-4 p-2 text-[#8A8A8A] hover:text-white transition-colors"
        style={{ top: 'calc(env(safe-area-inset-top) + 1rem)' }}
        aria-label="Go back"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      {/* Spacer for top content */}
      <div className="mt-16" />

      {/* Chain-link crown logo */}
      <ChainLinkCrownLogo className="w-16 h-16" />

      {/* Headline */}
      <h1
        className="text-2xl font-bold text-[#F5F0E8] tracking-wide mt-6 text-center"
        style={{ fontFamily: "'Oswald', sans-serif" }}
      >
        CREATE YOUR ACCOUNT
      </h1>

      {/* Subline */}
      <p className="text-sm text-[#8A8A8A] text-center mt-2">
        Enter your details to begin.
      </p>

      {/* Spacer */}
      <div className="mt-8" />

      {/* Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleCreateAccount()
        }}
        className="w-full max-w-sm"
      >
        {/* Form fields container */}
        <div className="space-y-4">
          {/* Email field */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#8A8A8A] mb-2">
              EMAIL
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-[#D4A853] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoCapitalize="none"
                autoComplete="email"
                className="bg-[#141414] rounded-xl border border-[#3A3A3A] h-14 px-4 pl-12 w-full text-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-[#D4A853] focus:ring-opacity-50 placeholder:text-[#8A8A8A]"
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#8A8A8A] mb-2">
              PASSWORD
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-[#D4A853] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                autoComplete="new-password"
                className="bg-[#141414] rounded-xl border border-[#3A3A3A] h-14 px-4 pl-12 pr-12 w-full text-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-[#D4A853] focus:ring-opacity-50 placeholder:text-[#8A8A8A]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A8A8A] hover:text-white transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {/* Password strength indicator */}
            <PasswordStrengthIndicator strength={passwordStrength} />
          </div>

          {/* Confirm Password field */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#8A8A8A] mb-2">
              CONFIRM PASSWORD
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-[#D4A853] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                id="signup-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                autoComplete="new-password"
                className="bg-[#141414] rounded-xl border border-[#3A3A3A] h-14 px-4 pl-12 pr-12 w-full text-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-[#D4A853] focus:ring-opacity-50 placeholder:text-[#8A8A8A]"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A8A8A] hover:text-white transition-colors"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <p className="text-sm text-[#EF4444] text-center mt-4">
            {error}
          </p>
        )}

        {/* Spacer */}
        <div className="mt-6" />

        {/* CREATE ACCOUNT button */}
        <button
          type="submit"
          disabled={!isFormValid || isLoading}
          className={`
            w-full h-14 rounded-full bg-[#D4A853] text-black font-bold
            tracking-widest uppercase text-base
            ${(!isFormValid || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          {isLoading ? 'Creating Account...' : 'CREATE ACCOUNT'}
        </button>
      </form>

      {/* Sign In link */}
      <p className="mt-6 text-[#8A8A8A] text-sm text-center">
        Already initiated?{' '}
        <button
          onClick={handleSignIn}
          className="text-[#D4A853] underline hover:no-underline"
        >
          Sign In
        </button>
      </p>

      {/* Legal copy */}
      <p className="mt-6 text-xs text-[#8A8A8A] text-center max-w-xs">
        By continuing you agree to our{' '}
        <a href="/terms" className="text-[#D4A853] hover:underline">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="/privacy" className="text-[#D4A853] hover:underline">
          Privacy Policy
        </a>
      </p>
    </div>
  )
}
