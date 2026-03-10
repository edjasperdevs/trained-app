import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { EvolvingAvatar } from '@/components/EvolvingAvatar'
import { useUserStore } from '@/stores'
import { RANKS } from '@/stores/dpStore'

export function FinalScreen() {
  const completeOnboarding = useUserStore((s) => s.completeOnboarding)
  const navigate = useNavigate()
  const [shouldPulse, setShouldPulse] = useState(false)

  // Trigger CTA pulse after 1 second (FINAL-06)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldPulse(true)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // Handle enter button tap (FINAL-07, FINAL-08)
  const handleEnter = async () => {
    // Mark profile as onboarding complete
    await completeOnboarding()

    // Navigate to home to trigger App.tsx routing check
    navigate('/', { replace: true })
  }

  // Get threshold for first rank (Initiate = 250 DP)
  const initiateThreshold = RANKS[1].threshold

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Subtle radial gradient glow at center (gold tint) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(212,168,83,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="flex flex-col items-center z-10 w-full max-w-md">
        {/* Header section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
          className="text-center mb-8"
        >
          <p className="text-[#D4A853] text-xs tracking-[0.2em] uppercase mb-2">
            WELCOME TO
          </p>
          <h1
            className="text-3xl font-black text-white uppercase tracking-tight"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            THE PROTOCOL
          </h1>
        </motion.div>

        {/* Avatar section (FINAL-02) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
          className="mb-8"
        >
          <EvolvingAvatar size="xl" showLocked={false} />
        </motion.div>

        {/* Rank card (FINAL-03, FINAL-04, FINAL-05) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0, 0, 0.2, 1] }}
          className="w-full bg-[#26282B] rounded-xl border border-[#D4A853] p-6 mb-8"
        >
          {/* Rank name */}
          <p
            className="text-center text-white text-xl font-black uppercase tracking-wider mb-4"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            UNINITIATED
          </p>

          {/* Progress bar at 0% */}
          <div className="w-full h-2 bg-[#1A1A1A] rounded-full mb-3 overflow-hidden">
            <div
              className="h-full bg-[#D4A853] rounded-full"
              style={{ width: '0%' }}
            />
          </div>

          {/* DP progress text */}
          <p className="text-center text-[#A1A1AA] text-xs tracking-wider">
            0 of {initiateThreshold} DP to Initiate
          </p>
        </motion.div>

        {/* CTA button (FINAL-06) */}
        <motion.button
          onClick={handleEnter}
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: shouldPulse ? [1, 1.02, 1] : 1,
          }}
          transition={{
            opacity: { duration: 0.4, delay: 0.4 },
            y: { duration: 0.4, delay: 0.4 },
            scale: { duration: 0.3, ease: [0, 0, 0.2, 1] },
          }}
          className="w-full py-4 bg-[#D4A853] text-[#0A0A0A] font-bold text-lg tracking-wider rounded-lg"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          ENTER THE DISCIPLINE
        </motion.button>
      </div>
    </div>
  )
}
