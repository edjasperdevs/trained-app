import { EvolvingAvatar } from '@/components'
import { useAvatarStore, useDPStore } from '@/stores'
import { LABELS } from '@/design/constants'
import { Card, CardContent } from '@/components/ui/card'
import { Zap, Shield, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/cn'

/** Map rank to avatar stage: ranks 1-3 -> stage 1, 4-7 -> stage 2, 8-11 -> stage 3, 12-14 -> stage 4, 15 -> stage 5 */
export function getAvatarStage(rank: number): number {
  if (rank >= 15) return 5
  if (rank >= 12) return 4
  if (rank >= 8) return 3
  if (rank >= 4) return 2
  return 1
}

export function AvatarScreen() {
  const { baseCharacter, currentMood } = useAvatarStore()
  const { currentRank, totalDP, obedienceStreak } = useDPStore()
  const rankInfo = useDPStore((s) => s.getRankInfo)()

  const isMaxRank = currentRank >= 15

  const moodColors = {
    happy: 'text-primary border-primary/20 bg-primary/5',
    neutral: 'text-white border-white/20 bg-white/5',
    sad: 'text-error border-error/20 bg-error/5',
    hyped: 'text-primary border-primary/40 bg-primary/10 shadow-[0_0_15px_rgba(200,255,0,0.2)]',
    neglected: 'text-warning border-warning/20 bg-warning/5',
  }

  const moodLabels = {
    happy: 'Compliant',
    neutral: 'Steady',
    sad: 'Flagging',
    hyped: 'Exemplary',
    neglected: 'Overdue',
  }

  return (
    <div data-testid="avatar-screen" className="min-h-screen pb-24 bg-[#0A0A0A] text-white selection:bg-primary/30">
      {/* Immersive Header & Avatar Section */}
      <div className="relative pt-14 pb-16 px-6 overflow-hidden">
        {/* Dramatic Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/20 blur-[100px] rounded-full" />

        <div className="relative z-10 flex flex-col items-center">
          <h1 className="text-3xl font-black tracking-tighter mb-12 italic">
            {LABELS.client} Protocol
          </h1>

          {/* Main Avatar Display with Ring Effect */}
          <div className="relative group cursor-default" data-testid="avatar-display">
            <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full scale-125 animate-pulse-slow opacity-50" />
            <div className="relative transition-all duration-700 ease-out group-hover:scale-105 active:scale-95">
              <EvolvingAvatar size="xl" />
            </div>

            {/* Mood Pulse Badge */}
            <div className={cn(
              "absolute -bottom-2 -right-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest backdrop-blur-md animate-in fade-in zoom-in duration-500",
              moodColors[currentMood]
            )}>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {moodLabels[currentMood]}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6 -mt-8 relative z-10">
        {/* High-Impact Metrics Grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: LABELS.level, value: currentRank.toString().padStart(2, '0'), accent: true },
            { label: 'Total DP', value: totalDP.toLocaleString() },
            { label: 'Streak', value: `${obedienceStreak}d` }
          ].map((stat, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-4 backdrop-blur-sm text-center">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-bold">
                {stat.label}
              </p>
              <p className={cn(
                "text-xl font-mono font-bold tracking-tighter",
                stat.accent ? "text-primary" : "text-white"
              )}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Rank Progress */}
        <Card className="bg-white/[0.03] border-white/[0.05] backdrop-blur-md overflow-hidden">
          <CardContent className="pt-6 pb-5">
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">Rank Evolution</p>
                <h3 className="text-lg font-black italic">{rankInfo.name}</h3>
              </div>
              <div className="text-right">
                {isMaxRank ? (
                  <span className="text-[10px] bg-primary text-black px-2 py-0.5 font-black rounded italic">MAX LEVEL</span>
                ) : (
                  <p className="text-[10px] font-mono font-bold text-primary">
                    NEXT: {Math.ceil(rankInfo.dpForNext).toLocaleString()} DP
                  </p>
                )}
              </div>
            </div>
            {!isMaxRank && (
              <div className="relative h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-primary transition-all duration-1000 ease-out"
                  style={{ width: `${rankInfo.progress * 100}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Archetype Role Section */}
        <Card className="bg-white/[0.03] border-white/[0.05] backdrop-blur-md">
          <CardContent className="py-6">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 bg-white/[0.05] border border-white/[0.1] flex items-center justify-center rounded-2xl shrink-0 shadow-inner">
                {baseCharacter === 'dominant' && <Shield size={28} className="text-destructive drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]" />}
                {baseCharacter === 'switch' && <TrendingUp size={28} className="text-primary drop-shadow-[0_0_8px_rgba(200,255,0,0.4)]" />}
                {baseCharacter === 'submissive' && <Zap size={28} className="text-warning drop-shadow-[0_0_8px_rgba(212,168,67,0.4)]" />}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Assigned Protocol</p>
                <h4 className="text-xl font-black mb-1 italic">
                  {LABELS.avatarClasses[baseCharacter]}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {baseCharacter === 'dominant' && 'Authority and absolute discipline. Your word is law.'}
                  {baseCharacter === 'switch' && 'Fluid adaptation and versatile mastery of all disciplines.'}
                  {baseCharacter === 'submissive' && 'Speed, agility, and absolute devotion to the protocol.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Motivational standing order */}
        <div className="pt-4 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-2">Current Standing Order</p>
          <p className="text-xs italic text-white/50 px-8 leading-relaxed font-medium">
            "Discipline is the bridge between goals and accomplishment. Compliance is the foundation of growth."
          </p>
        </div>
      </div>
    </div>
  )
}
