import { useState, useEffect, useCallback } from 'react'
import { motion, type Variants } from 'framer-motion'
import { ChevronLeft, Check, X, Loader2 } from 'lucide-react'
import { useOnboardingStore } from '@/stores'
import { ProgressIndicator } from '@/components/onboarding'
import { WTLogo } from '@/components'
import { supabase } from '@/lib/supabase'
import { useDebounce } from '@/hooks/useDebounce'

// Username validation rules (social media safe)
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/
const MIN_LENGTH = 3
const MAX_LENGTH = 20

type ValidationState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

function validateUsernameFormat(username: string): string | null {
  if (username.length === 0) return null
  if (username.length < MIN_LENGTH) return `Must be at least ${MIN_LENGTH} characters`
  if (username.length > MAX_LENGTH) return `Must be ${MAX_LENGTH} characters or less`
  if (!USERNAME_REGEX.test(username)) return 'Only letters, numbers, and underscores'
  if (username.startsWith('_') || username.endsWith('_')) return 'Cannot start or end with underscore'
  if (username.includes('__')) return 'Cannot have consecutive underscores'
  return null
}

async function checkUsernameAvailability(username: string): Promise<boolean> {
  const { data, error } = await supabase!
    .from('profiles')
    .select('id')
    .ilike('username', username)
    .limit(1)

  if (error) {
    console.error('Error checking username:', error)
    return false
  }

  return data.length === 0
}

