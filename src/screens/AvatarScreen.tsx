import { EvolvingAvatar } from '@/components'
import { useAvatarStore, useDPStore } from '@/stores'
import { LABELS } from '@/design/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Sword, Sparkles, Zap, Flame } from 'lucide-react'

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

  return (
    <div data-testid="avatar-screen" className="min-h-screen pb-20">
      {/* Header */}
      <div className="pt-8 pb-12 px-5 bg-card">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Your Status
        </h1>

        {/* Main Avatar Display */}
        <div className="flex justify-center animate-in zoom-in-90 fade-in duration-500 delay-100" data-testid="avatar-display">
          <div className="transition-all duration-500 ease-out">
            <EvolvingAvatar size="xl" />
          </div>
        </div>
      </div>

      <div className="px-5 space-y-4 -mt-4">
        {/* Current Stats */}
        <Card>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold font-mono text-primary">{currentRank}</p>
                <p className="text-xs text-muted-foreground">
                  {LABELS.level}
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold font-mono">
                  {totalDP.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total {LABELS.xp}
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold font-mono text-muted-foreground">
                  {obedienceStreak}
                </p>
                <p className="text-xs text-muted-foreground">
                  Streak
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rank Progress */}
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold">{LABELS.level} {currentRank}</span>
                <span className="text-xs text-muted-foreground ml-2">{rankInfo.name}</span>
              </div>
              {isMaxRank && (
                <span className="text-xs bg-primary-muted text-primary px-2 py-0.5 font-semibold rounded">
                  MAX
                </span>
              )}
            </div>
            {!isMaxRank && (
              <>
                <Progress value={rankInfo.progress * 100} />
                <p className="text-xs text-muted-foreground">
                  {rankInfo.dpForNext.toLocaleString()} {LABELS.xp} to next rank
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Character Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-muted flex items-center justify-center rounded-lg">
                {baseCharacter === 'dominant' && <Sword size={24} className="text-destructive" />}
                {baseCharacter === 'switch' && <Sparkles size={24} className="text-primary" />}
                {baseCharacter === 'submissive' && <Zap size={24} className="text-warning" />}
              </div>
              <div>
                <p className="font-bold">
                  {LABELS.avatarClasses[baseCharacter]}
                </p>
                <p className="text-sm text-muted-foreground">
                  {baseCharacter === 'dominant' && 'Strength and discipline'}
                  {baseCharacter === 'switch' && 'Knowledge and power'}
                  {baseCharacter === 'submissive' && 'Speed and agility'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mood */}
        <Card data-testid="avatar-mood">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame size={16} className="text-muted-foreground" />
                <span className="text-muted-foreground">Current State</span>
              </div>
              <span className="capitalize font-semibold text-sm">
                {currentMood === 'happy' && 'Compliant'}
                {currentMood === 'neutral' && 'Steady'}
                {currentMood === 'sad' && 'Flagging'}
                {currentMood === 'hyped' && 'Exemplary'}
                {currentMood === 'neglected' && 'Overdue'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
