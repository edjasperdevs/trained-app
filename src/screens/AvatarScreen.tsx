import { motion } from 'framer-motion'
import { Avatar, Card, ProgressBar } from '@/components'
import { useAvatarStore, useXPStore, EVOLUTION_STAGES } from '@/stores'

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

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-bg-secondary to-bg-primary pt-8 pb-12 px-4">
        <h1 className="text-2xl font-bold mb-6 text-center">Your Avatar</h1>

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
              <p className="text-3xl font-bold font-digital text-accent-primary">{currentLevel}</p>
              <p className="text-xs text-gray-500">Level</p>
            </div>
            <div>
              <p className="text-3xl font-bold font-digital">{evolutionStage}</p>
              <p className="text-xs text-gray-500">Evolution</p>
            </div>
            <div>
              <p className="text-3xl font-bold font-digital text-accent-secondary">
                {totalXP.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Total XP</p>
            </div>
          </div>
        </Card>

        {/* Current Evolution */}
        <Card>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center text-4xl">
              {currentEvolution.emoji}
            </div>
            <div>
              <h3 className="text-xl font-bold">{currentEvolution.name}</h3>
              <p className="text-sm text-gray-400">{currentEvolution.description}</p>
              <p className="text-xs text-gray-500">
                Levels {currentEvolution.levelRange[0]} - {currentEvolution.levelRange[1]}
              </p>
            </div>
          </div>

          {/* Evolution Progress */}
          {nextEvolution && (
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>Progress to {nextEvolution.name}</span>
                <span className="font-digital">{Math.round(evolutionProgress)}%</span>
              </div>
              <ProgressBar progress={evolutionProgress} color="gradient" size="md" />
              <p className="text-xs text-gray-500 mt-2">
                Reach Level {nextEvolution.levelRange[0]} to evolve
              </p>
            </div>
          )}

          {!nextEvolution && (
            <div className="text-center py-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <span className="text-2xl">👑</span>
              <p className="text-yellow-400 font-bold mt-2">Maximum Evolution Achieved!</p>
            </div>
          )}
        </Card>

        {/* Character Info */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-400 mb-4">CHARACTER CLASS</h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-bg-secondary rounded-lg flex items-center justify-center text-2xl">
              {baseCharacter === 'warrior' ? '⚔️' : baseCharacter === 'mage' ? '🔮' : '🌙'}
            </div>
            <div>
              <p className="font-bold capitalize">{baseCharacter}</p>
              <p className="text-sm text-gray-500">
                {baseCharacter === 'warrior' && 'Strength and discipline'}
                {baseCharacter === 'mage' && 'Knowledge and power'}
                {baseCharacter === 'rogue' && 'Speed and agility'}
              </p>
            </div>
          </div>
        </Card>

        {/* Evolution Timeline */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-400 mb-4">EVOLUTION TIMELINE</h3>
          <div className="space-y-3">
            {EVOLUTION_STAGES.map((stage, index) => {
              const isUnlocked = currentLevel >= stage.levelRange[0]
              const isCurrent = stage.stage === evolutionStage
              const isNext = stage.stage === evolutionStage + 1

              return (
                <motion.div
                  key={stage.stage}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    flex items-center gap-3 p-2 rounded-lg
                    ${isCurrent ? 'bg-accent-primary/10 border border-accent-primary/30' : ''}
                    ${isNext ? 'bg-accent-secondary/10 border border-accent-secondary/30' : ''}
                    ${!isUnlocked && !isNext ? 'opacity-40' : ''}
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-xl
                    ${isUnlocked ? 'bg-bg-secondary' : 'bg-bg-card'}
                  `}>
                    {isUnlocked ? stage.emoji : '🔒'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold ${isCurrent ? 'text-accent-primary' : ''}`}>
                        {stage.name}
                      </p>
                      {isCurrent && (
                        <span className="text-xs bg-accent-primary/20 text-accent-primary px-2 py-0.5 rounded">
                          Current
                        </span>
                      )}
                      {isNext && (
                        <span className="text-xs bg-accent-secondary/20 text-accent-secondary px-2 py-0.5 rounded">
                          Next
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Lv. {stage.levelRange[0]} - {stage.levelRange[1]}
                    </p>
                  </div>
                  {isUnlocked && (
                    <span className="text-accent-success">✓</span>
                  )}
                </motion.div>
              )
            })}
          </div>
        </Card>

        {/* Mood */}
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Current Mood</span>
            <span className="capitalize font-semibold">
              {currentMood === 'happy' && '😊 Happy'}
              {currentMood === 'neutral' && '😐 Neutral'}
              {currentMood === 'sad' && '😢 Sad'}
              {currentMood === 'hyped' && '🤩 Hyped'}
              {currentMood === 'neglected' && '😔 Neglected'}
            </span>
          </div>
        </Card>
      </div>
    </div>
  )
}
