import { useNavigate } from 'react-router-dom'

export function SignUpScreen() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6">
      <h1 className="text-2xl font-bold text-[#F5F0E8] mb-4">Sign Up</h1>
      <p className="text-[#8A8A8A] text-center mb-8">
        Create your account to start earning Discipline Points.
      </p>
      <div className="space-y-4 w-full max-w-sm">
        <button
          onClick={() => {/* Apple auth - will be wired in Phase 32 */}}
          className="w-full h-14 rounded-full bg-black border border-white text-white font-medium"
        >
          Continue with Apple
        </button>
        <button
          onClick={() => {/* Google auth - will be wired in Phase 32 */}}
          className="w-full h-14 rounded-full bg-[#1A1A1A] border border-[#3A3A3A] text-[#F5F0E8] font-medium"
        >
          Continue with Google
        </button>
        <button
          onClick={() => navigate('/auth/email-signup')}
          className="w-full h-14 rounded-full bg-[#141414] border border-[#D4A853] text-[#F5F0E8] font-medium"
        >
          Continue with Email
        </button>
      </div>
      <p className="mt-8 text-[#8A8A8A] text-sm">
        Already initiated?{' '}
        <button onClick={() => navigate('/auth/signin')} className="text-[#D4A853]">
          Sign In
        </button>
      </p>
    </div>
  )
}
