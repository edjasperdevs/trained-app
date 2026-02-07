import { Avatar } from '@/components'
import { useAvatarStore, useXPStore, EVOLUTION_STAGES } from '@/stores'
import { LABELS, AVATAR_STAGES } from '@/design/constants'
import { cn } from '@/lib/cn'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Circle, Zap, Sprout, Footprints, Dumbbell, Sword, Shield, Flame,
  Trophy, Sparkles, Star, Crown, Lock, Check, LucideIcon
} from 'lucide-react'

// Map icon names to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  Circle, Zap, Sprout, Footprints, Dumbbell, Sword, Shield, Flame,
  Trophy, Bolt: Zap, Sparkles, Star, Crown
}

// Helper to render stage icon
function StageIcon({ iconName, size = 24, className = '' }: { iconName: string; size?: number; className?: string }) {
  const IconComponent = ICON_MAP[iconName] || Circle
  return <IconComponent size={size} className={className} />
}

export function AvatarScreen() {
  const {
    baseCharacter,
    evolutionStage,
    currentMood,
    getEvolutionInfo,
    getNextEvolutionInfo,
    getProgressToNextEvolution
  } = useAvatarStore()

  const { currentLevel, totalXP } = useXPStore()

  const currentEvolution = getEvolutionInfo()
  const nextEvolution = getNextEvolutionInfo()
  const evolutionProgress = getProgressToNextEvolution(currentLevel)

  // Get the avatar stage name from constants
  const currentStageName = AVATAR_STAGES[evolutionStage - 1] || currentEvolution.name
  const nextStageName = nextEvolution ? (AVATAR_STAGES[nextEvolution.stage - 1] || nextEvolution.name) : null

  return (
    <div data-testid="avatar-screen" className="min-h-screen pb-20">
      {/* Header */}
      <div className="pt-8 pb-12 px-5 bg-card">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Your Status
        </h1>

        {/* Main Avatar Display */}
        <div className="flex justify-center animate-in zoom-in-90 fade-in duration-500 delay-100" data-testid="avatar-display">
          <Avatar size="xl" showMood showLevel level={currentLevel} />
        </div>
      </div>

      <div className="px-5 space-y-4 -mt-4">
        {/* Current Stats */}
        <Card>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold font-mono text-primary">{currentLevel}</p>
                <p className="text-xs text-muted-foreground">
                  {LABELS.level}
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold font-mono">{evolutionStage}</p>
                <p className="text-xs text-muted-foreground">
                  Stage
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold font-mono text-muted-foreground">
                  {totalXP.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total {LABELS.xp}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Evolution */}
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-muted flex items-center justify-center rounded-lg">
                <StageIcon iconName={currentEvolution.emoji} size={32} className="text-primary" />
              </div>
              <div data-testid="avatar-stage">
                <h3 className="text-xl font-bold">
                  {currentStageName}
                </h3>
                <p className="text-sm text-muted-foreground">{currentEvolution.description}</p>
                <p className="text-xs text-muted-foreground">
                  {LABELS.level}s {currentEvolution.levelRange[0]} - {currentEvolution.levelRange[1]}
                </p>
              </div>
            </div>

            {/* Evolution Progress */}
            {nextEvolution && (
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>Progress to {nextStageName}</span>
                  <span className="font-mono">{Math.round(evolutionProgress)}%</span>
                </div>
                <Progress value={evolutionProgress} />
                <p className="text-xs text-muted-foreground mt-2">
                  Reach {LABELS.level} {nextEvolution.levelRange[0]} to advance
                </p>
              </div>
            )}

            {!nextEvolution && (
              <div className="text-center py-4 bg-warning/10 border border-warning/20 rounded-lg">
                <Crown size={32} className="mx-auto text-warning" />
                <p className="text-warning font-bold mt-2">
                  Maximum Status Achieved.
                </p>
              </div>
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

        {/* Evolution Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Progression Path</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {EVOLUTION_STAGES.map((stage, index) => {
              const isUnlocked = currentLevel >= stage.levelRange[0]
              const isCurrent = stage.stage === evolutionStage
              const isNext = stage.stage === evolutionStage + 1
              const stageName = AVATAR_STAGES[stage.stage - 1] || stage.name

              return (
                <div
                  key={stage.stage}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-lg animate-in fade-in slide-in-from-left-4 duration-300',
                    isCurrent && 'bg-primary/10 border border-primary/30',
                    isNext && 'bg-secondary/10 border border-secondary/30',
                    !isUnlocked && !isNext && 'opacity-40'
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={cn(
                    'w-10 h-10 flex items-center justify-center rounded-lg',
                    isUnlocked ? 'bg-muted' : 'bg-card'
                  )}>
                    {isUnlocked ? (
                      <StageIcon iconName={stage.emoji} size={20} className={isCurrent ? 'text-primary' : 'text-muted-foreground'} />
                    ) : (
                      <Lock size={16} className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={cn('font-semibold text-sm', isCurrent && 'text-primary')}>
                        {stageName}
                      </p>
                      {isCurrent && (
                        <Badge variant="default" className="text-xs">Current</Badge>
                      )}
                      {isNext && (
                        <Badge variant="secondary" className="text-xs">Next</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {LABELS.level} {stage.levelRange[0]} - {stage.levelRange[1]}
                    </p>
                  </div>
                  {isUnlocked && (
                    <Check size={16} className="text-success" />
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Mood */}
        <Card data-testid="avatar-mood">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current State</span>
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
