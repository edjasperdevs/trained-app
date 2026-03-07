import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { Lock, ChevronLeft, Check } from 'lucide-react'
import { useLockedStore, MILESTONES, MILESTONE_DP, ProtocolType } from '@/stores/lockedStore'
import { useDPStore } from '@/stores/dpStore'
import { useUserStore } from '@/stores/userStore'
import { isNative } from '@/lib/platform'
import { ShareCardWrapper } from '@/components/share/ShareCardWrapper'
import { LockedStartShareCard } from '@/components/share/LockedStartShareCard'
import { LockedMilestoneShareCard, MILESTONE_TITLES } from '@/components/share/LockedMilestoneShareCard'
import { shareLockedStartCard, shareLockedMilestoneCard } from '@/lib/shareCard'

const GOAL_OPTIONS = [7, 14, 21, 30, 60, 90]

// Milestone metadata for badges and titles
const MILESTONE_INFO: Record<number, { badge: string; title?: string }> = {
  7: { badge: 'Restrained' },
  14: { badge: 'Controlled' },
  21: { badge: 'Disciplined', title: 'The Disciplined' },
  30: { badge: 'Locked', title: 'Locked by Protocol' },
  60: { badge: 'Locked and Bound', title: 'Locked and Bound' },
  90: { badge: 'Absolute', title: 'Locked. Absolute.' },
}

// Chain-link crown logo component
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

// Geometric padlock icon for hero section
function GeometricPadlock({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 80"
      fill="none"
      className={className}
    >
      {/* Lock shackle */}
      <path
        d="M16 28V20C16 11.16 23.16 4 32 4C40.84 4 48 11.16 48 20V28"
        stroke="#D4A853"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Lock body */}
      <rect
        x="8"
        y="28"
        width="48"
        height="44"
        rx="6"
        fill="#D4A853"
      />
      {/* Keyhole */}
      <circle cx="32" cy="46" r="6" fill="#0A0A0A" />
      <rect x="29" y="46" width="6" height="14" rx="2" fill="#0A0A0A" />
    </svg>
  )
}

// Small padlock for acceptance screen
function SmallPadlock({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 40"
      fill="none"
      className={className}
    >
      {/* Lock shackle */}
      <path
        d="M8 14V10C8 5.58 11.58 2 16 2C20.42 2 24 5.58 24 10V14"
        stroke="#D4A853"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Lock body */}
      <rect
        x="4"
        y="14"
        width="24"
        height="22"
        rx="3"
        fill="#D4A853"
      />
      {/* Keyhole */}
      <circle cx="16" cy="23" r="3" fill="#0A0A0A" />
      <rect x="14.5" y="23" width="3" height="7" rx="1" fill="#0A0A0A" />
    </svg>
  )
}

