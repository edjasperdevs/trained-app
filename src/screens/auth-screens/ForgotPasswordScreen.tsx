import { useNavigate } from 'react-router-dom'
import { ChevronLeft, KeyRound } from 'lucide-react'

export function ForgotPasswordScreen() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col px-6 pt-12">
      <button
        onClick={() => navigate('/auth/email-signin')}
        className="flex items-center text-[#8A8A8A] mb-8"
      >
        <ChevronLeft size={20} />
        <span>Back</span>
      </button>
      <div className="flex flex-col items-center">
        <KeyRound size={64} className="text-[#D4A853] mb-6" />
        <h1 className="text-2xl font-bold text-[#F5F0E8] mb-4">Reset Password</h1>
        <p className="text-[#8A8A8A] text-center mb-8">
          Enter your email and we will send you a reset link.
        </p>
      </div>
      {/* Form field will be added in Phase 36 */}
      <div className="text-center text-[#8A8A8A] py-12">
        Forgot Password Form Placeholder
      </div>
      <p className="mt-auto pb-8 text-center text-[#8A8A8A] text-sm">
        Remember your password?{' '}
        <button onClick={() => navigate('/auth/signin')} className="text-[#D4A853]">
          Sign In
        </button>
      </p>
    </div>
  )
}
