import { useNavigate } from 'react-router-dom'

export function SignInScreen() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6">
      <h1 className="text-2xl font-bold text-[#F5F0E8] mb-4">Welcome Back</h1>
      <p className="text-[#8A8A8A] text-center mb-8">
        Sign in to continue your protocol.
      </p>
      <div className="space-y-4 w-full max-w-sm">
        <button
          onClick={() => {/* Apple auth - will be wired in Phase 33 */}}
          className="w-full h-14 rounded-full bg-black border border-white text-white font-medium"
        >
          Sign In with Apple
        </button>
        <button
          onClick={() => {/* Google auth - will be wired in Phase 33 */}}
          className="w-full h-14 rounded-full bg-[#1A1A1A] border border-[#3A3A3A] text-[#F5F0E8] font-medium"
        >
          Sign In with Google
        </button>
        <button
          onClick={() => navigate('/auth/email-signin')}
          className="w-full h-14 rounded-full bg-[#141414] border border-[#3A3A3A] text-[#F5F0E8] font-medium"
        >
          Sign In with Email
        </button>
      </div>
      <p className="mt-8 text-[#8A8A8A] text-sm">
        New to WellTrained?{' '}
        <button onClick={() => navigate('/auth/signup')} className="text-[#D4A853]">
          Create Account
        </button>
      </p>
      <button
        onClick={() => navigate('/auth/forgot-password')}
        className="mt-4 text-[#8A8A8A] text-sm"
      >
        Forgot Password?
      </button>
    </div>
  )
}
