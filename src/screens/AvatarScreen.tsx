import { motion } from 'framer-motion'
import { Avatar, Card, ProgressBar } from '@/components'
import { useAvatarStore, useXPStore, EVOLUTION_STAGES } from '@/stores'
import { useTheme } from '@/themes'
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
  const { theme, themeId } = useTheme()
  const isTrained = themeId === 'trained'

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

  // Get the avatar stage name from theme
  const currentStageName = theme.avatarStages[evolutionStage - 1] || currentEvolution.name
  const nextStageName = nextEvolution ? (theme.avatarStages[nextEvolution.stage - 1] || nextEvolution.name) : null

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      {/* Header */}
      <div className={`pt-8 pb-12 px-4 ${isTrained ? 'bg-surface' : 'bg-gradient-to-b from-bg-secondary to-bg-primary'}`}>
        <h1 className={`text-2xl font-bold mb-6 text-center ${isTrained ? 'font-heading uppercase tracking-wide' : ''}`}>
          {isTrained ? 'Your Status' : 'Your Avatar'}
        </h1>

        {/* Main Avatar Display */}
        <div className="flex justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
          >
            <Avatar size="xl" showMood showLevel level={currentLevel} />
          </motion.div>
        </div>
      </div>

      <div className="px-4 space-y-6 -mt-4">
        {/* Current Stats */}
        <Card>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold font-mono text-primary">{currentLevel}</p>
              <p className={`text-xs text-text-secondary ${isTrained ? 'uppercase tracking-wider' : ''}`}>
                {theme.labels.level}
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold font-mono">{evolutionStage}</p>
              <p className={`text-xs text-text-secondary ${isTrained ? 'uppercase tracking-wider' : ''}`}>
                {isTrained ? 'Stage' : 'Evolution'}
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold font-mono text-secondary">
                {totalXP.toLocaleString()}
              </p>
              <p className={`text-xs text-text-secondary ${isTrained ? 'uppercase tracking-wider' : ''}`}>
                Total {theme.labels.xp}
              </p>
            </div>
          </div>
        </Card>

        {/* Current Evolution */}
        <Card>
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-16 h-16 bg-surface-elevated flex items-center justify-center ${isTrained ? 'rounded-lg' : 'rounded-full'}`}>
              <StageIcon iconName={currentEvolution.emoji} size={32} className="text-primary" />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${isTrained ? 'font-heading uppercase tracking-wide' : ''}`}>
                {currentStageName}
              </h3>
              <p className="text-sm text-text-secondary">{currentEvolution.description}</p>
              <p className="text-xs text-text-secondary">
                {theme.labels.level}s {currentEvolution.levelRange[0]} - {currentEvolution.levelRange[1]}
              </p>
            </div>
          </div>

          {/* Evolution Progress */}
          {nextEvolution && (
            <div>
              <div className="flex justify-between text-xs text-text-secondary mb-2">
                <span>Progress to {nextStageName}</span>
                <span className="font-mono">{Math.round(evolutionProgress)}%</span>
              </div>
              <ProgressBar progress={evolutionProgress} color={isTrained ? 'primary' : 'gradient'} size="md" />
              <p className="text-xs text-text-secondary mt-2">
                Reach {theme.labels.level} {nextEvolution.levelRange[0]} to {isTrained ? 'advance' : 'evolve'}
              </p>
            </div>
          )}

          {!nextEvolution && (
            <div className={`text-center py-4 bg-warning/10 border border-warning/20 ${isTrained ? 'rounded' : 'rounded-lg'}`}>
              <Crown size={32} className="mx-auto text-warning" />
              <p className={`text-warning font-bold mt-2 ${isTrained ? 'font-heading uppercase tracking-wide' : ''}`}>
                {isTrained ? 'Maximum Status Achieved.' : 'Maximum Evolution Achieved!'}
              </p>
            </div>
          )}
        </Card>

        {/* Character Info */}
        <Card>
          <h3 className={`text-sm font-semibold text-text-secondary mb-4 ${isTrained ? 'uppercase tracking-wider font-heading' : ''}`}>
            {isTrained ? 'ROLE' : 'CHARACTER CLASS'}
          </h3>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 bg-surface-elevated flex items-center justify-center ${isTrained ? 'rounded' : 'rounded-lg'}`}>
              {baseCharacter === 'warrior' && <Sword size={24} className="text-red-400" />}
              {baseCharacter === 'mage' && <Sparkles size={24} className="text-purple-400" />}
              {baseCharacter === 'rogue' && <Zap size={24} className="text-yellow-400" />}
            </div>
            <div>
              <p className={`font-bold ${isTrained ? 'font-heading uppercase tracking-wide' : 'capitalize'}`}>
                {theme.labels.avatarClasses[baseCharacter]}
              </p>
              <p className="text-sm text-text-secondary">
                {baseCharacter === 'warrior' && 'Strength and discipline'}
                {baseCharacter === 'mage' && 'Knowledge and power'}
                {baseCharacter === 'rogue' && 'Speed and agility'}
              </p>
            </div>
          </div>
        </Card>

        {/* Evolution Timeline */}
        <Card>
          <h3 className={`text-sm font-semibold text-text-secondary mb-4 ${isTrained ? 'uppercase tracking-wider font-heading' : ''}`}>
            {isTrained ? 'PROGRESSION PATH' : 'EVOLUTION TIMELINE'}
          </h3>
          <div className="space-y-3">
            {EVOLUTION_STAGES.map((stage, index) => {
              const isUnlocked = currentLevel >= stage.levelRange[0]
              const isCurrent = stage.stage === evolutionStage
              const isNext = stage.stage === evolutionStage + 1
              const stageName = theme.avatarStages[stage.stage - 1] || stage.name

              return (
                <motion.div
                  key={stage.stage}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    flex items-center gap-3 p-2
                    ${isTrained ? 'rounded' : 'rounded-lg'}
                    ${isCurrent ? 'bg-primary/10 border border-primary/30' : ''}
                    ${isNext ? 'bg-secondary/10 border border-secondary/30' : ''}
                    ${!isUnlocked && !isNext ? 'opacity-40' : ''}
                  `}
                >
                  <div className={`
                    w-10 h-10 flex items-center justify-center
                    ${isTrained ? 'rounded' : 'rounded-full'}
                    ${isUnlocked ? 'bg-surface-elevated' : 'bg-surface'}
                  `}>
                    {isUnlocked ? (
                      <StageIcon iconName={stage.emoji} size={20} className={isCurrent ? 'text-primary' : 'text-text-secondary'} />
                    ) : (
                      <Lock size={16} className="text-text-secondary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold ${isCurrent ? 'text-primary' : ''} ${isTrained ? 'font-heading uppercase tracking-wide text-sm' : ''}`}>
                        {stageName}
                      </p>
                      {isCurrent && (
                        <span className={`text-xs bg-primary/20 text-primary px-2 py-0.5 ${isTrained ? 'rounded' : 'rounded'}`}>
                          Current
                        </span>
                      )}
                      {isNext && (
                        <span className={`text-xs bg-secondary/20 text-secondary px-2 py-0.5 ${isTrained ? 'rounded' : 'rounded'}`}>
                          Next
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary">
                      {theme.labels.level} {stage.levelRange[0]} - {stage.levelRange[1]}
                    </p>
                  </div>
                  {isUnlocked && (
                    <Check size={16} className="text-success" />
                  )}
                </motion.div>
              )
            })}
          </div>
        </Card>

        {/* Mood */}
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">{isTrained ? 'Current State' : 'Current Mood'}</span>
            <span className={`capitalize font-semibold ${isTrained ? 'font-heading uppercase tracking-wide text-sm' : ''}`}>
              {currentMood === 'happy' && (isTrained ? 'Compliant' : 'Happy')}
              {currentMood === 'neutral' && (isTrained ? 'Steady' : 'Neutral')}
              {currentMood === 'sad' && (isTrained ? 'Flagging' : 'Sad')}
              {currentMood === 'hyped' && (isTrained ? 'Exemplary' : 'Hyped')}
              {currentMood === 'neglected' && (isTrained ? 'Overdue' : 'Neglected')}
            </span>
          </div>
        </Card>
      </div>
    </div>
  )
}
