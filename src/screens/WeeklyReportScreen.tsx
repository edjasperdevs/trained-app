import { useEffect, useState, useRef } from 'react'
import { useWeeklyReportStore } from '@/stores/weeklyReportStore'
import { useDPStore } from '@/stores/dpStore'
import { useUserStore } from '@/stores/userStore'
import { useLockedStore } from '@/stores/lockedStore'
import { generateHighlights, type Highlight } from '@/lib/highlights'
import { shareWeeklyReportCard } from '@/lib/shareCard'
import { ShareCardWrapper } from '@/components/share/ShareCardWrapper'
import { WeeklyReportShareCard } from '@/components/share/WeeklyReportShareCard'
import { getAvatarStage } from '@/lib/avatarUtils'
import {
  Zap,
  Percent,
  Flame,
  Dumbbell,
  CheckCircle,
  Trophy,
  Beef,
  Calendar,
  Share2,
  X,
  Lock,
  type LucideIcon,
} from 'lucide-react'

interface WeeklyReportScreenProps {
  onClose: () => void
}

const ICON_MAP: Record<string, LucideIcon> = {
  Zap,
  Percent,
  Flame,
  Dumbbell,
  CheckCircle,
  Trophy,
  Beef,
  Calendar,
  Lock,
}

/**
 * Full-screen Weekly Protocol Report modal.
 * Shows weekly stats, rank progress, and auto-generated highlights.
 * Gold/obsidian styling matching RankUpShareCard aesthetic.
 */
