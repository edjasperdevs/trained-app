import { EvolvingAvatar } from '@/components'
import { useAvatarStore, useDPStore, useUserStore } from '@/stores'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/cn'
import { getAvatarStage } from '@/lib/avatarUtils'
import { Settings, Dumbbell, Beef, Heart, TrendingUp, User } from 'lucide-react'
import { Link } from 'react-router-dom'
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
  const { currentMood } = useAvatarStore()
  const { currentRank, totalDP, obedienceStreak } = useDPStore()
  const rankInfo = useDPStore((s) => s.getRankInfo)()
  const archetype = useUserStore((s) => s.profile?.archetype ?? 'bro')

  const isMaxRank = currentRank >= 15
  const currentArchetype = archetypeInfo[archetype]
  const ArchetypeIcon = archetypeIcons[archetype]

  const moodColors = {
    happy: 'text-primary border-primary/30 bg-primary/10',
    neutral: 'text-foreground border-border bg-surface/50',
    sad: 'text-destructive border-destructive/30 bg-destructive/10',
    hyped: 'text-primary border-primary/50 bg-primary/15 shadow-[0_0_20px_rgba(212,168,83,0.3)]',
    neglected: 'text-gold-dim border-gold-dim/30 bg-gold-dim/10',
  }

  const moodLabels = {
    happy: 'Happy',
    neutral: 'Neutral',
    sad: 'Sad',
    hyped: 'Hyped',
    neglected: 'Neglected',
  }

  return (
    <div data-testid="avatar-screen" className="min-h-screen pb-24 bg-background text-foreground">
      {/* Header with Settings */}
      <div className="flex items-center justify-between px-6 pt-14 pb-4">
        <div className="w-10" /> {/* Spacer for centering */}
        <h1 className="text-lg font-heading uppercase tracking-[0.15em] text-primary">
          Your Champion
        </h1>
        <Link
          to="/settings"
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface transition-colors"
          aria-label="Settings"
        >
          <Settings size={20} className="text-muted-foreground" />
        </Link>
      </div>

      {/* Avatar Section */}
      <div className="relative px-6 pb-8 overflow-hidden">
        {/* Warm gold radial glow behind avatar */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[350px] h-[350px] bg-primary/15 blur-[120px] rounded-full" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Main Avatar Display */}
          <div className="relative" data-testid="avatar-display">
            <div className="relative">
              <EvolvingAvatar size="xl" />
            </div>

            {/* Mood Badge - positioned to the right */}
            <div className={cn(
              "absolute bottom-4 -right-4 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm",
              moodColors[currentMood]
            )}>
              {moodLabels[currentMood]}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-4 relative z-10">
        {/* Stats Grid - Rank, Total DP, Streak */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface border border-border rounded-xl p-4 text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-medium">
              Rank
            </p>
            <p className="text-lg font-heading text-primary">
              {rankInfo.name}
            </p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4 text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-medium">
              Total DP
            </p>
            <p className="text-lg font-mono font-bold text-foreground">
              {totalDP.toLocaleString()}
            </p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4 text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-medium">
              Streak
            </p>
            <p className="text-lg font-mono font-bold text-foreground">
              {obedienceStreak}d
            </p>
          </div>
        </div>

        {/* Rank Evolution Card */}
        <Card className="bg-surface border-border overflow-hidden">
          <CardContent className="pt-5 pb-4">
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
          </CardContent>
        </Card>

        {/* Archetype Card */}
        <Card className="bg-surface border-border overflow-hidden">
          <CardContent className="py-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
              Archetype
            </p>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <ArchetypeIcon size={20} className="text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-heading font-bold text-foreground uppercase">
                    {currentArchetype.name}
                  </h3>
                  <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {currentArchetype.bonus}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currentArchetype.tagline}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
