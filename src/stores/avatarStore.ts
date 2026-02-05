import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AvatarBase } from './userStore'

export type EvolutionStage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
export type AvatarMood = 'happy' | 'neutral' | 'sad' | 'hyped' | 'neglected'

export interface EvolutionInfo {
  stage: EvolutionStage
  name: string
  levelRange: [number, number]
  description: string
  emoji: string
}

// More stages early = more frequent dopamine hits
// Stage 0: Before onboarding (Level 0)
// Stage 1: After onboarding (Level 1) - first evolution!
// Stage 2-4: Rapid early progression (Levels 2-6)
// Stage 5+: Slower progression
export const EVOLUTION_STAGES: EvolutionInfo[] = [
  { stage: 0, name: 'Egg', levelRange: [0, 0], description: 'Waiting to hatch...', emoji: 'Circle' },
  { stage: 1, name: 'Hatchling', levelRange: [1, 1], description: 'Just hatched!', emoji: 'Zap' },
  { stage: 2, name: 'Sprout', levelRange: [2, 3], description: 'Starting to grow', emoji: 'Sprout' },
  { stage: 3, name: 'Rookie', levelRange: [4, 5], description: 'Finding your footing', emoji: 'Footprints' },
  { stage: 4, name: 'Contender', levelRange: [6, 8], description: 'Building momentum', emoji: 'Dumbbell' },
  { stage: 5, name: 'Warrior', levelRange: [9, 12], description: 'Gaining strength', emoji: 'Sword' },
  { stage: 6, name: 'Veteran', levelRange: [13, 18], description: 'Clear definition', emoji: 'Shield' },
  { stage: 7, name: 'Elite', levelRange: [19, 25], description: 'Impressive physique', emoji: 'Flame' },
  { stage: 8, name: 'Champion', levelRange: [26, 35], description: 'Competition-ready', emoji: 'Trophy' },
  { stage: 9, name: 'Legend', levelRange: [36, 50], description: 'Peak performance', emoji: 'Bolt' },
  { stage: 10, name: 'Mythic', levelRange: [51, 70], description: 'Transcendent gains', emoji: 'Sparkles' },
  { stage: 11, name: 'Titan', levelRange: [71, 90], description: 'Beyond limits', emoji: 'Star' },
  { stage: 12, name: 'Ascended', levelRange: [91, 99], description: 'Final form achieved', emoji: 'Crown' },
]

interface AvatarStore {
  baseCharacter: AvatarBase
  evolutionStage: EvolutionStage
  currentMood: AvatarMood
  accessories: string[]
  lastInteraction: number
  recentReaction: string | null

  // Actions
  setBaseCharacter: (base: AvatarBase) => void
  updateEvolutionStage: (level: number) => { evolved: boolean; newStage: EvolutionStage; oldStage: EvolutionStage }
  setMood: (mood: AvatarMood) => void
  triggerReaction: (type: 'checkIn' | 'levelUp' | 'missedDay' | 'streak' | 'claim') => void
  checkNeglected: () => void
  getEvolutionInfo: () => EvolutionInfo
  getNextEvolutionInfo: () => EvolutionInfo | null
  getProgressToNextEvolution: (level: number) => number
  resetAvatar: () => void
  exportData: () => string
  importData: (data: string) => boolean
}

const getStageForLevel = (level: number): EvolutionStage => {
  for (const stage of EVOLUTION_STAGES) {
    if (level >= stage.levelRange[0] && level <= stage.levelRange[1]) {
      return stage.stage
    }
  }
  return 12 // Max stage
}

const REACTION_MESSAGES = {
  checkIn: ['Logged.', 'Noted.', 'Recorded.', 'Progress tracked.'],
  levelUp: ['Rank up.', 'Advancement unlocked.', 'New level achieved.'],
  missedDay: ['Missed day noted.', 'Return when ready.', 'Resume protocol.'],
  streak: ['Streak continues.', 'Consistency maintained.', 'Protocol followed.'],
  claim: ['Claimed.', 'Reward secured.', 'Points transferred.']
}

export const useAvatarStore = create<AvatarStore>()(
  persist(
    (set, get) => ({
      baseCharacter: 'dominant',
      evolutionStage: 0,
      currentMood: 'neutral',
      accessories: [],
      lastInteraction: Date.now(),
      recentReaction: null,

      setBaseCharacter: (base) => set({ baseCharacter: base }),

      updateEvolutionStage: (level: number) => {
        const oldStage = get().evolutionStage
        const newStage = getStageForLevel(level)
        const evolved = newStage > oldStage

        if (evolved) {
          set({
            evolutionStage: newStage,
            currentMood: 'hyped',
            recentReaction: 'Stage advanced.'
          })
        }

        return { evolved, newStage, oldStage }
      },

      setMood: (mood) => set({ currentMood: mood, lastInteraction: Date.now() }),

      triggerReaction: (type) => {
        const messages = REACTION_MESSAGES[type]
        const message = messages[Math.floor(Math.random() * messages.length)]

        let newMood: AvatarMood = 'happy'
        if (type === 'missedDay') newMood = 'sad'
        if (type === 'levelUp' || type === 'claim') newMood = 'hyped'

        set({
          currentMood: newMood,
          recentReaction: message,
          lastInteraction: Date.now()
        })

        // Clear reaction after 3 seconds
        setTimeout(() => {
          set({ recentReaction: null })
        }, 3000)
      },

      checkNeglected: () => {
        const lastInteraction = get().lastInteraction
        const now = Date.now()
        const daysSinceInteraction = (now - lastInteraction) / (1000 * 60 * 60 * 24)

        if (daysSinceInteraction >= 3) {
          set({ currentMood: 'neglected' })
        }
      },

      getEvolutionInfo: () => {
        const stage = get().evolutionStage
        return EVOLUTION_STAGES.find(e => e.stage === stage) || EVOLUTION_STAGES[0]
      },

      getNextEvolutionInfo: () => {
        const stage = get().evolutionStage
        if (stage >= 10) return null
        return EVOLUTION_STAGES.find(e => e.stage === stage + 1) || null
      },

      getProgressToNextEvolution: (level: number) => {
        const currentInfo = EVOLUTION_STAGES.find(e =>
          level >= e.levelRange[0] && level <= e.levelRange[1]
        )

        if (!currentInfo || currentInfo.stage === 10) return 100

        const rangeStart = currentInfo.levelRange[0]
        const rangeEnd = currentInfo.levelRange[1]
        const progress = ((level - rangeStart) / (rangeEnd - rangeStart + 1)) * 100

        return Math.min(progress, 100)
      },

      resetAvatar: () => set({
        baseCharacter: 'dominant',
        evolutionStage: 0,
        currentMood: 'neutral',
        accessories: [],
        lastInteraction: Date.now(),
        recentReaction: null
      }),

      exportData: () => {
        const state = get()
        return JSON.stringify({
          avatar: {
            baseCharacter: state.baseCharacter,
            evolutionStage: state.evolutionStage,
            currentMood: state.currentMood,
            accessories: state.accessories,
            lastInteraction: state.lastInteraction
          }
        }, null, 2)
      },

      importData: (data: string) => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.avatar) {
            set({
              baseCharacter: parsed.avatar.baseCharacter || 'dominant',
              evolutionStage: parsed.avatar.evolutionStage || 1,
              currentMood: parsed.avatar.currentMood || 'neutral',
              accessories: parsed.avatar.accessories || [],
              lastInteraction: parsed.avatar.lastInteraction || Date.now()
            })
            return true
          }
          return false
        } catch {
          return false
        }
      }
    }),
    {
      name: 'gamify-gains-avatar',
    }
  )
)