export function WeeklyReportScreen({ onClose }: WeeklyReportScreenProps) {
  const getWeeklyStats = useWeeklyReportStore((state) => state.getWeeklyStats)
  const getRankInfo = useDPStore((state) => state.getRankInfo)
  const longestStreak = useDPStore((state) => state.longestObedienceStreak)
  const profile = useUserStore((state) => state.profile)
  const { activeProtocol, currentStreak: lockedStreak, totalDPEarned: lockedDPEarned } = useLockedStore()

  const [stats] = useState(() => getWeeklyStats())
  const [rankInfo] = useState(() => getRankInfo())
  const [highlights] = useState<Highlight[]>(() =>
    generateHighlights(stats, longestStreak, {
      isActive: !!activeProtocol,
      currentStreak: lockedStreak,
      totalDPEarned: lockedDPEarned,
    })
  )

  // Ref for off-screen share card
  const shareCardRef = useRef<HTMLDivElement>(null)

  // Mark report as shown when component mounts
  const markReportShown = useWeeklyReportStore((state) => state.markReportShown)
  useEffect(() => {
    markReportShown()
  }, [markReportShown])

  // Handle share button click
  const handleShare = async () => {
    if (!shareCardRef.current) return
    await shareWeeklyReportCard(
      shareCardRef.current,
      stats.dpEarned,
      stats.streak,
      rankInfo.name
    )
  }

  return (
    <>
      {/* Off-screen share card for capture */}
      <ShareCardWrapper cardRef={shareCardRef}>
        <WeeklyReportShareCard
          dpEarned={stats.dpEarned}
          compliancePercentage={stats.compliancePercentage}
          streak={stats.streak}
          workoutsCompleted={stats.workoutsCompleted}
          rankName={rankInfo.name}
          progress={rankInfo.progress}
          callsign={profile?.username || 'Recruit'}
          avatarStage={getAvatarStage(rankInfo.rank) as 1 | 2 | 3 | 4 | 5}
          archetype={profile?.archetype || 'bro'}
        />
      </ShareCardWrapper>

      <div className="fixed inset-0 z-50 bg-[#0A0A0A] overflow-y-auto">
        <div className="min-h-screen w-full max-w-[390px] mx-auto px-6 py-12 flex flex-col">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          {/* Chain-link crown SVG mark */}
          <svg
            width="64"
            height="48"
            viewBox="0 0 64 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mb-4"
          >
            {/* Crown with chain-link motif */}
            <path
              d="M32 4L38 16L50 12L46 28H18L14 12L26 16L32 4Z"
              fill="#C9A84C"
              stroke="#C9A84C"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Base of crown */}
            <rect x="16" y="28" width="32" height="6" fill="#C9A84C" rx="1" />
            {/* Chain links below crown */}
            <ellipse cx="24" cy="40" rx="4" ry="3" stroke="#C9A84C" strokeWidth="2" fill="none" />
            <ellipse cx="32" cy="40" rx="4" ry="3" stroke="#C9A84C" strokeWidth="2" fill="none" />
            <ellipse cx="40" cy="40" rx="4" ry="3" stroke="#C9A84C" strokeWidth="2" fill="none" />
          </svg>

          <h1
            className="font-oswald text-lg font-medium uppercase tracking-[0.25em] text-[#C9A84C] mb-2"
          >
            Weekly Protocol Report
          </h1>
        </div>

        {/* Stats Grid - 2x2 */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* DP Earned */}
          <div className="bg-[#1A1A1A] border border-[#C9A84C] rounded-lg p-4 flex flex-col items-center justify-center">
            <Zap className="text-[#C9A84C] mb-2" size={24} />
            <p className="font-jetbrains text-3xl font-bold text-white mb-1">
              {stats.dpEarned}
            </p>
            <p className="text-xs uppercase tracking-wider text-zinc-400">DP Earned</p>
          </div>

          {/* Compliance */}
          <div className="bg-[#1A1A1A] border border-[#C9A84C] rounded-lg p-4 flex flex-col items-center justify-center">
            <Percent className="text-[#C9A84C] mb-2" size={24} />
            <p className="font-jetbrains text-3xl font-bold text-white mb-1">
              {Math.round(stats.compliancePercentage)}%
            </p>
            <p className="text-xs uppercase tracking-wider text-zinc-400">Compliance</p>
          </div>

          {/* Streak */}
          <div className="bg-[#1A1A1A] border border-[#C9A84C] rounded-lg p-4 flex flex-col items-center justify-center">
            <Flame className="text-[#C9A84C] mb-2" size={24} />
            <p className="font-jetbrains text-3xl font-bold text-white mb-1">
              {stats.streak}
            </p>
            <p className="text-xs uppercase tracking-wider text-zinc-400">Days</p>
          </div>

          {/* Workouts */}
          <div className="bg-[#1A1A1A] border border-[#C9A84C] rounded-lg p-4 flex flex-col items-center justify-center">
            <Dumbbell className="text-[#C9A84C] mb-2" size={24} />
            <p className="font-jetbrains text-3xl font-bold text-white mb-1">
              {stats.workoutsCompleted}
            </p>
            <p className="text-xs uppercase tracking-wider text-zinc-400">Completed</p>
          </div>

          {/* LOCKED STREAK - only shows when protocol is active */}
          {activeProtocol && (
            <div className="col-span-2 bg-[#1A1A1A] border border-[#D4A853] rounded-lg p-4 flex items-center justify-center gap-4">
              <Lock className="text-[#D4A853]" size={24} />
              <div className="flex items-baseline gap-2">
                <p className="font-jetbrains text-3xl font-bold text-white">
                  {lockedStreak}
                </p>
                <p className="text-xs uppercase tracking-wider text-zinc-400">LOCKED STREAK</p>
              </div>
            </div>
          )}
        </div>

        {/* Rank Progress Section */}
        <div className="bg-[#1A1A1A] border border-[#C9A84C] rounded-lg p-6 mb-8">
          <p className="font-oswald text-4xl font-bold uppercase text-[#C9A84C] mb-4 text-center">
            {rankInfo.name}
          </p>

          {/* Progress bar */}
          <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-[#C9A84C] to-[#D4A853] transition-all duration-300"
              style={{ width: `${rankInfo.progress * 100}%` }}
            />
          </div>

          <p className="text-sm text-zinc-400 text-center">
            {rankInfo.dpForNext > 0
              ? `${rankInfo.dpForNext} DP to next rank`
              : 'Max Rank Achieved'}
          </p>
        </div>

        {/* Highlights Section */}
        <div className="mb-8">
          <h2 className="font-oswald text-xl font-semibold uppercase tracking-wider text-[#C9A84C] mb-4">
            Highlights
          </h2>
          <div className="space-y-3">
            {highlights.map((highlight, index) => {
              const IconComponent = ICON_MAP[highlight.icon] || Zap
              return (
                <div
                  key={index}
                  className="bg-[#1A1A1A] border border-[#C9A84C] rounded-lg p-4 flex items-start gap-3"
                >
                  <IconComponent className="text-[#C9A84C] flex-shrink-0 mt-0.5" size={20} />
                  <div className="flex-1">
                    <p className="font-semibold text-white mb-1">{highlight.title}</p>
                    <p className="text-sm text-zinc-400">{highlight.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer - Action buttons */}
        <div className="mt-auto pt-4 space-y-3">
          {/* Share Report button */}
          <button
            onClick={handleShare}
            className="w-full bg-[#C9A84C] text-[#0A0A0A] font-semibold py-4 px-6 rounded-lg flex items-center justify-center gap-2 hover:bg-[#D4A853] transition-colors"
          >
            <Share2 size={20} />
            <span>Share Report</span>
          </button>

          {/* Dismiss button */}
          <button
            onClick={onClose}
            className="w-full text-zinc-400 py-3 px-6 flex items-center justify-center gap-2 hover:text-white transition-colors"
          >
            <X size={20} />
            <span>Dismiss</span>
          </button>
        </div>
        </div>
      </div>
    </>
  )
}