export function UsernameScreen() {
  const { nextStep, prevStep, updateData, data } = useOnboardingStore()

  const [username, setUsername] = useState(data.username || '')
  const [validationState, setValidationState] = useState<ValidationState>('idle')
  const [formatError, setFormatError] = useState<string | null>(null)

  const debouncedUsername = useDebounce(username, 400)

  // Check availability when debounced username changes
  useEffect(() => {
    const checkAvailability = async () => {
      // Skip if empty or has format error
      const error = validateUsernameFormat(debouncedUsername)
      if (error || debouncedUsername.length === 0) {
        setFormatError(error)
        setValidationState(error ? 'invalid' : 'idle')
        return
      }

      setFormatError(null)
      setValidationState('checking')

      const isAvailable = await checkUsernameAvailability(debouncedUsername)
      setValidationState(isAvailable ? 'available' : 'taken')
    }

    checkAvailability()
  }, [debouncedUsername])

  const handleUsernameChange = useCallback((value: string) => {
    // Convert to lowercase and remove spaces
    const sanitized = value.toLowerCase().replace(/\s/g, '')
    setUsername(sanitized)

    // Immediate format validation feedback
    const error = validateUsernameFormat(sanitized)
    if (error) {
      setFormatError(error)
      setValidationState('invalid')
    } else if (sanitized.length > 0) {
      setValidationState('checking')
    } else {
      setValidationState('idle')
    }
  }, [])

  const canContinue = validationState === 'available'

  const handleContinue = () => {
    if (!canContinue) return
    updateData({ username })
    nextStep()
  }

  // Animation variants
  const fadeInVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3, ease: [0, 0, 0.2, 1] },
    },
  }

  const headlineVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0, 0, 0.2, 1] },
    },
  }

  const formVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: 0.3, duration: 0.3, ease: [0, 0, 0.2, 1] },
    },
  }

  // Get status icon and color
  const getStatusDisplay = () => {
    switch (validationState) {
      case 'checking':
        return <Loader2 className="w-5 h-5 text-[#D4A853] animate-spin" />
      case 'available':
        return <Check className="w-5 h-5 text-green-500" />
      case 'taken':
        return <X className="w-5 h-5 text-red-500" />
      case 'invalid':
        return <X className="w-5 h-5 text-red-500" />
      default:
        return null
    }
  }

  const getStatusMessage = () => {
    if (formatError) return formatError
    switch (validationState) {
      case 'checking':
        return 'Checking availability...'
      case 'available':
        return 'Username is available!'
      case 'taken':
        return 'Username is already taken'
      default:
        return null
    }
  }

  const getStatusColor = () => {
    switch (validationState) {
      case 'available':
        return 'text-green-500'
      case 'taken':
      case 'invalid':
        return 'text-red-500'
      default:
        return 'text-[#71717A]'
    }
  }

  const getBorderColor = () => {
    switch (validationState) {
      case 'available':
        return 'border-green-500'
      case 'taken':
      case 'invalid':
        return 'border-red-500'
      case 'checking':
        return 'border-[#D4A853]'
      default:
        return 'border-[#2A2A2A]'
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col px-6 pb-8">
      {/* Header with back button and progress */}
      <motion.div
        className="flex items-center justify-between mb-8"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
      >
        <button
          onClick={prevStep}
          className="w-10 h-10 flex items-center justify-center text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <ProgressIndicator totalSteps={8} currentStep={3} />
        <div className="w-10" />
      </motion.div>

      {/* YOUR IDENTITY label */}
      <motion.p
        className="text-[#D4A853] text-xs tracking-[0.2em] uppercase text-center mb-4"
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
      >
        YOUR IDENTITY
      </motion.p>

      {/* Main headline */}
      <motion.h1
        className="text-3xl md:text-4xl font-black text-[#FAFAFA] text-center leading-tight mb-4"
        style={{ fontFamily: "'Oswald', sans-serif" }}
        initial="hidden"
        animate="visible"
        variants={headlineVariants}
      >
        CHOOSE YOUR USERNAME
      </motion.h1>

      {/* Subheadline */}
      <motion.p
        className="text-[#71717A] text-center text-sm mb-8"
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
      >
        This is how others will find you
      </motion.p>

      {/* Username input */}
      <motion.div
        className="flex-1"
        initial="hidden"
        animate="visible"
        variants={formVariants}
      >
        <label className="block text-[#FAFAFA] text-sm font-medium mb-2">
          Username
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71717A]">
            @
          </span>
          <input
            type="text"
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            placeholder="your_username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={MAX_LENGTH}
            className={`w-full pl-10 pr-12 py-3 bg-[#26282B] border ${getBorderColor()} rounded-lg text-[#FAFAFA] placeholder-[#71717A] focus:outline-none transition-colors`}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {getStatusDisplay()}
          </div>
        </div>

        {/* Status message */}
        {getStatusMessage() && (
          <p className={`mt-2 text-sm ${getStatusColor()}`}>
            {getStatusMessage()}
          </p>
        )}

        {/* Character count */}
        <p className="mt-2 text-xs text-[#71717A] text-right">
          {username.length}/{MAX_LENGTH}
        </p>

        {/* Helper text */}
        <div className="mt-6 p-4 bg-[#26282B]/50 rounded-lg">
          <p className="text-xs text-[#71717A]">
            Your username must be:
          </p>
          <ul className="mt-2 text-xs text-[#71717A] space-y-1">
            <li className={username.length >= MIN_LENGTH ? 'text-green-500' : ''}>
              • {MIN_LENGTH}-{MAX_LENGTH} characters
            </li>
            <li className={username.length > 0 && USERNAME_REGEX.test(username) ? 'text-green-500' : ''}>
              • Letters, numbers, and underscores only
            </li>
            <li className={username.length > 0 && !username.startsWith('_') && !username.endsWith('_') ? 'text-green-500' : ''}>
              • Cannot start or end with underscore
            </li>
          </ul>
        </div>
      </motion.div>

      {/* Logo watermark - centered in remaining space */}
      <motion.div
        className="flex-1 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <WTLogo className="w-24 h-auto" />
      </motion.div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.3, ease: [0, 0, 0.2, 1] }}
      >
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className={`w-full py-4 bg-[#D4A853] text-[#0A0A0A] font-bold text-lg tracking-wider rounded-lg transition-opacity ${
            !canContinue ? 'opacity-50 pointer-events-none' : ''
          }`}
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          CONTINUE
        </button>
      </motion.div>
    </div>
  )
}
