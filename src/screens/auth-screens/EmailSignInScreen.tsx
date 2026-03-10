import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/stores'

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

// Email validation
const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function EmailSignInScreen() {
  const navigate = useNavigate()
  const signIn = useAuthStore((state) => state.signIn)

  // Form field states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false)

  // Loading and error state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form validation
  const isFormValid = isValidEmail(email) && password.length > 0

  // Back button handler
  const handleBack = () => {
    navigate(-1)
  }

  // Forgot Password navigation
  const handleForgotPassword = () => {
    navigate('/auth/forgot-password')
  }

  // Create Account navigation
  const handleCreateAccount = () => {
    navigate('/auth/signup')
  }

  // Sign In handler
  const handleSignIn = async () => {
    if (!isFormValid || isLoading) return

    setIsLoading(true)
    setError(null)

    const { error } = await signIn(email, password)

    setIsLoading(false)

    if (error) {
      setError(error)
      return
    }

    // Session created - App.tsx routing will handle navigation to main app
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
        WELCOME BACK
      </h1>

      {/* Subline */}
      <p className="text-sm text-[#8A8A8A] text-center mt-2">
        Sign in with your email and password.
      </p>

      {/* Spacer */}
      <div className="mt-8" />

      {/* Form fields container */}
      <div className="w-full max-w-sm space-y-4">
        {/* Email field */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-[#8A8A8A] mb-2">
            EMAIL
          </label>
          <div className="relative">
            <Mail className="w-5 h-5 text-[#D4A853] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
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
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
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
          {/* Error display */}
          {error && (
            <p className="text-sm text-[#EF4444] text-left mt-2 max-w-sm">
              {error}
            </p>
          )}
          {/* Forgot Password link */}
          <div className="mt-2 text-right">
            <button
              onClick={handleForgotPassword}
              className="text-sm text-[#D4A853] underline hover:no-underline"
            >
              Forgot Password?
            </button>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="mt-6" />

      {/* SIGN IN button */}
      <button
        onClick={handleSignIn}
        disabled={!isFormValid || isLoading}
        className={`
          w-full max-w-sm h-14 rounded-full bg-[#D4A853] text-black font-bold
          tracking-widest uppercase text-base
          ${(!isFormValid || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        style={{ fontFamily: "'Oswald', sans-serif" }}
      >
        {isLoading ? 'Signing In...' : 'SIGN IN'}
      </button>

      {/* Create Account link */}
      <p className="mt-6 text-[#8A8A8A] text-sm text-center">
        New to WellTrained?{' '}
        <button
          onClick={handleCreateAccount}
          className="text-[#D4A853] underline hover:no-underline"
        >
          Create Account
        </button>
      </p>
    </div>
  )
}
