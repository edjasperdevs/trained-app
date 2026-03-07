import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export function EmailSignInScreen() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col px-6 pt-12">
      <button
        onClick={() => navigate('/auth/signin')}
        className="flex items-center text-[#8A8A8A] mb-8"
      >
        <ChevronLeft size={20} />
        <span>Back</span>
      </button>
      <h1 className="text-2xl font-bold text-[#F5F0E8] mb-4">Sign In</h1>
      <p className="text-[#8A8A8A] mb-8">
        Enter your email and password.
      </p>
      {/* Form fields will be added in Phase 35 */}
      <div className="text-center text-[#8A8A8A] py-12">
        Email Sign In Form Placeholder
      </div>
      <button
        onClick={() => navigate('/auth/forgot-password')}
        className="text-[#D4A853] text-sm mb-8"
      >
        Forgot Password?
      </button>
      <p className="mt-auto pb-8 text-center text-[#8A8A8A] text-sm">
        New to WellTrained?{' '}
        <button onClick={() => navigate('/auth/signup')} className="text-[#D4A853]">
          Create Account
        </button>
      </p>
    </div>
  )
}
