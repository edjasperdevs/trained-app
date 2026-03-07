import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Share } from '@capacitor/share'
import { AppHeader } from '@/components'
import { useReferralStore, toast, type Recruit } from '@/stores'
import { RANKS } from '@/stores/dpStore'
import { isNative } from '@/lib/platform'
import { Copy, Instagram, Twitter, MessageCircle, ChevronLeft, Users, User } from 'lucide-react'

/**
 * Get rank name from rank number using RANKS table
 */
function getRankName(rank: number): string {
  const rankEntry = RANKS.find(r => r.rank === rank)
  return rankEntry?.name || 'Uninitiated'
}

/**
 * RecruitCard - displays individual recruit information
 */
function RecruitCard({ recruit }: { recruit: Recruit }) {
  const rankName = getRankName(recruit.rank)
  const isCompleted = recruit.status === 'completed'
  const displayName = recruit.callsign || 'Anonymous'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="bg-[#1A1A1A] border border-[#C9A84C]/30 rounded-lg p-4 flex items-center gap-4">
      {/* Avatar placeholder */}
      <div className="w-12 h-12 rounded-full bg-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
        {recruit.callsign ? (
          <span className="font-oswald text-sm font-semibold text-[#C9A84C]">
            {initials}
          </span>
        ) : (
          <User size={20} className="text-[#C9A84C]" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate">{displayName}</p>
        <p className="text-sm text-zinc-400">{rankName}</p>
      </div>

      {/* Status and DP */}
      <div className="text-right flex-shrink-0">
        <span
          className={`text-xs font-medium px-2 py-1 rounded ${
            isCompleted
              ? 'bg-[#C9A84C]/20 text-[#C9A84C]'
              : 'bg-zinc-800 text-zinc-400'
          }`}
        >
          {isCompleted ? 'Completed' : 'Pending'}
        </span>
        <p
          className={`text-sm font-semibold mt-1 ${
            isCompleted ? 'text-[#C9A84C]' : 'text-zinc-500'
          }`}
        >
          {isCompleted ? '+100 DP' : '+0 DP'}
        </p>
      </div>
    </div>
  )
}

/**
 * Loading skeleton for the screen
 */
function RecruitScreenSkeleton() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <AppHeader />
      <div className="px-6 py-8 space-y-6">
        {/* Header skeleton */}
        <div className="h-8 bg-zinc-800 rounded w-48 animate-pulse" />
        <div className="h-4 bg-zinc-800 rounded w-64 animate-pulse" />

        {/* Link card skeleton */}
        <div className="bg-[#1A1A1A] border border-[#C9A84C]/30 rounded-lg p-6">
          <div className="h-6 bg-zinc-800 rounded w-full animate-pulse mb-4" />
          <div className="h-12 bg-zinc-800 rounded w-full animate-pulse" />
        </div>

        {/* Share buttons skeleton */}
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 h-12 bg-zinc-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * RecruitScreen - Recruit a Sub screen with referral link display,
 * copy/share functionality, and recruits list.
 */
export function RecruitScreen() {
  const navigate = useNavigate()
  const referralCode = useReferralStore((state) => state.referralCode)
  const recruits = useReferralStore((state) => state.recruits)
  const isLoading = useReferralStore((state) => state.isLoading)
  const fetchReferralCode = useReferralStore((state) => state.fetchReferralCode)
  const fetchRecruits = useReferralStore((state) => state.fetchRecruits)
  const getReferralLink = useReferralStore((state) => state.getReferralLink)

  const [initialized, setInitialized] = useState(false)

  // Fetch code and recruits on mount
  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchReferralCode(), fetchRecruits()])
      setInitialized(true)
    }
    init()
  }, [fetchReferralCode, fetchRecruits])

  // Display link (short format for UI)
  const displayLink = referralCode
    ? `app.welltrained.fitness/join/${referralCode}`
    : ''
  const fullLink = getReferralLink()
  const shareText = `Join me on WellTrained - the fitness app that trains you like a champion. Use my link: ${fullLink}`

  const handleCopyLink = async () => {
    if (!fullLink) return
    try {
      await navigator.clipboard.writeText(fullLink)
      toast.success('Link copied!')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const handleShare = async (platform: 'instagram' | 'twitter' | 'messages') => {
    if (!fullLink) return

    if (isNative()) {
      // Use native share sheet
      try {
        await Share.share({
          title: 'Join WellTrained',
          text: shareText,
          url: fullLink,
          dialogTitle: 'Share your referral link',
        })
      } catch {
        // User cancelled or error - silent fail
      }
    } else {
      // Web fallback: open platform-specific share URLs
      let url = ''
      const encodedText = encodeURIComponent(shareText)

      switch (platform) {
        case 'instagram':
          // Instagram doesn't have a direct share URL, copy to clipboard and show message
          await navigator.clipboard.writeText(shareText)
          toast.success('Text copied! Paste in Instagram')
          return
        case 'twitter':
          url = `https://twitter.com/intent/tweet?text=${encodedText}`
          break
        case 'messages':
          // SMS URL scheme
          url = `sms:?body=${encodedText}`
          break
      }

      if (url) {
        window.open(url, '_blank')
      }
    }
  }

  // Show skeleton while initializing
  if (!initialized || (isLoading && !referralCode)) {
    return <RecruitScreenSkeleton />
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24">
      <AppHeader />

      <div className="px-6 py-4">
        {/* Back button and title */}
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="font-oswald text-xl font-semibold uppercase tracking-[0.15em] text-[#C9A84C]">
            Recruit a Sub
          </h1>
        </div>
        <p className="text-sm text-zinc-400 mb-8 ml-9">
          Share your referral link to recruit new members
        </p>

        {/* Referral Link Card */}
        <div className="bg-[#1A1A1A] border border-[#C9A84C]/30 rounded-lg p-6 mb-6">
          <p className="text-xs uppercase tracking-wider text-zinc-400 mb-3">
            Your Referral Link
          </p>
          <p className="font-jetbrains text-[#C9A84C] text-lg mb-4 break-all select-all">
            {displayLink}
          </p>
          <button
            onClick={handleCopyLink}
            className="w-full bg-[#C9A84C] text-[#0A0A0A] font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:bg-[#D4A853] transition-colors"
          >
            <Copy size={18} />
            Copy Link
          </button>
        </div>

        {/* Share Buttons Row */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => handleShare('instagram')}
            className="flex-1 border border-[#C9A84C]/50 text-[#C9A84C] py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-[#C9A84C]/10 transition-colors"
          >
            <Instagram size={20} />
            <span className="text-sm font-medium">Instagram</span>
          </button>
          <button
            onClick={() => handleShare('twitter')}
            className="flex-1 border border-[#C9A84C]/50 text-[#C9A84C] py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-[#C9A84C]/10 transition-colors"
          >
            <Twitter size={20} />
            <span className="text-sm font-medium">X</span>
          </button>
          <button
            onClick={() => handleShare('messages')}
            className="flex-1 border border-[#C9A84C]/50 text-[#C9A84C] py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-[#C9A84C]/10 transition-colors"
          >
            <MessageCircle size={20} />
            <span className="text-sm font-medium">Messages</span>
          </button>
        </div>

        {/* Recruits Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-[#C9A84C]" />
            <h2 className="font-oswald text-lg font-semibold uppercase tracking-wider text-[#C9A84C]">
              Your Recruits
            </h2>
            {recruits.length > 0 && (
              <span className="bg-[#C9A84C]/20 text-[#C9A84C] text-xs font-semibold px-2 py-0.5 rounded">
                {recruits.length}
              </span>
            )}
          </div>

          {recruits.length === 0 ? (
            <div className="bg-[#1A1A1A] border border-[#C9A84C]/30 rounded-lg p-8 text-center">
              <Users size={40} className="text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400">No recruits yet.</p>
              <p className="text-sm text-zinc-500 mt-1">
                Share your link to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recruits.map((recruit) => (
                <RecruitCard key={recruit.id} recruit={recruit} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
