import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../hooks/useAuth'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { signIn, user } = useAuth()
  const navigate = useNavigate()

  // Already authenticated — redirect to dashboard
  if (user) {
    navigate('/coach', { replace: true })
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const { error: signInError } = await signIn(email, password)

    if (signInError) {
      setError('Invalid email or password')
      setSubmitting(false)
    } else {
      navigate('/coach', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-trained-black flex items-center justify-center">
      <div className="max-w-md w-full mx-4 p-8">
        {/* Branding */}
        <div className="text-2xl mb-2">
          <span className="text-trained-text font-black tracking-widest">WELL</span>
          <span className="text-trained-red font-black tracking-widest">TRAINED</span>
        </div>
        <div className="text-trained-text-dim text-sm tracking-wider uppercase mt-2">
          Coach Dashboard
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 mt-8">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-trained-text mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-trained-black border border-trained-text/20 text-trained-text rounded focus:outline-none focus:border-trained-red transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-trained-text mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-trained-black border border-trained-text/20 text-trained-text rounded focus:outline-none focus:border-trained-red transition-colors"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="text-trained-red text-sm">
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-trained-red text-white font-bold py-3 rounded tracking-wider uppercase disabled:opacity-50 transition-opacity"
          >
            {submitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