export function LockedProtocolScreen() {
  const navigate = useNavigate()

  // Store state
  const activeProtocol = useLockedStore((state) => state.activeProtocol)
  const currentStreak = useLockedStore((state) => state.currentStreak)
  const totalDPEarned = useLockedStore((state) => state.totalDPEarned)
  const hasLoggedToday = useLockedStore((state) => state.hasLoggedToday)
  const isLoading = useLockedStore((state) => state.isLoading)
  const milestonesReached = useLockedStore((state) => state.milestonesReached)
  const fetchProtocol = useLockedStore((state) => state.fetchProtocol)
  const startProtocol = useLockedStore((state) => state.startProtocol)
  const logCompliance = useLockedStore((state) => state.logCompliance)
  const endProtocol = useLockedStore((state) => state.endProtocol)

  // User profile and rank info
  const profile = useUserStore((state) => state.profile)
  const rankInfo = useDPStore((state) => state.getRankInfo())
  const callsign = profile?.username || 'RECRUIT'

  // Local state for acceptance flow
  const [protocolType, setProtocolType] = useState<ProtocolType>('continuous')
  const [goalDays, setGoalDays] = useState(30)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSharePrompt, setShowSharePrompt] = useState(false)
  const [milestoneToast, setMilestoneToast] = useState<string | null>(null)
  const [showMilestoneSharePrompt, setShowMilestoneSharePrompt] = useState(false)
  const [milestoneToShare, setMilestoneToShare] = useState<number | null>(null)
  const [isSharing, setIsSharing] = useState(false)

  // Refs for share card capture
  const startCardRef = useRef<HTMLDivElement>(null)
  const milestoneCardRef = useRef<HTMLDivElement>(null)

  // Fetch protocol on mount
  useEffect(() => {
    fetchProtocol()
  }, [fetchProtocol])

  // Calculate next milestone
  const getNextMilestone = () => {
    for (const milestone of MILESTONES) {
      if (currentStreak < milestone) {
        return milestone
      }
    }
    return null
  }

  // Display streak value - show Day 1 if logged today with 0 previous streak
  const displayStreak = hasLoggedToday && currentStreak === 1 ? 1 : currentStreak

  // Haptic feedback helper
  const triggerHaptic = async () => {
    if (isNative()) {
      await Haptics.impact({ style: ImpactStyle.Medium })
    }
  }

  // Handle accept protocol
  const handleAccept = async () => {
    setIsSubmitting(true)
    await triggerHaptic()
    try {
      await startProtocol(protocolType, goalDays)
      setShowSharePrompt(true)
    } catch (error) {
      console.error('Error starting protocol:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle log compliance
  const handleLogCompliance = async () => {
    if (hasLoggedToday || isSubmitting) return
    setIsSubmitting(true)
    await triggerHaptic()
    try {
      const result = await logCompliance()
      if (result.milestoneReached) {
        const info = MILESTONE_INFO[result.milestoneReached]
        setMilestoneToast(`+${MILESTONE_DP[result.milestoneReached]} DP - ${info.badge} milestone reached.`)
        setTimeout(() => {
          setMilestoneToast(null)
          // Show milestone share prompt after toast dismisses
          setMilestoneToShare(result.milestoneReached)
          setShowMilestoneSharePrompt(true)
        }, 3000)
      }
    } catch (error) {
      console.error('Error logging compliance:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle end protocol
  const handleEndProtocol = async () => {
    const confirmed = window.confirm('End your Locked Protocol? Your streak will be reset.')
    if (!confirmed) return
    await triggerHaptic()
    try {
      await endProtocol()
    } catch (error) {
      console.error('Error ending protocol:', error)
    }
  }

  // Handle back navigation
  const handleBack = () => {
    navigate(-1)
  }

  // Handle share after protocol start
  const handleShareStart = async () => {
    if (!startCardRef.current || !activeProtocol || isSharing) return
    setIsSharing(true)
    await triggerHaptic()
    try {
      await shareLockedStartCard(startCardRef.current, activeProtocol.id, activeProtocol.goalDays)
    } finally {
      setIsSharing(false)
      setShowSharePrompt(false)
    }
  }

  // Handle skip share prompt
  const handleSkipShare = () => {
    setShowSharePrompt(false)
  }

  // Handle share after milestone
  const handleShareMilestone = async () => {
    if (!milestoneCardRef.current || !milestoneToShare || isSharing) return
    setIsSharing(true)
    await triggerHaptic()
    try {
      const title = MILESTONE_TITLES[milestoneToShare] || `${milestoneToShare} DAYS LOCKED.`
      await shareLockedMilestoneCard(milestoneCardRef.current, milestoneToShare, title, milestoneToShare)
    } finally {
      setIsSharing(false)
      setShowMilestoneSharePrompt(false)
      setMilestoneToShare(null)
    }
  }

  // Handle skip milestone share
  const handleSkipMilestoneShare = () => {
    setShowMilestoneSharePrompt(false)
    setMilestoneToShare(null)
  }

  // Format start date for share card
  const formatStartDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    return `${months[date.getMonth()]} ${date.getDate()}`
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#D4A853] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Share prompt overlay for protocol start
  if (showSharePrompt && activeProtocol) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6">
        {/* Off-screen share card for capture */}
        <ShareCardWrapper cardRef={startCardRef}>
          <LockedStartShareCard
            callsign={callsign}
            rankName={rankInfo.name}
            goalDays={activeProtocol.goalDays}
            startDate={formatStartDate(activeProtocol.startDate)}
          />
        </ShareCardWrapper>

        <SmallPadlock className="w-16 h-20 mb-6" />
        <h2
          className="text-2xl font-bold text-[#F5F0E8] text-center mb-4"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          Announce your protocol?
        </h2>
        <p className="text-sm text-[#8A8A8A] text-center mb-8">
          Share your commitment with your community.
        </p>
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={handleShareStart}
            disabled={isSharing}
            className={`w-full h-14 rounded-lg bg-[#D4A853] text-[#0A0A0A] font-semibold ${isSharing ? 'opacity-50' : ''}`}
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            {isSharing ? 'SHARING...' : 'SHARE TO STORIES'}
          </button>
          <button
            onClick={handleSkipShare}
            disabled={isSharing}
            className="w-full text-[#8A8A8A] py-3 text-sm"
          >
            Not now
          </button>
        </div>
      </div>
    )
  }

  // Share prompt overlay for milestone
  if (showMilestoneSharePrompt && milestoneToShare) {
    const title = MILESTONE_TITLES[milestoneToShare] || `${milestoneToShare} DAYS LOCKED.`
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6">
        {/* Off-screen share card for capture */}
        <ShareCardWrapper cardRef={milestoneCardRef}>
          <LockedMilestoneShareCard
            daysLocked={milestoneToShare}
            milestoneTitle={title}
            dpEarned={MILESTONE_DP[milestoneToShare] || 0}
            callsign={callsign}
            rankName={rankInfo.name}
          />
        </ShareCardWrapper>

        <SmallPadlock className="w-16 h-20 mb-6" />
        <h2
          className="text-2xl font-bold text-[#F5F0E8] text-center mb-4"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          Share your milestone?
        </h2>
        <p className="text-sm text-[#8A8A8A] text-center mb-8">
          You reached {milestoneToShare} days locked!
        </p>
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={handleShareMilestone}
            disabled={isSharing}
            className={`w-full h-14 rounded-lg bg-[#D4A853] text-[#0A0A0A] font-semibold ${isSharing ? 'opacity-50' : ''}`}
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            {isSharing ? 'SHARING...' : 'SHARE TO STORIES'}
          </button>
          <button
            onClick={handleSkipMilestoneShare}
            disabled={isSharing}
            className="w-full text-[#8A8A8A] py-3 text-sm"
          >
            Not now
          </button>
        </div>
      </div>
    )
  }

  // Acceptance Flow (no active protocol)
  if (!activeProtocol) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center px-6 py-12 overflow-y-auto">
        {/* Chain-link crown logo */}
        <ChainLinkCrownLogo className="w-20 h-20" />

        {/* Gold divider */}
        <div className="w-16 h-px bg-[#D4A853] mt-4 mb-6" />

        {/* Headline */}
        <h1
          className="text-3xl font-bold text-[#F5F0E8] text-center"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Accept the Protocol.
        </h1>

        {/* Protocol Type Selection */}
        <div className="w-full max-w-sm mt-8">
          <p
            className="text-sm text-[#8A8A8A] tracking-widest mb-3"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            HOW DO YOU PRACTICE?
          </p>
          <div className="grid grid-cols-2 gap-3">
            {/* CONTINUOUS */}
            <button
              onClick={() => setProtocolType('continuous')}
              className={`
                p-4 rounded-lg border-2 text-left transition-colors relative
                ${protocolType === 'continuous'
                  ? 'border-[#D4A853] bg-[#1A1A1A]'
                  : 'border-[#26282B] bg-[#1A1A1A]'
                }
              `}
            >
              {protocolType === 'continuous' && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-[#D4A853] rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-[#0A0A0A]" />
                </div>
              )}
              <p
                className="text-lg font-bold text-[#F5F0E8] mb-1"
                style={{ fontFamily: "'Oswald', sans-serif" }}
              >
                CONTINUOUS
              </p>
              <p className="text-xs text-[#8A8A8A]">
                Locked around the clock
              </p>
            </button>

            {/* DAY LOCK */}
            <button
              onClick={() => setProtocolType('day_lock')}
              className={`
                p-4 rounded-lg border-2 text-left transition-colors relative
                ${protocolType === 'day_lock'
                  ? 'border-[#D4A853] bg-[#1A1A1A]'
                  : 'border-[#26282B] bg-[#1A1A1A]'
                }
              `}
            >
              {protocolType === 'day_lock' && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-[#D4A853] rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-[#0A0A0A]" />
                </div>
              )}
              <p
                className="text-lg font-bold text-[#F5F0E8] mb-1"
                style={{ fontFamily: "'Oswald', sans-serif" }}
              >
                DAY LOCK
              </p>
              <p className="text-xs text-[#8A8A8A]">
                Locked during waking hours
              </p>
            </button>
          </div>
        </div>

        {/* Goal Duration Selection */}
        <div className="w-full max-w-sm mt-6">
          <p
            className="text-sm text-[#8A8A8A] tracking-widest mb-3"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            YOUR GOAL
          </p>
          <div className="flex flex-wrap gap-2">
            {GOAL_OPTIONS.map((days) => (
              <button
                key={days}
                onClick={() => setGoalDays(days)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-colors
                  ${goalDays === days
                    ? 'bg-[#D4A853] text-[#0A0A0A]'
                    : 'bg-[#1A1A1A] border border-[#26282B] text-[#F5F0E8]'
                  }
                `}
              >
                {days}
              </button>
            ))}
          </div>
        </div>

        {/* Contract Card */}
        <div className="w-full max-w-sm mt-8 p-6 bg-[#1A1A1A] rounded-lg border border-[#26282B]">
          <p className="text-sm text-[#C9C9C9] leading-relaxed text-center italic">
            By activating the Locked Protocol, you place yourself under the authority of WellTrained.
          </p>
          <p className="text-sm text-[#C9C9C9] leading-relaxed text-center italic mt-3">
            You will log compliance daily.
          </p>
          <p className="text-sm text-[#C9C9C9] leading-relaxed text-center italic mt-3">
            You will not break without consequence.
          </p>
          <p className="text-sm text-[#D4A853] leading-relaxed text-center font-medium mt-4">
            WellTrained accepts the role of keyholder.
          </p>
        </div>

        {/* Padlock icon */}
        <SmallPadlock className="w-10 h-12 mt-6" />

        {/* I ACCEPT button */}
        <button
          onClick={handleAccept}
          disabled={isSubmitting}
          className={`
            w-full max-w-sm h-14 rounded-lg bg-[#D4A853] text-[#0A0A0A] font-bold mt-6
            ${isSubmitting ? 'opacity-50' : ''}
          `}
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          {isSubmitting ? 'ACCEPTING...' : 'I ACCEPT'}
        </button>

        {/* I'm not ready link */}
        <button
          onClick={handleBack}
          className="mt-4 text-[#8A8A8A] text-sm hover:text-[#F5F0E8] transition-colors"
        >
          I'm not ready
        </button>
      </div>
    )
  }

  // Active Protocol View
  const nextMilestone = getNextMilestone()

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col pb-8">
      {/* Milestone toast */}
      {milestoneToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#D4A853] text-[#0A0A0A] rounded-lg font-medium text-sm animate-fade-in">
          {milestoneToast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 pt-safe">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 text-[#F5F0E8]"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1
          className="text-sm font-bold tracking-widest text-[#D4A853]"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          LOCKED PROTOCOL
        </h1>
        <ChainLinkCrownLogo className="w-8 h-8" />
      </div>

      {/* Hero Card */}
      <div className="mx-4 mt-4 p-6 bg-[#1A1A1A] rounded-xl border border-[#26282B] flex flex-col items-center">
        <GeometricPadlock className="w-12 h-16 mb-3" />
        <p
          className="text-5xl font-bold text-[#F5F0E8]"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Day {displayStreak || 1}
        </p>
        <p
          className="text-sm tracking-widest text-[#D4A853] mt-1"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          LOCKED STREAK
        </p>
        <p className="text-xs text-[#8A8A8A] mt-2">
          Locked. Protocol active.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mx-4 mt-4">
        {/* Daily Bonus */}
        <div className="p-4 bg-[#1A1A1A] rounded-lg border border-[#26282B] text-center">
          <p
            className="text-lg font-bold text-[#D4A853]"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            +15 DP/day
          </p>
          <p className="text-xs text-[#8A8A8A] mt-1 tracking-wider">DAILY BONUS</p>
        </div>

        {/* DP Earned */}
        <div className="p-4 bg-[#1A1A1A] rounded-lg border border-[#26282B] text-center">
          <p
            className="text-lg font-bold text-[#F5F0E8]"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            {totalDPEarned} DP
          </p>
          <p className="text-xs text-[#8A8A8A] mt-1 tracking-wider">EARNED</p>
        </div>

        {/* Next Milestone */}
        <div className="p-4 bg-[#1A1A1A] rounded-lg border border-[#26282B] text-center">
          <p
            className="text-lg font-bold text-[#F5F0E8]"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            {nextMilestone ? `Day ${nextMilestone}` : 'COMPLETE'}
          </p>
          <p className="text-xs text-[#8A8A8A] mt-1 tracking-wider">NEXT MILESTONE</p>
        </div>
      </div>

      {/* Milestone Rewards Section */}
      <div className="mx-4 mt-6">
        <p
          className="text-sm tracking-widest text-[#8A8A8A] mb-3"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          MILESTONE REWARDS
        </p>
        <div className="space-y-2">
          {MILESTONES.map((milestone) => {
            const isReached = milestonesReached.includes(milestone)
            const info = MILESTONE_INFO[milestone]
            const dp = MILESTONE_DP[milestone]
            const hasTitle = info.title

            return (
              <div
                key={milestone}
                className={`
                  flex items-center justify-between p-4 rounded-lg border
                  ${isReached
                    ? 'bg-[#1A1A1A] border-[#D4A853]'
                    : 'bg-[#141414] border-[#26282B]'
                  }
                `}
              >
                <div className="flex-1">
                  <p className={`text-sm ${isReached ? 'text-[#F5F0E8]' : 'text-[#8A8A8A]'}`}>
                    {milestone} Days — {dp} DP bonus{hasTitle ? ` + Title: ${info.title}` : ''}
                  </p>
                </div>
                <div className="ml-3">
                  {isReached ? (
                    <Check className="w-5 h-5 text-[#D4A853]" />
                  ) : (
                    <Lock className="w-4 h-4 text-[#8A8A8A]" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1 min-h-6" />

      {/* LOG COMPLIANCE / LOCK UP button */}
      <div className="mx-4 mt-6">
        <button
          onClick={handleLogCompliance}
          disabled={hasLoggedToday || isSubmitting}
          className={`
            w-full h-14 rounded-lg font-bold text-lg transition-colors
            ${hasLoggedToday
              ? 'bg-[#26282B] text-[#8A8A8A] cursor-not-allowed'
              : 'bg-[#D4A853] text-[#0A0A0A]'
            }
          `}
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          {hasLoggedToday
            ? 'Locked in.'
            : activeProtocol.protocolType === 'day_lock'
              ? 'LOCK UP'
              : 'LOG COMPLIANCE'
          }
        </button>
      </div>

      {/* End Protocol link */}
      <button
        onClick={handleEndProtocol}
        className="mt-4 text-[#8A8A8A] text-sm hover:text-[#F5F0E8] transition-colors underline"
      >
        End Protocol
      </button>
    </div>
  )
}
