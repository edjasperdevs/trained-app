import { EvolvingAvatar } from '@/components'
import { useAvatarStore, useDPStore, useUserStore } from '@/stores'
import { cn } from '@/lib/cn'
import { getAvatarStage } from '@/lib/avatarUtils'
import { Dumbbell, Beef, Heart, TrendingUp, User, ChevronRight, LineChart, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Archetype } from '@/design/constants'

// Re-export for backwards compatibility
export { getAvatarStage }

// Archetype icons mapping
const archetypeIcons: Record<Archetype, typeof User> = {
  bro: User,
  himbo: Dumbbell,
  brute: Beef,
  pup: Heart,
  bull: TrendingUp,
}

// Archetype display info
const archetypeInfo: Record<Archetype, { name: string; tagline: string; bonus: string }> = {
  bro: { name: 'Bro', tagline: 'Balanced Discipline', bonus: 'No modifier' },
  himbo: { name: 'Himbo', tagline: 'Training Obsessed', bonus: '+50% Training DP' },
  brute: { name: 'Brute', tagline: 'Nutrition Machine', bonus: '+50% Protein DP' },
  pup: { name: 'Pup', tagline: 'Lifestyle Master', bonus: '+100% Steps/Sleep DP' },
  bull: { name: 'Bull', tagline: 'Consistency King', bonus: 'Streak Bonuses' },
}

export function AvatarScreen() {
  const navigate = useNavigate()
  const { currentMood } = useAvatarStore()
  const { currentRank, totalDP, obedienceStreak } = useDPStore()
  const rankInfo = useDPStore((s) => s.getRankInfo)()
  const archetype = useUserStore((s) => s.profile?.archetype ?? 'bro')

  const isMaxRank = currentRank >= 15
  const currentArchetype = archetypeInfo[archetype]
  const ArchetypeIcon = archetypeIcons[archetype]

  const moodLabels: Record<string, string> = {
    happy: 'Happy',
    neutral: 'Neutral',
    sad: 'Sad',
    hyped: 'Hyped',
    neglected: 'Neglected',
  }

  return (
    <div data-testid="avatar-screen" className="min-h-screen pb-24 bg-background text-foreground">
      {/* Header */}
      <div className="pt-14 pb-2 px-6">
        <h1 className="text-center text-lg font-heading uppercase tracking-[0.2em] text-primary">
          Your Champion
        </h1>
      </div>

      {/* Avatar Section - Large, dramatic display */}
      <div className="relative px-6 overflow-visible">
        {/* Multi-layer glow effect for Hades-style drama */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/8 blur-[100px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] bg-ember/15 blur-[60px] rounded-full" />

        <div className="relative z-10 flex flex-col items-center py-4">
          {/* Main Avatar - Large display matching mockup proportions */}
          <div className="relative" data-testid="avatar-display">
            <motion.div
              className="relative w-[280px] h-[280px] flex items-center justify-center"
              animate={{
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 4,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            >
              <EvolvingAvatar size="xl" />
            </motion.div>

            {/* Mood Badge - positioned bottom right */}
            <div className={cn(
              "absolute bottom-6 -right-2 px-3 py-1.5 rounded-full border backdrop-blur-sm",
              "text-[10px] font-bold uppercase tracking-widest",
              currentMood === 'hyped' && "text-primary border-primary/50 bg-primary/20 shadow-[0_0_15px_rgba(212,168,83,0.4)]",
              currentMood === 'happy' && "text-primary border-primary/30 bg-primary/10",
              currentMood === 'neutral' && "text-foreground border-border bg-surface-elevated/80",
              currentMood === 'sad' && "text-destructive border-destructive/30 bg-destructive/10",
              currentMood === 'neglected' && "text-gold-dim border-gold-dim/30 bg-gold-dim/10"
            )}>
              {moodLabels[currentMood]}
            </div>
          </div>
        </div>
      </div>

      {/* Stats and Cards Section */}
      <div className="px-6 space-y-3 relative z-10 mt-2">
        {/* Stats Grid - Rank (gold accent), Total DP, Streak */}
        <div className="grid grid-cols-3 gap-3">
          {/* Rank Card - Gold border accent */}
          <div className="bg-surface border-2 border-primary/60 rounded-xl p-3 text-center shadow-[0_0_20px_rgba(212,168,83,0.15)]">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-medium">
              Rank
            </p>
            <p className="text-base font-heading text-primary font-bold">
              {rankInfo.name}
            </p>
          </div>
          {/* Total DP Card */}
          <div className="bg-surface border border-border rounded-xl p-3 text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-medium">
              Total DP
            </p>
            <p className="text-base font-mono font-bold text-foreground">
              {totalDP.toLocaleString()}
            </p>
          </div>
          {/* Streak Card */}
          <div className="bg-surface border border-border rounded-xl p-3 text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-medium">
              Streak
            </p>
            <p className="text-base font-mono font-bold text-foreground">
              {obedienceStreak}d
            </p>
          </div>
        </div>

        {/* Rank Evolution Card */}
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-0.5">
                Rank Evolution
              </p>
              <h3 className="text-base font-heading font-bold text-foreground">{rankInfo.name}</h3>
            </div>
            <div className="text-right">
              {isMaxRank ? (
                <span className="text-[10px] bg-primary text-primary-foreground px-2 py-1 font-bold rounded uppercase tracking-wider">
                  Max Rank
                </span>
              ) : (
                <p className="text-xs font-mono font-medium text-primary">
                  NEXT: {Math.ceil(rankInfo.dpForNext).toLocaleString()} DP
                </p>
              )}
            </div>
          </div>
          {!isMaxRank && (
            <div className="space-y-1.5">
              <div className="relative h-2 w-full bg-background rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${rankInfo.progress * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground text-right font-mono">
                {Math.round(rankInfo.progress * 100)}%
              </p>
            </div>
          )}
        </div>

        {/* Archetype Card */}
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
            Archetype
          </p>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-surface-elevated border border-border flex items-center justify-center">
              <ArchetypeIcon size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-heading font-bold text-foreground uppercase">
                  {currentArchetype.name}
                </h3>
                <span className="text-[10px] font-mono text-primary">
                  {currentArchetype.bonus}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {currentArchetype.tagline}
              </p>
            </div>
          </div>
        </div>

        {/* View Progress Button */}
        <button
          onClick={() => navigate('/progress')}
          className="w-full bg-surface border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-colors group"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <LineChart size={20} className="text-primary" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-base font-heading font-bold text-foreground">
              View Progress
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Training volume, PRs, and heatmap
            </p>
          </div>
          <ChevronRight size={20} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </button>

        {/* Settings Button */}
        <button
          onClick={() => navigate('/settings')}
          className="w-full bg-surface border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-colors group"
        >
          <div className="w-10 h-10 rounded-lg bg-surface-elevated border border-border flex items-center justify-center">
            <Settings size={20} className="text-muted-foreground" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-base font-heading font-bold text-foreground">
              Settings
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Account, notifications, and preferences
            </p>
          </div>
          <ChevronRight size={20} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </button>
      </div>
    </div>
  )
}
