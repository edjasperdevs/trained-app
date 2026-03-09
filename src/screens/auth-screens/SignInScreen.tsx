import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import { signInWithApple } from '@/lib/apple-auth'
import { signInWithGoogle } from '@/lib/google-auth'
import { isNative } from '@/lib/platform'

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

// Apple logo icon
function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  )
}

// Google G icon
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

export function SignInScreen() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState<'apple' | 'google' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAppleSignIn = async () => {
    setIsLoading('apple')
    setError(null)

    const { error } = await signInWithApple()

    setIsLoading(null)

    if (error) {
      setError(error)
      return
    }

    // Session created - App.tsx routing will handle navigation
  }

  const handleGoogleSignIn = async () => {
    setIsLoading('google')
    setError(null)

    const { error } = await signInWithGoogle()

    setIsLoading(null)

    if (error) {
      setError(error)
      return
    }

    // Session created - App.tsx routing will handle navigation
  }

  const handleEmailSignIn = () => {
    navigate('/auth/email-signin')
  }

  const handleCreateAccount = () => {
    navigate('/auth/signup')
  }

  const handleForgotPassword = () => {
    navigate('/auth/forgot-password')
  }

  const handleBack = () => {
    navigate(-1)
  }

  const isAnyLoading = isLoading !== null
  const showNativeOnly = !isNative()

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6 pt-safe pb-safe relative">
      {/* Back arrow - top-left absolute */}
      <button
        onClick={handleBack}
        className="absolute top-4 left-4 p-2 text-[#8A8A8A] hover:text-white transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      {/* Chain-link crown logo */}
      <ChainLinkCrownLogo className="w-24 h-24" />

      {/* WELLTRAINED wordmark */}
      <h1
        className="text-3xl font-bold text-[#D4A853] tracking-wide mt-4"
        style={{ fontFamily: "'Oswald', sans-serif" }}
      >
        WELLTRAINED
      </h1>

      {/* Spacer */}
      <div className="mt-12" />

      {/* Headline */}
      <h2
        className="text-2xl font-bold text-[#F5F0E8] tracking-wide text-center"
        style={{ fontFamily: "'Oswald', sans-serif" }}
      >
        WELCOME BACK
      </h2>

      {/* Subline */}
      <p className="text-sm text-[#8A8A8A] text-center mt-2">
        Sign in to continue your protocol.
      </p>

      {/* Error display */}
      {error && (
        <p className="text-sm text-[#EF4444] text-center mt-4 max-w-sm">
          {error}
        </p>
      )}

      {/* Spacer */}
      <div className="mt-8" />

      {/* Auth buttons */}
      <div className="w-full max-w-sm space-y-4">
        {/* Continue with Apple */}
        <button
          onClick={handleAppleSignIn}
          disabled={isAnyLoading || showNativeOnly}
          className={`
            w-full h-14 rounded-full bg-black border border-white text-white font-medium
            flex items-center relative
            ${isAnyLoading || showNativeOnly ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <AppleIcon className="w-5 h-5 absolute left-5" />
          <span className="w-full text-center">
            {isLoading === 'apple' ? 'Signing in...' : 'Continue with Apple'}
          </span>
        </button>

        {/* Continue with Google */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isAnyLoading || showNativeOnly}
          className={`
            w-full h-14 rounded-full bg-[#1A1A1A] border border-[#3A3A3A] text-[#F5F0E8] font-medium
            flex items-center relative
            ${isAnyLoading || showNativeOnly ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <GoogleIcon className="w-5 h-5 absolute left-5" />
          <span className="w-full text-center">
            {isLoading === 'google' ? 'Signing in...' : 'Continue with Google'}
          </span>
        </button>

        {/* Sign In with Email */}
        <button
          onClick={handleEmailSignIn}
          disabled={isAnyLoading}
          className={`
            w-full h-14 rounded-full bg-[#141414] border border-[#D4A853] text-[#F5F0E8] font-medium
            flex items-center relative
            ${isAnyLoading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <Mail className="w-5 h-5 text-[#D4A853] absolute left-5" />
          <span className="w-full text-center">Sign In with Email</span>
        </button>
      </div>

      {/* OR divider */}
      <div className="flex items-center w-full max-w-sm mt-6">
        <div className="flex-1 h-px bg-[#3A3A3A]" />
        <span className="text-[#8A8A8A] text-xs px-4">OR</span>
        <div className="flex-1 h-px bg-[#3A3A3A]" />
      </div>

      {/* Create Account link */}
      <p className="mt-6 text-[#8A8A8A] text-sm">
        New to WellTrained?{' '}
        <button
          onClick={handleCreateAccount}
          className="text-[#D4A853] underline hover:no-underline"
        >
          Create Account
        </button>
      </p>

      {/* Forgot Password link */}
      <button
        onClick={handleForgotPassword}
        className="mt-4 text-[#D4A853] text-sm underline hover:no-underline"
      >
        Forgot Password?
      </button>

      {/* Web fallback notice */}
      {showNativeOnly && (
        <p className="mt-4 text-xs text-[#8A8A8A] text-center">
          Social sign-in available on iOS app
        </p>
      )}
    </div>
  )
}
