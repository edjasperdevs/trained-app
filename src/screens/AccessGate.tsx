/**
 * Access Gate Screen
 *
 * Shown to users who haven't entered a valid access code.
 * Requires ebook purchase to get a code.
 */

import { useState } from 'react'
import { motion } from 'motion/react'
import { useAccessStore } from '@/stores/accessStore'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Zap, BookOpen, KeyRound, MessageCircle, Check, Shield } from 'lucide-react'

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
    <div className="min-h-screen flex flex-col items-center justify-center p-5">
      {/* Logo/Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="mb-4">
          <Shield size={72} className="mx-auto text-primary" />
        </div>
        <h1 className="text-3xl font-bold">
          Trained
        </h1>
        <p className="text-muted-foreground mt-2">
          The protocol for building discipline
        </p>
      </motion.div>

      {/* Access Code Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Enter Access Code</CardTitle>
            <CardDescription>
              This app is exclusive to Trained ebook owners.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="text"
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  aria-label="License key"
                  className={cn(
                    'text-center text-lg font-mono tracking-wider uppercase h-12',
                    error && 'border-destructive'
                  )}
                  maxLength={50}
                  autoComplete="off"
                  autoFocus
                />
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2"
                  >
                    <Alert variant="destructive">
                      <AlertDescription className="text-center">{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
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
            <Separator className="my-6" />
            <div>
              <button
                onClick={() => setShowHelp(!showHelp)}
                aria-expanded={showHelp}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {showHelp ? 'Hide help' : "Don't have a code?"}
              </button>

              {showHelp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 space-y-3"
                >
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                      <BookOpen size={18} className="text-primary" /> Get the Ebook
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Purchase the Trained ebook to receive your access code.
                    </p>
                    <a
                      href="https://trained.fitness"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-primary text-sm font-medium hover:underline"
                    >
                      Learn more →
                    </a>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                      <KeyRound size={18} className="text-muted-foreground" /> Already Purchased?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Your access code was included in your purchase confirmation email. Check your inbox (and spam folder) for an email from Lemon Squeezy.
                    </p>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                      <MessageCircle size={18} className="text-warning" /> Need Help?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Contact support if you can't find your code or are having issues.
                    </p>
                    <a
                      href="mailto:support@trained.fitness"
                      className="inline-block text-primary text-sm font-medium hover:underline mt-2"
                    >
                      support@trained.fitness
                    </a>
                  </div>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-muted-foreground/50 text-xs mt-8 text-center"
      >
        © {new Date().getFullYear()} Trained. All rights reserved.
      </motion.p>

      {/* Success Modal */}
      {showSuccess && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Access granted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-sm"
          >
            <Card>
              <CardContent className="text-center">
                {/* Celebration Animation */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, times: [0, 0.6, 1] }}
                  className="mb-4"
                >
                  <Shield size={72} className="mx-auto text-primary" />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold mb-2 font-heading"
                >
                  Access Granted.
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-muted-foreground mb-6"
                >
                  {email ? (
                    <>Welcome, <span className="text-foreground font-medium">{email}</span>.</>
                  ) : (
                    <>Your access code has been verified.</>
                  )}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-3"
                >
                  <div className="bg-muted p-3 text-sm text-muted-foreground flex items-center gap-2 rounded-lg">
                    <Check size={16} className="text-primary" /> Full protocol access unlocked
                  </div>
                  <div className="bg-muted p-3 text-sm text-muted-foreground flex items-center gap-2 rounded-lg">
                    <Check size={16} className="text-primary" /> Progress syncs to cloud
                  </div>
                  <div className="bg-muted p-3 text-sm text-muted-foreground flex items-center gap-2 rounded-lg">
                    <Check size={16} className="text-primary" /> All protocol features enabled
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
                    className="w-full"
                    size="lg"
                  >
                    <span className="flex items-center gap-2">
                      Begin <Shield size={18} />
                    </span>
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
