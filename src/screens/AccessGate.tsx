/**
 * Access Gate Screen
 *
 * Shown to users who haven't entered a valid access code.
 * Requires ebook purchase to get a code.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button, Card } from '@/components'
import { useAccessStore } from '@/stores/accessStore'
import { Dumbbell, Zap, BookOpen, KeyRound, MessageCircle, PartyPopper, Check } from 'lucide-react'

interface AccessGateProps {
  onAccessGranted: () => void
}

export function AccessGate({ onAccessGranted }: AccessGateProps) {
  const validateCode = useAccessStore((state) => state.validateCode)
  const email = useAccessStore((state) => state.email)

  const [code, setCode] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || isValidating) return

    setIsValidating(true)
    setError(null)

    const result = await validateCode(code)

    setIsValidating(false)

    if (result.success) {
      setShowSuccess(true)
    } else {
      setError(result.error || 'Invalid code')
    }
  }

  const handleContinue = () => {
    onAccessGranted()
  }

  // Format code as user types (keep dashes for Lemon Squeezy format)
  const handleCodeChange = (value: string) => {
    // Allow alphanumeric and dashes (Lemon Squeezy keys are UUID-like with dashes)
    const cleaned = value.replace(/[^A-Za-z0-9-]/g, '').toUpperCase()
    setCode(cleaned)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4">
      {/* Logo/Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="mb-4"
        >
          <Dumbbell size={72} className="mx-auto text-accent-primary" />
        </motion.div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
          Gamify Your Gains
        </h1>
        <p className="text-gray-400 mt-2">
          Turn fitness into a game
        </p>
      </motion.div>

      {/* Access Code Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-md"
      >
        <Card className="bg-bg-secondary">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold mb-2">Enter License Key</h2>
            <p className="text-gray-400 text-sm">
              This app is exclusive to Gamify Your Gains ebook owners.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className={`w-full glass-input rounded-xl px-4 py-3 text-center text-lg font-mono tracking-wider uppercase ${
                  error ? 'border-accent-danger' : ''
                }`}
                maxLength={50}
                autoComplete="off"
                autoFocus
              />
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-accent-danger text-sm mt-2 text-center"
                >
                  {error}
                </motion.p>
              )}
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              disabled={code.length < 6 || isValidating}
            >
              {isValidating ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Zap size={18} />
                  </motion.span>
                  Validating...
                </span>
              ) : (
                'Unlock App'
              )}
            </Button>
          </form>

          {/* Help Section */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="w-full text-center text-sm text-gray-400 hover:text-white transition-colors"
            >
              {showHelp ? 'Hide help' : "Don't have a code?"}
            </button>

            {showHelp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 space-y-4"
              >
                <div className="bg-bg-card rounded-lg p-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <BookOpen size={18} className="text-accent-primary" /> Get the Ebook
                  </h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Purchase the Gamify Your Gains ebook to receive your access code.
                  </p>
                  <a
                    href="https://gamifyyourgains.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-accent-primary text-sm font-medium hover:underline"
                  >
                    Learn more →
                  </a>
                </div>

                <div className="bg-bg-card rounded-lg p-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <KeyRound size={18} className="text-accent-secondary" /> Already Purchased?
                  </h3>
                  <p className="text-sm text-gray-400">
                    Your license key was included in your purchase confirmation email.
                    Check your inbox (and spam folder) for an email from Lemon Squeezy.
                  </p>
                </div>

                <div className="bg-bg-card rounded-lg p-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <MessageCircle size={18} className="text-accent-warning" /> Need Help?
                  </h3>
                  <p className="text-sm text-gray-400">
                    Contact support if you can't find your code or are having issues.
                  </p>
                  <a
                    href="mailto:support@gamifyyourgains.com"
                    className="inline-block text-accent-primary text-sm font-medium hover:underline mt-2"
                  >
                    support@gamifyyourgains.com
                  </a>
                </div>
              </motion.div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-gray-600 text-xs mt-8 text-center"
      >
        © {new Date().getFullYear()} Gamify Your Gains. All rights reserved.
      </motion.p>

      {/* Success Modal */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="w-full max-w-sm"
          >
            <Card className="bg-bg-secondary text-center">
              {/* Celebration Animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5, times: [0, 0.6, 1] }}
                className="mb-4"
              >
                <PartyPopper size={72} className="mx-auto text-accent-success" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold mb-2 bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent"
              >
                Access Granted!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-gray-400 mb-6"
              >
                {email ? (
                  <>Welcome, <span className="text-white font-medium">{email}</span>!</>
                ) : (
                  <>Your license key has been verified.</>
                )}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
              >
                <div className="bg-bg-card rounded-lg p-3 text-sm text-gray-400 flex items-center gap-2">
                  <Check size={16} className="text-accent-primary" /> Full app access unlocked
                </div>
                <div className="bg-bg-card rounded-lg p-3 text-sm text-gray-400 flex items-center gap-2">
                  <Check size={16} className="text-accent-primary" /> Progress syncs to cloud
                </div>
                <div className="bg-bg-card rounded-lg p-3 text-sm text-gray-400 flex items-center gap-2">
                  <Check size={16} className="text-accent-primary" /> All gamification features enabled
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6"
              >
                <Button
                  onClick={handleContinue}
                  fullWidth
                  size="lg"
                >
                  <span className="flex items-center gap-2">
                    Let's Go! <Dumbbell size={18} />
                  </span>
                </Button>
              </motion.div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
