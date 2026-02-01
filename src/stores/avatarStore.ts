import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AvatarBase } from './userStore'

export type EvolutionStage = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
export type AvatarMood = 'happy' | 'neutral' | 'sad' | 'hyped' | 'neglected'

export interface EvolutionInfo {
  stage: EvolutionStage
  name: string
  levelRange: [number, number]
  description: string
  emoji: string
}

export const EVOLUTION_STAGES: EvolutionInfo[] = [
  { stage: 1, name: 'Hatchling', levelRange: [1, 5], description: 'Just starting out', emoji: '🥚' },
  { stage: 2, name: 'Newbie', levelRange: [6, 15], description: 'Finding your footing', emoji: '🐣' },
  { stage: 3, name: 'Beginner', levelRange: [16, 25], description: 'Starting to show definition', emoji: '🏃' },
  { stage: 4, name: 'Intermediate', levelRange: [26, 35], description: 'Clear muscle definition', emoji: '💪' },
  { stage: 5, name: 'Advanced', levelRange: [36, 45], description: 'Obviously fit', emoji: '🦾' },
  { stage: 6, name: 'Elite', levelRange: [46, 55], description: 'Impressive physique', emoji: '🔥' },
  { stage: 7, name: 'Champion', levelRange: [56, 65], description: 'Competition-ready', emoji: '🏆' },
  { stage: 8, name: 'Legend', levelRange: [66, 80], description: 'Peak natty', emoji: '⚡' },
  { stage: 9, name: 'Mythic', levelRange: [81, 95], description: 'Transcendent gains', emoji: '✨' },
  { stage: 10, name: 'Ascended', levelRange: [96, 99], description: 'Final form achieved', emoji: '👑' },
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
  return 10
}

const REACTION_MESSAGES = {
  checkIn: ['Great work! 💪', 'Keep grinding! 🔥', 'XP earned! ✨', 'Gains loading... 📈'],
  levelUp: ['LEVEL UP! 🎉', 'You\'re evolving! ⚡', 'New power unlocked! 🚀'],
  missedDay: ['I missed you... 😢', 'Come back soon! 🥺', 'Never miss twice! 💭'],
  streak: ['Streak fire! 🔥', 'Unstoppable! ⚡', 'Consistency is key! 🗝️'],
  claim: ['XP CLAIMED! 💰', 'Weekly gains secured! 🏆', 'Keep it up! 👊']
}

export const useAvatarStore = create<AvatarStore>()(
  persist(
    (set, get) => ({
      baseCharacter: 'warrior',
      evolutionStage: 1,
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
            recentReaction: 'EVOLUTION! 🌟'
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
        baseCharacter: 'warrior',
        evolutionStage: 1,
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
              baseCharacter: parsed.avatar.baseCharacter || 'warrior',
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
